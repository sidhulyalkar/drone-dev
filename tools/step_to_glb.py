#!/usr/bin/env python3
"""Convert user-supplied STEP to a visual GLB with provenance; NOT CAD collision qualification.

Dependencies: cadquery, trimesh, numpy. STEP is not bundled with AeroForge.
Source Two upstream STEP uses GPL-3.0 licensing; preserve terms for derivatives.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path


def convert(source: Path, output: Path, document_revision: str, source_url: str):
    import cadquery as cq
    import numpy as np
    import trimesh
    if not source.is_file() or source.suffix.casefold() not in {'.step', '.stp'}:
        raise ValueError('Supply an existing .step or .stp file')
    if source.stat().st_size > 150 * 1024 * 1024:
        raise ValueError('STEP file too large for this converter (150MB cap)')
    if not document_revision.strip():
        raise ValueError('Exact upstream source revision is required')
    if not source_url.strip():
        raise ValueError('Upstream source URL is required')
    shape = cq.importers.importStep(str(source))
    solids = shape.solids().vals()
    if not solids:
        solids = [shape.val()]
    meshes = []
    for index, solid in enumerate(solids):
        vertices, triangles = solid.tessellate(0.25, 0.18)
        if not vertices or not triangles:
            continue
        # CadQuery coordinate conventions are mm. glTF world distances are meters.
        v = np.array([p.toTuple() for p in vertices], dtype=float) * 0.001
        faces = np.array(triangles, dtype=int)
        mesh = trimesh.Trimesh(vertices=v, faces=faces, process=False)
        mesh.metadata['name'] = f'cad_solid_{index:03d}'
        meshes.append(mesh)
    if not meshes:
        raise ValueError('No convertible faces found in STEP')
    scene = trimesh.Scene()
    for i, mesh in enumerate(meshes):
        scene.add_geometry(mesh, geom_name=f'solid-{i:03d}', node_name=f'solid-{i:03d}')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(scene.export(file_type='glb'))
    original_bounds = shape.val().BoundingBox()
    manifest = {
        'schema': 'aeroforge-cad-import/v0.3',
        'source_file': source.name,
        'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'source_url': source_url,
        'source_revision': document_revision,
        'input_units': 'mm (CadQuery STEP import normalized)',
        'output_units': 'm (glTF convention)',
        'input_bbox_mm': {
            'x': [round(original_bounds.xmin, 3), round(original_bounds.xmax, 3)],
            'y': [round(original_bounds.ymin, 3), round(original_bounds.ymax, 3)],
            'z': [round(original_bounds.zmin, 3), round(original_bounds.zmax, 3)]},
        'solid_count': len(meshes),
        'converted_mesh_sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
        'source_geometry_is_manufacturer_qualified': False,
        'clearance_verified': False,
        'motor_shaft_centers_extracted': False,
        'mass_properties_measured': False,
        'license_warning': 'Respect the license of the original STEP and any derived GLB; TBS Source Two is GPL-3.0.'
    }
    manifest_path = output.with_suffix('.provenance.json')
    manifest_path.write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
    return manifest_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('step', type=Path, help='locally acquired STEP from manufacturer')
    parser.add_argument('glb', type=Path, help='GLB output path')
    parser.add_argument('--revision', required=True, help='exact manufacturer CAD revision')
    parser.add_argument('--url', required=True, help='upstream source URL')
    args=parser.parse_args()
    try:
        path=convert(args.step,args.glb,args.revision,args.url)
        print(f'Converted visual GLB and wrote evidence manifest: {path}')
    except (ValueError, ImportError, OSError) as e:
        print(f'Conversion failed: {e}', file=sys.stderr)
        raise SystemExit(2)

if __name__ == '__main__':
    main()
