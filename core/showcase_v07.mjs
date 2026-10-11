/** Exploded Showcase v0.7: deterministic geometry descriptors, not manufacturing CAD. */
export const GEOMETRY_AUTHORITY = 'ILLUSTRATIVE_NOT_CAD_VERIFIED';
export const SUBSYSTEMS = Object.freeze([
  {id:'all',label:'All systems'},
  {id:'structure',label:'Airframe'},
  {id:'propulsion',label:'Propulsion'},
  {id:'control',label:'Flight controls'},
  {id:'power',label:'Power & wiring'},
  {id:'sensing',label:'Sensing / FPV'},
  {id:'payload',label:'Payload'}
]);
const finite=(x,name)=>{if(typeof x!=='number'||!Number.isFinite(x))throw Error('Invalid '+name);return x};
const rounded=(x)=>Math.round(x*1e5)/1e5;
const part=(id,name,subsystem,anchor,explode,description,specs,order)=>({
  id,name,subsystem,anchor:anchor.map(x=>rounded(finite(x,'anchor'))),
  explode:explode.map(x=>rounded(finite(x,'explode'))),description,specs,order,
  geometryAuthority:GEOMETRY_AUTHORITY,
  evidenceStatus:'ILLUSTRATIVE_CATALOG',
  revisionStatus:'UNVERIFIED_CLASS_NOT_SKU'
});
/** Camera units are 1/100th of a mm; no dimensions can be promoted to manufacturer CAD. */
export function buildShowcaseManifest(result){
 if(!result?.parts?.frame||!result.parts.motor||!result.parts.prop||!result.parts.battery||!result.parts.stack||!result.parts.video)throw Error('Incomplete design result');
 const {frame,motor,prop,battery,stack,video}=result.parts;
 const radius=finite(frame.wheelbase,'wheelbase')/200, arm=radius/Math.SQRT2;
 const propR=finite(prop.size,'prop size')*25.4/200;
 const scale=Math.max(.68,Math.min(1.4,radius/1.15));
 const items=[];
 const add=(...args)=>items.push(part(...args));
 add('frame','Carbon-frame structure','structure',[0,-.06,0],[0,-.64,0],
   'Main plates, arms, landing/mounting area, fasteners. Shape is procedural, not an imported frame mesh.',
   [['Wheelbase',frame.wheelbase+' mm'],['Frame class',frame.class],['Declared mount',frame.mount+' mm']],0);
 add('canopy','Upper mounting plate','structure',[0,.19,0],[0,1.07,0],
   'Upper carbon plate with four stand-offs. No exact thickness or hole placement has been validated.',
   [['Type','Illustrative carbon plate']],1);
 add('stack','Flight-controller and ESC stack','control',[0,.09,0],[0,.38,.84],
   'Control board, mounting pads and standoffs. Firmware support is derived from the illustrative catalog, not a confirmed flight-controller SKU.',
   [['Selected',stack.name],['Mount',stack.mount+' mm'],['Firmware',stack.firmware.join(' / ')]],2);
 add('pdb','Power distribution','power',[0,-.14,0],[.65,-.42,.16],
   'Battery distribution and ESC power feeds; routing and pinout are schematic, not a harness drawing.',
   [['Battery connector',battery.connector]],3);
 for(let i=0;i<4;i++){
   const sx=(i===0||i===3)?1:-1,sz=i<2?-1:1;
   const ax=sx*arm, az=sz*arm;
   const dir=[sx/Math.SQRT2,sz/Math.SQRT2];
   add('esc-'+i,'ESC '+(i+1),'propulsion',[ax*.68,-.015,az*.68],[dir[0]*.78,-.18,dir[1]*.78],
    'Motor speed controller on an arm. Electrical limits and harness fit must be established for the actual selected SKU.',
    [['Configuration',stack.name],['Output class',stack.escA+' A']],4+i);
   add('motor-'+i,'Brushless motor '+(i+1),'propulsion',[ax,.11,az],[dir[0]*.9,.38,dir[1]*.9],
    'Bell, shaft, stator and mounting interface. Procedural grooves represent anatomy, not manufacturing dimensions.',
    [['Selected',motor.name],['KV',String(motor.kv)],['Mount',motor.mount+' mm']],8+i);
   add('prop-'+i,'Propeller '+(i+1),'propulsion',[ax,.29,az],[dir[0]*1.2,.98,dir[1]*1.2],
    'Blade hub and aerofoil approximations for orientation only. This does not establish propeller clearance or actual thrust.',
    [['Diameter',prop.size+' in'],['Blades',String(prop.blades)],['Procedural radius',propR.toFixed(3)+' scene units']],12+i);
 }
 add('battery','Battery pack','power',[0,.39,.08],[0,1.56,.18],
   'Energy storage and restraint straps. Battery geometry and connector are catalog-class proxies.',
   [['Selected',battery.name],['Capacity',battery.capacity+' mAh'],['Connector',battery.connector]],16);
 add('camera','FPV / research camera','sensing',[0,.1,-.55],[0,.28,-1.15],
   'Camera/lens housing and imaging path. Video dimensions and exact mounting envelope are unverified.',
   [['Selected',video.name],['Voltage',video.voltage+' V']],17);
 add('antenna','Radio antenna','sensing',[0,.3,.57],[0,.95,1.05],
   'Antenna and mast representation. Radio frequencies, connector and gain are not sourced.',
   [['Type','Unverified antenna class']],18);
 add('harness','Power / signal harness','power',[0,-.055,0],[-.78,-.55,-.32],
   'Schematic colored leads suggest relationships only; no polarity, crimp, wire gauge or routing has been approved.',
   [['Status','Non-authoritative visual']],19);
 if(result.settings?.payload>0)add('payload','Auxiliary payload','payload',[0,-.28,.02],[0,-1.02,.36],
  'Additional sensor or companion-computer mass. Size is a generic placeholder unrelated to the user-entered payload mass.',
  [['User-added mass',result.settings.payload+' g']],20);
 const ids=new Set(items.map(x=>x.id));if(ids.size!==items.length)throw Error('Duplicate part ID');
 return {schema:'aeroforge/showcase/v0.7',authority:GEOMETRY_AUTHORITY,
  airframe:{name:frame.name,wheelbaseMm:frame.wheelbase,propDiameterIn:prop.size,protected:frame.protected,color:frame.color,radius,propRadius:propR,scale},
  parts:items.sort((a,b)=>a.order-b.order),note:'Procedural educational visualization. Components are class-level approximations, not exact CAD, verified placements, BOM SKUs, or airworthy assemblies.'};
}
export const TOUR_DURATIONS=Object.freeze({intro:2.0,inspect:3.3,exit:1.6});
export function createTourController(parts,onUpdate=()=>{}){
 if(!Array.isArray(parts)||!parts.length||parts.some(p=>!p.id))throw Error('Expected nonempty part list');
 let ids=parts.map(p=>p.id), index=0, t=0, phase='idle', mode='assembled', playing=false,speed=1,filter='all';
 const emit=()=>onUpdate(api.getState());
 const visible=()=>filter==='all'?parts:parts.filter(p=>p.subsystem===filter);
 const clampIndex=(n)=>Math.max(0,Math.min(visible().length-1,n));
 const api={
  getState(){return {mode,phase,playing,speed,filter,partId:mode==='assembled'||mode==='exploded'||phase==='intro'?null:visible()[index]?.id??null,
   currentIndex:index,total:visible().length,elapsed:t,exploded:mode!=='assembled'};},
  play(){if(mode==='assembled'||mode==='exploded'||phase==='idle'||phase==='outro'){mode='tour';phase='intro';t=0;index=0;}playing=true;emit();return api.getState();},
  pause(){playing=false;emit();return api.getState();},
  toggle(){return playing?api.pause():api.play();},
  select(id){if(!parts.some(p=>p.id===id))throw Error('Unknown showcase part '+id);const match=visible().findIndex(p=>p.id===id);if(match<0){filter='all';index=parts.findIndex(p=>p.id===id)}else index=match;mode='focus';phase='inspect';t=0;playing=false;emit();return api.getState();},
  step(delta){if(!Number.isInteger(delta))throw Error('Step must be integer');index=clampIndex(index+delta);mode='focus';phase='inspect';t=0;playing=false;emit();return api.getState();},
  setFilter(next){if(!SUBSYSTEMS.some(s=>s.id===next))throw Error('Unknown subsystem');filter=next;index=0;mode='exploded';playing=false;phase='idle';t=0;emit();return api.getState();},
  setSpeed(v){if(!Number.isFinite(v)||v<.5||v>2)throw Error('Speed out of range');speed=v;emit();return api.getState();},
  explode(){mode='exploded';phase='idle';playing=false;t=0;emit();return api.getState();},
  assemble(){mode='assembled';phase='idle';playing=false;t=0;emit();return api.getState();},
  tick(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid dt');if(!playing)return api.getState();let remains=Math.min(dt,.25)*speed,steps=0,changed=false;
   while(remains>0&&playing&&steps++<8){const duration=TOUR_DURATIONS[phase];const left=Math.max(0,duration-t);const used=Math.min(left,remains);t+=used;remains-=used;
    if(t+1e-8>=duration){t=0;changed=true;if(phase==='intro'){phase='inspect';}else if(phase==='inspect'){phase='exit';}else if(index<visible().length-1){index++;phase='inspect';}else{mode='assembled';phase='idle';playing=false;} }
    if(used===0&&!changed)break;
   }if(changed)emit();return api.getState();}
 };
 return api;
}
