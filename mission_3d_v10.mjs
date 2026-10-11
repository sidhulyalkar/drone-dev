/**
 * Educational v1.0 3D mission visualization.
 * Procedural dimensions are arbitrary illustration units, not physical CAD or fit evidence.
 * Requires Three.js from the application's existing import map; gracefully optional in UI.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const COLORS={airframe:0x9cc5bd,autopilot:0x85b6b7,propulsion:0xc4dc9b,navigation:0xa9d5fc,
 imaging:0xf3c78b,sensing:0xe0b0e9,compute:0x8ab9e2,power:0xf3b879,
 safety:0xcbe39a,comms:0xbdc1ff,software:0xa2c9a5,payload:0xf1d7b6};
const mat=(color,metalness=.15,roughness=.6,transparent=false,opacity=1)=>
 new THREE.MeshStandardMaterial({color,metalness,roughness,transparent,opacity,side:THREE.DoubleSide});
const pos=a=>new THREE.Vector3(...a);
function cylinderBetween(a,b,r,material){
 const A=pos(a),B=pos(b),vec=B.clone().sub(A),len=vec.length();
 const obj=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),material);
 obj.position.copy(A.add(B).multiplyScalar(.5));
 obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());
 return obj;
}
function buildNode(node,topology,root){
 const group=new THREE.Group();group.name=node.id;group.userData.nodeId=node.id;
 const add=(geo,m,xyz=[0,0,0],rot=null)=>{
  const mesh=new THREE.Mesh(geo,m);mesh.position.set(...xyz);if(rot)mesh.rotation.set(...rot);
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.nodeId=node.id;group.add(mesh);return mesh;
 };
 const graphite=mat(0x28434e,.45,.45),accent=mat(0xaaccb9,.65,.32),
  cobalt=mat(0x89a7ac,.55,.35);
 if(node.kind==='frame'){
  add(new THREE.BoxGeometry(.65,.085,.65),graphite,[0,-.01,0]);
  add(new THREE.BoxGeometry(.51,.07,.49),accent,[0,.19,0]);
  for(const x of [-.25,.25])for(const z of [-.25,.25])
   add(new THREE.CylinderGeometry(.035,.035,.28,10),cobalt,[x,.08,z]);
 }else if(node.kind==='rotor'){
  add(new THREE.CylinderGeometry(.13,.15,.19,26),mat(0x526974,.72,.33),[0,.055,0]);
  add(new THREE.CylinderGeometry(.032,.032,.13,18),accent,[0,.19,0]);
  for(const sign of [-1,1]){
   add(new THREE.BoxGeometry(.55,.021,.09),mat(0xbcd1b4,.28,.48,true,.80),
   [sign*.23,.25,0],[0,sign*.16,sign*.20]);
  }
  root.add(cylinderBetween([0,-.06,0],node.position,.052,graphite));
 }else if(node.kind==='guard'){
  const rim=add(new THREE.TorusGeometry(node.radiusNormalized||.49,.043,9,40),
  mat(0x7cccc2,.3,.46,true,.75),[0,.19,0],[-Math.PI/2,0,0]);
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2;
   const x=Math.cos(angle)*.43,z=Math.sin(angle)*.43;
   group.add(cylinderBetween([x,.18,z],[0,.18,0],.025,graphite));
  }
 }else if(node.kind==='wing'){
  add(new THREE.BoxGeometry(3.10,.075,.38),mat(0x4b7181,.35,.58),[0,.03,0]);
  add(new THREE.BoxGeometry(1.52,.08,.18),mat(0x7292a0,.32,.55),[0,.1,.64]);
  add(new THREE.BoxGeometry(.07,.36,.45),mat(0x9abec5),[0,.18,.88]);
 }else if(node.kind==='cruise'){
  add(new THREE.CylinderGeometry(.11,.14,.27,20),accent,[0,.03,0],[Math.PI/2,0,0]);
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3;
   const blade=add(new THREE.BoxGeometry(.43,.05,.075),mat(0xc3deb2,.23,.46),
   [Math.cos(a)*.19,Math.sin(a)*.19,.16],[0,0,a]);
  }
 }else if(node.kind==='module'){
  const color=COLORS[node.category]||0xbcd9bc;
  const m=mat(color,.35,.38),dark=mat(0x1b3039,.25,.55);
  const dims=node.category==='imaging'?[.27,.19,.25]:
    node.category==='sensing'?[.23,.16,.25]:node.category==='compute'?[.33,.10,.28]:
    node.category==='autopilot'?[.33,.09,.32]:node.category==='power'?[.38,.21,.29]:
    [.27,.18,.22];
  add(new THREE.BoxGeometry(...dims),m,[0,.08,0]);
  add(new THREE.BoxGeometry(dims[0]*.60,.025,dims[2]*.63),dark,[0,.08+dims[1]/2,0]);
  if(node.category==='imaging'||node.category==='sensing')
    add(new THREE.CylinderGeometry(.07,.08,.065,20),mat(0x8bd9eb,.75,.2),[0,.075+dims[1]/2,-dims[2]/2-.014],[Math.PI/2,0,0]);
  if(node.category==='comms'||node.category==='navigation')
    add(new THREE.CylinderGeometry(.012,.014,.26,9),m,[0,.25,0]);
 }
 group.position.set(...node.position);
 root.add(group);
 return group;
}
export function createMissionSceneViewer(host,onSelect){
 if(!host||typeof onSelect!=='function')throw Error('Missing viewport or callback');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1e27');
 scene.fog=new THREE.Fog('#0c1e27',7,14);
 const camera=new THREE.PerspectiveCamera(39,1,.08,80);
 camera.position.set(3.25,2.85,4.2);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.3;
 host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=1.3;controls.maxDistance=10;
 controls.maxPolarAngle=Math.PI*.88;
 const ambient=new THREE.HemisphereLight(0xdff8f5,0x283f4d,2.4);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xf4edda,3.1);key.position.set(4,7,5);scene.add(key);
 const fill=new THREE.DirectionalLight(0x7daeda,1.2);fill.position.set(-4,2,-4);scene.add(fill);
 const grid=new THREE.GridHelper(7,22,0x3e6871,0x203a48);grid.position.y=-.8;scene.add(grid);
 const assembly=new THREE.Group();scene.add(assembly);
 let current=null,groups=new Map(),selected=null,focusTime=0,explosion=0,disposed=false;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const targetCamera=new THREE.Vector3(3.25,2.85,4.2);
 const focus=new THREE.Vector3();
 
 function clear(){
  const geometry=new Set(),materials=new Set();
  assembly.traverse(object=>{
   if(object.isMesh){if(object.geometry)geometry.add(object.geometry);
    const mats=Array.isArray(object.material)?object.material:[object.material];
    for(const m of mats)if(m)materials.add(m);
   }
  });
  geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  assembly.clear();groups.clear();
 }
 function setScene(next){
  if(next?.schema!=='aeroforge/mission-scene/v1.0')throw Error('Scene contract mismatch');
  clear();current=next;selected=null;
  // Add frame before arms, then rotors and visible modules.
  for(const node of next.nodes)groups.set(node.id,buildNode(node,next.topology,assembly));
  targetCamera.set(3.45,2.8,4.25);focus.set(0,0,0);controls.target.set(0,0,0);camera.position.copy(targetCamera);
  controls.update();
  setExplosion(explosion);
 }
 function setExplosion(x){
  if(!Number.isFinite(x)||x<0||x>1)throw Error('Separation must be between 0 and 1');
  explosion=x;
  if(!current)return;
  for(const n of current.nodes){
   const group=groups.get(n.id);if(!group)continue;
   const dir=pos(n.position);
   if(dir.lengthSq()<.02)dir.set(0,n.kind==='wing'?-1:1,0);
   dir.normalize();const dist=n.kind==='module'?.95:n.kind==='wing'?.48:n.kind==='rotor'?.52:.25;
   group.userData.assembled=pos(n.position);group.userData.exploded=pos(n.position).addScaledVector(dir,dist*x);
  }
 }
 function selectPart(id){
  if(id!==null&&!groups.has(id))throw Error('Unknown scene part');
  selected=id;
  if(id){
   focusTime=1.35;
   const n=current.nodes.find(n=>n.id===id);
   focus.copy(pos(n.position));targetCamera.copy(focus).add(new THREE.Vector3(1.3,1.1,1.7));
  }else{focusTime=0;focus.set(0,0,0);targetCamera.set(3.45,2.8,4.25);controls.target.set(0,0,0);camera.position.copy(targetCamera);controls.update();}
 }
 let pointerDown=null;
 function onDown(e){focusTime=0;pointerDown={x:e.clientX,y:e.clientY};}
 function onUp(e){
  if(!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>6){pointerDown=null;return;}
  pointerDown=null;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(assembly.children,true);
  for(const hit of hits){let obj=hit.object;while(obj&&!obj.userData.nodeId)obj=obj.parent;
   if(obj?.userData.nodeId){onSelect(obj.userData.nodeId);return;}
  }
 }
 renderer.domElement.addEventListener('pointerdown',onDown);
 renderer.domElement.addEventListener('pointerup',onUp);
 function resize(){
  if(disposed)return;
  const width=Math.max(250,host.clientWidth),height=Math.max(260,host.clientHeight);
  camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);
 }
 const resizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;
 resizeObserver?.observe(host);resize();
 let req=0,last=0;
 function loop(time){
  if(disposed)return;
  // Do not render hidden workspaces; keep scene and part selection intact.
  if(document.hidden||host.getClientRects().length===0||host.clientWidth<2||host.clientHeight<2){
   last=time;req=requestAnimationFrame(loop);return;
  }
  const dt=Math.min(.08,(time-last)/1000||0);last=time;
  const alpha=1-Math.exp(-dt*6);
  for(const [id,group] of groups){
   const next=group.userData.exploded;if(next)group.position.lerp(next,alpha);
   group.traverse(obj=>{
    if(obj.isMesh&&obj.material?.emissive){
     obj.material.emissive.setHex(id===selected?0x294d3a:0x000000);
     obj.material.emissiveIntensity=id===selected?.58:0;
    }
   });
  }
  if(selected&&focusTime>0){camera.position.lerp(targetCamera,alpha*.8);controls.target.lerp(focus,alpha*.8);focusTime=Math.max(0,focusTime-dt);}
  controls.update();renderer.render(scene,camera);req=requestAnimationFrame(loop);
 }
 req=requestAnimationFrame(loop);
 return {setScene,setExplosion,selectPart,clearSelection:()=>selectPart(null),
  dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(req);
   renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);
   resizeObserver?.disconnect();controls.dispose();clear();
   renderer.dispose();renderer.domElement.remove();
  }};
}
