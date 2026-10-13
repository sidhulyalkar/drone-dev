"""v3.4 source occurrence audit preflight tests without downloading OEM STEP."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
import x500_source_occurrence_audit_v34 as audit

class TestOccurrenceAudit(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.addCleanup(self.tmp.cleanup)
  self.root=Path(self.tmp.name)
 def test_wrong_original_source_refused_before_loading_heavy_cad_library(self):
  f=self.root/"x500v2-frame.step"
  f.write_text("ISO-10303-21; synthetic changed source")
  with self.assertRaisesRegex(ValueError,"Exact original operator-acquired frame STEP bytes required"):
   audit.require_original_frame(f)
 def test_partner_only_is_not_sufficient_to_group_brep_placements(self):
  # This is a contract on the source tool: its geometric identity predicate
  # must check BOTH placed transform and symmetric placed vertices, not
  # only IsPartner shared geometry definition.
  text=Path(audit.__file__).read_text()
  self.assertIn("IsPartner",text)
  self.assertIn("Orientation()",text)
  self.assertIn("max_symmetric_nearest_vertex_distance",text)
  self.assertIn("maxLocationMatrixDelta",text)
  self.assertIn("samePhysicalPartConfirmed':False",text)
 def test_wrong_json_schema_or_unlinked_boolean_fail_before_cad_stage(self):
  survey=self.root/"survey.json";batch=self.root/"batch.json"
  survey.write_text(json.dumps({"schema":"made-up source","physicalFitApproved":True}))
  batch.write_text(json.dumps({"schema":"unreviewed volume","flightApproved":True}))
  with self.assertRaisesRegex(ValueError,"Original source survey and exact Boolean"):
   audit.validate_original_collision(survey,batch)
 def test_fail_closed_without_original_step_file(self):
  with self.assertRaises(ValueError):
   audit.reconcile(self.root/"missing.step",self.root/"survey.json",
                   self.root/"batch.json")

if __name__=="__main__":unittest.main()
