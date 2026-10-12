import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {reviewX500PlaneTopology,TOPOLOGY_SCHEMA} from '../core/x500_brep_topology_review_v30.mjs';
const HASH='a'.repeat(64);
const roles=[
 ['frame-quadrant-nn','frame',35,[-176.876,-176.876]],
 ['frame-quadrant-np','frame',62,[-176.876,176.876]],
 ['frame-quadrant-pp','frame',89,[176.876,176.876]],
 ['frame-quadrant-pn','frame',116,[176.876,-176.876]],
 ['motor-coaxial-16-19-pairs','motor',0,[732.08475,0]],
];
const ids=role=>role==='frame'?[108,112,116,120]:[4,7,10,13,63,66,69,72];
const planes=()=>[
 {faceIndex:105,sharedTopoDsEdgeCount:1,normalParallelToCylinderAxis:true,
  planeAxialCoordinateMm:15.5,planeNormalNative:[0,-1,0],
  planarFaceAreaKernelMm2:504.437,touchingCylinderFaceIndices:ids('frame')},
 {faceIndex:103,sharedTopoDsEdgeCount:1,normalParallelToCylinderAxis:true,
  planeAxialCoordinateMm:17,planeNormalNative:[0,1,0],
  planarFaceAreaKernelMm2:504.437,touchingCylinderFaceIndices:ids('frame')}
];
function setup(){
 const candidates={
  schema:'aeroforge/x500-mount-candidate-browser-review/v2.9',
  authority:'SOURCE_BOUND_RESEARCH_CANDIDATES_ONLY',
  physicalFitApproved:false,flightApproved:false,
  candidates:roles.map(([id,role,solidIndex,centerTransverseMm])=>({
   id,role,solidIndex,centerTransverseMm,
   sourceStepSha256:S[role].sha256
  }))
 };
 const rows=roles.map(([candidateId,role,sourceSolidIndex,sourceTransverseCenterMm])=>{
  const frame=role==='frame';
  const p=frame?planes():[];
  return {candidateId,role,sourceSolidIndex,sourceTransverseCenterMm,
   sourceNativeAxialDimension:frame?'Y':'X',
   supportCylinderFaceIndices:ids(role),supportCylinderFaceCount:ids(role).length,
   cylinderSurfaceTopology:ids(role).map(faceIndex=>({
    faceIndex,radiusKernelMm:frame?2.9:1.25,
    surfaceClassifiedAsFastenerHole:false,
    edgeAdjacentPlanarFaces:p.map(z=>({...z}))
   })),
   commonEdgeAdjacentAxialPlanes:p,
   nearbyAxisNormalPlaneCandidates:[],
   topologyFinding:frame?'COMMON_PLANAR_EDGES_OBSERVED':
    'NO_COMMON_AXIAL_PLANE_SHARED_BY_ALL_CYLINDER_FACES',
   matingFaceVerified:false,fastenerHoleIdentityVerified:false,
   axialMountingPositionQualified:false
  };
 });
 const report={schema:TOPOLOGY_SCHEMA,
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
   sourceCandidateReportSha256:HASH,sourceUnitsAreCadNativeNotIndependentlyMetrologized:true},
  candidateCount:5,candidates:rows,topologicalSharedEdgesTested:true,
  verifiedPhysicalMountingFaceCount:0,verifiedPhysicalFastenerHoleCount:0,
  sourceIdentityManufacturerAuthenticated:false,independentDatumInspection:false,
  tolerancedFitTested:false,collisionCertified:false,procurementApproved:false,
  powerApproved:false,flightApproved:false};
 return {candidates,report};
}
function valid(r=setup()){return reviewX500PlaneTopology(r.report,r.candidates,HASH);}
test('all 4 frame mount patterns share two directly edge-adjacent planes; motor stays unqualified',()=>{
 const reviewed=valid();
 assert.equal(reviewed.candidates.length,5);
 assert.deepEqual(reviewed.candidates[0].sharedPlanarFaces.map(p=>p.axialNativeCoordinateMm),[15.5,17]);
 assert.equal(reviewed.candidates[4].sharedPlanarFaces.length,0);
 assert.equal(reviewed.candidates[4].topologicalEdgeConnectionObserved,false);
 assert.equal(reviewed.mechanicalFitApproved,false);
 assert.equal(reviewed.flightApproved,false);
 assert.equal(reviewed.axialMountingDatumQualified,false);
});
test('report with forged shared-edge topology, swapped source or qualified approvals is rejected',()=>{
 const mutators=[
  x=>x.report.source.frameStepSha256='f'.repeat(64),
  x=>x.report.source.sourceCandidateReportSha256='f'.repeat(64),
  x=>x.report.procurementApproved=true,
  x=>x.report.verifiedPhysicalMountingFaceCount=4,
  x=>x.report.candidates[4].commonEdgeAdjacentAxialPlanes.push(planes()[0]),
  x=>x.report.candidates[0].commonEdgeAdjacentAxialPlanes[0].planeAxialCoordinateMm=10.5,
  x=>x.report.candidates[0].cylinderSurfaceTopology[0].edgeAdjacentPlanarFaces=[],
  x=>x.report.candidates[0].cylinderSurfaceTopology[1].radiusKernelMm=3.5,
  x=>x.report.candidates[0].sourceNativeAxialDimension='Z',
  x=>x.report.candidates[3].matingFaceVerified=true,
  x=>x.report.candidates[2].commonEdgeAdjacentAxialPlanes[0].touchingCylinderFaceIndices=[108],
 ];
 for(const mutate of mutators){const x=setup();mutate(x);
  assert.throws(()=>valid(x),/BREP plane topology rejected/);}
});
test('v3.0 uploader hashes exact report bytes before linking original source and never auto-fills faces',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v30-topology-report/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',rawCandidateBytes\)/);
 assert.match(ui,/reviewX500PlaneTopology/);
 assert.match(ui,/topoPanel\.hidden=!topologyReview/);
 assert.match(ui,/topoDetail\.textContent/);
 assert.doesNotMatch(ui,/inputMap\.frameMountKernelMm\.value=topologyReview/);
});
