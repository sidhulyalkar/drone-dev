/**
 * AeroForge v2.2: append-only, self-reported X500 physical evidence journal.
 * A local file digest verifies its bytes only. Neither user declarations nor second-person
 * review automatically qualify a mating interface, power-up, purchase or flight.
 */
import {X500_PART_REFERENCES,compileX500InterfaceAudit} from './interface_registry_v21.mjs';
import {KIT_RECORD_SCHEMA} from './x500_record_v14.mjs';

export const INSPECTION_SCHEMA='aeroforge/inspection-journal/v2.2';
export const INSPECTION_STAGES=Object.freeze([
 'DOCUMENTATION_ONLY','RECEIPT_SELF_REPORTED','INDEPENDENT_REVIEW_RECORDED',
 'STALE_CONFIGURATION'
]);
export const OBSERVATION_KINDS=Object.freeze([
 'received_identity','dimensional_measurement','connector_observation','cad_mating_hypothesis'
]);
const refIds=new Set(X500_PART_REFERENCES.map(p=>p.id));
/** Noncryptographic checksum to detect accidental event edits. It is NOT a signature or chain of custody. */
function checksum(event){
 const raw=JSON.stringify(event);
 let h=0xcbf29ce484222325n;
 for(let i=0;i<raw.length;i++){
  h^=BigInt(raw.charCodeAt(i));
  h=(h*0x100000001b3n)&0xffffffffffffffffn;
 }
 return h.toString(16).padStart(16,'0');
}
function receipt(event){return {...event,integrityChecksum:checksum(event)};}

const iso=/^\d{4}-\d{2}-\d{2}$/;
const sha=/^[a-f0-9]{64}$/;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const reject=s=>{throw Error(s);};
function line(v,label,{max=180,min=1}={}){
 if(typeof v!=='string'||v.trim().length<min||v.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v))
  reject('Invalid '+label);
 return v.trim();
}
function date(v){
 if(typeof v!=='string'||!iso.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)
  reject('Invalid inspection date');
 return v;
}
function context(record){
 if(record?.schema!==KIT_RECORD_SCHEMA)reject('Canonical X500 aircraft record required');
 return {aircraftReference:record.reference,variant:record.variant,
  batteryCells:record.selected.batteryCells,revisionIdentity:record.revisionIdentity};
}
function validDigest(v){
 if(v==null)return null;
 if(!isObj(v)||!sha.test(v.sha256)||typeof v.fileName!=='string'||
    v.fileName.length>160||!v.fileName.trim()||
    !Number.isInteger(v.sizeBytes)||v.sizeBytes<1||v.sizeBytes>15*1024*1024)
  reject('Invalid local file digest receipt');
 return {fileName:v.fileName,sha256:v.sha256,sizeBytes:v.sizeBytes,
  identityOnly:true,sourceAuthenticated:false};
}
function sameContext(a,b){return a?.revisionIdentity===b?.revisionIdentity&&
 a?.variant===b?.variant&&a?.batteryCells===b?.batteryCells&&
 a?.aircraftReference===b?.aircraftReference;}
