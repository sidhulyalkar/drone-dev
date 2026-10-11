import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {KIT_RECORD_SCHEMA,compileX500Record,attachX500Cad,compareX500Records} from '../core/x500_record_v14.mjs';
test('X500 controller/power variants have distinct exact family graph identities',()=>{
 const c=compileX500Record({variant:'six_c'});
 const x=compileX500Record({variant:'six_x'});
 assert.equal(c.schema,KIT_RECORD_SCHEMA);
 assert.notEqual(c.revisionIdentity,x.revisionIdentity);
 assert.equal(c.parts.controller.familyId,'pixhawk-6c');
 assert.equal(x.parts.controller.familyId,'pixhawk-6x');
 assert.equal(c.parts.power.familyId,'pm02v3');
 assert.equal(x.parts.power.familyId,'pm02d');
 for(const record of [c,x]){
  assert.equal(record.graphStatus,'HOLDS_UNVERIFIED');
  assert.equal(record.procurementApproved,false);
  assert.equal(record.flightApproved,false);
  assert.equal(record.powerApproved,false);
  assert.ok(record.edges.every(e=>e.pinMap===null&&e.independentReview===false));
 }
});
test('incompatible controller and power module family is a hard blocker',()=>{
 for(const config of [{variant:'six_c',power:'pm02d'},{variant:'six_x',power:'pm02v3'}]){
  const record=compileX500Record(config);
  assert.equal(record.graphStatus,'BLOCKED');
  assert.ok(record.edges.some(e=>e.kind==='FC power module'&&e.status==='BLOCK_FAMILY_MISMATCH'));
  assert.equal(record.powerApproved,false);
 }
});
test('incorrect pack series remains blocked even with a documented kit family',()=>{
 const d=compileX500Record({variant:'six_c',batteryCells:3});
 assert.equal(d.graphStatus,'BLOCKED');
 assert.ok(d.edges.some(e=>e.status==='BLOCK_ESC_CELL_RATING'));
});
test('manufacturer family info never silently establishes SKU revisions, CAD positions or wiring',()=>{
 const d=compileX500Record();
 assert.equal(d.parts.frame.receivedRevision,null);
 assert.equal(d.parts.frame.cadSourceSha256,null);
 assert.equal(d.geometry.motorXYZm,null);
 assert.equal(d.geometry.measuredCgMm,null);
 assert.equal(d.geometry.manufacturerAuthenticated,false);
 assert.equal(d.geometry.aircraftDatumRegistered,false);
 assert.equal(d.edges.find(x=>x.kind==='FC power module').pinMap,null);
});
function visual(overrides={}){
 return {schema:'aeroforge/cad-preview-evidence/v1.3',glbHashMatchesManifest:true,
  localStepHashMatchesManifest:true,
  manifest:{
   source:{fileName:'x500v2-frame.step',sha256:'b'.repeat(64)},
   mesh:{sha256:'c'.repeat(64)},
   conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED'}
  },...overrides};
}
test('hash-matched frame package links to frame family but remains unregistered/unverified',()=>{
 const d=compileX500Record(),next=attachX500Cad(d,visual());
 assert.equal(next.parts.frame.cadSourceSha256,'b'.repeat(64));
 assert.equal(next.geometry.sourceHash,'b'.repeat(64));
 assert.equal(next.geometry.visualGlbHash,'c'.repeat(64));
 assert.equal(next.geometry.sourceLocalBytesChecked,true);
 assert.equal(next.geometry.manufacturerAuthenticated,false);
 assert.equal(next.geometry.aircraftDatumRegistered,false);
 assert.equal(next.geometry.collisionQualified,false);
 assert.equal(next.flightApproved,false);
 assert.equal(d.parts.frame.cadSourceSha256,null);
});
test('wrong source and spoofed package cannot attach to aircraft reference',()=>{
 const d=compileX500Record();
 assert.throws(()=>attachX500Cad(d,{schema:'invalid'}));
 assert.throws(()=>attachX500Cad(d,visual({glbHashMatchesManifest:false})));
 const v=visual();v.manifest.source.fileName='another-frame.step';
 assert.throws(()=>attachX500Cad(d,v),/Only exact-named/);
 const x=visual();x.manifest.source.sha256='bad';
 assert.throws(()=>attachX500Cad(d,x),/digest/);
});
test('cad source change invalidates geometry-linked evidence without qualifying physical fit',()=>{
 const a=compileX500Record(),b=attachX500Cad(a,visual());
 const delta=compareX500Records(a,b);
 assert.equal(delta.geometryChanged,true);
 assert.ok(delta.changedSlots.includes('frame'));
 assert.ok(delta.invalidatedEvidence.includes('motor datums'));
 assert.equal(delta.neverAutoApproved,true);
});
test('controller or power module revision swaps invalidate their specific dependent evidence',()=>{
 const a=compileX500Record({variant:'six_c'});
 const b=compileX500Record({variant:'six_x'});
 const delta=compareX500Records(a,b);
 assert.ok(delta.changedSlots.includes('controller'));
 assert.ok(delta.changedSlots.includes('power'));
 assert.ok(delta.invalidatedEvidence.includes('power connector pinout'));
 assert.ok(delta.invalidatedEvidence.includes('PX4 actuator mapping'));
 assert.equal(delta.independentReviewRequired,true);
});
test('hardware catalog, CAD section, and PX4 assembly sync are wired into page',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const kit=readFileSync(new URL('../kit_ui_v06.mjs',import.meta.url),'utf8');
 const cad=readFileSync(new URL('../cad_package_ui_v13.mjs',import.meta.url),'utf8');
 const assembly=readFileSync(new URL('../assembly_ui_v08.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['v14-identity','v14-parts','v14-connections','v14-change','v14-download'])
  assert.ok(ids.includes(id));
 assert.ok(kit.includes("aeroforge:x500-record-updated"));
 assert.ok(kit.includes("aeroforge:cad-visual-package-verified"));
 assert.ok(cad.includes("aeroforge:cad-visual-package-verified"));
 assert.ok(assembly.includes("aeroforge:x500-record-updated"));
});
