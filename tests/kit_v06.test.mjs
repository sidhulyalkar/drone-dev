import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {qualifyKit,simulationHandoff,assemblyPacket,sources,components} from '../core/kit_v06.mjs';
test('documented Pixhawk 6C bundle does not become flight qualified',()=>{
 const x=qualifyKit();
 assert.equal(x.selected.power,'pm02v3');
 assert.equal(x.flightController.fc,'Pixhawk 6C');
 assert.equal(x.counts.failed,0);
 assert.equal(x.procurementReady,false);
 assert.equal(x.flightQualified,false);
 assert.ok(x.counts.unresolved>=8);
});
test('Pixhawk 6X variant selects digital power module',()=>{
 const x=qualifyKit({variant:'six_x'});
 assert.equal(x.selected.power,'pm02d');
 assert.equal(x.counts.failed,0);
});
test('6C/PM02D and 6X/PM02V3 cross-swaps are blocked',()=>{
 for(const v of [{variant:'six_c',power:'pm02d'},{variant:'six_x',power:'pm02v3'}]){
 const x=qualifyKit(v);
 assert.equal(x.status,'BLOCKED_INCOMPATIBLE');
 assert.equal(x.findings.find(f=>f.id==='power-module').status,'FAIL');
 }
});
test('only documented 4S ESC configuration passes voltage screening',()=>{
 for(const cells of [3,5,6,12]){
 const x=qualifyKit({batteryCells:cells});
 assert.equal(x.findings.find(f=>f.id==='esc-battery').status,'FAIL');
 }
 assert.equal(qualifyKit({batteryCells:4}).findings.find(f=>f.id==='esc-battery').status,'DOCUMENTED');
});
test('manual attestation never changes unverified flight or simulator status',()=>{
 const x=qualifyKit({cadImported:true,physicalInspected:true,batterySku:'known',chargerSku:'known',radioSku:'known',receiverSku:'known'});
 assert.equal(x.findings.find(f=>f.id==='physical-cad').status,'HOLD');
 assert.equal(x.findings.find(f=>f.id==='physical-validation').status,'HOLD');
 assert.equal(x.flightQualified,false);
 assert.equal(x.procurementReady,false);
});
test('bad or unknown inputs are rejected',()=>{
 for(const x of [null,[],{variant:'invented'},{power:'digital'},{batteryCells:4.5},{batteryCells:-2},{batterySku:12},{unknown:12}])assert.throws(()=>qualifyKit(x));
});
test('every finding refers to defined manufacturer or PX4 source',()=>{
 const q=qualifyKit();
 for(const s of Object.values(sources))assert.ok(s.url.startsWith('https://'));
 for(const f of q.findings)for(const key of f.source)assert.ok(sources[key],key);
 assert.equal(components.frame.wheelbaseMm,500);
});
test('generic simulation baseline cannot masquerade as aircraft-specific SITL',()=>{
 const x=simulationHandoff();
 assert.equal(x.baseline.command,'make px4_sitl gz_x500');
 assert.equal(x.custom.status,'BLOCKED_UNCALIBRATED');
 assert.equal(x.custom.measuredMassKg,null);
 assert.equal(x.flightQualified,false);
});
test('assembly packet names exact selected controller and missing evidence',()=>{
 const x=assemblyPacket({variant:'six_x'});
 assert.match(x,/Pixhawk 6X/);
 assert.match(x,/PM02D/);
 assert.match(x,/M8N|M10/);
 assert.match(x,/No authorization/);
});
test('kit UI anchors exist and have unique ids',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../kit_ui_v06.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of ui.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(html.includes('src="./kit_ui_v06.mjs"'));
});
