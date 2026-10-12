#!/usr/bin/env python3
"""Create a locally verifiable CAD-to-GLB visual package.

Never downloads CAD. Source bytes, license, units and revision must be supplied.
Geometry is useful for visual inspection ONLY, not validated aircraft clearance.
Optional dependencies: cadquery + numpy + trimesh.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

SCHEMA = "aeroforge/cad-visual-package/v1.3"
MAX_STEP_BYTES = 120 * 1024 * 1024
MAX_GLB_BYTES = 90 * 1024 * 1024
MAX_SOLIDS = 500
MAX_TRIANGLES = 1200000
# Bounded web preview tessellation calibrated against an actual locally uploaded
# 244-solid X500 V2 STEP source: 0.25 mm/0.18 rad exceeded the triangle cap,
# whereas 1.5 mm/0.5 rad fit under the existing limits without dropping solids.
# These are display settings, emphatically not dimensional metrology tolerances.
PREVIEW_LINEAR_DEFLECTION_MM = 1.5
PREVIEW_ANGULAR_DEFLECTION_RAD = 0.5


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as src:
        for part in iter(lambda: src.read(2 * 1024 * 1024), b""):
            digest.update(part)
    return digest.hexdigest()


def validate_sha(value):
    if not isinstance(value, str) or len(value) != 64 or any(c not in "0123456789abcdefABCDEF" for c in value):
        raise ValueError("expected source SHA-256 must contain exactly 64 hexadecimal characters")
    return value.lower()


def validate_source(source, expected_sha):
    source = Path(source)
    if not source.is_file() or source.suffix.lower() not in {".step", ".stp"}:
        raise ValueError("source must be an existing .step or .stp file")
    if source.stat().st_size > MAX_STEP_BYTES or source.stat().st_size <= 0:
        raise ValueError("STEP file size exceeds permitted local conversion bounds")
    expected_sha = validate_sha(expected_sha)
    actual = sha256_file(source)
    if actual != expected_sha:
        raise ValueError("source hash mismatch; refusing to convert different STEP bytes")
    return {"fileName": source.name, "sha256": actual, "sizeBytes": source.stat().st_size}


def check_bounds(bounds):
    """Kernel-aligned dimensions in mm; not motor/frame registration."""
    if len(bounds) != 2 or any(len(row) != 3 for row in bounds):
        raise ValueError("expected 3-axis bounds")
    low, high = bounds
    flat = list(low) + list(high)
    if not all(isinstance(x, (int, float)) and math.isfinite(x) and abs(x) <= 10**7 for x in flat):
        raise ValueError("non-finite/out-of-range CAD bounds")
    if any(hi < lo for lo, hi in zip(low, high)):
        raise ValueError("inverted CAD bounds")
    return {"min": [round(float(x), 6) for x in low],
            "max": [round(float(x), 6) for x in high]}


def build_manifest(source, glb, *, expected_sha, revision, url, license_note,
                   solids, triangles, source_bounds):
    source_info = validate_source(source, expected_sha)
    glb = Path(glb)
    if not glb.is_file() or glb.stat().st_size < 20 or glb.stat().st_size > MAX_GLB_BYTES:
        raise ValueError("GLB output missing or outside safe size bounds")
    if glb.read_bytes()[:4] != b"glTF":
        raise ValueError("output does not have a GLB header")
    if not 1 <= solids <= MAX_SOLIDS or not 1 <= triangles <= MAX_TRIANGLES:
        raise ValueError("invalid solid/triangle count")
    for label, value in (("revision", revision), ("source URL", url), ("license note", license_note)):
        if not isinstance(value, str) or not value.strip() or len(value) > 1024:
            raise ValueError(f"{label} is required (max 1024 chars)")
    if not url.startswith("https://"):
        raise ValueError("source URL must use HTTPS")
    return {
        "schema": SCHEMA,
        "source": {**source_info, "revision": revision.strip(), "documentationUrl": url.strip(),
                   "licenseNote": license_note.strip(),
                   "manufacturerIdentityVerified": False},
        "mesh": {"fileName": glb.name, "sha256": sha256_file(glb),
                 "sizeBytes": glb.stat().st_size, "format": "GLB_2",
                 "units": "m", "assetGeometryIsCadDerived": True},
        "conversion": {
            "engine": "CadQuery/OCP tessellation + trimesh GLB",
            "sourceUnitsDeclared": "mm (STEP importer assumption, NOT independently audited)",
            "scaleFromKernelToGLTF": 0.001, "coordinateFrame": "CAD_NATIVE_UNREGISTERED",
            "solidCount": solids, "triangleCount": triangles,
            "tessellation": {"linearDeflectionMm": PREVIEW_LINEAR_DEFLECTION_MM,
                             "angularDeflectionRad": PREVIEW_ANGULAR_DEFLECTION_RAD,
                             "purpose": "WEB_PREVIEW_NOT_DIMENSIONAL_METROLOGY"},
            "sourceAabbKernelMm": check_bounds(source_bounds)},
        "requiredEvidence": [
            "Confirm manufacturer revision and license before sharing derivative meshes",
            "Independently audit input length units and glTF axis transforms",
            "Identify actual component solids and mounting datums",
            "Measure motor shaft origins, rotor disks, fasteners, part fit, CG, inertia",
            "Qualify electrical and firmware interfaces separately"
        ],
        "qualification": {"manufacturerAuthenticated": False, "axesRegisteredToFRD": False,
                          "physicalFit": False, "rotorCentersMeasured": False,
                          "flightReady": False},
        "scope": "VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED"
    }


def convert(source, glb, *, expected_sha, revision, url, license_note):
    source = Path(source)
    glb = Path(glb)
    validate_source(source, expected_sha)  # fail before loading optional packages
    if glb.resolve() == source.resolve():
        raise ValueError("output cannot overwrite source STEP")
    try:
        import cadquery as cq
        import trimesh
        import numpy as np
    except ImportError as exc:
        raise RuntimeError("CadQuery, trimesh and numpy are required in a dedicated virtual environment") from exc
    imported = cq.importers.importStep(str(source))
    solids = []
    for obj in imported.objects:
        inner = list(obj.Solids())
        solids.extend(inner if inner else [obj])
    if not solids or len(solids) > MAX_SOLIDS:
        raise ValueError("CAD solid count empty or above conservative cap")
    scene = trimesh.Scene()
    bounds_min, bounds_max = [float("inf")] * 3, [float("-inf")] * 3
    total_faces = 0
    converted = 0
    for idx, solid in enumerate(solids):
        box = solid.BoundingBox()
        lower = [box.xmin, box.ymin, box.zmin]
        upper = [box.xmax, box.ymax, box.zmax]
        check_bounds([lower, upper])
        bounds_min = [min(a, b) for a, b in zip(bounds_min, lower)]
        bounds_max = [max(a, b) for a, b in zip(bounds_max, upper)]
        vertices, triangles = solid.tessellate(PREVIEW_LINEAR_DEFLECTION_MM, PREVIEW_ANGULAR_DEFLECTION_RAD)
        if not vertices or not triangles:
            continue
        total_faces += len(triangles)
        if total_faces > MAX_TRIANGLES:
            raise ValueError("Too many tessellated triangles; output not written")
        v = np.asarray([p.toTuple() for p in vertices], dtype=np.float64) * 0.001
        f = np.asarray(triangles, dtype=np.int64)
        if not np.isfinite(v).all() or not len(f):
            raise ValueError("Invalid CAD tessellation geometry")
        mesh = trimesh.Trimesh(vertices=v, faces=f, process=False)
        if not mesh.is_empty:
            name = f"cad-solid-{idx:04d}"
            scene.add_geometry(mesh, geom_name=name, node_name=name)
            converted += 1
    if converted == 0:
        raise ValueError("STEP provided no displayable solid faces")
    glb.parent.mkdir(parents=True, exist_ok=True)
    raw = scene.export(file_type="glb")
    if len(raw) > MAX_GLB_BYTES:
        raise ValueError("Converted GLB exceeds 90 MiB; simplify or partition source")
    # Avoid modifying existing output if conversion/manifest validation fails.
    temp = glb.with_name(glb.name + ".partial")
    try:
        temp.write_bytes(raw)
        if not raw.startswith(b"glTF"):
            raise ValueError("trimesh did not emit GLB_2 bytes")
        # build_manifest requires a GLB file, using temp but fixed name is normalized later.
        manifest = build_manifest(source, temp, expected_sha=expected_sha, revision=revision,
            url=url, license_note=license_note, solids=converted, triangles=total_faces,
            source_bounds=[bounds_min, bounds_max])
        manifest["mesh"]["fileName"] = glb.name
        glb.write_bytes(raw)
        out = glb.with_suffix(".visual-package.json")
        out.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        return out
    finally:
        temp.unlink(missing_ok=True)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("step", type=Path)
    p.add_argument("glb", type=Path)
    p.add_argument("--sha256", required=True, help="independently computed source STEP sha256")
    p.add_argument("--revision", required=True, help="specific named source revision")
    p.add_argument("--url", required=True, help="upstream HTTPS documentation URL")
    p.add_argument("--license-note", required=True, help="source redistribution terms and restrictions")
    args = p.parse_args()
    try:
        out = convert(args.step, args.glb, expected_sha=args.sha256, revision=args.revision,
                      url=args.url, license_note=args.license_note)
        print("Created visual GLB and explicit-unverified manifest:", out)
        print("Manufacturer CAD bytes are not authenticated or independently registered.")
    except (ValueError, ImportError, RuntimeError, OSError) as exc:
        p.exit(2, f"Conversion blocked: {exc}\n")


if __name__ == "__main__":
    main()
