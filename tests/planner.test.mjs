import test from 'node:test';import assert from 'node:assert/strict';
import {planCandidates,normalizeBrief} from '../core/planner.mjs';
import {evaluate,getSensitivity,toPortableJSON} from '../core/engine.mjs';
import {parseDesignJSON,bomCSV,designKey,validateSettings} from '../core/portable.mjs';
import {presets} from '../core/presets.mjs';
import {progress,checklistCount} from '../core/checklist.mjs';
const settings=presets.find(x=>x.id==='freestyle').settings;
test('planner deterministically returns three distinct architectures',()=>{
 const a=planCandidates({mission:'research',budgetUSD:1500,payloadG:100,priority:'endurance'});
 const b=planCandidates({mission:'research',budgetUSD:1500,payloadG:100,priority:'endurance'});
 assert.equal(a.candidates.length,3);assert.deepEqual(a.candidates.map(x=>x.presetId),b.candidates.map(x=>x.presetId));
 assert.equal(new Set(a.candidates.map(x=>x.settings.frame)).size,3);
});
test('planner considers startup equipment in budget and flags shortages',()=>{
 const p=planCandidates({mission:'research',budgetUSD:100,payloadG:0,priority:'cost'});
 assert.ok(p.candidates.every(x=>x.shortfalls.some(s=>s.includes('over stated'))));
});
test('planner does not accidentally alter reference presets',()=>{
 const original=structuredClone(presets);planCandidates({mission:'freestyle',payloadG:200});assert.deepEqual(presets,original);
});
test('scenario bounds are ordered, transparent and respond to payload',()=>{
 const r=evaluate(settings);assert.ok(r.metrics.flightLowMin<r.metrics.flightMin);assert.ok(r.metrics.flightMin<r.metrics.flightHighMin);
 const points=getSensitivity(r);assert.ok(points.every((p,i)=>i===0||p.minutes<=points[i-1].minutes));
});
test('airframe vs ground equipment costs never silently combined',()=>{
 const a=evaluate({...settings,groundKit:'none'}),b=evaluate({...settings,groundKit:'digital'});
 assert.equal(a.metrics.budgetUSD,b.metrics.budgetUSD);
 assert.ok(b.metrics.startupUSD>a.metrics.startupUSD);
 assert.equal(b.metrics.startupUSD,b.metrics.budgetUSD+b.metrics.groundUSD);
});
test('ground video mismatch is highlighted',()=>{
 const r=evaluate({...settings,groundKit:'analog'});assert.ok(r.findings.some(x=>x.code==='GROUND_VIDEO'));
});
test('file round trip only imports validated settings not untrusted metrics',()=>{
 const r=evaluate({...settings,groundKit:'digital'}),file=toPortableJSON(r);
 const importSettings=parseDesignJSON(file);assert.deepEqual(importSettings,r.settings);
 const invalid=JSON.parse(file);invalid.settings.frame='fake';assert.throws(()=>parseDesignJSON(JSON.stringify(invalid)));
});
test('malformed payload and unknown plans rejected',()=>{
 assert.throws(()=>evaluate({...settings,payload:-5}));assert.throws(()=>evaluate({...settings,groundKit:'magic'}));
 assert.throws(()=>validateSettings({...settings,payload:Infinity}));
 assert.throws(()=>parseDesignJSON('{oops}'));
});
test('CSV quoting / mass and checklist count are well-formed',()=>{
 const r=evaluate(settings),csv=bomCSV(r);assert.match(csv,/"Aircraft","Kestrel 5/);assert.ok(csv.includes('UNVERIFIED'));
 assert.equal(progress({prop_off:true,airspace:true}).checked,2);assert.ok(checklistCount>=12);
});
test('design fingerprint is stable and sensitive to changes',()=>{
 const a=designKey({...settings,groundKit:'none'});
 assert.equal(a,designKey({...settings}));
 assert.notEqual(a,designKey({...settings,payload:20}));
});
test('normalization handles malformed mission and priority',()=>{
 const b=normalizeBrief({mission:'other',priority:'x',budgetUSD:-1});assert.equal(b.mission,'explore');assert.equal(b.priority,'balanced');assert.equal(b.budgetUSD,0);
});
import {candidateEvidence,findEvidence,evidenceIntegrity} from '../core/evidence.mjs';
test('externally researched SKU leads never masquerade as qualified catalog items',()=>{
 assert.ok(evidenceIntegrity());assert.ok(candidateEvidence.every(x=>x.status!=='verified-for-build'));
 assert.ok(findEvidence('frame','kestrel').length===1);
});
