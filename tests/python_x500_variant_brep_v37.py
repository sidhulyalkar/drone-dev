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
 def test_model_zero_never_includes_small_positive_intersection(self):
  t=runner.VOLUME_THRESHOLD_MM3
  cases=[
   (0.0,"MODEL_ZERO_INTERSECTION"),
   (t/10,"INDETERMINATE_SUBTHRESHOLD_INTERSECTION"),
   (t,"INDETERMINATE_SUBTHRESHOLD_INTERSECTION"),
   (t*1.01,"MODEL_POSITIVE_INTERSECTION")
  ]
  for volume,status in cases:
   self.assertEqual(runner.classify_intersection_volume(volume),status)
   self.assertTrue(runner.valid_pair_measurement(status,volume))
  for volume in (float("nan"),float("inf"),-1e-10,True):
   with self.assertRaises(ValueError):
    runner.classify_intersection_volume(volume)
  self.assertFalse(runner.valid_pair_measurement("MODEL_ZERO_INTERSECTION",t/10))
  self.assertFalse(runner.valid_pair_measurement(
   "INDETERMINATE_SUBTHRESHOLD_INTERSECTION",0))
  self.assertFalse(runner.valid_pair_measurement(
   "MODEL_POSITIVE_INTERSECTION",t))
  self.assertFalse(runner.valid_pair_measurement(
   "INDETERMINATE_SUBTHRESHOLD_INTERSECTION",None))

 def test_transformed_motor_must_remain_a_valid_solid(self):
  runner.validate_transformed_solid(False,True,True)
  for invalid in [(True,False,False),(False,False,True),
                  (False,True,False),(False,True,0),
                  (False,1,True)]:
   with self.subTest(invalid=invalid):
    with self.assertRaisesRegex(ValueError,
        "Transformed candidate motor is not a valid source BREP solid"):
     runner.validate_transformed_solid(*invalid)

 def test_boolean_topology_preserves_zero_volume_contacts(self):
  classify=runner.classify_boolean_topology
  self.assertEqual(classify(True,True,False,False,0),
                   "MODEL_ZERO_INTERSECTION")
  self.assertEqual(classify(False,True,False,False,0),
                   "MODEL_ZERO_INTERSECTION")
  self.assertEqual(classify(False,True,False,True,0),
                   "INDETERMINATE_NONVOLUMETRIC_CONTACT")
  self.assertEqual(classify(False,True,True,False,0),
                   "INDETERMINATE_NONVOLUMETRIC_CONTACT")
  self.assertTrue(runner.valid_pair_measurement(
   "INDETERMINATE_NONVOLUMETRIC_CONTACT",0))
  self.assertFalse(runner.valid_pair_measurement(
   "INDETERMINATE_NONVOLUMETRIC_CONTACT",0.00001))
  self.assertEqual(classify(False,True,True,False,1e-5),
                   "INDETERMINATE_SUBTHRESHOLD_INTERSECTION")
  self.assertEqual(classify(False,True,True,False,0.001),
                   "MODEL_POSITIVE_INTERSECTION")
  for bad in [
   (True,True,True,False,0),
   (True,True,False,True,0),
   (False,False,True,False,0),
   (False,True,False,True,0.002),
   (False,True,True,False,float("nan")),
   (False,True,True,False,-0.0000001),
   (False,True,True,None,0),
  ]:
   with self.subTest(bad=bad):
    with self.assertRaisesRegex(ValueError,"X500 v3.7 BREP run blocked"):
     classify(*bad)

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

 def test_conservative_aabb_guard_detects_historical_screen_omissions(self):
  frame=([0.,0.,0.],[10.,10.,10.])
  sub_epsilon=([10.-runner.EPS/10,0.,0.],[11.,10.,10.])
  touching=([10.,0.,0.],[11.,10.,10.])
  outside=([10.+runner.EPS*2,0.,0.],[11.,10.,10.])
  for candidate in (sub_epsilon,touching):
   self.assertFalse(runner.overlaps(frame,candidate))
   self.assertTrue(runner.could_contact(frame,candidate))
  self.assertFalse(runner.could_contact(frame,outside))
  with self.assertRaisesRegex(ValueError,"nonnegative"):
   runner.could_contact(frame,touching,-1)

 def test_import_requires_actual_bounded_positive_volume_solids(self):
  # Fake geometry deliberately bypasses CadQuery; qualification requires the
  # genuine STEP import in the isolated CAD worker, not this Python test.
  from types import SimpleNamespace
  class FakeSolid:
   def __init__(self,typ="Solid",volume=4.0,bounds=None,valid=True):
    self.typ=typ
    self.volume=volume
    self.valid=valid
    self.bounds=bounds or [0.,0.,0.,2.,3.,4.]
   def ShapeType(self):return self.typ
   def Volume(self):return self.volume
   def isValid(self):return self.valid
   def BoundingBox(self):
    return SimpleNamespace(**dict(zip(
     ("xmin","ymin","zmin","xmax","ymax","zmax"),self.bounds)))
  valid=[FakeSolid(),FakeSolid()]
  runner.validate_source_solids(valid,2,"frame")
  self.assertEqual(runner.shape_bbox(valid[0]),([0.,0.,0.],[2.,3.,4.]))
  for bad in [
   [FakeSolid(typ="Shell"),FakeSolid()],
   [FakeSolid(valid=False),FakeSolid()],
   [FakeSolid(volume=0),FakeSolid()],
   [FakeSolid(volume=float("nan")),FakeSolid()],
   [FakeSolid(bounds=[0,0,0,float("inf"),3,4]),FakeSolid()],
   [FakeSolid(bounds=[0,0,0,0,3,4]),FakeSolid()],
   [FakeSolid(bounds=[1,0,0,0,3,4]),FakeSolid()],
   [FakeSolid()],
  ]:
   with self.subTest(bad=str(bad)):
    with self.assertRaisesRegex(ValueError,"CAD reimport|Missing, invalid|source BREP"):
     runner.validate_source_solids(bad,2,"frame")

 def test_json_rejects_duplicate_keys_and_nonfinite_values(self):
  with tempfile.TemporaryDirectory() as d:
   path=Path(d)/"source.json"
   for payload in [
    '{"source":{"sha":"first","sha":"second"},"padding":"123456789012345"}',
    '{"source":{"volume":NaN},"padding":"123456789012345"}',
    '{"source":{"volume":Infinity},"padding":"123456789012345"}',
   ]:
    path.write_text(payload,encoding="utf8")
    with self.assertRaisesRegex(ValueError,"Duplicate key|Non-finite"):
     runner.read_json(path)

 def test_preflight_rejects_cross_variant_metadata_and_boolean_pair_indices(self):
  # All input objects are synthetic. STEP verification is stubbed ONLY here;
  # this test never represents a real source reimport or CAD qualification.
  from unittest.mock import patch
  import hashlib
  import json
  all_false={name:False for name in (
   "physicalFitApproved","procurementApproved","powerApproved","flightApproved")}
  site="arm-1"
  pose={"id":"synthetic-pose","originalFramePlaneFaceIndex":103,
        "originalMotorPlaneFaceIndex":28,"opposingSourceNormals":True,
        "actualMatingSurfaceQualified":False,
        "rotation3x3":[[1,0,0],[0,1,0],[0,0,1]],
        "nativeTranslationMm":[0,0,0]}
  survey={"schema":"aeroforge/x500-source-contact-hypotheses/v3.3",
   "hypotheses":[{
    "id":pose["id"],"frameSourceFaceIndex":103,
    "motorSourceFaceIndex":28,"planeNormalsOppose":True,
    "frameSourceSolidIndex":35,
    "rightHandedRotation3x3":pose["rotation3x3"],
    "translationNativeMm":pose["nativeTranslationMm"],
    "broadPhaseAabbPairs":[{"frameSolidIndex":35,"motorSolidIndex":0}],
    "broadPhasePotentialPairCount":1}],**all_false}
  variant={"schema":"aeroforge/x500-unqualified-assembly-variant/v3.6",
   "authority":"UNQUALIFIED_ASSEMBLY_PLAN_ONLY",
   "targetSiteId":site,"scenarioMode":"HYPOTHETICAL_AIR2216II_REPLACEMENT",
   "proposedMotorModel":"AIR2216II",
   "originalSourceMotorModel":"DJ-2216-KV880",
   "source":{"frameStepSha256":runner.FRAME_HASH,
             "motorStepSha256":runner.MOTOR_HASH,
             "v35AssemblyReportSha256":"d"*64},
   "originalFrameSolidOccurrences":244,"hypotheticalFrameOccurrenceCount":242,
   "excludedFromHypotheticalStudyOnly":[56,189],
   "unmodifiedOriginalSourceMotorPairs":[
    {"siteId":arm,"originalLeafIndexes":list(mask),
     "nestedArmPath":"HMX5V-ARM-V1_ASM:"+str(i),
     "sourceCadGeometryUnmodified":True,
     "physicalMotorPresentVerified":False}
    for i,(arm,(mask,_)) in enumerate(runner.SITES.items(),1)],
   "originalGeometryWasModified":False,
   "physicalExistingMotorRemovalAuthorized":False,
   "replacementApproved":False,"selectedPhysicalBomQualified":False,
   "hypotheticalHistoricalComparison":{
     "overlapVolumesRecomputedAfterMask":False,
     "newExactBooleanResult":None},**all_false}
  plan={"schema":runner.SCHEMA,
   "authority":"ORIGINAL_SOURCE_BREP_EXECUTION_REQUEST_NOT_RESULT",
   "source":{"frameStepSha256":runner.FRAME_HASH,
             "motorStepSha256":runner.MOTOR_HASH,
             "originalAssemblyJsonSha256":"d"*64},
   "targetSiteId":site,"scenarioMode":variant["scenarioMode"],
   "pose":pose,"explicitlyMaskedFrameSolidIndices":[56,189],
   "memberSourceFrameSolidIndices":[i for i in range(244) if i not in (56,189)],
   "memberSourceMotorSolidIndices":[0,1,2,3],
   "totalSourceFrameSolids":244,"totalOriginalMotorSolids":4,
   "mustReimportOriginalStepFiles":True,"mustRecomputeAllAabbs":True,
   "mustMatchOriginalAabbBroadphaseIdentity":True,
   "mustEvaluateEveryAabbPositiveSourceSolidPair":True,
   "expectedOriginalSourceAabbPairs":[{"frameSolidIndex":35,"motorSolidIndex":0}],
   "jobStatus":"NOT_EXECUTED","originalCadFilesEdited":False,**all_false}
  def exercise(mutate=None):
   import copy
   v,p,s=copy.deepcopy(variant),copy.deepcopy(plan),copy.deepcopy(survey)
   if mutate:mutate(v,p,s)
   with tempfile.TemporaryDirectory() as folder:
    root=Path(folder)
    vp,sp,pp=[root/name for name in ("variant.json","survey.json","plan.json")]
    vp.write_text(json.dumps(v),encoding="utf8")
    sp.write_text(json.dumps(s),encoding="utf8")
    p["source"]["originalVariantJsonSha256"]=hashlib.sha256(vp.read_bytes()).hexdigest()
    p["source"]["originalContactSurveyJsonSha256"]=hashlib.sha256(sp.read_bytes()).hexdigest()
    pp.write_text(json.dumps(p),encoding="utf8")
    with patch.object(runner,"verify_step"):
     return runner.preflight(pp,vp,sp,root/"frame.step",root/"motor.step")
  good,_=exercise()
  self.assertEqual(good["targetSiteId"],site)
  for mutate in [
   lambda v,p,s:v["source"].__setitem__("v35AssemblyReportSha256","e"*64),
   lambda v,p,s:v["unmodifiedOriginalSourceMotorPairs"][0].__setitem__(
     "physicalMotorPresentVerified",True),
   lambda v,p,s:v.__setitem__("replacementApproved",True),
   lambda v,p,s:p["expectedOriginalSourceAabbPairs"][0].__setitem__(
     "frameSolidIndex",True),
   lambda v,p,s:p.__setitem__("originalCadFilesEdited",True),
  ]:
   with self.subTest(mutate=repr(mutate)):
    with self.assertRaisesRegex(ValueError,"X500 v3.7 BREP run blocked"):
     exercise(mutate)

if __name__=="__main__":unittest.main()
