/**
 * v2.4 two-source local X500 CAD intake and proposed frame↔motor registration.
 * Does not persist binary files, and never grants mechanical or flight authority.
 */
import {verifyCadPackage,validateCadManifest} from './core/cad_package_v13.mjs';
import {compareX500SourceIntake} from './core/x500_source_intake_v27.mjs';
import {getX500RealSourceObservations} from './core/x500_real_source_observations_v28.mjs';
import {x500RightHandedAxisOptions} from './core/cad_orientation_options_v28.mjs';
import {checkX500MountCandidates} from './core/x500_mount_feature_review_v29.mjs';
import {reviewX500PlaneTopology} from './core/x500_brep_topology_review_v30.mjs';
import {proposeX500CadMating,scopeX500CadMating,cadMatingAppliesToRecord} from './core/cad_mating_v24.mjs';
const host=document.getElementById('cad-package-v13');
if(host){
 const el=(tag,label='')=>{const n=document.createElement(tag);n.textContent=label;return n;};
 const panel=el('details'),heading=el('summary','20 / Frame ↔ motor CAD registration study');
 panel.id='cad-v24-pair';panel.className='cad-v24-pair';
 const lead=el('p','Verify BOTH original STEP files against their local GLB manifests, then enter actual inspected frame/motor mounting coordinates. No coordinates or mounting dimensions are prefilled. Filenames and hashes do not authenticate the manufacturer; no physical fit is approved.');
 const officialSourceLink=el('p');
 const officialAnchor=el('a','Open official Holybro X500 V2 frame + motor STEP downloads ↗');
 officialAnchor.href='https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download';
 officialAnchor.target='_blank';officialAnchor.rel='noopener noreferrer';
 officialSourceLink.append(officialAnchor);
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
 const receiptLabel=el('label','Optional local v2.7 two-source intake report (JSON) ');
 const receiptInput=el('input');receiptInput.type='file';receiptInput.accept='.json,application/json';
 receiptInput.id='cad-v27-intake-receipt';receiptLabel.append(receiptInput);
 const receiptNote=el('small','Original STEP files remain required. This optional report must match BOTH original STEP/GLB digests. It is not a manufacturer signature.');
 receiptLabel.append(receiptNote);
 const candidatesLabel=el('label','Optional v2.9 local BREP feature candidate index (JSON) ');
 const candidatesInput=el('input');candidatesInput.type='file';
 candidatesInput.accept='.json,application/json';candidatesInput.id='cad-v29-feature-index';
 candidatesLabel.append(candidatesInput,el('small','Generated from BOTH exact-source BREP inventories. Candidate axes are NOT verified holes or known mounting faces.'));
 const topoLabel=el('label','Optional v3.0 original-BREP planar adjacency report (JSON) ');
 const topoInput=el('input');topoInput.type='file';topoInput.accept='.json,application/json';
 topoInput.id='cad-v30-topology-report';topoLabel.append(topoInput);
 const topoPanel=el('details');topoPanel.id='cad-v30-topology-review';topoPanel.hidden=true;
 topoPanel.append(el('summary','Review direct cylindrical-to-planar BREP adjacency (not physical fit)'));
 const topoSummary=el('p','No face topology report checked');
 const topoSelect=el('select');topoSelect.id='cad-v30-topology-choice';
 const topoDetail=el('pre');topoDetail.className='cad-v30-topology-readout';
 const topoNote=el('small','These are original-CAD topological relationships, not certified fastener holes or contact faces. Motor has no common directly adjacent axial plane. Nothing in this panel auto-fills or approves a mounting position.');
 topoPanel.append(topoSummary,topoSelect,topoDetail,topoNote);
 const featurePanel=el('details');featurePanel.id='cad-v29-feature-review';featurePanel.hidden=true;
 featurePanel.append(el('summary','Review 5 CAD cylindrical-face mounting candidates (research only)'));
 const featureSelect=el('select');featureSelect.id='cad-v29-feature-choice';
 const featureSelectLabel=el('label','Select the actual source-axis pattern for inspection');
 featureSelectLabel.append(featureSelect);
 const featureReadout=el('p','No CAD feature candidate selected');
 const copyCandidate=el('button','Use transverse coordinates in draft (axial position still required)');
 copyCandidate.type='button';copyCandidate.id='cad-v29-copy-transverse';
 const featureCaution=el('small','Draft coordinate transfer deliberately leaves the cylinder AXIAL coordinate blank. Independently inspect the actual mounting surface before entering that value; no fit is certified.');
 featurePanel.append(featureSelectLabel,featureReadout,copyCandidate,featureCaution);
 const controls=el('div');controls.className='cad-v24-actions';
 const verify=el('button','Verify two source packages');verify.type='button';
 const verifyStatus=el('p','No local source files verified.');
 controls.append(verify,verifyStatus);
 const realSourceEvidence=el('details');realSourceEvidence.id='cad-v28-source-observations';realSourceEvidence.hidden=true;
 realSourceEvidence.append(el('summary','Source-specific CAD observations (research only)'));
 const realSourceText=el('pre');realSourceText.className='cad-v28-source-readout';realSourceEvidence.append(realSourceText);
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
 for(const {value,label} of x500RightHandedAxisOptions()){
  const opt=el('option',label);opt.value=value;axis.append(opt);
 }
 axis.value='+X,+Y,+Z';
 const axLabel=el('label','Motor-to-frame axis hypothesis (24 right-handed rotations)');axLabel.append(axis);form.append(axLabel);
 const displayAxis=el('select');displayAxis.id='cad-v28-display-axis';
 for(const key of ['+Z','-Z','+X','-X','+Y','-Y']){
  const opt=el('option','Motor native '+key+' (display only, NOT shaft qualification)');opt.value=key;displayAxis.append(opt);
 }
 const displayAxisLabel=el('label','Separate motor for preview along selected native direction');
 displayAxisLabel.append(displayAxis);form.append(displayAxisLabel);
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
 const visualWarning=el('small','The preview slides along the user-selected motor-native signed axis, which is NOT a verified shaft axis. Research registration and approval flags never change.');
 visualControls.append(separationLabel,markerLabel,visualWarning);
 const warning=el('p','CAUTION: Relative CAD preview and AABB checks are not collision certification, fastener qualification, calibrated metrology, or flight approval.');
 warning.className='cad-v24-warning';
 panel.append(heading,lead,officialSourceLink,fileGrid,receiptLabel,candidatesLabel,topoLabel,controls,realSourceEvidence,featurePanel,topoPanel,form,viewButton,visualControls,viewerHost,result,warning);host.append(panel);
 let verified=null,proposal=null,viewer=null,token=0,aircraftRecord=null;
 const broadcast=()=>window.dispatchEvent(new CustomEvent('aeroforge:cad-mating-proposal-updated',{detail:{proposal}}));
 function clearProposal(){
  proposal=null;exportBtn.disabled=true;viewButton.disabled=true;result.textContent='No current mating proposal. Reevaluate changed values.';
  viewer?.dispose();viewer=null;viewerHost.hidden=true;viewerHost.replaceChildren();
  separation.disabled=true;separation.value='0';separationValue.textContent='0 mm';
  markerToggle.disabled=true;broadcast();
 }
 function clearFiles(){
  ++token;verified=null;build.disabled=true;realSourceEvidence.hidden=true;featurePanel.hidden=true;topoPanel.hidden=true;clearProposal();verifyStatus.textContent='Source selection changed. Reverify both packages.';
 }
 for(const group of Object.values(parts))for(const input of Object.values(group))input.addEventListener('change',clearFiles);
 receiptInput.addEventListener('change',clearFiles);
 candidatesInput.addEventListener('change',clearFiles);
 topoInput.addEventListener('change',clearFiles);
 form.addEventListener('input',clearProposal);
 axis.addEventListener('change',clearProposal);
 displayAxis.addEventListener('change',clearProposal);
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
   let matchedSourceReceipt=null;
   const reportFile=receiptInput.files?.[0];
   if(reportFile){
    if(reportFile.size>256*1024)throw Error('Source intake JSON must be 256 KB or smaller');
    const parsed=JSON.parse(await reportFile.text());
    if(ticket!==token)return;
    matchedSourceReceipt=compareX500SourceIntake(parsed,frame.preview,motor.preview);
   }
   let featureReview=null,candidateReportSha256=null,topologyReview=null;
   const candidateFile=candidatesInput.files?.[0];
   if(candidateFile){
    if(candidateFile.size>256*1024)throw Error('BREP candidate index exceeds 256 KB');
    const rawCandidateBytes=await candidateFile.arrayBuffer();
    if(ticket!==token)return;
    const digest=await crypto.subtle.digest('SHA-256',rawCandidateBytes);
    candidateReportSha256=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    featureReview=checkX500MountCandidates(JSON.parse(new TextDecoder().decode(rawCandidateBytes)),
     frame.preview,motor.preview);
    if(ticket!==token)return;
   }
   const topologyFile=topoInput.files?.[0];
   if(topologyFile){
    if(!featureReview)throw Error('v3.0 BREP adjacency requires the original v2.9 feature index');
    if(topologyFile.size>512*1024)throw Error('BREP topology report exceeds 512 KB');
    topologyReview=reviewX500PlaneTopology(JSON.parse(await topologyFile.text()),
      featureReview,candidateReportSha256);
    if(ticket!==token)return;
   }
   verified={frame,motor,matchedSourceReceipt,featureReview,topologyReview};build.disabled=false;
   topoPanel.hidden=!topologyReview;
   topoSelect.replaceChildren();
   if(topologyReview){
    topoSummary.textContent='Original-source BREP edge topology reported for all five candidates. Four frame patterns share 15.5 and 17 mm Y-normal plane faces; motor candidate has no common directly connected X-normal plane. NO qualified mate.';
    for(const c of topologyReview.candidates){
     const option=el('option',c.id+' • '+c.sharedPlanarFaces.length+' common axial planes');option.value=c.id;topoSelect.append(option);
    }
    topoDetail.textContent='Select a candidate to inspect its original source face indices.';
   }
   featurePanel.hidden=!featureReview;
   featureSelect.replaceChildren();
   if(featureReview){
    for(const c of featureReview.candidates){
     const label=c.role.toUpperCase()+' • '+c.id+
      ' • transverse '+c.centerTransverseMm.join(', ')+' mm';
     const option=el('option',label);option.value=c.id;featureSelect.append(option);
    }
    featureReadout.textContent='Five BREP cylinder-pattern candidates are source-hash-bound. The coordinate along each candidate axis is deliberately UNKNOWN.';
   }
   const sourceObservations=getX500RealSourceObservations(frame.preview,motor.preview);
   realSourceEvidence.hidden=!sourceObservations;
   if(sourceObservations){
    const F=sourceObservations.frame,M=sourceObservations.motor;
    realSourceText.textContent='LOCAL IMPORT / UNQUALIFIED\n'+
     'Frame: '+F.importedSolidCount+' solids, source AABB mm: '+JSON.stringify(F.sourceKernelAabbMm)+'\n'+
     'Motor: '+M.importedSolidCount+' solids, source AABB mm: '+JSON.stringify(M.sourceKernelAabbMm)+'\n'+
     F.observation+'\n'+M.observation+'\n'+sourceObservations.warning;
   }
   verifyStatus.textContent=matchedSourceReceipt
    ? 'Local STEP + GLB digests match BOTH paired source-intake report entries. Manufacturer origin, units and physical fit still unverified.'
    : 'Two local STEP and GLB digests matched their manifests. No paired intake report selected; vendor origin, units and mating datums unverified.';
  }catch(err){if(ticket===token)verifyStatus.textContent='CAD intake rejected: '+err.message;}
  finally{verify.disabled=false;}
 });
 topoSelect.addEventListener('change',()=>{
  const c=verified?.topologyReview?.candidates.find(x=>x.id===topoSelect.value);
  if(!c){topoDetail.textContent='Verify a v3.0 source topology report first';return;}
  const planes=c.sharedPlanarFaces.map(p=>'face '+p.sourceFaceIndex+
    ': '+p.sourceNativeAxis+'='+p.axialNativeCoordinateMm+' mm; area='+p.areaNativeMm2.toFixed(2)+' mm²').join('\n');
  topoDetail.textContent=c.id+' (source solid '+c.solidIndex+')\nCylindrical faces: '+
    c.originalCylinderFaceIndices.join(', ')+
    '\nCOMMON EDGE-ADJACENT AXIAL PLANES:\n'+(planes||'NONE')+
    '\nNearby planes are not necessarily joined to the cylinder faces. No physical mating contact is validated.';
 });
 featureSelect.addEventListener('change',()=>{
  const c=verified?.featureReview?.candidates.find(x=>x.id===featureSelect.value);
  featureReadout.textContent=c?
   c.id+' | '+c.support+' | unregistered native coordinates: '+c.displayPointNativeMm.map(v=>v===null?'UNKNOWN':v).join(', ')+
   ' mm. This is NOT a verified mounting datum.':
   'Select a candidate after verifying its two source packages.';
 });
 copyCandidate.addEventListener('click',()=>{
  const c=verified?.featureReview?.candidates.find(x=>x.id===featureSelect.value);
  if(!c){featureReadout.textContent='First verify both sources and select an unqualified candidate';return;}
  const target=c.role==='frame'?inputMap.frameMountKernelMm:inputMap.motorMountKernelMm;
  // The free axial coordinate MUST be supplied from an independent
  // mounting-face inspection; never use CAD cylinder Axis.Location() for it.
  target.value=c.displayPointNativeMm.map(x=>x===null?'':String(x)).join(', ');
  clearProposal();target.focus();
  featureReadout.textContent='Draft '+c.role+' transverse coordinates inserted: '+target.value+
   ' mm. The blank axial coordinate MUST be inspected and entered manually. No physical fit approval.';
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
    motorPatternMm:Number(x.motorPatternMm),fastenerNotes:x.fastenerNotes,
    displayAxisNative:displayAxis.value
   });
   proposal=scopeX500CadMating(proposed,aircraftRecord);
   result.textContent='Source fingerprints: frame '+proposal.frame.sourceSha256+' / motor '+proposal.motor.sourceSha256+
    '\nHypothesis translation (mm): '+proposal.registration.motorToFrameTranslationMm.join(', ')+
    '\nMount hole spacing difference (mm): '+proposal.patternHypotheses.frameMinusMotorMm+
    '\nBroad phase: '+proposal.broadphase.status+
    '\nALL PHYSICAL AND FLIGHT APPROVALS: FALSE'+
    (verified.matchedSourceReceipt?'\nPAIRED SOURCE RECEIPT: both source digests matched, vendor origin NOT authenticated':'\nPAIRED SOURCE RECEIPT: not supplied');
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
   if(verified.topologyReview){
    const display=currentViewer.setTopologyEvidence(verified.topologyReview);
    topoSummary.textContent+=' 3D display: '+display.sourcePlanarMarkers+
      ' source-only frame plane points, orange Y=15.5 mm / violet Y=17.0 mm. No motor mating surface located.';
   }
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
