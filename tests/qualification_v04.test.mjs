import test from 'node:test';
import assert from 'node:assert/strict';
import {parts,evidenceRegistry,mainPlateMounts,qualify,normalizeQualification,validateRotorLayout,payloadCgShift,canonicalSnapshot,snapshotSha256,sha256Fallback,inspectionPacket} from '../core/qualification_v04.mjs';

test('baseline never gets promoted by documented facts or checkbox',()=>{
 const r=qualify();assert.equal(r.readiness,'NOT_FLIGHT_QUALIFIED');assert.equal(r.status,'BLOCKED');assert.ok(r.failed>0);assert.ok(r.holds>0);assert.equal(r.ruleCount,16);
 assert.ok(r.rules.every(x=>['id','status','evidence','action','from','to','kind'].every(k=>k in x)));
});
test('frame datum is real 30.5 and 20 mm DXF hole spacing, not motor XYZ',()=>{
 assert.equal(mainPlateMounts.pattern30_5[2][0]-mainPlateMounts.pattern30_5[0][0],30.5);
 assert.equal(mainPlateMounts.pattern30_5[1][1]-mainPlateMounts.pattern30_5[0][1],30.5);
 assert.equal(mainPlateMounts.pattern20[2][0]-mainPlateMounts.pattern20[0][0],20);
 assert.equal(mainPlateMounts.pattern20[1][1]-mainPlateMounts.pattern20[0][1],20);
 assert.ok(!('motorCenters' in mainPlateMounts));
});
test('different stack id changes provenance and does not transfer old stack pinout',()=>{
 const ref=qualify(),replacement=qualify({stackCandidate:'iflight-research'});
 assert.notEqual(ref.stack.id,replacement.stack.id);assert.notDeepEqual(ref.stack.facts,replacement.stack.facts);
 assert.ok(replacement.rules.find(x=>x.id==='stack-availability').status==='FAIL_SOURCE');
 assert.ok(replacement.rules.find(x=>x.id==='fc-firmware').status==='HOLD_SOURCE');
});
test('6S screening passes voltage but 4S or 8S fail motor/stack as appropriate',()=>{
 const a=qualify({packCells:6});assert.equal(a.rules.find(x=>x.id==='battery-motor-voltage').status,'PASS_DOCUMENTED');
 const b=qualify({packCells:4});assert.equal(b.rules.find(x=>x.id==='battery-motor-voltage').status,'FAIL');
 const c=qualify({packCells:8});assert.equal(c.rules.find(x=>x.id==='battery-esc-voltage').status,'FAIL');
});
test('connector mismatch fails, unspecified holds, matching is plan-only',()=>{
 assert.equal(qualify().rules.find(x=>x.id==='battery-connector').status,'HOLD_SOURCE');
 assert.equal(qualify({packConnector:'XT60',escConnector:'XT30'}).rules.find(x=>x.id==='battery-connector').status,'FAIL');
 assert.equal(qualify({packConnector:'XT60',escConnector:'XT60'}).rules.find(x=>x.id==='battery-connector').status,'PASS_PLAN_ONLY');
});
test('a textual measurement source revision does not grant independent inspection',()=>{
 const r=qualify({flightStackSourceRevision:'supplier PDF',manualPinoutReviewed:true,motorCentersMeasured:true,rotors:[{x:-78,y:-78,z:0},{x:78,y:-78,z:0},{x:-78,y:78,z:0},{x:78,y:78,z:0}],measuredPropDiameterMm:129.5});
 assert.ok(r.rules.find(x=>x.id==='coordinate-provenance').status==='HOLD_TEST');
 assert.ok(r.rules.find(x=>x.id==='fc-pinout').status==='HOLD_TEST');
 assert.equal(r.readiness,'NOT_FLIGHT_QUALIFIED');
});
test('rotor disk overlaps are recognized even when different z, with 6 pairs',()=>{
 const a=[{x:0,y:0,z:0},{x:80,y:0,z:40},{x:0,y:200,z:0},{x:200,y:200,z:0}];
 const r=validateRotorLayout(a,129.5);assert.equal(r.gaps.length,6);assert.equal(r.status,'FAIL_ENVELOPE');
 assert.ok(r.gaps.some(x=>x.verticalOffsetMm===40));
 assert.equal(qualify({rotors:a,measuredPropDiameterMm:129.5}).rules.find(x=>x.id==='rotor-clearance').status,'FAIL');
});
test('clear four rotor circles remain planning only, not mesh collision qualified',()=>{
 const a=[{x:-80,y:-80,z:0},{x:80,y:-80,z:0},{x:-80,y:80,z:0},{x:80,y:80,z:0}];
 const r=validateRotorLayout(a,129.5);assert.equal(r.status,'PASS_PLAN_ONLY');assert.ok(r.nearestGapMm>20);
 assert.equal(qualify({rotors:a,measuredPropDiameterMm:129.5}).rules.find(x=>x.id==='rotor-clearance').status,'PASS_PLAN_ONLY');
});
test('payload CG shift uses mass weighting and returns null for unmeasured base',()=>{
 assert.equal(payloadCgShift(null,100,{x:100,y:0,z:0}),null);
 assert.deepEqual(payloadCgShift(600,150,{x:100,y:-40,z:20}),{x:20,y:-8,z:4,unit:'mm',reference:'baseline measured CG; offset measured from that datum',baselineVerified:false});
});
test('inputs are strict and cannot quietly set unrecognized qualification status',()=>{
 for(const bad of [null,[],{approved:true},{packCells:13},{packCells:NaN},{measuredPropDiameterMm:10},{stackCandidate:'fantasy'},{payloadMassG:-1},{payloadOffsetMm:{x:Infinity,y:0,z:0}},{rotors:[{x:1,y:2,z:3}]},{motorScrewEngagementMm:-1}])assert.throws(()=>normalizeQualification(bad));
});
test('snapshot digest is cryptographic, deterministic, and changes with single part revision/input',async()=>{
 const sha=await snapshotSha256();assert.match(sha,/^[a-f0-9]{64}$/);assert.equal(sha,await snapshotSha256());
 assert.notEqual(sha,await snapshotSha256({packCells:5}));
 assert.notEqual(sha,await snapshotSha256({stackCandidate:'iflight-research'}));
 assert.notEqual(sha,await snapshotSha256({payloadMassG:15}));
});
test('snapshot simulation handoff remains blocked with null physical parameters and selected stack identity',()=>{
 const x=canonicalSnapshot({stackCandidate:'iflight-research',measuredAircraftMassG:650});assert.equal(x.simulation.readyForSITL,false);
 assert.equal(x.simulation.selectedFlightStackId,parts.researchStack.id);assert.equal(x.simulation.measuredMassKg,.65);
 assert.equal(x.simulation.measuredInertiaKgM2,null);assert.equal(x.simulation.motorCoefficients,null);assert.equal(x.qualification.readiness,'NOT_FLIGHT_QUALIFIED');
});
test('packet lists every issue and evidence link, cannot silently omit failures',()=>{
 const cfg={packConnector:'XT60',escConnector:'XT30'},r=qualify(cfg),pkt=inspectionPacket(cfg);
 for(const rule of r.rules)assert.ok(pkt.includes(rule.id));
 assert.ok(pkt.includes('battery-connector'));assert.ok(pkt.includes('NEVER DERIVED'));assert.ok(pkt.includes('DXF-derived'));
});
test('evidence ledger has known source URLs and revisions, no anonymous source ids',()=>{
 const r=qualify();for(const id of r.sourceIDs)assert.ok(evidenceRegistry[id]?.url?.startsWith('https://'));
 for(const rule of r.rules)for(const id of rule.evidence)assert.ok(evidenceRegistry[id]);
});

test('standards-based offline SHA-256 digest matches crypto implementation and known vector',async()=>{
 const {createHash}=await import('node:crypto');
 const raw=new TextEncoder().encode('abc');
 assert.equal(sha256Fallback(raw),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 const snapshot=JSON.stringify(canonicalSnapshot({payloadMassG:3}));
 assert.equal(sha256Fallback(new TextEncoder().encode(snapshot)),createHash('sha256').update(snapshot).digest('hex'));
});
