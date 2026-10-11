/** Visualize two separately hash-checked local CAD-derived GLBs in a user-proposed frame.
 * Blue motor pose is a manual HYPOTHESIS, not a measured mechanical mate or collision pass.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
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
 const loader=new GLTFLoader();
 let dead=false,raf=0;
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
  const [frame,motor]=await Promise.all([parse(frameBytes),parse(motorBytes)]);
  if(dead)return;
  // Keep each file's own GLB mesh geometry and transform; no inferred components.
  const frameRoot=frame.scene,motorRoot=motor.scene;
  frameRoot.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({
   color:0x9daeb8,metalness:.12,roughness:.67,side:THREE.DoubleSide});});
  motorRoot.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({
   color:0x5bbdc8,metalness:.18,roughness:.48,side:THREE.DoubleSide});});
  const mat=proposal.registration.axisMatrix,t=proposal.registration.motorToFrameTranslationMm;
  const transform=new THREE.Matrix4();
  transform.set(mat[0][0],mat[0][1],mat[0][2],t[0]/1000,
   mat[1][0],mat[1][1],mat[1][2],t[1]/1000,
   mat[2][0],mat[2][1],mat[2][2],t[2]/1000,0,0,0,1);
  motorRoot.matrixAutoUpdate=false;motorRoot.matrix.copy(transform);
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
 }
 function draw(){
  if(dead)return;
  if(!document.hidden&&host.getClientRects().length&&host.clientWidth>1){
   orbit.update();renderer.render(scene,camera);
  }
  raf=requestAnimationFrame(draw);
 }
 draw();
 return {load,dispose(){
  if(dead)return;dead=true;cancelAnimationFrame(raf);observer?.disconnect();
  const geometries=new Set(),materials=new Set();
  models.traverse(o=>{
   if(o.isMesh){if(o.geometry)geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m);}
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  axes.geometry.dispose();axes.material.dispose();
  orbit.dispose();renderer.dispose();renderer.domElement.remove();
 }};
}
