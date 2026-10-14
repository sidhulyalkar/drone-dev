/** v3.2: source-bound NOMINAL 2D X500 motor/slot research hypotheses.
 *
 * Uses the already validated 20 BREP feature centers from v3.1; measures the
 * Euclidean distance from each transformed motor passage center to its assigned
 * frame slot's medial spine segment. NEVER derives contact-plane height, a
 * threaded fastener, physical tolerance, rigid 3D pose or flight approval.
 */
import {X500_SOURCE_OBSERVATIONS_V28 as SOURCE} from './x500_real_source_observations_v28.mjs';
export const PLANAR_FIT_SCHEMA='aeroforge/x500-nominal-planar-registration/v3.2';
const EPS=1e-8;
const safe=x=>typeof x==='number'&&Number.isFinite(x);
const error=message=>{throw Error('Nominal planar mounting study rejected: '+message);};
const round=x=>Math.round(x*1e6)/1e6;
const plus=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const minus=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const scale=(a,s)=>[a[0]*s,a[1]*s];
const norm=v=>Math.hypot(...v);
const unit=v=>{const n=norm(v);if(n<EPS)error('Zero-length slot axis');return scale(v,1/n);};
const rotate=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
const centroid=pts=>scale(pts.reduce((v,p)=>plus(v,p),[0,0]),1/pts.length);
const toDegrees=a=>((a*180/Math.PI)%360+360)%360;
function permutations(arr){
 if(arr.length===0)return [[]];
 return arr.flatMap((x,i)=>permutations([...arr.slice(0,i),...arr.slice(i+1)]).map(p=>[x,...p]));
}
export function pointToCapsuleSpineDistanceMm(point,center,axis,halfLengthMm){
 if(![...point,...center,...axis,halfLengthMm].every(safe)||
  halfLengthMm<0||Math.abs(norm(axis)-1)>.001)
  error('Invalid source centerline segment');
 const d=minus(point,center);
 const projection=d[0]*axis[0]+d[1]*axis[1];
 const clamped=Math.min(halfLengthMm,Math.max(-halfLengthMm,projection));
 return norm(minus(d,scale(axis,clamped)));
}
function verifyContours(review){
 if(review?.schema!=='aeroforge/x500-contour-review/v3.1'||
  review.authority!=='HASH_BOUND_TOPOLOGICAL_RESEARCH_ONLY'||
  review.frameObroundCount!==16||review.motorCircularPassageCount!==4||
  review.annotations?.length!==20||
  review.sourceStepHashes?.frame!==SOURCE.frame.sha256||
  review.sourceStepHashes?.motor!==SOURCE.motor.sha256)
  error('Both original source STEP fingerprints and complete v3.1 contour review are required');
 for(const k of ['actualMatingFaceVerified','threadSpecificationVerified',
  'tolerancedFitApproved','mechanicalFitApproved','procurementApproved',
  'powerApproved','flightApproved']){
  if(review[k]!==false)error('Cannot accept upgraded physical approval: '+k);
 }
 const ids=['nn','np','pn','pp'];
 const frame=[];
 for(const quadrant of ids){
  const prefix='frame-quadrant-'+quadrant+'-slot-';
  const slot=review.annotations.filter(a=>a.role==='frame'&&a.id?.startsWith(prefix));
  if(slot.length!==4||new Set(slot.map(a=>a.id)).size!==4)
   error('Each frame quadrant must have four individually verified slot centers');
  const centers=slot.map(a=>{
   if(a.contourType!=='OBROUND_INNER_WIRE'||
    a.widthMm!==5.8||a.lengthMm!==7.3||
    a.axialMatingFaceQualified!==false||
    !Array.isArray(a.nativeCenterMm)||a.nativeCenterMm.length!==3||
    !a.nativeCenterMm.every(safe)||Math.abs(a.nativeCenterMm[1]-15.5)>.002)
    error('Invalid original frame source obround contour');
   return [a.nativeCenterMm[0],a.nativeCenterMm[2]];
  });
  const center=centroid(centers);
  const signed=[quadrant[0]==='p'?1:-1,quadrant[1]==='p'?1:-1];
  for(let i=0;i<2;i++)if(Math.abs(center[i]-signed[i]*176.876396)>.03)
   error('Frame quadrant original-source center mismatch');
  for(const s of centers){
   const r=norm(minus(s,center));
   if(Math.abs(r-8.75)>.035)error('Slot contour center not on original 8.75 mm radial family');
  }
  frame.push({id:'frame-quadrant-'+quadrant,center,slots:slot.map((a,i)=>({
   id:a.id,center:centers[i],direction:unit(minus(centers[i],center)),
   originalSourceSolidIndex:a.sourceSolidIndex,sourceFaceIndex:a.sourceFaceIndex
  }))});
 }
 const motor=review.annotations.filter(a=>a.role==='motor');
 if(motor.length!==4||new Set(motor.map(m=>m.id)).size!==4)
  error('Exactly four distinct original motor split-cylinder passages required');
 const pts=motor.map(a=>{
  if(a.contourType!=='SPLIT_CIRCULAR_PASSAGE'||a.diameterMm!==2.5||
   a.shaftOrThreadQualified!==false||!Array.isArray(a.nativeCenterMm)||
   a.nativeCenterMm.length!==3||!a.nativeCenterMm.every(safe)||
   Math.abs(a.nativeCenterMm[0]-1182.2755)>.015)
   error('Invalid source motor passage center');
  return [a.nativeCenterMm[1],a.nativeCenterMm[2]];
 });
 const center=centroid(pts);
 if(norm(minus(center,[732.08475,0]))>.03)
  error('Motor original BREP passage family center changed');
 const radii=pts.map(p=>norm(minus(p,center))).sort((a,b)=>a-b);
 if(radii.slice(0,2).some(r=>Math.abs(r-8)>.03)||
  radii.slice(2).some(r=>Math.abs(r-9.5)>.03))
  error('Motor 16/19 mm opposite-pair radial family changed');
 return {frame,motor:{center,pts,ids:motor.map(m=>m.id)}};
}
/**
 * probeDiameterMm is a HYPOTHETICAL test disk for planar contour containment.
 * It is NOT a bolt diameter, drill specification, thread engagement or safety
 * clearance. It may be set to 0 for a center-point-only study.
 */
