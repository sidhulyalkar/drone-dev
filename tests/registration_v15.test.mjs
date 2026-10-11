import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {signedAxisMatrix,REGISTRATION_SCHEMA,X500_REFERENCE_FACTS,proposeX500Registration,attachX500Registration}
 from '../core/registration_v15.mjs';
import {compileX500Record} from '../core/x500_record_v14.mjs';
function preview(opts={}){
 const source={fileName:'x500v2-frame.step',sha256:'a'.repeat(64),
  revision:'SYNTHETIC_TEST_NOT_MANUFACTURER',documentationUrl:'https://example.org/manual'};
 return {schema:'aeroforge/cad-preview-evidence/v1.3',glbHashMatchesManifest:true,
  localStepHashMatchesManifest:true,manifest:{source,mesh:{sha256:'b'.repeat(64)},conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED'}},...opts};
}
function form(){
 return {axisMap:['+X','+Y','+Z'],datumKernelMm:[0,0,0],reviewerLabel:'test-observer',
  observationNotes:'SYNTHETIC data with human observations for regression only, not manufacturer measurements.',
  sourceUnitsReviewed:true,
  rotors:[
   {id:'R1',centerKernelMm:[200,150,0],propDiameterMm:254},
   {id:'R2',centerKernelMm:[-200,150,0],propDiameterMm:254},
   {id:'R3',centerKernelMm:[-200,-150,0],propDiameterMm:254},
   {id:'R4',centerKernelMm:[200,-150,0],propDiameterMm:254}
  ]};
}
test('FRD identity rotation, 90-degree rotations and proper handedness are validated',()=>{
 assert.deepEqual(signedAxisMatrix(['+X','+Y','+Z']),[[1,0,0],[0,1,0],[0,0,1]]);
 assert.deepEqual(signedAxisMatrix(['-Y','+X','+Z']),[[0,-1,0],[1,0,0],[0,0,1]]);
 assert.throws(()=>signedAxisMatrix(['+Y','+X','+Z']),/right-handed/);
 assert.throws(()=>signedAxisMatrix(['+X','+X','+Z']),/repeats/);
 assert.throws(()=>signedAxisMatrix(['+X','+Y','-Z']),/right-handed/);
 assert.throws(()=>signedAxisMatrix(['+X','+Y']),/exactly three/);
});
test('nominal X500 wheelbase comparison records only an unverified observation',()=>{
 const p=proposeX500Registration(preview(),form());
 assert.equal(p.schema,REGISTRATION_SCHEMA);
 assert.equal(p.referenceComparison.expectedDiagonalMm,500);
 assert.deepEqual(p.referenceComparison.candidateDiagonalDistancesMm,[500,500]);
 assert.equal(p.referenceComparison.assessment,'CLOSE_TO_NOMINAL_REFERENCE_ONLY');
 assert.equal(p.status,'UNVERIFIED_CAD_MEASUREMENT_PROPOSAL');
 assert.equal(p.manufacturerIdentityVerified,false);
 assert.equal(p.axesIndependentlyRegistered,false);
 assert.equal(p.flightApproved,false);
 assert.equal(p.fitQualified,false);
 assert.equal(p.measuredAircraftCgMm,null);
 assert.equal(X500_REFERENCE_FACTS.find(f=>f.id==='wheelbase').valueMm,500);
});
test('translation and right-handed axis remapping preserve the CAD source coordinate provenance',()=>{
 const input=form();input.datumKernelMm=[10,20,30];input.axisMap=['-Y','+X','+Z'];
 const p=proposeX500Registration(preview(),input);
 assert.deepEqual(p.rotors[0].centerKernelMm,[200,150,0]);
 assert.deepEqual(p.rotors[0].centerDatumFRDMm,[-130,190,-30]);
 assert.equal(p.dimensionalDraft.frame,'BODY_FRD_USER_DATUM_NOT_CG');
 assert.equal(p.dimensionalDraft.mode,'USER_MEASURED_UNREVIEWED');
 assert.equal(p.dimensionalDraft.source.sha256,'a'.repeat(64));
 assert.equal(p.dimensionalDraft.rotors[0].centerMm[0],-130);
});
test('physical source bytes must have been checked against the correct X500 visual package',()=>{
 assert.throws(()=>proposeX500Registration(null,form()),/hash-checked/);
 const noStep=preview({localStepHashMatchesManifest:false});
 assert.throws(()=>proposeX500Registration(noStep,form()),/Original STEP bytes/);
 const wrong=preview();wrong.manifest.source.fileName='other-frame.step';
 assert.throws(()=>proposeX500Registration(wrong,form()),/exact-name/);
 const broken=preview();broken.manifest.source.sha256='invalid';
 assert.throws(()=>proposeX500Registration(broken,form()),/exact-name/);
});
test('unsafe input rejects unreviewed source units, unknown fields and invalid geometry',()=>{
 const mutations=[
  x=>x.sourceUnitsReviewed=false,x=>x.datumKernelMm=[NaN,0,0],
  x=>x.rotors[0].centerKernelMm=[0,Infinity,0],
  x=>x.rotors[1].id=x.rotors[0].id,
  x=>x.rotors.splice(1,1),
  x=>x.rotors[0].propDiameterMm=0,
  x=>x.axisMap=['+Y','+X','+Z'],
  x=>x.extra='untrusted',
  x=>x.observationNotes='',
  x=>x.reviewerLabel=''
 ];
 for(const mutate of mutations){
  const f=form();mutate(f);assert.throws(()=>proposeX500Registration(preview(),f));
 }
});
test('incorrect wheelbase flags a review while retaining all safety holds',()=>{
 const f=form();f.rotors[0].centerKernelMm=[900,150,0];
 const p=proposeX500Registration(preview(),f);
 assert.equal(p.referenceComparison.assessment,'REVIEW_DIMENSION_OR_PAIRING');
 assert.equal(p.dimensionalScreen.flightApproval,false);
 assert.ok(p.dimensionalScreen.counts.conflicts>=0);
});
test('clearance report uses typed unreviewed inputs and never creates CG-relative PX4 motor coordinates',()=>{
 const p=proposeX500Registration(preview(),form());
 assert.equal(p.dimensionalScreen.schema,'aeroforge/dimensional-evaluation/v1.1');
 assert.equal(p.dimensionalScreen.cadImportedByApp,false);
 assert.equal(p.dimensionalScreen.positionApproval,false);
 assert.ok(p.dimensionalDraft.rotors.every(r=>r.centerMm.length===3));
 assert.equal(p.dimensionalScreen.flightApproval,false);
});
test('canonical hardware record can attach registration only to identical source revision',()=>{
 const p=proposeX500Registration(preview(),form());
 const original=compileX500Record({variant:'six_c'});
 const linked=attachX500Registration(original,preview(),p);
 assert.equal(linked.geometry.unverifiedMotorDatumFRDMm.length,4);
 assert.equal(linked.geometry.sourceHash,'a'.repeat(64));
 assert.equal(linked.geometry.collisionQualified,false);
 assert.equal(linked.geometry.aircraftDatumRegistered,false);
 assert.equal(linked.geometry.motorXYZm,null);
 assert.equal(linked.procurementApproved,false);
 assert.equal(linked.flightApproved,false);
 assert.equal(original.geometry.sourceHash,null);
 const revision=preview();revision.manifest.source.sha256='c'.repeat(64);
 assert.throws(()=>attachX500Registration(original,revision,p),/different CAD package revision/);
});
test('registration cannot attach without independently matching local original STEP bytes',()=>{
 const p=proposeX500Registration(preview(),form());
 assert.throws(()=>attachX500Registration(compileX500Record(),preview({localStepHashMatchesManifest:false}),p),/original STEP bytes/);
});
test('UI registration to CAD and dimensional inspector events exist with unique DOM hooks',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../registration_ui_v15.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../cad_viewer_v13.mjs',import.meta.url),'utf8');
 const cad=readFileSync(new URL('../cad_package_ui_v13.mjs',import.meta.url),'utf8');
 const dimensional=readFileSync(new URL('../dimensional_ui_v11.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const match of ui.matchAll(/el\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),match[1]);
 assert.ok(html.includes('registration_ui_v15.mjs')&&html.includes('registration_v15.css'));
 assert.ok(viewer.includes('setMotorMarkers'));
 assert.ok(cad.includes('aeroforge:cad-visual-package-cleared'));
 assert.ok(cad.includes('aeroforge:cad-motor-annotation-updated'));
 assert.ok(dimensional.includes('aeroforge:cad-registration-to-dimensions'));
});
