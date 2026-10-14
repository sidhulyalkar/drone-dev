/** v2.9 review of source-bound geometric BREP patterns, NEVER fit qualification.
 * The local candidate report is untrusted; verify against both source STEP
 * fingerprints already rehashed in browser and the exact v2.8 observations.
 */
import {X500_SOURCE_OBSERVATIONS_V28} from './x500_real_source_observations_v28.mjs';
export const X500_MOUNT_CANDIDATE_SCHEMA='aeroforge/x500-mount-feature-candidates/v2.9';
const hex=/^[a-f0-9]{64}$/;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function need(b,m){if(!b)throw Error('Mounting candidate report rejected: '+m);}
const ids=['frame-quadrant-nn','frame-quadrant-np','frame-quadrant-pn',
  'frame-quadrant-pp','motor-coaxial-16-19-pairs'];
const expectedFrame={
 'frame-quadrant-nn':[-176.876,-176.876],
 'frame-quadrant-np':[-176.876,176.876],
 'frame-quadrant-pn':[176.876,-176.876],
 'frame-quadrant-pp':[176.876,176.876],
};
const close=(a,b,tol=.06)=>finite(a)&&Math.abs(a-b)<=tol;
function coords(c,x,label){
 need(Array.isArray(c)&&c.length===2&&c.every((v,i)=>close(v,x[i])),
  label+' does not match the imported source BREP coordinate family');
}
function validFaceIds(ids,max){
 need(Array.isArray(ids)&&ids.length>=2&&ids.length<=48&&
  new Set(ids).size===ids.length&&ids.every(n=>Number.isInteger(n)&&n>=0&&n<max),
  'invalid or duplicate face-level identifiers');
}
export function checkX500MountCandidates(report,framePreview,motorPreview){
 need(object(report)&&report.schema===X500_MOUNT_CANDIDATE_SCHEMA,
  'unrecognized report schema');
 const f=X500_SOURCE_OBSERVATIONS_V28.frame,m=X500_SOURCE_OBSERVATIONS_V28.motor;
 need(framePreview?.schema==='aeroforge/cad-preview-evidence/v1.3'&&
   motorPreview?.schema==='aeroforge/cad-preview-evidence/v1.3'&&
   [framePreview,motorPreview].every(p=>
      p.localStepHashMatchesManifest===true&&p.glbHashMatchesManifest===true&&
      p.sourceAuthenticated===false&&p.physicalFit===false),
   'original STEP and GLB source bytes must first be hash-checked locally');
 const src=report.source;
 need(object(src)&&src.frameSha256===f.sha256&&src.motorSha256===m.sha256&&
   framePreview.manifest?.source?.sha256===f.sha256&&
   motorPreview.manifest?.source?.sha256===m.sha256&&
   framePreview.manifest?.source?.fileName===f.fileName&&
   motorPreview.manifest?.source?.fileName===m.fileName&&
   framePreview.manifest?.source?.sizeBytes===f.sizeBytes&&
   motorPreview.manifest?.source?.sizeBytes===m.sizeBytes,
   'original uploaded STEP fingerprints differ from this feature audit');
 need(src.frameSolidCount===f.importedSolidCount&&
   src.motorSolidCount===m.importedSolidCount&&
   hex.test(src.frameBrepReportSha256)&&hex.test(src.motorBrepReportSha256),
   'invalid BREP audit identity');
 const falseKeys=['independentMountMeasurement','mountingHoleIdentityApproved',
  'motorShaftAxisApproved','tolerancedFitTested','procurementApproved',
  'powerApproved','flightApproved'];
 for(const k of falseKeys)need(report[k]===false,'privileged approval asserted: '+k);
 need(report.candidateCoordinatesAreSourceNativeAndUnregistered===true&&
   report.axialFaceCoordinatesAreNotInferred===true,
   'unregistered native axes and unknown axial positions must be explicit');
 need(Array.isArray(report.candidates)&&report.candidates.length===5&&
   report.candidateCount===5&&
   new Set(report.candidates.map(x=>x.id)).size===5&&
   ids.every(id=>report.candidates.some(x=>x.id===id)),
   'the complete four-frame plus one-motor candidate family is required');
 const canonical=report.candidates.map(candidate=>{
  need(object(candidate),'candidate must be an object');
  const frame=candidate.role==='frame',motor=candidate.role==='motor';
  need(frame||motor,'unknown candidate role');
  need((frame&&candidate.id.startsWith('frame-'))||
    (motor&&candidate.id==='motor-coaxial-16-19-pairs'),
    'candidate id and physical source role mismatch');
  const center=frame?expectedFrame[candidate.id]:[732.08475,0];
  need(!!center,'unexpected candidate id');
  coords(candidate.centerTransverseMm,center,candidate.id);
  const point=candidate.displayPointNativeMm;
  need(Array.isArray(point)&&point.length===3&&
    point[frame?1:0]===null&&candidate.axialCoordinateMm===null,
    'missing-axial-coordinate evidence must remain unknown');
  const pair=frame?[point[0],point[2]]:[point[1],point[2]];
  coords(pair,center,'source-native candidate point');
  need(candidate.sourceNativeAxis===(frame?'Y':'X')&&
    candidate.featureKind===(frame?'CYLINDRICAL_FACE_SQUARE_CANDIDATE':'TWO_COAXIAL_CYLINDER_AXIS_PAIRS')&&
    candidate.surfaceClassification?.startsWith('UNLABELED_NOT_VERIFIED_')&&
    close(candidate.cylinderRadiusMm,frame?2.9:1.25,.001),
    'unqualified cylindrical surface identity mismatch');
  need(Number.isInteger(candidate.solidIndex)&&candidate.solidIndex>=0&&
    candidate.solidIndex<(frame?244:4),
    'out of range source solid index');
  if(frame){
   need(close(candidate.squareSideMm,19/Math.SQRT2)&&
     close(candidate.squareDiagonalMm,19),
     'square face arrangement has 19 mm diagonal, not necessarily 19 mm side');
   validFaceIds(candidate.supportingFaceIndices,450);
  }else{
   need(Array.isArray(candidate.supportingPairs)&&candidate.supportingPairs.length===2,
     'motor requires separate 16/19 mm cylinder face pairs');
   for(let i=0;i<2;i++){
    const p=candidate.supportingPairs[i],length=[16,19][i];
    need(close(p?.centerDistanceMm,length,.02)&&
      Array.isArray(p?.endpointsTransverseMm)&&p.endpointsTransverseMm.length===2,
      'motor spacing evidence mismatched');
    const [a,b]=p.endpointsTransverseMm;
    need(Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&
      a.every(finite)&&b.every(finite)&&
      close(Math.hypot(a[0]-b[0],a[1]-b[1]),length,.04)&&
      close((a[0]+b[0])/2,center[0],.05)&&
      close((a[1]+b[1])/2,center[1],.05),
      'motor cylinder pair is not the source-observed common-axis family');
    validFaceIds(p.supportingFaceIndices,200);
   }
  }
  return {id:candidate.id,role:candidate.role,
   sourceNativeAxis:candidate.sourceNativeAxis,
   centerTransverseMm:[...candidate.centerTransverseMm],
   displayPointNativeMm:[...point],
   solidIndex:candidate.solidIndex,
   sourceStepSha256:frame?f.sha256:m.sha256,
   reviewedMountingDatum:false,verifiedFastenerPattern:false,
   physicalFitApproved:false,
   support:frame?
     'Four unclassified cylindrical-face axes forming a 19 mm DIAGONAL square':
     'Two unclassified opposite cylinder pairs spanning 16 and 19 mm',
  };
 });
 return {schema:'aeroforge/x500-mount-candidate-browser-review/v2.9',
   authority:'SOURCE_BOUND_RESEARCH_CANDIDATES_ONLY',
   candidates:canonical,
   frameStepSha256:f.sha256,motorStepSha256:m.sha256,
   physicalFitApproved:false,procurementApproved:false,powerApproved:false,
   flightApproved:false,
   warning:'The source-axis along each cylindrical face lacks a measured mating-plane coordinate. Do not auto-fill that axis or approve a mounting hole from this report.'};
}
