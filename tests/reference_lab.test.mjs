import test from 'node:test';
import assert from 'node:assert/strict';
import {references,referenceSources,defaultReferenceInputs,normalizeReferenceInputs,referenceLayout,evaluateReference,referenceRevision,simulationContract,assemblyPacket,interpolateMeasuredStaticCurve} from '../core/reference_lab.mjs';

test('manufacturer facts provenance exists for every reported frame/motor/stack number',()=>{
 for(const key of ['frame','motor','stack'])for(const k of Object.keys(references[key].facts))assert.equal(references[key].provenance[k],'manufacturer');
 assert.equal(references.frame.facts.wheelbaseMm,220);
 assert.equal(references.motor.bench.points.at(-1).currentA,34.11);
 assert.ok(referenceSources.some(s=>s.id==='TBS-CAD'));
});
test('default reference explicitly unqualified with source holds',()=>{
 const r=evaluateReference();assert.equal(r.status,'EVIDENCE_HOLD');assert.equal(r.bench.enduranceMin,null);
 assert.equal(r.massStatus,'assumed');assert.ok(r.issues.some(i=>i.id==='STACK_EOL'));
 assert.ok(r.issues.some(i=>i.id==='ROTOR_XY'));assert.ok(r.issues.some(i=>i.id==='SITL_COEFFICIENTS'));
});
test('manufacturer frame mass not conflated with total mass',()=>{
 const r=evaluateReference();assert.equal(r.knownAirframeMassG,72+35.1*4+8.1+19.1);assert.ok(r.massG>r.knownAirframeMassG);
});
test('coordinates influence nearest rotor clearance and block overlapping disks',()=>{
 const clear=referenceLayout();assert.ok(clear.tipClearanceMm>0);
 const bad=evaluateReference({motorHalfSpanXMm:40,motorHalfSpanYMm:40});assert.equal(bad.status,'BLOCKED');assert.ok(bad.issues.some(i=>i.id==='PROP_OVERLAP'));
});
test('voltage mismatches block both stack and motor for 8S',()=>{
 const r=evaluateReference({batteryCells:8});assert.equal(r.status,'BLOCKED');
 assert.ok(r.issues.some(i=>i.id==='MOTOR_VOLTAGE'));assert.ok(r.issues.some(i=>i.id==='ESC_VOLTAGE'));
});
test('attestation is tracked but does not auto-qualify a design',()=>{
 const r=evaluateReference({rotorCoordinatesVerified:true,stackReplacementVerified:true,motorMountVerified:true,propHubVerified:true,groundControlVerified:true,remoteIdVerified:true,massMeasuredG:640,propDiameterMeasuredMm:129.5,batterySku:'example-named-pack',otherMassEvidence:'weighed'});
 assert.equal(r.readiness,'NOT FLIGHT QUALIFIED');assert.equal(r.status,'EVIDENCE_HOLD');
});
test('reference revision changes on any configuration change',()=>{
 const a=referenceRevision(evaluateReference()),b=referenceRevision(evaluateReference({batteryCells:5})),c=referenceRevision(evaluateReference({batteryMassG:199}));
 assert.notEqual(a,b);assert.notEqual(b,c);assert.match(a,/^AF-[a-f0-9]{8}$/);
});
test('SITL export rejects uncalibrated dynamics even after mass provided',()=>{
 const r=evaluateReference({massMeasuredG:650,rotorCoordinatesVerified:true});const s=simulationContract(r);
 assert.equal(s.status,'BLOCKED_MISSING_CALIBRATION');assert.equal(s.readyForSITL,false);assert.equal(s.required.mass_kg,.65);
 assert.equal(s.required.motor_thrust_coefficient,null);assert.equal(s.required.inertia_kg_m2.ixx,null);
 assert.deepEqual(s.required.rotor_coordinates_m[0],{x:-.07778,y:-.07778,z:null});
});
test('assembly packet revision and holds clearly included',()=>{
 const r=evaluateReference(),packet=assemblyPacket(r);assert.ok(packet.includes(referenceRevision(r)));
 assert.ok(packet.includes('DISCONTINUED'));assert.ok(packet.includes('SITL_COEFFICIENTS'));
 assert.ok(packet.includes('Source Two v0.1 CAD'));
});
test('reject unknown fields, invalid numbers, out of range data',()=>{
 for(const bad of [{abc:4},{batteryMassG:-1},{motorHalfSpanYMm:NaN},{batteryCells:9},{rotorCoordinatesVerified:'false'},{massMeasuredG:-4},[]]){
  assert.throws(()=>normalizeReferenceInputs(bad));
 }
});

test('static thrust curve interpolation is bounded by actual manufacturer test points',()=>{
 assert.equal(interpolateMeasuredStaticCurve(100),null);
 assert.equal(interpolateMeasuredStaticCurve(1600),null);
 assert.equal(interpolateMeasuredStaticCurve(546.27).currentA,6.79);
 assert.ok(interpolateMeasuredStaticCurve(800).powerW>256);
 assert.ok(interpolateMeasuredStaticCurve(800).powerW<367);
});
test('stale discontinued stack cannot be approved by checkbox or replacement name',()=>{
 assert.ok(evaluateReference({stackReplacementVerified:true}).issues.some(x=>x.id==='STACK_EOL'));
 const r=evaluateReference({stackReplacementSku:'Other V6 model',stackReplacementVerified:true});
 assert.ok(r.issues.some(x=>x.id==='STACK_REQUAL'));
 assert.equal(r.status,'EVIDENCE_HOLD');
});
