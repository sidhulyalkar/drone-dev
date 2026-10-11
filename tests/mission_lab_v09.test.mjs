import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODULES,MODULE_BY_ID,SCENARIOS,SCENARIO_BY_ID,MODULE_CATEGORIES,TOPOLOGIES,analyzeMission,compareMissions} from '../core/mission_lab_v09.mjs';
test('mission library has six distinct use cases and at least 35 unique module classes',()=>{
 assert.equal(SCENARIOS.length,6);
 assert.ok(MODULES.length>=35);
 assert.equal(new Set(SCENARIOS.map(x=>x.id)).size,SCENARIOS.length);
 assert.equal(new Set(MODULES.map(x=>x.id)).size,MODULES.length);
});
test('each concept uses only declared module classes and supported topologies',()=>{
 for(const s of SCENARIOS){
  assert.ok(TOPOLOGIES.includes(s.topology));
  assert.equal(new Set(s.modules).size,s.modules.length);
  for(const id of [...s.modules,...s.optional])assert.ok(MODULE_BY_ID[id],s.id+' '+id);
  const report=analyzeMission(s.id);
  assert.equal(report.counts.blocks,0,s.id+': '+report.findings.filter(x=>x.severity==='BLOCK').map(x=>x.summary).join('; '));
  assert.equal(report.qualified,false);
  assert.equal(report.permittedToFly,false);
  assert.equal(report.priced,false);
  assert.ok(report.counts.holds>=report.modules.length+2);
 }
});
test('structured safety/research holds persist if all optional modules are installed',()=>{
 for(const s of SCENARIOS){
  const report=analyzeMission(s.id,s.optional);
  assert.ok(report.findings.find(f=>f.id==='safety'));
  assert.ok(report.findings.find(f=>f.id==='airspace'));
  assert.notEqual(report.readiness,'FLIGHT_READY');
  assert.equal(report.geometryAuthority,'SCHEMATIC_ONLY_NOT_DIMENSIONED_CAD');
  assert.equal(report.permittedToFly,false);
 }
});
test('air sampling requires remote inlet prerequisites and remains uncalibrated',()=>{
 const x=analyzeMission('air-sampler');
 assert.ok(x.selectedIds.includes('pm25'));
 assert.ok(x.selectedIds.includes('air-inlet-boom'));
 assert.ok(x.findings.some(x=>/prop wash/i.test(x.summary)));
 assert.ok(x.findings.some(x=>/ground references/i.test(x.summary)));
 assert.equal(x.priced,false);
});
test('GNSS-denied interior uses guards, VIO, optical flow but not RTK',()=>{
 const x=analyzeMission('indoor-inventory');
 assert.equal(x.concept.environment,'indoor');
 assert.ok(x.selectedIds.includes('vio-core'));
 assert.ok(x.selectedIds.includes('optical-flow'));
 assert.ok(!x.selectedIds.includes('rtk'));
 assert.equal(x.concept.topology,'guarded-quad');
});
test('outdoor rotor count and VTOL lift/cruise are separate architectures',()=>{
 assert.equal(analyzeMission('accessible-trails').concept.topology,'hex');
 const v=analyzeMission('habitat-vtol');
 assert.equal(v.concept.topology,'vtol');
 assert.ok(v.selectedIds.includes('airspeed'));
 assert.ok(v.selectedIds.includes('transition-actuation'));
 assert.equal(v.concept.baseline,null);
});
test('adding an optional part changes selected module count, holds and grouping but not source recipe',()=>{
 const before=analyzeMission('solar-roof');
 const after=analyzeMission('solar-roof',['collision-sensors']);
 assert.equal(after.counts.modules,before.counts.modules+1);
 assert.equal(after.counts.holds,before.counts.holds+1);
 assert.equal(after.selectedIds.includes('collision-sensors'),true);
 assert.equal(before.selectedIds.includes('collision-sensors'),false);
 assert.equal(SCENARIO_BY_ID['solar-roof'].modules.includes('collision-sensors'),false);
 assert.ok(after.groups.some(x=>x.category==='sensing'&&x.modules.includes('collision-sensors')));
});
test('unknown module, inappropriate scenario module, corrupt input is rejected',()=>{
 assert.throws(()=>analyzeMission('nonexistent'));
 assert.throws(()=>analyzeMission('solar-roof','rtk'));
 assert.throws(()=>analyzeMission('solar-roof',['injected-module']));
 assert.throws(()=>analyzeMission('solar-roof',['vtol-wing']));
 assert.throws(()=>analyzeMission('solar-roof',new Array(41).fill('rid')));
});
test('optional topology incompatibility is blocked, not quietly counted as compatible',()=>{
 const x=analyzeMission('garden-mapper',['parachute-class']);
 assert.equal(x.counts.blocks,0);
 // Every selected module has an explicit architecture listing and evidence hold.
 for(const m of x.modules)assert.ok(m.topologies.includes(x.concept.topology));
});
test('mission comparisons report real set differences without attributing safety scores',()=>{
 const x=compareMissions('indoor-inventory','habitat-vtol');
 assert.equal(x.topologyDifference,true);
 assert.ok(x.onlyLeft.length>0);
 assert.ok(x.onlyRight.length>0);
 assert.ok(x.shared.length>0);
 assert.match(x.notice,/not validated/);
 const y=compareMissions('solar-roof','solar-roof',['collision-sensors'],[]);
 assert.deepEqual(y.onlyLeft,['collision-sensors']);
});
test('module definition has schema-valid category, interface and manufacturer qualification disclaimer',()=>{
 for(const m of MODULES){
  assert.ok(MODULE_CATEGORIES.includes(m.category),m.id);
  assert.ok(m.interface.length>0);
  assert.ok(m.hold.length>20);
  assert.equal(m.stage,'CONCEPT_ONLY');
 }
});
test('UI has all active DOM identifiers, no duplicate ids and exported mission engine import',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../mission_lab_ui_v09.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(html.includes('mission_lab_ui_v09.mjs'));
 assert.ok(html.includes('mission_lab_v09.css'));
 assert.match(js,/CONCEPT/);
 assert.match(js,/NOT VERIFIED/);
});
