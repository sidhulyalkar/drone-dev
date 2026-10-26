import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proposeX500CadMating,CAD_PAIR_SCHEMA,scopeX500CadMating,cadMatingAppliesToRecord} from '../core/cad_mating_v24.mjs';
import {compileX500Record} from '../core/x500_record_v14.mjs';
const preview=(name,hash,bounds)=>({
 schema:'aeroforge/cad-preview-evidence/v1.3',
 glbHashMatchesManifest:true,localStepHashMatchesManifest:true,
 sourceAuthenticated:false,physicalFit:false,manufacturerCadRegisteredToAircraft:false,
 manifest:{schema:'aeroforge/cad-visual-package/v1.3',
  source:{fileName:name,sha256:hash,revision:'SYNTHETIC_FIXTURE',
    sizeBytes:100,documentationUrl:'https://example.org/source',
    licenseNote:'Synthetic test data only, no Holybro bytes'},
  mesh:{fileName:name+'.glb',sha256:'f'.repeat(64),sizeBytes:300,format:'GLB_2',units:'m'},
  conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED',scaleFromKernelToGLTF:0.001,
    solidCount:1,triangleCount:12,sourceAabbKernelMm:bounds},
  qualification:{manufacturerAuthenticated:false,axesRegisteredToFRD:false,
    physicalFit:false,rotorCentersMeasured:false,flightReady:false},
  scope:'VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED'}
});
const frame=()=>preview('x500v2-frame.step','a'.repeat(64),{min:[-400,-400,-30],max:[400,400,30]});
const motor=()=>preview('AIR2216II_Motor_3D.STEP','b'.repeat(64),{min:[-10,-10,0],max:[10,10,35]});
const input=()=>({
 frameMountKernelMm:[250,0,25],motorMountKernelMm:[0,0,0],
 axisMap:['+X','+Y','+Z'],observer:'Engineer A',
 sourceUnitsReviewed:true,framePatternMm:16,motorPatternMm:19,
 datumNotes:'Synthetic frame pad center and motor origin, not independently measured.',
 fastenerNotes:'No real fastener or motor shaft datum has been inspected or confirmed.'});
test('dual CAD source snapshots compute only a tentative placement and review cues',()=>{
 const p=proposeX500CadMating(frame(),motor(),input());
 assert.equal(p.schema,CAD_PAIR_SCHEMA);
 assert.deepEqual(p.registration.motorToFrameTranslationMm,[250,0,25]);
 assert.deepEqual(p.broadphase.positionedMotorAabbKernelMm,{min:[240,-10,25],max:[260,10,60]});
 assert.equal(p.patternHypotheses.frameMinusMotorMm,-3);
 assert.equal(p.mechanicalFitApproved,false);
 assert.equal(p.broadphase.meshIntersectionTested,false);
 assert.equal(p.independence.sourceManufacturerAuthenticated,false);
 assert.equal(p.sourceAuthority,'LOCAL_MATCHING_BYTES_MANUFACTURER_ORIGIN_UNAUTHENTICATED');
});
test('signed axis rotations correctly orient motor native bounds',()=>{
 const f=input();f.axisMap=['-Y','+X','+Z'];f.motorMountKernelMm=[3,4,0];
 const p=proposeX500CadMating(frame(),motor(),f);
 assert.deepEqual(p.registration.motorToFrameTranslationMm,[254,-3,25]);
 assert.equal(p.flightApproved,false);
});
test('missing original STEP confirmation and incorrect part identity fail closed',()=>{
 const wrong=frame();wrong.localStepHashMatchesManifest=false;
 assert.throws(()=>proposeX500CadMating(wrong,motor(),input()),/matching original STEP/);
 const fake=motor();fake.manifest.source.fileName='different.step';
 assert.throws(()=>proposeX500CadMating(frame(),fake,input()),/named manufacturer-source/);
});
test('self-declared data never bypasses unit review, handedness or coordinate bounds',()=>{
 for(const mutate of [
  v=>v.sourceUnitsReviewed=false,
  v=>v.axisMap=['+Y','+X','+Z'],
  v=>v.frameMountKernelMm=[NaN,0,0],
  v=>v.motorPatternMm=0,
  v=>v.datumNotes='short',
  v=>v.fastenerNotes='',
  v=>v.unexpectedApproval=true
 ]){
  const x=input();mutate(x);assert.throws(()=>proposeX500CadMating(frame(),motor(),x));
 }
});
test('imported CAD claims of manufacturer or physical approval are rejected',()=>{
 const f=frame();f.manifest.qualification.manufacturerAuthenticated=true;
 assert.throws(()=>proposeX500CadMating(f,motor(),input()),/falsely claims/);
 const m=motor();m.manufacturerCadRegisteredToAircraft=true;
 assert.throws(()=>proposeX500CadMating(frame(),m,input()),/matching original STEP/);
});
test('browser wiring includes dual local source selection, not remote asset loading',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 assert.match(html,/cad_mating_ui_v24\.mjs/);
 assert.match(ui,/verifyCadPackage/);
 assert.match(ui,/proposeX500CadMating/);
 assert.match(ui,/aeroforge:cad-mating-proposal-updated/);
});

test('existing aircraft frame source fingerprints prevent mixing incompatible CAD revisions',()=>{
 const research=proposeX500CadMating(frame(),motor(),input());
 const record=compileX500Record({variant:'six_c',batteryCells:4});
 const scoped=scopeX500CadMating(research,record);
 assert.equal(cadMatingAppliesToRecord(scoped,record),true);
 const sourceMatched={...record,geometry:{...record.geometry,
  sourceHash:research.frame.sourceSha256,
  visualGlbHash:research.frame.meshSha256}};
 assert.equal(cadMatingAppliesToRecord(scoped,sourceMatched),true);
 for(const changed of [
  {...record,geometry:{...record.geometry,sourceHash:'d'.repeat(64)}},
  {...record,geometry:{...record.geometry,visualGlbHash:'e'.repeat(64)}},
  {...record,parts:{...record.parts,frame:{...record.parts.frame,cadSourceSha256:'f'.repeat(64)}}}
 ]){
  assert.equal(cadMatingAppliesToRecord(scoped,changed),false);
  assert.throws(()=>scopeX500CadMating(research,changed),/Frame CAD in aircraft record differs/);
 }
 assert.equal(scoped.mechanicalFitApproved,false);
 assert.equal(scoped.powerApproved,false);
 assert.equal(scoped.flightApproved,false);
});
