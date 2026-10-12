import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {X500_SOURCE_OBSERVATIONS_V28 as S} from '../core/x500_real_source_observations_v28.mjs';
import {reviewX500ContourGroups} from '../core/x500_brep_contour_review_v31.mjs';
const A='a'.repeat(64),B='b'.repeat(64);
const frames=[['nn',35,-176.876,-176.876],['np',62,-176.876,176.876],
 ['pn',116,176.876,-176.876],['pp',89,176.876,176.876]];
const faceIds=[108,112,116,120];
const motorCenters=[
 [725.367,-6.718,[7,69]],[726.428,5.657,[4,72]],
 [737.742,-5.657,[10,66]],[738.802,6.718,[13,63]]];
function setup(){
 const v29={schema:'aeroforge/x500-mount-candidate-browser-review/v2.9',
  authority:'SOURCE_BOUND_RESEARCH_CANDIDATES_ONLY',
  frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
  candidates:[...frames.map(([id,solidIndex,x,z])=>({
   id:'frame-quadrant-'+id,solidIndex,role:'frame',centerTransverseMm:[x,z]})),
   {id:'motor-coaxial-16-19-pairs',solidIndex:0,role:'motor',
    centerTransverseMm:[732.08475,0]}]};
 const v30={schema:'aeroforge/x500-plane-topology-browser-review/v3.0',
  authority:'LOCAL_BREP_EDGE_ANALYSIS_REPORTED_NOT_INDEPENDENTLY_VERIFIED',
  candidates:v29.candidates.map(c=>({id:c.id,solidIndex:c.solidIndex,role:c.role}))};
 const rows=frames.map(([id,solidIndex,x,z])=>{
  const coordinates=[[x-8.75,z],[x,z+8.75],[x,z-8.75],[x+8.75,z]];
  const wires=[105,103].flatMap((faceIndex,k)=>coordinates.map((c,i)=>({
   kind:'CLOSED_OBROUND_INNER_WIRE_CANDIDATE',nominalWidthMm:5.8,
   nominalLengthMm:7.3,nominalContourRadiusMm:2.9,straightSectionMm:1.5,
   fastenerHoleIdentityVerified:false,verifiedPhysicalMount:false,
   sourcePlaneFaceIndex:faceIndex,wireIndex:i+1,
   sourceNativeAxialMm:k?17:15.5,
   selectedCylinderFaceIndex:faceIds[i],
   nativeCenterMm:[c[0],k?17:15.5,c[1]]
  })));
  return {id:'frame-quadrant-'+id,sourceSolidIndex:solidIndex,
   shapeFamily:'FOUR_OBROUND_SLOT_CONTOURS',sourcePlaneWireContours:wires,
   planeFaceIndices:[105,103],nominalContourRadiusMm:2.9,
   nominalContourStraightSegmentMm:1.5,nominalContourWidthMm:5.8,
   nominalContourLengthMm:7.3,slotCenterRadialDistanceFromPatternCenterMm:8.75,
   sourceNativePlateThicknessMm:1.5,
   verifiedFastenerHoleIdentity:false,contactFaceQualified:false,fitTested:false};
 });
 rows.push({id:'motor-coaxial-16-19-pairs',sourceSolidIndex:0,
  shapeFamily:'FOUR_SPLIT_FACE_CIRCULAR_PASSAGES',candidatePassageCount:4,
  candidatePassages:motorCenters.map(([y,z,faces])=>({
   centerTransverseNativeMm:[y,z],sourceFaceIndices:faces,
   circularWallRadiusMm:1.25,circularWallDiameterMm:2.5,
   sourceAxialStartMm:1181.1255,sourceAxialEndMm:1183.4255,
   sourceAxialLengthMm:2.3,sharedLongitudinalSeamEdges:2,
   pairedSemicircularCapArcs:4,centerEmptyInSourceSolid:true,
   surroundingMaterialSampleCount:4,type:'SOURCE_SPLIT_FACE_CIRCULAR_PASSAGE',
   confirmedThreadedHole:false,fastenerEngagementVerified:false
  })),
  nominal16And19MmPairsObserved:true,motorMountingFaceVerified:false,
  threadSpecificationVerified:false,physicalFitTested:false});
 const report={schema:'aeroforge/x500-brep-contour-groups/v3.1',
  source:{frameStepSha256:S.frame.sha256,motorStepSha256:S.motor.sha256,
   candidateReportSha256:A,topologyReportSha256:B},
  candidateCount:5,candidates:rows,totalFrameObroundSlotsDetected:16,
  motorCircularPassageCount:4,sourceSolidsInterferenceTested:false,
  relativeMatingPlaneVerified:false,manufacturerOriginAuthenticated:false,
  screwThreadsVerified:false,independentlyMeasured:false,
  tolerancedCompatibilityVerified:false,physicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false};
 return {report,v29,v30};
}
const run=x=>reviewX500ContourGroups(x.report,x.v29,x.v30,A,B);
test('all 16 frame source-obround slots and 4 split motor passages remain unqualified',()=>{
 const r=run(setup());
 assert.equal(r.frameObroundCount,16);
 assert.equal(r.motorCircularPassageCount,4);
 assert.equal(r.annotations.length,20);
 assert.equal(r.annotations.filter(x=>x.role==='frame').length,16);
 assert.equal(r.annotations.filter(x=>x.role==='motor').length,4);
 assert.equal(r.annotations[0].widthMm,5.8);
 assert.equal(r.annotations[0].lengthMm,7.3);
 assert.equal(r.annotations.at(-1).diameterMm,2.5);
 assert.equal(r.actualMatingFaceVerified,false);
 assert.equal(r.mechanicalFitApproved,false);
 assert.equal(r.flightApproved,false);
});
test('tampering with exact source reports, slot geometry or bore evidence fails closed',()=>{
 const tamper=[
  x=>x.report.source.candidateReportSha256='c'.repeat(64),
  x=>x.report.source.topologyReportSha256='c'.repeat(64),
  x=>x.report.source.motorStepSha256='c'.repeat(64),
  x=>x.report.flightApproved=true,
  x=>x.report.screwThreadsVerified=true,
  x=>x.report.motorCircularPassageCount=5,
  x=>x.report.candidates[0].nominalContourLengthMm=8.1,
  x=>x.report.candidates[0].sourcePlaneWireContours[0].nominalWidthMm=6.0,
  x=>x.report.candidates[0].sourcePlaneWireContours[0].nativeCenterMm[0]+=1,
  x=>x.report.candidates[0].sourcePlaneWireContours[1].sourcePlaneFaceIndex=103,
  x=>x.report.candidates[0].sourcePlaneWireContours[1].fastenerHoleIdentityVerified=true,
  x=>x.report.candidates[4].candidatePassages[0].sourceFaceIndices=[7,72],
  x=>x.report.candidates[4].candidatePassages[0].centerEmptyInSourceSolid=false,
  x=>x.report.candidates[4].motorMountingFaceVerified=true,
  x=>x.v29.authority='APPROVED',
  x=>x.v30.authority='QUALIFIED'
 ];
 for(const t of tamper){
  const x=setup();t(x);
  assert.throws(()=>run(x),/BREP contour classification rejected/);
 }
});
test('UI hashes predecessor topology bytes and only transfers transverse coordinates',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../cad_pair_viewer_v24.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v31-contour-report/);
 assert.match(ui,/reviewX500ContourGroups/);
 assert.match(ui,/crypto\.subtle\.digest\('SHA-256',rawTopology\)/);
 assert.match(ui,/contourPanel\.hidden=!contourReview/);
 assert.match(ui,/copyCandidate\.disabled=Boolean\(contourReview\)/);
 assert.match(ui,/if\(current\.role==='frame'&&i===1\)return ''/);
 assert.match(ui,/if\(current\.role==='motor'&&i===0\)return ''/);
 assert.match(viewer,/setContourEvidence\(review\)/);
 assert.match(viewer,/activeProposal\.motor\?\.sourceSha256!==review\.sourceStepHashes\.motor/);
 assert.match(viewer,/originalFrameSlotMarkers:slots\.length/);
});
