import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const vec=a=>new THREE.Vector3(...a);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const damp=(rate,dt)=>1-Math.exp(-rate*dt);

/** Part-structured procedural viewer. 1 scene unit ~ 100 mm, never exact CAD. */
export function createShowcaseViewer(host,manifest,onPick=()=>{},onCadPick=()=>{}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1720);scene.fog=new THREE.FogExp2(0x0b1720,.034);
 const camera=new THREE.PerspectiveCamera(38,1,.015,160);
 const gl=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 gl.setPixelRatio(Math.min(devicePixelRatio||1,2));gl.setClearColor(0x0b1720);gl.outputColorSpace=THREE.SRGBColorSpace;
 gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.16;
 gl.shadowMap.enabled=true;gl.shadowMap.type=THREE.PCFSoftShadowMap;
 host.replaceChildren(gl.domElement);gl.domElement.setAttribute('aria-label','Interactive schematic 3D drone. Click a part to inspect.');
 scene.add(new THREE.HemisphereLight(0xd6eeff,0x152a33,2.8));
 const light=new THREE.DirectionalLight(0xfff7df,3.8);light.position.set(-4,9,7);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);
 const rim=new THREE.DirectionalLight(0x6ce0dc,2.6);rim.position.set(5,3,-6);scene.add(rim);
 const table=new THREE.GridHelper(18,36,0x31565d,0x1a3543);table.position.y=-1.35;table.material.transparent=true;table.material.opacity=.30;scene.add(table);
 const ring=new THREE.Mesh(new THREE.RingGeometry(2.4,2.42,128),new THREE.MeshBasicMaterial({color:0x73a99d,transparent:true,opacity:.25,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-1.32;scene.add(ring);
 const aircraft=new THREE.Group();scene.add(aircraft);
 // One WebGL renderer for schematic and local source-derived CAD preview.
 // CAD native units/axes are NOT registered to this illustrative aircraft.
 const cadRoot=new THREE.Group();cadRoot.visible=false;scene.add(cadRoot);
 const cadLoader=new GLTFLoader();
 let cadMeshes=[],cadActive=false,cadSource=null,cadLoadToken=0;
 const controls=new OrbitControls(camera,gl.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=.24;controls.maxDistance=30;controls.enablePan=false;
 const dynamic=new Map();const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 let manifestNow=manifest,live=true,state={mode:'assembled',partId:null,filter:'all',playing:false,phase:'idle'},spinning=false;
 let last=0,sceneTime=0,cameraOverride=false,disposed=false;
 const releaseCad=()=>{
  const geometries=new Set(),materials=new Set(),textures=new Set();
  cadRoot.traverse(o=>{
   if(!o.isMesh)return;
   if(o.geometry)geometries.add(o.geometry);
   for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    if(!m)continue;materials.add(m);
    for(const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])
     if(m[key])textures.add(m[key]);
   }
  });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  cadRoot.clear();cadMeshes=[];cadSource=null;cadActive=false;
  cadRoot.visible=false;aircraft.visible=true;
 };
 function setCadMode(enabled){
  if(enabled&&!cadMeshes.length)throw Error('No locally verified CAD preview has been loaded');
  if(cadActive===!!enabled)return;
  cadActive=!!enabled;cadRoot.visible=cadActive;aircraft.visible=!cadActive;
  if(cadActive){
   controls.target.set(0,0,0);camera.position.set(4.2,2.8,4.9);
   cameraOverride=true;controls.update();
  }else{cameraOverride=false;controls.target.set(0,.1,0);}
 }
 async function loadCadPreview(buffer,identity){
  if(disposed)throw Error('Viewer disposed');
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>90*1024*1024)
   throw Error('Unrecognized CAD preview bytes');
  if(!identity||!/^[a-f0-9]{64}$/.test(identity.meshSha256)||typeof identity.sourceFile!=='string')
   throw Error('Missing exact local CAD source identity');
  // Binary and manifest hashes MUST have been checked by caller immediately before this method.
  const token=++cadLoadToken;
  const imported=await new Promise((resolve,reject)=>cadLoader.parse(buffer,'',resolve,reject));
  if(disposed||token!==cadLoadToken)return [];
  const root=imported.scene;
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  if(bounds.isEmpty())throw Error('Imported CAD model has no usable bounds');
  const extent=bounds.getSize(new THREE.Vector3());
  const size=Math.max(extent.x,extent.y,extent.z);
  if(!Number.isFinite(size)||size<=0||size>1e6)throw Error('CAD model extent is invalid');
  const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
  if(!meshes.length||meshes.length>500)throw Error('CAD model must have 1 to 500 renderable meshes');
  releaseCad();
  const center=bounds.getCenter(new THREE.Vector3());
  const normalized=new THREE.Group();
  normalized.position.copy(center).multiplyScalar(-1);
  cadRoot.scale.setScalar(3/size);cadRoot.add(normalized);
  normalized.add(root);
  const originalMaterials=new Set();
  for(const [index,mesh] of meshes.entries()){
   mesh.userData.cadIndex=index;
   const originals=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   for(const m of originals)if(m)originalMaterials.add(m);
   mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material?.clone();
  }
  originalMaterials.forEach(m=>m.dispose());
  cadMeshes=meshes;cadSource={meshSha256:identity.meshSha256,sourceFile:identity.sourceFile,
   sourceRevision:identity.sourceRevision??'unspecified'};
  cadRoot.visible=cadActive;aircraft.visible=!cadActive;
  return meshes.map((mesh,index)=>({index,name:mesh.name||'CAD solid '+(index+1),
   authority:'SOURCE_DERIVED_BUT_UNREGISTERED'}));
 }
 function clearCadPreview(){cadLoadToken++;releaseCad();}
 function selectCadMesh(index){
  if(!Number.isInteger(index)||index<0||index>=cadMeshes.length)throw Error('Unknown CAD solid');
  for(const [i,mesh] of cadMeshes.entries()){
   for(const mat of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))
    if(mat?.emissive){mat.emissive.setHex(i===index?0x345b45:0x000000);mat.emissiveIntensity=i===index?.55:0;}
  }
 }
 const makeMat=(color,metalness=0.45,roughness=.52)=>new THREE.MeshStandardMaterial({color,metalness,roughness,side:THREE.DoubleSide,transparent:true,opacity:1,emissive:0x000000});
 const carbon=()=>makeMat(0x233641,.33,.65),metal=()=>makeMat(0x97aeb8,.8,.27),pcb=()=>makeMat(0x235f54,.25,.49),accent=()=>makeMat(manifestNow.airframe.color,.4,.36),soft=()=>makeMat(0x2c4454,.3,.68),wire=()=>makeMat(0xd6ab79,.26,.48);
 function mesh(parent,geom,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z)}
 function cyl(parent,rt,rb,height,mat,x=0,y=0,z=0,segments=32){return mesh(parent,new THREE.CylinderGeometry(rt,rb,height,segments),mat,x,y,z)}
 function rod(parent,a,b,r,material){const start=vec(a),end=vec(b),dir=end.clone().sub(start);const m=mesh(parent,new THREE.CylinderGeometry(r,r,dir.length(),10),material);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m}
 function torus(parent,r,t,material,y=0){const m=mesh(parent,new THREE.TorusGeometry(r,t,8,40),material,0,y,0);m.rotation.x=Math.PI/2;return m;}
 function coloredPart(group,kind,id){const r=manifestNow.airframe.radius,pr=manifestNow.airframe.propRadius;
  switch(kind){
   case 'frame':{
    box(group,.89,.075,.92,carbon());box(group,.80,.022,.84,accent(),0,.046,0);
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,x=Math.cos(a)*r,z=Math.sin(a)*r;
     const b=rod(group,[0,-.02,0],[x,-.02,z],.085,carbon());
     rod(group,[0,.018,0],[x,.018,z],.023,accent());
     cyl(group,.12,.12,.026,metal(),x,-.02,z);
    }
    for(const x of [-.32,.32])for(const z of [-.34,.34])cyl(group,.027,.027,.11,metal(),x,.14,z);
    if(manifestNow.airframe.protected){for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,x=Math.cos(a)*r,z=Math.sin(a)*r;const m=torus(group,pr*1.03,.042,carbon());m.position.set(x,.09,z)}}
    break;
   }
   case 'canopy':{
    const top=box(group,.92,.042,.82,carbon());
    for(let x of [-.32,.32])for(let z of [-.34,.34])cyl(group,.038,.038,.016,metal(),x,.029,z);
    box(group,.38,.012,.4,accent(),0,.035,0);break;
   }
   case 'stack':{
    for(let j=0;j<2;j++){const plate=box(group,.44,.035,.47,j===0?pcb():soft(),0,j*.085,0);
     for(let x of [-.155,.155])for(let z of [-.155,.155])cyl(group,.024,.024,.04,metal(),x,j*.085+.03,z);
    }
    for(let x of [-.105,-.05,.05,.105])box(group,.022,.015,.04,metal(),x,.123,-.08);
    box(group,.20,.019,.16,metal(),0,.126,.05);
    break;
   }
   case 'pdb':{
    box(group,.50,.03,.46,pcb());
    box(group,.145,.075,.14,soft(),.2,.07,0);
    for(let x of [-.20,.20])for(let z of [-.15,.15])box(group,.08,.035,.05,wire(),x,.028,z);
    break;
   }
   case 'esc':{
    box(group,.31,.047,.18,soft());box(group,.25,.009,.13,pcb(),0,.029,0);
    for(let x of [-.085,-.028,.028,.085])box(group,.035,.035,.06,metal(),x,.055,0);
    for(let k=0;k<3;k++)rod(group,[-.14,-.01,-.075+k*.075],[-.26,-.012,-.075+k*.075],.012,wire());
    break;
   }
   case 'motor':{
    cyl(group,.145,.155,.12,metal());
    cyl(group,.157,.147,.025,carbon(),0,-.067,0);
    cyl(group,.134,.134,.025,accent(),0,.07,0);
    cyl(group,.021,.021,.105,metal(),0,.122,0);
    for(let k=0;k<12;k++){const a=k*Math.PI/6,x=.149*Math.cos(a),z=.149*Math.sin(a);const groove=box(group,.012,.055,.015,carbon(),x,.008,z);groove.rotation.y=-a;}
    break;
   }
   case 'prop':{
    cyl(group,.067,.07,.034,metal());cyl(group,.030,.033,.044,accent(),0,.026,0);
    const p=manifestNow.parts.find(v=>v.id===id);const bladeCount=Number(p?.specs.find(v=>v[0]==='Blades')?.[1]||3);
    for(let j=0;j<bladeCount;j++){
     const pivot=new THREE.Group();pivot.rotation.y=j*Math.PI*2/bladeCount;group.add(pivot);
     const shape=new THREE.Shape();shape.moveTo(0,-.066);shape.bezierCurveTo(pr*.4,-.15,pr*.9,-.115,pr*.98,-.018);shape.bezierCurveTo(pr*1.01,.01,pr*.89,.075,pr*.75,.10);shape.bezierCurveTo(pr*.32,.15,0,.082,0,-.066);
     const blade=mesh(pivot,new THREE.ShapeGeometry(shape,16),accent(),0,.009,0);blade.rotation.x=-Math.PI/2; // XY shape -> XZ blade
    }
    break;
   }
   case 'battery':{
    const capacity=Number(manifestNow.parts.find(p=>p.id==='battery')?.specs.find(a=>a[0]==='Capacity')?.[1]?.split(' ')[0])||1500;
    const len=clamp(.64+capacity/4500,.76,1.48);
    box(group,.51,.25,len,soft());box(group,.53,.017,.09,carbon(),0,.139,-len*.23);box(group,.53,.017,.09,carbon(),0,.139,len*.23);
    box(group,.27,.055,.13,wire(),.08,.025,-len*.55);rod(group,[.08,.04,-len*.55],[.25,.08,-len*.67],.020,wire());
    break;
   }
   case 'camera':{
    box(group,.34,.24,.33,carbon());const lens=cyl(group,.138,.119,.067,metal(),0,.01,-.19);lens.rotation.x=Math.PI/2;
    const glass=cyl(group,.088,.088,.007,makeMat(0x3ab5d2,.23,.12),0,.01,-.231);glass.rotation.x=Math.PI/2;
    for(let x of [-.18,.18])rod(group,[x,-.10,.13],[x,.14,.13],.019,metal());break;
   }
   case 'antenna':{
    cyl(group,.08,.08,.075,carbon());rod(group,[0,.06,0],[0,.43,.26],.020,metal());
    cyl(group,.062,.038,.15,accent(),0,.45,.275);
    break;
   }
   case 'harness':{
    for(let i=0;i<4;i++){const angle=Math.PI/4+i*Math.PI/2,x=Math.cos(angle)*r*.56,z=Math.sin(angle)*r*.56;
     rod(group,[0,0,0],[x,0,z],.012,i%2===0?wire():makeMat(0xb26968,.2,.55));}
    rod(group,[0,0,0],[.15,.15,.45],.022,wire());break;
   }
   case 'payload':{
    box(group,.48,.22,.43,pcb());box(group,.35,.035,.29,metal(),0,.132,0);
    for(let x of [-.19,.19])for(let z of [-.15,.15])cyl(group,.035,.035,.04,metal(),x,-.13,z);break;
   }
  }
 }
 function typeFromId(id){if(id.startsWith('prop-'))return 'prop';if(id.startsWith('motor-'))return 'motor';if(id.startsWith('esc-'))return 'esc';return id}
 function reset(next){
  // Dispose dynamic geometries and per-mesh materials but retain shared scene infrastructure.
  aircraft.traverse(o=>{if(o===aircraft)return;o.geometry?.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)m.dispose();}});
  aircraft.clear();dynamic.clear();manifestNow=next;
  for(const spec of next.parts){const node=new THREE.Group();node.name=spec.id;node.position.copy(vec(spec.anchor));node.userData.partId=spec.id;aircraft.add(node);coloredPart(node,typeFromId(spec.id),spec.id);
   const mats=[];node.traverse(o=>{if(o.isMesh){o.userData.partId=spec.id;const all=Array.isArray(o.material)?o.material:[o.material];for(const m of all)mats.push({material:m,opacity:m.opacity||1});}});
   dynamic.set(spec.id,{spec,node,mats});
  }
  state={mode:'assembled',partId:null,filter:'all',playing:false,phase:'idle'};
  camera.position.set(next.airframe.radius*3,Math.max(2.3,next.airframe.radius*2),next.airframe.radius*3.7);
  controls.target.set(0,.1,0);controls.update();cameraOverride=false;
 }
 function pointerPick(event){const bounds=gl.domElement.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
  pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;pointer.y=-(event.clientY-bounds.top)/bounds.height*2+1;
  raycaster.setFromCamera(pointer,camera);
  if(cadActive){
   const hit=raycaster.intersectObjects(cadMeshes,false)[0];
   if(hit){const index=hit.object.userData.cadIndex;selectCadMesh(index);onCadPick(index);}
   return;
  }
  const hits=raycaster.intersectObjects([...dynamic.values()].map(d=>d.node),true);
  const id=hits.find(h=>h.object.userData.partId)?.object.userData.partId;
  if(id)onPick(id);
 }
 let down=null;const onDown=e=>{down=[e.clientX,e.clientY]};const onUp=e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5)pointerPick(e);down=null;};
 gl.domElement.addEventListener('pointerdown',onDown);gl.domElement.addEventListener('pointerup',onUp);
 controls.addEventListener('start',()=>{cameraOverride=true;});
 function setState(next){if(next.partId!==state.partId||next.mode!==state.mode)cameraOverride=false;state=next}
 function frame(now){
  if(!live)return;
  requestAnimationFrame(frame);
  // Keep the scene/DOM mounted without rendering GPU frames while the workspace is hidden.
  if(document.hidden||!host.isConnected||host.getClientRects().length===0||
   host.clientWidth<2||host.clientHeight<2){last=now;return;}
  if(cadActive){last=now;controls.update();gl.render(scene,camera);return;}
  let dt=clamp((now-last)/1000||.016,0,.05);last=now;sceneTime+=dt;
  const explosion=state.mode==='assembled'?0:1;
  for(const {spec,node,mats} of dynamic.values()){
   const target=vec(spec.anchor).addScaledVector(vec(spec.explode),explosion);
   node.position.lerp(target,damp(6,dt));
   if(spinning&&spec.id.startsWith('prop-')&&state.mode==='assembled')node.rotation.y+=dt*19;else node.rotation.y*=1-damp(9,dt);
   const isTarget=spec.id===state.partId,isShown=state.filter==='all'||spec.subsystem===state.filter;
   const opacity=state.partId?(isTarget?1:isShown?.20:.07):(isShown?1:.07);
   for(const {material,opacity:base} of mats){material.opacity+=(base*opacity-material.opacity)*damp(8,dt);material.depthWrite=material.opacity>.95;
    if(material.emissive){const to=isTarget?0x24463a:0x000000;material.emissive.lerp(new THREE.Color(to),damp(8,dt));}}
  }
  if(!cameraOverride){let target=new THREE.Vector3(0,.12,0),desired;
   if(state.partId&&dynamic.has(state.partId)){
    const d=dynamic.get(state.partId);target.copy(d.node.position);
    const span=d.spec.id==='frame'?manifestNow.airframe.radius*1.55:d.spec.id.startsWith('prop-')?Math.max(manifestNow.airframe.propRadius*1.25,.5):.45;
    const orbit=state.playing&&state.phase==='inspect'?Math.sin(sceneTime*.55)*.23:0;
    desired=target.clone().add(new THREE.Vector3((1.7+orbit)*span,1.2*span,2.4*span));
   }else{
    const size=manifestNow.airframe.radius;const k=state.mode==='assembled'?3.3:4.25;
    desired=new THREE.Vector3(k*size,2.4*size,k*1.06*size);
   }
   const f=damp(state.mode==='assembled'?3.5:4.6,dt);
   controls.target.lerp(target,f);camera.position.lerp(desired,f);
  }
  controls.update();gl.render(scene,camera);
 }
 const ro=new ResizeObserver(()=>{
  if(!host.clientWidth||!host.clientHeight)return;
  const width=host.clientWidth,height=host.clientHeight;
  camera.aspect=width/height;camera.updateProjectionMatrix();gl.setSize(width,height,false);
 });ro.observe(host);
 reset(manifest);requestAnimationFrame(frame);
 return {setManifest:reset,setState,setCadMode,loadCadPreview,clearCadPreview,selectCadMesh,
  getCadMeshes(){return cadMeshes.map((m,index)=>({index,name:m.name||'CAD solid '+(index+1)}));},
  getCadIdentity(){return cadSource?{...cadSource}:null;},
  setSpin(v){spinning=!!v},resetCamera(){cameraOverride=false},getPartIds(){return [...dynamic.keys()]},dispose(){if(disposed)return;disposed=true;live=false;ro.disconnect();releaseCad();controls.dispose();gl.domElement.removeEventListener('pointerdown',onDown);gl.domElement.removeEventListener('pointerup',onUp);aircraft.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose();}});table.geometry.dispose();table.material.dispose();ring.geometry.dispose();ring.material.dispose();gl.dispose();gl.domElement.remove()}};
}
