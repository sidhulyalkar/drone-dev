import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {reviewX500BooleanProbe} from '../core/x500_brep_boolean_review_v33.mjs';
const DIGEST='c'.repeat(64);
function fixture(){
 const id='frame-quadrant-nn-orientation-1-motor-plane-28-frame-plane-103';
 const pairs=[{frameSolidIndex:35,motorSolidIndex:0}];
 for(let i=0;i<29;i++)pairs.push({frameSolidIndex:i,motorSolidIndex:i%4});
 const survey={schema:'aeroforge/x500-source-contact-browser-review/v3.3',
  authority:'SOURCE_GEOMETRY_BROADPHASE_ONLY',
  candidates:[{id,exactBrepBooleanStatus:'NOT_RUN',
   modelAabbPairs:pairs,modelAabbPotentialPairs:pairs.length}]};
 const volumes=pairs.map((p,i)=>({
  ...p,modelIntersectionVolumeMm3:i===4?5491.38771511:i===7?194.43466188:0,
  sourceModelPositiveOverlap:i===4||i===7
 }));
 const report={schema:'aeroforge/x500-bounded-boolean-probe/v3.3',
  frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
  surveySha256:DIGEST,hypothesisId:id,frameSolidIndex:35,motorSolidIndex:0,
  fullAssemblyEvaluated:false,candidateMotorSeatQualified:false,
  mechanicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false,
  result:{status:'MODEL_ONLY_BREP_BOOLEAN_REPORTED',physicalFitApproved:false,
   workerResult:{schema:'aeroforge/x500-brep-worker-evidence/v3.3',
    status:'MODEL_ONLY_ALL_AABB_CANDIDATE_PAIRS_EVALUATED',
    manufactureOrPhysicalFitApproved:false,fullAircraftAssemblyQualified:false,
    pairCount:30,evaluatedCount:30,pairs:volumes,
    sourceModelPositiveOverlapPairCount:2,maxPositiveOverlapMm3:5491.38771511}}};
 return {survey,report};
}
const go=f=>reviewX500BooleanProbe(f.report,f.survey,DIGEST);
test('exact source-BREP batch positively finds model interference without physical clearance',()=>{
 const r=go(fixture());
 assert.equal(r.evaluatedSolidPairs,30);
 assert.equal(r.modelOverlapPairCount,2);
 assert.equal(r.status,'MODEL_SOURCE_INTERFERENCE_PRESENT');
 assert.equal(r.sourceModelInterferenceObserved,true);
 assert.equal(r.maxSourceIntersectionVolumeMm3,5491.38771511);
 assert.equal(r.physicalFitApproved,false);
 assert.equal(r.flightApproved,false);
});
test('no positive volumes in one ideal pose is NOT authorization to assemble',()=>{
 const f=fixture();
 for(const pair of f.report.result.workerResult.pairs){
  pair.modelIntersectionVolumeMm3=0;pair.sourceModelPositiveOverlap=false;
 }
 f.report.result.workerResult.sourceModelPositiveOverlapPairCount=0;
 f.report.result.workerResult.maxPositiveOverlapMm3=0;
 const r=go(f);
 assert.equal(r.status,'NO_POSITIVE_MODEL_INTERSECTION_IN_TESTED_PAIRS');
 assert.equal(r.physicalFitApproved,false);
});
test('timeouts are indeterminate, not fabricated no-collision results',()=>{
 const f=fixture();
 f.report.result={status:'INDETERMINATE_TIMEOUT',elapsedSeconds:12,
  timeoutSeconds:12,physicalFitApproved:false};
 const r=go(f);
 assert.equal(r.authority,'BOUNDED_BREP_INDETERMINATE');
 assert.equal(r.sourceModelInterferenceObserved,null);
 assert.equal(r.physicalFitApproved,false);
});
test('source substitution, missing/duplicate Boolean pairs and forged approval fail closed',()=>{
 const edits=[
  f=>f.report.surveySha256='f'.repeat(64),
  f=>f.report.frameStepSha256='f'.repeat(64),
  f=>f.report.flightApproved=true,
  f=>f.report.fullAssemblyEvaluated=true,
  f=>f.report.result.workerResult.fullAircraftAssemblyQualified=true,
  f=>f.report.result.workerResult.pairCount=29,
  f=>f.report.result.workerResult.pairs.pop(),
  f=>f.report.result.workerResult.pairs[0]=f.report.result.workerResult.pairs[1],
  f=>f.report.result.workerResult.pairs[0].frameSolidIndex=240,
  f=>f.report.result.workerResult.pairs[4].sourceModelPositiveOverlap=false,
  f=>f.report.result.workerResult.maxPositiveOverlapMm3=0,
  f=>f.report.result.workerResult.sourceModelPositiveOverlapPairCount=0,
 ];
 for(const edit of edits){const f=fixture();edit(f);
  assert.throws(()=>go(f),/Exact BREP candidate evidence rejected/);}
});
test('browser keeps exact model collision evidence source-linked and separate from active 3D mating',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const panel=readFileSync(new URL('../cad_contact_survey_ui_v33.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v33-brep-probe/);
 assert.match(ui,/reviewX500BooleanProbe/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',v33Bytes\)/);
 assert.match(ui,/sourceContactUI\.setBooleanEvidence\(boundedReview\)/);
 assert.match(panel,/cad-v33-boolean-status/);
 assert.doesNotMatch(ui,/proposeX500CadMating\(boundedReview/);
});
