/** v3.5: validate AP214 XCAF assembly-name lineage against all original 244
 * flat source solids and unmodified exact BREP collision group witnesses.
 * XCAF names are UNAUTHENTICATED source CAD labels, not OEM BOM authority.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as ORIGINAL} from './x500_real_source_observations_v28.mjs';
export const ASSEMBLY_SCHEMA='aeroforge/x500-xcaf-assembly-identity/v3.5';
const sha=/^[0-9a-f]{64}$/;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=msg=>{throw Error('X500 STEP assembly hierarchy rejected: '+msg);};
const duplicates=[[56,189],[83,191],[110,190],[137,188]];
const alias={188:137,189:56,190:110,191:83};
function falseFlags(obj,keys){
 for(const k of keys)if(obj?.[k]!==false)fail('Source hierarchy elevated hardware authorization '+k);
}
const delta=(a,b)=>{
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==6||b.length!==6||
  a.some(x=>!finite(x))||b.some(x=>!finite(x)))fail('Invalid original source axis bounds');
 return Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
};
export function reviewX500AssemblyHierarchy(report,rawV28,actualV28Sha,
 v34Review,actualV34Sha){
 if(report?.schema!==ASSEMBLY_SCHEMA||
  v34Review?.schema!=='aeroforge/x500-source-occurrence-browser-review/v3.4'||
  v34Review.authority!=='REPEATED_CAD_GEOMETRY_NOT_OEM_BOM'||
  !sha.test(actualV28Sha)||!sha.test(actualV34Sha))
  fail('Exact v2.8 original flat-solid inventory and v3.4 collision audit required');
 if(report.source?.frameStepSha256!==ORIGINAL.frame.sha256||
  report.source?.motorStepSha256!==ORIGINAL.motor.sha256||
  report.source.sourceV34ByteSha256!==actualV34Sha||
  report.source.v28FlatInventoryByteSha256!==actualV28Sha||
  report.source.frameImportedSolids!==244||report.source.motorImportedSolids!==4||
  rawV28?.sha256!==ORIGINAL.frame.sha256||
  rawV28.solidCount!==244||!Array.isArray(rawV28.solids)||
  rawV28.solids.length!==244)
  fail('Exact source STEP hashes or flat original solid inventory disagree');
 if(report.stepFileSchema!=='AUTOMOTIVE_DESIGN_AP214'||
  report.sourceAssemblyName!=='(Unsaved)'||
  report.sourceRootComponentCount!==111||
  report.flatSourceSolidCount!==244||
  report.flatIndexMappingMode!=='XCAF_DEPTH_FIRST_LEAF_ORDER_CROSSCHECKED_244_AABB_MATCHES'||
  !Array.isArray(report.sourceLeafInstances)||report.sourceLeafInstances.length!==244||
  !finite(report.maxFlatToSourceAabbInflationDifferenceMm)||
  report.maxFlatToSourceAabbInflationDifferenceMm>6||
  !finite(report.maxNearestLeafAabbInflationDifferenceMm)||
  report.maxNearestLeafAabbInflationDifferenceMm>6)
  fail('AP214 source assembly leaf-to-flat CAD index correspondence changed');
 falseFlags(report,['frameStepMotorAndSeparateCandidateInterchangeabilityVerified',
  'frameStepMotorAndSeparateCandidateSamePartVerified','installedMotorCountVerified',
  'manufacturerBomIndependentlyVerified','selectedAssemblyVariantIndependentlyVerified',
  'physicalMotorSeatQualified','fastenerCompatibilityVerified',
  'procurementApproved','physicalFitApproved','powerApproved','flightApproved']);
 if(report.sourceAssemblyOccurrenceTreeRecovered!==true||
  report.sourceNamedMotorModel!=='DJ-2216-KV880'||
  report.separateCandidateMotorSourceName!=='AIR2216II'||
  report.frameStepMotorModelOccurrences!==8||
  report.sourceModelInterferenceRemains!==true||
  report.sourceModelRawCollisionPositivePairs!==13||
  report.sourceModelDistinctPositiveGroups!==9||
  JSON.stringify(report.frameStepCoincidentMotorModelPairs)!==JSON.stringify(duplicates))
  fail('Source named motor duplicates or required unresolved collision status changed');
 const uniquePaths=new Set();
 for(let i=0;i<244;i++){
  const row=report.sourceLeafInstances[i],original=rawV28.solids[i];
  if(row?.flatSolidIndex!==i||original.index!==i||
   typeof row.sourceComponentName!=='string'||!row.sourceComponentName.trim()||
   typeof row.sourceDefinitionName!=='string'||!row.sourceDefinitionName.trim()||
   row.sourcePartCountOrRealPresenceVerified!==false||
   typeof row.sourceDefinitionLabel!=='string'||!row.sourceDefinitionLabel.startsWith('0:1:1:')||
   typeof row.sourceOccurrenceLabel!=='string'||!row.sourceOccurrenceLabel.startsWith('0:1:1:')||
   !Array.isArray(row.assemblyPath)||!Array.isArray(row.assemblyLabelPath)||
   row.assemblyPath.length!==row.assemblyLabelPath.length||
   ![2,3].includes(row.assemblyPath.length)||
   row.assemblyPath[0]!=='(Unsaved)'||
   row.assemblyPath.at(-1)!==row.sourceComponentName)
   fail('Malformed original named STEP assembly leaf '+i);
  const key=row.assemblyPath.join('::');
  if(uniquePaths.has(key))fail('Duplicate named assembly path not disambiguated: '+i);
  uniquePaths.add(key);
  const own=delta(original.boundsKernelMm,row.sourceInstanceBoundsKernelMm);
  if(own>6||!finite(row.flatIndexBoundingAabbDisagreementMm)||
    Math.abs(own-row.flatIndexBoundingAabbDisagreementMm)>.00001)
   fail('Original source leaf geometry does not match indexed flattened solid '+i);
  let closest=-1,best=Infinity;
  for(let j=0;j<244;j++){
   const d=delta(original.boundsKernelMm,
    report.sourceLeafInstances[j].sourceInstanceBoundsKernelMm);
   if(d<best){closest=j;best=d;}
  }
  if(closest!==row.nearestXcafLeafIndex||
   closest!==(alias[i]??i))
   fail('Source-to-assembly leaf traversal changes original face index semantics at '+i);
 }
 for(const [a,b] of duplicates){
  const nested=report.sourceLeafInstances[a],root=report.sourceLeafInstances[b];
  if(!nested.sourceComponentName.startsWith('DJ-2216-KV880:')||
   !root.sourceComponentName.startsWith('DJ-2216-KV880:')||
   nested.sourceDefinitionLabel!==root.sourceDefinitionLabel||
   nested.assemblyPath.length!==3||root.assemblyPath.length!==2||
   !nested.assemblyPath[1].startsWith('HMX5V-ARM-V1_ASM:'))
   fail('Repeated motor CAD source occurrence is not nested into the reported arm assembly');
 }
 const motorNodes=report.sourceLeafInstances.filter(x=>x.sourceComponentName.startsWith('DJ-2216-KV880:'));
 if(motorNodes.length!==8)fail('Named existing source motor instances incomplete');
 if(report.sourceLeafInstances[39].sourceComponentName!=='BAN-DJ-DIAN-F2:1'||
  [57,58,59,60].some((i,k)=>report.sourceLeafInstances[i].sourceComponentName!=='GB70-M3-6:'+(k+1)))
  fail('Collision-side bracket-like/fastener-like original STEP labels changed');
 if(!Array.isArray(report.collisionGroups)||report.collisionGroups.length!==26||
  v34Review.collisionPairs?.length!==26)
  fail('Original 26 exact BREP source geometry groups omitted');
 let positive=0,existingMotor=0,bracket=0,fastenerLike=0;
 for(const row of report.collisionGroups){
  const before=v34Review.collisionPairs.find(x=>
    x.canonicalFrameSolidIndex===row.canonicalFrameSolidIndex&&
    x.motorSolidIndex===row.motorSolidIndex);
  if(!before||!Array.isArray(row.originalFrameSolidIndices)||
   JSON.stringify(row.originalFrameSolidIndices)!==JSON.stringify(before.originalFrameSolidIndices)||
   row.sourceModelInterferencePresent!==before.modeledCollisionPresent||
   Math.abs(row.conservativeModelOverlapMm3-before.conservativeModelOverlapMm3)>.000001||
   row.selectedHardwareConfigurationVerified!==false||
   JSON.stringify(row.frameOccurrenceNames)!==JSON.stringify(
     before.originalFrameSolidIndices.map(i=>report.sourceLeafInstances[i].sourceComponentName))||
   JSON.stringify(row.frameAssemblyPaths)!==JSON.stringify(
     before.originalFrameSolidIndices.map(i=>report.sourceLeafInstances[i].assemblyPath)))
   fail('Named source components disagree with original unchanged exact CAD collision pair');
  if(row.sourceModelInterferencePresent){
   positive++;
   if(row.canonicalFrameSolidIndex===56)existingMotor++;
   else if(row.canonicalFrameSolidIndex===39)bracket++;
   else if([57,58,59,60].includes(row.canonicalFrameSolidIndex))fastenerLike++;
   else fail('An unclassified positive original solid was silently inserted');
  }
 }
 if(positive!==9||existingMotor!==4||bracket!==1||fastenerLike!==4)
  fail('Nine persistent source model collisions cannot be explained by named original CAD leaves');
 return {
  schema:'aeroforge/x500-xcaf-assembly-browser-review/v3.5',
  authority:'SOURCE_STEP_COMPONENT_NAMES_NOT_MANUFACTURER_BOM',
  totalSourceLeaves:244,rootComponentOccurrences:111,
  sourceMotorModel:'DJ-2216-KV880',
  candidateReplacementMotorModel:'AIR2216II',
  existingSourceMotorModelOccurrences:8,
  coincidentMotorGeometryGroups:4,
  namedCollisionGroups:report.collisionGroups.map(x=>({
   canonicalFrameSolidIndex:x.canonicalFrameSolidIndex,
   motorSolidIndex:x.motorSolidIndex,
   frameOccurrenceNames:[...x.frameOccurrenceNames],
   frameAssemblyPaths:x.frameAssemblyPaths.map(p=>[...p]),
   originalFrameSolidIndices:[...x.originalFrameSolidIndices],
   conservativeModelOverlapMm3:x.conservativeModelOverlapMm3,
   modeledCollisionPresent:x.sourceModelInterferencePresent,
   physicalHardwareInstalledOrExcludedConfirmed:false
  })),
  originalRawPositiveModelComparisons:13,
  distinctModelInterferenceGroups:9,
  positiveWithPreexistingModeledMotor:4,
  positiveWithBracketLikeSourceLabel:1,
  positiveWithFastenerLikeSourceLabel:4,
  sourceModelInterferenceStillPresent:true,
  candidateMotorInterchangeabilityApproved:false,
  actualInstalledPartCountQualified:false,
  selectedPhysicalBomQualified:false,
  hardwareInstallationApproved:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'The frame STEP already includes DJ-2216-KV880 model geometry at all four corners. AIR2216II must be evaluated as an independently approved replacement candidate, NOT simply an additive fifth motor. All original model intersections are preserved. Neither CAD labels nor coincidence certify real OEM BOM or hardware compatibility.'
 };
}
