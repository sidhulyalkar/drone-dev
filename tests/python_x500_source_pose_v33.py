"""v3.3 source-only 3D pose and time-bounded Boolean supervisor tests.

No proprietary CAD bytes or CadQuery installation required in CI.
"""
import pathlib
import sys
import tempfile
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import x500_contact_topology_v33 as contact

class TestV33SourcePose(unittest.TestCase):
 def test_right_handed_3d_pose_preserves_source_anchor(self):
  R,t=contact.planar_pose(45,1183.67548,17,[-176.876396,-176.876396],[732.08475,0])
  output=contact.map_point([1183.67548,732.08475,0],R,t)
  for actual,expected in zip(output,[-176.876396,17,-176.876396]):
   self.assertAlmostEqual(actual,expected,places=6)
  self.assertAlmostEqual(contact.map_point([1184.67548,732.08475,0],R,t)[1],16,places=6)
  self.assertAlmostEqual(contact.map_point([1183.67548,733.08475,0],R,t)[0],
                          -176.876396+2**-.5,places=6)

 def test_rotated_broadphase_box_is_conservative_not_a_collision_proof(self):
  bounds=[[0,0,0],[2,3,4]]
  R,t=contact.planar_pose(90,10,17,[0,0],[0,0])
  box=contact.transformed_aabb(bounds,R,t)
  self.assertTrue(all(box[0][i]<=box[1][i] for i in range(3)))
  self.assertTrue(contact.possible_aabb_overlap(box,box))
  self.assertFalse(contact.possible_aabb_overlap(box,
    [[100,100,100],[101,101,101]]))
  self.assertFalse(contact.possible_aabb_overlap(
    [[0,0,0],[1,1,1]],[[1,0,0],[2,1,1]]))
  with self.assertRaises(ValueError):
   contact.planar_pose(float("nan"),10,17,[0,0],[0,0])

 def test_untrusted_original_step_rejected_before_cadquery_import(self):
  with tempfile.TemporaryDirectory() as d:
   frame=pathlib.Path(d)/"x500v2-frame.step"
   frame.write_bytes(b"not the original X500 source")
   with self.assertRaisesRegex(ValueError,"SHA-256"):
    contact.verify_step(frame,"frame")

 def test_hard_budget_turns_unresponsive_child_into_indeterminate(self):
  outcome=contact.run_supervised([sys.executable,"-c","import time;time.sleep(4)"],1)
  self.assertEqual(outcome["status"],"INDETERMINATE_TIMEOUT")
  self.assertFalse(outcome["physicalFitApproved"])

 def test_malformed_worker_output_cannot_be_treated_as_zero_collision(self):
  result=contact.run_supervised(
   [sys.executable,"-c",'print("{\\\"status\\\":\\\"CLEAR\\\"}")'],2)
  self.assertEqual(result["status"],"INDETERMINATE_INVALID_WORKER_OUTPUT")
  self.assertFalse(result["physicalFitApproved"])

if __name__=="__main__":
 unittest.main()
