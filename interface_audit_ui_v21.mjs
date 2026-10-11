/** v2.1 X500 interface research: no wiring or procurement approval. */
import {compileX500InterfaceAudit,interfacePartsForSlot,
 researchRoleForShowcasePart,interfaceSourcePacket}
 from './core/interface_registry_v21.mjs';
const $=id=>document.getElementById(id),host=$('v21-interface-audit');
if(host){
 let variant='six_c',batteryCells=4,role='motor',motorId='x500-motor-cw';
 const make=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const researchLink=(url)=>{
  const a=make('a','Manufacturer source ↗','v21-source-link');
  if(/^https:\/\//.test(url)){a.href=url;a.target='_blank';a.rel='noopener noreferrer';}
  return a;
 };
 const detail=(parent,title,desc)=>{const row=make('div','','v21-info-row');row.append(make('strong',title),make('span',desc));parent.append(row);};
 function render(){
  const audit=compileX500InterfaceAudit({variant,batteryCells,motorId});
  $('v21-status').textContent=audit.status.replaceAll('_',' ')+' · '+audit.openHoldCount+' interface holds';
  $('v21-warning').textContent=audit.blocking.length?
   audit.blocking.join('; ')+' · No physical connection or bench-power authorization.':
   'Family-level connector evidence only. Inspect exact SKU revision, gender, wiring, polarity and mounting before planning physical assembly.';
  const selectedIds=new Set(audit.references.map(x=>x.id));
  const list=$('v21-part-list');list.replaceChildren();
  const candidates=role==='motor'?interfacePartsForSlot('motor'):
   interfacePartsForSlot(role);
  for(const p of candidates){
   const box=make('article','','v21-part');
   const head=make('div','','v21-part-head');
   head.append(make('strong',p.label),make('span',
    (selectedIds.has(p.id)?'CURRENT FAMILY · ':'ALTERNATIVE · ')+
    (p.sku?'published SKU '+p.sku:'no verified received SKU')));
   box.append(head,make('p','Source status: '+p.status.replaceAll('_',' ')+' · received revision UNKNOWN','v21-note'));
   for(const v of p.claims)detail(box,v.key.replaceAll('_',' '),Array.isArray(v.value)?v.value.join(' / '):String(v.value));
   for(const port of p.interfaces)detail(box,
    port.name+' · '+port.interfaceFamily.replaceAll('_',' '),
    'Connector gender, pinout, polarity and delivered revision remain unverified');
   const more=make('details','','v21-source-detail');
   more.append(make('summary','Required inspection checks'));
   const ul=make('ul');
   for(const h of p.holds)ul.append(make('li',h));
   more.append(ul);box.append(more,researchLink(p.source.url));list.append(box);
  }
  const edges=$('v21-edges');edges.replaceChildren();
  for(const edge of audit.edges){
   const card=make('div','','v21-connection');
   card.append(make('strong',edge.aId+' ↔ '+edge.bId));
   card.append(make('p',edge.role+' · '+edge.status.replaceAll('_',' '),'v21-note'));
   if(edge.intersections?.length)card.append(make('p','Shared published family: '+
     edge.intersections.map(p=>p.family).join(', ')+'; mating unverified','v21-note'));
   else card.append(make('p','No verified shared connector or measured mechanical datum','v21-note'));
   const ul=make('ul');
   for(const item of edge.requiredReview)ul.append(make('li',item));
   card.append(ul);edges.append(card);
  }
  for(const e of audit.supplemental){
   const line=make('div','','v21-connection');
   line.append(make('strong',e.id.replaceAll('-',' ')+' · '+e.status.replaceAll('_',' ')));
   const ul=make('ul');for(const check of e.checks)ul.append(make('li',check));
   line.append(ul);edges.append(line);
  }
  $('v21-count').textContent=String(audit.openHoldCount)+' open';
  $('v21-current').textContent='X500 '+(variant==='six_c'?'Pixhawk 6C':'Pixhawk 6X')+' · '+batteryCells+
   'S · '+candidates.length+' published family reference(s) · exact delivered parts uninspected';
 }
 $('v21-role').addEventListener('change',e=>{role=e.target.value;render();});
 $('v21-motor').addEventListener('change',e=>{motorId=e.target.value;render();});
 $('v21-export').addEventListener('click',()=>{
  const packet=interfaceSourcePacket({variant,batteryCells,motorId});
  const data=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(data),a=document.createElement('a');
  a.href=url;a.download='aeroforge-x500-'+variant+'-interface-research-v21.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 window.addEventListener('aeroforge:x500-record-updated',e=>{
  const r=e.detail?.record;
  if(r?.schema==='aeroforge/x500-aircraft-record/v1.4'){
   variant=r.variant;batteryCells=r.selected.batteryCells;render();
  }
 });
 window.addEventListener('aeroforge:source-interface-research',e=>{
  const partId=e.detail?.partId;
  const incomingRole=researchRoleForShowcasePart(partId);
  const available=['motor','esc','pdb','power-module','controller','frame'];
  role=available.includes(incomingRole)?incomingRole:'motor';
  $('v21-role').value=role;
  host.open=true;
  $('v21-edge-disclosure').open=false;render();
  window.location.hash='x500-kit-lab';
  requestAnimationFrame(()=>host.scrollIntoView({behavior:'instant',block:'start'}));
 });
 render();
}
