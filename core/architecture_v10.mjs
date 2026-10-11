/**
 * AeroForge v1.0 mission scene and assembly handoff.
 * All positions are NORMALIZED STORYBOARD coordinates, NOT distances.
 * Never use geometry, empty dimension fields or worklist as a power/flight approval.
 */
import {analyzeMission,MODULE_BY_ID} from './mission_lab_v09.mjs';
export const SCENE_AUTHORITY='NORMALIZED_ILLUSTRATIVE_PLACEMENT_NOT_CAD';
export const REQUIRED_MEASUREMENTS=Object.freeze([
 'sku','revision','sourceUrl','mountPatternMm','envelopeMm','massG',
 'supplyVoltageV','peakCurrentA','connectorId','pinoutSourceUrl',
 'thermalDissipationW','measuredPositionM','testEvidence'
]);
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
const round=(n)=>Math.round(n*10000)/10000;
const mk=(id,kind,label,position,extra={})=>({
 id,kind,label,position:position.map(round),authority:SCENE_AUTHORITY,...extra
});
const LAYOUT_SLOTS=Object.freeze({
 nose:[0,.02,-.68],belly:[0,-.33,0],top:[0,.37,0],
 rear:[0,.1,.73],left:[-.53,.04,0],right:[.53,.04,0],
 frontLeft:[-.43,.05,-.47],frontRight:[.43,.05,-.47],
 aftLeft:[-.43,.05,.47],aftRight:[.43,.05,.47],
 mast:[0,.72,.3],center:[0,.06,0]
});
const physical=(cat)=>!['software'].includes(cat);
const priority={
 imaging:['nose','belly','frontLeft','frontRight','top'],
 sensing:['nose','belly','frontRight','left','right','mast','frontLeft'],
 navigation:['mast','top','rear','center'],autopilot:['center','top'],
 compute:['top','belly','center'],comms:['rear','mast','top'],
 power:['belly','center','rear'],payload:['belly','left','right','rear'],
 safety:['rear','top','left','right'],
 airframe:[],propulsion:[]
};
function geometry(topology){
 const isHex=topology==='hex',isVTOL=topology==='vtol';
 const angles=isHex?Array.from({length:6},(_,i)=>i*Math.PI/3-Math.PI/6):[Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4];
 const radius=isHex?1.2:1.05;
 const rotors=angles.map((r,i)=>mk('rotor-'+i,'rotor','Rotor '+(i+1),[Math.sin(r)*radius,.12,Math.cos(r)*radius],{
  role:isVTOL?'HOVER_ROTOR_HYPOTHESIS':'MULTICOPTER_ROTOR_HYPOTHESIS',
  radiusNormalized:isHex ? 0.41 : (isVTOL ? 0.37 : 0.4)
 }));
 const main=[mk('primary-frame','frame','Reference fuselage',[0,0,0],{topology})];
 if(isVTOL)main.push(mk('main-wing','wing','Conceptual fixed wing',[0,0,0],{spanNormalized:3.15}),mk('pusher-concept','cruise','Conceptual forward propulsion',[0,.04,.97]));
 if(topology==='guarded-quad')for(const r of rotors)main.push(mk('guard-'+r.id,'guard','Guard for '+r.label,r.position,{radiusNormalized:.49}));
 return {rotors,structural:main};
}
/** Returns stable, inspectable scene descriptors; no measured fit/collision authority. */
export function buildMissionScene(scenarioId,optional=[]){
 const report=analyzeMission(scenarioId,optional);
 const {rotors,structural}=geometry(report.concept.topology);
 const nodes=[...structural,...rotors];
 const holds=[];
 const used=new Map();
 const mountAlloc=[];
 for(const m of report.modules){
  // Frame and propulsion are represented by the scene's structural/rotor proxies.
  if(['airframe','propulsion'].includes(m.category)){
   mountAlloc.push({moduleId:m.id,slot:'structure-system',state:'ILLUSTRATIVE_TOPOLOGY_ONLY',position:null});
   continue;
  }
  if(!physical(m.category)){
   mountAlloc.push({moduleId:m.id,slot:'software-no-geometry',state:'SOFTWARE_ONLY',position:null});
   continue;
  }
  const options=priority[m.category]||['belly','top','rear'];
  const free=options.find(k=>!used.has(k));
  const selected=free||null;
  if(!selected){
   mountAlloc.push({moduleId:m.id,slot:null,state:'UNASSIGNED_CAPACITY_HOLD',position:null});
   holds.push({code:'MOUNT_SLOT_EXHAUSTED',moduleId:m.id,detail:'Illustrative mounts exhausted; choose a larger frame or a qualified bracket.'});
   continue;
  }
  used.set(selected,m.id);
  const pos=LAYOUT_SLOTS[selected];
  mountAlloc.push({moduleId:m.id,slot:selected,state:'ILLUSTRATIVE_ASSIGNED_NOT_FIT_CHECKED',position:[...pos]});
  nodes.push(mk('module-'+m.id,'module',m.name,pos,{moduleId:m.id,category:m.category,slot:selected}));
  holds.push({code:'MOUNT_NOT_QUALIFIED',moduleId:m.id,detail:'Slot '+selected+' is a visual proposal; mechanical and thermal envelopes are missing.'});
 }
 const moduleRequirements=report.modules.map(m=>{
  const assignment=mountAlloc.find(x=>x.moduleId===m.id);
  return {moduleId:m.id,category:m.category,interfaceClass:m.interface,
   proposedSlot:assignment.slot,slotState:assignment.state,
   geometry:{mountPatternMm:null,envelopeMm:null,measuredPositionM:null,geometrySourceHash:null},
   mass:{massG:null,source:null},
   power:{supplyVoltageV:null,peakCurrentA:null,connectorId:null,pinoutSourceUrl:null},
   environmental:{thermalDissipationW:null,ingressProtection:null},
   vendor:{sku:null,revision:null,sourceUrl:null},
   actualPhysicalCompatibility:'UNKNOWN',
   evidence:m.hold};
 });
 const warning='ALL geometry is dimensionless storyboard layout. Neither propeller swept-disk clearance nor CAD compatibility has been checked.';
 return {schema:'aeroforge/mission-scene/v1.0',scenarioId,topology:report.concept.topology,
  authority:SCENE_AUTHORITY,nodes,rotorCount:rotors.length,mountAlloc,moduleRequirements,
  counts:{visualNodes:nodes.length,assigned:mountAlloc.filter(x=>x.state==='ILLUSTRATIVE_ASSIGNED_NOT_FIT_CHECKED').length,
   unassigned:mountAlloc.filter(x=>x.state==='UNASSIGNED_CAPACITY_HOLD').length,
   holds:holds.length},
  holds,qualification:{physicalFit:false,wiring:false,thrust:false,flight:false,sitl:false},
  warning,scenario:report.concept};
}
function safeModuleId(id){if(typeof id!=='string'||!/^[a-z0-9-]+$/.test(id))throw Error('Invalid module ID');return id;}
/**
 * Real worklist shape consumable by later Assembly Copilot adapters.
 * The current v0.8 quad-specific workflow is NOT silently reused for hex/VTOL.
 */
