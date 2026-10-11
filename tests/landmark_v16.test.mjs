import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LANDMARK_SCHEMA,fitCadCircle,gltfMetersToKernelMm,kernelMmToGltfMeters,annotateRotorWithCircle}
 from '../core/landmark_v16.mjs';
import {proposeX500Registration} from '../core/registration_v15.mjs';

const source={stepSha256:'a'.repeat(64),glbSha256:'b'.repeat(64),revision:'SYNTHETIC_TEST_ONLY'};
const points=(center=[20,30,40],radius=10)=>[
 [center[0]+radius,center[1],center[2]],
 [center[0],center[1]+radius,center[2]],
 [center[0]-radius,center[1],center[2]],
 [center[0],center[1]-radius,center[2]],
 [center[0]+radius/Math.sqrt(2),center[1]+radius/Math.sqrt(2),center[2]]
].map((pointKernelMm,i)=>({pointKernelMm,meshIndex:2,meshName:'test-circular-rim'}));
const preview=()=>({schema:'aeroforge/cad-preview-evidence/v1.3',glbHashMatchesManifest:true,localStepHashMatchesManifest:true,
 manifest:{source:{fileName:'x500v2-frame.step',sha256:source.stepSha256,revision:source.revision,
  documentationUrl:'https://example.org/source'},mesh:{sha256:source.glbSha256}}});
const registrationForm=()=>({axisMap:['+X','+Y','+Z'],datumKernelMm:[0,0,0],
 reviewerLabel:'test only',observationNotes:'Synthetic CAD circular feature regression observations, not actual Holybro STEP.',
 sourceUnitsReviewed:true,rotors:[
  {id:'R1',centerKernelMm:[200,150,0],propDiameterMm:254},
  {id:'R2',centerKernelMm:[-200,150,0],propDiameterMm:254},
  {id:'R3',centerKernelMm:[-200,-150,0],propDiameterMm:254},
  {id:'R4',centerKernelMm:[200,-150,0],propDiameterMm:254}
 ]});
