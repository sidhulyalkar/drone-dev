import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {signedAxisMatrix} from '../core/registration_v15.mjs';
import {x500RightHandedAxisOptions} from '../core/cad_orientation_options_v28.mjs';
import {X500_SOURCE_OBSERVATIONS_V28,getX500RealSourceObservations} from '../core/x500_real_source_observations_v28.mjs';
import {proposeX500CadMating} from '../core/cad_mating_v24.mjs';
import {deriveCadPairInspectionPose} from '../core/cad_pair_pose_v26.mjs';
const SHA='c'.repeat(64);
function preview(role){
 const s=X500_SOURCE_OBSERVATIONS_V28[role];
 return {schema:'aeroforge/cad-preview-evidence/v1.3',
  localStepHashMatchesManifest:true,glbHashMatchesManifest:true,
  sourceAuthenticated:false,physicalFit:false,manufacturerCadRegisteredToAircraft:false,
  manifest:{schema:'aeroforge/cad-visual-package/v1.3',
   source:{fileName:s.fileName,sha256:s.sha256,sizeBytes:s.sizeBytes,
    revision:'HEADER_EXPORT_TIMESTAMP_NOT_VENDOR_REVISION',
    documentationUrl:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download',
    licenseNote:'User uploaded, reproduction rights not established'},
   mesh:{fileName:s.fileName+'.glb',sha256:SHA,sizeBytes:300,format:'GLB_2',units:'m'},
   conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED',scaleFromKernelToGLTF:.001,
     solidCount:s.importedSolidCount,triangleCount:5,
     sourceAabbKernelMm:s.sourceKernelAabbMm},
   qualification:{manufacturerAuthenticated:false,axesRegisteredToFRD:false,
     physicalFit:false,rotorCentersMeasured:false,flightReady:false},
   scope:'VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED'}
 };
}
function proposal(displayAxisNative='+X'){
 return proposeX500CadMating(preview('frame'),preview('motor'),{
  frameMountKernelMm:[180,0,180],motorMountKernelMm:[1160,732,0],
  axisMap:['+Z','+X','+Y'],displayAxisNative,
  observer:'Fixture',sourceUnitsReviewed:true,
  framePatternMm:16,motorPatternMm:19,
  datumNotes:'Source-only coordinate placeholder. Mounting holes not independently identified.',
  fastenerNotes:'No physical hole center measurement, thread engagement or shaft axis approval.'
 });
}
test('real original SHA and locally imported dimensions are exact-source-bounded',()=>{
 const found=getX500RealSourceObservations(preview('frame'),preview('motor'));
 assert.equal(found.frame.importedSolidCount,244);
 assert.equal(found.motor.importedSolidCount,4);
 assert.equal(found.frame.sourceKernelAabbMm.max[1],107);
 assert.equal(found.motor.sourceKernelAabbMm.min[0],1143.17548);
 assert.equal(found.shaftAxisQualified,false);
 assert.equal(found.flightApproved,false);
 const altered=structuredClone(preview('motor'));
 altered.manifest.source.sha256='a'.repeat(64);
 assert.equal(getX500RealSourceObservations(preview('frame'),altered),null);
 const unaudited=structuredClone(preview('frame'));
 unaudited.glbHashMatchesManifest=false;
 assert.equal(getX500RealSourceObservations(unaudited,preview('motor')),null);
});
test('all and only 24 right-handed signed rotation maps are available',()=>{
 const options=x500RightHandedAxisOptions();
 assert.equal(options.length,24);
 assert.equal(new Set(options.map(x=>x.value)).size,24);
 for(const o of options){
  const m=signedAxisMatrix(o.tokens);
  assert.equal(m.length,3);
 }
 assert.ok(options.some(o=>o.value==='+Z,+X,+Y'));
 assert.ok(!options.some(o=>o.value==='+X,+Y,-Z'));
});
test('render-only motor-native +X explosion maps to frame +Y, not assumed native Z',()=>{
 const p=proposal('+X');
 const rest=deriveCadPairInspectionPose(p),apart=deriveCadPairInspectionPose(p,40);
 assert.equal(rest.motorDisplaySeparationAxisNative,'+X');
 assert.deepEqual(rest.motorSelectedDisplayAxisInFrame,[0,1,0]);
 assert.deepEqual(apart.motorDatumPreviewFrameMm,[180,40,180]);
 assert.equal(apart.motorNativePositiveZInFrame,null);
 assert.deepEqual(apart.motorToFrameTranslationMm,rest.motorToFrameTranslationMm);
 assert.equal(apart.registrationChanged,false);
 assert.equal(apart.mechanicalFitApproved,false);
 assert.equal(apart.flightApproved,false);
 const legacy=proposal('+Z');
 assert.deepEqual(deriveCadPairInspectionPose(legacy,10).motorNativePositiveZInFrame,[1,0,0]);
 for(const invalid of ['X','+A','',null,123]){
  assert.throws(()=>proposal(invalid),/Invalid render-only/);
 }
});
test('browser source specifically exposes datum and axis caveats',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../cad_pair_viewer_v24.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v28-source-observations/);
 assert.match(ui,/cad-v28-display-axis/);
 assert.match(ui,/x500RightHandedAxisOptions/);
 assert.match(viewer,/matchingLocalSource/);
 assert.match(ui,/NOT a verified shaft axis/);
});
