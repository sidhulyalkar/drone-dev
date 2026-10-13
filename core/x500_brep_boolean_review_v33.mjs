/** A single independently supervised BREP worker report can establish CAD
 * model intersections, NOT actual mechanical fit or full-aircraft clearance.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as SOURCES} from './x500_real_source_observations_v28.mjs';
export const PROBE_SCHEMA='aeroforge/x500-bounded-boolean-probe/v3.3';
const sha=/^[a-f0-9]{64}$/;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=s=>{throw Error('Exact BREP candidate evidence rejected: '+s);};
export function reviewX500BooleanProbe(report,survey,sourceSurveySha256){
 if(!report||report.schema!==PROBE_SCHEMA||
  survey?.schema!=='aeroforge/x500-source-contact-browser-review/v3.3'||
  survey.authority!=='SOURCE_GEOMETRY_BROADPHASE_ONLY'||
  !sha.test(sourceSurveySha256)||report.surveySha256!==sourceSurveySha256||
  report.frameStepSha256!==SOURCES.frame.sha256||
  report.motorStepSha256!==SOURCES.motor.sha256)
  fail('Original survey or original STEP fingerprint mismatch');
 for(const k of ['fullAssemblyEvaluated','candidateMotorSeatQualified',
  'mechanicalFitApproved','procurementApproved','powerApproved','flightApproved']){
  if(report[k]!==false)fail('Unapproved physical or full assembly status: '+k);
 }
 const candidate=survey.candidates.find(x=>x.id===report.hypothesisId);
 if(!candidate||candidate.exactBrepBooleanStatus!=='NOT_RUN'||
  !Number.isInteger(report.frameSolidIndex)||
  !Number.isInteger(report.motorSolidIndex)||
  report.frameSolidIndex<0||report.frameSolidIndex>=244||
  report.motorSolidIndex<0||report.motorSolidIndex>=4)
  fail('This original-source pose or requested solid index is not recognized');
 const result=report.result;
 if(!result||result.physicalFitApproved!==false)
  fail('Worker result must explicitly deny physical fit');
 if(result.status.startsWith('INDETERMINATE_')){
  if(result.workerResult!==undefined)fail('Indeterminate worker cannot claim collision result');
  return {schema:'aeroforge/x500-boolean-browser-evidence/v3.3',
   hypothesisId:candidate.id,authority:'BOUNDED_BREP_INDETERMINATE',
   status:result.status,sourceModelInterferenceObserved:null,
   evaluatedSolidPairs:0,modelOverlapPairCount:null,
   fullAssemblyQualified:false,physicalFitApproved:false,flightApproved:false};
 }
 if(result.status!=='MODEL_ONLY_BREP_BOOLEAN_REPORTED'||
  result.workerResult?.schema!=='aeroforge/x500-brep-worker-evidence/v3.3'||
  result.workerResult.manufactureOrPhysicalFitApproved!==false)
  fail('Unexpected or elevated BREP Boolean worker status');
 const b=result.workerResult;
 if(b.status!=='MODEL_ONLY_ALL_AABB_CANDIDATE_PAIRS_EVALUATED'||
  b.fullAircraftAssemblyQualified!==false||
  !Number.isInteger(b.pairCount)||b.pairCount<1||b.pairCount>50||
  b.evaluatedCount!==b.pairCount||!Array.isArray(b.pairs)||
  b.pairs.length!==b.pairCount||
  !Number.isInteger(b.sourceModelPositiveOverlapPairCount)||
  b.sourceModelPositiveOverlapPairCount<0||
  b.sourceModelPositiveOverlapPairCount>b.pairCount||
  !finite(b.maxPositiveOverlapMm3)||b.maxPositiveOverlapMm3<0)
  fail('Incomplete or falsely finalized exact-solid batch evidence');
 const ids=new Set();
 const expectedIds=new Set(candidate.modelAabbPairs.map(x=>x.frameSolidIndex+':'+x.motorSolidIndex));
 let positive=0,max=0;
 for(const pair of b.pairs){
  const id=pair.frameSolidIndex+':'+pair.motorSolidIndex;
  if(!Number.isInteger(pair.frameSolidIndex)||pair.frameSolidIndex<0||
   pair.frameSolidIndex>=244||!Number.isInteger(pair.motorSolidIndex)||
   pair.motorSolidIndex<0||pair.motorSolidIndex>=4||ids.has(id)||
   !finite(pair.modelIntersectionVolumeMm3)||pair.modelIntersectionVolumeMm3<0||
   pair.sourceModelPositiveOverlap!==(pair.modelIntersectionVolumeMm3>.0001)||
   !expectedIds.has(id))
   fail('Malformed or contradictory per-solid exact BREP overlap');
  ids.add(id);max=Math.max(max,pair.modelIntersectionVolumeMm3);
  if(pair.sourceModelPositiveOverlap)positive++;
 }
 if(positive!==b.sourceModelPositiveOverlapPairCount||
  Math.abs(max-b.maxPositiveOverlapMm3)>.00001)
  fail('Top-level collision summary contradicts exact source solid pairs');
 // The source-only browser survey does not embed the full AABB pair list;
 // require original 30-34 complete pair count, not a bogus one-pair clearance.
 if(b.pairCount!==candidate.modelAabbPotentialPairs)
  fail('Some source AABB-positive pairs were skipped in the exact Boolean batch');
 return {schema:'aeroforge/x500-boolean-browser-evidence/v3.3',
  authority:'EXACT_ORIGINAL_CAD_MODEL_ONE_HYPOTHESIS_ONLY',
  hypothesisId:candidate.id,
  status:positive>0?'MODEL_SOURCE_INTERFERENCE_PRESENT':'NO_POSITIVE_MODEL_INTERSECTION_IN_TESTED_PAIRS',
  sourceModelInterferenceObserved:positive>0,
  evaluatedSolidPairs:b.pairCount,modelOverlapPairCount:positive,
  maxSourceIntersectionVolumeMm3:max,
  exactCADShapeKernelEvidence:true,
  sourcePhysicalAssemblyRevisionVerified:false,
  fullAssemblyQualified:false,physicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false,
  warning:'Exact source CAD model BREP intersections are not physical hardware metrology. A zero modeled volume at one pose would not approve actual fit, fasteners or tolerances.'};
}
