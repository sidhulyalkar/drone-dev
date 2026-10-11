import test from 'node:test';
import assert from 'node:assert/strict';
import {programPlan,programs} from '../core/program_v05.mjs';
import {auditCalibration,syntheticHoverDemo} from '../core/simulation_v05.mjs';
import {validateEvidenceRecord,summarizeEvidence} from '../core/evidence_v05.mjs';
import {readFileSync} from 'node:fs';

const hash='a'.repeat(64);
test('distinct autopilot and FPV tracks without inherited PX4 support',()=>{
 const atlas=programPlan(),fpv=programPlan({program:'fpv_reference'});
 assert.equal(atlas.autopilot,'PX4');assert.match(fpv.autopilot,/Betaflight/);
 assert.notDeepEqual(atlas.requirements,fpv.requirements);
 assert.ok(atlas.milestones.every(m=>m.gate==='BLOCKED'));
 assert.ok(atlas.holds.some(x=>x.includes('PX4')));
 assert.equal(programs.fpv_reference.goalMinutes,null);
});
test('mission fields are bounded and payload mismatch is surfaced',()=>{
 assert.throws(()=>programPlan({program:'nope'}));
 assert.throws(()=>programPlan({payloadG:-1}));
 assert.throws(()=>programPlan({budgetUSD:200000}));
 assert.match(programPlan({payloadG:500,budgetUSD:200}).warnings.join(' '),/Payload exceeds|budget may/);
});
test('calibration audit refuses parameter guesses and empty evidence',()=>{
 const result=auditCalibration({massKg:1.5,inertia:{ixx:.02,iyy:.03,izz:.04,ixy:0,ixz:0,iyz:0}});
 assert.equal(result.candidateModelReady,false);
 assert.equal(result.physicalFlightQualified,false);
 assert.ok(result.issues.some(x=>x.field==='rotorXYZm'));
 assert.ok(result.issues.some(x=>x.field==='measurementEvidence'));
});
test('calibration tensor rejects non-positive-definite inertia',()=>{
 const r=auditCalibration({inertia:{ixx:1,iyy:1,izz:1,ixy:2,ixz:0,iyz:0}});
 assert.ok(r.issues.some(x=>x.field==='inertia'));
});
test('calibration completeness does not grant flight authority',()=>{
 const fields=['massKg','inertia','rotorXYZm','spinDirections','motorThrustCoefficient','motorMomentCoefficient','motorTimeConstantUpS','motorTimeConstantDownS','maxMotorRadS'];
 const evidence=Object.fromEntries(fields.map(f=>[f,{sha256:hash,revision:'fixture',method:'Synthetic dummy fixture, not validated'}]));
 const r=auditCalibration({massKg:2,inertia:{ixx:.02,iyy:.02,izz:.04,ixy:0,ixz:0,iyz:0},rotorXYZm:[{x:.2,y:.2,z:0},{x:-.2,y:.2,z:0},{x:-.2,y:-.2,z:0},{x:.2,y:-.2,z:0}],spinDirections:['cw','ccw','cw','ccw'],motorThrustCoefficient:1e-6,motorMomentCoefficient:1e-7,motorTimeConstantUpS:.1,motorTimeConstantDownS:.2,maxMotorRadS:1200,airframeSource:'fixture',autopilotTarget:'PX4 test',escProtocol:'DShot',batteryAndEscSource:'fixture',measurementEvidence:evidence});
 assert.equal(r.candidateModelReady,true);
 assert.equal(r.physicalFlightQualified,false);
 assert.match(r.status,/REQUIRES_SIM_QA/);
});
test('synthetic experiment responds to payload and throttle without negative-ground penetration',()=>{
 const lo=syntheticHoverDemo({payloadG:0,throttle:.5});
 const hi=syntheticHoverDemo({payloadG:700,throttle:.5});
 assert.ok(lo.finalAltitudeM>hi.finalAltitudeM);
 assert.ok(hi.hoverThrottle>lo.hoverThrottle);
 assert.ok(hi.points.every(p=>p.z>=0));
 assert.equal(lo.isPhysicallyQualified,false);
 assert.throws(()=>syntheticHoverDemo({throttle:2}));
});
test('evidence capture cannot self-certify',()=>{
 const base={id:'frame-1',subject:'frame',claim:'distance',sourceUrl:'https://example.org/manual',sourceRevision:'v1',method:'manual measurement',artifactName:'test.dxf',license:'MIT',sha256:hash,kind:'cad-drawing'};
 assert.equal(validateEvidenceRecord(base).verified,false);
 assert.throws(()=>validateEvidenceRecord({...base,verified:true}));
 assert.throws(()=>summarizeEvidence([base,base]));
});
test('v0.5 HTML anchors, modules, status statements and version are wired',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../program_ui.mjs',import.meta.url),'utf8');
 for(const id of [...js.matchAll(/\$\('(v05-[^']+)'\)/g)].map(x=>x[1]))assert.ok(html.includes(`id="${id}"`),`Missing #${id}`);
 assert.ok(html.includes('src="./program_ui.mjs"'));
 assert.match(html,/NOT FLIGHT QUALIFIED/);
 assert.match(readFileSync(new URL('../package.json',import.meta.url),'utf8'),/"version": "0\.\d+\.\d+"/);
});
