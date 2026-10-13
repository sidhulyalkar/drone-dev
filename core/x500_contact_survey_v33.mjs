/** Strict v3.3 original-source CAD contact topology/3D AABB survey reader.
 *
 * Does not elevate a BREP source face into a verified motor seat. It rejects
 * 3D poses, forged approvals, missing predecessor byte SHA-256 linkage and
 * incompatible handedness. Model AABBs are NOT physical collision evidence.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as ORIGINAL} from './x500_real_source_observations_v28.mjs';
export const X500_CONTACT_SCHEMA='aeroforge/x500-source-contact-hypotheses/v3.3';
const sha=/^[0-9a-f]{64}$/;
const num=x=>typeof x==='number'&&Number.isFinite(x);
const approx=(a,b,eps=.003)=>num(a)&&Math.abs(a-b)<=eps;
const fail=message=>{throw Error('X500 3D source contact evidence rejected: '+message);};
const frameSolids={nn:35,np:62,pp:89,pn:116};
const frameCenters={nn:[-176.876396,-176.876396],
 np:[-176.876396,176.876396],pp:[176.876396,176.876396],
 pn:[176.876396,-176.876396]};
const motorPlanes={28:{x:1183.67548,area:249.165666,normal:1},
 33:{x:1180.87548,area:192.760042,normal:-1}};
const fromCylinder={
 28:{4:73,72:3,7:70,69:6,10:67,66:9,13:64,63:12},
 33:{4:74,72:2,7:71,69:5,10:68,66:8,13:65,63:11}};
const negatives=['manufacturerAuthenticated','independentlyMeasured',
 'mountingFaceIndependentlyQualified','actualFastenerSpecified',
 'toleranceStackEvaluated','physicalFitApproved','procurementApproved',
 'powerApproved','flightApproved'];
const motorEvidenceIds=[4,72,7,69,10,66,13,63];
const allFiniteArray=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(num);
function verifyPlane(p){
 const expected=motorPlanes[p?.sourcePlaneFaceIndex];
 if(!expected||!approx(p.sourceNativeXmm,expected.x,.002)||
  !approx(p.planarSurfaceAreaMm2,expected.area,.002)||
  !allFiniteArray(p.planeNormalNative,3)||
  !approx(p.planeNormalNative[0],expected.normal,.00001)||
  !approx(p.planeNormalNative[1],0,.00001)||
  !approx(p.planeNormalNative[2],0,.00001)||
  p.allFourPassageAxesTopologicallyConnected!==true||
  p.physicalMountingContactProven!==false||
  !Array.isArray(p.edgePaths)||p.edgePaths.length!==8)
  fail('Incomplete original BREP motor plane evidence');
 const found=new Set();
 for(const path of p.edgePaths){
  const cyl=path.cylinderFaceIndex;
  if(found.has(cyl)||!motorEvidenceIds.includes(cyl)||
   path.viaConicalFaceIndex!==fromCylinder[p.sourcePlaneFaceIndex][cyl]||
   path.planarFaceIndex!==p.sourcePlaneFaceIndex||
   path.cylinderToConeSharedEdges!==1||path.coneToPlaneSharedEdges!==1||
   !approx(path.conicalReferenceRadiusMm,1.5,.00001)||
   !approx(path.conicalSemiAngleDeg,45,.00001)||
   path.physicalFastenerClassified!==false)
   fail('Original cylinder-cone-plane edge path was changed or duplicated');
  found.add(cyl);
 }
 if(found.size!==8)fail('Some original cylinder-to-plane paths are missing');
}
function determinant(R){
 return R[0][0]*(R[1][1]*R[2][2]-R[1][2]*R[2][1])-
  R[0][1]*(R[1][0]*R[2][2]-R[1][2]*R[2][0])+
  R[0][2]*(R[1][0]*R[2][1]-R[1][1]*R[2][0]);
}
function verifyPose(p,reference){
 const frameId=reference.framePatternId;
 const quadrant=frameId?.split('-').at(-1),idx=frameSolids[quadrant];
 const mp=motorPlanes[p.motorSourceFaceIndex];
 const fx=frameCenters[quadrant];
 const frameY=p.frameSourceFaceIndex===105?15.5:p.frameSourceFaceIndex===103?17:null;
 if(idx===undefined||!mp||!fx||frameY===null||
  p.nominalPlanarHypothesisId!==reference.id||
  p.frameSourceSolidIndex!==idx||
  p.id!==reference.id+'-motor-plane-'+p.motorSourceFaceIndex+'-frame-plane-'+p.frameSourceFaceIndex||
  !approx(p.nominalInPlaneYawDeg,reference.projectedYawDeg,.000001)||
  !approx(p.sourceNativeMotorSeatingXmm,mp.x,.002)||
  !approx(p.sourceNativeFrameContactYmm,frameY,.000001))
  fail('Planar reference and 3D source contact pairing do not agree');
 const yaw=p.nominalInPlaneYawDeg*Math.PI/180,c=Math.cos(yaw),s=Math.sin(yaw);
 const expected=[[0,c,-s],[-1,0,0],[0,s,c]];
 const R=p.rightHandedRotation3x3,T=p.translationNativeMm;
 if(!Array.isArray(R)||R.length!==3||R.some((r,i)=>
  !allFiniteArray(r,3)||r.some((x,j)=>!approx(x,expected[i][j],1e-7)))||
  !allFiniteArray(T,3)||!approx(determinant(R),1,.000001))
  fail('Rotation is reflected, has the wrong handedness or does not preserve source axes');
 const anchor=[mp.x,reference.motorSourceCenterYZmm[0],reference.motorSourceCenterYZmm[1]];
 const target=[fx[0],frameY,fx[1]];
 if(!allFiniteArray(reference.motorSourceCenterYZmm,2)||
  !reference.motorSourceCenterYZmm.every((v,i)=>approx(v,[732.08475,0][i],.02))||
  !allFiniteArray(reference.frameSourceCenterXZmm,2)||
  !reference.frameSourceCenterXZmm.every((v,i)=>approx(v,fx[i],.02))||
  target.some((v,i)=>!approx(v,
   T[i]+R[i].reduce((sum,a,j)=>sum+a*anchor[j],0),.003)))
  fail('Translated original motor reference does not coincide with the intended frame point');
 const motorNormalY=-mp.normal;
 const frameNormalY=p.frameSourceFaceIndex===105?-1:1;
 const opposed=motorNormalY===-frameNormalY;
 if(!approx(p.sourceMotorFaceNormalMapsToFrameY,motorNormalY,.000001)||
  p.planeNormalsOppose!==opposed||p.realContactPairVerified!==false||
  p.sourceOriginMetrologyVerified!==false||p.safeToAssemble!==false||
  p.exactBrepCollisionApproved!==false||p.exactBrepBooleanStatus!=='NOT_RUN')
  fail('3D pose incorrectly asserts physical contact or exact Boolean approval');
 const broad=p.broadPhaseAabbPairs;
 if(!Array.isArray(broad)||broad.length!==p.broadPhasePotentialPairCount||
  broad.length<25||broad.length>40)
  fail('Source-all-solids AABB broadphase inventory is missing or truncated');
 const pairs=new Set();
 for(const b of broad){
  const j=b.frameSolidIndex,i=b.motorSolidIndex;
  if(!Number.isInteger(j)||j<0||j>=244||
   !Number.isInteger(i)||i<0||i>=4||pairs.has(j+':'+i))
   fail('AABB candidate identifies a duplicate or invalid original solid index');
  pairs.add(j+':'+i);
 }
 if(!pairs.has(idx+':0'))
  fail('Original frame mounting solid and motor base have been omitted from broadphase');
 return {id:p.id,referenceId:reference.id,
  framePatternId:frameId,frameSolidIndex:idx,
  motorPlaneFaceIndex:p.motorSourceFaceIndex,framePlaneFaceIndex:p.frameSourceFaceIndex,
  nativeYawDeg:p.nominalInPlaneYawDeg,
  rotation3x3:R.map(row=>[...row]),
  nativeTranslationMm:[...T],
  opposingSourceNormals:opposed,modelAabbPotentialPairs:broad.length,
  modelAabbPairs:broad.map(x=>({frameSolidIndex:x.frameSolidIndex,motorSolidIndex:x.motorSolidIndex})),
  exactBrepBooleanStatus:'NOT_RUN',
  actualMountingPlaneQualified:false,
  physicalFitApproved:false,flightApproved:false};
}
export function reviewX500SourceContactSurvey(report,contourReview,actualV31Sha,
  v32Reference,actualV32Sha){
 if(report?.schema!==X500_CONTACT_SCHEMA||
  contourReview?.schema!=='aeroforge/x500-contour-review/v3.1'||
  contourReview.authority!=='HASH_BOUND_TOPOLOGICAL_RESEARCH_ONLY'||
  v32Reference?.schema!=='aeroforge/x500-nominal-planar-registration-reference/v3.2'||
  !sha.test(actualV31Sha)||!sha.test(actualV32Sha))
  fail('Verified v3.1 contour and independently computed v3.2 reference reports are required');
 if(report.source?.frameStepSha256!==ORIGINAL.frame.sha256||
  report.source?.motorStepSha256!==ORIGINAL.motor.sha256||
  report.source?.v31ReportSha256!==actualV31Sha||
  report.source?.v32ReportSha256!==actualV32Sha||
  v32Reference.frameStepSha256!==ORIGINAL.frame.sha256||
  v32Reference.motorStepSha256!==ORIGINAL.motor.sha256||
  v32Reference.sourceReportSha256?.v31!==actualV31Sha||
  contourReview.sourceStepHashes?.frame!==ORIGINAL.frame.sha256||
  contourReview.sourceStepHashes?.motor!==ORIGINAL.motor.sha256)
  fail('Original source, contour report or independent planar reference bytes differ');
 for(const k of negatives)if(report[k]!==false)
  fail('Unqualified safety status was elevated: '+k);
 if(report.originalCadDimensionsNotIndependentHardwareMeasurements!==true||
  report.aabbResultsAreOnlyBroadPhaseScreening!==true||
  report.realMotorSeatUnresolved!==true||
  report.source.expectedFrameImportedSolids!==244||
  report.source.expectedMotorImportedSolids!==4||
  report.hypothesisCount!==64||report.opposingNormalHypothesisCount!==32||
  !Array.isArray(report.hypotheses)||report.hypotheses.length!==64||
  !Array.isArray(v32Reference.candidateHypotheses)||
  v32Reference.candidateHypotheses.length!==16||
  v32Reference.candidateCount!==16)
  fail('Expected all 64 unqualified source pose combinations and complete 244/4 solid broadphase');
 if(!Array.isArray(report.motorContactPlaneCandidates)||
  report.motorContactPlaneCandidates.length!==2||
  new Set(report.motorContactPlaneCandidates.map(x=>x.sourcePlaneFaceIndex)).size!==2)
  fail('Exactly two original motor source planes expected');
 report.motorContactPlaneCandidates.forEach(verifyPlane);
 if(!Array.isArray(report.frameSourcePlateFaces)||report.frameSourcePlateFaces.length!==8)
  fail('Frame needs both exact face witnesses at all four original outer mounting solids');
 const faces=new Set();
 for(const f of report.frameSourcePlateFaces){
  const normal=f.faceIndex===105?-1:f.faceIndex===103?1:null;
  if(![35,62,89,116].includes(f.solidIndex)||normal===null||
   !approx(f.sourceNativeYmm,f.faceIndex===105?15.5:17,.00001)||
   !Array.isArray(f.nativeNormal)||f.nativeNormal.join(',')!=='0,'+normal+',0'||
   f.physicalContactVerified!==false||faces.has(f.solidIndex+':'+f.faceIndex))
    fail('A frame source planar face is duplicated or unsupported');
  faces.add(f.solidIndex+':'+f.faceIndex);
 }
 const verified=[],seen=new Set();
 for(const reference of v32Reference.candidateHypotheses){
  if(!reference.id||reference.physicalFitApproved!==false||
   reference.flightApproved!==false||reference.sourceCollisionTested!==false)
   fail('A predecessor in-plane hypothesis was promoted to physical authority');
 }
 for(const p of report.hypotheses){
  const reference=v32Reference.candidateHypotheses.find(x=>x.id===p.nominalPlanarHypothesisId);
  if(!reference||seen.has(p.id))fail('Unknown/duplicate source-native 3D pose');
  seen.add(p.id);verified.push(verifyPose(p,reference));
 }
 if(verified.length!==64||verified.filter(x=>x.opposingSourceNormals).length!==32)
  fail('A source-plane orientation or mating-normal combination is missing');
 return {schema:'aeroforge/x500-source-contact-browser-review/v3.3',
  authority:'SOURCE_GEOMETRY_BROADPHASE_ONLY',
  sourceSha256:{frame:ORIGINAL.frame.sha256,motor:ORIGINAL.motor.sha256},
  motorFaces:[28,33],frameFaces:[105,103],
  hypothesisCount:64,opposingNormalCount:32,
  candidates:verified,
  exactCollisionVerified:false,physicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'Two motor planes have cylindrical-conical BREP edge witnesses; no physical seating face is independently qualified. All AABB overlaps are potential pairs only.'};
}
