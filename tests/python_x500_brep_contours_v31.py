"""Synthetic-only safety tests for BREP obround/source contour classification."""
import hashlib
from pathlib import Path
import math
import sys
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import x500_brep_contour_groups_v31 as features

def shape():
 r=2.9;s=1.5
 return [
  {"type":"CIRCLE","radiusMm":r,"lengthMm":math.pi*r,"centerMm":[0,0,0]},
  {"type":"LINE","lengthMm":s},
  {"type":"CIRCLE","radiusMm":r,"lengthMm":math.pi*r,"centerMm":[s,0,0]},
  {"type":"LINE","lengthMm":s},
 ]

class TestSourceContourRecognizer(unittest.TestCase):
 def test_pure_obround_geometry_not_a_certified_fastener(self):
  r=features.recognize_obround(shape(),2.9,1.5)
  self.assertEqual(r["kind"],"CLOSED_OBROUND_INNER_WIRE_CANDIDATE")
  self.assertEqual(r["nominalWidthMm"],5.8)
  self.assertEqual(r["nominalLengthMm"],7.3)
  self.assertEqual(r["nativeCenterMm"],[0.75,0,0])
  self.assertFalse(r["fastenerHoleIdentityVerified"])

 def test_reject_circle_or_incomplete_broken_slot(self):
  bad=shape()[:2]
  self.assertIsNone(features.recognize_obround(bad,2.9,1.5))
  for edit in [
   lambda s: s[0].update(lengthMm=2*math.pi*2.9),
   lambda s: s[1].update(lengthMm=2.1),
   lambda s: s[2].update(centerMm=[0,3,0]),
   lambda s: s[3].update(type="CIRCLE"),
   lambda s: s[0].update(radiusMm=3),
  ]:
   candidate=shape()
   edit(candidate)
   self.assertIsNone(features.recognize_obround(candidate,2.9,1.5))

 def test_original_source_name_or_byte_identity_fails_before_import(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/"x500v2-frame.step"
   path.write_text("ISO-10303-21; SYNTHETIC UNTRUSTED TEST")
   with self.assertRaisesRegex(ValueError,"original STEP bytes changed"):
    features.import_solids(path,"frame")
   with self.assertRaisesRegex(ValueError,"Original motor STEP filename"):
    features.import_solids(Path(directory)/"wrong.step","motor")

if __name__=="__main__":
 unittest.main()
