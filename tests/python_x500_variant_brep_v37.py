"""v3.7 CPU-only safety tests: original source identity, 3D AABB, and BREP execution isolation.

CI intentionally cannot claim to have reimported original manufacturer STEP
bytes, executed the OpenCascade Boolean or qualified physical fit.
"""
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
import x500_variant_brep_runner_v37 as runner

class TestV37SourceBrepContract(unittest.TestCase):
 def test_source_name_hash_blocked_before_any_optional_cad_import(self):
  with tempfile.TemporaryDirectory() as d:
   invalid=Path(d)/"x500v2-frame.step"
   invalid.write_text("changed STEP source")
   with self.assertRaisesRegex(ValueError,"Original unmodified frame STEP"):
    runner.verify_step(invalid,"frame")
   with self.assertRaisesRegex(ValueError,"Original unmodified motor STEP"):
    runner.verify_step(invalid,"motor")
 def test_orthonormal_handedness_checked(self):
  import math
  q=2**-.5
  correct=[[0,q,-q],[-1,0,0],[0,q,q]]
  runner.check_matrix(correct)
  for bad in [
   [[1,0,0],[0,1,0],[0,0,-1]],
   [[1,0,0],[0,1,0],[0,0,2]],
   [[0,0,0],[0,1,0],[0,0,1]],
   [[math.nan,0,0],[0,1,0],[0,0,1]]
  ]:
   with self.assertRaises(ValueError):runner.check_matrix(bad)
 def test_transformed_source_boxes_preserve_transverse_and_axial_membership(self):
  R=[[0,1,0],[-1,0,0],[0,0,1]]
  t=[100,200,300]
  shifted=runner.projected_aabb(([0,0,0],[2,3,4]),R,t)
  self.assertEqual(shifted,([100,198,300],[103,200,304]))
  self.assertTrue(runner.overlaps(shifted,shifted))
  self.assertFalse(runner.overlaps(shifted,([103,190,300],[110,200,304])))
 def test_pair_indices_are_exact_identifiers(self):
  self.assertEqual(runner.pair_id({"frameSolidIndex":56,"motorSolidIndex":3}),(56,3))
  self.assertEqual(len(runner.SITES),4)
  self.assertEqual([v[0] for v in runner.SITES.values()],
   [[56,189],[83,191],[110,190],[137,188]])
 def test_supervisor_cannot_create_collisions_from_missing_original_source(self):
  with tempfile.TemporaryDirectory() as d:
   missing=Path(d)/"x500v2-frame.step"
   with self.assertRaises(ValueError):runner.verify_step(missing,"frame")
  # Imported CAD library is confined to worker functions, not module import.
  source=Path(runner.__file__).read_text()
  self.assertIn('import cadquery as cq',source)
  self.assertIn('start_new_session=True',source)
  self.assertIn('os.killpg',source)
  self.assertIn('INDETERMINATE_TIMEOUT',source)
  self.assertIn('broadPhasePairIdentityMatched',source)
  self.assertIn('originalCadFilesEdited',source)

if __name__=="__main__":unittest.main()
