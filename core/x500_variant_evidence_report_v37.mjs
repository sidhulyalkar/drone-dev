/** Deterministic, source-redacted v3.7 model-only evidence report.
 * This is a reviewed *operator-submitted* worker receipt, NOT independent
 * authentication of the STEP files, kernel execution or physical hardware.
 */
import {reviewX500VariantBrepResult} from './x500_variant_exact_brep_v37.mjs';

export const REPORT_SCHEMA='aeroforge/x500-variant-model-evidence-report/v3.7';
const sha256=/^[0-9a-f]{64}$/;
const fail=message=>{throw Error('X500 model evidence report rejected: '+message);};
const MODEL_ZERO='MODEL_ZERO_INTERSECTION';
const NOT_EXECUTED='NOT_EXECUTED';
const REQUIREMENTS=Object.freeze([
 ['assemblyOccurrenceIdentity','Unverified cross-import XCAF occurrence-to-solid crosswalk'],
 ['physicalMotorRevision','Motor identity, revision and installed hardware not authenticated'],
 ['mountingFaces','Mating faces and datum features not physically qualified'],
 ['fastenersAndEngagement','Fastener diameter, thread, engagement and access not verified'],
 ['manufacturingTolerance','Geometric variation, fit tolerance and assembly process not measured'],
 ['electricalCompatibility','Electrical, ESC and power compatibility not established'],
 ['propulsionAndLoads','Motor/propulsion loads and mechanical strength not qualified'],
 ['flightSafety','No flight-system approval or flight testing']
]);

/** No source CAD, raw upstream reports or private filenames are embedded. */
export function buildX500VariantEvidenceReport(plan,receipt,planSha,receiptSha){
 if(!sha256.test(planSha)||!sha256.test(receiptSha))
  fail('Exact plan and worker-result SHA-256 receipts required');
 // Always re-validate from raw data. Never trust a caller-supplied summary.
 const review=reviewX500VariantBrepResult(plan,receipt,planSha);
 const expected=plan.expectedOriginalSourceAabbPairs;
 if(!Array.isArray(expected)||expected.length===0)
  fail('No permitted original source-solid pairs');
 const received=new Map(receipt.pairs.map(p=>[
  p.frameSolidIndex+':'+p.motorSolidIndex,p
 ]));
 const pairs=expected.map(pair=>{
  const frameSolidIndex=pair.frameSolidIndex;
  const motorSolidIndex=pair.motorSolidIndex;
  const observed=received.get(frameSolidIndex+':'+motorSolidIndex);
  return {
   frameSolidIndex,motorSolidIndex,
   status:observed?.status??NOT_EXECUTED,
   modelIntersectionVolumeMm3:observed?observed.modelIntersectionVolumeMm3:null,
   modelMinimumDistanceMm:observed?observed.modelMinimumDistanceMm:null
  };
 });
 const count=status=>pairs.filter(p=>p.status===status).length;
 const unexecuted=count(NOT_EXECUTED);
 const zero=count(MODEL_ZERO);
 const positive=count('MODEL_POSITIVE_INTERSECTION');
 const ambiguous=count('INDETERMINATE_SUBTHRESHOLD_INTERSECTION')+
   count('INDETERMINATE_NONVOLUMETRIC_CONTACT')+
   count('INDETERMINATE_GEOMETRIC_CONTACT');
 const errors=count('INDETERMINATE_TIMEOUT')+
   count('INDETERMINATE_WORKER_ERROR');
 if(pairs.length!==review.numberOfExpectedPairs||
    positive!==review.modelPositivePairs||
    ambiguous+errors+unexecuted!==review.untestedOrIndeterminatePairs)
  fail('Pair-count reconciliation failed');
 const status=review.modeledStatus;
 const modelAssessment=status==='MODEL_INTERFERENCE_PRESENT'?
  'MODELED_INTERFERENCE':review.workerComplete?
  'MODELED_SEPARATION_ONLY':'INDETERMINATE';
 const modelIssue=modelAssessment==='MODELED_INTERFERENCE'?
  'One or more recorded source model intersections are positive':
  modelAssessment==='MODELED_SEPARATION_ONLY'?
  'All planned pair receipts report model zero with independent minimum-distance witnesses; source execution and real-world tolerance remain unverified':
  'At least one planned pair is missing, failed, contacting or numerically ambiguous';
 return {
  schema:REPORT_SCHEMA,
  authority:'OPERATOR_SUBMITTED_SOURCE_LINKED_MODEL_RECEIPT_NOT_PHYSICAL_APPROVAL',
  provenance:{
   originalFrameStepSha256:receipt.frameStepSha256,
   candidateMotorStepSha256:receipt.motorStepSha256,
   exactPlanJsonSha256:planSha,
   exactWorkerResultJsonSha256:receiptSha,
   siteId:plan.targetSiteId,
   poseId:plan.pose.id,
   explicitlyMaskedFrameSolidIndices:[...plan.explicitlyMaskedFrameSolidIndices],
   sourceCadBytesEmbedded:false,
   rawSourceReportsEmbedded:false,
   sourceExecutionIndependentlyAttested:false,
   cadKernelBuildIndependentlyAttested:false
  },
  coverage:{
   plannedPairs:pairs.length,recordedPairs:receipt.pairs.length,
   unexecutedPairs:unexecuted,
   modelZeroPairs:zero,
   positiveModelOverlapPairs:positive,
   ambiguousOrContactPairs:ambiguous,
   timeoutOrErrorPairs:errors,
   allModelPairsConclusive:review.workerComplete,
   sourceBroadPhaseRecomputedByWorkerReported:receipt.broadPhaseRecomputedFromOriginalStep,
   historicalPairSetMatchedByWorkerReported:receipt.broadPhasePairIdentityMatched,
   originalFrameSourceCountReported:receipt.originalFrameSourceCount,
   frameSourceMembersReported:receipt.frameSolidMembersEvaluated,
   motorSourceMembersReported:receipt.motorSolidMembersEvaluated
  },
  modelAssessment:{
   result:status,
   level:modelAssessment,
   explanation:modelIssue,
   largestPositiveOverlapMm3:review.largestPositiveModelOverlapMm3,
   largestAmbiguousPositiveOverlapMm3:review.largestSubthresholdModelOverlapMm3,
   minimumReportedSeparatedModelGapMm:review.minimumMeasuredSeparatedModelGapMm,
   physicalFitInferred:false
  },
  requirements:[
   {id:'modeledPairAssessment',status:modelAssessment,
    explanation:modelIssue},
   ...REQUIREMENTS.map(([id,explanation])=>({
    id,status:'NOT_VERIFIED',explanation
   }))
  ],
  pairEvidence:pairs,
  claimedOriginalSourceExecutionVerified:false,
  independentlyReproduced:false,
  manufacturerRevisionAuthenticated:false,
  physicalFitApproved:false,
  procurementApproved:false,
  powerApproved:false,
  flightApproved:false,
  limitations:[
   'Raw source STEP and historical source reports are not embedded in this portable report',
   'A valid worker receipt cannot independently authenticate execution or original source part identity',
   'A nominal CAD gap is not proof of real mounting, tolerances, or electrical/flight safety',
   'The historical strict broadphase cannot establish complete near-contact coverage without original-source reexecution',
   'Original per-solid occurrence identity and cross-kernel numeric reproducibility remain unqualified'
  ]
 };
}
