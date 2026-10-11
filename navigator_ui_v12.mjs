/**
 * AeroForge v1.7: minimal workspace router.
 * Keeps ALL existing DOM/renderers/forms mounted; never throws away engineering evidence.
 */
import {WORKSPACES,workspaceForRoot,selectWorkspaceFromLocation} from './core/workspace_v17.mjs';
const nav=document.getElementById('workflow-v12');
const main=document.querySelector('main');
if(nav&&main){
 const controls=WORKSPACES.map(id=>document.getElementById('af-workspace-'+id)).filter(Boolean);
 const roots=[...main.children];
 const groups=new Map(roots.map(root=>{
  const id=root.id||'';
  const group=workspaceForRoot(id,[...root.classList]);
  root.dataset.afWorkspace=group;
  return [root,group];
 }));
 const status=document.getElementById('workflow-v12-status');
 const toolMenu=document.getElementById('af-tool-menu');
 const toolLinks=[...nav.querySelectorAll('.workflow-v12-links a[href^="#"]')];
 let current=null;
 const effectiveHash=()=>{
  try{return decodeURIComponent(window.location.hash.replace(/^#/,''));}
  catch{return window.location.hash.replace(/^#/,'');}
 };
 function workspaceForTarget(id){
  const target=document.getElementById(id);
  if(!target)return null;
  let top=target;
  while(top&&top.parentElement!==main)top=top.parentElement;
  return top?groups.get(top)??null:null;
 }
 function show(group,{writeUrl=false,scrollTop=false}={}){
  if(!WORKSPACES.includes(group))return;
  const changed=current!==group;
  current=group;
  for(const [root,kind] of groups)root.hidden=kind!==group;
  document.documentElement.dataset.afWorkspace=group;
  for(const button of controls){
   const active=button.dataset.workspace===group;
   button.setAttribute('aria-pressed',String(active));
   button.classList.toggle('active',active);
  }
  if(status)status.textContent=group==='explore'?'Design and visualize your aircraft':
   group==='build'?'Inspect parts and learn assembly':'Detailed engineering tools';
  if(toolMenu&&group!=='engineering'&&toolMenu.open)toolMenu.open=false;
  // A hidden WebGL renderer is never destroyed. Reappearance triggers a real resize.
  if(changed)requestAnimationFrame(()=>{
   window.dispatchEvent(new Event('resize'));
   window.dispatchEvent(new CustomEvent('aeroforge:workspace-changed',{detail:{workspace:group}}));
  });
  if(writeUrl){
   const url=new URL(window.location.href);
   url.searchParams.set('view',group);
   url.hash='';
   window.history.pushState({workspace:group},'',url);
  }
  if(scrollTop)window.scrollTo({top:0,behavior:'auto'});
 }
 function syncFromLocation(){
  const hash=effectiveHash();
  const inferred=workspaceForTarget(hash);
  const query=new URL(window.location.href).searchParams.get('view')||'';
  const group=inferred||selectWorkspaceFromLocation({hash,view:query});
  show(group);
  if(inferred){
   requestAnimationFrame(()=>document.getElementById(hash)?.scrollIntoView({block:'start',behavior:'instant'}));
  }
 }
 for(const button of controls){
  button.addEventListener('click',()=>show(button.dataset.workspace,{writeUrl:true,scrollTop:true}));
 }
 for(const link of toolLinks){
  link.addEventListener('click',()=>{
   const id=link.getAttribute('href').slice(1);
   const group=workspaceForTarget(id);
   if(group)show(group);
   for(const other of toolLinks)other.setAttribute('aria-current',String(other===link?'location':'false'));
  });
 }
 window.addEventListener('hashchange',syncFromLocation);
 window.addEventListener('popstate',syncFromLocation);
 // The page still works if an old deep link targets a subsection that was hidden.
 syncFromLocation();

 const planner=document.getElementById('plan-form');
 const options=document.getElementById('af-plan-options');
 if(planner&&options){
  const toggle=()=>{
   const expanded=options.getAttribute('aria-expanded')!=='true';
   options.setAttribute('aria-expanded',String(expanded));
   options.textContent=expanded?'Fewer options':'More options';
   planner.classList.toggle('af-plan-expanded',expanded);
  };
  options.addEventListener('click',toggle);
 }
 const customize=document.getElementById('af-customize');
 const leftPanel=document.querySelector('.workspace .left-panel');
 if(leftPanel&&customize){
  leftPanel.classList.add('af-config-collapsed');
  customize.addEventListener('click',()=>{
   const expanded=customize.getAttribute('aria-expanded')!=='true';
   customize.setAttribute('aria-expanded',String(expanded));
   customize.textContent=expanded?'Hide components':'Customize components';
   leftPanel.classList.toggle('af-config-collapsed',!expanded);
  });
 }
 const analysis=document.getElementById('af-analysis');
 const metrics=document.querySelector('.workspace .metrics-panel');
 if(analysis&&metrics){
  metrics.classList.add('af-analysis-collapsed');
  analysis.addEventListener('click',()=>{
   const expanded=analysis.getAttribute('aria-expanded')!=='true';
   analysis.setAttribute('aria-expanded',String(expanded));
   analysis.textContent=expanded?'Less detail':'Full analysis';
   metrics.classList.toggle('af-analysis-collapsed',!expanded);
  });
  // Never hide detailed findings when the current design actually has blocking findings.
  const blocker=document.getElementById('blocker-count');
  if(blocker&&typeof MutationObserver!=='undefined'){
   const update=()=>{
    const t=blocker.textContent||'';
    const match=t.match(/(\d+)\s*blocker/i);
    metrics.classList.toggle('af-has-blockers',!!match&&Number(match[1])>0);
   };
   new MutationObserver(update).observe(blocker,{childList:true,characterData:true,subtree:true});
   update();
  }
 }
}
