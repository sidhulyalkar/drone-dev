/** v3.0 browser review of source-bound *reported* BREP face topology.
 * A browser cannot independently parse the STEP's exact OpenCascade edge
 * topology. This compares exact local source/derived report fingerprints and
 * conservative expected evidence structure; NEVER treats geometry as fit.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as SOURCE} from './x500_real_source_observations_v28.mjs';
export const TOPOLOGY_SCHEMA='aeroforge/x500-brep-plane-adjacency/v3.0';
export const TOPOLOGY_AUTHORITY='LOCAL_BREP_EDGE_ANALYSIS_REPORTED_NOT_INDEPENDENTLY_VERIFIED';
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const sha=/^[0-9a-f]{64}$/;
const fail=message=>{throw Error('BREP plane topology rejected: '+message);};
const within=(x,y,tol=.02)=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x-y)<=tol;
function matchPoint(list,target,tol=.02){
 return Array.isArray(list)&&list.length===target.length&&list.every((x,i)=>within(x,target[i],tol));
}
export function reviewX500PlaneTopology(report,candidates,verifiedCandidateReportSha256){
 if(!isObj(report)||report.schema!==TOPOLOGY_SCHEMA)fail('Unknown topology report');
 if(candidates?.schema!=='aeroforge/x500-mount-candidate-browser-review/v2.9'||
  candidates.authority!=='SOURCE_BOUND_RESEARCH_CANDIDATES_ONLY'||
  candidates.physicalFitApproved!==false||candidates.flightApproved!==false)
  fail('First review a locally hash-verified unqualified five-candidate report');
 if(!sha.test(verifiedCandidateReportSha256)||
  report.source?.sourceCandidateReportSha256!==verifiedCandidateReportSha256)
  fail('Different underlying v2.9 source report bytes');
 if(report.source.frameStepSha256!==SOURCE.frame.sha256||
  report.source.motorStepSha256!==SOURCE.motor.sha256||
  report.source.sourceUnitsAreCadNativeNotIndependentlyMetrologized!==true)
  fail('Unexpected source hashes or unit qualification');
 for(const key of ['sourceIdentityManufacturerAuthenticated','independentDatumInspection',
  'tolerancedFitTested','collisionCertified','procurementApproved','powerApproved','flightApproved']){
  if(report[key]!==false)fail('Elevated safety claim: '+key);
 }
 if(report.topologicalSharedEdgesTested!==true||
  report.verifiedPhysicalMountingFaceCount!==0||
  report.verifiedPhysicalFastenerHoleCount!==0||
  report.candidateCount!==5||
  !Array.isArray(report.candidates)||report.candidates.length!==5)
  fail('Missing complete unqualified BREP topological observations');
 const checked=[];
 const seen=new Set();
 for(const row of report.candidates){
  const base=candidates.candidates.find(c=>c.id===row?.candidateId);
  if(!base||seen.has(row.candidateId)||row.role!==base.role||
    row.sourceSolidIndex!==base.solidIndex||
    row.matingFaceVerified!==false||row.fastenerHoleIdentityVerified!==false||
    row.axialMountingPositionQualified!==false)
   fail('Invalid candidate identity or elevated axial-face approval');
  seen.add(row.candidateId);
  if(row.sourceNativeAxialDimension!==(base.role==='frame'?'Y':'X')||
    !matchPoint(row.sourceTransverseCenterMm,base.centerTransverseMm)|| 
    !Array.isArray(row.supportCylinderFaceIndices)||
    new Set(row.supportCylinderFaceIndices).size!==row.supportCylinderFaceIndices.length||
    row.supportCylinderFaceCount!==row.supportCylinderFaceIndices.length||
    !Array.isArray(row.cylinderSurfaceTopology)||
    row.cylinderSurfaceTopology.length!==row.supportCylinderFaceCount||
    !Array.isArray(row.commonEdgeAdjacentAxialPlanes)||
    !Array.isArray(row.nearbyAxisNormalPlaneCandidates))
   fail('Cylinder face evidence incomplete');
  const frame=base.role==='frame';
  if(row.supportCylinderFaceCount!==(frame?4:8))
   fail('Changed number of source cylindrical support faces');
  const ids=new Set(row.supportCylinderFaceIndices);
  const expectedPlanes=frame?[{id:105,at:15.5,normal:-1},{id:103,at:17,normal:1}]:[];
  if(row.commonEdgeAdjacentAxialPlanes.length!==expectedPlanes.length ||
    row.topologyFinding!==(frame?'COMMON_PLANAR_EDGES_OBSERVED':
      'NO_COMMON_AXIAL_PLANE_SHARED_BY_ALL_CYLINDER_FACES'))
   fail('Unexpected shared-edge topology');
  for(const p of row.cylinderSurfaceTopology){
   if(!ids.has(p.faceIndex)||p.surfaceClassifiedAsFastenerHole!==false||
     !within(p.radiusKernelMm,frame?2.9:1.25,.005)||
     !Array.isArray(p.edgeAdjacentPlanarFaces))
    fail('Broken cylindrical-face identity');
  }
  const expectedSet=new Set(expectedPlanes.map(x=>x.id));
  for(const p of row.commonEdgeAdjacentAxialPlanes){
   const expected=expectedPlanes.find(x=>x.id===p.faceIndex);
   if(!expected||!within(p.planeAxialCoordinateMm,expected.at,.002)||
     !within(p.planarFaceAreaKernelMm2,504.437,.02)||
     !p.normalParallelToCylinderAxis||
     !matchPoint(p.planeNormalNative,[0,expected.normal,0],.001)||
     !Array.isArray(p.touchingCylinderFaceIndices)||
     p.touchingCylinderFaceIndices.length!==ids.size||
     new Set(p.touchingCylinderFaceIndices).size!==ids.size||
     !p.touchingCylinderFaceIndices.every(i=>ids.has(i))||
     p.sharedTopoDsEdgeCount<1)
    fail('Planar face is not supported by all four source cylinders');
   // A claimed common plane must actually appear as a shared TopoDS edge on
   // *each* individually indexed cylindrical face, not just in the summary.
   for(const cyl of row.cylinderSurfaceTopology){
    const adjacent=cyl.edgeAdjacentPlanarFaces.find(edge=>
      edge.faceIndex===p.faceIndex&&edge.sharedTopoDsEdgeCount>=1&&
      edge.normalParallelToCylinderAxis===true&&
      within(edge.planeAxialCoordinateMm,p.planeAxialCoordinateMm,.002)&&
      within(edge.planarFaceAreaKernelMm2,p.planarFaceAreaKernelMm2,.02));
    if(!adjacent)fail('Summary plane lacks face-level shared-edge evidence');
   }
   expectedSet.delete(p.faceIndex);
  }
  if(expectedSet.size)fail('Source planar face omitted');
  checked.push({
   id:base.id,role:base.role,solidIndex:base.solidIndex,
   sourceStepSha256:base.sourceStepSha256,
   originalCylinderFaceIndices:[...ids].sort((a,b)=>a-b),
   sharedPlanarFaces:row.commonEdgeAdjacentAxialPlanes.map(p=>({
    sourceFaceIndex:p.faceIndex,
    axialNativeCoordinateMm:p.planeAxialCoordinateMm,
    areaNativeMm2:p.planarFaceAreaKernelMm2,
    sourceNativeAxis:row.sourceNativeAxialDimension,
    geometryIsPhysicalMount:false,
   })),
   nearbyPlanarFaces:row.nearbyAxisNormalPlaneCandidates.slice(0,8).map(p=>({
     sourceFaceIndex:p.faceIndex,axialNativeCoordinateMm:p.planeAxialCoordinateMm,
     distanceFromCandidateCenterMm:p.distanceToPatternCenterTransverseMm,
     directlyConnectedToAllPatternCylinders:p.connectsToEverySelectedCylinder===true,
   })),
   topologicalEdgeConnectionObserved:frame,
   matingFaceVerified:false,
   physicalFitApproved:false
  });
 }
 if(checked.length!==candidates.candidates.length)fail('Missing one of five candidates');
 return {schema:'aeroforge/x500-plane-topology-browser-review/v3.0',
  authority:TOPOLOGY_AUTHORITY,candidates:checked,
  trustedVendorSignature:false,independentPartMetrology:false,
  axialMountingDatumQualified:false,mechanicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'Reported frame source topology has common 15.5/17 mm Y planes; motor candidate cylinders have no common directly shared X-normal plane. Neither establishes the physical mating face.'};
}
