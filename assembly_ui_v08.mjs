import {getCurrentDesign} from './app.mjs';
import {compileBuildPlan,newBuildSession,reconcileBuildSession,recordObservation,stepStatus,sessionSummary,buildPacket} from './core/assembly_v08.mjs';

const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE='aeroforge.assembly.v08.local-only';
const host=$('assembly-v08');
if(host){
 let design=getCurrentDesign(),plan=null,session=null,active=0;
 const exportText=(data,name,type)=>{
  const url=URL.createObjectURL(new Blob([data],{type}));const link=document.createElement('a');
  link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 function chooseParts(){
  const list=design?.parts||{},settings=design?.settings||{};
  const names={};for(const k of ['frame','motor','prop','stack','battery','video']){
    names[k]=String(list[k]?.id??settings[k]??'unresolved');
  }
  names.receiver=$('assembly-rx').value.trim()||'unresolved';
  names.radio=$('assembly-radio').value.trim()||'unresolved';
  if($('assembly-track').value==='px4'){
   names.frame='holybro-x500-v2-reference';
   names.motor='holybro-2216-kv920-reference';
   names.prop='holybro-1045-reference';
   names.stack=$('assembly-variant').value==='six_c'?'pixhawk-6c-reference':'pixhawk-6x-reference';
   names.battery='unresolved-4s-pack';
   names.video='unresolved-research-camera';
  }
  return names;
 }
 function settings(){return{track:$('assembly-track').value,videoSystem:$('assembly-video').value,variant:$('assembly-variant').value,selection:chooseParts()};}
 function persist(){
  try{localStorage.setItem(STORAGE,JSON.stringify(session));$('assembly-storage').textContent='Saved locally on this browser';}
  catch(e){$('assembly-storage').textContent='Local save unavailable; use export to retain your work.';}
 }
 function saved(){
  try{const s=localStorage.getItem(STORAGE);if(!s||s.length>400000)return null;return JSON.parse(s);}catch{return null;}
 }
 function rebuild(){
  try{
   const previous=plan;plan=compileBuildPlan(settings());
   if(!session){const stored=saved();session=stored?reconcileBuildSession(stored,plan):newBuildSession(plan);}
   else if(previous?.key!==plan.key)session=reconcileBuildSession(session,plan);
   active=Math.max(0,Math.min(plan.steps.length-1,active));persist();render();
  }catch(e){$('assembly-alert').textContent='Assembly plan error: '+e.message;}
 }
 function current(){return plan.steps[active];}
 function sourceAnchor(source){
  if(!source)return '<span class="assembly-no-source">No source-specific instruction available: verify the exact manufacturer manual.</span>';
  if(!/^https:\/\/(www\.youtube\.com|docs\.px4\.io|docs\.holybro\.com|betaflight\.com)\//.test(source.url))return 'Source URL not approved.';
  return '<a href="'+escapeHTML(source.url)+'" target="_blank" rel="noopener noreferrer">↗ '+escapeHTML(source.label)+'</a>';
 }
 function render(){
  if(!plan||!session)return;
  const summary=sessionSummary(session,plan),step=current(),status=stepStatus(session,plan,step.id),entry=session.entries[step.id];
  $('assembly-plan-heading').textContent=(plan.track==='px4'?'PX4 / X500 V2 evidence path':'FPV / Betaflight learning path')+' · '+plan.steps.length+' stages';
  $('assembly-plan-key').textContent='Plan '+plan.key+' · '+plan.modelAuthority.replaceAll('_',' ');
  $('assembly-progress').textContent=summary.withNotes+'/'+summary.total+' steps have observations · '+summary.invalidated+' invalidated records';
  $('assembly-alert').textContent='Neither records nor tutorial completion validate physical electrical safety or permit power-on/flight. All '+summary.unresolvedSafetyGates+' safety-relevant stages require independent external review.';
  $('assembly-step-rail').innerHTML=plan.steps.map((s,i)=>{
   const x=stepStatus(session,plan,s.id);
   return '<button type="button" class="assembly-rail-step'+(active===i?' current':'')+'" data-step-id="'+escapeHTML(s.id)+'" aria-current="'+(active===i?'step':'false')+'"><span class="assembly-index">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+escapeHTML(s.title)+'</strong><small>'+escapeHTML(s.stage)+' · '+(x.recorded?'Note recorded':x.blocker?'Needs earlier observations':'Open')+'</small></span><span class="assembly-dot '+(x.recorded?'noted':'')+'"></span></button>';
  }).join('');
  $('assembly-step-title').textContent=step.title;
  $('assembly-step-stage').textContent=step.stage+' · '+(active+1)+' of '+plan.steps.length;
  $('assembly-step-description').textContent=step.about;
  $('assembly-step-status').textContent=status.status.replaceAll('_',' ');
  $('assembly-step-status').dataset.status=status.status;
  $('assembly-dependencies').textContent='Earlier steps: '+(step.requires.join(', ')||'none')+(status.prerequisitesMissing.length?' · Still missing notes: '+status.prerequisitesMissing.join(', '):'');
  $('assembly-step-warning').textContent=step.warning;
  $('assembly-parts').innerHTML=step.parts.map(id=>'<button type="button" data-part-id="'+escapeHTML(id)+'" title="Focus related part in the exploded-view showcase">'+escapeHTML(id)+' ↗</button>').join(' ');
  $('assembly-tools').innerHTML=(step.tools.length?step.tools:['Reference manual; no tool spec established']).map(x=>'<li>'+escapeHTML(x)+'</li>').join('');
  $('assembly-checks').innerHTML=(step.checks.length?step.checks:['Confirm model and source revision before action']).map(x=>'<li>'+escapeHTML(x)+'</li>').join('');
  $('assembly-source').innerHTML=sourceAnchor(step.source);
  $('assembly-observations').innerHTML=(entry?.receipts||[]).map(r=>
   '<li><strong>'+escapeHTML(r.kind.toUpperCase())+' · SELF-REPORTED</strong><span>'+escapeHTML(r.note)+
   (r.kind==='measurement'?' ('+escapeHTML(String(r.value))+' '+escapeHTML(r.unit)+')':'')+
   '</span><small>'+escapeHTML(r.recordedAt)+' · '+escapeHTML(r.source)+'</small></li>'
  ).join('')||'<li class="assembly-empty">No work recorded for this step.</li>';
  $('assembly-prev').disabled=active===0;$('assembly-next').disabled=active===plan.steps.length-1;
  $('assembly-review-count').textContent=summary.invalidated?'⚠ '+summary.invalidated+' previous step records invalidated by revisions':'No stale observations recorded';
  const measurement=$('assembly-kind').value==='measurement';
  $('assembly-value-field').hidden=!measurement;$('assembly-unit-field').hidden=!measurement;
 }
 function navigate(stepIndex){active=Math.max(0,Math.min(plan.steps.length-1,stepIndex));$('assembly-note').value='';render();}
 function saveObservation(){
  const step=current();const kind=$('assembly-kind').value;
  const evidence={kind,note:$('assembly-note').value,source:$('assembly-origin').value.trim()||'personal-notes'};
  if(kind==='measurement'){const raw=$('assembly-value').value.trim();evidence.value=raw?Number(raw):NaN;evidence.unit=$('assembly-unit').value.trim();}
  try{
   // Always self-reported; no pass/approval API exists. Prerequisites are reported, never waived.
   session=recordObservation(session,plan,step.id,evidence);persist();$('assembly-note').value='';$('assembly-value').value='';render();
   $('assembly-storage').textContent='Observation saved LOCALLY. Independent verification still required.';
  }catch(e){$('assembly-storage').textContent=e.message;}
 }
 $('assembly-track').addEventListener('change',()=>{
  const px4=$('assembly-track').value==='px4';$('assembly-px4-options').hidden=!px4;$('assembly-fpv-options').hidden=px4;active=0;rebuild();
 });
 for(const id of ['assembly-video','assembly-variant','assembly-rx','assembly-radio'])$(id).addEventListener('change',rebuild);
 $('assembly-kind').addEventListener('change',render);
 $('assembly-step-rail').addEventListener('click',e=>{
  const b=e.target.closest('[data-step-id]');if(b){const i=plan.steps.findIndex(s=>s.id===b.dataset.stepId);if(i>=0)navigate(i);}
 });
 $('assembly-parts').addEventListener('click',e=>{
  const b=e.target.closest('[data-part-id]');if(!b)return;
  window.dispatchEvent(new CustomEvent('aeroforge:assembly-focus-part',{detail:{partId:b.dataset.partId}}));
 });
 window.addEventListener('aeroforge:showcase-part-selected',e=>{
  const id=e.detail?.partId;if(!id||!plan)return;
  const index=plan.steps.findIndex(s=>s.parts.includes(id));if(index>=0&&index!==active)navigate(index);
 });
 $('assembly-prev').addEventListener('click',()=>navigate(active-1));
 $('assembly-next').addEventListener('click',()=>navigate(active+1));
 $('assembly-save').addEventListener('click',saveObservation);
 $('assembly-export-json').addEventListener('click',()=>exportText(JSON.stringify({plan,session,summary:sessionSummary(session,plan)},null,2)+'\n','aeroforge-assembly-'+plan.key+'.json','application/json'));
 $('assembly-export-md').addEventListener('click',()=>exportText(buildPacket(session,plan),'aeroforge-build-packet-'+plan.key+'.md','text/markdown'));
 $('assembly-reset').addEventListener('click',()=>{
  if(!window.confirm('Archive your current notes with Export first. Reset local assembly observations?'))return;
  session=newBuildSession(plan);persist();navigate(0);
 });
 $('assembly-kind').value='note';
 window.addEventListener('aeroforge:design-updated',e=>{if(e.detail?.result){design=e.detail.result;rebuild();}});
 rebuild();
}
