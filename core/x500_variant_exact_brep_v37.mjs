/** AeroForge v3.7: source-bound, variant-specific BREP run contract.
 * Producing a plan MUST NOT be confused with executing its source BREP
 * intersections. A complete negative CAD model result still is NOT physical fit.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as ORIGINAL} from './x500_real_source_observations_v28.mjs';
import {MOTOR_SITES,VARIANT_MODES,VARIANT_SCHEMA} from './x500_assembly_variant_v36.mjs';
export const RUN_SCHEMA='aeroforge/x500-variant-exact-brep-run-plan/v3.7';
export const RESULT_SCHEMA='aeroforge/x500-variant-exact-brep-run-result/v3.7';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const MODEL_VOLUME_THRESHOLD_MM3=0.0001;
const MINIMUM_CONTACT_DISTANCE_MM=0.00001;
const hash=/^[a-f0-9]{64}$/;
const fail=message=>{throw Error('X500 variant exact-BREP contract rejected: '+message);};
const falseKeys=['physicalFitApproved','procurementApproved','powerApproved','flightApproved'];
const requireFalse=(o,k)=>{if(o?.[k]!==false)fail('Unverified authority '+k);};
const validMatrix=R=>Array.isArray(R)&&R.length===3&&R.every(row=>
 Array.isArray(row)&&row.length===3&&row.every(finite));
const determinant=R=>R[0][0]*(R[1][1]*R[2][2]-R[1][2]*R[2][1])-
 R[0][1]*(R[1][0]*R[2][2]-R[1][2]*R[2][0])+
 R[0][2]*(R[1][0]*R[2][1]-R[1][1]*R[2][0]);
function checkPose(R,t){
 if(!validMatrix(R)||!Array.isArray(t)||t.length!==3||!t.every(finite)||
  Math.abs(determinant(R)-1)>1e-5)
  fail('Source-native 3D pose must be finite with determinant +1');
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){
  const d=R[i].reduce((sum,v,k)=>sum+v*R[j][k],0);
  if(Math.abs(d-(i===j?1:0))>1e-5)
   fail('Source-native rigid pose is not orthonormal');
 }
}
function members(plan){
 if(!Array.isArray(plan?.excludedFromHypotheticalStudyOnly)||
  !Array.isArray(plan?.unmodifiedOriginalSourceMotorPairs))
  fail('Missing complete original-source variant inventory');
 const excluded=new Set(plan.excludedFromHypotheticalStudyOnly);
 if(excluded.size!==plan.excludedFromHypotheticalStudyOnly.length)
  fail('Duplicate source-solid mask identifier');
 return {excluded,frame:Array.from({length:244},(_,i)=>i).filter(i=>!excluded.has(i))};
}
/** Browser must use the already verified v3.6 variant and v3.3 64-pose review. */
export function planX500VariantExactBrep(variant,variantByteSha256,contactReview,
 contactByteSha256,hypothesisId){
 if(variant?.schema!==VARIANT_SCHEMA||variant.authority!=='UNQUALIFIED_ASSEMBLY_PLAN_ONLY'||
  contactReview?.schema!=='aeroforge/x500-source-contact-browser-review/v3.3'||
  contactReview.authority!=='SOURCE_GEOMETRY_BROADPHASE_ONLY'||
  !hash.test(variantByteSha256)||!hash.test(contactByteSha256)||
  variant.source?.frameStepSha256!==ORIGINAL.frame.sha256||
  variant.source?.motorStepSha256!==ORIGINAL.motor.sha256||
  contactReview.sourceSha256?.frame!==ORIGINAL.frame.sha256||
  contactReview.sourceSha256?.motor!==ORIGINAL.motor.sha256)
  fail('Verified original STEP source and exact v3.3 / v3.6 report bytes required');
 for(const flag of falseKeys){requireFalse(variant,flag);requireFalse(contactReview,flag);}
 if(variant.scenarioMode!==VARIANT_MODES.REPLACE||
  variant.physicalExistingMotorRemovalAuthorized!==false||
  variant.originalGeometryWasModified!==false||
  variant.hypotheticalHistoricalComparison?.newExactBooleanResult!==null||
  variant.hypotheticalHistoricalComparison?.overlapVolumesRecomputedAfterMask!==false)
  fail('Exact BREP variant worker applies to new replacement proposals only');
 const site=MOTOR_SITES.find(s=>s.id===variant.targetSiteId);
 if(!site||site.framePatternId!==variant.targetFramePatternId||
  variant.proposedMotorModel!=='AIR2216II'||
  variant.unmodifiedOriginalSourceMotorPairs?.length!==4||
  variant.originalFrameSolidOccurrences!==244||
  variant.originalCollisionEvidence?.exactOriginalSourceRawPairs!==30||
  variant.originalCollisionEvidence?.exactOriginalPositivePairComparisons!==13||
  variant.originalCollisionEvidence?.distinctPositiveSourceGeometryGroups!==9)
  fail('Original source motor site or immutable historic BREP inventory changed');
 const {excluded,frame}=members(variant);
 if(excluded.size!==2||site.occurrences.some(i=>!excluded.has(i))||
  variant.hypotheticalFrameOccurrenceCount!==242||
  variant.unmodifiedOriginalSourceMotorPairs.some((s,i)=>
   s.siteId!==MOTOR_SITES[i].id||
   JSON.stringify(s.originalLeafIndexes)!==JSON.stringify(MOTOR_SITES[i].occurrences)||
   s.sourceCadGeometryUnmodified!==true))
  fail('Variant must mask exactly the two coincident existing motor source occurrences');
 const candidate=contactReview.candidates?.find(c=>c.id===hypothesisId);
 if(!candidate||candidate.framePatternId!==site.framePatternId||
  candidate.opposingSourceNormals!==true||
  candidate.exactBrepBooleanStatus!=='NOT_RUN'||
  candidate.physicalFitApproved!==false||
  candidate.flightApproved!==false||
  ![28,33].includes(candidate.motorPlaneFaceIndex)||
  ![103,105].includes(candidate.framePlaneFaceIndex))
  fail('Select an existing unqualified, opposing-normal original-source pose for the correct arm');
 checkPose(candidate.rotation3x3,candidate.nativeTranslationMm);
 const sourcePairs=candidate.modelAabbPairs;
 if(!Array.isArray(sourcePairs)||sourcePairs.length!==candidate.modelAabbPotentialPairs||
  sourcePairs.length<25||sourcePairs.length>40)
  fail('Complete v3.3 original-source broadphase is required');
 const originalPairIds=new Set();
 for(const p of sourcePairs){
  if(!Number.isInteger(p.frameSolidIndex)||p.frameSolidIndex<0||p.frameSolidIndex>=244||
   !Number.isInteger(p.motorSolidIndex)||p.motorSolidIndex<0||p.motorSolidIndex>=4||
   originalPairIds.has(p.frameSolidIndex+':'+p.motorSolidIndex))
   fail('Malformed original-source AABB pair index');
  originalPairIds.add(p.frameSolidIndex+':'+p.motorSolidIndex);
 }
 const pruned=sourcePairs.filter(p=>!excluded.has(p.frameSolidIndex));
 const mountingPlates={'arm-1':35,'arm-2':62,'arm-3':89,'arm-4':116};
 if(!pruned.some(p=>p.frameSolidIndex===mountingPlates[site.id]&&p.motorSolidIndex===0))
  fail('Original frame mounting plate solid absent from candidate broadphase');
 // The worker MUST recompute every source AABB, compare exact pair identity
 // against this discovery preflight, and then perform fresh BREP Booleans.
 const otherSites=MOTOR_SITES.filter(s=>s.id!==site.id)
   .flatMap(s=>s.occurrences);
 if(otherSites.some(i=>!frame.includes(i)))
  fail('A different original model motor site was dropped');
 return {
  schema:RUN_SCHEMA,authority:'ORIGINAL_SOURCE_BREP_EXECUTION_REQUEST_NOT_RESULT',
  source:{frameStepSha256:ORIGINAL.frame.sha256,motorStepSha256:ORIGINAL.motor.sha256,
   originalVariantJsonSha256:variantByteSha256,
   originalContactSurveyJsonSha256:contactByteSha256,
   originalAssemblyJsonSha256:variant.source.v35AssemblyReportSha256},
  scenarioMode:variant.scenarioMode,targetSiteId:site.id,
  pose:{id:candidate.id,originalMotorPlaneFaceIndex:candidate.motorPlaneFaceIndex,
   originalFramePlaneFaceIndex:candidate.framePlaneFaceIndex,
   rotation3x3:candidate.rotation3x3.map(r=>[...r]),
   nativeTranslationMm:[...candidate.nativeTranslationMm],
   opposingSourceNormals:true,actualMatingSurfaceQualified:false},
  memberSourceFrameSolidIndices:frame,
  explicitlyMaskedFrameSolidIndices:[...site.occurrences],
  memberSourceMotorSolidIndices:[0,1,2,3],
  expectedOriginalSourceAabbPairs:pruned.map(x=>({...x})),
  totalSourceFrameSolids:244,totalOriginalMotorSolids:4,
  mustReimportOriginalStepFiles:true,
  mustRecomputeAllAabbs:true,
  mustMatchOriginalAabbBroadphaseIdentity:true,
  mustEvaluateEveryAabbPositiveSourceSolidPair:true,
  originalCadFilesEdited:false,
  jobStatus:'NOT_EXECUTED',
  exactBrepPairCountEvaluated:0,
  manufacturerRevisionAuthenticated:false,
  physicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false,
  warning:'An immutable 3D CAD execution REQUEST, not a Boolean result. All 242 retained frame original-source solids and four motor solids must be independently screened from original STEP bytes. A zero modeled collision count cannot approve real motor fit.'
 };
}
/** A result can be complete or partial, but it can never certify hardware. */
export function reviewX500VariantBrepResult(run,result,runByteSha256){
 if(run?.schema!==RUN_SCHEMA||
  run.authority!=='ORIGINAL_SOURCE_BREP_EXECUTION_REQUEST_NOT_RESULT'||
  result?.schema!==RESULT_SCHEMA||!hash.test(runByteSha256)||
  result.sourcePlanJsonSha256!==runByteSha256||
  result.frameStepSha256!==ORIGINAL.frame.sha256||
  result.motorStepSha256!==ORIGINAL.motor.sha256||
  result.poseId!==run.pose.id||
  result.siteId!==run.targetSiteId)
  fail('Original source-bound fresh run/result byte provenance mismatch');
 for(const flag of falseKeys){requireFalse(run,flag);requireFalse(result,flag);}
 if(result.manufacturerRevisionAuthenticated!==false||
  result.exactModelNotPhysicalFit!==true||
  result.originalCadFilesEdited!==false||
  result.all244OriginalFrameSolidsAccountedFor!==true||
  !Array.isArray(result.pairs))
  fail('Incomplete source accounting or unjustified physical engineering status');
 const allowed=new Set(run.expectedOriginalSourceAabbPairs.map(x=>x.frameSolidIndex+':'+x.motorSolidIndex));
 const seen=new Set();let positive=0,max=0,subthreshold=0,maxSubthreshold=0,contact=0;
 let nearContact=0,minimumMeasuredClearanceMm=null;
 for(const pair of result.pairs){
  const key=pair.frameSolidIndex+':'+pair.motorSolidIndex;
  if(!Number.isInteger(pair.frameSolidIndex)||!Number.isInteger(pair.motorSolidIndex)||
   seen.has(key)||!allowed.has(key)||
   !['MODEL_POSITIVE_INTERSECTION','MODEL_ZERO_INTERSECTION',
    'INDETERMINATE_SUBTHRESHOLD_INTERSECTION',
    'INDETERMINATE_NONVOLUMETRIC_CONTACT','INDETERMINATE_GEOMETRIC_CONTACT',
    'INDETERMINATE_TIMEOUT',
    'INDETERMINATE_WORKER_ERROR'].includes(pair.status))
   fail('Duplicate, unplanned or unclassified original BREP source-solid pair');
  seen.add(key);
  if(pair.status==='MODEL_POSITIVE_INTERSECTION'){
   if(!finite(pair.modelIntersectionVolumeMm3)||
      pair.modelIntersectionVolumeMm3<=MODEL_VOLUME_THRESHOLD_MM3||
      pair.modelMinimumDistanceMm!==null)
    fail('Positive BREP model intersection requires volume above threshold');
   positive++;max=Math.max(max,pair.modelIntersectionVolumeMm3);
  }else if(pair.status==='MODEL_ZERO_INTERSECTION'){
   if(pair.modelIntersectionVolumeMm3!==0||
      !finite(pair.modelMinimumDistanceMm)||
      pair.modelMinimumDistanceMm<=MINIMUM_CONTACT_DISTANCE_MM)
    fail('Model-zero BREP requires an independent positive separation distance');
   minimumMeasuredClearanceMm=minimumMeasuredClearanceMm===null?
    pair.modelMinimumDistanceMm:Math.min(minimumMeasuredClearanceMm,pair.modelMinimumDistanceMm);
  }else if(pair.status==='INDETERMINATE_SUBTHRESHOLD_INTERSECTION'){
   if(!finite(pair.modelIntersectionVolumeMm3)||
      pair.modelIntersectionVolumeMm3<=0||
      pair.modelIntersectionVolumeMm3>MODEL_VOLUME_THRESHOLD_MM3||
      pair.modelMinimumDistanceMm!==null)
    fail('Subthreshold model penetration must retain its positive numeric volume');
   subthreshold++;
   maxSubthreshold=Math.max(maxSubthreshold,pair.modelIntersectionVolumeMm3);
  }else if(pair.status==='INDETERMINATE_NONVOLUMETRIC_CONTACT'){
   if(pair.modelIntersectionVolumeMm3!==0||pair.modelMinimumDistanceMm!==null)
    fail('Nonvolumetric BREP contact must retain zero volume and no measured gap');
   contact++;
  }else if(pair.status==='INDETERMINATE_GEOMETRIC_CONTACT'){
   if(pair.modelIntersectionVolumeMm3!==0||
      !finite(pair.modelMinimumDistanceMm)||
      pair.modelMinimumDistanceMm<0||
      pair.modelMinimumDistanceMm>MINIMUM_CONTACT_DISTANCE_MM)
    fail('Geometric contact must retain an independently measured near-zero gap');
   nearContact++;
  }else if(pair.modelIntersectionVolumeMm3!==null||
           pair.modelMinimumDistanceMm!==null){
   fail('Failed CAD Boolean must not assert any modeled intersection or distance');
  }
 }
 if(result.originalFrameSourceCount!==244||
  result.frameSolidMembersEvaluated!==242||
  result.motorSolidMembersEvaluated!==4||
  JSON.stringify(result.maskedFrameSolidIndices)!==
   JSON.stringify(run.explicitlyMaskedFrameSolidIndices)||
  result.broadPhaseRecomputedFromOriginalStep!==true||
  result.broadPhasePairIdentityMatched!==true||
  result.expectedPairCount!==allowed.size||
  result.pairs.length>allowed.size||
  result.complete!==(result.pairs.length===allowed.size))
  fail('AABB/variant membership or completed pair claim contradicts run contract');
 const indeterminate=result.pairs.filter(x=>x.status.startsWith('INDETERMINATE_')).length;
 const complete=result.complete&&indeterminate===0;
 const status=positive>0?'MODEL_INTERFERENCE_PRESENT':
  complete?'ALL_SCREENED_MODEL_PAIRS_ZERO_NOT_PHYSICAL_FIT':
  'INDETERMINATE_INCOMPLETE_OR_FAILED_BREP';
 return {
  schema:'aeroforge/x500-variant-brep-browser-review/v3.7',
  authority:'ONE_RESEARCH_ASSEMBLY_MODELED_ONLY',
  originalSourceFrameMembershipCount:242,
  numberOfExpectedPairs:allowed.size,
  evaluatedPairs:result.pairs.length,
  untestedOrIndeterminatePairs:allowed.size-result.pairs.length+indeterminate,
  modelPositivePairs:positive,
  largestPositiveModelOverlapMm3:max,
  subthresholdPositiveModelPairs:subthreshold,
  largestSubthresholdModelOverlapMm3:maxSubthreshold,
  nonvolumetricContactPairs:contact,
  minimumMeasuredSeparatedModelGapMm:minimumMeasuredClearanceMm,
  geometricNearContactPairs:nearContact,
  modeledStatus:status,workerComplete:complete,
  manufacturerMotorCompatibilityVerified:false,
  physicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false,
  warning:'A bounded exact source-CAD Boolean result for one hypothetical replacement pose is not validated real physical fit, fastener engagement, hardware part authenticity or flight safety.'
 };
}
