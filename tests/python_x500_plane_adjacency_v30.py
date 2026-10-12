"""Synthetic-only tests for source-bound v3.0 BREP topology preflight."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
import x500_brep_plane_adjacency_v30 as topo
IDS=["frame-quadrant-nn","frame-quadrant-np","frame-quadrant-pn",
     "frame-quadrant-pp","motor-coaxial-16-19-pairs"]
def fake_report():
 return {
  "schema":topo.CANDIDATES_SCHEMA,
  "source":{"frameSha256":topo.EXPECTED["frame"][1],
            "motorSha256":topo.EXPECTED["motor"][1]},
  "candidateCount":5,
  "candidates":[{"id":name} for name in IDS],
  "mountingHoleIdentityApproved":False,"motorShaftAxisApproved":False,
  "tolerancedFitTested":False,"procurementApproved":False,
  "powerApproved":False,"flightApproved":False,
 }
class TestTopologyPreflight(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
  self.root=Path(self.tmp.name);self.path=self.root/"candidates.json"
  self.save(fake_report())
 def save(self,x):self.path.write_text(json.dumps(x))
 def test_valid_local_candidate_report_fingerprint_can_be_recorded(self):
  doc,sha=topo.validate_report(self.path)
  self.assertEqual(len(doc["candidates"]),5)
  self.assertEqual(sha,hashlib.sha256(self.path.read_bytes()).hexdigest())
  self.assertEqual(len(sha),64)
 def test_partial_candidate_set_or_forged_flags_cannot_enter_geometry_analysis(self):
  x=fake_report();x["candidates"].pop();x["candidateCount"]=4;self.save(x)
  with self.assertRaises(ValueError):topo.validate_report(self.path)
  x=fake_report();x["flightApproved"]=True;self.save(x)
  with self.assertRaisesRegex(ValueError,"unauthorized"):topo.validate_report(self.path)
  x=fake_report();x["source"]["frameSha256"]="a"*64;self.save(x)
  with self.assertRaisesRegex(ValueError,"source fingerprints"):topo.validate_report(self.path)
 def test_real_brep_is_never_imported_after_wrong_step_bytes(self):
  file=self.root/"x500v2-frame.step"
  file.write_bytes(b"ISO-10303-21; SYNTHETIC FOR BAD SHA TEST")
  with self.assertRaisesRegex(ValueError,"Original STEP bytes differ"):
   topo.import_solids(file,"frame")
 def test_other_named_source_is_rejected_before_engine_load(self):
  file=self.root/"incorrect.step";file.write_bytes(b"not CAD")
  with self.assertRaisesRegex(ValueError,"Original STEP name"):
   topo.import_solids(file,"motor")
if __name__=="__main__":unittest.main()
