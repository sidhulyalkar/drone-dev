import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proposeX500CadMating} from '../core/cad_mating_v24.mjs';
import {deriveCadPairInspectionPose,MAX_CAD_PREVIEW_SEPARATION_MM} from '../core/cad_pair_pose_v26.mjs';

const preview=(filename,digest)=>({
 schema:'aeroforge/cad-preview-evidence/v1.3',
 glbHashMatchesManifest:true,localStepHashMatchesManifest:true,
 sourceAuthenticated:false,physicalFit:false,manufacturerCadRegisteredToAircraft:false,
 manifest:{schema:'aeroforge/cad-visual-package/v1.3',
  source:{fileName:filename,sha256:digest,revision:'SYNTHETIC_ONLY',sizeBytes:100,
   documentationUrl:'https://example.org/test',licenseNote:'Synthetic unit fixture'},
  mesh:{fileName:filename+'.glb',sha256:'c'.repeat(64),sizeBytes:200,
   format:'GLB_2',units:'m'},
  conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED',scaleFromKernelToGLTF:.001,
   solidCount:1,triangleCount:2,sourceAabbKernelMm:{min:[0,0,0],max:[10,10,15]}},
  qualification:{manufacturerAuthenticated:false,axesRegisteredToFRD:false,
   physicalFit:false,rotorCentersMeasured:false,flightReady:false},
  scope:'VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED'}
});
function proposal(axisMap=['+X','+Y','+Z']){
 return proposeX500CadMating(
  preview('x500v2-frame.step','a'.repeat(64)),
  preview('AIR2216II_Motor_3D.STEP','b'.repeat(64)),
  {frameMountKernelMm:[200,30,18],motorMountKernelMm:[2,3,5],
   axisMap,sourceUnitsReviewed:true,framePatternMm:16,motorPatternMm:19,
   observer:'Inspector A',datumNotes:'Synthetic registration from source-native coordinate annotations.',
   fastenerNotes:'No independent fastener measurement, source axis validation or fit approval.'});
}
test('resting and exploded poses keep the same exact physical datum proposal',()=>{
 const p=proposal(),rest=deriveCadPairInspectionPose(p),apart=deriveCadPairInspectionPose(p,50);
 assert.deepEqual(rest.motorToFrameTranslationMm,[198,27,13]);
 assert.deepEqual(rest.motorDatumPreviewFrameMm,[200,30,18]);
 assert.deepEqual(apart.motorDatumPreviewFrameMm,[200,30,68]);
 assert.deepEqual(apart.previewTranslationMm,[198,27,63]);
 assert.deepEqual(apart.motorToFrameTranslationMm,rest.motorToFrameTranslationMm);
 assert.deepEqual(apart.matrix4RowMajor.slice(0,4),[1,0,0,.198]);
 assert.equal(apart.previewOnly,true);
 assert.equal(apart.registrationChanged,false);
 assert.equal(apart.mechanicalFitApproved,false);
 assert.equal(apart.flightApproved,false);
 assert.deepEqual(p.registration.motorToFrameTranslationMm,[198,27,13]);
});
test('motor-native +Z is visibly separated along chosen right-handed frame axis',()=>{
 const p=proposal(['+Z','+X','+Y']);
 const pose=deriveCadPairInspectionPose(p,25);
 assert.deepEqual(pose.motorNativePositiveZInFrame,[1,0,0]);
 assert.deepEqual(pose.motorDatumPreviewFrameMm,[225,30,18]);
 assert.equal(pose.previewTranslationMm[0]-pose.motorToFrameTranslationMm[0],25);
});
test('invalid or mutated matrix and translation fail closed',()=>{
 for(const mutate of [
  x=>x.registration.axisMatrix[0][0]=-1,
  x=>x.registration.motorToFrameTranslationMm[0]+=4,
  x=>x.registration.motorMountKernelMm[2]=Infinity,
  x=>x.flightApproved=true,
  x=>x.independentlyQualified=true,
  x=>x.registration.motorToFrameAxisMap=['+X','+Y','-Z']
 ]){
  const altered=structuredClone(proposal());mutate(altered);
  assert.throws(()=>deriveCadPairInspectionPose(altered));
 }
});
test('preview separation is bounded and cannot invent clearance or fit',()=>{
 const p=proposal();
 for(const separation of [-1,101,NaN,Infinity,'20'])
  assert.throws(()=>deriveCadPairInspectionPose(p,separation));
 const far=deriveCadPairInspectionPose(p,MAX_CAD_PREVIEW_SEPARATION_MM);
 assert.equal(far.displaySeparationMm,100);
 assert.equal(far.mechanicalFitApproved,false);
 assert.equal(far.registrationChanged,false);
});
test('browser source wires rendering-only slider and datum markers',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../cad_pair_viewer_v24.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v26-separation/);
 assert.match(ui,/setSeparation/);
 assert.match(viewer,/deriveCadPairInspectionPose/);
 assert.match(viewer,/setDatumMarkersVisible/);
});
