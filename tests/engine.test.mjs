import test from 'node:test';import assert from 'node:assert/strict';
import {evaluate,toPortableJSON} from '../core/engine.mjs';
import {presets} from '../core/presets.mjs';
const freestyle=presets.find(p=>p.id==='freestyle');
for(const preset of presets)test(`${preset.name} preset has coherent screened components`,()=>{
 const r=evaluate(preset.settings);assert.equal(r.blockers.length,0,JSON.stringify(r.blockers));
 assert.ok(r.metrics.massG>150);assert.ok(r.metrics.flightMin>1);assert.ok(r.metrics.budgetUSD>100);
 assert.equal(r.items.find(x=>x.slot==='Motors').quantity,4);
});
test('pocket stays below the recreational 250g threshold in the illustrative mass model',()=>{const r=evaluate(presets[0].settings);assert.ok(r.metrics.massG<250);assert.ok(r.findings.find(x=>x.code==='MASS_250'))});
test('excessive prop diameter is blocked',()=>{
 const r=evaluate({...freestyle.settings,prop:'p8'}); assert.ok(r.blockers.find(x=>x.code==='PROP_ENVELOPE'));
});
test('battery and motor voltage mismatch is blocked',()=>{
 const r=evaluate({...freestyle.settings,battery:'4s1500'}); assert.ok(r.blockers.find(x=>x.code==='MOTOR_CELLS'));
});
test('wrong stack mounting is blocked',()=>{
 const r=evaluate({...freestyle.settings,stack:'mini'});assert.ok(r.blockers.find(x=>x.code==='STACK_MOUNT'));
});
test('camera voltage and mechanical fit are blocked',()=>{
 const r=evaluate({...freestyle.settings,video:'research'});assert.ok(r.blockers.find(x=>x.code==='VIDEO_BEC'));assert.ok(r.blockers.find(x=>x.code==='CAMERA_FIT'));
});
test('payload affects mass, endurance, and thrust ratio',()=>{
 const s=freestyle.settings,a=evaluate(s),b=evaluate({...s,payload:200});
 assert.ok(b.metrics.massG>a.metrics.massG);assert.ok(b.metrics.flightMin<a.metrics.flightMin);assert.ok(b.metrics.thrustRatio<a.metrics.thrustRatio);
});
test('portable file preserves disclaimer and source assumptions',()=>{
 const out=JSON.parse(toPortableJSON(evaluate(freestyle.settings)));
 assert.equal(out.assumptions.evidence,'UNVERIFIED_ESTIMATES');assert.equal(out.bom.airframe.length,8);
});
test('unknown parts do not silently fall back',()=>assert.throws(()=>evaluate({...freestyle.settings,frame:'fake'})));
