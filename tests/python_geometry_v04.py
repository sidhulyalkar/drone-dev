import importlib.util
import tempfile
import json
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]

def load(name, path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

dxf=load('dxf','tools/source_dxf_audit.py')
box=load('broad','tools/cad_broadphase.py')

class GeometryChecks(unittest.TestCase):
    def test_dxf_git_hash_and_circle_extraction(self):
        import ezdxf
        with tempfile.TemporaryDirectory() as td:
            td=Path(td);doc=ezdxf.new('R2013');msp=doc.modelspace()
            for x,y,r in ((-10,0,1.5),(10,0,1.5)):
                msp.add_circle((x,y),r)
            f=td/'sample.dxf';doc.saveas(f)
            raw=f.read_bytes();assert len(dxf.git_blob_sha1(raw))==40
            self.assertEqual(dxf.circles_from_dxf(f),[[-10,0,1.5],[10,0,1.5]])
            manifest=td/'fixture.json';manifest.write_text(json.dumps({'files':[{'path':'sample.dxf','github_git_blob_sha1':dxf.git_blob_sha1(raw),'circles':dxf.circles_from_dxf(f)}]}))
            self.assertEqual(dxf.audit(td,manifest)['status'],'MATCH')
            f.write_bytes(raw+b'0\nEOF\n')
            self.assertEqual(dxf.audit(td,manifest)['status'],'SOURCE_HOLD')
    def test_aabb_broad_phase_is_conservative(self):
        import trimesh
        with tempfile.TemporaryDirectory() as td:
            td=Path(td);a=trimesh.creation.box(extents=(.2,.2,.2))
            b=trimesh.creation.box(extents=(.2,.2,.2));b.apply_translation((.1,0,0))
            c=trimesh.creation.box(extents=(.2,.2,.2));c.apply_translation((.7,0,0))
            items=[]
            for name,mesh in (('frame',a),('stack',b),('far',c)):
                p=td/(name+'.glb');p.write_bytes(mesh.export(file_type='glb'));items.append((name,p))
            result=box.analyze_meshes(items)
            self.assertEqual(result['clearance_status'],'HOLD_FINE_GEOMETRY_AND_SOURCE_REGISTRATION')
            lookup={(p['a'],p['b']):p['broad_phase'] for p in result['pairs']}
            self.assertEqual(lookup['frame','stack'],'POSSIBLE_COLLISION')
            self.assertEqual(lookup['frame','far'],'AABB_SEPARATED')
            self.assertTrue(all(x['fine_mesh_collision_verified'] is False for x in result['pairs']))

if __name__=='__main__':unittest.main()
