import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ASSEMBLY_SCHEMA,compileBuildPlan,newBuildSession,reconcileBuildSession,recordObservation,stepStatus,sessionSummary,buildPacket} from '../core/assembly_v08.mjs';
const base={track:'fpv',videoSystem:'analog',selection:{frame:'frame-A',motor:'motor-A',prop:'prop-A',stack:'stack-A',battery:'battery-A',video:'camera-A',radio:'radio-A',receiver:'rx-A'}};
const obs=(note='Observed component serial and revision label')=>({kind:'note',note});
test('FPV plan has deterministic ordered steps and analog source only in chosen branch',()=>{
 const a=compileBuildPlan(base),b=compileBuildPlan(base);
 assert.deepEqual(a,b);assert.equal(a.track,'fpv');
 assert.ok(a.steps.some(x=>x.id==='betaflight-config'));
 assert.ok(!a.steps.some(x=>x.id==='px4-qgc'));
 const v=a.steps.find(x=>x.id==='fpv-video');
 assert.match(v.source.url,/yIcRf_xSujc/);
 assert.equal(a.flightReady,false);
 const positions=new Map(a.steps.map((s,i)=>[s.id,i]));
 for(const s of a.steps)for(const p of s.requires)assert.ok(positions.get(p)<positions.get(s.id));
});
test('all video-system branches are exclusive and firmware remains Betaflight',()=>{
 const expected={analog:'yIcRf_xSujc','dji-o3':'kinmxuOnoUM',walksnail:'5PWL68Y1Fvs'};
 for(const [system,id] of Object.entries(expected)){
 const p=compileBuildPlan({...base,videoSystem:system});
 assert.ok(p.steps.find(x=>x.id==='fpv-video').source.url.includes(id));
 assert.equal(p.steps.filter(x=>x.id==='fpv-video').length,1);
 }
 const unknown=compileBuildPlan({...base,videoSystem:'unspecified'});
 assert.equal(unknown.steps.find(s=>s.id==='fpv-video').gate,'review');
 assert.equal(unknown.steps.find(s=>s.id==='fpv-video').source,null);
});
test('PX4 build excludes Betaflight settings and reports separate actuator instructions',()=>{
 for(const variant of ['six_c','six_x']){
 const p=compileBuildPlan({...base,track:'px4',variant});
 assert.ok(p.steps.some(s=>s.id==='px4-qgc'));
 assert.ok(p.steps.some(s=>s.id==='px4-sitl'));
 assert.equal(p.steps.some(s=>s.id==='betaflight-config'),false);
 assert.equal(p.steps.some(s=>s.id==='fpv-video'),false);
 assert.equal(p.selection.power,variant==='six_c'?'pm02v3':'pm02d');
 assert.equal(p.flightReady,false);
 assert.ok(p.steps.find(s=>s.id==='flight-review').source.url.includes('docs.px4.io'));
 const v=p.steps.find(s=>s.id==='px4-qgc');
 assert.match(v.about,/QGroundControl/);
 }
});
test('evidence cannot promote flight or power approval regardless of number of notes',()=>{
 const p=compileBuildPlan(base);let s=newBuildSession(p);
 for(const x of p.steps)s=recordObservation(s,p,x.id,obs());
 const report=sessionSummary(s,p);
 assert.equal(report.withNotes,report.total);
 assert.equal(report.powerAuthorized,false);
 assert.equal(report.flightAuthorized,false);
 for(const x of p.steps){
  const status=stepStatus(s,p,x.id);
  assert.equal(status.independentlyVerified,false);
  assert.equal(status.releasedForPower,false);
  assert.equal(status.releasedForFlight,false);
 }
 assert.equal(stepStatus(s,p,'unpowered-qa').status,'SAFETY_REVIEW_REQUIRED');
 assert.equal(stepStatus(s,p,'flight-review').status,'SAFETY_REVIEW_REQUIRED');
});
test('missing prerequisites block a step even if user records a premature observation',()=>{
 const p=compileBuildPlan(base);let s=newBuildSession(p);
 const m=stepStatus(s,p,'motors'); assert.equal(m.status,'BLOCKED_DEPENDENCY');
 s=recordObservation(s,p,'motors',obs());
 assert.equal(stepStatus(s,p,'motors').status,'BLOCKED_DEPENDENCY');
 assert.ok(stepStatus(s,p,'motors').prerequisitesMissing.includes('frame'));
});

