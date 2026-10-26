/** Source-hash-bound v3.1 contour interpretation, not any mechanical approval.
 * Read-only evidence is accepted only after both source STEP+GLB receipts, v2.9
 * feature pattern and v3.0 exact BREP topology reports have been verified.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as SOURCE} from './x500_real_source_observations_v28.mjs';
export const CONTOUR_SCHEMA='aeroforge/x500-brep-contour-groups/v3.1';
const sha=/^[a-f0-9]{64}$/;
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const near=(a,b,t=.025)=>typeof a==='number'&&Number.isFinite(a)&&Math.abs(a-b)<=t;
const fail=m=>{throw Error('BREP contour classification rejected: '+m);};
const expectedIds=['frame-quadrant-nn','frame-quadrant-np',
 'frame-quadrant-pn','frame-quadrant-pp','motor-coaxial-16-19-pairs'];
const frameFaces=[108,112,116,120];
const expectedMotorFacePairs=[[7,69],[4,72],[10,66],[13,63]];
const expectedMotorCenters=[
 [725.367,-6.718],[726.428,5.657],[737.742,-5.657],[738.802,6.718]
];
function pt(point,ref,label,t=.025){
 if(!Array.isArray(point)||point.length!==ref.length||
  point.some((v,i)=>!near(v,ref[i],t)))fail(label);
}
function strictFalse(data,keys){
 for(const k of keys)if(data?.[k]!==false)fail('Approval or inspection authority: '+k);
}
export function reviewX500ContourGroups(report,candidateReview,topologyReview,
 candidateReportSha256,topologyReportSha256){
 if(!isObj(report)||report.schema!==CONTOUR_SCHEMA||report.candidateCount!==5||
  !Array.isArray(report.candidates)||report.candidates.length!==5)
  fail('Incorrect or incomplete original BREP contour report');
 if(candidateReview?.schema!=='aeroforge/x500-mount-candidate-browser-review/v2.9'||
  candidateReview.authority!=='SOURCE_BOUND_RESEARCH_CANDIDATES_ONLY'||
  topologyReview?.schema!=='aeroforge/x500-plane-topology-browser-review/v3.0'||
  topologyReview.authority!=='LOCAL_BREP_EDGE_ANALYSIS_REPORTED_NOT_INDEPENDENTLY_VERIFIED')
  fail('Both predecessor source evidence reviews required');
 if(!sha.test(candidateReportSha256)||!sha.test(topologyReportSha256)||
  report.source?.candidateReportSha256!==candidateReportSha256||
  report.source?.topologyReportSha256!==topologyReportSha256||
  report.source?.frameStepSha256!==SOURCE.frame.sha256||
  report.source?.motorStepSha256!==SOURCE.motor.sha256||
  candidateReview.frameStepSha256!==SOURCE.frame.sha256||
  candidateReview.motorStepSha256!==SOURCE.motor.sha256)
  fail('Original source or predecessor report digest mismatch');
 strictFalse(report,['sourceSolidsInterferenceTested','relativeMatingPlaneVerified',
  'manufacturerOriginAuthenticated','screwThreadsVerified','independentlyMeasured',
  'tolerancedCompatibilityVerified','physicalFitApproved','procurementApproved',
  'powerApproved','flightApproved']);
 if(report.totalFrameObroundSlotsDetected!==16||
  report.motorCircularPassageCount!==4)fail('Unexpected CAD feature family count');
 const seen=new Set(),observations=[],annotations=[];
 for(const group of report.candidates){
  if(!isObj(group)||seen.has(group.id)||!expectedIds.includes(group.id))
   fail('Missing, duplicate or unknown pattern');
  const baseline=candidateReview.candidates.find(x=>x.id===group.id);
  const topo=topologyReview.candidates.find(x=>x.id===group.id);
  if(!baseline||!topo||group.sourceSolidIndex!==baseline.solidIndex||
     group.sourceSolidIndex!==topo.solidIndex)
   fail('Source BREP solid identity differs across evidence versions');
  seen.add(group.id);
  const frame=baseline.role==='frame';
  if(frame){
   if(group.shapeFamily!=='FOUR_OBROUND_SLOT_CONTOURS'||
    !Array.isArray(group.sourcePlaneWireContours)||
    group.sourcePlaneWireContours.length!==8||
    group.verifiedFastenerHoleIdentity!==false||
    group.contactFaceQualified!==false||group.fitTested!==false||
    group.nominalContourRadiusMm!==2.9||
    group.nominalContourStraightSegmentMm!==1.5||
    group.nominalContourWidthMm!==5.8||
    group.nominalContourLengthMm!==7.3||
    group.slotCenterRadialDistanceFromPatternCenterMm!==8.75||
    group.sourceNativePlateThicknessMm!==1.5)
    fail('Original frame slot contour contract was altered');
   if(!Array.isArray(group.planeFaceIndices)||
    group.planeFaceIndices.join(',')!=='105,103')fail('Original frame plane indices changed');
   for(const plane of [105,103]){
    const withinPlane=group.sourcePlaneWireContours.filter(x=>x.sourcePlaneFaceIndex===plane);
    if(withinPlane.length!==4||new Set(withinPlane.map(x=>x.selectedCylinderFaceIndex)).size!==4||
     frameFaces.some(f=>!withinPlane.some(x=>x.selectedCylinderFaceIndex===f)))
     fail('Each original frame plate must have four unique slot contours');
    const slotCenters=[];
    for(const entry of withinPlane){
     strictFalse(entry,['fastenerHoleIdentityVerified','verifiedPhysicalMount']);
     if(entry.kind!=='CLOSED_OBROUND_INNER_WIRE_CANDIDATE'||
      entry.nominalWidthMm!==5.8||entry.nominalLengthMm!==7.3||
      entry.nominalContourRadiusMm!==2.9||
      entry.straightSectionMm!==1.5||
      !Number.isInteger(entry.wireIndex)||entry.wireIndex<1||entry.wireIndex>5||
      !near(entry.sourceNativeAxialMm,plane===105?15.5:17,.001))
      fail('Untrusted frame wire source geometry');
     const c=entry.nativeCenterMm;
     if(!Array.isArray(c)||c.length!==3||
      !near(c[1],entry.sourceNativeAxialMm,.001)||
      !near(Math.hypot(c[0]-baseline.centerTransverseMm[0],
                        c[2]-baseline.centerTransverseMm[1]),8.75,.02))
      fail('Slot center is not at the actual source BREP contour location');
     slotCenters.push([c[0],c[2]]);
     if(plane===105)annotations.push({id:group.id+'-slot-'+entry.selectedCylinderFaceIndex,
      role:'frame',sourceSolidIndex:group.sourceSolidIndex,
      sourceFaceIndex:entry.sourcePlaneFaceIndex,
      splitCylinderFaceIndex:entry.selectedCylinderFaceIndex,
      nativeCenterMm:[...c],contourType:'OBROUND_INNER_WIRE',
      widthMm:5.8,lengthMm:7.3,axialMatingFaceQualified:false});
    }
    if(new Set(slotCenters.map(x=>x.map(v=>v.toFixed(3)).join(','))).size!==4)
     fail('Four independent original slot centers are required');
   }
   observations.push({id:group.id,role:'frame',sourceSolidIndex:group.sourceSolidIndex,
    featureCount:4,contourType:'OBROUND_SLOT_CANDIDATE',widthMm:5.8,lengthMm:7.3,
    plateThicknessMm:1.5,approved:false});
  }else{
   if(group.shapeFamily!=='FOUR_SPLIT_FACE_CIRCULAR_PASSAGES'||
    group.candidatePassageCount!==4||!Array.isArray(group.candidatePassages)||
    group.candidatePassages.length!==4||group.motorMountingFaceVerified!==false||
    group.threadSpecificationVerified!==false||group.physicalFitTested!==false||
    group.nominal16And19MmPairsObserved!==true)
    fail('Original motor circular passage evidence changed');
   const centers=[];
   for(const bore of group.candidatePassages){
    strictFalse(bore,['confirmedThreadedHole','fastenerEngagementVerified']);
    if(bore.type!=='SOURCE_SPLIT_FACE_CIRCULAR_PASSAGE'||
     bore.circularWallRadiusMm!==1.25||bore.circularWallDiameterMm!==2.5||
     !near(bore.sourceAxialLengthMm,2.3,.001)||
     !near(bore.sourceAxialEndMm-bore.sourceAxialStartMm,2.3,.001)||
     !near(bore.sourceAxialStartMm,1181.1255,.005)||
     bore.sharedLongitudinalSeamEdges!==2||bore.pairedSemicircularCapArcs!==4||
     bore.centerEmptyInSourceSolid!==true||
     bore.surroundingMaterialSampleCount!==4||
     !Array.isArray(bore.sourceFaceIndices)||bore.sourceFaceIndices.length!==2||
     new Set(bore.sourceFaceIndices).size!==2)
      fail('Incomplete split cylindrical face / bore boundary evidence');
    const center=bore.centerTransverseNativeMm;
    const which=expectedMotorCenters.findIndex(x=>
      Array.isArray(center)&&center.length===2&&center.every((v,i)=>near(v,x[i],.01)));
    if(which<0||centers.includes(which)||
      bore.sourceFaceIndices.slice().sort((a,b)=>a-b).join(',')!==expectedMotorFacePairs[which].slice().sort((a,b)=>a-b).join(','))
      fail('Motor passage axis or its original cylindrical face identity moved or duplicated');
    centers.push(which);
    annotations.push({id:'motor-circular-passage-'+which,role:'motor',
      sourceSolidIndex:group.sourceSolidIndex,sourceFaceIndices:[...bore.sourceFaceIndices],
      nativeCenterMm:[(bore.sourceAxialStartMm+bore.sourceAxialEndMm)/2,...center],
      contourType:'SPLIT_CIRCULAR_PASSAGE',diameterMm:2.5,
      shaftOrThreadQualified:false});
   }
   observations.push({id:group.id,role:'motor',sourceSolidIndex:group.sourceSolidIndex,
    featureCount:4,contourType:'SPLIT_FACE_CIRCULAR_PASSAGE_CANDIDATE',
    diameterMm:2.5,axialWallLengthMm:2.3,approved:false});
  }
 }
 if(seen.size!==5||annotations.length!==20)fail('Missing source feature contour(s)');
 return {schema:'aeroforge/x500-contour-review/v3.1',
  authority:'HASH_BOUND_TOPOLOGICAL_RESEARCH_ONLY',
  observations,annotations,
  frameObroundCount:16,motorCircularPassageCount:4,
  sourceStepHashes:{frame:SOURCE.frame.sha256,motor:SOURCE.motor.sha256},
  actualMatingFaceVerified:false,threadSpecificationVerified:false,
  tolerancedFitApproved:false,mechanicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'Unqualified source-geometry slots and passages only. Actual bolt sizes, source revisions, axial mounting planes and exact physical interference remain unresolved.'};
}
