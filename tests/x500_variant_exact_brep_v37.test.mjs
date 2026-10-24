import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {VARIANT_MODES,MOTOR_SITES,VARIANT_SCHEMA} from '../core/x500_assembly_variant_v36.mjs';
import {RUN_SCHEMA,RESULT_SCHEMA,planX500VariantExactBrep,
 reviewX500VariantBrepResult} from '../core/x500_variant_exact_brep_v37.mjs';
const A='a'.repeat(64),B='b'.repeat(64),C='c'.repeat(64);
const poses={
 'arm-1':['nn',35,[56,189]],'arm-2':['np',62,[83,191]],
 'arm-3':['pp',89,[110,190]],'arm-4':['pn',116,[137,188]]
};
function fixture(siteId='arm-1'){
 const [quadrant,plate,excluded]=poses[siteId],site=MOTOR_SITES.find(x=>x.id===siteId);
 const id='frame-quadrant-'+quadrant+'-orientation-1-motor-plane-28-frame-plane-103';
 const pairs=[
  {frameSolidIndex:plate,motorSolidIndex:0},
  {frameSolidIndex:39,motorSolidIndex:0},
  ...excluded.flatMap(frameSolidIndex=>[0,1,2,3].map(motorSolidIndex=>({frameSolidIndex,motorSolidIndex}))),
  ...[57,58,59,60].map(frameSolidIndex=>({frameSolidIndex,motorSolidIndex:0})),
  ...Array.from({length:16},(_,i)=>({frameSolidIndex:i,motorSolidIndex:1}))
 ];
 assert.equal(pairs.length,30);
 const variant={
  schema:VARIANT_SCHEMA,authority:'UNQUALIFIED_ASSEMBLY_PLAN_ONLY',
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
   v35AssemblyReportSha256:C},
  scenarioMode:VARIANT_MODES.REPLACE,targetSiteId:siteId,
  targetFramePatternId:site.framePatternId,proposedMotorModel:'AIR2216II',
  excludedFromHypotheticalStudyOnly:[...excluded],
  originalFrameSolidOccurrences:244,hypotheticalFrameOccurrenceCount:242,
  unmodifiedOriginalSourceMotorPairs:MOTOR_SITES.map(x=>({
   siteId:x.id,originalLeafIndexes:[...x.occurrences],sourceCadGeometryUnmodified:true
  })),
  originalCollisionEvidence:{exactOriginalSourceRawPairs:30,
   exactOriginalPositivePairComparisons:13,distinctPositiveSourceGeometryGroups:9},
  hypotheticalHistoricalComparison:{newExactBooleanResult:null,
   overlapVolumesRecomputedAfterMask:false},
  physicalExistingMotorRemovalAuthorized:false,originalGeometryWasModified:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false
 };
 const contactReview={
  schema:'aeroforge/x500-source-contact-browser-review/v3.3',
  authority:'SOURCE_GEOMETRY_BROADPHASE_ONLY',
  sourceSha256:{frame:S.frame.sha256,motor:S.motor.sha256},
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  candidates:[{id,framePatternId:site.framePatternId,
   opposingSourceNormals:true,exactBrepBooleanStatus:'NOT_RUN',
   physicalFitApproved:false,flightApproved:false,
   motorPlaneFaceIndex:28,framePlaneFaceIndex:103,
   rotation3x3:[[0,Math.SQRT1_2,-Math.SQRT1_2],[-1,0,0],[0,Math.SQRT1_2,Math.SQRT1_2]],
   nativeTranslationMm:[-650,1180,-170],
   modelAabbPotentialPairs:pairs.length,modelAabbPairs:pairs}]
 };
 return {variant,contactReview,id,siteId,plate};
}
function plan(x){return planX500VariantExactBrep(x.variant,A,x.contactReview,B,x.id);}
function measured(p,nonzero=false){
 const result={schema:RESULT_SCHEMA,sourcePlanJsonSha256:C,
  frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
  poseId:p.pose.id,siteId:p.targetSiteId,
  originalFrameSourceCount:244,frameSolidMembersEvaluated:242,
  motorSolidMembersEvaluated:4,
  maskedFrameSolidIndices:[...p.explicitlyMaskedFrameSolidIndices],
  broadPhaseRecomputedFromOriginalStep:true,broadPhasePairIdentityMatched:true,
  all244OriginalFrameSolidsAccountedFor:true,
  expectedPairCount:p.expectedOriginalSourceAabbPairs.length,
  complete:true,originalCadFilesEdited:false,exactModelNotPhysicalFit:true,
  manufacturerRevisionAuthenticated:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  pairs:p.expectedOriginalSourceAabbPairs.map((item,i)=>({
   ...item,status:nonzero&&i===0?'MODEL_POSITIVE_INTERSECTION':'MODEL_ZERO_INTERSECTION',
   modelIntersectionVolumeMm3:nonzero&&i===0?3.5:0
  }))};
 return result;
}
test('exact replacement job enumerates 242 frame solids, 4 motor solids and masks only one motor site',()=>{
 for(const siteId of Object.keys(poses)){
  const p=plan(fixture(siteId));
  assert.equal(p.schema,RUN_SCHEMA);
  assert.equal(p.targetSiteId,siteId);
  assert.equal(p.memberSourceFrameSolidIndices.length,242);
  assert.equal(p.memberSourceMotorSolidIndices.length,4);
  assert.deepEqual(p.explicitlyMaskedFrameSolidIndices,poses[siteId][2]);
  assert.equal(p.expectedOriginalSourceAabbPairs.length,22);
  assert.ok(p.expectedOriginalSourceAabbPairs.some(x=>x.frameSolidIndex===poses[siteId][1]));
  assert.ok([57,58,59,60].every(i=>p.memberSourceFrameSolidIndices.includes(i)));
  assert.equal(p.jobStatus,'NOT_EXECUTED');
  assert.equal(p.mustRecomputeAllAabbs,true);
  assert.equal(p.mustEvaluateEveryAabbPositiveSourceSolidPair,true);
  assert.equal(p.physicalFitApproved,false);
 }
});
test('completed exact source model collision batch reports MODEL_INTERFERENCE without physical approval',()=>{
 const p=plan(fixture()),r=reviewX500VariantBrepResult(p,measured(p,true),C);
 assert.equal(r.numberOfExpectedPairs,22);
 assert.equal(r.evaluatedPairs,22);
 assert.equal(r.modelPositivePairs,1);
 assert.equal(r.largestPositiveModelOverlapMm3,3.5);
 assert.equal(r.modeledStatus,'MODEL_INTERFERENCE_PRESENT');
 assert.equal(r.physicalFitApproved,false);
});
test('zero model intersection still not physical fit; incomplete/timeouts remain indeterminate',()=>{
 const p=plan(fixture());
 const clear=reviewX500VariantBrepResult(p,measured(p),C);
 assert.equal(clear.modeledStatus,'ALL_SCREENED_MODEL_PAIRS_ZERO_NOT_PHYSICAL_FIT');
 assert.equal(clear.physicalFitApproved,false);
 const partial=measured(p);
 partial.pairs.pop();partial.complete=false;
 const unresolved=reviewX500VariantBrepResult(p,partial,C);
 assert.equal(unresolved.modeledStatus,'INDETERMINATE_INCOMPLETE_OR_FAILED_BREP');
 assert.equal(unresolved.untestedOrIndeterminatePairs,1);
 const timedOut=measured(p);
 timedOut.pairs[3].status='INDETERMINATE_TIMEOUT';
 timedOut.pairs[3].modelIntersectionVolumeMm3=null;
 const status=reviewX500VariantBrepResult(p,timedOut,C);
 assert.equal(status.modeledStatus,'INDETERMINATE_INCOMPLETE_OR_FAILED_BREP');
 assert.equal(status.workerComplete,false);
});
test('plan and results reject poisoned source, masks, pose reflection, omitted solids, approval upgrades',()=>{
 const poison=[
  x=>x.variant.scenarioMode=VARIANT_MODES.RETAIN,
  x=>x.variant.physicalFitApproved=true,
  x=>x.variant.originalCollisionEvidence.distinctPositiveSourceGeometryGroups=0,
  x=>x.variant.excludedFromHypotheticalStudyOnly=[56],
  x=>x.variant.unmodifiedOriginalSourceMotorPairs[1].originalLeafIndexes=[83,192],
  x=>x.contactReview.sourceSha256.frame='0'.repeat(64),
  x=>x.contactReview.candidates[0].opposingSourceNormals=false,
  x=>x.contactReview.candidates[0].rotation3x3[1][0]=1,
  x=>x.contactReview.candidates[0].modelAabbPairs.pop(),
  x=>x.contactReview.candidates[0].modelAabbPairs[0].frameSolidIndex=56
 ];
 for(const mutate of poison){const x=fixture();mutate(x);
  assert.throws(()=>plan(x),/X500 variant exact-BREP contract rejected/);}
 const p=plan(fixture()),poisonResult=[
  r=>r.sourcePlanJsonSha256='0'.repeat(64),
  r=>r.pairs[0].frameSolidIndex=189,
  r=>r.pairs[0].frameSolidIndex=String(r.pairs[0].frameSolidIndex),
  r=>r.pairs[0].motorSolidIndex=String(r.pairs[0].motorSolidIndex),
  r=>r.pairs.pop(),
  r=>r.pairs[0].status='MODEL_POSITIVE_INTERSECTION',
  r=>r.pairs[0].status='INDETERMINATE_WORKER_ERROR',
  r=>r.all244OriginalFrameSolidsAccountedFor=false,
  r=>r.broadPhasePairIdentityMatched=false,
  r=>r.flightApproved=true,
  r=>r.maskedFrameSolidIndices=[56,83]
 ];
 for(const mutate of poisonResult){const r=measured(p);mutate(r);
  assert.throws(()=>reviewX500VariantBrepResult(p,r,C),
   /X500 variant exact-BREP contract rejected/);}
});
test('v3.7 source and gate semantics include run-hash and independent model-only status',()=>{
 const code=readFileSync(new URL('../core/x500_variant_exact_brep_v37.mjs',import.meta.url),'utf8');
 assert.match(code,/mustRecomputeAllAabbs:true/);
 assert.match(code,/mustMatchOriginalAabbBroadphaseIdentity:true/);
 assert.match(code,/mustEvaluateEveryAabbPositiveSourceSolidPair:true/);
 assert.match(code,/INDETERMINATE_TIMEOUT/);
 assert.match(code,/ALL_SCREENED_MODEL_PAIRS_ZERO_NOT_PHYSICAL_FIT/);
});
