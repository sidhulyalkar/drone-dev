import test from 'node:test';
import assert from 'node:assert/strict';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {solveX500NominalPlanarFit,pointToCapsuleSpineDistanceMm}
 from '../core/x500_nominal_planar_fit_v32.mjs';
const frame=[
 ['nn',-176.876396,-176.876396],['np',-176.876396,176.876396],
 ['pn',176.876396,-176.876396],['pp',176.876396,176.876396]
];
const motor=[[725.367,-6.718],[726.428,5.657],[737.742,-5.657],[738.802,6.718]];
function evidence(){
 const annotations=[];
 for(const [name,x,z] of frame){
  const centers=[[x-8.75,z],[x,z+8.75],[x,z-8.75],[x+8.75,z]];
  for(let i=0;i<4;i++)annotations.push({
   id:'frame-quadrant-'+name+'-slot-'+[108,112,116,120][i],
   role:'frame',contourType:'OBROUND_INNER_WIRE',sourceSolidIndex:35,
   sourceFaceIndex:105,
   nativeCenterMm:[centers[i][0],15.5,centers[i][1]],
   widthMm:5.8,lengthMm:7.3,axialMatingFaceQualified:false
  });
 }
 for(let i=0;i<4;i++)annotations.push({
  id:'motor-circular-passage-'+i,role:'motor',
  nativeCenterMm:[1182.2755,...motor[i]],
  contourType:'SPLIT_CIRCULAR_PASSAGE',diameterMm:2.5,
  shaftOrThreadQualified:false
 });
 return {
  schema:'aeroforge/x500-contour-review/v3.1',
  authority:'HASH_BOUND_TOPOLOGICAL_RESEARCH_ONLY',
  frameObroundCount:16,motorCircularPassageCount:4,
  sourceStepHashes:{frame:S.frame.sha256,motor:S.motor.sha256},
  actualMatingFaceVerified:false,threadSpecificationVerified:false,
  tolerancedFitApproved:false,mechanicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  annotations
 };
}
test('deterministic 16 source-only 2D alignment candidates at four cardinal-yaw families',()=>{
 const r=solveX500NominalPlanarFit(evidence());
 assert.equal(r.schema,'aeroforge/x500-nominal-planar-registration/v3.2');
 assert.equal(r.candidateCount,16);
 assert.equal(r.frameLocations,4);
 assert.equal(r.orientationsPerLocation,4);
 for(const c of r.candidates){
  assert.equal(c.fourIndividualSlotMatches.length,4);
  assert.equal(new Set(c.fourIndividualSlotMatches.map(x=>x.frameSlotId)).size,4);
  assert.ok(c.worstCenterlineResidualMm<.001,'nominal source projection residual');
  assert.ok(c.minHypotheticalProbeContourMarginMm>1.64);
  assert.equal(c.axialTranslationMm,null);
  assert.equal(c.fullThreeDimensionalRigidTransformQualified,false);
  assert.equal(c.sourceCollisionTested,false);
  assert.equal(c.physicalFitApproved,false);
  assert.equal(c.flightApproved,false);
 }
 const yaw=r.candidates.slice(0,4).map(x=>x.motorToFrameProjectedYawDeg)
  .sort((a,b)=>a-b);
 assert.deepEqual(yaw.map(x=>Math.round(x)),[45,135,225,315]);
 assert.equal(r.actualBoltDiameterKnown,false);
 assert.equal(r.axialMatingPlaneIdentified,false);
});
test('slot capsule geometry uses both radial end travel and orthogonal offset',()=>{
 assert.equal(pointToCapsuleSpineDistanceMm([1,0],[0,0],[1,0],.75),.25);
 assert.equal(pointToCapsuleSpineDistanceMm([.75,1],[0,0],[1,0],.75),1);
 assert.equal(pointToCapsuleSpineDistanceMm([.6,0],[0,0],[1,0],.75),0);
 assert.throws(()=>pointToCapsuleSpineDistanceMm([0,0],[0,0],[2,0],.75),
  /Nominal planar mounting study rejected/);
});
test('hypothetical gauge diameter changes margin, but never bestows physical clearance',()=>{
 const e=evidence();
 const zero=solveX500NominalPlanarFit(e,{probeDiameterMm:0});
 const nominal=solveX500NominalPlanarFit(e,{probeDiameterMm:2.5});
 const large=solveX500NominalPlanarFit(e,{probeDiameterMm:5.8});
 const a=zero.candidates[0].minHypotheticalProbeContourMarginMm,
  b=nominal.candidates[0].minHypotheticalProbeContourMarginMm,
  c=large.candidates[0].minHypotheticalProbeContourMarginMm;
 assert.ok(Math.abs((a-b)-1.25)<.00001);
 assert.ok(Math.abs((b-c)-1.65)<.00001);
 assert.equal(large.toleranceStackEvaluated,false);
 assert.equal(large.physicalFitApproved,false);
 for(const size of [-1,5.81,NaN,Infinity,'2.5'])
  assert.throws(()=>solveX500NominalPlanarFit(e,{probeDiameterMm:size}),
   /Nominal planar mounting study rejected/);
});
test('altered source identity, missing slots, shifted contour and elevated claims fail closed',()=>{
 const changes=[
  x=>x.sourceStepHashes.motor='0'.repeat(64),
  x=>x.sourceStepHashes.frame='0'.repeat(64),
  x=>x.flightApproved=true,
  x=>x.mechanicalFitApproved=true,
  x=>x.annotations[0].nativeCenterMm[0]+=4,
  x=>x.annotations[0].widthMm=6.5,
  x=>x.annotations.pop(),
  x=>x.annotations[16].nativeCenterMm[1]+=8,
  x=>x.annotations[17].shaftOrThreadQualified=true,
  x=>x.authority='APPROVED'
 ];
 for(const update of changes){
  const x=evidence();update(x);
  assert.throws(()=>solveX500NominalPlanarFit(x),/Nominal planar mounting study rejected/);
 }
});
