import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {createX500UnqualifiedVariant,VARIANT_MODES,MOTOR_SITES}
 from '../core/x500_assembly_variant_v36.mjs';
const RECEIPT='a'.repeat(64);
function fixture(){
 const pairs=[[56,189,'arm-1'],[83,191,'arm-2'],
  [110,190,'arm-3'],[137,188,'arm-4']];
 const nodes=Array.from({length:244},(_,i)=>({
  flatSolidIndex:i,sourcePartCountOrRealPresenceVerified:false,
  sourceComponentName:'STEP-PART-'+i+':1',
  assemblyPath:['(Unsaved)','STEP-PART-'+i+':1'],
  sourceDefinitionLabel:'0:1:1:'+(i+100)
 }));
 for(const [nested,top,site] of pairs){
  const number=Number(site.slice(-1)),def='0:1:1:25';
  nodes[nested]={...nodes[nested],sourceComponentName:'DJ-2216-KV880:1',
   sourceDefinitionLabel:def,
   assemblyPath:['(Unsaved)','HMX5V-ARM-V1_ASM:'+number,'DJ-2216-KV880:1']};
  nodes[top]={...nodes[top],sourceComponentName:'DJ-2216-KV880:'+(number+1),
   sourceDefinitionLabel:def,
   assemblyPath:['(Unsaved)','DJ-2216-KV880:'+(number+1)]};
 }
 nodes[39].sourceComponentName='BAN-DJ-DIAN-F2:1';
 for(let i=57;i<=60;i++)nodes[i].sourceComponentName='GB70-M3-6:'+(i-56);
 const positive=[
  ...Array.from({length:4},(_,i)=>[56,i]),
  [39,0],[57,0],[58,0],[59,0],[60,0]
 ];
 const negatives=Array.from({length:17},(_,i)=>[150+i,0]);
 const rows=[...positive,...negatives].map(([f,m])=>({
  canonicalFrameSolidIndex:f,motorSolidIndex:m,
  originalFrameSolidIndices:f===56?[56,189]:[f],
  frameOccurrenceNames:(f===56?[56,189]:[f]).map(i=>nodes[i].sourceComponentName),
  physicalHardwareInstalledOrExcludedConfirmed:false,
  modeledCollisionPresent:positive.some(x=>x[0]===f&&x[1]===m),
  conservativeModelOverlapMm3:f===56?5491.38771511:51.41321402
 }));
 const review={
  schema:'aeroforge/x500-xcaf-assembly-browser-review/v3.5',
  authority:'SOURCE_STEP_COMPONENT_NAMES_NOT_MANUFACTURER_BOM',
  totalSourceLeaves:244,rootComponentOccurrences:111,
  sourceMotorModel:'DJ-2216-KV880',candidateReplacementMotorModel:'AIR2216II',
  existingSourceMotorModelOccurrences:8,coincidentMotorGeometryGroups:4,
  originalRawPositiveModelComparisons:13,distinctModelInterferenceGroups:9,
  sourceModelInterferenceStillPresent:true,
  actualInstalledPartCountQualified:false,selectedPhysicalBomQualified:false,
  candidateMotorInterchangeabilityApproved:false,hardwareInstallationApproved:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  namedCollisionGroups:rows
 };
 const raw={
  schema:'aeroforge/x500-xcaf-assembly-identity/v3.5',
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256},
  flatSourceSolidCount:244,sourceLeafInstances:nodes,
  frameStepMotorAndSeparateCandidateInterchangeabilityVerified:false,
  frameStepMotorAndSeparateCandidateSamePartVerified:false,
  installedMotorCountVerified:false,manufacturerBomIndependentlyVerified:false,
  selectedAssemblyVariantIndependentlyVerified:false,
  physicalMotorSeatQualified:false,fastenerCompatibilityVerified:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false
 };
 return {review,raw};
}
const solve=(x,opts)=>createX500UnqualifiedVariant(x.review,x.raw,RECEIPT,opts);
test('retaining source motor does not add AIR, reuse replacement collision volume or edit STEP',()=>{
 const x=fixture(),original=JSON.stringify(x);
 const result=solve(x,{mode:VARIANT_MODES.RETAIN,siteId:'arm-1'});
 assert.deepEqual(result.excludedFromHypotheticalStudyOnly,[]);
 assert.equal(result.proposedMotorModel,null);
 assert.equal(result.hypotheticalFrameOccurrenceCount,244);
 assert.equal(result.hypotheticalHistoricalComparison.status,'NOT_APPLICABLE_NO_AIR2216II_INSERTED');
 assert.equal(result.hypotheticalHistoricalComparison.newExactBooleanResult,null);
 assert.equal(result.originalCollisionEvidence.exactOriginalPositivePairComparisons,13);
 assert.equal(result.originalCollisionEvidence.distinctPositiveSourceGeometryGroups,9);
 assert.equal(result.physicalFitApproved,false);
 assert.equal(JSON.stringify(x),original,'input evidence must never be modified');
});
test('first-arm replacement masks only both coincident old-motor CAD references, not bracket/bolts',()=>{
 const x=fixture(),original=JSON.stringify(x);
 const result=solve(x,{mode:VARIANT_MODES.REPLACE,siteId:'arm-1'});
 assert.deepEqual(result.excludedFromHypotheticalStudyOnly,[56,189]);
 assert.equal(result.hypotheticalFrameOccurrenceCount,242);
 assert.equal(result.hypotheticalHistoricalComparison.status,'FILTERED_HISTORICAL_BREP_NOT_REEXECUTED');
 assert.equal(result.hypotheticalHistoricalComparison.sourceGeometryPairsAfterModelMask,22);
 assert.equal(result.hypotheticalHistoricalComparison.historicallyPositivePairsAmongUnmasked,5);
 assert.equal(result.originalCollisionEvidence.sourceOriginalRows.length,26);
 assert.equal(result.originalCollisionEvidence.sourceOriginalRows.filter(x=>x.modelOverlapObserved).length,9);
 const unmasked=result.originalCollisionEvidence.sourceOriginalRows.filter(x=>
  x.modelOverlapObserved&&x.includedInHypotheticalMask);
 assert.deepEqual(unmasked.map(x=>x.canonicalFrameSolidIndex),[39,57,58,59,60]);
 assert.ok(unmasked.every(x=>x.measuredRevisedCollisionVolumeMm3===null));
 assert.equal(result.engineeringGates.exactBrepOnSelectedVariantCompleted,false);
 assert.equal(result.mechanicallyCompatible,false);
 assert.equal(result.originalGeometryWasModified,false);
 assert.equal(JSON.stringify(x),original);
});
test('other arm replacement does not borrow first-arm 30-pair Boolean results',()=>{
 for(const site of MOTOR_SITES.slice(1)){
  const result=solve(fixture(),{mode:VARIANT_MODES.REPLACE,siteId:site.id});
  assert.deepEqual(result.excludedFromHypotheticalStudyOnly,site.occurrences);
  assert.equal(result.hypotheticalHistoricalComparison.status,
   'NO_EXACT_BREP_BATCH_FOR_REQUESTED_SITE');
  assert.equal(result.hypotheticalHistoricalComparison.historicallyPositivePairsAmongUnmasked,null);
  assert.equal(result.hypotheticalHistoricalComparison.newExactBooleanResult,null);
  assert.equal(result.physicalFitApproved,false);
 }
});
test('forged OEM approvals, altered source labels, missing original collisions and unsafe config fail closed',()=>{
 const edit=[
  x=>x.review.candidateMotorInterchangeabilityApproved=true,
  x=>x.review.originalRawPositiveModelComparisons=9,
  x=>x.review.namedCollisionGroups.pop(),
  x=>x.review.namedCollisionGroups[0].originalFrameSolidIndices=[56],
  x=>x.review.namedCollisionGroups[0].frameOccurrenceNames=['fake motor'],
  x=>x.raw.source.frameStepSha256='0'.repeat(64),
  x=>x.raw.manufacturerBomIndependentlyVerified=true,
  x=>x.raw.sourceLeafInstances[56].assemblyPath[1]='not an arm',
  x=>x.raw.sourceLeafInstances[189].sourceDefinitionLabel='fake',
  x=>x.raw.sourceLeafInstances[110].flatSolidIndex=100,
 ];
 for(const fn of edit){const x=fixture();fn(x);
  assert.throws(()=>solve(x,{mode:VARIANT_MODES.REPLACE,siteId:'arm-1'}),
   /X500 assembly variant blocked/);}
 const x=fixture();
 assert.throws(()=>solve(x,{mode:'DELETE_ALL_EXISTING_MOTORS',siteId:'arm-1'}),
  /X500 assembly variant blocked/);
 assert.throws(()=>solve(x,{mode:VARIANT_MODES.REPLACE,siteId:'arm-5'}),
  /X500 assembly variant blocked/);
 assert.throws(()=>createX500UnqualifiedVariant(x.review,x.raw,'bad',{}),
  /X500 assembly variant blocked/);
});
test('browser scenario is separate from actual mating proposal and original XCAF component inventory',()=>{
 const main=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const panel=readFileSync(new URL('../cad_assembly_variant_ui_v36.mjs',import.meta.url),'utf8');
 assert.match(main,/createX500VariantPanel/);
 assert.match(main,/crypto\.subtle\.digest\('SHA-256',v35Bytes\)/);
 assert.match(main,/variantUI\.setEvidence\(assemblyReview,rawAssemblyReport,v35AssemblySha\)/);
 assert.match(main,/variantUI\.reset\(\)/);
 assert.match(panel,/cad-v36-scenario-mode/);
 assert.match(panel,/cad-v36-target-site/);
 assert.match(panel,/NOT RUN/);
 assert.doesNotMatch(main,/proposeX500CadMating\(variantUI/);
});