test('unrelated changes preserve observations but dependent part changes invalidate evidence',()=>{
 let p=compileBuildPlan(base),s=newBuildSession(p);
 s=recordObservation(s,p,'frame',obs());
 s=recordObservation(s,p,'stack',obs('Board model text and mounting spec checked'));
 const n=compileBuildPlan({...base,selection:{...base.selection,stack:'stack-B'}});
 assert.notEqual(p.key,n.key);
 const t=reconcileBuildSession(s,n);
 assert.equal(t.entries.frame.receipts.length,1);
 assert.equal(t.entries.stack,undefined);
 assert.ok(t.invalidated.some(x=>x.stepId==='stack'&&x.reason==='PART_OR_TEMPLATE_REVISION_CHANGED'));
 assert.equal(sessionSummary(t,n).invalidated,1);
});
test('video-system swap invalidates only relevant lesson receipts',()=>{
 const p=compileBuildPlan(base);let s=newBuildSession(p);
 s=recordObservation(s,p,'frame',obs());
 s=recordObservation(s,p,'fpv-video',obs());
 const next=compileBuildPlan({...base,videoSystem:'dji-o3'});
 const t=reconcileBuildSession(s,next);
 assert.ok(t.entries.frame);
 assert.equal(t.entries['fpv-video'],undefined);
 assert.equal(t.invalidated.length,1);
});
test('switching PX4/FPV archives previous notes and never silently transfers them',()=>{
 const p=compileBuildPlan(base);let s=newBuildSession(p);
 s=recordObservation(s,p,'frame',obs());
 const px=compileBuildPlan({...base,track:'px4'});
 const t=reconcileBuildSession(s,px);
 assert.equal(t.entries.frame,undefined);
 assert.ok(t.invalidated.some(i=>i.stepId==='frame'));
});
test('measurements require finite values and units, notes are bounded',()=>{
 const p=compileBuildPlan(base);let s=newBuildSession(p);
 assert.throws(()=>recordObservation(s,p,'motors',{kind:'measurement',note:'Measured a clearance',value:Infinity,unit:'mm'}));
 assert.throws(()=>recordObservation(s,p,'motors',{kind:'measurement',note:'Measured a clearance',value:2,unit:''}));
 assert.throws(()=>recordObservation(s,p,'motors',{kind:'note',note:'short'}));
 assert.throws(()=>recordObservation(s,p,'motors',{kind:'note',note:'Adequate note',value:5}));
 assert.throws(()=>recordObservation(s,p,'not-a-stage',obs()));
 s=recordObservation(s,p,'motors',{kind:'measurement',note:'Caliper measurement, no independent verification',value:2.5,unit:'mm'});
 assert.equal(s.entries.motors.receipts[0].trust,'SELF_REPORTED_UNREVIEWED');
});
test('strict schema validation prevents arbitrary firmware or corrupted session',()=>{
 assert.throws(()=>compileBuildPlan({track:'quadcopter'}));
 assert.throws(()=>compileBuildPlan({...base,videoSystem:'freestyle'}));
 assert.throws(()=>compileBuildPlan({...base,selection:{motor:{hack:'1'}}}));
 const p=compileBuildPlan(base);const s=newBuildSession(p);
 assert.equal(s.schema,ASSEMBLY_SCHEMA);
 assert.throws(()=>recordObservation(s,compileBuildPlan({...base,videoSystem:'walksnail'}),'frame',obs()));
 assert.throws(()=>reconcileBuildSession({},p));
});
test('print packet captures notes, manufacturer/learning sources and warnings',()=>{
 const p=compileBuildPlan(base);let s=newBuildSession(p);
 s=recordObservation(s,p,'inventory',{kind:'note',note:'I counted components and noted exact labels'});
 const packet=buildPacket(s,p);
 assert.match(packet,/I counted components/);
 assert.match(packet,/SELF_REPORTED_UNREVIEWED/);
 assert.match(packet,/youtube\.com/);
 assert.match(packet,/not.*flight authorization/i);
});
test('assembly UI contract anchors exist, with focus bridge and no duplicate ids',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assembly_ui_v08.mjs',import.meta.url),'utf8');
 const showcase=readFileSync(new URL('../showcase_ui_v07.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of ui.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(html.includes('assembly_ui_v08.mjs'));
 assert.ok(html.includes('assembly_v08.css'));
 assert.ok(showcase.includes('aeroforge:assembly-focus-part'));
 assert.ok(ui.includes('aeroforge:showcase-part-selected'));
});
