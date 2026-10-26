/** v3.4 exact-source CAD-occurrence reconciliation; not OEM BOM identification.
 * Cross-check every original v3.3 Boolean pair and 4 same-placed BREP
 * occurrence witnesses. Never suppress the original modeled interference.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as S} from './x500_real_source_observations_v28.mjs';
export const OCCURRENCE_SCHEMA='aeroforge/x500-source-occurrence-reconciliation/v3.4';
const sha=/^[a-f0-9]{64}$/;
const isFiniteNumber=x=>typeof x==='number'&&Number.isFinite(x);
const close=(a,b,t=.000001)=>isFiniteNumber(a)&&Math.abs(a-b)<=t;
const fail=m=>{throw Error('Source CAD occurrence reconciliation rejected: '+m);};
const PAIRS=[[56,189],[83,191],[110,190],[137,188]];
const nonApproval=['allModelCollisionsResolved','bomHierarchyVerified',
 'physicalFitApproved','procurementApproved','powerApproved','flightApproved'];
const canonical=i=>{
 const g=PAIRS.find(([a,b])=>i===a||i===b);
 return g?g[0]:i;
};
export function reviewX500OccurrenceAudit(audit,survey,booleanEvidence,rawBoolean,
 surveySha256,booleanSha256){
 if(audit?.schema!==OCCURRENCE_SCHEMA||
  survey?.schema!=='aeroforge/x500-source-contact-browser-review/v3.3'||
  survey.authority!=='SOURCE_GEOMETRY_BROADPHASE_ONLY'||
  booleanEvidence?.schema!=='aeroforge/x500-boolean-browser-evidence/v3.3'||
  booleanEvidence.authority!=='EXACT_ORIGINAL_CAD_MODEL_ONE_HYPOTHESIS_ONLY'||
  !sha.test(surveySha256)||!sha.test(booleanSha256)||
  rawBoolean?.schema!=='aeroforge/x500-bounded-boolean-probe/v3.3')
  fail('Must verify original-source survey, full exact Boolean and SHA-256 receipts first');
 const src=audit.source;
 if(src?.frameStepSha256!==S.frame.sha256||src?.motorStepSha256!==S.motor.sha256||
  src.v33SurveyByteSha256!==surveySha256||
  src.v33BooleanByteSha256!==booleanSha256||
  src.frameImportedSolidCount!==244||src.motorImportedSolidCount!==4||
  audit.originalFrameSolidCount!==244||
  audit.geometryDistinctOriginalSolidCount!==240||
  audit.unresolvedOEMPhysicalPartMultiplicity!==true||
  audit.duplicateOccurrenceMethod!==
   'BREP_SHARED_TSHAPE_AND_SAME_ORIENTATION_AND_1E-6MM_LOCATION_NEAREST_VERTEX_AABB'||
  audit.coincidenceToleranceMm!==1e-6)
  fail('Original STEP identity, source geometry count or duplicate-witness method changed');
 for(const flag of nonApproval)if(audit[flag]!==false)
  fail('Cannot elevate OEM BOM or physical approval: '+flag);
 const groups=audit.duplicateGroups,witness=audit.sourceInstanceCoincidenceWitnesses;
 if(!Array.isArray(groups)||groups.length!==4||
  !Array.isArray(witness)||witness.length!==4)
  fail('Expected four exact source-coincident occurrence pairs');
 for(let i=0;i<4;i++){
  const [a,b]=PAIRS[i],g=groups[i],w=witness[i];
  if(g?.canonicalSourceSolidIndex!==a||
   JSON.stringify(g.coincidentSourceSolidIndices)!==JSON.stringify([a,b])||
   g.samePhysicalPartConfirmed!==false||g.sourceOnlyDuplicateGeometry!==true||
   w?.firstSolidIndex!==a||w.secondSolidIndex!==b||
   !Number.isInteger(w.vertexCount)||w.vertexCount<100||
   ![w.maxLocationMatrixDelta,w.maxVertexCoordinateDeltaMm,
     w.maxAabbCoordinateDeltaMm].every(x=>isFiniteNumber(x)&&x>=0&&x<=1e-6))
   fail('A coincident original BREP TShape/placement/vertex witness was changed');
 }
 if(audit.hypothesisId!==booleanEvidence.hypothesisId||
  rawBoolean.hypothesisId!==booleanEvidence.hypothesisId||
  audit.sourceModelRawPairCount!==booleanEvidence.evaluatedSolidPairs||
  audit.sourceModelRawPositiveOverlapCount!==booleanEvidence.modelOverlapPairCount||
  audit.sourceModelRawPairCount!==30||
  audit.sourceModelRawPositiveOverlapCount!==13||
  audit.geometryCanonicalPairCount!==26||
  audit.geometryCanonicalPositiveOverlapCount!==9||
  audit.geometryCanonicalPositiveOverlapCount<=0||
  !Array.isArray(audit.geometryCanonicalCollisionPairs))
  fail('Raw or geometry-distinct collision summary inconsistent');
 const raw=rawBoolean.result?.workerResult?.pairs;
 if(!Array.isArray(raw)||raw.length!==audit.sourceModelRawPairCount||
  rawBoolean.result.status!=='MODEL_ONLY_BREP_BOOLEAN_REPORTED'||
  rawBoolean.surveySha256!==surveySha256)
  fail('Original untouched BREP Boolean source rows unavailable');
 const aggregate=new Map(),originalRawIds=new Set();
 for(const p of raw){
  const j=p.frameSolidIndex,i=p.motorSolidIndex,value=p.modelIntersectionVolumeMm3;
  const id=j+':'+i;
  if(!Number.isInteger(j)||j<0||j>=244||
   !Number.isInteger(i)||i<0||i>=4||originalRawIds.has(id)||
   !isFiniteNumber(value)||value<0||
   p.sourceModelPositiveOverlap!==(value>.0001))
   fail('Malformed or duplicate original BREP source-pair evidence');
  originalRawIds.add(id);
  const key=canonical(j)+':'+i;
  if(!aggregate.has(key))aggregate.set(key,[]);
  aggregate.get(key).push(p);
 }
 if(aggregate.size!==26||audit.geometryCanonicalCollisionPairs.length!==26)
  fail('Raw BREP collision rows were silently omitted or added');
 const seen=new Set(),canonicalRows=[];
 for(const entry of audit.geometryCanonicalCollisionPairs){
  const frame=entry.canonicalFrameSolidIndex,motor=entry.motorSolidIndex;
  const key=frame+':'+motor,source=aggregate.get(key);
  if(!source||seen.has(key)||entry.physicalPartMultiplicityKnown!==false)
   fail('Original CAD duplicate cannot stand in for physical OEM part count');
  seen.add(key);
  const ids=source.map(x=>x.frameSolidIndex).sort((a,b)=>a-b);
  const values=source.map(x=>x.modelIntersectionVolumeMm3);
  const min=Math.min(...values),max=Math.max(...values);
  const positive=source.some(x=>x.sourceModelPositiveOverlap);
  if(JSON.stringify(entry.originalFrameSolidIndices)!==JSON.stringify(ids)||
   entry.sourceOccurrenceCount!==ids.length||
   !close(entry.minReportedModelIntersectionMm3,min,.000001)||
   !close(entry.maxReportedModelIntersectionMm3,max,.000001)||
   !close(entry.modelVolumeSpreadMm3,max-min,.000001)||
   entry.possibleModelCollision!==positive)
   fail('Canonical volume group differs from the full original BREP source rows');
  canonicalRows.push({
   originalFrameSolidIndices:ids,canonicalFrameSolidIndex:frame,
   motorSolidIndex:motor,originalSourcePairCount:source.length,
   conservativeModelOverlapMm3:max,
   modeledCollisionPresent:positive,realHardwareMultiplicityVerified:false});
 }
 if(seen.size!==aggregate.size||canonicalRows.filter(x=>x.modeledCollisionPresent).length!==9)
  fail('A positive collision was lost during source-occurrence grouping');
 return {schema:'aeroforge/x500-source-occurrence-browser-review/v3.4',
  authority:'REPEATED_CAD_GEOMETRY_NOT_OEM_BOM',
  originalSourceFrameSolidCount:244,geometryDistinctFrameSolidGroups:240,
  coincidentSourceOccurrenceGroups:groups.map(g=>({...g,
    coincidentSourceSolidIndices:[...g.coincidentSourceSolidIndices]})),
  rawExactBrepPairCount:30,rawExactBrepPositiveCount:13,
  geometryDistinctPairCount:26,geometryDistinctPositiveCount:9,
  collisionPairs:canonicalRows,
  sourceModelInterferenceRemains:true,
  actualManufacturerPartMultiplicityVerified:false,
  sourceAssemblyVariantsResolved:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'Two occurrences of identical source geometry are NOT independently established duplicate hardware parts. All original Boolean measurements are retained. Nine distinct modeled collision groups still block the tested pose.'};
}
