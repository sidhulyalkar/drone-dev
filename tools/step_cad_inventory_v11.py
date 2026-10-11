#!/usr/bin/env python3
"""AeroForge v1.1 optional STEP solid bounding-box inventory.

Runs locally with a separately installed CadQuery/OCP. Output is a *review queue*,
not a transform-qualified dimensioned physical assembly. It NEVER infers motor
shaft locations or emits flight geometry from manufacturer STEP shapes.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def number(value, label):
    v = float(value)
    if not math.isfinite(v) or abs(v) > 1e7:
        raise ValueError(f"Out-of-range CAD value for {label}")
    return round(v, 6)


def dimensions_for_box(box):
    lows = [number(getattr(box, a), a) for a in ("xmin", "ymin", "zmin")]
    highs = [number(getattr(box, a), a) for a in ("xmax", "ymax", "zmax")]
    edges = [highs[i] - lows[i] for i in range(3)]
    if any(d < 0 for d in edges):
        raise ValueError("Invalid CAD bounding box ordering")
    return {
        "minKernelUnits": lows,
        "maxKernelUnits": highs,
        "centerKernelUnits": [round((lo + hi) / 2, 6) for lo, hi in zip(lows, highs)],
        "dimensionsKernelUnits": [round(v, 6) for v in edges],
    }


def inspect_step(path, source_url, max_solids):
    try:
        import cadquery as cq
    except ImportError as e:
        raise RuntimeError(
            "Install optional STEP engine in your isolated environment: "
            ".venv/bin/python -m pip install cadquery ; "
            "never install globally or bypass your package manager."
        ) from e
    workplane = cq.importers.importStep(str(path))
    solids = []
    for shape in workplane.objects:
        shapes = list(shape.Solids())
        if shapes:
            solids.extend(shapes)
        else:
            solids.append(shape)
    if len(solids) > max_solids:
        raise ValueError(
            f"STEP contains {len(solids)} solid/shape candidates, above --max-solids={max_solids}. "
            "Do not silently truncate manufacturer geometry."
        )
    rows = []
    for index, solid in enumerate(solids):
        try:
            box = dimensions_for_box(solid.BoundingBox())
        except Exception as e:
            raise ValueError(f"Could not inspect solid candidate {index}") from e
        rows.append({
            "id": f"solid-{index:04d}",
            "shapeType": str(solid.ShapeType()),
            "bounds": box,
            "sourceElement": "CadQuery imported STEP shape",
            "registrationStatus": "UNASSIGNED_SOLID_NOT_COMPONENT_IDENTIFIER",
            "componentSku": None,
            "motorShaftCenterMm": None,
            "verifiedCoordinateTransform": None,
            "massG": None,
        })
    return {
        "schema": "aeroforge/step-solid-inventory/v1.1",
        "source": {
            "fileName": path.name,
            "sha256": sha256_file(path),
            "sourceUrl": source_url,
            "fileSizeBytes": path.stat().st_size,
        },
        "cadEngine": "cadquery/OCP",
        "geometryCoordinateSystem": "IMPORTED_KERNEL_UNITS_AND_AXES_NOT_INDEPENDENTLY_VERIFIED",
        "kernelCoordinatesArePhysicalFrdMm": False,
        "manufacturerAssemblyVerified": False,
        "motorCentersExtracted": False,
        "solidCount": len(rows),
        "solids": rows,
        "missing": [
            "Confirm STEP length units with manufacturer drawing or reference dimension.",
            "Confirm axis convention, handedness, coordinate transform, and physical datum.",
            "Identify individual part solids versus subassemblies and overlapping mating geometry.",
            "Register actual rotor shafts and verify prop dimensions from measured parts.",
            "Add measured mass, electrical connectors/pinouts, fastener engagement and CG.",
        ],
        "flightQualified": False,
        "message": "A shape AABB inventory is not a registered model or clearance-qualified assembly.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("step", type=Path, help="Original locally downloaded .step/.stp file")
    parser.add_argument("--source-url", default=None, help="Manufacturer page URL, not authenticity proof")
    parser.add_argument("--max-solids", type=int, default=1000,
                        help="Maximum CAD solids (fail closed rather than truncate)")
    parser.add_argument("--out", type=Path, default=None, help="JSON destination")
    args = parser.parse_args()
    if args.step.suffix.lower() not in {".step", ".stp"}:
        parser.error("Expected local .step or .stp file")
    if not args.step.is_file():
        parser.error(f"STEP file is missing: {args.step}")
    if not 1 <= args.max_solids <= 100000:
        parser.error("--max-solids must be 1..100000")
    report = inspect_step(args.step, args.source_url, args.max_solids)
    destination = args.out or args.step.with_suffix(".inventory.v11.json")
    destination.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(f"Saved {report['solidCount']} unregistered solid AABBs and SHA-256 to {destination}")
    print("No rotor coordinates inferred, no unit/FRD registration confirmed, no flight qualification.")


if __name__ == "__main__":
    main()