function validatePayload(p){
 if(!isObj(p)||!OBSERVATION_KINDS.includes(p.kind)||!refIds.has(p.partRef))
  reject('Known part and inspection type required');
 const base={kind:p.kind,partRef:p.partRef,
  receivedLabel:line(p.receivedLabel,'received product label'),
  hardwareRevision:line(p.hardwareRevision,'received revision'),
  observer:line(p.observer,'observer',{max:80}),
  observedOn:date(p.observedOn),notes:line(p.notes,'observation notes',{max:1800,min:12}),
  fileDigest:validDigest(p.fileDigest)};
 const data=p.data??{};
 if(!isObj(data))reject('Observation measurements must be an object');
 const allowed={
  received_identity:[],
  dimensional_measurement:['dimensionName','valueMm','instrument'],
  connector_observation:['connectorFamily','genderObserved','inspectionMethod'],
  cad_mating_hypothesis:['referenceFileSha256','datumDescription','fitMethod']
 }[base.kind];
 if(Object.keys(data).some(k=>!allowed.includes(k)))reject('Unknown measurement field');
 if(base.kind==='dimensional_measurement'){
  base.data={dimensionName:line(data.dimensionName,'dimension name',{max:90}),
   valueMm:data.valueMm,instrument:line(data.instrument,'measurement instrument',{max:160})};
  if(typeof base.data.valueMm!=='number'||!Number.isFinite(base.data.valueMm)||
   base.data.valueMm<=0||base.data.valueMm>100000)reject('Invalid dimension in millimetres');
 }else if(base.kind==='connector_observation'){
  base.data={connectorFamily:line(data.connectorFamily,'connector family',{max:90}),
   genderObserved:line(data.genderObserved,'connector mating description',{max:100}),
   inspectionMethod:line(data.inspectionMethod,'connector inspection method',{max:160})};
 }else if(base.kind==='cad_mating_hypothesis'){
  if(typeof data.referenceFileSha256!=='string'||!sha.test(data.referenceFileSha256))
   reject('CAD mating proposal needs actual 64-hex source digest');
  base.data={referenceFileSha256:data.referenceFileSha256,
   datumDescription:line(data.datumDescription,'CAD datum description',{max:250}),
   fitMethod:line(data.fitMethod,'mating procedure',{max:180})};
 }else base.data={};
 return base;
}
export function startInspectionJournal(record){
 return {schema:INSPECTION_SCHEMA,aircraftReference:'holybro-x500-v2',
  activeContext:context(record),events:[],historyAuthority:'USER_DECLARED_LOCAL_ONLY',
  procurementApproved:false,powerApproved:false,flightApproved:false};
}
/** Strong validation by deterministic replay. Imported files cannot invent approval fields. */
export function validateInspectionJournal(j){
 if(!isObj(j)||j.schema!==INSPECTION_SCHEMA||j.aircraftReference!=='holybro-x500-v2'||
  !Array.isArray(j.events)||j.events.length>3000||!isObj(j.activeContext))
  reject('Invalid inspection journal format');
 const c=j.activeContext;
 if(!['six_c','six_x'].includes(c.variant)||!Number.isInteger(c.batteryCells)||
  typeof c.revisionIdentity!=='string'||!c.revisionIdentity||c.revisionIdentity.length>6000||
  c.aircraftReference!=='holybro-x500-v2')
  reject('Invalid journal configuration identity');
 let current={...startInspectionJournal({
  schema:KIT_RECORD_SCHEMA,reference:c.aircraftReference,variant:c.variant,
  selected:{batteryCells:c.batteryCells},revisionIdentity:c.revisionIdentity
 })};
 for(const event of j.events){
  if(!isObj(event)||event.id!=='evt-'+String(current.events.length+1).padStart(4,'0'))
   reject('Journal event IDs or order invalid');
  const {integrityChecksum,...receiptFields}=event;
  if(typeof integrityChecksum!=='string'||integrityChecksum!==checksum(receiptFields))
   reject('Journal event checksum mismatch (accidental modification or malformed receipt)');

  if(event.type==='observation'){
   const record={schema:KIT_RECORD_SCHEMA,
    reference:event.context?.aircraftReference,variant:event.context?.variant,
    selected:{batteryCells:event.context?.batteryCells},
    revisionIdentity:event.context?.revisionIdentity};
   current.activeContext=context(record);
   const candidate=appendInspectionObservation(current,record,event.payload);
   if(JSON.stringify(candidate.events.at(-1))!==JSON.stringify(event))
    reject('Journal observation differs from validated canonical receipt');
   current.events.push(candidate.events.at(-1));
  }else if(event.type==='review'){
   const target=current.events.find(e=>e.id===event.observationId&&e.type==='observation');
   if(!target)reject('Review references an unknown prior observation');
   current.activeContext={...target.context};
   const candidate=appendInspectionReview(current,{
    observationId:event.observationId,reviewer:event.reviewer,reviewedOn:event.reviewedOn,
    notes:event.notes
   });
   if(JSON.stringify(candidate.events.at(-1))!==JSON.stringify(event))
    reject('Journal independent review differs from validated receipt');
   current.events.push(candidate.events.at(-1));
  }else reject('Unknown journal event type');
 }
 // Important: a user-edited journal can carry claims, not independent trust.
 return {...current,activeContext:{...c}};
}
export function reconcileInspectionJournal(j,record){
 const normalized=validateInspectionJournal(j),next=context(record);
 return {...normalized,activeContext:next};
}
export function appendInspectionObservation(j,record,payload){
 const normalized=validateShape(j),c=context(record);
 if(!sameContext(c,normalized.activeContext))
  reject('Current aircraft selection differs: reconcile before recording observations');
 const v=validatePayload(payload);
 const event=receipt({id:'evt-'+String(normalized.events.length+1).padStart(4,'0'),
  type:'observation',context:{...c},payload:v,
  authority:'SELF_REPORTED_NOT_INDEPENDENTLY_VERIFIED'});
 return {...normalized,events:[...normalized.events,event]};
}
function validateShape(j){
 if(!isObj(j)||j.schema!==INSPECTION_SCHEMA||!Array.isArray(j.events)||
  !isObj(j.activeContext)||j.events.length>2999)reject('Invalid inspection journal');
 return j;
}
export function appendInspectionReview(j,{observationId,reviewer,reviewedOn,notes}={}){
 const normalized=validateShape(j);
 const target=normalized.events.find(e=>e.id===observationId&&e.type==='observation');
 if(!target)reject('Independent review requires an existing observation');
 if(!sameContext(target.context,normalized.activeContext))
  reject('Cannot review stale observations from an older aircraft configuration');
 if(normalized.events.some(e=>e.type==='review'&&e.observationId===observationId))
  reject('Observation already has a recorded independent review');
 const name=line(reviewer,'reviewer',{max:80});
 if(name.toLocaleLowerCase()===target.payload.observer.toLocaleLowerCase())
  reject('Independent review requires a different named reviewer');
 const observed=date(reviewedOn);
 if(observed<target.payload.observedOn)reject('Review date cannot predate observation');
 const event=receipt({id:'evt-'+String(normalized.events.length+1).padStart(4,'0'),
  type:'review',observationId,reviewer:name,reviewedOn:observed,
  notes:line(notes,'review notes',{max:1800,min:12}),
  authority:'SECOND_PERSON_SELF_REPORTED_REVIEW_NOT_QUALIFICATION'});
 return {...normalized,events:[...normalized.events,event]};
}
export function inspectionSummary(j,record){
 const safe=validateInspectionJournal(j);
 const c=context(record);
 const observations=safe.events.filter(e=>e.type==='observation');
 const reviews=safe.events.filter(e=>e.type==='review');
 const current=observations.filter(e=>sameContext(e.context,c));
 const stale=observations.filter(e=>!sameContext(e.context,c));
 const reviewed=current.filter(e=>reviews.some(r=>r.observationId===e.id));
 const stage=current.length?(reviewed.length?'INDEPENDENT_REVIEW_RECORDED':'RECEIPT_SELF_REPORTED'):
  'DOCUMENTATION_ONLY';
 return {schema:'aeroforge/inspection-summary/v2.2',stage,
  currentObservations:current.length,staleObservations:stale.length,
  recordedReviews:reviewed.length,unreviewedObservations:current.length-reviewed.length,
  eventCount:safe.events.length,observedPartRefs:[...new Set(current.map(e=>e.payload.partRef))],
  identityMatches:sameContext(safe.activeContext,c),
  independentPhysicalQualification:false,procurementApproved:false,powerApproved:false,
  flightApproved:false,
  note:'Recorded inspection/review claims are local user attestations, not verified hardware, metrology calibration or flight approval.'};
}
export function attachInspectionEvidenceSummary(record,j){
 const summary=inspectionSummary(j,record);
 return {...record,inspectionSummary:summary,procurementApproved:false,
  powerApproved:false,flightApproved:false};
}
export function researchInspectionPacket(j,record){
 const safe=validateInspectionJournal(j);
 const report=inspectionSummary(safe,record);
 const interfaceAudit=compileX500InterfaceAudit({
  variant:record.variant,batteryCells:record.selected.batteryCells
 });
 return {schema:'aeroforge/inspection-research-export/v2.2',
  journal:safe,summary:report,interfaceAuditStatus:interfaceAudit.status,
  connectorWiringApproved:false,measuredMechanicalFitApproved:false,
  purchasingReady:false,benchPowerReady:false,flightReady:false};
}
