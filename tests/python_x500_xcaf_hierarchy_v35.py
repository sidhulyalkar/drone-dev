"""Synthetic source/CLI safety tests for original X500 AP214 XCAF hierarchy v3.5.

CI does not need CadQuery or original manufacturer CAD. The real-source local
report is reproduced separately against operator-acquired STEP bytes.
"""
import json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import x500_xcaf_assembly_inventory_v35 as xcaf

class TestXcafSafety(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.dir=Path(self.temp.name)
 def test_original_frame_filename_and_sha_fails_before_loading_heavy_cad(self):
  fake=self.dir/'x500v2-frame.step';fake.write_bytes(b'not the original STEP')
  with self.assertRaisesRegex(ValueError,'Unchanged original STEP source required'):
   xcaf.source(fake,'x500v2-frame.step',xcaf.FRAME_SHA)
  with self.assertRaisesRegex(ValueError,'Unchanged original STEP source required'):
   xcaf.source(self.dir/'other.step','x500v2-frame.step',xcaf.FRAME_SHA)
 def test_previous_collision_report_cannot_claim_OEM_BOM_approval(self):
  f=self.dir/'frame.step';f.write_bytes(b'not source')
  inv=self.dir/'v28.json';inv.write_text(json.dumps({'sha256':'0'*64,'solidCount':244}))
  previous=self.dir/'v34.json';previous.write_text(json.dumps({
   'schema':'aeroforge/x500-source-occurrence-reconciliation/v3.4',
   'bomHierarchyVerified':True,'physicalFitApproved':True
  }))
  with self.assertRaises(ValueError):
   xcaf.build(f,self.dir/'motor.step',inv,previous)
 def test_no_manufacturer_approval_derived_from_source_names(self):
  source=Path(xcaf.__file__).read_text()
  self.assertIn('sourcePartCountOrRealPresenceVerified',source)
  self.assertIn('frameStepMotorAndSeparateCandidateInterchangeabilityVerified',source)
  self.assertIn('manufacturerBomIndependentlyVerified',source)
  self.assertIn('sourceModelInterferenceRemains',source)
  self.assertIn('sourceRootComponentCount',source)
  self.assertIn('XCAF_DEPTH_FIRST_LEAF_ORDER_CROSSCHECKED_244_AABB_MATCHES',source)

if __name__=='__main__':
 unittest.main()
