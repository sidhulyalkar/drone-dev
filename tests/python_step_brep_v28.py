"""Unit tests for BREP feature extraction preconditions, independent of CadQuery install."""
import hashlib
import sys
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import step_brep_feature_candidates_v28 as features

class Point:
    def __init__(self,x,y,z):self.xyz=(x,y,z)
    def X(self):return self.xyz[0]
    def Y(self):return self.xyz[1]
    def Z(self):return self.xyz[2]
class Cylinder:
    class AxisData:
        def Location(self):return Point(1150,732,0)
        def Direction(self):return Point(1,0,0)
    def Axis(self):return self.AxisData()
    def Radius(self):return 2

class TestBrepCandidates(unittest.TestCase):
    def test_pure_face_projection_never_invents_mounting_hole_approval(self):
        row=features.row_for_cylinder(Cylinder(),11.4,2,17)
        self.assertEqual(row["diameterKernelMm"],4)
        self.assertEqual(row["axisDirectionKernel"],[1,0,0])
        self.assertEqual(row["featureType"],"UNLABELED_BREP_CYLINDRICAL_SURFACE")
        self.assertNotIn("mountingHoleApproved",row)

    def test_reject_nonfinite_numeric_values(self):
        for val in (float("nan"),float("inf"),float("-inf"),1e8):
            with self.assertRaises(ValueError):
                features.finite_number(val,"fixture")

    def test_bad_hash_and_missing_file_fail_before_optional_cad_engine(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"synthetic.step"
            p.write_bytes(b"SIMULATED_NOT_REAL_STEP")
            with self.assertRaisesRegex(ValueError,"SHA-256 mismatch"):
                features.inspect_brep(p,"a"*64)
            with self.assertRaisesRegex(ValueError,"SHA-256"):
                features.inspect_brep(p,"bad")
            with self.assertRaisesRegex(ValueError,"STEP file required"):
                features.inspect_brep(Path(d)/"missing.step","a"*64)

if __name__=="__main__":unittest.main()
