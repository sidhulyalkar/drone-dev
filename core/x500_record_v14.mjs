/** v1.4: One revision-aware X500 reference graph for kit, CAD and assembly.
 * Documented model families never become verified wiring or approved hardware.
 */
import {qualifyKit,sources,components} from './kit_v06.mjs';
export const KIT_RECORD_SCHEMA='aeroforge/x500-aircraft-record/v1.4';
const part=(slot,id,label,qty,sourceId)=>({
 slot,familyId:id,label,qty,manufacturer:'Holybro',sourceUrl:sources[sourceId]?.url??null,
 receivedSku:null,receivedRevision:null,cadSourceSha256:null,
 physicalPartIdentified:false,wiringInspected:false,fitQualified:false
});
const edge=(from,to,kind,status,source,need)=>({
 from,to,kind,status,sourceUrl:sources[source]?.url??null,
 pinMap:null,verifiedConnectorIdentity:null,
 mustVerify:need,independentReview:false});
function validateRecord(record){
 if(record?.schema!==KIT_RECORD_SCHEMA)throw Error('Expected canonical X500 record');
}
export function compileX500Record(selection={}){
 const kit=qualifyKit(selection),s=kit.selected;
 const parts={
  frame:part('frame',components.frame.id,components.frame.name,1,'FRAME'),
  motors:part('motors',components.motor.id,components.motor.name,4,'KIT'),
  esc:part('esc',components.esc.id,components.esc.name,4,'KIT'),
  propellers:part('propellers',components.prop.id,components.prop.name,4,'KIT'),
  pdb:part('pdb',components.pdb.id,components.pdb.name,1,'KIT'),
  gnss:part('gnss',components.gps.id,components.gps.name,1,'KIT'),
  telemetry:part('telemetry',components.telemetry.id,components.telemetry.name,1,'KIT'),
  controller:part('controller',s.variant==='six_c'?'pixhawk-6c':'pixhawk-6x',kit.flightController.fc,1,'KIT'),
  power:part('power',kit.powerModule.id,kit.powerModule.name,1,kit.powerModule.source)
 };
 const familyMatched=kit.flightController.power===undefined?
   kit.flightController.interface===kit.powerModule.interface:
   kit.flightController.power===kit.powerModule.id;
 const edges=[
  edge('controller','power','FC power module',familyMatched?'HOLD_PIN_LEVEL':'BLOCK_FAMILY_MISMATCH','PX4',
   ['Exact received connector','Pin-level manufacturer diagram','Source-specific power review']),
  edge('battery','pdb','battery feed',s.batteryCells===4?'HOLD_BATTERY':'BLOCK_ESC_CELL_RATING','KIT',
   ['Battery full-charge voltage','Fuse, connector, gauge and polarity','Pack/ESC revision']),
  edge('pdb','esc','ESC power feeds','HOLD_CONNECTOR_REVISION','ARF',
   ['Received XT30/MR30 and board revision','Independent harness inspection']),
  edge('esc','motors','motor phases','HOLD_THRUST_CALIBRATION','KIT',
   ['Motor/ESC/prop static current tests','Thermal limits']),
  edge('controller','esc','actuator signals','HOLD_OUTPUT_MAPPING','PX4',
   ['Firmware target','Physical outputs, direction, props-off verification']),
  edge('controller','gnss','GNSS','HOLD_GNSS_REVISION','KIT',
   ['M8N/M10 delivery revision','Serial/CAN pinout, GNSS orientation']),
  edge('controller','telemetry','radio','HOLD_REGION_RF','KIT',
   ['Actual regional radio band','Source-specific UART/telemetry wiring'])
 ];
 const geometry={frameStepFile:'x500v2-frame.step',sourceHash:null,visualGlbHash:null,
  sourceLocalBytesChecked:false,manufacturerAuthenticated:false,aircraftDatumRegistered:false,
  motorXYZm:null,measuredCgMm:null,collisionQualified:false};
 const fields=[s.variant,s.power,s.batteryCells,s.batterySku,s.radioSku,s.receiverSku,s.chargerSku];
 const identity=JSON.stringify([fields,Object.keys(parts).sort().map(k=>[k,parts[k].familyId,parts[k].receivedRevision])]);
 return {schema:KIT_RECORD_SCHEMA,reference:'holybro-x500-v2',variant:s.variant,
  selected:{...s},revisionIdentity:identity,parts,edges,geometry,
  sourceLedger:Object.fromEntries(Object.entries(sources).map(([id,source])=>[id,{url:source.url,reviewed:source.reviewed}])),
  assessmentStatus:kit.status,
  graphStatus:edges.some(e=>e.status.startsWith('BLOCK'))?'BLOCKED':'HOLDS_UNVERIFIED',
  procurementApproved:false,powerApproved:false,flightApproved:false,
  notice:'Source-documented families, not a qualified pin-to-pin harness or CAD assembly.'};
}
export function attachX500Cad(record,preview){
 validateRecord(record);
 if(preview?.schema!=='aeroforge/cad-preview-evidence/v1.3'||preview.glbHashMatchesManifest!==true)
  throw Error('Only a locally hash-checked visual package is linkable');
 const m=preview.manifest;
 if(m?.source?.fileName?.toLowerCase()!=='x500v2-frame.step')
  throw Error('Only exact-named X500 V2 frame CAD source can link to this frame reference');
 if(!/^[a-f0-9]{64}$/.test(m.source.sha256)||m.conversion.coordinateFrame!=='CAD_NATIVE_UNREGISTERED')
  throw Error('CAD digest or axis status invalid');
 return {...record,parts:{...record.parts,frame:{...record.parts.frame,cadSourceSha256:m.source.sha256}},
  geometry:{...record.geometry,sourceHash:m.source.sha256,visualGlbHash:m.mesh.sha256,
   sourceLocalBytesChecked:preview.localStepHashMatchesManifest===true,
   manufacturerAuthenticated:false,aircraftDatumRegistered:false,
   motorXYZm:null,measuredCgMm:null,collisionQualified:false},
  procurementApproved:false,powerApproved:false,flightApproved:false};
}
export function compareX500Records(before,after){
 validateRecord(before);validateRecord(after);
 const slots=Object.keys({...before.parts,...after.parts}).filter(k=>
  JSON.stringify(before.parts[k]??null)!==JSON.stringify(after.parts[k]??null));
 const geometryChanged=JSON.stringify(before.geometry)!==JSON.stringify(after.geometry);
 const impacted=new Set();
 for(const slot of slots){
  const work=slot==='controller'||slot==='power'?
   ['power connector pinout','PX4 actuator mapping','electrical inspection']:
   slot==='frame'?['CAD datum registration','mounting and rotor clearance']:
   slot==='esc'||slot==='motors'?['propulsion and thermal qualification']:
   ['part identification','dependent assembly evidence'];
  for(const x of work)impacted.add(x);
 }
 if(geometryChanged)for(const x of ['frame CAD provenance','motor datums','fit and clearance review'])impacted.add(x);
 return {schema:'aeroforge/x500-change-impact/v1.4',changedSlots:slots,
  geometryChanged,invalidatedEvidence:[...impacted],independentReviewRequired:true,
  neverAutoApproved:true};
}
