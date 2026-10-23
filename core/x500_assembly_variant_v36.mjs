/** v3.6 controlled, *hypothetical* assembly composition research.
 * Never mutate original STEP, existing assembly, original exact Boolean rows,
 * or mechanical/power/flight status. A filtered historical report is NOT a
 * fresh Boolean evaluation or physical fit evidence.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as SOURCE} from './x500_real_source_observations_v28.mjs';

export const VARIANT_SCHEMA='aeroforge/x500-unqualified-assembly-variant/v3.6';
export const VARIANT_MODES=Object.freeze({
 RETAIN:'RETAIN_ORIGINAL_SOURCE_CAD_MOTOR',
 REPLACE:'HYPOTHETICAL_AIR2216II_REPLACEMENT'
});
export const MOTOR_SITES=Object.freeze([
 {id:'arm-1',framePatternId:'frame-quadrant-nn',canonical:56,
  occurrences:[56,189],armPath:'HMX5V-ARM-V1_ASM:1'},
 {id:'arm-2',framePatternId:'frame-quadrant-np',canonical:83,
  occurrences:[83,191],armPath:'HMX5V-ARM-V1_ASM:2'},
 {id:'arm-3',framePatternId:'frame-quadrant-pp',canonical:110,
  occurrences:[110,190],armPath:'HMX5V-ARM-V1_ASM:3'},
 {id:'arm-4',framePatternId:'frame-quadrant-pn',canonical:137,
  occurrences:[137,188],armPath:'HMX5V-ARM-V1_ASM:4'}
]);
const sha=/^[0-9a-f]{64}$/;
const fail=message=>{throw Error('X500 assembly variant blocked: '+message);};
const denyClaims=obj=>{
 for(const key of ['physicalFitApproved','flightApproved','powerApproved',
  'procurementApproved','selectedPhysicalBomQualified',
  'candidateMotorInterchangeabilityApproved','actualInstalledPartCountQualified',
  'hardwareInstallationApproved']){
  if(obj?.[key]!==false)fail('Unqualified source declared verified hardware: '+key);
 }
};

function confirmInputs(review,sourceReport,sourceReportHash){
 if(!sha.test(sourceReportHash)||
  review?.schema!=='aeroforge/x500-xcaf-assembly-browser-review/v3.5'||
  review.authority!=='SOURCE_STEP_COMPONENT_NAMES_NOT_MANUFACTURER_BOM'||
  sourceReport?.schema!=='aeroforge/x500-xcaf-assembly-identity/v3.5'||
  sourceReport.source?.frameStepSha256!==SOURCE.frame.sha256||
  sourceReport.source?.motorStepSha256!==SOURCE.motor.sha256||
  sourceReport.flatSourceSolidCount!==244||
  sourceReport.sourceLeafInstances?.length!==244||
  review.totalSourceLeaves!==244||review.rootComponentOccurrences!==111||
  review.sourceMotorModel!=='DJ-2216-KV880'||
  review.candidateReplacementMotorModel!=='AIR2216II'||
  review.existingSourceMotorModelOccurrences!==8||
  review.coincidentMotorGeometryGroups!==4||
  review.distinctModelInterferenceGroups!==9||
  review.originalRawPositiveModelComparisons!==13||
  review.sourceModelInterferenceStillPresent!==true)
  fail('Full hash-verified original v3.5 STEP assembly evidence is required');
 denyClaims(review);
 for(const flag of ['frameStepMotorAndSeparateCandidateInterchangeabilityVerified',
  'frameStepMotorAndSeparateCandidateSamePartVerified',
  'installedMotorCountVerified','manufacturerBomIndependentlyVerified',
  'selectedAssemblyVariantIndependentlyVerified','physicalMotorSeatQualified',
  'fastenerCompatibilityVerified','physicalFitApproved','procurementApproved',
  'powerApproved','flightApproved']){
  if(sourceReport[flag]!==false)fail('Original source hierarchy contains unauthorized physical claims');
 }
 const nodes=sourceReport.sourceLeafInstances;
 for(let i=0;i<244;i++){
  if(nodes[i]?.flatSolidIndex!==i||
   nodes[i].sourcePartCountOrRealPresenceVerified!==false)
   fail('Source part index/qualification changed');
 }
 const allIds=new Set(),definitions=new Set();
 for(const site of MOTOR_SITES){
  const [nestedIndex,topIndex]=site.occurrences;
  const nested=nodes[nestedIndex],top=nodes[topIndex];
  if(!nested||!top||nested.sourceDefinitionLabel!==top.sourceDefinitionLabel||
   !nested.sourceComponentName.startsWith('DJ-2216-KV880:')||
   !top.sourceComponentName.startsWith('DJ-2216-KV880:')||
   nested.assemblyPath?.length!==3||top.assemblyPath?.length!==2||
   nested.assemblyPath[1]!==site.armPath||
   nested.assemblyPath.at(-1)!==nested.sourceComponentName||
   top.assemblyPath.at(-1)!==top.sourceComponentName)
   fail('Preexisting source CAD motor occurrence identity was changed at '+site.id);
  definitions.add(nested.sourceDefinitionLabel);
  for(const i of site.occurrences){
   if(allIds.has(i))fail('Duplicate source motor leaf reused across sites');
   allIds.add(i);
  }
 }
 if(allIds.size!==8||definitions.size!==1)
  fail('Original preinstalled motor source definition graph changed');
 const names=review.namedCollisionGroups;
 if(!Array.isArray(names)||names.length!==26||
  names.filter(x=>x.modeledCollisionPresent).length!==9)
  fail('The original exact BREP collision evidence is incomplete');
 const ids=new Set();
 for(const row of names){
  const key=row.canonicalFrameSolidIndex+':'+row.motorSolidIndex;
  if(ids.has(key)||!Number.isInteger(row.canonicalFrameSolidIndex)||
   !Number.isInteger(row.motorSolidIndex)||
   row.canonicalFrameSolidIndex<0||row.canonicalFrameSolidIndex>=244||
   row.motorSolidIndex<0||row.motorSolidIndex>=4||
   !Array.isArray(row.originalFrameSolidIndices)||
   row.originalFrameSolidIndices.some(i=>!Number.isInteger(i)||i<0||i>=244)||
   row.frameOccurrenceNames?.length!==row.originalFrameSolidIndices.length||
   row.physicalHardwareInstalledOrExcludedConfirmed!==false)
   fail('Original full collision row source identifiers not preserved');
  for(let i=0;i<row.originalFrameSolidIndices.length;i++){
   if(row.frameOccurrenceNames[i]!==nodes[row.originalFrameSolidIndices[i]].sourceComponentName)
    fail('Named source BREP collision row does not match XCAF source leaves');
  }
  ids.add(key);
 }
 const oldMotor=names.filter(row=>row.modeledCollisionPresent&&row.canonicalFrameSolidIndex===56);
 const retained=names.filter(row=>row.modeledCollisionPresent&&
  [39,57,58,59,60].includes(row.canonicalFrameSolidIndex));
 if(oldMotor.length!==4||retained.length!==5)
  fail('Original nine modeled collision identities are incomplete');
}

/** Explicit distinction between component alternatives and measured hardware. */
export function createX500UnqualifiedVariant(review,sourceReport,sourceReportHash,
 {mode=VARIANT_MODES.RETAIN,siteId='arm-1'}={}){
 confirmInputs(review,sourceReport,sourceReportHash);
 const site=MOTOR_SITES.find(s=>s.id===siteId);
 if(!site)fail('Select one of the four original STEP-defined arm positions');
 if(!Object.values(VARIANT_MODES).includes(mode))
  fail('Unknown or unsupported assembly configuration');
 const replacing=mode===VARIANT_MODES.REPLACE;
 const excluded=replacing?[...site.occurrences]:[];
 const originalRows=review.namedCollisionGroups.map(x=>({
  canonicalFrameSolidIndex:x.canonicalFrameSolidIndex,
  motorSolidIndex:x.motorSolidIndex,
  originalFrameSolidIndices:[...x.originalFrameSolidIndices],
  componentLabels:[...x.frameOccurrenceNames],
  modelOverlapObserved:x.modeledCollisionPresent,
  originalConservativeOverlapMm3:x.conservativeModelOverlapMm3,
  includedInHypotheticalMask:!excluded.some(i=>x.originalFrameSolidIndices.includes(i)),
  measuredRevisedCollisionVolumeMm3:null
 }));
 const originalPositives=originalRows.filter(x=>x.modelOverlapObserved).length;
 if(originalPositives!==9)fail('Original source model overlap blockers changed');
 const comparable=replacing&&site.id==='arm-1';
 const hypotheticalSubset=comparable?originalRows.filter(x=>x.includedInHypotheticalMask):[];
 if(comparable&&(hypotheticalSubset.length!==22||
    hypotheticalSubset.filter(x=>x.modelOverlapObserved).length!==5))
   fail('Hypothetical first-site mask does not preserve all bracket and fastener model blockers');
 const modelOnlyEvidenceStatus=!replacing?
  'NOT_APPLICABLE_NO_AIR2216II_INSERTED':
  comparable?'FILTERED_HISTORICAL_BREP_NOT_REEXECUTED':
   'NO_EXACT_BREP_BATCH_FOR_REQUESTED_SITE';
 return {
  schema:VARIANT_SCHEMA,authority:'UNQUALIFIED_ASSEMBLY_PLAN_ONLY',
  source:{frameStepSha256:SOURCE.frame.sha256,
   motorStepSha256:SOURCE.motor.sha256,v35AssemblyReportSha256:sourceReportHash},
  scenarioMode:mode,targetSiteId:site.id,targetFramePatternId:site.framePatternId,
  originalSourceMotorModel:'DJ-2216-KV880',
  proposedMotorModel:replacing?'AIR2216II':null,
  availableAlternatives:['DJ-2216-KV880','AIR2216II'],
  originalFrameSolidOccurrences:244,originalSpatialGeometryGroups:240,
  excludedFromHypotheticalStudyOnly:excluded,
  hypotheticalFrameOccurrenceCount:244-excluded.length,
  unmodifiedOriginalSourceMotorPairs:MOTOR_SITES.map(s=>({
   siteId:s.id,originalLeafIndexes:[...s.occurrences],
   nestedArmPath:s.armPath,sourceCadGeometryUnmodified:true,
   physicalMotorPresentVerified:false
  })),
  originalCollisionEvidence:{
   candidateAIR2216IIOverlayPose:'frame-quadrant-nn-orientation-1-motor-plane-28-frame-plane-103',
   exactOriginalSourceRawPairs:30,
   exactOriginalPositivePairComparisons:13,
   distinctPositiveSourceGeometryGroups:9,
   sourceOriginalRows:originalRows
  },
  hypotheticalHistoricalComparison:{
   status:modelOnlyEvidenceStatus,
   originalDistinctPairsComparable:comparable?26:null,
   sourceGeometryPairsAfterModelMask:comparable?22:null,
   historicallyPositivePairsAmongUnmasked:comparable?5:null,
   overlapVolumesRecomputedAfterMask:false,
   newExactBooleanResult:null,
   originalModelRemainingInterferenceUnresolved:true,
   note:comparable?
    'Removing both coincident old-motor CAD leaves from an imaginary replacement mask makes 22 original source-pair groups comparable. Five historical positive groups remain, including bracket/fastener-like solids. No actual new Boolean operation was run.':
    'The original v3.3 AIR2216II Boolean batch was only for the arm-1 overlay pose. This scenario has no applicable new collision result.'
  },
  engineeringGates:{
   manufacturerPartRevisionVerified:false,
   actualReceivedHardwareIdentified:false,
   sourceVsPhysicalAssemblyReconciled:false,
   motorMountingSeatVerified:false,
   fastenerThreadsAndEngagementVerified:false,
   originalAssemblyVariantApproved:false,
   exactBrepOnSelectedVariantCompleted:false,
   uncertaintyAndToleranceStackCompleted:false,
   motorEscElectricalCompatibilityVerified:false,
   propellerAndAirframeClearanceVerified:false
  },
  originalGeometryWasModified:false,
  physicalExistingMotorRemovalAuthorized:false,
  mechanicallyCompatible:false,
  replacementApproved:false,
  selectedPhysicalBomQualified:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'A hypothetical configuration masks source CAD occurrences in a research plan only. Nothing is deleted from original STEP files. Historical exact Boolean volumes are NEVER reinterpreted as a fresh post-replacement intersection result. Five nonmotor model overlaps remain in the arm-1 overlay history.'
 };
}
