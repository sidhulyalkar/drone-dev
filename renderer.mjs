import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
export function makeDroneViewer(host){
 const scene=new THREE.Scene();scene.fog=new THREE.FogExp2('#101d27',0.043);
 const camera=new THREE.PerspectiveCamera(39,1,.05,120);camera.position.set(5.6,4.5,6.2);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xd6f9ff,0x193543,2.0));
 const key=new THREE.DirectionalLight(0xfff8df,3.3);key.position.set(-4,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
 const fill=new THREE.DirectionalLight(0x72d2dc,1.0);fill.position.set(4,1,-5);scene.add(fill);
 const grid=new THREE.GridHelper(17,36,0x2a4751,0x1d343f);grid.position.y=-.48;grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
 const stageRing=new THREE.Mesh(new THREE.RingGeometry(1.7,1.72,90),new THREE.MeshBasicMaterial({color:0x547b7f,transparent:true,opacity:.23,side:THREE.DoubleSide}));stageRing.rotation.x=-Math.PI/2;stageRing.position.y=-.475;scene.add(stageRing);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=2.6;controls.maxDistance=16;controls.enablePan=false;controls.maxPolarAngle=Math.PI*.48;controls.target.set(0,.07,0);
 const group=new THREE.Group();scene.add(group);let props=[];let spinning=false;let exploded=false;let active='orbit';let lastTime=0;
 const metal=new THREE.MeshStandardMaterial({color:0x34434d,roughness:.42,metalness:.65});
 const carbon=new THREE.MeshStandardMaterial({color:0x1d2931,roughness:.72,metalness:.14});
 const motorMat=new THREE.MeshStandardMaterial({color:0x899da7,roughness:.25,metalness:.8});
 const edge=new THREE.MeshStandardMaterial({color:0xcee9a1,roughness:.4,metalness:.5});
 function box(parent,w,h,d,material,x,y,z,offset=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);mesh.userData.baseY=y;mesh.userData.offset=offset;return mesh;}
 function cylinder(parent,r1,r2,height,material,x,y,z,offset=0){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,height,26),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);mesh.userData.baseY=y;mesh.userData.offset=offset;return mesh;}
 function beam(parent,start,end,thickness,material){let midpoint=new THREE.Vector3().addVectors(start,end).multiplyScalar(.5);const delta=new THREE.Vector3().subVectors(end,start);const obj=new THREE.Mesh(new THREE.BoxGeometry(thickness,thickness*.8,delta.length()),material);obj.position.copy(midpoint);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),delta.clone().normalize());obj.castShadow=true;parent.add(obj);obj.userData.baseY=midpoint.y;obj.userData.offset=0;return obj;}
 function resetModel(result){
  while(group.children.length){const obj=group.children[0];group.remove(obj);obj.traverse(v=>{v.geometry?.dispose();if(v.material&&!([carbon,metal,motorMat,edge].includes(v.material)))v.material.dispose?.()})}
  props=[];
  const {frame,prop,battery,video}=result.parts;
  const armR=frame.wheelbase/200;const propR=prop.size*.0254/2*10;
  const accent=new THREE.MeshStandardMaterial({color:frame.color,metalness:.45,roughness:.35});
  const propMat=new THREE.MeshStandardMaterial({color:frame.color,roughness:.42,metalness:.25,transparent:true,opacity:.85,side:THREE.DoubleSide});
  box(group,1.02,.09,.85,carbon,0,-.02,0,0);
  box(group,.92,.045,.70,accent,0,.18,0,.38);
  box(group,.76,.08,.57,metal,0,.075,0,.1);
  box(group,.63,.02,.48,edge,0,.23,0,.5);
  for(let i=0;i<4;i++){
   const a=Math.PI/4+i*Math.PI/2;const x=armR*Math.cos(a),z=armR*Math.sin(a);
   beam(group,new THREE.Vector3(.28*Math.cos(a),-.08,.28*Math.sin(a)),new THREE.Vector3(x,-.08,z),.16,carbon);
   beam(group,new THREE.Vector3(.32*Math.cos(a),-.035,.32*Math.sin(a)),new THREE.Vector3(x,-.035,z),.055,accent);
   cylinder(group,.13,.13,.12,motorMat,x,.105,z,.28);
   cylinder(group,.105,.11,.10,metal,x,.188,z,.28);
   const hub=new THREE.Group();hub.position.set(x,.265,z);hub.userData.baseY=.265;hub.userData.offset=.34;group.add(hub);
   cylinder(hub,.055,.055,.03,edge,0,0,0);
   for(let j=0;j<prop.blades;j++){
    const blade=new THREE.Mesh(new THREE.BoxGeometry(propR*.90,.018,propR*.18),propMat);blade.position.x=propR*.42;blade.rotation.y=j*2*Math.PI/prop.blades; // center + offset rotate around hub
    const pivot=new THREE.Group();pivot.rotation.y=j*2*Math.PI/prop.blades;blade.rotation.y=0;pivot.add(blade);hub.add(pivot);
   }
   const disk=new THREE.Mesh(new THREE.RingGeometry(propR*.94,propR*.95,64),new THREE.MeshBasicMaterial({color:frame.color,transparent:true,opacity:.2,side:THREE.DoubleSide}));disk.rotation.x=-Math.PI/2;hub.add(disk);props.push(hub);
   if(frame.protected){const guard=new THREE.Mesh(new THREE.TorusGeometry(propR*1.02,.06,9,52),carbon);guard.rotation.x=Math.PI/2;guard.position.set(x,.08,z);guard.userData.baseY=.08;guard.userData.offset=.22;group.add(guard)}
   cylinder(group,.043,.043,.022,new THREE.MeshBasicMaterial({color:(i%2===0?0xaaffbb:0xffaa8a)}),x,-.16,z);
  }
  const batteryLength=clamp(.6+battery.capacity/4500,.67,1.4);box(group,.48,.22,batteryLength,new THREE.MeshStandardMaterial({color:0x465868,roughness:.8}),0,.40,.01,.8);
  box(group,.50,.01,.10,edge,0,.525,.04,.8);
  box(group,.26,.15,.29,carbon,0,.115,-.61,.21);
  const lens=cylinder(group,.105,.105,.04,metal,0,.12,-.78,.21);lens.rotation.x=Math.PI/2;
  const eye=cylinder(group,.055,.055,.048,new THREE.MeshStandardMaterial({color:0x71c9df,metalness:.2,roughness:.15}),0,.12,-.81,.21);eye.rotation.x=Math.PI/2;
  const antenna=new THREE.Group();antenna.position.set(0,.24,.52);antenna.userData.baseY=.24;antenna.userData.offset=.65;group.add(antenna);
  beam(antenna,new THREE.Vector3(0,0,0),new THREE.Vector3(0,.51,.35),.045,motorMat);cylinder(antenna,.06,.06,.18,carbon,0,.53,.36);
  if(result.settings.payload>0){const payloadMat=new THREE.MeshStandardMaterial({color:0xb4a1da,metalness:.34,roughness:.42});box(group,.42,.15,.38,payloadMat,0,-.22,0,-.25);}
  const centerDot=cylinder(group,.09,.09,.028,edge,0,.26,0,.65);
  if(exploded)applyExplosion();
 }
 function applyExplosion(){group.traverse(c=>{if(c!==group&&c.userData.baseY!==undefined)c.position.y=c.userData.baseY+(exploded?(c.userData.offset||0):0)})}
 function setView(mode){active=mode;if(mode==='top')camera.position.set(.001,8.4,.001);else camera.position.set(5.6,4.5,6.2);controls.target.set(0,.05,0);controls.update()}
 const resizeObserver=new ResizeObserver(()=>resize());resizeObserver.observe(host);
 function resize(){let w=host.clientWidth||700,h=host.clientHeight||400;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}resize();
 let run=true;function animate(now){if(!run)return;requestAnimationFrame(animate);const dt=Math.min(.05,(now-lastTime)/1000||0);lastTime=now;if(spinning)for(const p of props)p.rotation.y+=dt*23;controls.update();renderer.render(scene,camera)}requestAnimationFrame(animate);
 return {update:resetModel,setView,toggleExplosion(){exploded=!exploded;applyExplosion();return exploded},toggleSpin(){spinning=!spinning;return spinning},dispose(){run=false;resizeObserver.disconnect();controls.dispose();renderer.dispose();renderer.domElement.remove()}};
}
