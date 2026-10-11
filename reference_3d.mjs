import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
let active=null;
export async function loadReferenceGLB(host,file,status){
 if(active){active.dispose();active=null}
 const url=URL.createObjectURL(file);let model;
 try{model=await new GLTFLoader().loadAsync(url)}finally{URL.revokeObjectURL(url)}
 const sc=new THREE.Scene();sc.background=new THREE.Color('#0e1a24');
 sc.add(new THREE.HemisphereLight('#d9f2fc','#162530',2.6));const key=new THREE.DirectionalLight('#ffffff',2);key.position.set(3,5,6);sc.add(key);
 const object=model.scene;sc.add(object);const bounds=new THREE.Box3().setFromObject(object);if(bounds.isEmpty())throw Error('GLB contains no inspectable geometry');
 const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());if(!Number.isFinite(size.x+size.y+size.z))throw Error('Geometry bounds invalid');
 const radius=Math.max(size.x,size.y,size.z);if(radius<=0)throw Error('Zero-size geometry');object.position.sub(center);
 const camera=new THREE.PerspectiveCamera(40,1,.0001,Math.max(100,radius*100));camera.position.set(radius*1.35,radius*.85,radius*1.4);camera.lookAt(0,0,0);
 const gl=new THREE.WebGLRenderer({antialias:true});gl.setPixelRatio(Math.min(2,devicePixelRatio||1));gl.outputColorSpace=THREE.SRGBColorSpace;host.replaceChildren(gl.domElement);
 const controls=new OrbitControls(camera,gl.domElement);controls.enableDamping=true;controls.minDistance=radius*.4;controls.maxDistance=radius*15;
 let live=true;const resize=()=>{if(!live)return;const w=host.clientWidth||500,h=host.clientHeight||320;camera.aspect=w/h;camera.updateProjectionMatrix();gl.setSize(w,h,false)};resize();const ro=new ResizeObserver(resize);ro.observe(host);
 function animate(){if(!live)return;requestAnimationFrame(animate);controls.update();gl.render(sc,camera)}animate();
 status.textContent=`Loaded ${file.name}; raw bounding box ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)} model units. Source/revision, axes, part placement and units NOT independently verified.`;
 active={dispose(){live=false;ro.disconnect();controls.dispose();gl.dispose();host.replaceChildren();sc.traverse(o=>o.geometry?.dispose?.())}};
}
