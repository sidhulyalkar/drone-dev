import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[1] / "tools" / "cad_visual_package_v13.py"
spec = importlib.util.spec_from_file_location("cad_visual_package_v13", SOURCE)
pkg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pkg)


class CadVisualPackageTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.step = self.root / "fixture.step"
        self.step.write_bytes(b"ISO-10303-21; SYNTHETIC CLASSROOM FILE; END-ISO-10303-21;")
        self.good_hash = hashlib.sha256(self.step.read_bytes()).hexdigest()
        self.glb = self.root / "fixture.glb"
        self.glb.write_bytes(b"glTF" + b"\0" * 40)

    def test_hash_and_source_bytes_are_checked_before_conversion(self):
        self.assertEqual(pkg.validate_source(self.step, self.good_hash)["sha256"], self.good_hash)
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            pkg.validate_source(self.step, "a" * 64)
        with self.assertRaisesRegex(ValueError, "64 hexadecimal"):
            pkg.validate_source(self.step, "invalid")
        self.step.write_bytes(b"different STEP bytes")
        with self.assertRaisesRegex(ValueError, "hash mismatch"):
            pkg.validate_source(self.step, self.good_hash)

    def test_package_manifest_is_unqualified_and_retains_source_identity(self):
        out = pkg.build_manifest(
            self.step, self.glb, expected_sha=self.good_hash,
            revision="SYNTHETIC_FIXTURE_V1",
            url="https://example.org/docs/fixture", license_note="Test license; no real CAD.",
            solids=1, triangles=12,
            source_bounds=([0, 0, -2], [40, 25, 8])
        )
        self.assertEqual(out["schema"], pkg.SCHEMA)
        self.assertEqual(out["mesh"]["sha256"], hashlib.sha256(self.glb.read_bytes()).hexdigest())
        self.assertEqual(out["conversion"]["sourceAabbKernelMm"]["min"], [0.0, 0.0, -2.0])
        self.assertFalse(out["qualification"]["physicalFit"])
        self.assertFalse(out["qualification"]["axesRegisteredToFRD"])
        self.assertFalse(out["qualification"]["flightReady"])
        self.assertFalse(out["source"]["manufacturerIdentityVerified"])
        self.assertEqual(out["conversion"]["coordinateFrame"], "CAD_NATIVE_UNREGISTERED")

    def test_license_and_revision_required_and_source_does_not_change(self):
        params = dict(expected_sha=self.good_hash, revision="test", url="https://example.org/",
                      license_note="Not redistributed", solids=1, triangles=12,
                      source_bounds=([0, 0, 0], [1, 1, 1]))
        for replacement in [{"revision": ""}, {"license_note": ""}, {"url": "http://bad.example/"},
                            {"solids": 501}, {"triangles": 1200001}]:
            with self.subTest(replacement=replacement):
                with self.assertRaises(ValueError):
                    pkg.build_manifest(self.step, self.glb, **dict(params, **replacement))
        self.assertEqual(pkg.sha256_file(self.step), self.good_hash)

    def test_inverted_or_nonfinite_geometry_is_rejected(self):
        with self.assertRaises(ValueError):
            pkg.check_bounds(([20, 0, 0], [10, 1, 1]))
        with self.assertRaises(ValueError):
            pkg.check_bounds(([float("nan"), 0, 0], [10, 1, 1]))
        with self.assertRaises(ValueError):
            pkg.check_bounds(([0, 0, 0], [float("inf"), 1, 1]))


if __name__ == "__main__":
    unittest.main()
