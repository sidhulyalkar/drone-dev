import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {reviewX500OccurrenceAudit} from '../core/x500_occurrence_reconciliation_v34.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const DUPLICATES=[[56,189],[83,191],[110,190],[137,188]];
const rawList=[
 [34,0,0],[34,2,0],[35,0,0],[35,1,0],[35,2,0],
 [39,0,194.43466188],[39,1,0],[39,2,0],
 [40,0,0],[40,2,0],[41,0,0],[41,2,0],
 [56,0,5491.38771511],[56,1,6.68634636],[56,2,4637.12635314],[56,3,156.87975296],
 [57,0,51.41321402],[57,2,0],[58,0,51.41321402],[58,2,0],
 [59,0,51.88993195],[59,1,0],[59,2,0],
 [60,0,51.88982544],[60,1,0],[60,2,0],
 [189,0,5491.38771511],[189,1,6.68634636],[189,2,4637.12628632],[189,3,156.87975296]
];
function specimen(){
 const pairId='frame-quadrant-nn-orientation-1-motor-plane-28-frame-plane-103';
 const rows=rawList.map(([frameSolidIndex,motorSolidIndex,modelIntersectionVolumeMm3])=>({
  frameSolidIndex,motorSolidIndex,modelIntersectionVolumeMm3,
  sourceModelPositiveOverlap:modelIntersectionVolumeMm3>.0001
 }));
 const raw={schema:'aeroforge/x500-bounded-boolean-probe/v3.3',hypothesisId:pairId,
  surveySha256:A,result:{status:'MODEL_ONLY_BREP_BOOLEAN_REPORTED',
   workerResult:{pairs:rows}}};
 const survey={schema:'aeroforge/x500-source-contact-browser-review/v3.3',
  authority:'SOURCE_GEOMETRY_BROADPHASE_ONLY'};
 const booleanEvidence={schema:'aeroforge/x500-boolean-browser-evidence/v3.3',
  authority:'EXACT_ORIGINAL_CAD_MODEL_ONE_HYPOTHESIS_ONLY',
  hypothesisId:pairId,evaluatedSolidPairs:30,modelOverlapPairCount:13};
 const bykey=new Map(),c=i=>i===189?56:i;
 for(const p of rows){
  const key=c(p.frameSolidIndex)+':'+p.motorSolidIndex;
  if(!bykey.has(key))bykey.set(key,[]);
  bykey.get(key).push(p);
 }
 const collisionRows=[...bykey].sort((a,b)=>{
  const [fa,ma]=a[0].split(':').map(Number),[fb,mb]=b[0].split(':').map(Number);
  return fa-fb||ma-mb;
 }).map(([key,list])=>{
  const [canonicalFrameSolidIndex,motorSolidIndex]=key.split(':').map(Number);
  const values=list.map(x=>x.modelIntersectionVolumeMm3);
  const min=Math.min(...values),max=Math.max(...values);
  return {canonicalFrameSolidIndex,motorSolidIndex,
   originalFrameSolidIndices:list.map(x=>x.frameSolidIndex).sort((a,b)=>a-b),
   sourceOccurrenceCount:list.length,
   minReportedModelIntersectionMm3:Number(min.toFixed(8)),
   maxReportedModelIntersectionMm3:Number(max.toFixed(8)),
   modelVolumeSpreadMm3:Number((max-min).toFixed(8)),
   possibleModelCollision:list.some(x=>x.sourceModelPositiveOverlap),
   physicalPartMultiplicityKnown:false};
 });
 const audit={
  schema:'aeroforge/x500-source-occurrence-reconciliation/v3.4',
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
   v33SurveyByteSha256:A,v33BooleanByteSha256:B,
   frameImportedSolidCount:244,motorImportedSolidCount:4},
  duplicateOccurrenceMethod:
   'BREP_SHARED_TSHAPE_AND_SAME_ORIENTATION_AND_1E-6MM_LOCATION_NEAREST_VERTEX_AABB',
  coincidenceToleranceMm:1e-6,originalFrameSolidCount:244,
  geometryDistinctOriginalSolidCount:240,
  duplicateGroups:DUPLICATES.map(([a,b])=>({
   canonicalSourceSolidIndex:a,coincidentSourceSolidIndices:[a,b],
   samePhysicalPartConfirmed:false,sourceOnlyDuplicateGeometry:true
  })),
  sourceInstanceCoincidenceWitnesses:DUPLICATES.map(([a,b])=>({
   firstSolidIndex:a,secondSolidIndex:b,vertexCount:368,
   maxLocationMatrixDelta:6e-12,
   maxVertexCoordinateDeltaMm:8e-12,
   maxAabbCoordinateDeltaMm:6e-12
  })),
  unresolvedOEMPhysicalPartMultiplicity:true,
  sourceModelRawPairCount:30,sourceModelRawPositiveOverlapCount:13,
  geometryCanonicalPairCount:26,geometryCanonicalPositiveOverlapCount:9,
  geometryCanonicalCollisionPairs:collisionRows,hypothesisId:pairId,
  allModelCollisionsResolved:false,bomHierarchyVerified:false,
  physicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false
 };
 return {audit,survey,booleanEvidence,raw};
}
const review=x=>reviewX500OccurrenceAudit(x.audit,x.survey,x.booleanEvidence,x.raw,A,B);
test('four duplicated BREP occurrences reduce 13 raw model overlap rows to 9 distinct CAD geometry groups',()=>{
 const x=review(specimen());
 assert.equal(x.originalSourceFrameSolidCount,244);
 assert.equal(x.geometryDistinctFrameSolidGroups,240);
 assert.equal(x.coincidentSourceOccurrenceGroups.length,4);
 assert.equal(x.rawExactBrepPairCount,30);
 assert.equal(x.rawExactBrepPositiveCount,13);
 assert.equal(x.geometryDistinctPairCount,26);
 assert.equal(x.geometryDistinctPositiveCount,9);
 assert.equal(x.collisionPairs.filter(p=>p.modeledCollisionPresent).length,9);
 const biggest=x.collisionPairs.find(p=>p.canonicalFrameSolidIndex===56&&p.motorSolidIndex===0);
 assert.deepEqual(biggest.originalFrameSolidIndices,[56,189]);
 assert.equal(biggest.conservativeModelOverlapMm3,5491.38771511);
 assert.equal(x.sourceModelInterferenceRemains,true);
 assert.equal(x.actualManufacturerPartMultiplicityVerified,false);
 assert.equal(x.physicalFitApproved,false);
});
test('identical source CAD geometry at different locations is not automatically a duplicate',()=>{
 const x=review(specimen());
 assert.deepEqual(x.coincidentSourceOccurrenceGroups.map(g=>g.coincidentSourceSolidIndices),
  DUPLICATES);
 assert.ok(!x.coincidentSourceOccurrenceGroups.some(g=>g.coincidentSourceSolidIndices.includes(57)));
});
test('invalid SHA, manufactured approval, truncated Boolean, doctored canonical collision fails closed',()=>{
 const tamper=[
  x=>x.audit.source.frameStepSha256='f'.repeat(64),
  x=>x.audit.source.v33BooleanByteSha256='f'.repeat(64),
  x=>x.audit.bomHierarchyVerified=true,
  x=>x.audit.physicalFitApproved=true,
  x=>x.audit.duplicateGroups[1].coincidentSourceSolidIndices=[83,192],
  x=>x.audit.duplicateGroups[0].samePhysicalPartConfirmed=true,
  x=>x.audit.sourceInstanceCoincidenceWitnesses[0].maxVertexCoordinateDeltaMm=.1,
  x=>x.audit.geometryCanonicalPositiveOverlapCount=0,
  x=>x.audit.geometryCanonicalCollisionPairs[12].possibleModelCollision=false,
  x=>x.audit.geometryCanonicalCollisionPairs.pop(),
  x=>x.raw.result.workerResult.pairs.pop(),
  x=>x.raw.result.workerResult.pairs[0]=x.raw.result.workerResult.pairs[1],
  x=>x.booleanEvidence.modelOverlapPairCount=0
 ];
 for(const mutation of tamper){
  const x=specimen();mutation(x);
  assert.throws(()=>review(x),/Source CAD occurrence reconciliation rejected/);
 }
});
test('v3.4 browser only shows read-only source CAD grouping after original SHA-linked Boolean input',()=>{
 const main=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../cad_source_occurrence_ui_v34.mjs',import.meta.url),'utf8');
 assert.match(main,/cad-v34-occurrence-report/);
 assert.match(main,/reviewX500OccurrenceAudit/);
 assert.match(main,/crypto\.subtle\.digest\('SHA-256',rawBytes\)/);
 assert.match(main,/occurrenceUI\.reset\(\)/);
 assert.match(main,/occurrenceUI\.setEvidence\(occurrenceReview\)/);
 assert.match(ui,/geometryDistinctPositiveCount/);
 assert.doesNotMatch(main,/proposeX500CadMating\(occurrenceReview/);
});
