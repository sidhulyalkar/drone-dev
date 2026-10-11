#!/usr/bin/env python3
"""Conservative broad-phase AABB separation analysis on user-provided meshes.

No collision-free claims. Meshes must already be registered in one shared world
coordinate system in meters; contacts and broad-phase overlaps are NOT validated
manufacturing fit. Rotating or nonlinear swept motions are not supported.
"""
import argparse
import json
from pathlib import Path


def analyze_meshes(named):
    import numpy as np
    import trimesh
    bounds=[]
    for name,path in named:
        obj=trimesh.load(path,force='scene')
        box=obj.bounds
        if box is None or not np.all(np.isfinite(box)):
            raise ValueError(f'Empty or malformed geometry: {name}')
        bounds.append({'name':name,'source':str(path),'bounds_m':box.tolist()})
    checks=[]
    for i,a in enumerate(bounds):
        for b in bounds[i+1:]:
            lower=[max(a['bounds_m'][0][d],b['bounds_m'][0][d]) for d in range(3)]
            upper=[min(a['bounds_m'][1][d],b['bounds_m'][1][d]) for d in range(3)]
            overlap=[round(upper[d]-lower[d],6) for d in range(3)]
            potentially_colliding=all(v>=0 for v in overlap)
            checks.append({'a':a['name'],'b':b['name'],'broad_phase':'POSSIBLE_COLLISION' if potentially_colliding else 'AABB_SEPARATED',
                           'axis_overlap_m':overlap,'fine_mesh_collision_verified':False})
    return {'schema':'aeroforge/cad-broadphase/v0.4','mesh_units':'m','bounds':bounds,'pairs':checks,
            'clearance_status':'HOLD_FINE_GEOMETRY_AND_SOURCE_REGISTRATION',
            'meaning':'Separated bounding boxes prove the corresponding registered static mesh objects do not intersect. Overlaps are only possible collisions. Neither result qualifies dynamic rotor clearance or a full assembly.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mesh',action='append',required=True,help='name=path/to/registered.glb (repeat >=2)')
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    pairs=[]
    for term in args.mesh:
        if '=' not in term:parser.error('mesh syntax name=filepath required')
        name,path=term.split('=',1)
        if not name or not Path(path).is_file():parser.error('mesh name and existing file required')
        pairs.append((name,Path(path)))
    if len(pairs)<2 or len(set(n for n,_ in pairs))!=len(pairs):parser.error('Need at least two distinct mesh names')
    result=analyze_meshes(pairs);payload=json.dumps(result,indent=2)+'\n'
    if args.output:args.output.write_text(payload,encoding='utf-8')
    print(payload,end='')

if __name__=='__main__':main()
