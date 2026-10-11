/**
 * AeroForge v2.1: revision-aware, source-linked X500 electrical/mechanical interface hypotheses.
 * Published option SKUs are not received hardware, cable pinmaps, CAD mates, or order approvals.
 */
import {findSourceSku} from './source_catalog_v20.mjs';

export const INTERFACE_SCHEMA='aeroforge/part-interface-audit/v2.1';
export const INTERFACE_REVIEW_DATE='2026-10-11';
const x500='https://holybro.com/products/px4-development-kit-x500-v2';
const partsUrl='https://holybro.com/products/spare-parts-x500-v2-kit';
const frameUrl='https://holybro.com/collections/multicopter-kit/products/x500-v2-kits';
const powerUrl='https://holybro.com/products/pm02d-power-module';
const powerDocs='https://docs.holybro.com/power-module-and-pdb/power-module/digital-power-module-pm-setup';
const frameDocs='https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2';
const note='SOURCE_FAMILY_EVIDENCE_ONLY';
const port=(name,interfaceFamily,role,source,notes)=>({
 name,interfaceFamily,role,source,notes,gender:null,pinMap:null,
 keyedOrientation:null,partRevisionInspected:false
});
const record=(id,slot,sku,label,model,source,interfaces,claims=[],holds=[],status='PUBLISHED_SKU_OPTION')=>({
 id,slot,sku,label,model,manufacturer:'Holybro',
 source:{url:source,publisher:'Holybro Official',reviewed:INTERFACE_REVIEW_DATE},
 status,interfaces,claims,holds,
 receivedHardwareRevision:null,receivedIdentityVerified:false,
 sourceStepHash:null,geometryMated:false,connectorPhysicallyInspected:false,
 inventoryCheckedNow:false,priceCheckedNow:false,qualifiedForConstruction:false,
 qualifiedForPower:false,qualifiedForFlight:false
});
export const X500_PART_REFERENCES=Object.freeze([
 record('x500-motor-cw','motor','520085','Motor 2216 920KV CW','X500 V2 2216 motor',
  partsUrl,[port('Motor phase plug','MR30_MOTOR_PHASE_3','motor-drive',x500,
  'Store describes motor-side MR30; inspect polarity, keying, and cable on received version')],
  [{key:'nominal_kv',value:920,source:x500},{key:'rotation_label',value:'CW',source:partsUrl}],
  ['CW/CCW store labels do NOT by themselves establish installed rotor output position or prop direction',
   'Motor shaft, mounting hole dimensions and power/current operating curves still require inspection']),
 record('x500-motor-ccw','motor','520086','Motor 2216 920KV CCW','X500 V2 2216 motor',
  partsUrl,[port('Motor phase plug','MR30_MOTOR_PHASE_3','motor-drive',x500,
  'Store describes motor-side MR30; inspect gender, phase order and real harness')],
  [{key:'nominal_kv',value:920,source:x500},{key:'rotation_label',value:'CCW',source:partsUrl}],
  ['CW/CCW label is not a validated spin-direction assignment for PX4 actuator outputs',
   'Motor mounting datum, prop nut and electrical/thermal ratings remain unverified']),
 record('x500-esc20','esc','520081','BLHeli S 20A ESC','X500 V2 20A single ESC',
  partsUrl,[
   port('ESC motor phases','MR30_MOTOR_PHASE_3','motor-drive',x500,
    'MR30 side described on kit store; inspect whether exact delivered ESC supplies corresponding connector'),
   port('ESC DC power input','XT30_ESC_DC','esc-power',x500,
    'Manufacturer lists ESC with XT30 plugs; inspect gender and polarity'),
   port('ESC actuator control','ESC_SIGNAL_UNSPECIFIED','actuator-signal',x500,
    'No validated output pin assignment, signal voltage or return path documented in this app')
  ],[{key:'nominal_current_a',value:20,source:x500},{key:'battery_series',value:4,source:x500}],
  ['4S is documented for the kit ESC; verify actual ESC marking, thermal limits and motor current',
   'Signal harness, phase sequence, connector gender and polarity uninspected']),
 record('x500-pdb','pdb','18069A','PDB with pre-soldered XT30','X500 V2 power distribution board',
  partsUrl,[
   port('Battery feed','XT60_PACK_DC','battery-feed',x500,
    'XT60 pack feed documented, but mating orientation, gauge and protection uninspected'),
   port('ESC DC branch','XT30_ESC_DC','esc-power',x500,
    'XT30 ESC power distribution documented; per-branch output current and harness remain unresolved')
  ],[{key:'kit_dc_families',value:['XT60','XT30'],source:x500}],
  ['PDB and battery connector gender, polarity, wire rating and protective limits require physical checks',
   'PDB does not establish a safe battery charger or fuse design']),
 record('x500-frame','frame','30120','X500 V2 frame kit','X500 V2 frame',
  frameDocs,[port('Motor mount','MOTOR_MOUNT_PATTERN','mechanical',frameUrl,
   'Current frame store lists both 16x16 mm and 19x19 mm; older docs list only 16x16 mm')],
  [{key:'wheelbase_nominal_mm',value:500,source:frameDocs},
   {key:'motor_mount_patterns_mm',value:[16,19],source:frameUrl}],
  ['Confirm the exact received motor base revision and motor shaft/mounting surface CAD',
   'No registered mating transforms, screw engagement or collision audit']),
 record('x500-pm02d','power-module','15011','PM02D digital power module','PM02D, 2S–12S listed product',
  powerUrl,[
   port('FC power sensing','PM02D_I2C_DIGITAL','fc-power',powerDocs,
    'Only 5X/6X family documented for I2C; actual HV/LV module revision and pinout unresolved'),
   port('Power path','PM_POWER_PATH_UNKNOWN','pack-power',powerUrl,
    'Power/connector integration to exact PDB is not verified')
  ],[{key:'power_sensing_protocol',value:'I2C',source:powerDocs},
   {key:'published_product_range',value:'2S–12S',source:powerUrl}],
  ['X500 Pixhawk 6X bundles may ship PM02D-HV (INA228), whereas SKU 15011 is a PM02D listing: not the same proven delivered revision',
   'For PX4 with HV module, source documentation refers to SENS_EN_INA228; verify exact PX4 release',
   'Do not plug into analog Pixhawk 6C power input']),
 record('x500-6c-fc-family','controller',null,'Pixhawk 6C family (kit)','Pixhawk 6C',
  x500,[port('Power sensing','PM02V3_ANALOG','fc-power',x500,
   'Kit 6C uses PM02 V3 analog family, precise power harness pinout uninspected')],
  [{key:'kit_power_family',value:'PM02 V3 analog',source:x500}],
  ['Specific received board SKU/revision and analog power-module SKU unconfirmed',
   'No pin-level wiring diagram imported'], 'DOCUMENTED_FAMILY_NO_EXACT_RECEIVED_SKU'),
 record('x500-6x-fc-family','controller',null,'Pixhawk 6X family (kit)','Pixhawk 6X',
  x500,[port('Power sensing','PM02D_I2C_DIGITAL','fc-power',powerDocs,
   '6X uses I2C digital sensing; select HV/LV sensor model and firmware based on received revision')],
  [{key:'kit_power_family',value:'PM02D digital',source:x500}],
  ['6X baseboard version, PM02D-HV vs PM02D-LV, INA228 configuration and exact harness unresolved'],
  'DOCUMENTED_FAMILY_NO_EXACT_RECEIVED_SKU'),
 record('x500-6c-pm-family','power-module',null,'PM02 V3 analog family','PM02 V3 analog',
  x500,[port('FC power sensing','PM02V3_ANALOG','fc-power',x500,
   'The X500 6C bundle uses PM02 V3; no exact received product revision verified')],
  [],['Find revision-specific PM02 V3 variant, verify analog pinout and controller-side connector'],
  'DOCUMENTED_FAMILY_NO_EXACT_RECEIVED_SKU')
]);
const MAP=new Map(X500_PART_REFERENCES.map(x=>[x.id,x]));
export function findInterfacePart(id){return MAP.get(id)||null;}
export function interfacePartsForSlot(slot){return X500_PART_REFERENCES.filter(x=>x.slot===slot);}
const graph=[
 {id:'motor-esc',a:'x500-motor-cw',b:'x500-esc20',role:'motor-drive',status:'FAMILY_MATCH_UNVERIFIED',
  checks:['MR30 gender and orientation','three motor phase leads and electrical continuity','bench thrust/current/thermal validation']},
 {id:'esc-pdb',a:'x500-esc20',b:'x500-pdb',role:'esc-power',status:'FAMILY_MATCH_UNVERIFIED',
  checks:['XT30 physical mating and polarity','four DC branch ratings, wire gauge and insulation','battery/power protection and thermal review']},
 {id:'pdb-battery',a:'x500-pdb',b:null,role:'battery-feed',status:'MISSING_PART_IDENTITY',
  checks:['exact separately sourced battery model','XT60 polarity/mating and full-charge voltage','battery discharge, fusing and charging limits']},
 {id:'6c-power',a:'x500-6c-fc-family',b:'x500-6c-pm-family',role:'fc-power',
  status:'FAMILY_MATCH_UNVERIFIED',
  checks:['exact Pixhawk 6C board revision','PM02 V3 analog pinout and connector','safe unpowered harness inspection']},
 {id:'6x-power',a:'x500-6x-fc-family',b:'x500-pm02d',role:'fc-power',
  status:'FAMILY_MATCH_UNVERIFIED',
  checks:['specific PM02D-HV/LV product revision','Pixhawk 6X baseboard and I2C wiring','INA228/INA226 firmware configuration']},
 {id:'mount-motor',a:'x500-frame',b:'x500-motor-cw',role:'mechanical',
  status:'UNMEASURED_MATING_GEOMETRY',
  checks:['frame/motor hole patterns for delivered revisions','fastener, motor base and shaft datums','CAD mesh interference and prop swept disk']},
 {id:'esc-actuator',a:'x500-esc20',b:null,role:'actuator-signal',
  status:'MISSING_PIN_LEVEL_WIRING',
  checks:['autopilot output mapping and signal/return paths','flight stack firmware settings','props-off electrical and motor output inspection']}
];
export const X500_INTERFACE_EDGES=Object.freeze(graph);
const pick=(id,choices)=>choices.includes(id)?id:null;
/** Only source-level family compatibility; never validates physical connector gender/polarity or fit. */
export function analyzeInterfacePair(aId,bId,role){
 const a=findInterfacePart(aId),b=findInterfacePart(bId);
 if(!a||!b)throw Error('Two known part references are required');
 if(!['motor-drive','esc-power','fc-power','mechanical','battery-feed','actuator-signal'].includes(role))
  throw Error('Unsupported interface role');
 const left=a.interfaces.filter(p=>p.role===role);
 const right=b.interfaces.filter(p=>p.role===role);
 const intersections=left.flatMap(pa=>right.filter(pb=>pb.interfaceFamily===pa.interfaceFamily)
  .map(pb=>({family:pa.interfaceFamily,aPort:pa.name,bPort:pb.name})));
 let status='NO_PUBLISHED_FAMILY_MATCH';
 if(intersections.length)status='FAMILY_MATCH_UNVERIFIED';
 if(role==='mechanical')status='UNMEASURED_MATING_GEOMETRY';
 if(role==='fc-power'&&!intersections.length)status='BLOCK_FAMILY_MISMATCH';
 return {schema:INTERFACE_SCHEMA,aId,bId,role,status,intersections,
  exactPinoutVerified:false,connectorGenderVerified:false,polarityVerified:false,
  measuredMatingGeometry:false,qualifiedForPower:false,qualifiedForFlight:false,
  requiredReview:['Inspect received product SKU/revision','Confirm source-specific mechanical/electrical interfaces',
   'Independently review polarity, actual pinout, and safety before bench power']};
}
export function compileX500InterfaceAudit({variant='six_c',batteryCells=4,motorId='x500-motor-cw'}={}){
 if(!['six_c','six_x'].includes(variant))throw Error('Unknown X500 variant');
 if(!Number.isInteger(batteryCells)||batteryCells<2||batteryCells>12)throw Error('Invalid series count');
 if(!['x500-motor-cw','x500-motor-ccw'].includes(motorId))throw Error('Unknown motor reference');
 const selectedPower=variant==='six_c'?'x500-6c-pm-family':'x500-pm02d';
 const controller=variant==='six_c'?'x500-6c-fc-family':'x500-6x-fc-family';
 const refs=[controller,selectedPower,'x500-frame',motorId,'x500-esc20','x500-pdb']
  .map(findInterfacePart);
 const edges=[
  {id:'motor-esc',...analyzeInterfacePair(motorId,'x500-esc20','motor-drive')},
  {id:'esc-pdb',...analyzeInterfacePair('x500-esc20','x500-pdb','esc-power')},
  {id:'fc-power',...analyzeInterfacePair(controller,selectedPower,'fc-power')},
  {id:'frame-motor',...analyzeInterfacePair('x500-frame',motorId,'mechanical')}
 ];
 const blocking=[];
 if(batteryCells!==4)blocking.push('BLOCK: documented X500 ESC family requires 4S; selected '+batteryCells+'S');
 if(edges.some(x=>x.status.startsWith('BLOCK')))blocking.push('BLOCK: flight-controller and power-module family mismatch');
 const supplemental=graph.filter(e=>['pdb-battery','esc-actuator'].includes(e.id));
 return {schema:INTERFACE_SCHEMA,variant,batteryCells,motorId,
  references:refs,edges,supplemental,blocking,
  openHoldCount:edges.length+supplemental.length,blockingCount:blocking.length,
  status:blocking.length?'BLOCKED_SELECTION':'FAMILY_DOCUMENTED_WITH_OPEN_HOLDS',
  sourceLedger:X500_PART_REFERENCES.map(x=>({id:x.id,url:x.source.url,reviewed:x.source.reviewed})),
  exactPartsReceived:false,physicalConnectionsVerified:false,physicalFitVerified:false,
  procurementApproved:false,powerApproved:false,flightApproved:false};
}
/** Source reference mapping is intentionally explicit: v1.9 FPV classes are NOT X500 SKUs. */
export const INSPECTOR_X500_RESEARCH_ROLES=Object.freeze({
 frame:'frame',canopy:'frame','motor-0':'motor','motor-1':'motor',
 'motor-2':'motor','motor-3':'motor','esc-0':'esc','esc-1':'esc','esc-2':'esc','esc-3':'esc',
 stack:'controller',pdb:'pdb',battery:'battery'
});
export function researchRoleForShowcasePart(partId){
 return typeof partId==='string'?INSPECTOR_X500_RESEARCH_ROLES[partId]||null:null;
}
export function interfaceSourcePacket({variant='six_c',batteryCells=4,motorId='x500-motor-cw'}={}){
 const audit=compileX500InterfaceAudit({variant,batteryCells,motorId});
 return {schema:'aeroforge/x500-interface-research-packet/v2.1',
  generatedFrom:'SOURCE_DOCUMENTATION_SNAPSHOT',sourceAsOf:INTERFACE_REVIEW_DATE,
  audit,receivedPartEvidence:[],independentInspectionEvidence:[],
  purchasingReady:false,benchPowerReady:false,flightReady:false};
}
