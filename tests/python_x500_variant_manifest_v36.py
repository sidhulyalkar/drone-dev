"""v3.6 deterministic, fail-closed source-report-derived assembly variant CLI tests."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import x500_variant_manifest_v36 as v36

def payload():
 leaves=[{'flatSolidIndex':i,'sourcePartCountOrRealPresenceVerified':False,
          'sourceComponentName':f'PART-{i}:1',
          'sourceDefinitionLabel':f'0:1:1:{i+100}',
          'assemblyPath':['(Unsaved)',f'PART-{i}:1']} for i in range(244)]
 for site,(nested,top,arm) in v36.SITES.items():
  leaves[nested].update(sourceComponentName='DJ-2216-KV880:1',
   sourceDefinitionLabel='0:1:1:25',
   assemblyPath=['(Unsaved)',arm,'DJ-2216-KV880:1'])
  leaves[top].update(sourceComponentName='DJ-2216-KV880:2',
   sourceDefinitionLabel='0:1:1:25',
   assemblyPath=['(Unsaved)','DJ-2216-KV880:2'])
 positives=[(56,m) for m in range(4)]+[(39,0)]+[(i,0) for i in range(57,61)]
 negatives=[(i,0) for i in range(150,167)]
 pairs=[{
  'canonicalFrameSolidIndex':f,'motorSolidIndex':m,
  'originalFrameSolidIndices':[56,189] if f==56 else [f],
  'sourceModelInterferencePresent':(f,m) in positives
 } for f,m in positives+negatives]
 prior={
  'schema':'aeroforge/x500-source-occurrence-reconciliation/v3.4',
  'source':{'frameStepSha256':v36.FRAME_SHA,'motorStepSha256':v36.MOTOR_SHA},
  'sourceModelRawPositiveOverlapCount':13,
  'physicalFitApproved':False,'procurementApproved':False,
  'powerApproved':False,'flightApproved':False}
 current={
  'schema':'aeroforge/x500-xcaf-assembly-identity/v3.5',
  'source':{'frameStepSha256':v36.FRAME_SHA,'motorStepSha256':v36.MOTOR_SHA,
            'sourceV34ByteSha256':None},
  'sourceRootComponentCount':111,'sourceLeafInstances':leaves,
  'collisionGroups':pairs,
  'frameStepMotorAndSeparateCandidateInterchangeabilityVerified':False,
  'manufacturerBomIndependentlyVerified':False,
  'installedMotorCountVerified':False,
  'physicalFitApproved':False,'procurementApproved':False,
  'powerApproved':False,'flightApproved':False}
 return prior,current

class TestVariantManifest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.addCleanup(self.tmp.cleanup)
  folder=Path(self.tmp.name)
  self.a=folder/'v34.json';self.b=folder/'v35.json'
  prior,current=payload()
  self.a.write_text(json.dumps(prior))
  current['source']['sourceV34ByteSha256']=v36.sha(self.a)
  self.b.write_text(json.dumps(current))
 def test_first_site_mask_retains_five_unresolved_historical_model_collision_groups(self):
  result=v36.build(self.a,self.b,v36.MODE_REPLACE,'arm-1')
  self.assertEqual(result['excludedOriginalIndicesOnlyWithinHypotheticalModelMask'],[56,189])
  self.assertEqual(result['historicalGroupsAfterHypotheticalMask'],22)
  self.assertEqual(result['historicalPositiveGroupsAfterMask'],5)
  self.assertEqual(result['originalCollisionDistinctPositiveGroups'],9)
  self.assertFalse(result['exactBREPRecomputedOnVariant'])
  self.assertFalse(result['originalCADModified'])
  self.assertFalse(result['physicalFitApproved'])
 def test_retaining_existing_motor_never_inserts_new_motor_or_reuses_Boolean(self):
  result=v36.build(self.a,self.b,v36.MODE_RETAIN,'arm-1')
  self.assertEqual(result['excludedOriginalIndicesOnlyWithinHypotheticalModelMask'],[])
  self.assertIsNone(result['candidateMotorModel'])
  self.assertIsNone(result['historicalPositiveGroupsAfterMask'])
  self.assertFalse(result['physicalFitApproved'])
 def test_other_sites_never_reuse_first_arm_collision_volume(self):
  for site in ['arm-2','arm-3','arm-4']:
   result=v36.build(self.a,self.b,v36.MODE_REPLACE,site)
   self.assertEqual(result['excludedOriginalIndicesOnlyWithinHypotheticalModelMask'],
    list(v36.SITES[site][:2]))
   self.assertIsNone(result['historicalPositiveGroupsAfterMask'])
   self.assertFalse(result['exactBREPRecomputedOnVariant'])
 def test_source_receipt_and_upgrade_attempts_rejected(self):
  prior,current=payload()
  current['source']['sourceV34ByteSha256']='f'*64
  self.b.write_text(json.dumps(current))
  with self.assertRaisesRegex(ValueError,'Byte-bound predecessor'):
   v36.build(self.a,self.b,v36.MODE_REPLACE,'arm-1')
  current['source']['sourceV34ByteSha256']=v36.sha(self.a)
  current['manufacturerBomIndependentlyVerified']=True
  self.b.write_text(json.dumps(current))
  with self.assertRaises(ValueError):
   v36.build(self.a,self.b,v36.MODE_REPLACE,'arm-1')
  with self.assertRaises(ValueError):
   v36.build(self.a,self.b,'DELETE_REAL_PART','arm-1')
 def test_original_source_file_not_modified_and_output_not_overwritten(self):
  old=self.a.read_bytes(),self.b.read_bytes()
  result=v36.build(self.a,self.b,v36.MODE_REPLACE,'arm-1')
  self.assertEqual((self.a.read_bytes(),self.b.read_bytes()),old)
  self.assertFalse(result['originalSourceFilesRehashedThisExecution'])
  self.assertEqual(result['source']['v34AuditByteSha256'],v36.sha(self.a))

if __name__=='__main__':unittest.main()
