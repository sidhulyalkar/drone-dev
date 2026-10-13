import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {reviewX500SourceContactSurvey} from '../core/x500_contact_survey_v33.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const planes={28:{x:1183.67548,area:249.165666,normal:1},
33:{x:1180.87548,area:192.760042,normal:-1}};
const cones={28:{4:73,72:3,7:70,69:6,10:67,66:9,13:64,63:12},
33:{4:74,72:2,7:71,69:5,10:68,66:8,13:65,63:11}};
const quadrants={nn:{solid:35,center:[-176.876396,-176.876396]},
np:{solid:62,center:[-176.876396,176.876396]},
pn:{solid:116,center:[176.876396,-176.876396]},
pp:{solid:89,center:[176.876396,176.876396]}};
function fixture(){
 const contours={schema:'aeroforge/x500-contour-review/v3.1',
 authority:'HASH_BOUND_TOPOLOGICAL_RESEARCH_ONLY',
 sourceStepHashes:{frame:S.frame.sha256,motor:S.motor.sha256}};
 const refs=[];
 for(const [q,{center}] of Object.entries(quadrants)){
  for(let i=0;i<4;i++)refs.push({
   id:'frame-quadrant-'+q+'-orientation-'+(i+1),
   framePatternId:'frame-quadrant-'+q,
   projectedYawDeg:[45,135,225,315][i],
   frameSourceCenterXZmm:center,
   motorSourceCenterYZmm:[732.08475,0],
   physicalFitApproved:false,flightApproved:false,
   sourceCollisionTested:false
  });
 }
 const reference={schema:'aeroforge/x500-nominal-planar-registration-reference/v3.2',
  sourceReportSha256:{v31:A},frameStepSha256:S.frame.sha256,
  motorStepSha256:S.motor.sha256,candidateCount:16,candidateHypotheses:refs};
 const motorContactPlaneCandidates=Object.entries(planes).map(([face,value])=>({
  sourcePlaneFaceIndex:Number(face),sourceNativeXmm:value.x,
  planeNormalNative:[value.normal,0,0],planarSurfaceAreaMm2:value.area,
  allFourPassageAxesTopologicallyConnected:true,
  physicalMountingContactProven:false,
  edgePaths:Object.entries(cones[face]).map(([cyl,via])=>({
   cylinderFaceIndex:Number(cyl),viaConicalFaceIndex:via,
   planarFaceIndex:Number(face),
   cylinderToConeSharedEdges:1,coneToPlaneSharedEdges:1,
   conicalReferenceRadiusMm:1.5,conicalSemiAngleDeg:45,
   physicalFastenerClassified:false
  }))
 }));
 const frameSourcePlateFaces=Object.values(quadrants).flatMap(({solid})=>
  [[105,15.5,-1],[103,17,1]].map(([face,y,normal])=>({
   solidIndex:solid,faceIndex:face,sourceNativeYmm:y,
   nativeNormal:[0,normal,0],physicalContactVerified:false
  })));
 const hypotheses=refs.flatMap(ref=>{
  const q=ref.framePatternId.split('-').at(-1),site=quadrants[q];
  return Object.entries(planes).flatMap(([face,plane])=>
   [[105,15.5,-1],[103,17,1]].map(([frface,y,frameNormal])=>{
    const rad=ref.projectedYawDeg*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
    const R=[[0,c,-s],[-1,0,0],[0,s,c]],motor=[plane.x,732.08475,0];
    const target=[site.center[0],y,site.center[1]];
    const T=target.map((x,i)=>x-R[i].reduce((v,n,j)=>v+n*motor[j],0));
    const pairs=[{frameSolidIndex:site.solid,motorSolidIndex:0}];
    for(let i=0;i<29;i++)
     pairs.push({frameSolidIndex:i,motorSolidIndex:i%4});
    return {id:ref.id+'-motor-plane-'+face+'-frame-plane-'+frface,
     nominalPlanarHypothesisId:ref.id,motorSourceFaceIndex:Number(face),
     frameSourceSolidIndex:site.solid,frameSourceFaceIndex:frface,
     nominalInPlaneYawDeg:ref.projectedYawDeg,
     sourceNativeMotorSeatingXmm:plane.x,sourceNativeFrameContactYmm:y,
     rightHandedRotation3x3:R.map(x=>x.map(v=>Number(v.toFixed(9)))),
     translationNativeMm:T.map(v=>Number(v.toFixed(6))),
     sourceMotorFaceNormalMapsToFrameY:-plane.normal,
     planeNormalsOppose:-plane.normal===-frameNormal,
     broadPhaseAabbPairs:pairs,broadPhasePotentialPairCount:pairs.length,
     exactBrepBooleanStatus:'NOT_RUN',exactBrepCollisionApproved:false,
     realContactPairVerified:false,sourceOriginMetrologyVerified:false,
     safeToAssemble:false};
   }));
 });
 const report={schema:'aeroforge/x500-source-contact-hypotheses/v3.3',
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
   v31ReportSha256:A,v32ReportSha256:B,expectedFrameImportedSolids:244,
   expectedMotorImportedSolids:4},
  motorContactPlaneCandidates,frameSourcePlateFaces,hypotheses,
  hypothesisCount:64,opposingNormalHypothesisCount:32,
  originalCadDimensionsNotIndependentHardwareMeasurements:true,
  aabbResultsAreOnlyBroadPhaseScreening:true,realMotorSeatUnresolved:true,
  manufacturerAuthenticated:false,independentlyMeasured:false,
  mountingFaceIndependentlyQualified:false,actualFastenerSpecified:false,
  toleranceStackEvaluated:false,physicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false};
 return {contours,reference,report};
}
const run=f=>reviewX500SourceContactSurvey(f.report,f.contours,A,f.reference,B);
test('source face cone edge paths produce precisely 64 unqualified 3D poses and 32 opposing normals',()=>{
 const r=run(fixture());
 assert.equal(r.hypothesisCount,64);
 assert.equal(r.opposingNormalCount,32);
 assert.equal(r.candidates.length,64);
 assert.equal(r.candidates.filter(x=>x.opposingSourceNormals).length,32);
 assert.ok(r.candidates.every(x=>x.modelAabbPotentialPairs===30));
 assert.ok(r.candidates.every(x=>x.exactBrepBooleanStatus==='NOT_RUN'));
 assert.equal(r.exactCollisionVerified,false);
 assert.equal(r.physicalFitApproved,false);
 assert.equal(r.flightApproved,false);
});
test('forged approvals, source hashes, conical witnesses and reflected 3D poses fail closed',()=>{
 const edits=[
  x=>x.report.source.motorStepSha256='f'.repeat(64),
  x=>x.report.source.v31ReportSha256='f'.repeat(64),
  x=>x.report.source.v32ReportSha256='f'.repeat(64),
  x=>x.report.flightApproved=true,
  x=>x.report.mountingFaceIndependentlyQualified=true,
  x=>x.report.motorContactPlaneCandidates[0].edgePaths[0].viaConicalFaceIndex=0,
  x=>x.report.motorContactPlaneCandidates[1].sourceNativeXmm+=2,
  x=>x.report.frameSourcePlateFaces[0].sourceNativeYmm=18,
  x=>x.report.hypotheses[0].rightHandedRotation3x3[1][0]=1,
  x=>x.report.hypotheses[1].translationNativeMm[0]+=5,
  x=>x.report.hypotheses[2].broadPhaseAabbPairs=[],
  x=>x.report.hypotheses[3].exactBrepBooleanStatus='CLEAR',
  x=>x.report.hypotheses[4].planeNormalsOppose=true,
  x=>x.reference.candidateHypotheses[0].physicalFitApproved=true,
  x=>x.reference.sourceReportSha256.v31='f'.repeat(64)
 ];
 for(const edit of edits){const f=fixture();edit(f);
  assert.throws(()=>run(f),/X500 3D source contact evidence rejected/);}
});
test('v3.3 browser is hidden on changed source, uses exact SHA of v31 and v32 and never commits 3D pose',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const panel=readFileSync(new URL('../cad_contact_survey_ui_v33.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v32-planar-reference/);
 assert.match(ui,/cad-v33-contact-report/);
 assert.match(ui,/reviewX500SourceContactSurvey/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',contourBytes\)/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',v32Bytes\)/);
 assert.match(ui,/sourceContactUI\.reset\(\)/);
 assert.match(panel,/cad-v33-show-same-facing/);
 assert.match(panel,/sourceNative/);
 assert.doesNotMatch(ui,/proposeX500CadMating\(sourceContactReview/);
});
