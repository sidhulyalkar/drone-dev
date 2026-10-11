/** v2.3 optional collapsed check-level research panel. No automatic device persistence. */
import {startInterfaceEvidenceLinks,reconcileInterfaceEvidenceLinks,appendInterfaceEvidenceLink,
 interfaceEvidenceMatrix,validateInterfaceEvidenceLinks} from './core/interface_evidence_v23.mjs';
const host=document.getElementById('v22-inspection');
if(host){
 let record=null,journal=null,links=null,cadProposal=null;
 const make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text??'';return n;};
 const panel=make('details'),head=make('summary','Interface evidence checklist · research only');
 panel.id='v23-checklist';
 const note=make('p','All connector, power and fit holds remain open. Linked observations are not independently verified.');
 const overview=make('p'),sections=make('div'),feedback=make('p');
 feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 const form=make('form'),edgeSelect=make('select'),checkSelect=make('select'),obsSelect=make('select');
 const rationale=make('textarea');rationale.placeholder='Why does this observation pertain to this exact check?';rationale.required=true;rationale.minLength=12;rationale.maxLength=1200;rationale.rows=2;
 const label=(text,el)=>{const x=make('label',text+' ');x.append(el);return x;};
 const submit=make('button','Link observation to unresolved check');submit.type='submit';
 const exportButton=make('button','Export link research JSON');exportButton.type='button';
 const importLabel=make('label','Import links JSON '),importInput=make('input');
 importInput.type='file';importInput.accept='application/json,.json';importLabel.append(importInput);
 form.append(label('Interface',edgeSelect),label('Check',checkSelect),label('Current observation',obsSelect),
  label('Specific relevance',rationale),submit);
 panel.append(head,note,overview,sections,form,exportButton,importLabel,feedback);
 host.append(panel);
 function refill(select,options,preserve){
  const old=preserve?select.value:null;select.replaceChildren();
  for(const [value,title] of options){const o=make('option',title);o.value=value;select.append(o);}
  if(old&&options.some(x=>x[0]===old))select.value=old;
 }
 function render(){
  if(!record||!journal)return;
  if(!links)links=startInterfaceEvidenceLinks(record);
  const m=interfaceEvidenceMatrix(links,journal,record);
  overview.textContent=m.checksWithReceipts+' of '+m.totalChecks+
   ' checks have current self-reported evidence. '+m.unqualifiedChecks+' remain unqualified.';
  refill(edgeSelect,m.edges.map(x=>[x.edgeId,x.edgeId.replaceAll('-',' ')+' · '+x.sourceStatus]),true);
  const chosen=m.edges.find(x=>x.edgeId===edgeSelect.value)??m.edges[0];
  refill(checkSelect,chosen.checks.map(x=>[String(x.checkIndex),x.requirement]),true);
  const current=journal.events.filter(x=>x.type==='observation'&&
   x.context.revisionIdentity===record.revisionIdentity&&x.context.variant===record.variant&&
   x.context.batteryCells===record.selected.batteryCells&&chosen.partRefs.includes(x.payload.partRef));
  refill(obsSelect,current.map(x=>[x.id,x.id+' · '+x.payload.partRef]),true);
  submit.disabled=!current.length;
  sections.replaceChildren();
  for(const edge of m.edges){
   const group=make('details'),sum=make('summary',edge.edgeId.replaceAll('-',' ')+' · '+
    edge.checks.filter(x=>x.currentEvidenceCount>0).length+'/'+edge.checks.length+' with receipts');
   group.append(sum);
   for(const url of edge.sourceUrls??[]){
    if(!/^https:\/\//.test(url))continue;
    const a=make('a','Manufacturer source ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
    group.append(a,make('span','  '));
   }
   const ul=make('ul');
   for(const c of edge.checks){
    const row=make('li',c.requirement+' · '+
     (c.currentEvidenceCount?'USER EVIDENCE LINKED, UNVERIFIED':'EVIDENCE MISSING'));
    if(edge.edgeId==='frame-motor'&&c.checkIndex===1&&cadProposal?.schema==='aeroforge/x500-cad-mating-proposal/v2.4'){
     row.append(make('p','Unverified dual-source CAD pose available: frame '+cadProposal.frame.sourceSha256.slice(0,12)+
      ' / motor '+cadProposal.motor.sourceSha256.slice(0,12)+
      '. Mounting datums remain unresolved; this does not count as inspection evidence.'));
    }
    for(const l of c.links){
     row.append(make('p',l.observationId+' · '+l.status+
      (l.reviewRecorded?' · second-person review note':'')+' · '+l.rationale));
     if(['CHECK_DEFINITION_CHANGED','LEGACY_CHECK_BINDING_REQUIRED',
       'LEGACY_RECEIPT_BINDING_REQUIRED','RECEIPT_CHANGED_OR_REPLACED'].includes(l.status))
      row.append(make('p','Historic/unbound association only. Check that the original observation and requirement match, then explicitly link the correct current receipt.'));
    }
    const attach=make('button','Select this check');
    attach.type='button';
    attach.addEventListener('click',()=>{
     edgeSelect.value=edge.edgeId;
     render();
     checkSelect.value=String(c.checkIndex);
     form.scrollIntoView({block:'nearest'});
     obsSelect.focus();
    });
    row.append(attach);
    ul.append(row);
   }
   group.append(ul);sections.append(group);
  }
 }
 edgeSelect.addEventListener('change',render);
 form.addEventListener('submit',e=>{
  e.preventDefault();
  try{
   links=appendInterfaceEvidenceLink(links,journal,record,{edgeId:edgeSelect.value,
    checkIndex:Number(checkSelect.value),observationId:obsSelect.value,rationale:rationale.value});
   rationale.value='';render();feedback.textContent='Research link recorded; no hardware check is qualified.';
  }catch(err){feedback.textContent='Could not link evidence: '+err.message;}
 });
 exportButton.addEventListener('click',()=>{
  if(!links)return;
  const blob=new Blob([JSON.stringify(validateInterfaceEvidenceLinks(links),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download='aeroforge-v23-evidence-links.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  feedback.textContent='Links exported. Keep with the matching v2.2 journal; no private files are included.';
 });
 importInput.addEventListener('change',async()=>{
  const file=importInput.files?.[0];if(!file)return;
  try{
   if(file.size>2*1024*1024)throw Error('2 MB JSON limit');
   const incoming=validateInterfaceEvidenceLinks(JSON.parse(await file.text()));
   if(!record)throw Error('Aircraft context missing');
   links=reconcileInterfaceEvidenceLinks(incoming,record);
   render();feedback.textContent='Research links imported; old revision links remain stale.';
  }catch(err){feedback.textContent='Import rejected: '+err.message;}
  finally{importInput.value='';}
 });
 window.addEventListener('aeroforge:x500-record-updated',e=>{
  const r=e.detail?.record;if(r?.schema!=='aeroforge/x500-aircraft-record/v1.4')return;
  const changed=record&&(record.revisionIdentity!==r.revisionIdentity||record.variant!==r.variant||record.selected.batteryCells!==r.selected.batteryCells);
  if(changed)cadProposal=null;
  record=r;if(links)links=reconcileInterfaceEvidenceLinks(links,r);render();
 });
 window.addEventListener('aeroforge:cad-mating-proposal-updated',e=>{
  cadProposal=e.detail?.proposal??null;render();
 });
 window.addEventListener('aeroforge:inspection-journal-updated',e=>{
  journal=e.detail?.journal??null;render();
 });
 window.dispatchEvent(new Event('aeroforge:x500-record-requested'));
}
