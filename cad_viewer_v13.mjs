/**
 * AeroForge local GLB viewer. Visual only, built from user-verified local package bytes.
 * Preserves raw relative CAD mesh transforms. Never applies FRD/CG registration.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export function createCadPackageViewer(host,onSelect=()=>{}){
 if(!host)throw new Error('CAD host element missing');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#101c24');
 const camera=new THREE.PerspectiveCamera(43,1,0.05,100);
 camera.position.set(3.4,2.5,4.1);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'default'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.4;
 renderer.domElement.setAttribute('aria-label','Interactive GLB CAD model viewer');
 host.querySelector('.cad-v13-empty')?.remove();
 host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.minDistance=.3;controls.maxDistance=20;
 const hemi=new THREE.HemisphereLight(0xe8f8f1,0x38424a,2.1);scene.add(hemi);
 const light=new THREE.DirectionalLight(0xffffff,3.2);light.position.set(5,7,6);scene.add(light);
 const fill=new THREE.DirectionalLight(0x89b8e8,1.2);fill.position.set(-4,3,-3);scene.add(fill);
 const roots=new THREE.Group();scene.add(roots);
 const markers=new THREE.Group();roots.add(markers);
 let parts=[],center=new THREE.Vector3(),extent=1,explode=0,selected=-1,dead=false;
 const ray=new THREE.Raycaster(),xy=new THREE.Vector2();
 const loader=new GLTFLoader();
 function release(){
  const geometry=new Set(),materials=new Set();
  roots.traverse(obj=>{if(!obj.isMesh)return;
   if(obj.geometry)geometry.add(obj.geometry);
   for(const m of (Array.isArray(obj.material)?obj.material:[obj.material]))if(m)materials.add(m);
  });
  geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  roots.clear();roots.add(markers);markers.clear();parts=[];selected=-1;
 }
 function layout(){
  for(const part of parts){
   const dir=part.userData.mid.clone().sub(center);
   if(dir.lengthSq()<1e-10)dir.set(0,1,0);
   dir.normalize();
   const extra=dir.multiplyScalar(extent*.28*explode);
   part.position.copy(part.userData.base).add(extra);
  }
 }
 async function load(buffer){
  const raw=buffer instanceof ArrayBuffer?buffer:buffer.slice().buffer;
  const gltf=await new Promise((resolve,reject)=>loader.parse(raw,'',resolve,reject));
  if(dead)return [];
  release();roots.scale.setScalar(1);roots.position.set(0,0,0);
  gltf.scene.updateMatrixWorld(true);
  const meshes=[];
  gltf.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
  if(!meshes.length||meshes.length>500)throw new Error('CAD GLB must contain 1..500 renderable meshes');
  for(const [i,m] of meshes.entries()){
   const part=new THREE.Group(),clone=m.clone();
   m.matrixWorld.decompose(clone.position,clone.quaternion,clone.scale);
   clone.material=Array.isArray(m.material)?m.material.map(x=>x.clone()):m.material?.clone();
   part.add(clone);part.name='solid-'+String(i).padStart(3,'0');
   part.userData.base=new THREE.Vector3(); // raw mesh world transform is inside clone
   roots.add(part);part.userData.index=i;parts.push(part);
  }
  roots.updateMatrixWorld(true);
  const all=new THREE.Box3().setFromObject(roots);
  if(all.isEmpty())throw new Error('No finite geometry bounds available');
  center=all.getCenter(new THREE.Vector3());
  const size=all.getSize(new THREE.Vector3());
  extent=Math.max(size.x,size.y,size.z);
  if(!Number.isFinite(extent)||extent<=0||extent>1e6)throw new Error('Invalid CAD geometry extent');
  for(const p of parts)p.userData.mid=new THREE.Box3().setFromObject(p).getCenter(new THREE.Vector3());
  const factor=2.5/extent;
  roots.scale.setScalar(factor);
  roots.position.copy(center).multiplyScalar(-factor);
  camera.position.set(3.2,2.4,4.4);controls.target.set(0,0,0);controls.update();
  layout();
  select(-1);
  return parts.map((p,i)=>({id:i,label:meshes[i].name||p.name,
   sourcePartIdentity:'UNREGISTERED_GLTF_MESH',units:'UNVERIFIED_SOURCE_TO_GLTF_METERS'}));
 }
 function setMotorMarkers(rotors){
  for(const o of [...markers.children]){markers.remove(o);o.geometry?.dispose();o.material?.dispose();}
  if(!Array.isArray(rotors)||rotors.length>12)throw new Error('Invalid annotation markers');
  if(!rotors.length)return;
  const material=()=>new THREE.MeshStandardMaterial({color:0xf9c873,emissive:0x75501b,emissiveIntensity:.3});
  const radius=Math.max(.002,extent*.012);
  for(const item of rotors){
   if(!Array.isArray(item.centerKernelMm)||item.centerKernelMm.length!==3||
    item.centerKernelMm.some(x=>typeof x!=='number'||!Number.isFinite(x)))
    throw new Error('Invalid unregistered marker position');
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,16,12),material());
   mesh.position.set(...item.centerKernelMm.map(v=>v*.001));
   mesh.userData.annotationId=item.id;
   markers.add(mesh);
  }
 }
  function setExplode(v){
  if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)throw new Error('Invalid explosion distance');
  explode=v;layout();
 }
 function select(i){
  if(i!==-1&&(!Number.isInteger(i)||i<0||i>=parts.length))throw new Error('Unknown CAD mesh selection');
  selected=i;
  for(const [index,p] of parts.entries())p.traverse(o=>{
   if(!o.isMesh)return;
   const materials=Array.isArray(o.material)?o.material:[o.material];
   for(const m of materials)if(m?.emissive){m.emissive.setHex(index===selected?0x31573e:0);m.emissiveIntensity=index===selected?.6:0;}
  });
  if(i>=0)onSelect(i);
 }
 let down=null;
 function pointerDown(e){down={x:e.clientX,y:e.clientY};}
 function pointerUp(e){
  if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5){down=null;return;}
  down=null;
  const r=renderer.domElement.getBoundingClientRect();
  xy.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(xy,camera);
  for(const h of ray.intersectObjects(roots.children,true)){
   let o=h.object;while(o&&!parts.includes(o))o=o.parent;
   const part=parts.find(p=>p===o||p.children.includes(o));
   if(part){select(part.userData.index);break;}
  }
 }
 renderer.domElement.addEventListener('pointerdown',pointerDown);
 renderer.domElement.addEventListener('pointerup',pointerUp);
 const resize=()=>{
  if(dead)return;
  const width=Math.max(host.clientWidth,240),height=Math.max(host.clientHeight,270);
  camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
 };
 const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;ro?.observe(host);resize();
 let raf=0;
 const render=()=>{if(dead)return;controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(render);};
 raf=requestAnimationFrame(render);
 return{load,select,setExplode,setMotorMarkers,dispose(){
  if(dead)return;dead=true;cancelAnimationFrame(raf);
  renderer.domElement.removeEventListener('pointerdown',pointerDown);
  renderer.domElement.removeEventListener('pointerup',pointerUp);
  ro?.disconnect();controls.dispose();release();renderer.dispose();renderer.domElement.remove();
 }};
}
