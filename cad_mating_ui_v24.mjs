/**
 * v2.4 two-source local X500 CAD intake and proposed frame↔motor registration.
 * Does not persist binary files, and never grants mechanical or flight authority.
 */
import {verifyCadPackage,validateCadManifest} from './core/cad_package_v13.mjs';
import {proposeX500CadMating,scopeX500CadMating,cadMatingAppliesToRecord} from './core/cad_mating_v24.mjs';
const host=document.getElementById('cad-package-v13');
if(host){
 const el=(tag,label='')=>{const n=document.createElement(tag);n.textContent=label;return n;};
 const panel=el('details'),heading=el('summary','20 / Frame ↔ motor CAD registration study');
 panel.id='cad-v24-pair';panel.className='cad-v24-pair';
 const lead=el('p','Verify BOTH original STEP files against their local GLB manifests, then enter actual inspected frame/motor mounting coordinates. No coordinates or mounting dimensions are prefilled. Filenames and hashes do not authenticate the manufacturer; no physical fit is approved.');
 const fileGrid=el('div');fileGrid.className='cad-v24-files';
 const parts={};
 function picker(label,accept){
  const input=el('input');input.type='file';input.accept=accept;
  const wrapper=el('label',label);wrapper.append(input);return {input,wrapper};
 }
 for(const [key,title] of [['frame','X500 V2 frame'],['motor','AIR2216II motor']]){
  const block=el('fieldset'),legend=el('legend',title),inputs={};block.append(legend);
  for(const [slot,label,accept] of [
   ['manifest','Visual-package JSON','.json,application/json'],
   ['glb','Converted GLB','.glb,model/gltf-binary'],
   ['step','Original STEP (required)','.step,.stp']]){
   const p=picker(label,accept);inputs[slot]=p.input;block.append(p.wrapper);
  }
  parts[key]=inputs;fileGrid.append(block);
 }
 const controls=el('div');controls.className='cad-v24-actions';
 const verify=el('button','Verify two source packages');verify.type='button';
 const verifyStatus=el('p','No local source files verified.');
 controls.append(verify,verifyStatus);
 const form=el('form');form.className='cad-v24-form';
 const inputMap={};
 function field(key,label,type='text',defaultValue=''){
  const input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;
  input.value=defaultValue;input.required=true;
  if(type==='number'){input.step='any';input.min='0.001';input.max='100';}
  if(key==='frameMountKernelMm'||key==='motorMountKernelMm')input.placeholder='x, y, z (no inferred defaults)';
  const l=el('label',label);l.append(input);inputMap[key]=input;form.append(l);return input;
 }
 field('frameMountKernelMm','Frame mount center XYZ in native STEP mm (comma separated)','text','');
 field('motorMountKernelMm','Motor base origin XYZ in native STEP mm (comma separated)','text','');
 const axis=el('select');
 for(const [key,label] of [
  ['+X,+Y,+Z','Identity rotation (+X,+Y,+Z)'],
  ['-Y,+X,+Z','90° around source Z (-Y,+X,+Z)'],
  ['-X,-Y,+Z','180° around source Z (-X,-Y,+Z)'],
  ['+Y,-X,+Z','270° around source Z (+Y,-X,+Z)']]){
  const opt=el('option',label);opt.value=key;axis.append(opt);
 }
 const axLabel=el('label','Motor-to-frame axis hypothesis');axLabel.append(axis);form.append(axLabel);
 field('framePatternMm','Observed frame hole spacing hypothesis (mm)','number','');
 field('motorPatternMm','Observed motor mounting hole spacing hypothesis (mm)','number','');
 field('observer','Observer or inspection label','text','');
 field('datumNotes','Source of selected mounting datums','textarea','');
 field('fastenerNotes','Known unknowns: shaft, mounting face, fastener engagement','textarea','');
 const unitLabel=el('label'),units=el('input');units.type='checkbox';units.required=true;
 unitLabel.append(units,document.createTextNode(' I inspected the original source-unit assumption against a real reference (self-reported, not independently verified).'));
 form.append(unitLabel);
 const build=el('button','Create unverified mating proposal');build.type='submit';build.disabled=true;
 const exportBtn=el('button','Export proposal JSON');exportBtn.type='button';exportBtn.disabled=true;
 form.append(build,exportBtn);
 const result=el('pre','No source geometry and datum proposal yet.');result.className='cad-v24-report';
 result.setAttribute('aria-live','polite');
 const viewerHost=el('div');viewerHost.className='cad-v24-viewport';viewerHost.hidden=true;
 const viewButton=el('button','Preview two source meshes in 3D');viewButton.type='button';viewButton.disabled=true;
 const visualControls=el('div');visualControls.className='cad-v26-inspection-controls';
 const separationLabel=el('label','VISUAL MOTOR SEPARATION (NOT PHYSICAL CLEARANCE) ');
 const separation=el('input');separation.type='range';separation.min='0';separation.max='100';separation.step='1';
 separation.value='0';separation.disabled=true;separation.id='cad-v26-separation';
 const separationValue=el('output','0 mm');separationValue.htmlFor=separation.id;
 separationLabel.append(separation,separationValue);
 const markerLabel=el('label');
 const markerToggle=el('input');markerToggle.type='checkbox';markerToggle.checked=true;markerToggle.disabled=true;
 markerLabel.append(markerToggle,document.createTextNode(' Show unverified mounting datum markers'));
 const visualWarning=el('small','The preview slides the motor along assumed source-native +Z. The research pose, measurements and safety status never change.');
 visualControls.append(separationLabel,markerLabel,visualWarning);
 const warning=el('p','CAUTION: Relative CAD preview and AABB checks are not collision certification, fastener qualification, calibrated metrology, or flight approval.');
 warning.className='cad-v24-warning';
 panel.append(heading,lead,fileGrid,controls,form,viewButton,visualControls,viewerHost,result,warning);host.append(panel);
 let verified=null,proposal=null,viewer=null,token=0,aircraftRecord=null;
 const broadcast=()=>window.dispatchEvent(new CustomEvent('aeroforge:cad-mating-proposal-updated',{detail:{proposal}}));
 function clearProposal(){
  proposal=null;exportBtn.disabled=true;viewButton.disabled=true;result.textContent='No current mating proposal. Reevaluate changed values.';
  viewer?.dispose();viewer=null;viewerHost.hidden=true;viewerHost.replaceChildren();
  separation.disabled=true;separation.value='0';separationValue.textContent='0 mm';
  markerToggle.disabled=true;broadcast();
 }
 function clearFiles(){
  ++token;verified=null;build.disabled=true;clearProposal();verifyStatus.textContent='Source selection changed. Reverify both packages.';
 }
 for(const group of Object.values(parts))for(const input of Object.values(group))input.addEventListener('change',clearFiles);
 form.addEventListener('input',clearProposal);
 axis.addEventListener('change',clearProposal);
 function coords(value){
  const numbers=value.split(',').map(x=>Number(x.trim()));
  if(numbers.length!==3||value.split(',').some(x=>!x.trim())||numbers.some(x=>!Number.isFinite(x)))
   throw Error('Enter exactly three finite comma-separated CAD-native coordinates');
  return numbers;
 }
 async function load(name,inputs){
  const mf=inputs.manifest.files?.[0],glb=inputs.glb.files?.[0],step=inputs.step.files?.[0];
  if(!mf||!glb||!step)throw Error(name+': manifest, GLB and original STEP required');
  if(mf.size>100000)throw Error(name+': manifest exceeds 100 KB');
  const raw=JSON.parse(await mf.text()),meta=validateCadManifest(raw);
  if(meta.mesh.fileName!==glb.name||meta.source.fileName!==step.name)
   throw Error(name+': actual GLB / STEP filenames must match manifest');
  if(glb.size!==meta.mesh.sizeBytes||step.size!==meta.source.sizeBytes)
   throw Error(name+': selected file sizes differ from manifest');
  const glbBytes=await glb.arrayBuffer();
  const stepBytes=await step.arrayBuffer();
  const preview=await verifyCadPackage(raw,glbBytes,stepBytes);
  return {preview,glbBytes};
 }
 verify.addEventListener('click',async()=>{
  const ticket=++token;verified=null;build.disabled=true;clearProposal();verify.disabled=true;
  verifyStatus.textContent='Hashing frame and motor STEP/GLB files locally…';
  try{
   const frame=await load('Frame',parts.frame);if(ticket!==token)return;
   const motor=await load('Motor',parts.motor);if(ticket!==token)return;
   // Reject unexpected source candidates before enabling datum workflow.
   const correct=frame.preview.manifest.source.fileName.toLowerCase()==='x500v2-frame.step'&&
    motor.preview.manifest.source.fileName.toLowerCase()==='air2216ii_motor_3d.step';
   if(!correct)throw Error('Require named X500 V2 frame and AIR2216II motor STEP candidates');
   verified={frame,motor};build.disabled=false;
   verifyStatus.textContent='Two local STEP and GLB digests matched their manifests. Vendor origin, units and mating datums still unverified.';
  }catch(err){if(ticket===token)verifyStatus.textContent='CAD intake rejected: '+err.message;}
  finally{verify.disabled=false;}
 });
 form.addEventListener('submit',e=>{
  e.preventDefault();
  try{
   if(!verified)throw Error('First verify two original source packages');
   const x=Object.fromEntries(Object.entries(inputMap).map(([key,input])=>[key,input.value]));
   const proposed=proposeX500CadMating(verified.frame.preview,verified.motor.preview,{
    frameMountKernelMm:coords(x.frameMountKernelMm),motorMountKernelMm:coords(x.motorMountKernelMm),
    axisMap:axis.value.split(','),observer:x.observer,datumNotes:x.datumNotes,
    sourceUnitsReviewed:units.checked,framePatternMm:Number(x.framePatternMm),
    motorPatternMm:Number(x.motorPatternMm),fastenerNotes:x.fastenerNotes
   });
   proposal=scopeX500CadMating(proposed,aircraftRecord);
   result.textContent='Source fingerprints: frame '+proposal.frame.sourceSha256+' / motor '+proposal.motor.sourceSha256+
    '\nHypothesis translation (mm): '+proposal.registration.motorToFrameTranslationMm.join(', ')+
    '\nMount hole spacing difference (mm): '+proposal.patternHypotheses.frameMinusMotorMm+
    '\nBroad phase: '+proposal.broadphase.status+
    '\nALL PHYSICAL AND FLIGHT APPROVALS: FALSE';
   exportBtn.disabled=false;viewButton.disabled=false;broadcast();
  }catch(err){clearProposal();result.textContent='Registration blocked: '+err.message;}
 });
 exportBtn.addEventListener('click',()=>{
  if(!proposal)return;
  const blob=new Blob([JSON.stringify(proposal,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='aeroforge-x500-cad-mating-hypothesis-v24.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 viewButton.addEventListener('click',async()=>{
  if(!proposal||!verified)return;
  try{
   viewer?.dispose();viewer=null;
   const {createCadPairViewer}=await import('./cad_pair_viewer_v24.mjs');
   if(!proposal||!verified||!cadMatingAppliesToRecord(proposal,aircraftRecord))
    throw Error('Aircraft selection changed before CAD preview could start');
   viewerHost.hidden=false;
   const currentViewer=createCadPairViewer(viewerHost);
   viewer=currentViewer;
   await currentViewer.load(verified.frame.glbBytes,verified.motor.glbBytes,proposal);
   if(viewer!==currentViewer||!proposal||!cadMatingAppliesToRecord(proposal,aircraftRecord))return;
   separation.value='0';separationValue.textContent='0 mm';separation.disabled=false;
   markerToggle.disabled=false;currentViewer.setDatumMarkersVisible(markerToggle.checked);
  }catch(err){
   viewer?.dispose();viewer=null;viewerHost.hidden=true;
   result.textContent+='\n3D preview unavailable: '+err.message;
  }
 });
 separation.addEventListener('input',()=>{
  if(!viewer||separation.disabled)return;
  try{
   const pose=viewer.setSeparation(Number(separation.value));
   separationValue.textContent=pose.displaySeparationMm+' mm (display only)';
  }catch(err){separationValue.textContent='Invalid separation';}
 });
 markerToggle.addEventListener('change',()=>{
  if(viewer) viewer.setDatumMarkersVisible(markerToggle.checked);
 });
 window.addEventListener('aeroforge:x500-record-updated',e=>{
  const incoming=e.detail?.record;
  if(incoming?.schema!=='aeroforge/x500-aircraft-record/v1.4')return;
  aircraftRecord=incoming;
  if(proposal&&!cadMatingAppliesToRecord(proposal,incoming)){
   clearProposal();
   verifyStatus.textContent='Aircraft selection changed. CAD pose evidence was invalidated; source files stay locally verified.';
  }
 });
 window.dispatchEvent(new Event('aeroforge:x500-record-requested'));
 window.addEventListener('beforeunload',()=>viewer?.dispose(),{once:true});
}