export function solveX500NominalPlanarFit(contourReview,{probeDiameterMm=2.5}={}){
 if(!safe(probeDiameterMm)||probeDiameterMm<0||probeDiameterMm>5.8)
  error('Probe diameter must be 0 to 5.8 mm, not a real fastener declaration');
 const {frame,motor}=verifyContours(contourReview),results=[];
 const perms=permutations([0,1,2,3]);
 const firstVector=minus(motor.pts[0],motor.center);
 for(const quadrant of frame){
  const one=[];
  for(const target of quadrant.slots){
   const direction=target.direction;
   const angle=Math.atan2(direction[1],direction[0])-
    Math.atan2(firstVector[1],firstVector[0]);
   const transformed=motor.pts.map(p=>plus(quadrant.center,
    rotate(minus(p,motor.center),angle)));
   let winner=null;
   for(const perm of perms){
    const pairs=perm.map((slotIndex,motorIndex)=>{
     const slot=quadrant.slots[slotIndex],point=transformed[motorIndex];
     const miss=pointToCapsuleSpineDistanceMm(point,slot.center,slot.direction,.75);
     return {motorFeatureId:motor.ids[motorIndex],frameSlotId:slot.id,
      motorProjectedNativeFrameMm:point.map(round),
      slotCenterNativeMm:slot.center.map(round),
      transverseMissToSlotSpineMm:round(miss),
      nominalProbeContourMarginMm:round(2.9-probeDiameterMm/2-miss)};
    });
    const worst=Math.max(...pairs.map(p=>p.transverseMissToSlotSpineMm));
    const sum=pairs.reduce((n,p)=>n+p.transverseMissToSlotSpineMm,0);
    if(winner===null||worst<winner.worst-EPS||
      (Math.abs(worst-winner.worst)<EPS&&sum<winner.sum-EPS)){
     winner={pairs,worst,sum};
    }
   }
   one.push({id:quadrant.id+'-orientation-'+(one.length+1),
    framePatternId:quadrant.id,
    motorToFrameProjectedYawDeg:round(toDegrees(angle)),
    motorToFrameProjectedLinear2x2:[
      [round(Math.cos(angle)),round(-Math.sin(angle))],
      [round(Math.sin(angle)),round(Math.cos(angle))]
    ],
    projectedTranslationMm:minus(quadrant.center,rotate(motor.center,angle)).map(round),
    frameSourcePatternCenterMm:quadrant.center.map(round),
    motorSourcePatternCenterMm:motor.center.map(round),
    worstCenterlineResidualMm:round(winner.worst),
    minHypotheticalProbeContourMarginMm:round(
      Math.min(...winner.pairs.map(p=>p.nominalProbeContourMarginMm))),
    fourIndividualSlotMatches:winner.pairs,
    modelOnlyProbeDiameterMm:probeDiameterMm,
    axialTranslationMm:null,
    axialMatingPlaneIdentified:false,
    normalSignOrMotorFaceQualified:false,
    fullThreeDimensionalRigidTransformQualified:false,
    sourceCollisionTested:false,fastenerFitApproved:false,
    physicalFitApproved:false,flightApproved:false});
  }
  results.push(...one);
 }
 if(results.length!==16)error('Nominal alignment candidate count changed');
 return {schema:PLANAR_FIT_SCHEMA,
  authority:'SOURCE_BREP_IN_PLANE_NOMINAL_HYPOTHESIS_ONLY',
  sourceStepHashes:{...contourReview.sourceStepHashes},
  probeDiameterMm,candidateCount:16,frameLocations:4,
  orientationsPerLocation:4,candidates:results,
  coordinateConvention:'motor native [Y,Z] => frame native [X,Z]; motor axial native X and frame axial native Y remain unregistered',
  impliedRightHandedAxialHypothesis:'motor native +X would map to frame native -Y for positive 2D planar rotation; UNVERIFIED',
  manufacturerIdentityVerified:false,axialMatingPlaneIdentified:false,
  fullThreeDimensionalRigidTransformQualified:false,
  actualBoltDiameterKnown:false,fastenerEngagementMeasured:false,
  sourceCollisionTested:false,toleranceStackEvaluated:false,
  physicalFitApproved:false,procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'The 16 mathematical XY/XZ alignment poses compare source-native contours only. The test disk is NOT a bolt. No axial separation, actual motor seat, bolt engagement, physical interference or tolerance approval is established.'};
}
