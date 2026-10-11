import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCENARIOS,MODULE_BY_ID} from '../core/mission_lab_v09.mjs';
import {SCENE_AUTHORITY,REQUIRED_MEASUREMENTS,buildMissionScene,compileMissionBuildHandoff,validateSceneLayouts} from '../core/architecture_v10.mjs';
test('all six mission designs generate finite normalized geometry with unique node IDs',()=>{
 assert.equal(SCENARIOS.length,6);
 for(const s of SCENARIOS){
  const x=buildMissionScene(s.id);
  assert.equal(x.authority,SCENE_AUTHORITY);
  assert.ok(x.nodes.length>=6);
  assert.equal(new Set(x.nodes.map(n=>n.id)).size,x.nodes.length);
  assert.ok(x.nodes.every(n=>n.authority===SCENE_AUTHORITY));
  assert.ok(x.nodes.every(n=>n.position.length===3&&n.position.every(Number.isFinite)));
  assert.equal(x.qualification.flight,false);assert.equal(x.qualification.physicalFit,false);
 }
});
test('guarded quad gets four guard shells and exactly four rotors',()=>{
 const x=buildMissionScene('indoor-inventory');
 assert.equal(x.rotorCount,4);
 assert.equal(x.nodes.filter(n=>n.kind==='rotor').length,4);
 assert.equal(x.nodes.filter(n=>n.kind==='guard').length,4);
 assert.equal(x.nodes.some(n=>n.kind==='wing'),false);
});
test('hex layout uses six separate rotor nodes rather than a drawn quad',()=>{
 const x=buildMissionScene('accessible-trails');
 assert.equal(x.rotorCount,6);
 assert.equal(x.nodes.filter(n=>n.kind==='rotor').length,6);
 assert.equal(x.nodes.some(n=>n.kind==='wing'),false);
});
test('VTOL diagram has hypothetical wing, lift rotors, forward propulsion with no claimed sizing',()=>{
 const x=buildMissionScene('habitat-vtol');
 assert.equal(x.rotorCount,4);
 assert.ok(x.nodes.some(n=>n.kind==='wing'));
 assert.ok(x.nodes.some(n=>n.kind==='cruise'));
 assert.equal(x.qualification.sitl,false);
 assert.match(x.warning,/NOT|not|Neither/);
});
test('no dimensions, mass, current, pinout, supplier or collision test gets fabricated',()=>{
 for(const s of SCENARIOS){
  const x=buildMissionScene(s.id);
  for(const m of x.moduleRequirements){
   assert.equal(m.geometry.mountPatternMm,null);
   assert.equal(m.geometry.envelopeMm,null);
   assert.equal(m.geometry.measuredPositionM,null);
   assert.equal(m.mass.massG,null);
   assert.equal(m.power.supplyVoltageV,null);
   assert.equal(m.power.peakCurrentA,null);
   assert.equal(m.power.pinoutSourceUrl,null);
   assert.equal(m.vendor.sku,null);
   assert.equal(m.actualPhysicalCompatibility,'UNKNOWN');
  }
 }
});
test('optional module updates scene deterministically without changing default recipe',()=>{
 const original=buildMissionScene('solar-roof');
 const withAdd=buildMissionScene('solar-roof',['collision-sensors']);
 assert.deepEqual(buildMissionScene('solar-roof'),original);
 assert.equal(withAdd.moduleRequirements.length,original.moduleRequirements.length+1);
 assert.ok(withAdd.moduleRequirements.some(x=>x.moduleId==='collision-sensors'));
 assert.ok(withAdd.holds.length>=original.holds.length);
 assert.equal(withAdd.qualification.wiring,false);
});
test('virtual software module has no misleading geometric proxy',()=>{
 const x=buildMissionScene('garden-mapper');
 const software=x.moduleRequirements.filter(m=>m.category==='software');
 assert.ok(software.length>0);
 for(const m of software){
  assert.equal(m.slotState,'SOFTWARE_ONLY');
  assert.ok(!x.nodes.some(n=>n.moduleId===m.moduleId));
 }
});
test('mount allocator never double assigns a physical slot and exposes capacity holds',()=>{
 for(const scenario of SCENARIOS){
  const x=buildMissionScene(scenario.id,scenario.optional);
  const real=x.mountAlloc.filter(m=>m.state==='ILLUSTRATIVE_ASSIGNED_NOT_FIT_CHECKED');
  assert.equal(new Set(real.map(m=>m.slot)).size,real.length);
  assert.equal(x.counts.unassigned,x.mountAlloc.filter(m=>m.state==='UNASSIGNED_CAPACITY_HOLD').length);
  assert.equal(x.counts.unassigned,x.holds.filter(m=>m.code==='MOUNT_SLOT_EXHAUSTED').length);
 }
});
test('mission handoff contains no software claim of build, powered or flight readiness',()=>{
 for(const s of SCENARIOS){
  const x=compileMissionBuildHandoff(buildMissionScene(s.id));
  assert.equal(x.schema,'aeroforge/mission-build-handoff/v1.0');
  assert.equal(x.supportedByExistingAssemblyCopilot,false);
  assert.equal(x.flightReady,false);assert.equal(x.purchaseReady,false);
  assert.equal(x.inspectionVerified,false);
  assert.equal(x.measurementValues,null);assert.deepEqual(x.acceptedEvidence,[]);
  assert.ok(x.steps.length>=6);
  assert.ok(REQUIRED_MEASUREMENTS.includes('pinoutSourceUrl'));
  const seen=new Set();
  for(const stage of x.steps){
   assert.equal(stage.status,'UNVERIFIED');
   for(const p of stage.requires)assert.ok(seen.has(p),s.id+': '+stage.id+' prior '+p);
   seen.add(stage.id);
  }
 }
});
test('mission module-specific tasks follow CAD check and cannot be self signed',()=>{
 const x=buildMissionScene('solar-roof');
 const b=compileMissionBuildHandoff(x);
 assert.ok(b.steps.find(s=>s.id==='install-rgb-gimbal'));
 assert.ok(b.steps.find(s=>s.id==='install-radiometric-thermal'));
 for(const t of b.steps.filter(t=>t.id.startsWith('install-'))){
  assert.ok(t.requires.includes('cad-registration'));
  assert.equal(t.gate,'INTERFACE_HOLD');
 }
 assert.ok(b.steps.find(s=>s.id==='integration-review').requires.includes('propulsion-qualification'));
});
test('v1.0 contract rejects incompatible imports and has deterministic display identity',()=>{
 const a=buildMissionScene('air-sampler');
 const b=buildMissionScene('air-sampler');
 assert.deepEqual(a,b);
 assert.equal(compileMissionBuildHandoff(a).key,compileMissionBuildHandoff(b).key);
 assert.throws(()=>compileMissionBuildHandoff({schema:'wrong'}));
 assert.throws(()=>buildMissionScene('made-up'));
 assert.throws(()=>buildMissionScene('solar-roof',['invented-module']));
 assert.equal(validateSceneLayouts().every(x=>x.finitePositions&&x.onlyConcepts),true);
});
test('every class from scene references a known manufacturer-unverified module identity',()=>{
 for(const s of SCENARIOS){
  const x=buildMissionScene(s.id);
  for(const m of x.moduleRequirements)assert.ok(MODULE_BY_ID[m.moduleId]);
 }
});
test('3D UI DOM bindings exist, no duplicate IDs, mission selection event connects controllers',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../mission_scene_ui_v10.mjs',import.meta.url),'utf8');
 const oldUi=readFileSync(new URL('../mission_lab_ui_v09.mjs',import.meta.url),'utf8');
 const render=readFileSync(new URL('../mission_3d_v10.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of ui.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(html.includes('mission_scene_ui_v10.mjs')&&html.includes('mission_v10.css'));
 assert.ok(oldUi.includes('aeroforge:mission-updated')&&ui.includes('aeroforge:mission-updated'));
 assert.ok(render.includes('OrbitControls')&&render.includes('dispose()'));
});
