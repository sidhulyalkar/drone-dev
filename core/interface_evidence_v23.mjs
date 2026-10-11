/** AeroForge v2.3: check-level evidence linkage. Research planning, NEVER qualification. */
import {compileX500InterfaceAudit} from './interface_registry_v21.mjs';
import {validateInspectionJournal} from './inspection_journal_v22.mjs';
import {KIT_RECORD_SCHEMA} from './x500_record_v14.mjs';
export const MATRIX_SCHEMA='aeroforge/interface-evidence-links/v2.3';
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const same=(a,b)=>a?.revisionIdentity===b?.revisionIdentity&&a?.variant===b?.variant&&a?.batteryCells===b?.batteryCells&&a?.aircraftReference===b?.aircraftReference;
function context(record){
 if(record?.schema!==KIT_RECORD_SCHEMA)throw Error('Canonical X500 record required');
 return {aircraftReference:record.reference,revisionIdentity:record.revisionIdentity,variant:record.variant,batteryCells:record.selected.batteryCells};
}
function checks(record){
 const a=compileX500InterfaceAudit({variant:record.variant,batteryCells:record.selected.batteryCells});
 const formal=a.edges.map(e=>({id:e.id,role:e.role,partRefs:[e.aId,e.bId].filter(Boolean),items:e.requiredReview,
  sourceStatus:e.status}));
 const supplemental=a.supplemental.map(e=>({id:e.id,role:e.role,partRefs:[e.a,e.b].filter(Boolean),
  items:e.checks,sourceStatus:e.status}));
 return [...formal,...supplemental];
}
export function startInterfaceEvidenceLinks(record){
 return {schema:MATRIX_SCHEMA,activeContext:context(record),links:[],
  authority:'USER_DECLARED_RESEARCH_LINKS_ONLY',procurementApproved:false,powerApproved:false,flightApproved:false};
}
export function validateInterfaceEvidenceLinks(ledger){
 if(!isObject(ledger)||ledger.schema!==MATRIX_SCHEMA||!isObject(ledger.activeContext)||
 !Array.isArray(ledger.links)||ledger.links.length>3000||
 ledger.authority!=='USER_DECLARED_RESEARCH_LINKS_ONLY'||
 ledger.procurementApproved!==false||ledger.powerApproved!==false||ledger.flightApproved!==false)
  throw Error('Invalid interface evidence ledger');
 const c=ledger.activeContext;
 if(c.aircraftReference!=='holybro-x500-v2'||!['six_c','six_x'].includes(c.variant)||
 !Number.isInteger(c.batteryCells)||c.batteryCells<2||c.batteryCells>12||
 typeof c.revisionIdentity!=='string'||!c.revisionIdentity||c.revisionIdentity.length>6000)
  throw Error('Invalid evidence ledger context');
 const seen=new Set();
 for(const l of ledger.links){
  if(!isObject(l)||typeof l.id!=='string'||!/^link-[0-9]{4}$/.test(l.id)||
  !/^evt-[0-9]{4}$/.test(l.observationId)||typeof l.edgeId!=='string'||
  !Number.isInteger(l.checkIndex)||l.checkIndex<0||typeof l.rationale!=='string'||
  l.rationale.trim().length<12||l.rationale.length>1200||!isObject(l.context)||
  !same(l.context,c)&&l.context.aircraftReference!=='holybro-x500-v2')
   throw Error('Malformed interface evidence link');
  if(seen.has(l.id))throw Error('Duplicate evidence link');
  seen.add(l.id);
 }
 return structuredClone(ledger);
}
export function reconcileInterfaceEvidenceLinks(ledger,record){
 return {...validateInterfaceEvidenceLinks(ledger),activeContext:context(record)};
}
/** Link an existing receipt to one precise unresolved check, not to a generic part. */
export function appendInterfaceEvidenceLink(ledger,journal,record,{observationId,edgeId,checkIndex,rationale}){
 const safe=validateInterfaceEvidenceLinks(ledger),j=validateInspectionJournal(journal),c=context(record);
 if(!same(safe.activeContext,c))throw Error('Reconcile ledger to aircraft revision first');
 const edge=checks(record).find(x=>x.id===edgeId);
 if(!edge||!Number.isInteger(checkIndex)||checkIndex<0||checkIndex>=edge.items.length)
  throw Error('Unknown interface check');
 const obs=j.events.find(x=>x.id===observationId&&x.type==='observation');
 if(!obs)throw Error('Unknown observation');
 if(!same(obs.context,c))throw Error('Cannot link stale observation');
 if(!edge.partRefs.includes(obs.payload.partRef))throw Error('Observation part is not on selected interface');
 if(typeof rationale!=='string'||rationale.trim().length<12||rationale.length>1200)
  throw Error('Explain specifically how this receipt relates to the check');
 if(safe.links.some(l=>l.observationId===observationId&&l.edgeId===edgeId&&l.checkIndex===checkIndex&&same(l.context,c)))
  throw Error('Receipt already linked to this check');
 const id='link-'+String(Math.max(0,...safe.links.map(l=>Number(l.id.slice(5))))+1).padStart(4,'0');
 return {...safe,links:[...safe.links,{id,observationId,edgeId,checkIndex,
  rationale:rationale.trim(),context:c,authority:'UNVERIFIED_USER_ASSOCIATION'}]};
}
export function interfaceEvidenceMatrix(ledger,journal,record){
 const safe=validateInterfaceEvidenceLinks(ledger),j=validateInspectionJournal(journal),c=context(record);
 const observations=new Map(j.events.filter(e=>e.type==='observation').map(e=>[e.id,e]));
 const reviews=new Set(j.events.filter(e=>e.type==='review').map(e=>e.observationId));
 const edges=checks(record).map(edge=>({
  edgeId:edge.id,role:edge.role,partRefs:edge.partRefs,sourceStatus:edge.sourceStatus,
  checks:edge.items.map((name,checkIndex)=>{
   const linked=safe.links.filter(l=>l.edgeId===edge.id&&l.checkIndex===checkIndex).map(l=>{
    const o=observations.get(l.observationId);
    const current=!!o&&same(o.context,c)&&same(l.context,c)&&edge.partRefs.includes(o.payload.partRef);
    return {linkId:l.id,observationId:l.observationId,rationale:l.rationale,
     kind:o?.payload.kind??null,reviewRecorded:current&&reviews.has(l.observationId),
     status:current?'SELF_REPORTED_EVIDENCE_LINKED':'STALE_OR_INVALID_EVIDENCE'};
   });
   const currentCount=linked.filter(l=>l.status==='SELF_REPORTED_EVIDENCE_LINKED').length;
   return {checkId:edge.id+':'+checkIndex,checkIndex,requirement:name,
    status:currentCount?'EVIDENCE_RECORDED_NOT_VERIFIED':'MISSING_CURRENT_EVIDENCE',
    currentEvidenceCount:currentCount,links:linked,independentlyQualified:false};
  })
 }));
 return {schema:'aeroforge/interface-evidence-matrix/v2.3',context:c,
  edges,totalChecks:edges.reduce((n,e)=>n+e.checks.length,0),
  checksWithReceipts:edges.reduce((n,e)=>n+e.checks.filter(x=>x.currentEvidenceCount>0).length,0),
  unqualifiedChecks:edges.reduce((n,e)=>n+e.checks.length,0),
  documentationOnly:true,independentPhysicalQualification:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'User-linked receipts and second-person reviews are not independent verification. All physical holds remain open.'};
}
