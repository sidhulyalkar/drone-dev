/** Visualize two separately hash-checked local CAD-derived GLBs in a user-proposed frame.
 * Blue motor pose is a manual HYPOTHESIS, not a measured mechanical mate or collision pass.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {verifyCadPairViewerAssets} from './core/cad_pair_view_guard_v25.mjs';
import {deriveCadPairInspectionPose} from './core/cad_pair_pose_v26.mjs';
import {X500_SOURCE_OBSERVATIONS_V28} from './core/x500_real_source_observations_v28.mjs';
export function createCadPairViewer(host){
 if(!host)throw Error('Missing paired CAD host');
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x101c24);
 const camera=new THREE.PerspectiveCamera(43,1,.001,1000);
 camera.up.set(0,0,1);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 renderer.domElement.setAttribute('aria-label','Dual-source X500 CAD preview, manual unverified placement');
 host.append(renderer.domElement);
 const orbit=new OrbitControls(camera,renderer.domElement);
 orbit.enableDamping=true;
 scene.add(new THREE.HemisphereLight(0xffffff,0x344050,2.3));
 const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(1,2,5);scene.add(sun);
 const models=new THREE.Group();scene.add(models);
 const axes=new THREE.AxesHelper(.1);models.add(axes);
 const datums=new THREE.Group();scene.add(datums);
 const planeTopologyDots=new THREE.Group();scene.add(planeTopologyDots);
 const loader=new GLTFLoader();
 let dead=false,raf=0,activeProposal=null,motorRoot=null,separationMm=0,markersVisible=true;
 function resize(){
  if(dead)return;
  const w=Math.max(200,host.clientWidth),h=Math.max(250,host.clientHeight);
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 }
 const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
 observer?.observe(host);resize();
 async function parse(bytes){
  if(!(bytes instanceof ArrayBuffer))throw Error('Verified local GLB ArrayBuffer required');
  return new Promise((resolve,reject)=>loader.parse(bytes,'',resolve,reject));
 }
 async function load(frameBytes,motorBytes,proposal){
  if(proposal?.schema!=='aeroforge/x500-cad-mating-proposal/v2.4'||
   proposal.mechanicalFitApproved!==false||proposal.independentlyQualified!==false)
   throw Error('Unverified two-part pose is required');
  await verifyCadPairViewerAssets(frameBytes,motorBytes,proposal);
  if(dead)return;
  const [frame,motor]=await Promise.all([parse(frameBytes),parse(motorBytes)]);
  if(dead)return;
  // For the exact two user-uploaded STEP fingerprints the two frame plates
  // were observed at native Y=0 and Y=30. Set only the viewer camera up axis;
  // never rotate original mesh coordinates or assert a calibrated FRD transform.
  const matchingLocalSource=proposal.frame?.sourceSha256===X500_SOURCE_OBSERVATIONS_V28.frame.sha256&&
    proposal.motor?.sourceSha256===X500_SOURCE_OBSERVATIONS_V28.motor.sha256;
  camera.up.set(0,matchingLocalSource?1:0,matchingLocalSource?0:1);
  // Keep each file's own GLB mesh geometry and transform; no inferred components.
  const frameRoot=frame.scene;motorRoot=motor.scene;
  frameRoot.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({
   color:0x9daeb8,metalness:.12,roughness:.67,side:THREE.DoubleSide});});
  motorRoot.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({
   color:0x5bbdc8,metalness:.18,roughness:.48,side:THREE.DoubleSide});});
  // Use the same validated mathematical datum contract as the renderer overlays.
  const initialPose=deriveCadPairInspectionPose(proposal,0);
  motorRoot.matrixAutoUpdate=false;
  motorRoot.matrix.set(...initialPose.matrix4RowMajor);
  activeProposal=proposal;separationMm=0;
  models.add(frameRoot,motorRoot);
  models.updateMatrixWorld(true);
  const aabb=new THREE.Box3().setFromObject(models);
  if(aabb.isEmpty())throw Error('CAD contained no drawable geometry');
  const span=aabb.getSize(new THREE.Vector3()).length();
  if(!Number.isFinite(span)||span<=0||span>100)throw Error('Invalid combined preview bounds');
  const center=aabb.getCenter(new THREE.Vector3());
  axes.position.copy(center);axes.scale.setScalar(span*.5);
  orbit.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(span*.85,-span*.95,span*.7));
  camera.near=Math.max(.001,span/1000);camera.far=Math.max(50,span*50);
  camera.updateProjectionMatrix();
  orbit.minDistance=span*.05;orbit.maxDistance=span*10;
  orbit.update();resize();
  // Two explicit markers represent the *user-picked* source mating datums.
  // The guide line is the visualization separation, not a measured clearance.
  const sphereRadius=Math.max(.002,Math.min(.012,span*.015));
  const dot=(color)=>{
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(sphereRadius,14,10),
    new THREE.MeshBasicMaterial({color,depthTest:false}));
   mesh.renderOrder=3;datums.add(mesh);return mesh;
  };
  const frameDot=dot(0xffc66a),motorDot=dot(0x55deef);
  const line=new THREE.Line(new THREE.BufferGeometry(),
   new THREE.LineDashedMaterial({color:0xf7d18b,dashSize:.008,gapSize:.005,depthTest:false}));
  line.renderOrder=2;datums.add(line);
  datums.userData={frameDot,motorDot,line};
  updateInspectionPose();
 }
 function updateInspectionPose(){
  if(!activeProposal||!motorRoot)return null;
  const pose=deriveCadPairInspectionPose(activeProposal,separationMm);
  motorRoot.matrix.set(...pose.matrix4RowMajor);
  motorRoot.matrixWorldNeedsUpdate=true;
  const {frameDot,motorDot,line}=datums.userData;
  if(frameDot&&motorDot&&line){
   frameDot.position.set(...pose.frameDatumMm.map(v=>v/1000));
   motorDot.position.set(...pose.motorDatumPreviewFrameMm.map(v=>v/1000));
   line.geometry.dispose();
   line.geometry=new THREE.BufferGeometry().setFromPoints([frameDot.position,motorDot.position]);
   line.computeLineDistances();
   datums.visible=markersVisible;
  }
  return pose;
 }
 function setTopologyEvidence(review){
  if(!activeProposal)throw Error('Load an original-source mating study first');
  if(review?.schema!=='aeroforge/x500-plane-topology-browser-review/v3.0'||
    review.authority!=='LOCAL_BREP_EDGE_ANALYSIS_REPORTED_NOT_INDEPENDENTLY_VERIFIED'||
    review.mechanicalFitApproved!==false||review.flightApproved!==false||
    review.candidates?.length!==5||
    activeProposal.frame?.sourceSha256!==X500_SOURCE_OBSERVATIONS_V28.frame.sha256||
    activeProposal.motor?.sourceSha256!==X500_SOURCE_OBSERVATIONS_V28.motor.sha256)
    throw Error('Only matching original-source unqualified BREP plane evidence is displayable');
  const points=[];
  for(const c of review.candidates){
   if(c.role!=='frame')continue; // motor has no established shared axial plane
   if(c.sharedPlanarFaces?.length!==2||
     !['frame-quadrant-nn','frame-quadrant-np','frame-quadrant-pp','frame-quadrant-pn'].includes(c.id))
    throw Error('Invalid frame plane landmark family');
   const quadrant={
    'frame-quadrant-nn':[-176.876,-176.876],
    'frame-quadrant-np':[-176.876,176.876],
    'frame-quadrant-pp':[176.876,176.876],
    'frame-quadrant-pn':[176.876,-176.876],
   }[c.id];
   for(const plane of c.sharedPlanarFaces){
    if(![15.5,17].includes(plane.axialNativeCoordinateMm)||
       plane.geometryIsPhysicalMount!==false)
      throw Error('Source BREP plane evidence claims a physical mate');
    points.push({position:[quadrant[0]/1000,plane.axialNativeCoordinateMm/1000,quadrant[1]/1000],
     lower:plane.axialNativeCoordinateMm===15.5});
   }
  }
  if(points.length!==8)throw Error('Expected exactly eight unqualified frame planar markers');
  for(const object of planeTopologyDots.children){object.geometry?.dispose();object.material?.dispose();}
  planeTopologyDots.clear();
  for(const point of points){
   const marker=new THREE.Mesh(new THREE.SphereGeometry(.003,12,8),
    new THREE.MeshBasicMaterial({color:point.lower?0xf6a75d:0xb8a6fa,depthTest:false}));
   marker.position.set(...point.position);
   marker.renderOrder=4;planeTopologyDots.add(marker);
  }
  return {sourcePlanarMarkers:points.length,sourceFrameOnly:true,
   motorMatingPlaneLocated:false,physicalFitApproved:false,
   legend:'Orange = native Y 15.5 mm; violet = Y 17.0 mm. Both source-only planar faces, NOT actual mating approvals.'};
 }
 function setSeparation(value){
  if(dead||!activeProposal)throw Error('Load a valid CAD research proposal first');
  // Reject invalid values BEFORE changing a working render state.
  deriveCadPairInspectionPose(activeProposal,value);
  separationMm=value;
  return updateInspectionPose();
 }
 function setDatumMarkersVisible(visible){
  if(typeof visible!=='boolean')throw Error('Expected marker visibility boolean');
  markersVisible=visible;datums.visible=markersVisible;
 }
 function draw(){
  if(dead)return;
  if(!document.hidden&&host.getClientRects().length&&host.clientWidth>1){
   orbit.update();renderer.render(scene,camera);
  }
  raf=requestAnimationFrame(draw);
 }
 draw();
 return {load,setSeparation,setDatumMarkersVisible,setTopologyEvidence,dispose(){
  if(dead)return;dead=true;cancelAnimationFrame(raf);observer?.disconnect();
  const geometries=new Set(),materials=new Set();
  models.traverse(o=>{
   if(o.isMesh){if(o.geometry)geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);}
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  for(const dot of datums.children){
   dot.geometry?.dispose();dot.material?.dispose();
  }
  datums.clear();
  for(const dot of planeTopologyDots.children){dot.geometry?.dispose();dot.material?.dispose();}
  planeTopologyDots.clear();
  axes.geometry.dispose();axes.material.dispose();
  orbit.dispose();renderer.dispose();renderer.domElement.remove();
 }};
}
