"""Synthetic-only tests for real local STEP intake. No Holybro CAD bytes in CI."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import x500_source_intake_v27 as intake


def synthetic_step(path,content=b"synthetic solids only"):
    path.write_bytes(
        b"ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('SYNTHETIC UNIT TEST'),'2;1');\nENDSEC;\n"
        b"DATA;\n#1=FAKE_TEST_RECORD('" + content + b"');\nENDSEC;\nEND-ISO-10303-21;\n")
    return hashlib.sha256(path.read_bytes()).hexdigest()


class TestGenuineIntakeContracts(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)
        self.frame=self.path/"x500v2-frame.step"
        self.motor=self.path/"AIR2216II_Motor_3D.STEP"
        self.fsha=synthetic_step(self.frame,b"FRAME")
        self.msha=synthetic_step(self.motor,b"MOTOR")
        self.lic="Redistribution has NOT been established for manufacturer source geometry."

    def call_preflight(self,**kwargs):
        args=dict(frame=self.frame,motor=self.motor,
                  frame_sha=self.fsha,motor_sha=self.msha,
                  frame_revision="SYNTHETIC_FRAME_FIXTURE",
                  motor_revision="SYNTHETIC_MOTOR_FIXTURE",
                  license_note=self.lic)
        args.update(kwargs)
        return intake.preflight(**args)

    def test_valid_two_source_byte_check_is_explicitly_not_authenticated(self):
        r=self.call_preflight()
        self.assertEqual(r["schema"],intake.INTAKE_SCHEMA)
        self.assertEqual(r["files"]["frame"]["sha256"],self.fsha)
        self.assertEqual(r["files"]["motor"]["sha256"],self.msha)
        self.assertTrue(r["files"]["motor"]["stepEnvelopeRecognized"])
        self.assertFalse(r["files"]["frame"]["unitsIndependentlyVerified"])
        self.assertFalse(r["manufacturerIdentityVerified"])
        self.assertFalse(r["physicalFitQualified"])
        self.assertFalse(r["flightApproved"])
        self.assertFalse(r["files"]["frame"]["redistributionAuthorized"])

    def test_not_file_wrong_name_and_bad_sha_fail_closed(self):
        with self.assertRaisesRegex(ValueError,"SHA-256|hash mismatch"):
            self.call_preflight(motor_sha="0"*64)
        with self.assertRaisesRegex(ValueError,"filename"):
            self.call_preflight(frame=self.motor)
        with self.assertRaisesRegex(ValueError,"regular"):
            self.call_preflight(frame=self.path/"missing.step")

    def test_html_zip_or_truncated_step_never_passes(self):
        for content in [b"<html>Login</html>",b"PK\x03\x04archive",
                        b"ISO-10303-21;\nHEADER;\nENDSEC;\nDATA;\n"]:
            self.motor.write_bytes(content)
            current=hashlib.sha256(content).hexdigest()
            with self.assertRaisesRegex(ValueError,"STEP"):
                self.call_preflight(motor_sha=current)

    def test_symlinks_and_unspecified_revision_are_rejected(self):
        link=self.path/"other.step"
        link.symlink_to(self.frame)
        with self.assertRaises(ValueError):
            self.call_preflight(frame=link)
        with self.assertRaisesRegex(ValueError,"invent"):
            self.call_preflight(frame_revision="unknown")
        with self.assertRaises(ValueError):
            self.call_preflight(license_note="None")

    def test_successful_staged_two_package_promotion_has_no_private_step_copies(self):
        src=self.call_preflight()
        dest=self.path/"derived" / "x500-pair"
        def fake_converter(source,glb,**kwargs):
            glb.write_bytes(b"glTF"+b"x"*40)
            payload={"source":{"sha256":kwargs["expected_sha"],
                    "fileName":source.name},
                     "mesh":{"fileName":glb.name,
                             "sha256":hashlib.sha256(glb.read_bytes()).hexdigest()},
                     "qualification":{"manufacturerAuthenticated":False,"flightReady":False},
                     "conversion":{"solidCount":2,"triangleCount":12,
                            "sourceAabbKernelMm":{"min":[0,0,0],"max":[5,5,5]}}}
            manifest=glb.with_suffix(".visual-package.json")
            manifest.write_text(json.dumps(payload))
            return manifest
        with patch.object(intake,"convert",side_effect=fake_converter):
            result=intake.convert_pair(self.frame,self.motor,src,dest,self.lic)
        self.assertTrue(dest.is_dir())
        self.assertEqual(len(list(dest.glob("*.glb"))),2)
        self.assertEqual(len(list(dest.glob("*.json"))),3)
        self.assertFalse(list(dest.glob("*.step")))
        self.assertFalse(list(dest.glob("*.STEP")))
        self.assertFalse(result["flightApproved"])
        self.assertTrue(result["readyForBrowserResearch"])
        self.assertFalse(result["readyForMechanicalManufacture"])
        with self.assertRaisesRegex(ValueError,"already exists"):
            intake.convert_pair(self.frame,self.motor,src,dest,self.lic)

    def test_failed_second_conversion_never_publishes_partial_pair(self):
        src=self.call_preflight()
        dest=self.path/"private-result"
        calls=[]
        def first_pass_then_motor_failure(source,glb,**kwargs):
            calls.append(source.name)
            if len(calls)==2:
                raise RuntimeError("motor CAD failed after successful frame conversion")
            glb.write_bytes(b"glTF"+b"x"*32)
            manifest=glb.with_suffix(".visual-package.json")
            manifest.write_text(json.dumps({
                "source":{"sha256":kwargs["expected_sha"],"fileName":source.name},
                "mesh":{"fileName":glb.name,"sha256":hashlib.sha256(glb.read_bytes()).hexdigest()},
                "qualification":{"manufacturerAuthenticated":False,"flightReady":False},
                "conversion":{"solidCount":1,"triangleCount":1,
                              "sourceAabbKernelMm":{"min":[0,0,0],"max":[3,3,3]}}
            }))
            return manifest
        with patch.object(intake,"convert",side_effect=first_pass_then_motor_failure):
            with self.assertRaisesRegex(RuntimeError,"motor CAD failed"):
                intake.convert_pair(self.frame,self.motor,src,dest,self.lic)
        self.assertEqual(calls,[self.frame.name,self.motor.name])
        self.assertFalse(dest.exists())
        self.assertFalse(list(self.path.glob(".aeroforge-cad-intake-*")))


if __name__=="__main__":
    unittest.main()
