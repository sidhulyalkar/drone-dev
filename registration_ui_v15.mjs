import {proposeX500Registration,attachX500Registration} from './core/registration_v15.mjs';
import {annotateRotorWithCircle} from './core/landmark_v16.mjs';
const el=id=>document.getElementById(id);
const root=el('cad-registration-v15');
if(root){
 let preview=null,proposal=null,currentRecord=null,revision=0;
 const fitReceipts=new Map();
 const save=(content,name)=>{
  const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
 };
 const notes=message=>el('cad-v15-status').textContent=message;
 const actions=enabled=>{
  el('cad-v15-export').disabled=!enabled;
  el('cad-v15-transfer').disabled=!enabled;
 };
 function invalidate(message){
  proposal=null;revision++;actions(false);
  window.dispatchEvent(new CustomEvent('aeroforge:x500-registration-cleared'));
  window.dispatchEvent(new CustomEvent('aeroforge:cad-motor-annotation-updated',{detail:{proposal:null}}));
  el('cad-v15-summary').textContent='No current measured-coordinate proposal.';
  notes(message);
 }
 function parse3(raw,label){
  const nums=raw.split(',').map(x=>x.trim());
  if(nums.length!==3||nums.some(x=>!x||!Number.isFinite(Number(x))))throw Error(label+' needs three finite comma-separated numbers');
  return nums.map(Number);
 }
 function parseRotorLines(raw){
  const lines=raw.split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith('#'));
  return lines.map(line=>{
   const f=line.split(',').map(x=>x.trim());
   if(f.length!==5||!f[0]||f.slice(1).some(x=>!x||!Number.isFinite(Number(x))))
    throw Error('Each rotor row needs ID, source X, source Y, source Z, propeller diameter');
   const rotor={id:f[0],centerKernelMm:f.slice(1,4).map(Number),propDiameterMm:Number(f[4])};
   const fReceipt=fitReceipts.get(rotor.id);
   if(fReceipt&&rotor.centerKernelMm.every((v,i)=>Math.abs(v-fReceipt.centerKernelMm[i])<1e-4)){
    rotor.observationKind=fReceipt.observationKind;
    rotor.featureEvidence=fReceipt.featureEvidence;
   }
   return rotor;
  });
 }
 function snapshot(){
  return {axisMap:el('cad-v15-axis').value.split(','),
   datumKernelMm:parse3(el('cad-v15-origin').value,'Source CAD datum'),
   reviewerLabel:el('cad-v15-observer').value.trim(),
   observationNotes:el('cad-v15-notes').value.trim(),
   sourceUnitsReviewed:el('cad-v15-units').checked,
   rotors:parseRotorLines(el('cad-v15-rotors').value)};
 }
 function inspect(){
  if(!preview){notes('Load the matching original X500 STEP together with GLB and manifest in Section 17 first.');return;}
  try{
   const draft=proposeX500Registration(preview,snapshot());
   proposal=draft;
   let status=draft.referenceComparison.assessment;
   const q=draft.dimensionalScreen;
   el('cad-v15-summary').textContent=draft.rotors.length+' human-annotated motor markers · '+
    draft.referenceComparison.candidateDiagonalDistancesMm.join(' / ')+' mm selected diagonal pair · '+
    status+' · '+q.counts.conflicts+' XY projected clearance conflicts · NO VERIFIED AIRCRAFT DATUM';
   actions(true);
   window.dispatchEvent(new CustomEvent('aeroforge:cad-motor-annotation-updated',
    {detail:{proposal:draft}}));
   window.dispatchEvent(new CustomEvent('aeroforge:x500-registration-proposed',
    {detail:{proposal:draft,preview}}));
   notes('Proposal computed. Source identity is local-only; motor centers, propeller diameters and axis mapping are still unverified.');
  }catch(e){invalidate('Proposal rejected: '+e.message);}
 }
 window.addEventListener('aeroforge:cad-circle-fit-to-rotor',e=>{
  const {observation,source,fit}=e.detail??{};
  if(!preview||!observation||!source)return;
  const m=preview.manifest;
  if(source.stepSha256!==m.source.sha256||source.glbSha256!==m.mesh.sha256||
     source.revision!==m.source.revision)return;
  try{
   const annotated=annotateRotorWithCircle({id:observation.id},fit,source);
   const rows=el('cad-v15-rotors').value.split(/\r?\n/);
   const rowIdx=rows.findIndex(line=>line.split(',')[0].trim()===annotated.id);
   if(rowIdx<0){notes('Add a rotor row labeled '+annotated.id+' with its REAL propeller diameter first.');return;}
   const fields=rows[rowIdx].split(',').map(x=>x.trim());
   if(fields.length!==5||!Number.isFinite(Number(fields[4]))||Number(fields[4])<=0){
    notes('This rotor needs a valid measured propeller diameter before a circle center can be copied.');return;
   }
   rows[rowIdx]=[annotated.id,...annotated.centerKernelMm,fields[4]].join(', ');
   fitReceipts.set(annotated.id,annotated);
   el('cad-v15-rotors').value=rows.join('\n');
   invalidate('New CAD circle-fit *hypothesis* applied to '+annotated.id+'; reinspect. Confirm motor feature identity independently.');
  }catch(err){notes('Circle-to-motor transfer rejected: '+err.message);}
 });
  for(const id of ['cad-v15-axis','cad-v15-origin','cad-v15-observer','cad-v15-notes','cad-v15-rotors','cad-v15-units']){
  el(id).addEventListener('input',()=>{if(id==='cad-v15-rotors')fitReceipts.clear();invalidate('Annotation changed; re-run coordinate screening.');});
  el(id).addEventListener('change',()=>{if(id==='cad-v15-rotors')fitReceipts.clear();invalidate('Annotation changed; re-run coordinate screening.');});
 }
 el('cad-v15-inspect').addEventListener('click',inspect);
 el('cad-v15-export').addEventListener('click',()=>{
  if(!proposal)return;
  save(proposal,'x500-v2-unverified-datum-registration-v15.json');
 });
 el('cad-v15-transfer').addEventListener('click',()=>{
  if(!proposal)return;
  window.dispatchEvent(new CustomEvent('aeroforge:cad-registration-to-dimensions',
   {detail:{proposal}}));
  const location=el('dimensional-v11');
  location?.scrollIntoView({behavior:'instant',block:'start'});
  notes('Unverified CAD datum positions transferred to dimensional inspector. Run screening there; no automatic qualification.');
 });
 window.addEventListener('aeroforge:cad-visual-package-cleared',()=>{
  preview=null;fitReceipts.clear();invalidate('The source package changed or was reset. Reverify original STEP bytes before registration.');
  el('cad-v15-inspect').disabled=true;
 });
 window.addEventListener('aeroforge:cad-visual-package-verified',e=>{
  const next=e.detail?.preview;
  fitReceipts.clear();preview=next?.localStepHashMatchesManifest===true&&
   next.manifest?.source?.fileName?.toLowerCase()==='x500v2-frame.step'?next:null;
  invalidate(preview?'X500 frame source bytes match this local visual package. Enter *observed* positions and inspect.':
   'This is not a matching X500 V2 frame STEP with verified local source bytes.');
  el('cad-v15-inspect').disabled=!preview;
 });
 actions(false);el('cad-v15-inspect').disabled=true;
 notes('Load a hash-checked original X500 V2 STEP file first; no default motor coordinates are fabricated.');
}
