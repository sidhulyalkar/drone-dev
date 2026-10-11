/** AeroForge v2.2: opt-in local evidence journal UI. No file bytes are uploaded. */
import {X500_PART_REFERENCES} from './core/interface_registry_v21.mjs';
import {startInspectionJournal,validateInspectionJournal,reconcileInspectionJournal,
 appendInspectionObservation,appendInspectionReview,inspectionSummary,researchInspectionPacket}
 from './core/inspection_journal_v22.mjs';
const $=id=>document.getElementById(id),host=$('v22-inspection');
if(host){
 const KEY='aeroforge-x500-inspection-journal-v22';
 let record=null,journal=null;
 const status=msg=>$('v22-feedback').textContent=msg;
 const make=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 $('v22-date').value=today();$('v22-review-date').value=today();
 function emit(){window.dispatchEvent(new CustomEvent('aeroforge:inspection-journal-updated',{detail:{journal}}));}
 function render(){
  if(!record)return;
  if(!journal)journal=startInspectionJournal(record);
  const summary=inspectionSummary(journal,record);
  $('v22-summary').textContent=summary.stage.replaceAll('_',' ')+' · '+
   summary.currentObservations+' current / '+summary.staleObservations+' stale';
  $('v22-current-context').textContent='Aircraft '+record.variant+
   ' · '+record.selected.batteryCells+'S · '+
   summary.eventCount+' append-only entries · '+
   (summary.identityMatches?'current revision':'different aircraft revision')+
   ' · ZERO PHYSICAL QUALIFICATION';
  $('v22-event-count').textContent=summary.eventCount+' records';
  const list=$('v22-events');list.replaceChildren();
  for(const e of journal.events){
   const row=make('div','','v22-row');
   if(e.type==='observation'){
    const stale=e.context.revisionIdentity!==record.revisionIdentity||
      e.context.variant!==record.variant||e.context.batteryCells!==record.selected.batteryCells;
    if(stale)row.classList.add('stale');
    const reviewed=journal.events.some(r=>r.type==='review'&&r.observationId===e.id);
    row.append(make('strong',e.id+' · '+e.payload.partRef+' · '+e.payload.kind.replaceAll('_',' ')),
     make('span',(stale?'STALE CONFIGURATION':reviewed?'SECOND-PERSON REVIEW RECORDED':'SELF-REPORTED')+
      ' · '+e.payload.observedOn,'v22-tag'),
     make('p',e.payload.receivedLabel+' / revision '+e.payload.hardwareRevision+' · '+e.payload.observer),
     make('p',e.payload.notes));
    if(e.payload.fileDigest)row.append(make('p','Local file SHA-256: '+e.payload.fileDigest.sha256+' (bytes not stored)','v22-tag'));
   }else{
    row.classList.add('review');
    row.append(make('strong',e.id+' · Independent review note on '+e.observationId),
     make('span',e.reviewer+' · '+e.reviewedOn+' · NOT A QUALIFICATION','v22-tag'),
     make('p',e.notes));
   }
   list.append(row);
  }
  if(!journal.events.length)list.append(make('p','No physical inspection observations yet. Manufacturer documentation remains the only evidence.','v22-hint'));
  const dropdown=$('v22-review-id');dropdown.replaceChildren();
  const observations=journal.events.filter(e=>e.type==='observation'&&
    e.context.revisionIdentity===record.revisionIdentity&&
    e.context.variant===record.variant&&e.context.batteryCells===record.selected.batteryCells&&
    !journal.events.some(r=>r.type==='review'&&r.observationId===e.id));
  for(const e of observations){
   const o=make('option',e.id+' · '+e.payload.partRef+' · '+e.payload.receivedLabel);
   o.value=e.id;dropdown.append(o);
  }
  $('v22-review-form').querySelector('button[type=submit]').disabled=!observations.length;
  emit();
 }
 function rehydrate(data){
  const next=validateInspectionJournal(data);
  journal=reconcileInspectionJournal(next,record);
  render();
 }
 function refreshKind(){
  const kind=$('v22-kind').value;
  for(const [id,value] of [['v22-dimension-fields','dimensional_measurement'],
   ['v22-connector-fields','connector_observation'],['v22-cad-fields','cad_mating_hypothesis']])
   $(id).hidden=kind!==value;
 }
 $('v22-kind').addEventListener('change',refreshKind);refreshKind();
 for(const p of X500_PART_REFERENCES){
  const opt=make('option',p.label+' · '+(p.sku||'family only'));
  opt.value=p.id;$('v22-part').append(opt);
 }
 function typedPayload(fileDigest){
  const kind=$('v22-kind').value;
  const payload={kind,partRef:$('v22-part').value,
   receivedLabel:$('v22-label').value,hardwareRevision:$('v22-revision').value,
   observer:$('v22-observer').value,observedOn:$('v22-date').value,
   notes:$('v22-notes').value,fileDigest,data:{}};
  if(kind==='dimensional_measurement')payload.data={
   dimensionName:$('v22-dimension-name').value,valueMm:Number($('v22-mm').value),
   instrument:$('v22-instrument').value};
  if(kind==='connector_observation')payload.data={
   connectorFamily:$('v22-connector-family').value,genderObserved:$('v22-gender').value,
   inspectionMethod:$('v22-connector-method').value};
  if(kind==='cad_mating_hypothesis')payload.data={
   referenceFileSha256:$('v22-step-sha').value,datumDescription:$('v22-datum').value,
   fitMethod:$('v22-method').value};
  return payload;
 }
 async function fileReceipt(){
  const file=$('v22-evidence-file').files?.[0];
  if(!file)return null;
  if(file.size<1||file.size>15*1024*1024)throw Error('Evidence file must be 1 byte to 15 MB');
  if(!globalThis.crypto?.subtle)throw Error('This browser cannot hash local file bytes securely');
  const bytes=await file.arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const hex=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  return {fileName:file.name,sha256:hex,sizeBytes:file.size};
 }
 $('v22-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!record)return;
  const button=$('v22-add-observation');button.disabled=true;
  const original=record.revisionIdentity;
  try{
   const digest=await fileReceipt();
   if(!record||record.revisionIdentity!==original)throw Error('Aircraft revision changed while hashing evidence');
   journal=appendInspectionObservation(journal,record,typedPayload(digest));
   render();$('v22-form').reset();$('v22-date').value=today();refreshKind();
   status('Observation added. It is self-reported and never a physical qualification.');
  }catch(err){status('Observation rejected: '+err.message);}
  finally{button.disabled=false;}
 });
 $('v22-review-form').addEventListener('submit',e=>{
  e.preventDefault();if(!record)return;
  try{
   journal=appendInspectionReview(journal,{
    observationId:$('v22-review-id').value,reviewer:$('v22-reviewer').value,
    reviewedOn:$('v22-review-date').value,notes:$('v22-review-notes').value});
   render();$('v22-review-form').reset();$('v22-review-date').value=today();
   status('Second-person review note added. Physical qualification remains blocked.');
  }catch(err){status('Review rejected: '+err.message);}
 });
 function download(json,name){
  const b=new Blob([JSON.stringify(json,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(b),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1300);
 }
 $('v22-export').addEventListener('click',()=>{
  if(!record||!journal)return;
  download(researchInspectionPacket(journal,record),'aeroforge-x500-inspection-research-v22.json');
  status('Research packet exported locally. Observer data, notes and file hashes are included.');
 });
 $('v22-save').addEventListener('click',()=>{
  try{
   if(!journal)throw Error('No active journal');
   localStorage.setItem(KEY,JSON.stringify(validateInspectionJournal(journal)));
   status('This device now holds an opt-in copy. Exports and locally saved copies contain personal observation notes.');
  }catch(err){status('Device save failed: '+err.message);}
 });
 $('v22-restore').addEventListener('click',()=>{
  try{
   if(!record)throw Error('No aircraft record loaded');
   const raw=localStorage.getItem(KEY);
   if(!raw)throw Error('No saved copy exists on this device');
   rehydrate(JSON.parse(raw));
   status('Saved journal loaded. Entries for previous configurations are marked stale.');
  }catch(err){status('Restore failed: '+err.message);}
 });
 $('v22-delete-save').addEventListener('click',()=>{
  try{localStorage.removeItem(KEY);status('Device-stored journal copy cleared. The active session and downloaded exports are unchanged.');}
  catch(err){status('Could not clear device copy: '+err.message);}
 });
 $('v22-import').addEventListener('change',async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{
   if(!record)throw Error('Aircraft record not initialized');
   if(file.size>2*1024*1024)throw Error('Import is larger than 2 MB');
   const json=JSON.parse(await file.text());
   const journalData=json?.schema==='aeroforge/inspection-research-export/v2.2'?json.journal:json;
   rehydrate(journalData);
   status('Inspection data imported locally. This replaces the active session; no certification is conferred.');
  }catch(err){status('Import rejected: '+err.message);}
  finally{e.target.value='';}
 });
 window.addEventListener('aeroforge:x500-record-updated',e=>{
  if(e.detail?.record?.schema!=='aeroforge/x500-aircraft-record/v1.4')return;
  const incoming=e.detail.record;
  if(record?.revisionIdentity===incoming.revisionIdentity&&
   record?.variant===incoming.variant&&record?.selected?.batteryCells===incoming.selected.batteryCells)return;
  record=incoming;
  if(!journal)journal=startInspectionJournal(record);
  else journal=reconcileInspectionJournal(journal,record);
  render();
 });
 // Kit UI loads first. Request the current record, do not guess or compile a second kit selection.
 window.dispatchEvent(new Event('aeroforge:x500-record-requested'));
}
