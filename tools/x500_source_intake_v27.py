#!/usr/bin/env python3
"""Local X500 V2 frame+motor STEP preflight and two-source visual conversion.

Source binaries must be downloaded separately from official Holybro documentation.
No network access, manufacturer authentication, redistribution permission,
independent dimensional metrology, assembly fit or flight release is implied.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

from cad_visual_package_v13 import convert, validate_source

OFFICIAL_URL = "https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download"
INTAKE_SCHEMA = "aeroforge/x500-paired-source-intake/v2.7"
EXPECTED = {"frame": "x500v2-frame.step", "motor": "AIR2216II_Motor_3D.STEP"}
MAX_BYTES = {"frame": 120 * 1024 * 1024, "motor": 20 * 1024 * 1024}
SHA_RE = re.compile(r"^[a-fA-F0-9]{64}$")
STEP_START = b"ISO-10303-21;"
STEP_END = b"END-ISO-10303-21;"


def inspect_step_envelope(path):
    """Reject HTML, ZIP, partial downloads and misnamed non-STEP payloads."""
    with path.open("rb") as handle:
        head = handle.read(65536)
        handle.seek(max(0, path.stat().st_size - 8192))
        tail = handle.read()
    prefix = head.lstrip(b"\xef\xbb\xbf \r\n\t").upper()
    if not prefix.startswith(STEP_START):
        raise ValueError("STEP signature missing; a website or archive is not CAD")
    if b"HEADER;" not in head.upper() or b"ENDSEC;" not in head.upper():
        raise ValueError("STEP header section missing or corrupt")
    if b"DATA;" not in head.upper() and b"DATA;" not in tail.upper():
        raise ValueError("STEP DATA section missing; cannot recognize solid source")
    if STEP_END not in tail.upper():
        raise ValueError("STEP terminator absent; download may be truncated")
    declared_units = {
        "si_millimetre_token_present": b".MILLI." in head.upper() or b".MILLI." in tail.upper(),
        "length_unit_token_present": b"LENGTH_UNIT" in head.upper() or b"LENGTH_UNIT" in tail.upper(),
    }
    return {
        "stepEnvelopeRecognized": True,
        "stepEnvelopeIsGeometryValidated": False,
        "sourceUnitHintsNotIndependentMetrology": declared_units,
        "unitsIndependentlyVerified": False,
    }


def preflight(frame, motor, frame_sha, motor_sha, frame_revision, motor_revision, license_note):
    if not isinstance(license_note, str) or not 15 <= len(license_note.strip()) <= 1024:
        raise ValueError("Operator must document source license/redistribution status (15..1024 characters)")
    outputs = {}
    for role, path, sha, revision in [
        ("frame", frame, frame_sha, frame_revision),
        ("motor", motor, motor_sha, motor_revision),
    ]:
        path = Path(path)
        if path.is_symlink() or not path.is_file():
            raise ValueError(role + ": a regular original local STEP file is required")
        if path.name.lower() != EXPECTED[role].lower():
            raise ValueError(role + ": exact manufacturer-advertised source filename required")
        if path.stat().st_size > MAX_BYTES[role]:
            raise ValueError(role + ": source exceeds bounded input size")
        if not isinstance(sha, str) or not SHA_RE.fullmatch(sha):
            raise ValueError(role + ": expected SHA-256 must have 64 hexadecimal digits")
        if not isinstance(revision, str) or not 4 <= len(revision.strip()) <= 200:
            raise ValueError(role + ": source revision/identifier declaration required")
        if revision.strip().lower() in {"unknown", "tbd", "placeholder", "default"}:
            raise ValueError(role + ": do not invent a manufacturer revision")
        basic = validate_source(path, sha.lower())  # hashes entire real source
        envelope = inspect_step_envelope(path)
        outputs[role] = {
            **basic,
            **envelope,
            "sourceRevisionDeclaredByOperator": revision.strip(),
            "officialDocumentationUrl": OFFICIAL_URL,
            "origin": "USER_ACQUIRED_SOURCE_NOT_VENDOR_AUTHENTICATED",
            "redistributionAuthorized": False,
        }
    if outputs["frame"]["sha256"] == outputs["motor"]["sha256"]:
        raise ValueError("Two mechanically distinct source STEP files are required")
    return {
        "schema": INTAKE_SCHEMA,
        "sourcePage": OFFICIAL_URL,
        "files": outputs,
        "licenseNotes": license_note.strip(),
        "manufacturerIdentityVerified": False,
        "inputUnitsIndependentlyVerified": False,
        "assemblyDatumsRegistered": False,
        "physicalFitQualified": False,
        "procurementApproved": False,
        "powerApproved": False,
        "flightApproved": False,
        "warning": "Two local hashes and syntactic STEP envelopes are NOT vendor signatures, source dimension calibration or physical mating verification.",
    }


def convert_pair(frame, motor, checks, output_dir, license_note):
    """Do not promote half-converted or mixed-revision CAD packages."""
    output_dir = Path(output_dir)
    if output_dir.exists():
        raise ValueError("Destination already exists; use a NEW empty output path per source pair")
    parent = output_dir.parent
    parent.mkdir(parents=True, exist_ok=True)
    if output_dir.resolve() == Path(frame).resolve() or output_dir.resolve() == Path(motor).resolve():
        raise ValueError("CAD output cannot overwrite an input STEP file")
    with tempfile.TemporaryDirectory(prefix=".aeroforge-cad-intake-", dir=parent) as temp:
        staging = Path(temp)
        receipts = {}
        for role, source in [("frame", frame), ("motor", motor)]:
            meta = checks["files"][role]
            glb_name = "x500v2-frame.glb" if role == "frame" else "AIR2216II_Motor_3D.glb"
            manifest_path = convert(
                Path(source),
                staging / glb_name,
                expected_sha=meta["sha256"],
                revision=meta["sourceRevisionDeclaredByOperator"],
                url=OFFICIAL_URL,
                license_note=license_note,
            )
            payload = json.loads(manifest_path.read_text(encoding="utf-8"))
            if (payload["source"]["sha256"] != meta["sha256"] or
                    payload["source"]["fileName"] != meta["fileName"] or
                    payload["mesh"]["fileName"] != glb_name or
                    payload["qualification"]["manufacturerAuthenticated"] is not False or
                    payload["qualification"]["flightReady"] is not False):
                raise ValueError("Converter output does not match original-source identity or safety contract")
            receipts[role] = {
                "visualManifestName": manifest_path.name,
                "glbName": glb_name,
                "glbSha256": payload["mesh"]["sha256"],
                "solidCount": payload["conversion"]["solidCount"],
                "triangleCount": payload["conversion"]["triangleCount"],
                "sourceAabbKernelMm": payload["conversion"]["sourceAabbKernelMm"],
                "unreviewedGeometry": True,
            }
        result = {
            **checks,
            "conversionResults": receipts,
            "sourcesCopiedOrRedistributed": False,
            "geometryUnitsOrAxesIndependentlyCalibrated": False,
            "readyForBrowserResearch": True,
            "readyForMechanicalManufacture": False,
        }
        (staging / "x500-paired-source-intake.v27.json").write_text(
            json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        # Rename on one filesystem so an interrupted conversion never publishes half a pair.
        staging.rename(output_dir)
        return result


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--frame", required=True, type=Path, help="Original x500v2-frame.step")
    p.add_argument("--motor", required=True, type=Path, help="Original AIR2216II_Motor_3D.STEP")
    p.add_argument("--frame-sha256", required=True, help="Expected independently recorded frame digest")
    p.add_argument("--motor-sha256", required=True, help="Expected independently recorded motor digest")
    p.add_argument("--frame-revision", required=True, help="Source revision/identifier as observed, not inferred")
    p.add_argument("--motor-revision", required=True, help="Source revision/identifier as observed, not inferred")
    p.add_argument("--license-note", required=True, help="Actual license status/restrictions; no redistribution assumed")
    p.add_argument("--out-dir", type=Path, default=Path(".cad-local/x500-v2-intake"))
    p.add_argument("--preflight-only", action="store_true", help="Signature and hash audit without CadQuery")
    args = p.parse_args(argv)
    checks = preflight(args.frame, args.motor, args.frame_sha256, args.motor_sha256,
        args.frame_revision, args.motor_revision, args.license_note)
    if args.preflight_only:
        print(json.dumps(checks, indent=2, sort_keys=True))
        print("PREFLIGHT ONLY: STEP envelopes and SHA checked; geometry not parsed.", file=__import__("sys").stderr)
        return 0
    output = convert_pair(args.frame, args.motor, checks, args.out_dir, args.license_note)
    print("Two local source-derived visual packages created:", args.out_dir)
    print(json.dumps({"frame": output["files"]["frame"]["sha256"],
        "motor": output["files"]["motor"]["sha256"],
        "flightApproved": False}, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError, OSError, KeyError) as e:
        raise SystemExit("X500 CAD ingestion blocked: " + str(e))
