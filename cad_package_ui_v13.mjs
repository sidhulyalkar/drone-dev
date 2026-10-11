import {verifyCadPackage,validateCadManifest} from './core/cad_package_v13.mjs';
const el=id=>document.getElementById(id);
const root=el('cad-package-v13');
if(root){
 const fileIds=['cad-v13-manifest','cad-v13-glb','cad-v13-step'];
 let viewer=null,checked=null,loading=0,meshList=[];
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const say=(message,kind='note')=>{
  el('cad-v13-status').textContent=message;el('cad-v13-status').dataset.kind=kind;
 };
 function clear(){
  window.dispatchEvent(new CustomEvent('aeroforge:cad-visual-package-cleared'));
  checked=null;meshList=[];viewer?.dispose();viewer=null;
  window.dispatchEvent(new CustomEvent('aeroforge:cad-surface-pick-cleared'));
  el('cad-v13-canvas').querySelectorAll('canvas').forEach(c=>c.remove());
  el('cad-v13-parts').replaceChildren();
  el('cad-v13-package-evidence').textContent='No local package validated.';
  el('cad-v13-export').disabled=true;el('cad-v13-explode').disabled=true;
  el('cad-v13-explode').value='0';el('cad-v13-explode-value').textContent='0%';
 }
 for(const id of fileIds)el(id).addEventListener('change',()=>{
  ++loading;clear();say('File selection changed. Reverify source and GLB before previewing.');
 });
 async function bytes(input,max){
  if(!input||input.size>max||input.size===0)throw new Error('Missing or oversized selected file');
  return input.arrayBuffer();
 }
 async function prepare(){
  const ticket=++loading;clear();say('Checking local file hashes, embedded GLB resources and manifest…');
  const manifestFile=el('cad-v13-manifest').files?.[0];
  const glbFile=el('cad-v13-glb').files?.[0];
  const stepFile=el('cad-v13-step').files?.[0]??null;
  try{
   if(!manifestFile||manifestFile.size>100000)throw new Error('Select a visual-package manifest JSON under 100 KB');
   const raw=JSON.parse(await manifestFile.text());
   const manifest=validateCadManifest(raw);
   if(!glbFile||glbFile.name!==manifest.mesh.fileName)throw new Error('GLB filename must match manifest');
   if(stepFile&&stepFile.name!==manifest.source.fileName)throw new Error('STEP filename must match manifest');
   const [glb,step]=await Promise.all([
    bytes(glbFile,90*1024*1024),stepFile?bytes(stepFile,120*1024*1024):Promise.resolve(null)
   ]);
   if(ticket!==loading)return;
   const verified=await verifyCadPackage(raw,glb,step);
   if(ticket!==loading)return;
   checked=verified;
   window.dispatchEvent(new CustomEvent('aeroforge:cad-visual-package-verified',{detail:{preview:verified}}));
   // The Build renderer independently verifies bytes again before enabling its CAD mode.
   // Pass ephemeral in-memory ArrayBuffer only; source STEP never leaves this page.
   window.dispatchEvent(new CustomEvent('aeroforge:cad-preview-ready',{detail:{preview:verified,glb}}));
   el('cad-v13-package-evidence').innerHTML=
    '<strong>'+esc(verified.manifest.source.fileName)+'</strong> / revision '+esc(verified.manifest.source.revision)+
    '<p>Source SHA-256: <code>'+esc(verified.manifest.source.sha256)+'</code></p>'+
    '<p>GLB SHA-256: <code>'+esc(verified.manifest.mesh.sha256)+'</code></p>'+
    '<p>Source STEP bytes: '+(verified.localStepHashMatchesManifest?'MATCH LOCAL FILE · manufacturer origin unverified':
    'NOT PROVIDED · manufacturer origin unverified')+'</p>'+
    '<p>'+verified.manifest.conversion.solidCount+' exported solids · '+verified.manifest.conversion.triangleCount+
    ' triangles · original CAD axes not FRD-registered</p>'+
    '<p class="cad-v13-warning">NO APPROVED PHYSICAL FIT OR FLIGHT AUTHORITY. The visually imported geometry does not establish motor centers, CG, fasteners or electrical pinouts.</p>';
   el('cad-v13-export').disabled=false;
   try{
    const mod=await import('./cad_viewer_v13.mjs');
    if(ticket!==loading)return;
    viewer=mod.createCadPackageViewer(el('cad-v13-canvas'),index=>selectPart(index,false));
    meshList=await viewer.load(glb);
    if(ticket!==loading)return;
    el('cad-v13-parts').innerHTML=meshList.map(m=>
     '<button type="button" data-index="'+m.id+'" aria-pressed="false">'+
     esc(m.label)+' <small>UNREGISTERED CAD SOLID</small></button>').join('');
    el('cad-v13-explode').disabled=false;
    say('GLB mesh hash verified. Orbit with drag; select individual solids; provenance remains unverified.','success');
   }catch(e){
    viewer?.dispose();viewer=null;
    say('Hashes matched, but WebGL/Three.js preview unavailable: '+e.message+'. Evidence remains accessible.','warning');
   }
  }catch(e){if(ticket!==loading)return;clear();say('Package rejected: '+e.message,'error');}
 }
 function selectPart(index,callViewer=true){
  if(!Number.isInteger(index)||index<0||index>=meshList.length)return;
  el('cad-v13-selected').textContent=meshList[index].label+' / Unregistered manufacturer component';
  for(const b of el('cad-v13-parts').querySelectorAll('[data-index]'))
   b.setAttribute('aria-pressed',String(Number(b.dataset.index)===index));
  if(callViewer)viewer?.select(index);
 }
 el('cad-v13-inspect').addEventListener('click',prepare);
 el('cad-v13-parts').addEventListener('click',e=>{
  const btn=e.target.closest('[data-index]');if(btn)selectPart(Number(btn.dataset.index));
 });
 el('cad-v13-explode').addEventListener('input',e=>{
  const v=Number(e.target.value)/100;
  el('cad-v13-explode-value').textContent=Math.round(v*100)+'%';
  viewer?.setExplode(v);
 });
 el('cad-v13-export').addEventListener('click',()=>{
  if(!checked){say('No current package verification');return;}
  const blob=new Blob([JSON.stringify(checked,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
  a.download='aeroforge-cad-local-evidence-v13.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 el('cad-v13-reset').addEventListener('click',()=>{
  ++loading;clear();for(const id of fileIds)el(id).value='';
  say('Select a manifest and its exact GLB, plus optional matching STEP, to start.');
 });
 window.addEventListener('aeroforge:cad-surface-pick-mode',e=>{
  const enabled=e.detail?.enabled===true;
  const allowed=!!viewer&&!!checked&&checked.localStepHashMatchesManifest===true&&
   checked.manifest.source.fileName.toLowerCase()==='x500v2-frame.step';
  if(enabled&&!allowed){
   window.dispatchEvent(new CustomEvent('aeroforge:cad-surface-pick-unavailable'));
   return;
  }
  if(enabled){
   el('cad-v13-explode').value='0';el('cad-v13-explode-value').textContent='0%';
   viewer.setExplode(0);el('cad-v13-explode').disabled=true;
   viewer.setSurfacePickHandler(point=>{
    window.dispatchEvent(new CustomEvent('aeroforge:cad-surface-point-picked',{
     detail:{point,source:{stepSha256:checked.manifest.source.sha256,
      glbSha256:checked.manifest.mesh.sha256,revision:checked.manifest.source.revision}}
    }));
   });
   say('Pick visible CAD surface points for a *hypothetical* circular feature. A surface is not a motor center.','warning');
  }else{
   viewer?.setSurfacePickHandler(null);
   el('cad-v13-explode').disabled=!viewer;
  }
 });
  window.addEventListener('aeroforge:cad-motor-annotation-updated',e=>{
  const proposal=e.detail?.proposal;
  if(!proposal)viewer?.setMotorMarkers([]);
  else if(proposal.schema==='aeroforge/x500-registration-proposal/v1.5')viewer?.setMotorMarkers(proposal.rotors);
 });
  window.addEventListener('beforeunload',()=>viewer?.dispose(),{once:true});
 say('No CAD source or derived GLB has been imported or registered on this device.');
}
