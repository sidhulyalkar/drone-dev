import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCE_CATALOG,GEOMETRY_SCHEMA,FRAME,normalizeDimensionalInput,rotorDiskClearance,
 evaluateDimensionalInput,px4GeometryHandoff,inspectionPacket,syntheticExample} from '../core/dimensional_v11.mjs';
test('source ledger refers to manufacturer downloadable CAD but does not fabricate hash or parsing',()=>{
 assert.ok(SOURCE_CATALOG.length>=2);
 for(const x of SOURCE_CATALOG){
  assert.match(x.sourceUrl,/^https:\/\//);
  assert.equal(x.fileHash,null);assert.equal(x.cadImported,false);
  assert.equal(x.manufacturerGeometryAudited,false);
 }
});
test('synthetic teaching example is clearly identified and not declared physical',()=>{
 const x=syntheticExample();
 assert.equal(x.schema,GEOMETRY_SCHEMA);assert.equal(x.frame,FRAME);
 assert.equal(x.mode,'SYNTHETIC_DEMO');
 assert.equal(x.source.sha256,null);
 assert.match(x.source.label,/SYNTHETIC/);
 const q=evaluateDimensionalInput(x);
 assert.equal(q.positionApproval,false);assert.equal(q.flightApproval,false);
 assert.equal(q.cadImportedByApp,false);
 assert.ok(q.checks.find(f=>f.id==='demo-origin'));
});
test('rotor disk projected separation is quantitative, symmetric, and ignores false altitude clearance',()=>{
 const a={id:'a',centerMm:[0,0,0],propDiameterMm:250};
 const b={id:'b',centerMm:[260,0,500],propDiameterMm:250};
 assert.equal(rotorDiskClearance(a,b).gapMm,10);
 assert.equal(rotorDiskClearance(b,a).gapMm,10);
 assert.match(rotorDiskClearance(a,b).method,/IGNORES_HEIGHT/);
});
test('four rotors may screen clear but approval remains blocked',()=>{
 const x=syntheticExample(),a=evaluateDimensionalInput(x);
 assert.equal(a.projection.diskPairs.length,6);
 assert.equal(a.counts.conflicts,0);
 assert.ok(a.counts.screenClearPairs>=6);
 assert.equal(a.flightApproval,false);
 assert.equal(a.positionApproval,false);
 assert.notEqual(a.status,'FLIGHT_READY');
});
test('rotor collision is a blocking conflict even for different Z heights',()=>{
 const x=syntheticExample();
 x.rotors[1].centerMm=[x.rotors[0].centerMm[0]+60,x.rotors[0].centerMm[1],900];
 const q=evaluateDimensionalInput(x);
 assert.equal(q.status,'CONFLICT_SCREEN');
 assert.ok(q.counts.conflicts>0);
 assert.ok(q.checks.some(f=>f.id.startsWith('disk:')&&f.status==='CONFLICT'));
});
test('component bounding box overlap is an unverified broad phase interference candidate',()=>{
 const x=syntheticExample();
 x.components[1].centerMm=[0,0,0];
 const q=evaluateDimensionalInput(x);
 assert.equal(q.counts.interferenceCandidates,1);
 assert.equal(q.status,'INSPECT_OVERLAP');
 assert.ok(q.projection.componentAabbs.some(b=>b.overlapping));
});
test('rotor vs payload projection reports XY swept disk overlap regardless of vertical placement',()=>{
 const x=syntheticExample();
 x.components=[{id:'camera',label:'Camera envelope',centerMm:[180,180,1000],dimensionsMm:[45,40,30],massG:null}];
 const q=evaluateDimensionalInput(x);
 assert.equal(q.status,'CONFLICT_SCREEN');
 assert.ok(q.checks.some(f=>f.id==='prop-box:R1:camera'&&f.status==='CONFLICT'));
});
test('known component mass centroid is not treated as all-up aircraft mass or verified CG',()=>{
 const x=syntheticExample();
 const q=evaluateDimensionalInput(x);
 assert.equal(q.knownComponentMass.subtotalG,700);
 assert.equal(q.knownComponentMass.massComplete,true);
 assert.equal(q.knownComponentMass.notAircraftAllUpMass,true);
 assert.equal(q.knownComponentMass.notQualifiedCG,true);
 assert.deepEqual(q.knownComponentMass.subtotalCentroidMm,[0,-8.7429,5.1429]);
 x.components[0].massG=null;
 const b=evaluateDimensionalInput(x);
 assert.equal(b.knownComponentMass.massComplete,false);
 assert.ok(b.checks.find(f=>f.id==='mass-coverage'));
});
test('input schema rejects coordinate/units mistakes and unrecognized or forged fields',()=>{
 const x=syntheticExample();
 for(const change of [
  t=>t.frame='WORLD_ENU',
  t=>t.schema='v99',
  t=>t.mode='VERIFIED',
  t=>t.rotors[0].centerMm=[null,0,0],
  t=>t.rotors[0].propDiameterMm=-1,
  t=>t.rotors[0].extraAuthority=true,
  t=>t.rotors[1].id=t.rotors[0].id,
  t=>t.minimumGapMm=-1,
  t=>t.components[0].dimensionsMm=[0,2,3],
  t=>t.components[0].massG='estimated'
 ]){const d=structuredClone(x);change(d);assert.throws(()=>normalizeDimensionalInput(d));}
});
test('source SHA-256 is format-checked and never grants physical qualification',()=>{
 const x=syntheticExample();
 x.mode='USER_MEASURED_UNREVIEWED';
 x.source.sha256='a'.repeat(64);
 const y=evaluateDimensionalInput(x);
 assert.equal(y.design.source.sha256,'a'.repeat(64));
 assert.equal(y.cadImportedByApp,false);assert.equal(y.manufacturerCadParsed,false);
 assert.equal(y.flightApproval,false);
 const d=structuredClone(x);d.source.sha256='wrong';assert.throws(()=>evaluateDimensionalInput(d));
});
test('PX4 output is explicitly blocked until real CG, motor spins and output mapping',()=>{
 const q=evaluateDimensionalInput(syntheticExample());
 const x=px4GeometryHandoff(q);
 assert.equal(x.status,'BLOCKED_MEASURED_CG_AND_SOURCE_VERIFICATION_REQUIRED');
 assert.equal(x.px4MotorPositionMeters,null);
 assert.equal(x.measuredCgMm,null);
 assert.equal(x.verifiedMotorSpinDirections,null);
 assert.equal(x.outputMapping,null);
 assert.equal(x.px4TargetFrame,'FRD_RELATIVE_TO_MEASURED_CG');
 assert.equal(x.px4TargetUnits,'m');
 assert.equal(x.measuredPositionsFromUserDatum.length,4);
 assert.throws(()=>px4GeometryHandoff({schema:'fake'}));
});
test('report export retains bounds and safety caveats and refuses unvalidated data',()=>{
 const q=evaluateDimensionalInput(syntheticExample());
 const r=inspectionPacket(q);
 assert.match(r,/SHA-256: MISSING/);
 assert.match(r,/NOT total aircraft mass/);
 assert.match(r,/AABB and XY disk checks/);
 assert.throws(()=>inspectionPacket({schema:'fake'}));
});
test('v1.1 UI references unique existing DOM anchors and is linked to page',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../dimensional_ui_v11.mjs',import.meta.url),'utf8');
 const all=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(all).size,all.length);
 for(const m of ui.matchAll(/\$\('([^']+)'\)/g))assert.ok(all.includes(m[1]),m[1]);
 assert.ok(html.includes('dimensional_v11.css')&&html.includes('dimensional_ui_v11.mjs'));
 assert.match(ui,/subtle\.digest\('SHA-256'/);
 assert.match(ui,/SYNTHETIC/);
});
