import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {INTERFACE_SCHEMA,INTERFACE_REVIEW_DATE,X500_PART_REFERENCES,
 X500_INTERFACE_EDGES,findInterfacePart,interfacePartsForSlot,
 analyzeInterfacePair,compileX500InterfaceAudit,researchRoleForShowcasePart,
 interfaceSourcePacket} from '../core/interface_registry_v21.mjs';

test('source-anchored electrical and mechanical references carry real option SKU identifiers or explicit family status',()=>{
 assert.equal(INTERFACE_REVIEW_DATE,'2026-10-11');
 assert.ok(X500_PART_REFERENCES.length>=8);
 assert.equal(new Set(X500_PART_REFERENCES.map(x=>x.id)).size,X500_PART_REFERENCES.length);
 for(const p of X500_PART_REFERENCES){
  assert.equal(p.source.reviewed,INTERFACE_REVIEW_DATE);
  assert.ok(p.source.url.startsWith('https://'));
  assert.equal(p.receivedHardwareRevision,null);
  assert.equal(p.receivedIdentityVerified,false);
  assert.equal(p.qualifiedForConstruction,false);
  assert.equal(p.qualifiedForPower,false);
  assert.equal(p.qualifiedForFlight,false);
  assert.ok(p.interfaces.length);
  assert.ok(p.interfaces.every(i=>i.pinMap===null&&i.gender===null&&!i.partRevisionInspected));
 }
 for(const sku of ['520085','520086','520081','18069A','30120','15011'])
  assert.ok(X500_PART_REFERENCES.some(x=>x.sku===sku),'Missing documented published SKU '+sku);
});
test('one CW and one CCW motor option are distinct source identities but do not confer PX4 rotor mapping',()=>{
 const cw=findInterfacePart('x500-motor-cw'),ccw=findInterfacePart('x500-motor-ccw');
 assert.equal(cw.sku,'520085');assert.equal(ccw.sku,'520086');
 assert.notEqual(cw.claims.find(c=>c.key==='rotation_label').value,
   ccw.claims.find(c=>c.key==='rotation_label').value);
 assert.ok(cw.holds.some(h=>h.includes('NOT by themselves')));
 const matched=analyzeInterfacePair('x500-motor-cw','x500-esc20','motor-drive');
 assert.equal(matched.status,'FAMILY_MATCH_UNVERIFIED');
 assert.equal(matched.intersections[0].family,'MR30_MOTOR_PHASE_3');
 assert.equal(matched.connectorGenderVerified,false);
 assert.equal(matched.qualifiedForPower,false);
});
test('X500 ESC power and PDB share published XT30 family, not inspected polarity and live current rating',()=>{
 const pair=analyzeInterfacePair('x500-esc20','x500-pdb','esc-power');
 assert.equal(pair.status,'FAMILY_MATCH_UNVERIFIED');
 assert.equal(pair.intersections[0].family,'XT30_ESC_DC');
 assert.equal(pair.polarityVerified,false);
 assert.equal(pair.measuredMatingGeometry,false);
});
test('6C analog with PM02D digital is a hard family mismatch; 6X digital remains unverified',()=>{
 const blocked=analyzeInterfacePair('x500-6c-fc-family','x500-pm02d','fc-power');
 assert.equal(blocked.status,'BLOCK_FAMILY_MISMATCH');
 assert.equal(blocked.intersections.length,0);
 const matched=analyzeInterfacePair('x500-6x-fc-family','x500-pm02d','fc-power');
 assert.equal(matched.status,'FAMILY_MATCH_UNVERIFIED');
 assert.equal(matched.exactPinoutVerified,false);
 assert.ok(findInterfacePart('x500-pm02d').holds.some(h=>h.includes('HV')));
});
test('no model output claims mechanical mating on conflicting motor mount patterns',()=>{
 const screen=analyzeInterfacePair('x500-frame','x500-motor-cw','mechanical');
 assert.equal(screen.status,'UNMEASURED_MATING_GEOMETRY');
 assert.equal(screen.measuredMatingGeometry,false);
 assert.deepEqual(findInterfacePart('x500-frame').claims.find(x=>x.key==='motor_mount_patterns_mm').value,[16,19]);
});
test('variant-aware kit graph selects only documented matched controller/power module family',()=>{
 const c=compileX500InterfaceAudit({variant:'six_c',batteryCells:4,motorId:'x500-motor-cw'});
 const x=compileX500InterfaceAudit({variant:'six_x',batteryCells:4,motorId:'x500-motor-ccw'});
 assert.equal(c.schema,INTERFACE_SCHEMA);
 assert.equal(c.status,'FAMILY_DOCUMENTED_WITH_OPEN_HOLDS');
 assert.equal(c.references[0].id,'x500-6c-fc-family');
 assert.equal(c.references[1].id,'x500-6c-pm-family');
 assert.equal(x.references[0].id,'x500-6x-fc-family');
 assert.equal(x.references[1].id,'x500-pm02d');
 assert.equal(x.references[3].sku,'520086');
 assert.ok(c.edges.every(e=>e.qualifiedForFlight===false));
 assert.ok(X500_INTERFACE_EDGES.some(e=>e.status==='MISSING_PIN_LEVEL_WIRING'));
});
test('unsupported pack remains blocking regardless of otherwise matching SKU families',()=>{
 const invalid=compileX500InterfaceAudit({variant:'six_c',batteryCells:6});
 assert.equal(invalid.status,'BLOCKED_SELECTION');
 assert.equal(invalid.blockingCount,1);
 assert.match(invalid.blocking[0],/4S/);
 assert.equal(invalid.procurementApproved,false);
 assert.equal(invalid.powerApproved,false);
 assert.throws(()=>compileX500InterfaceAudit({variant:'bad'}),/Unknown X500 variant/);
 assert.throws(()=>compileX500InterfaceAudit({motorId:'not-real'}),/Unknown motor reference/);
 assert.throws(()=>analyzeInterfacePair('x500-esc20','nope','esc-power'));
});
test('source packet preserves original dated evidence and does not become order or flight ready',()=>{
 const r=interfaceSourcePacket({variant:'six_x',batteryCells:4});
 assert.equal(r.audit.references[1].sku,'15011');
 assert.equal(r.sourceAsOf,'2026-10-11');
 assert.deepEqual(r.receivedPartEvidence,[]);
 assert.equal(r.purchasingReady,false);
 assert.equal(r.benchPowerReady,false);
 assert.equal(r.flightReady,false);
});
test('FPV illustrative part roles map only to separate X500 research categories',()=>{
 assert.equal(researchRoleForShowcasePart('motor-0'),'motor');
 assert.equal(researchRoleForShowcasePart('esc-2'),'esc');
 assert.equal(researchRoleForShowcasePart('stack'),'controller');
 assert.equal(researchRoleForShowcasePart('camera'),null);
 assert.equal(researchRoleForShowcasePart('not-a-real-part'),null);
 assert.equal(interfacePartsForSlot('esc')[0].sku,'520081');
});
test('engineering disclosure and Build research entry point are connected without altering conceptual design selection',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../interface_audit_ui_v21.mjs',import.meta.url),'utf8');
 const build=readFileSync(new URL('../inspector_ui_v19.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['v21-interface-audit','v21-role','v21-motor','v21-export',
   'v21-status','v21-part-list','v21-edges','v21-warning','v21-current'])
   assert.ok(ids.includes(id),id);
 assert.ok(html.includes('interface_audit_ui_v21.mjs'));
 assert.ok(html.includes('interface_audit_v21.css'));
 assert.match(build,/aeroforge:source-interface-research/);
 assert.match(build,/different aircraft family/);
 assert.match(ui,/aeroforge:source-interface-research/);
 assert.match(ui,/aeroforge:x500-record-updated/);
 assert.match(ui,/interfaceSourcePacket/);
});
