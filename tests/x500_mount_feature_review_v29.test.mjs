import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as observed} from '../core/x500_real_source_observations_v28.mjs';
import {checkX500MountCandidates} from '../core/x500_mount_feature_review_v29.mjs';
const hash='a'.repeat(64);
function preview(role){
 const s=observed[role];
 return {schema:'aeroforge/cad-preview-evidence/v1.3',localStepHashMatchesManifest:true,
  glbHashMatchesManifest:true,sourceAuthenticated:false,physicalFit:false,
  manifest:{source:{fileName:s.fileName,sha256:s.sha256,sizeBytes:s.sizeBytes}}};
}
function report(){
 const frames=[
  ['nn',-176.876,-176.876,35],['np',-176.876,176.876,62],
  ['pn',176.876,-176.876,116],['pp',176.876,176.876,89]
 ].map(([sign,x,z,solid])=>({
  id:'frame-quadrant-'+sign,role:'frame',
  featureKind:'CYLINDRICAL_FACE_SQUARE_CANDIDATE',
  sourceNativeAxis:'Y',centerTransverseMm:[x,z],
  axialCoordinateMm:null,displayPointNativeMm:[x,null,z],
  solidIndex:solid,supportingFaceIndices:[106,108,110,112],
  cylinderRadiusMm:2.9,squareSideMm:19/Math.SQRT2,squareDiagonalMm:19,
  surfaceClassification:'UNLABELED_NOT_VERIFIED_MOUNT_HOLES'
 }));
 const motor={id:'motor-coaxial-16-19-pairs',role:'motor',
  featureKind:'TWO_COAXIAL_CYLINDER_AXIS_PAIRS',sourceNativeAxis:'X',
  centerTransverseMm:[732.08475,0],axialCoordinateMm:null,
  displayPointNativeMm:[null,732.08475,0],solidIndex:0,
  cylinderRadiusMm:1.25,
  supportingPairs:[
   {centerDistanceMm:16,endpointsTransverseMm:[[726.428,5.657],[737.742,-5.657]],
    supportingFaceIndices:[4,10,66,72]},
   {centerDistanceMm:19,endpointsTransverseMm:[[725.367,-6.718],[738.802,6.718]],
    supportingFaceIndices:[7,13,63,69]}
  ],surfaceClassification:'UNLABELED_NOT_VERIFIED_FASTENER_HOLES_OR_SHAFT'};
 return {
  schema:'aeroforge/x500-mount-feature-candidates/v2.9',
  source:{frameSha256:observed.frame.sha256,motorSha256:observed.motor.sha256,
   frameBrepReportSha256:hash,motorBrepReportSha256:hash,
   frameSolidCount:244,motorSolidCount:4},
  candidates:[...frames,motor],candidateCount:5,
  candidateCoordinatesAreSourceNativeAndUnregistered:true,
  axialFaceCoordinatesAreNotInferred:true,
  independentMountMeasurement:false,mountingHoleIdentityApproved:false,
  motorShaftAxisApproved:false,tolerancedFitTested:false,
  procurementApproved:false,powerApproved:false,flightApproved:false
 };
}
function check(r=report(),f=preview('frame'),m=preview('motor')){
 return checkX500MountCandidates(r,f,m);
}
test('all 5 real-source candidate geometry families are research-only and axial coordinates unknown',()=>{
 const r=check();
 assert.equal(r.candidates.length,5);
 assert.equal(r.physicalFitApproved,false);
 assert.equal(r.flightApproved,false);
 assert.equal(r.authority,'SOURCE_BOUND_RESEARCH_CANDIDATES_ONLY');
 assert.deepEqual(r.candidates[0].displayPointNativeMm,[-176.876,null,-176.876]);
 assert.deepEqual(r.candidates[4].displayPointNativeMm,[null,732.08475,0]);
 assert.match(r.candidates[4].support,/16 and 19/);
 assert.equal(r.candidates[4].verifiedFastenerPattern,false);
});
test('forged source, forged hole qualification, unqualified preview or missing source all fail closed',()=>{
 const mutate=[
  r=>r.source.frameSha256='f'.repeat(64),
  r=>r.source.frameSolidCount=243,
  r=>r.flightApproved=true,
  r=>r.mountingHoleIdentityApproved=true,
  r=>r.tolerancedFitTested=true,
  r=>r.candidateCount=4,
  r=>r.candidates[0].displayPointNativeMm[1]=15.5,
  r=>r.candidates[0].centerTransverseMm[0]+=2,
  r=>r.candidates[0].squareDiagonalMm=16,
  r=>r.candidates[0].supportingFaceIndices.push(999),
  r=>r.candidates[4].supportingPairs[0].centerDistanceMm=19,
  r=>r.candidates[4].supportingPairs[1].endpointsTransverseMm[0][0]+=10,
  r=>r.candidates[4].axialCoordinateMm=1184.675
 ];
 for(const x of mutate){const r=report();x(r);
  assert.throws(()=>check(r),/Mounting candidate report rejected/);}
 const f=preview('frame');f.localStepHashMatchesManifest=false;
 assert.throws(()=>check(report(),f),/original STEP and GLB/);
});
test('optional inspector never silently fills unmeasured axial coordinates',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v29-feature-index/);
 assert.match(ui,/checkX500MountCandidates/);
 assert.match(ui,/cad-v29-copy-transverse/);
 assert.match(ui,/target.value=c.displayPointNativeMm.map\(x=>x===null\?'':String\(x\)\)/);
 assert.match(ui,/clearProposal\(\);target.focus\(\)/);
});
