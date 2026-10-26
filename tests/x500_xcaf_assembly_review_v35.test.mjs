import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {reviewX500AssemblyHierarchy} from '../core/x500_xcaf_assembly_review_v35.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const same=[[56,189],[83,191],[110,190],[137,188]];
const alias={188:137,189:56,190:110,191:83};
function fixture(){
 const sourceLeafInstances=[],rawV28={sha256:S.frame.sha256,solidCount:244,solids:[]};
 function identity(i){
  const motorNested=[56,83,110,137].includes(i);
  const motorTop=[188,189,190,191].includes(i);
  const motor=motorNested||motorTop;
  const motorGroup={56:1,83:2,110:3,137:4,188:4,189:1,190:3,191:2};
  const component=motorNested?'DJ-2216-KV880:1':
    motorTop?'DJ-2216-KV880:'+({188:2,189:3,190:4,191:5}[i]):
    i===39?'BAN-DJ-DIAN-F2:1':
    i>=57&&i<=60?'GB70-M3-6:'+(i-56):'SOURCE-TEST-PART-'+i+':1';
  const path=motorNested?
   ['(Unsaved)','HMX5V-ARM-V1_ASM:'+motorGroup[i],component]:
   ['(Unsaved)',component];
  return {flatSolidIndex:i,sourceComponentName:component,sourceDefinitionName:
   motor?'DJ-2216-KV880':component.replace(/:\d+$/,''),
   sourceOccurrenceLabel:'0:1:1:'+i,
   sourceDefinitionLabel:'0:1:1:'+(motor?'25':i+100),
   assemblyPath:path,assemblyLabelPath:path.map((_,j)=>'0:1:1:'+(i+j)),
   sourcePartCountOrRealPresenceVerified:false,
   sourceInstanceBoundsKernelMm:[alias[i]??i,0,0,(alias[i]??i)+.5,1,1],
   flatIndexBoundingAabbDisagreementMm:0,
   nearestXcafLeafIndex:alias[i]??i};
 }
 for(let i=0;i<244;i++){
  const node=identity(i);
  sourceLeafInstances.push(node);
  rawV28.solids.push({index:i,boundsKernelMm:[...node.sourceInstanceBoundsKernelMm]});
 }
 const pos=new Set(['39:0','56:0','56:1','56:2','56:3',
  '57:0','58:0','59:0','60:0']);
 const keys=[...pos,...Array.from({length:17},(_,i)=>(i+1)+':0')];
 const collisionPairs=keys.map(key=>{
  const [f,m]=key.split(':').map(Number),indices=f===56?[56,189]:[f];
  return {canonicalFrameSolidIndex:f,motorSolidIndex:m,
   originalFrameSolidIndices:indices,modeledCollisionPresent:pos.has(key),
   conservativeModelOverlapMm3:pos.has(key)?f===56?5491.38771511:51.41321402:0};
 });
 const v34={schema:'aeroforge/x500-source-occurrence-browser-review/v3.4',
  authority:'REPEATED_CAD_GEOMETRY_NOT_OEM_BOM',collisionPairs};
 const report={schema:'aeroforge/x500-xcaf-assembly-identity/v3.5',
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
   sourceV34ByteSha256:B,v28FlatInventoryByteSha256:A,
   frameImportedSolids:244,motorImportedSolids:4},
  sourceRootComponentCount:111,sourceAssemblyName:'(Unsaved)',
  stepFileSchema:'AUTOMOTIVE_DESIGN_AP214',flatSourceSolidCount:244,
  flatIndexMappingMode:'XCAF_DEPTH_FIRST_LEAF_ORDER_CROSSCHECKED_244_AABB_MATCHES',
  maxFlatToSourceAabbInflationDifferenceMm:0,maxNearestLeafAabbInflationDifferenceMm:0,
  sourceLeafInstances,
  sourceNamedMotorModel:'DJ-2216-KV880',
  separateCandidateMotorSourceName:'AIR2216II',
  frameStepMotorModelOccurrences:8,
  frameStepCoincidentMotorModelPairs:same,
  sourceAssemblyOccurrenceTreeRecovered:true,
  frameStepMotorAndSeparateCandidateInterchangeabilityVerified:false,
  frameStepMotorAndSeparateCandidateSamePartVerified:false,
  installedMotorCountVerified:false,manufacturerBomIndependentlyVerified:false,
  selectedAssemblyVariantIndependentlyVerified:false,
  physicalMotorSeatQualified:false,fastenerCompatibilityVerified:false,
  procurementApproved:false,physicalFitApproved:false,powerApproved:false,flightApproved:false,
  sourceModelInterferenceRemains:true,sourceModelRawCollisionPositivePairs:13,
  sourceModelDistinctPositiveGroups:9,
  collisionGroups:collisionPairs.map(x=>({...x,
   frameOccurrenceNames:x.originalFrameSolidIndices.map(i=>sourceLeafInstances[i].sourceComponentName),
   frameAssemblyPaths:x.originalFrameSolidIndices.map(i=>sourceLeafInstances[i].assemblyPath),
   conservativeModelOverlapMm3:x.conservativeModelOverlapMm3,
   sourceModelInterferencePresent:x.modeledCollisionPresent,
   selectedHardwareConfigurationVerified:false}))};
 return {report,rawV28,v34};
}
const verify=x=>reviewX500AssemblyHierarchy(x.report,x.rawV28,A,x.v34,B);
test('source STEP assembly maps 244 named leaves including eight references to a preexisting 4-site motor model',()=>{
 const valid=verify(fixture());
 assert.equal(valid.totalSourceLeaves,244);
 assert.equal(valid.rootComponentOccurrences,111);
 assert.equal(valid.sourceMotorModel,'DJ-2216-KV880');
 assert.equal(valid.candidateReplacementMotorModel,'AIR2216II');
 assert.equal(valid.existingSourceMotorModelOccurrences,8);
 assert.equal(valid.coincidentMotorGeometryGroups,4);
 assert.equal(valid.originalRawPositiveModelComparisons,13);
 assert.equal(valid.distinctModelInterferenceGroups,9);
 assert.equal(valid.positiveWithPreexistingModeledMotor,4);
 assert.equal(valid.positiveWithBracketLikeSourceLabel,1);
 assert.equal(valid.positiveWithFastenerLikeSourceLabel,4);
 assert.equal(valid.candidateMotorInterchangeabilityApproved,false);
 assert.equal(valid.hardwareInstallationApproved,false);
});
test('source hierarchy review refuses fictional OEM BOM, altered names, lost model collisions or forged report linkage',()=>{
 const alterations=[
  x=>x.report.source.frameStepSha256='0'.repeat(64),
  x=>x.report.source.v28FlatInventoryByteSha256='0'.repeat(64),
  x=>x.report.source.sourceV34ByteSha256='0'.repeat(64),
  x=>x.report.physicalFitApproved=true,
  x=>x.report.manufacturerBomIndependentlyVerified=true,
  x=>x.report.frameStepMotorAndSeparateCandidateInterchangeabilityVerified=true,
  x=>x.report.flatSourceSolidCount=240,
  x=>x.report.sourceLeafInstances.pop(),
  x=>x.report.sourceLeafInstances[56].sourceDefinitionLabel='0:1:1:99',
  x=>x.report.sourceLeafInstances[189].assemblyPath[1]='wrong motor',
  x=>x.report.sourceLeafInstances[39].sourceComponentName='FAKE-MOTOR:1',
  x=>x.report.sourceLeafInstances[57].sourceInstanceBoundsKernelMm[0]+=9,
  x=>x.report.sourceLeafInstances[56].nearestXcafLeafIndex=189,
  x=>x.report.collisionGroups[0].conservativeModelOverlapMm3=5000,
  x=>x.report.collisionGroups[0].sourceModelInterferencePresent=false,
  x=>x.v34.collisionPairs.pop()
 ];
 for(const mutation of alterations){const x=fixture();mutation(x);
  assert.throws(()=>verify(x),/X500 STEP assembly hierarchy rejected/);}
});
test('the XCAF browser displays named source parts without altering active CAD registration',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const panel=readFileSync(new URL('../cad_xcaf_assembly_ui_v35.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v35-flat-inventory/);
 assert.match(ui,/cad-v35-xcaf-report/);
 assert.match(ui,/reviewX500AssemblyHierarchy/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',v34Bytes\)/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',inventoryBytes\)/);
 assert.match(ui,/assemblyUI\.reset\(\)/);
 assert.match(panel,/sourceComponentName/);
 assert.match(panel,/DJ-2216-KV880/);
 assert.doesNotMatch(ui,/proposeX500CadMating\(assemblyReview/);
});