test('five point rim recovers circular feature center and radius without flight or motor authority',()=>{
 const fitted=fitCadCircle(points(),source);
 assert.equal(fitted.schema,LANDMARK_SCHEMA);
 assert.deepEqual(fitted.centerKernelMm,[20,30,40]);
 assert.equal(fitted.radiusKernelMm,10);
 assert.equal(fitted.pointCount,5);
 assert.equal(fitted.holdoutPointCount,2);
 assert.equal(fitted.diagnostics.highResidual,false);
 assert.equal(fitted.featureIdentityVerified,false);
 assert.equal(fitted.centerIsVerifiedMotorAxis,false);
 assert.equal(fitted.qualifiedForFlight,false);
});
test('non-XY circle plane can be fitted without silently changing axis frame',()=>{
 const p=points([20,30,40],10).map(({pointKernelMm,...rest})=>({
  ...rest,pointKernelMm:[pointKernelMm[2],pointKernelMm[0],pointKernelMm[1]]}));
 const f=fitCadCircle(p,source);
 assert.deepEqual(f.centerKernelMm,[40,20,30]);
 assert.equal(f.radiusKernelMm,10);
 assert.equal(f.diagnostics.highResidual,false);
});
test('glTF metres round-trip into native CAD millimetres, not FRD coordinates',()=>{
 const a=[200,-300,145.75];
 const meters=kernelMmToGltfMeters(a);
 assert.deepEqual(gltfMetersToKernelMm(meters),a);
 assert.throws(()=>gltfMetersToKernelMm([NaN,0,0]));
 assert.throws(()=>kernelMmToGltfMeters([null,0,0]));
});
test('distinct collinear and duplicated surface picks fail closed',()=>{
 const line=Array.from({length:5},(_,i)=>({pointKernelMm:[i,0,0],meshIndex:1,meshName:'line'}));
 assert.throws(()=>fitCadCircle(line,source),/collinear/);
 const dup=points();dup[4]=structuredClone(dup[0]);
 assert.throws(()=>fitCadCircle(dup,source),/Duplicate/);
 assert.throws(()=>fitCadCircle(points().slice(0,3),source),/4\.\.64/);
});
test('gross noncircular/out-of-plane fourth point sets high residual and disallows application',()=>{
 const p=points();
 p[4].pointKernelMm=[20,30,120];
 const fitted=fitCadCircle(p,source);
 assert.equal(fitted.diagnostics.highResidual,true);
 assert.throws(()=>annotateRotorWithCircle({id:'R1'},fitted,source),/high geometric residual/);
});
test('changed source GLB or STEP invalidates a previously fitted geometric feature',()=>{
 const f=fitCadCircle(points(),source);
 assert.throws(()=>annotateRotorWithCircle({id:'R1'},f,
  {...source,glbSha256:'c'.repeat(64)}),/not bound/);
 assert.throws(()=>annotateRotorWithCircle({id:'R1'},f,
  {...source,stepSha256:'c'.repeat(64)}),/not bound/);
});
test('fit evidence is explicitly unverified when attached to a proposed motor entry',()=>{
 const f=fitCadCircle(points([200,150,0],9),source);
 const rotor=annotateRotorWithCircle({id:'R1',propDiameterMm:254},f,source);
 assert.equal(rotor.observationKind,'CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS');
 assert.equal(rotor.featureEvidence.schema,LANDMARK_SCHEMA);
 assert.equal(rotor.featureEvidence.shaftCenterIndependentlyVerified,false);
 const input=registrationForm();input.rotors[0]=rotor;
 const result=proposeX500Registration(preview(),input);
 assert.equal(result.rotors[0].annotationSource,'CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS');
 assert.equal(result.rotors[0].featureEvidence.shaftCenterIndependentlyVerified,false);
 assert.equal(result.axesIndependentlyRegistered,false);
 assert.equal(result.fitQualified,false);
});
test('reject copied feature evidence when source changes or coordinate is edited',()=>{
 const f=fitCadCircle(points([200,150,0]),source);
 const r=annotateRotorWithCircle({id:'R1',propDiameterMm:254},f,source);
 const input=registrationForm();input.rotors[0]=r;
 const modified=structuredClone(input);modified.rotors[0].centerKernelMm[0]+=3;
 assert.throws(()=>proposeX500Registration(preview(),modified),/does not match/);
 const wrong=preview();wrong.manifest.mesh.sha256='c'.repeat(64);
 assert.throws(()=>proposeX500Registration(wrong,input),/does not match/);
});
test('strict landmark identifiers and labels reject unbounded malformed geometry',()=>{
 const sourceBad={...source,glbSha256:'invalid'};
 assert.throws(()=>fitCadCircle(points(),sourceBad));
 const invalid=points();invalid[0].meshIndex=-1;
 assert.throws(()=>fitCadCircle(invalid,source));
 const infinity=points();infinity[0].pointKernelMm=[Infinity,1,1];
 assert.throws(()=>fitCadCircle(infinity,source));
});
test('3D and registration UI connections have unique DOM targets and required event linkage',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const feature=readFileSync(new URL('../feature_ui_v16.mjs',import.meta.url),'utf8');
 const cad=readFileSync(new URL('../cad_package_ui_v13.mjs',import.meta.url),'utf8');
 const registration=readFileSync(new URL('../registration_ui_v15.mjs',import.meta.url),'utf8');
 const renderer=readFileSync(new URL('../cad_viewer_v13.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of feature.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(cad.includes('aeroforge:cad-surface-pick-mode'));
 assert.ok(registration.includes('aeroforge:cad-circle-fit-to-rotor'));
 assert.ok(renderer.includes('setSurfacePickHandler'));
 assert.ok(html.includes('feature_ui_v16.mjs'));
});
