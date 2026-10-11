/** v2.0 source SKU research, not a shopping or procurement control. */
import {SOURCE_SKUS,findSourceSku,inspectSourceSku,diffSourceSku,
  createSourcingResearchPacket} from './core/source_catalog_v20.mjs';

const $=id=>document.getElementById(id),host=$('v20-source-catalog');
if(host){
 let currentVariant=$('v06-kit-variant')?.value||'six_c';
 let cells=Number($('v06-kit-cells')?.value||4);
 let attached=null;
 const make=(tag,content='',cls='')=>{
  const n=document.createElement(tag);n.textContent=content;
  if(cls)n.className=cls;return n;
 };
 const msg=s=>{$('v20-feedback').textContent=s;};
 function update(){
  const sku=$('v20-primary').value;
  const item=findSourceSku(sku);
  const evaluation=inspectSourceSku(sku,{selectedVariant:currentVariant,batteryCells:cells});
  $('v20-title').textContent=item.manufacturer+' · '+item.model;
  $('v20-subtitle').textContent='Published SKU '+sku+' · '+item.label+' · '+item.lifecycle.replaceAll('_',' ');
  $('v20-facts').replaceChildren();
  for(const claim of item.claims){
   const line=make('div','','v20-fact');
   const value=Array.isArray(claim.value)?claim.value.join(' × '):String(claim.value);
   line.append(make('span',claim.key.replaceAll('_',' ')),
    make('strong',value));
   $('v20-facts').append(line);
  }
  $('v20-holds').replaceChildren();
  const conflicts=[...item.conflicts.map(t=>'SOURCE DISCREPANCY: '+t),...evaluation.holds];
  for(const c of conflicts)$('v20-holds').append(make('li',c));
  $('v20-reviewed').textContent='Source snapshot '+item.source.reviewed+
    ' · no real-time stock, delivery revision or live pricing';
  const link=$('v20-official-source');
  link.href=item.source.url;link.textContent='Manufacturer reference ↗';
  $('v20-listing').textContent=item.listedPriceUsd==null?
   'No listed price saved':('$'+item.listedPriceUsd+' manufacturer page snapshot · not live');
  const canAttach=item.group==='complete-kit'&&item.variant===currentVariant&&cells===4;
  $('v20-use').disabled=!canAttach;
  $('v20-use').textContent=canAttach?'Link as research candidate':'Change kit settings to match first';
  $('v20-use').hidden=item.group!=='complete-kit';
  $('v20-status').textContent=evaluation.blockCount?'Compatibility blocking mismatch':
   'Published identity only · checks unresolved';
  if(attached&&attached!==sku)msg('Viewing a different SKU. The linked research candidate has not changed.');
 }
 function renderComparison(){
  const left=$('v20-primary').value,right=$('v20-secondary').value;
  const diff=diffSourceSku(left,right);
  $('v20-compare-table').replaceChildren();
  for(const field of diff.rows){
   const row=make('tr');
   row.append(make('th',field.key.replaceAll('_',' ')));
   row.append(make('td',field.left==null?'Unresolved':String(field.left)));
   row.append(make('td',field.right==null?'Unresolved':String(field.right)));
   if(field.changed)row.className='v20-diff';
   $('v20-compare-table').append(row);
  }
  $('v20-compare-caption').textContent='Published identity comparison only. Each still requires received-part and compatibility verification.';
 }
 function download(){
  const packet=createSourcingResearchPacket($('v20-primary').value,{selectedVariant:currentVariant,batteryCells:cells});
  const b=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(b),a=document.createElement('a');
  a.href=url;a.download='aeroforge-sourcing-research-'+packet.item.sku+'.json';
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 for(const item of SOURCE_SKUS){
  const group=item.group==='complete-kit'?'Complete kits':item.group==='frame'?'Frames':'FC / ESC stacks';
  const opt=make('option',item.sku+' · '+item.label);
  opt.value=item.sku;opt.dataset.group=item.group;
  $('v20-primary').append(opt);
  const compare=opt.cloneNode(true);$('v20-secondary').append(compare);
 }
 $('v20-primary').value='30189';
 $('v20-secondary').value='30199';
 $('v20-primary').addEventListener('change',()=>{update();renderComparison();});
 $('v20-secondary').addEventListener('change',renderComparison);
 $('v20-compare-toggle').addEventListener('toggle',()=>{if($('v20-compare-toggle').open)renderComparison();});
 $('v20-use').addEventListener('click',()=>{
  const sku=$('v20-primary').value,item=findSourceSku(sku);
  if(!item||item.group!=='complete-kit'||item.variant!==currentVariant||cells!==4){
   msg('Cannot link: choose a matching X500 controller family and documented 4S screening selection.');return;
  }
  attached=sku;
  window.dispatchEvent(new CustomEvent('aeroforge:sourcing-reference-selected',{detail:{sku}}));
  msg('Source SKU '+sku+' linked as RESEARCH ONLY. Received hardware, connector revisions, fit and purchasing remain unverified.');
 });
 $('v20-export').addEventListener('click',download);
 window.addEventListener('aeroforge:x500-record-updated',e=>{
  const record=e.detail?.record;
  if(record?.schema!=='aeroforge/x500-aircraft-record/v1.4')return;
  currentVariant=record.variant;cells=record.selected.batteryCells;
  attached=record.sourceCatalogCandidate?.sku||null;
  const linked=$('v20-linked');
  linked.textContent=attached?'Research reference '+attached+' linked · NOT VERIFIED':'No exact kit SKU linked';
  if(attached){
   const match=findSourceSku(attached);
   if(match?.group==='complete-kit')$('v20-primary').value=attached;
  }
  update();
  if($('v20-compare-toggle').open)renderComparison();
 });
 update();renderComparison();
}