export function compileMissionBuildHandoff(scene){
 if(scene?.schema!=='aeroforge/mission-scene/v1.0'||scene.authority!==SCENE_AUTHORITY)throw Error('Invalid mission scene');
 const ref=scene.scenario;
 const steps=[
 {id:'identity',stage:'A / IDENTIFY',title:'Record exact delivered part revisions',forModules:scene.moduleRequirements.map(x=>x.moduleId),
  requires:[],gate:'DOCUMENT_ONLY',status:'UNVERIFIED',checks:['Match SKU to revision-specific manufacturer documents','Identify intended operating environment and pilot requirements']},
 {id:'cad-registration',stage:'B / GEOMETRY',title:'Import vendor CAD and record real mounting datums',forModules:[],requires:['identity'],gate:'CAD_HOLD',status:'UNVERIFIED',checks:['Verify STEP/GLB hash, unit scale and source license','Register motor XYZ, prop swept disks, CG and service clearances']},
 {id:'propulsion-qualification',stage:'C / PROPULSION',title:'Qualify propulsion and actuation interfaces',forModules:scene.moduleRequirements.filter(x=>x.category==='propulsion').map(x=>x.moduleId),
  requires:['cad-registration'],gate:'MEASUREMENT_HOLD',status:'UNVERIFIED',
  checks:['Record motor/ESC/prop SKU pairing and measured current/thrust','Record actual rotor count and motor output mapping','Measure battery and thermal limits']}
 ];
 for(const m of scene.moduleRequirements){
  const x=MODULE_BY_ID[m.moduleId];
  if(['airframe','propulsion','software'].includes(x.category))continue;
  const id='install-'+safeModuleId(m.moduleId);
  steps.push({id,stage:'D / MODULE',title:'Integrate '+x.name,
   forModules:[m.moduleId],requires:['cad-registration'],gate:'INTERFACE_HOLD',status:'UNVERIFIED',
   checks:['Measure mass, mount pattern and 3D envelope','Verify power supply, connector and pin-level manufacturer source',
   'Inspect electromagnetic interference, thermal load and retention','Document placement / full harness topology and human review']});
 }
 const install=steps.filter(x=>x.id.startsWith('install-')).map(x=>x.id);
 steps.push({id:'integration-review',stage:'E / REVIEW',title:'Review power, placement and evidence completeness',
  forModules:scene.moduleRequirements.map(x=>x.moduleId),requires:['propulsion-qualification',...install],gate:'INDEPENDENT_HUMAN_REVIEW',status:'UNVERIFIED',
  checks:['Independent unpowered inspection with physical evidence','Inspect all unresolved mount slots and electrical interface requirements','Do not infer flight approval from a worklist']});
 steps.push({id:'simulation-plan',stage:'F / SOFTWARE',title:'Plan PX4 or ArduPilot scenario-specific simulation',
  forModules:[],requires:['integration-review'],gate:'CALIBRATION_HOLD',status:'UNVERIFIED',
  checks:['Verify firmware/airframe support and actual actuator mapping','Measure calibrated mass, inertia, thrust and sensors before claiming a digital twin',
    'Review autonomy, link-loss behavior, geofence and human operation plan']});
 const idSet=new Set();
 for(const s of steps){
  if(idSet.has(s.id))throw Error('Duplicate build stage');
  for(const p of s.requires)if(!idSet.has(p))throw Error('Invalid step prerequisites: '+s.id+' requires '+p);
  idSet.add(s.id);
 }
 const identity=JSON.stringify([scene.scenarioId,scene.moduleRequirements.map(m=>m.moduleId)]);
 // Noncryptographic display key only; release evidence must use immutable SHA-256 source hashes later.
 let h=2166136261;for(const c of identity){h=Math.imul(h^c.charCodeAt(0),16777619)}
 return {schema:'aeroforge/mission-build-handoff/v1.0',scenarioId:scene.scenarioId,
  key:'mission-'+(h>>>0).toString(16).padStart(8,'0'),
  supportedByExistingAssemblyCopilot:false,authority:scene.authority,steps,
  requiredMeasurements:REQUIRED_MEASUREMENTS,measurementValues:null,
  acceptedEvidence:[],inspectionVerified:false,flightReady:false,purchaseReady:false,
  warning:'PLANNING ONLY. The v0.8 Copilot is quad-specific; this handoff does NOT become verified by exporting it.'};
}
export function validateSceneLayouts(){
 // Integrity checks useful to future CAD-backed components.
 const scenarios=['indoor-inventory','solar-roof','air-sampler','garden-mapper','accessible-trails','habitat-vtol'];
 return scenarios.map(id=>{
  const x=buildMissionScene(id);
  return {id,rotorCount:x.rotorCount,unassigned:x.counts.unassigned,finitePositions:x.nodes.every(n=>n.position.length===3&&n.position.every(finite)),
   onlyConcepts:x.nodes.every(n=>n.authority===SCENE_AUTHORITY)};
 });
}
