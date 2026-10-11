import {SCENARIOS,SCENARIO_BY_ID} from './core/mission_lab_v09.mjs';
import {buildMissionScene,compileMissionBuildHandoff} from './core/architecture_v10.mjs';
const $=id=>document.getElementById(id);
const host=$('mission-v10');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(host){
 let scene=null,handoff=null,viewer=null,currentId=null,optional=[],selected=null;
 const fallback=$('mission-v10-fallback');
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 function file(content,name,type){
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function select(id){
  const node=scene?.nodes.find(x=>x.id===id)||null;
  selected=node?.id??null;
  if(viewer){viewer.selectPart(selected);}
  $('mission-v10-selected').textContent=node?node.label:'Select a part in the model or the component list';
  $('mission-v10-selected-status').textContent=node?
   (node.kind==='module'?'PROPOSED '+node.category.toUpperCase()+' MOUNT / FIT UNVERIFIED':
    'ILLUSTRATIVE '+node.kind.toUpperCase()+' / NO MEASURED GEOMETRY'):'NO PART SELECTED';
  const requirement=node?.moduleId?scene.moduleRequirements.find(m=>m.moduleId===node.moduleId):null;
  $('mission-v10-details').innerHTML=requirement?
  '<div class="v10-meta"><b>Proposed mount</b><span>'+esc(requirement.proposedSlot??'Unassigned')+'</span>'+
  '<b>Integration interface</b><span>'+esc(requirement.interfaceClass)+'</span>'+
  '<b>Required real measurements</b><span>SKU + revision, 3D envelope, mass, mounting dimensions, electrical supply/current, connector and pinout source</span>'+
  '<b>Open evidence</b><span>'+esc(requirement.evidence)+'</span></div>':
  '<p>The object is only a visual proxy. Motor coordinates, thrust, frame strength and propeller clearance are unknown.</p>';
  $('mission-v10-part-list').querySelectorAll('[data-node-id]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.nodeId===selected)));
 }
 function renderParts(){
  // Airframe & propulsion proxies are present as nodes; modules are selectable individually.
  $('mission-v10-part-list').innerHTML=scene.nodes.map(n=>
   '<button type="button" class="mission-v10-part" data-node-id="'+esc(n.id)+'" aria-pressed="false">'+
   '<span class="v10-node-icon">'+(n.kind==='module'?'⬡':n.kind==='rotor'?'✳':n.kind==='wing'?'◢':'◈')+'</span>'+
   '<span><strong>'+esc(n.label)+'</strong><small>'+esc(n.kind==='module'?n.category+' · '+n.slot:n.kind)+'</small></span></button>'
  ).join('');
 }
 function renderHandoff(){
  const missing=scene.moduleRequirements.filter(x=>!x.proposedSlot||x.slotState==='UNASSIGNED_CAPACITY_HOLD');
  $('mission-v10-stats').textContent=scene.rotorCount+' lift rotors · '+scene.counts.assigned+
   ' placed module proxies · '+scene.counts.unassigned+' unassigned · '+handoff.steps.length+' worklist stages';
  $('mission-v10-worklist').innerHTML=handoff.steps.map((s,i)=>
   '<details><summary><span>'+String(i+1).padStart(2,'0')+'</span> '+esc(s.title)+
   ' <small>'+esc(s.stage)+' · HOLD</small></summary><p>'+s.checks.map(esc).join(' · ')+'</p>'+
   '<small>Prerequisites: '+esc(s.requires.join(', ')||'None')+'</small></details>').join('');
  $('mission-v10-unassigned').textContent=missing.length?
   missing.map(x=>x.moduleId).join(', ')+' have no available visual mount. Provide source-specific bracket geometry or reconsider the airframe.':
   'All visual proxy modules assigned a storyboard position. This does NOT establish physical clearance, mass or power compatibility.';
 }
 function update(scenarioId,extra=[]){
  const next=buildMissionScene(scenarioId,extra),work=compileMissionBuildHandoff(next);
  currentId=scenarioId;optional=[...extra];scene=next;handoff=work;
  $('mission-v10-title').textContent=next.scenario.name+' / 3D architecture';
  $('mission-v10-authority').textContent=next.authority.replaceAll('_',' ');
  renderParts();renderHandoff();
  if(viewer)try{viewer.setScene(next);viewer.setExplosion(Number($('mission-v10-explode').value)/100);}catch(e){setError('3D view error: '+e.message);}
  select(null);
 }
 function setError(msg){
  $('mission-v10-render-status').textContent=msg;
  fallback.hidden=false;
 }
 $('mission-v10-part-list').addEventListener('click',e=>{
  const el=e.target.closest('[data-node-id]');if(el)select(el.dataset.nodeId);
 });
 $('mission-v10-explode').addEventListener('input',e=>{
  const ratio=Number(e.target.value)/100;
  $('mission-v10-explode-value').textContent=Math.round(ratio*100)+'%';
  if(viewer)viewer.setExplosion(ratio);
 });
 $('mission-v10-reset').addEventListener('click',()=>{
  $('mission-v10-explode').value='0';$('mission-v10-explode-value').textContent='0%';
  viewer?.setExplosion(0);select(null);
 });
 $('mission-v10-export-layout').addEventListener('click',()=>{
  file(JSON.stringify(scene,null,2)+'\n','aeroforge-'+currentId+'-visual-layout-v10.json','application/json');
 });
 $('mission-v10-export-worklist').addEventListener('click',()=>{
  file(JSON.stringify(handoff,null,2)+'\n','aeroforge-'+currentId+'-assembly-handoff-v10.json','application/json');
 });
 $('mission-v10-export-md').addEventListener('click',()=>{
  const l=['# '+scene.scenario.name+' · Mission assembly worklist',
   '','DESIGN AUTHORITY: '+scene.authority,'',
   'All measurements, physical fit and wiring qualification are UNVERIFIED. No power-on or flight approval.','','## Module requirements'];
  for(const m of scene.moduleRequirements)l.push('- '+m.moduleId+' · '+m.category+' · slot '+(m.proposedSlot||'UNASSIGNED')+
   ' · '+m.interfaceClass+' · '+m.evidence);
  l.push('','## Ordered evidence-gated work stages');
  for(const s of handoff.steps)l.push('### '+s.title,'Gate: '+s.gate,'Requires: '+(s.requires.join(', ')||'none'),
   ...s.checks.map(c=>'- '+c),'');
  file(l.join('\n')+'\n','aeroforge-'+currentId+'-assembly-worklist-v10.md','text/markdown');
 });
 window.addEventListener('aeroforge:mission-updated',e=>{
  if(e.detail?.report?.concept?.id){
   const report=e.detail.report;
   update(report.concept.id,report.selectedIds.filter(id=>!report.concept.modules.includes(id)));
  }
 });
 // This module may initialize before the v0.9 controller; use a deterministic default.
 update(SCENARIOS[0].id);
 import('./mission_3d_v10.mjs').then(mod=>{
  try{
   viewer=mod.createMissionSceneViewer($('mission-v10-canvas'),id=>select(id));
   viewer.setScene(scene);
   viewer.setExplosion(Number($('mission-v10-explode').value)/100);
   fallback.hidden=true;
   $('mission-v10-render-status').textContent='3D active · Drag to orbit · Scroll to zoom · Click a part';
  }catch(e){setError('2D fallback / WebGL unavailable: '+e.message);}
 }).catch(e=>setError('2D fallback / Three.js unavailable: '+e.message));
 window.addEventListener('beforeunload',()=>viewer?.dispose(),{once:true});
}
