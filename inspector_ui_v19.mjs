import {getCurrentDesign} from './app.mjs';
import {compileComponentInspector} from './core/component_inspector_v19.mjs';
import {researchRoleForShowcasePart} from './core/interface_registry_v21.mjs';
const $=id=>document.getElementById(id),host=$('af-inspector-v19');
if(host){
 let design=getCurrentDesign(),partId=null,plan=null;
 const make=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
 const insert=(parent,...elements)=>{parent.append(...elements);return parent;};
 const clear=()=>{for(const id of ['af-v19-current','af-v19-facts','af-v19-steps','af-v19-options','af-v19-source-list'])$(id).replaceChildren();};
 function render(){
  clear();
  if(!partId){$('af-v19-current').textContent='Select a component to see its role, alternatives, evidence and assembly steps.';return;}
  let card;try{card=compileComponentInspector(design,partId,{plan});}
  catch(err){$('af-v19-current').textContent='Selection unavailable: '+err.message;return;}
  $('af-v19-status').textContent='CONCEPT / NO VERIFIED SKU';
  insert($('af-v19-current'),make('strong',card.identity.selectedName||card.title),
   make('p',card.identity.kind==='ILLUSTRATIVE_SUBASSEMBLY_PROXY'?
    'Illustrative subassembly, not an independently identified purchasable part.':
    'Catalog class '+card.identity.selectedCatalogId+' · received revision and real SKU unknown.','af-v19-muted'));
  const researchRole=researchRoleForShowcasePart(partId);
  if(researchRole){
   const action=make('button','Explore X500 '+researchRole+' references ↗','af-v21-research-button');
   action.type='button';action.dataset.researchRole=researchRole;
   action.addEventListener('click',()=>{
    window.dispatchEvent(new CustomEvent('aeroforge:source-interface-research',
     {detail:{partId,role:researchRole}}));
   });
   $('af-v19-current').append(action);
   $('af-v19-current').append(make('p',
    'X500 references belong to a different aircraft family. This is research, not a substitution for the selected FPV part.',
    'af-v19-muted'));
  }
   if(card.designScreen.blockers.length)$('af-v19-current').append(make('p',
   card.designScreen.blockers.length+' design screening blocker(s). Physical fit remains unverified.','af-v19-blocker'));
  for(const f of card.specifications){
   const row=make('div','','af-v19-fact');
   insert(row,make('span',f.label),make('strong',f.value));$('af-v19-facts').append(row);
  }
  if(!card.specifications.length)$('af-v19-facts').append(make('p','No separate SKU or physical dimensions verified.','af-v19-muted'));
  $('af-v19-step-count').textContent=String(card.steps.length);
  for(const step of card.steps){
   const row=make('div','','af-v19-entry'),btn=make('button',step.title+' ↗');
   btn.type='button';btn.dataset.stepId=step.id;btn.addEventListener('click',()=>window.dispatchEvent(
    new CustomEvent('aeroforge:assembly-open-step',{detail:{stepId:step.id,planKey:card.assemblyContext?.planKey}})));
   insert(row,btn,make('p',step.stage+' · '+step.gate+' gate','af-v19-muted'));
   if(step.checks.length)row.append(make('p','Check: '+step.checks[0],'af-v19-muted'));
   $('af-v19-steps').append(row);
  }
  if(!card.steps.length)$('af-v19-steps').append(make('p','No matching current-plan assembly step.','af-v19-muted'));
  $('af-v19-alternative-count').textContent=String(card.alternatives.length);
  for(const alt of card.alternatives){
   const row=make('div','','af-v19-entry'),btn=make('button','Try this configuration ↗');
   const screening=alt.screen.status==='CONCEPT_SCREEN_BLOCKED'?
    alt.screen.blockers.length+' simulated screening blockers':
    alt.canPreview?'No simulated blockers, physical fit UNVERIFIED':'Screening unavailable';
   btn.type='button';btn.disabled=!alt.canPreview;btn.dataset.altId=alt.id;
   btn.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('aeroforge:select-catalog-alternative',
    {detail:{slot:card.identity.slot,id:alt.id}})));
   insert(row,make('strong',alt.name),make('p',screening+' · illustrative $'+alt.price+' (not live)','af-v19-muted'));
   if(alt.screen.blockers[0])row.append(make('p',alt.screen.blockers[0].why,'af-v19-blocker'));
   row.append(btn);$('af-v19-options').append(row);
  }
  if(!card.alternatives.length)$('af-v19-options').append(make('p','No independent candidate alternatives for this visual subassembly.','af-v19-muted'));
  $('af-v19-source-count').textContent=String(card.candidateSources.length);
  for(const source of card.candidateSources){
   const row=make('div','','af-v19-entry'),link=make('a','Read source specification ↗');
   if(/^https:\/\//.test(source.url)){link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';}
   insert(row,make('strong',source.title),make('p',source.status+' · reviewed '+source.reviewedAt,'af-v19-muted'),link);
   if(source.known.length)row.append(make('p','Documented: '+source.known.join('; '),'af-v19-muted'));
   if(source.unresolved.length)row.append(make('p','Unresolved: '+source.unresolved.join('; '),'af-v19-muted'));
   $('af-v19-source-list').append(row);
  }
  if(!card.candidateSources.length)$('af-v19-source-list').append(make('p',
   'No source-backed item attached to this catalog class. No qualified order link exists.','af-v19-muted'));
 }
 window.addEventListener('aeroforge:showcase-part-selected',e=>{if(e.detail?.partId){partId=e.detail.partId;render();}});
 window.addEventListener('aeroforge:design-updated',e=>{if(e.detail?.result){design=e.detail.result;render();}});
 window.addEventListener('aeroforge:assembly-context-updated',e=>{if(e.detail?.plan?.schema==='aeroforge/assembly-plan/v0.8'){plan=e.detail.plan;render();}});
 window.addEventListener('aeroforge:assembly-context-cleared',()=>{plan=null;render();});
 window.addEventListener('aeroforge:workspace-changed',e=>{if(e.detail?.workspace==='build')window.dispatchEvent(new Event('aeroforge:assembly-context-requested'));});
 render();window.dispatchEvent(new Event('aeroforge:assembly-context-requested'));
}
