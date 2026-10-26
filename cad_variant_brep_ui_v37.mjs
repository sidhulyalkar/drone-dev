/** v3.7 local-only BREP research job preparation and source result review.
 * Never modifies the original registration proposal or applies a hardware BOM.
 */
import {createX500UnqualifiedVariant,VARIANT_MODES,MOTOR_SITES}
 from './core/x500_assembly_variant_v36.mjs';
import {planX500VariantExactBrep,reviewX500VariantBrepResult}
 from './core/x500_variant_exact_brep_v37.mjs';
import {buildX500VariantEvidenceReport}
 from './core/x500_variant_evidence_report_v37.mjs';
const el=(tag,label='')=>{const x=document.createElement(tag);x.textContent=label;return x;};
const encoded=s=>new TextEncoder().encode(s);
const hashHex=async value=>Array.from(new Uint8Array(
 await crypto.subtle.digest('SHA-256',encoded(value))),
 x=>x.toString(16).padStart(2,'0')).join('');
const stringify=obj=>JSON.stringify(obj,null,2)+'\n';
const hashRawBytes=async bytes=>Array.from(new Uint8Array(
 await crypto.subtle.digest('SHA-256',bytes)),
 x=>x.toString(16).padStart(2,'0')).join('');
const save=(name,data)=>{
 const u=URL.createObjectURL(new Blob([data],{type:'application/json'}));
 const a=el('a');a.href=u;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(u),1000);
};
export function createX500VariantBrepPanel(){
 const panel=el('details');panel.id='cad-v37-brep-execution';panel.hidden=true;
 panel.append(el('summary','Plan new bounded BREP checks for one hypothetical replacement (not flight clearance)'));
 const intro=el('p','Select one original arm and one original-source opposing-normal 3D hypothesis. Export BOTH matching report-derivative v3.6 scenario JSON and v3.7 execution-plan JSON. The actual original STEP files are required for a new local CAD run.');
 const controls=el('div');controls.className='cad-v37-controls';
 const siteLabel=el('label','Original frame arm');
 const site=el('select');site.id='cad-v37-arm';
 for(const s of MOTOR_SITES){const opt=el('option',s.id+' · '+s.framePatternId);
  opt.value=s.id;site.append(opt);}
 siteLabel.append(site);
 const poseLabel=el('label','Original-source 3D rotation, with opposing candidate face normals');
 const pose=el('select');pose.id='cad-v37-source-pose';poseLabel.append(pose);
 controls.append(siteLabel,poseLabel);
 const statement=el('p','No complete original source evidence verified.');
 statement.id='cad-v37-status';
 const info=el('pre');info.className='cad-v37-readout';
 const exportRow=el('div');exportRow.className='cad-v37-export-row';
 const scenarioExport=el('button','Export matching v3.6 source-variant JSON');
 const runExport=el('button','Export v3.7 bounded CAD run plan JSON');
 scenarioExport.id='cad-v37-export-variant';runExport.id='cad-v37-export-plan';
 scenarioExport.type='button';runExport.type='button';scenarioExport.disabled=true;runExport.disabled=true;
 exportRow.append(scenarioExport,runExport);
 const evidenceLabel=el('label','Optional completed v3.7 local BREP worker result (JSON)');
 const evidence=el('input');evidence.id='cad-v37-result-file';evidence.type='file';
 evidence.accept='.json,application/json';evidenceLabel.append(evidence);
 const reportExport=el('button','Export source-redacted model evidence report JSON');
 reportExport.type='button';reportExport.id='cad-v37-export-report';
 reportExport.disabled=true;
 const resultBox=el('pre','NO VERIFIED NEW BREP RESULT. Historical model overlaps remain unresolved.');
 resultBox.className='cad-v37-readout';resultBox.id='cad-v37-result-status';
 const warn=el('small','This workflow does not run CAD Booleans inside the browser, select real motor hardware, remove physical parts, certify an OEM BOM, verify fastener engagement or authorize flight. Partial, failed, timed-out or zero modeled intersection results cannot certify actual fit.');
 panel.append(intro,controls,statement,info,exportRow,evidenceLabel,reportExport,resultBox,warn);
 let source=null,built=null,busy=0,reviewedReport=null;
 function download(name,value){if(!value)throw Error('No verified research file prepared');save(name,value);}
 function reset(){
  ++busy;source=null;built=null;panel.hidden=true;
  site.value='arm-1';pose.replaceChildren();evidence.value='';
  info.textContent='';resultBox.textContent='NO VERIFIED NEW BREP RESULT.';
  reviewedReport=null;reportExport.disabled=true;
  scenarioExport.disabled=true;runExport.disabled=true;
 }
 function posesForSite(){
  if(!source)return[];
  const frame=MOTOR_SITES.find(x=>x.id===site.value)?.framePatternId;
  return source.contactReview.candidates.filter(x=>
   x.framePatternId===frame&&x.opposingSourceNormals===true&&
   x.exactBrepBooleanStatus==='NOT_RUN');
 }
 function updatePoses(){
  pose.replaceChildren();
  for(const p of posesForSite()){
   const opt=el('option',p.id+' · motor face '+p.motorPlaneFaceIndex+
    ' / frame face '+p.framePlaneFaceIndex);opt.value=p.id;pose.append(opt);
  }
  void recalculate();
 }
 async function recalculate(){
  const ticket=++busy;built=null;reviewedReport=null;
  scenarioExport.disabled=true;runExport.disabled=true;reportExport.disabled=true;
  evidence.value='';
  resultBox.textContent='NO VERIFIED NEW BREP RESULT. Select a pose and execute locally.';
  if(!source||!pose.value){statement.textContent='No opposing-normal source pose selected.';return;}
  try{
   const variant=createX500UnqualifiedVariant(
    source.assemblyReview,source.rawAssembly,source.assemblySha,
    {mode:VARIANT_MODES.REPLACE,siteId:site.value});
   const scenarioText=stringify(variant);
   const variantDigest=await hashHex(scenarioText);
   if(ticket!==busy)return;
   const plan=planX500VariantExactBrep(variant,variantDigest,
    source.contactReview,source.contactReportSha,pose.value);
   const planText=stringify(plan);
   const planDigest=await hashHex(planText);
   if(ticket!==busy)return;
   built={variant,scenarioText,plan,planText,planDigest};
   statement.textContent='UNEXECUTED BREP JOB: '+plan.targetSiteId+
    ', '+plan.expectedOriginalSourceAabbPairs.length+
    ' expected source-solid candidate pairs. The 242 retained frame solids and four motor solids must be reimported and screened.';
   info.textContent=[
    'Pose: '+plan.pose.id,
    'Original source motor model: DJ-2216-KV880',
    'Proposed alternative motor model: AIR2216II (NOT AUTHORIZED)',
    'Excluded from hypothetical source plan: '+plan.explicitlyMaskedFrameSolidIndices.join(', '),
    'Retained original source frame solids: '+plan.memberSourceFrameSolidIndices.length,
    'Source motor solids: '+plan.memberSourceMotorSolidIndices.length,
    'Original STEP files modified: NO',
    'Recompute all bounding boxes from original files: REQUIRED',
    'Run a fresh exact Boolean for every screened pair: REQUIRED',
    'Exact BREP run result: NOT EXECUTED',
    'Physical mounting face, BOM, threads, tolerances: NOT VERIFIED'
   ].join('\n');
   scenarioExport.disabled=false;runExport.disabled=false;
  }catch(err){if(ticket===busy){statement.textContent=String(err.message||err);
   info.textContent='Plan was rejected. No fit, clearance or mechanical approval.';}}
 }
 function setEvidence(assemblyReview,rawAssembly,assemblySha,contactReview,contactReportSha){
  if(contactReview?.schema!=='aeroforge/x500-source-contact-browser-review/v3.3'||
   assemblyReview?.schema!=='aeroforge/x500-xcaf-assembly-browser-review/v3.5')
   throw Error('Original v3.5 assembly and v3.3 source pose verification required');
  // The first variant must be possible before exposing scenario controls.
  createX500UnqualifiedVariant(assemblyReview,rawAssembly,assemblySha,
   {mode:VARIANT_MODES.REPLACE,siteId:'arm-1'});
  source={assemblyReview,rawAssembly,assemblySha,contactReview,contactReportSha};
  panel.hidden=false;site.value='arm-1';updatePoses();
 }
 site.addEventListener('change',updatePoses);
 pose.addEventListener('change',()=>{void recalculate();});
 scenarioExport.addEventListener('click',()=>{
  download('x500-arm-'+site.value+'-source-variant.v36.json',built?.scenarioText);
 });
 runExport.addEventListener('click',()=>{
  download('x500-arm-'+site.value+'-exact-brep-request.v37.json',built?.planText);
 });
 reportExport.addEventListener('click',()=>{
  download('x500-'+site.value+'-model-evidence.v37.json',
   reviewedReport?stringify(reviewedReport):null);
 });
 evidence.addEventListener('change',async()=>{
  const ticket=++busy;reviewedReport=null;reportExport.disabled=true;
  resultBox.textContent='Examining locally generated BREP evidence. No physical fit authorization.';
  const chosen=built;
  const file=evidence.files?.[0];
  if(!source||!chosen||!file){
   resultBox.textContent='Exact original source-linked v3.7 run plan and worker result required.';return;
  }
  try{
   if(file.size>512*1024)throw Error('v3.7 BREP result exceeds 512 KB');
   const bytes=await file.arrayBuffer();
   const receipt=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   const receiptDigest=await hashRawBytes(bytes);
   if(ticket!==busy)return;
   const validated=reviewX500VariantBrepResult(chosen.plan,receipt,chosen.planDigest);
   const report=buildX500VariantEvidenceReport(
    chosen.plan,receipt,chosen.planDigest,receiptDigest);
   if(ticket!==busy)return;
   reviewedReport=report;reportExport.disabled=false;
   resultBox.textContent=[
    'CAD MODEL ONLY: '+validated.modeledStatus,
    'Expected/recorded exact BREP pairs: '+validated.numberOfExpectedPairs+
     ' / '+validated.evaluatedPairs,
    'Positive ideal-CAD intersection pairs (over threshold): '+validated.modelPositivePairs,
    'Small positive volumes (indeterminate): '+validated.subthresholdPositiveModelPairs,
    'Zero-volume BREP contacts (indeterminate): '+validated.nonvolumetricContactPairs,
    'Independent distance near-contact pairs (indeterminate): '+validated.geometricNearContactPairs,
    'Smallest model-separated pair gap: '+
     (validated.minimumMeasuredSeparatedModelGapMm===null?'NO MEASURED SEPARATION':
      validated.minimumMeasuredSeparatedModelGapMm+' mm'),
    'Indeterminate/not-run pairs: '+validated.untestedOrIndeterminatePairs,
    'Largest modeled positive overlap: '+validated.largestPositiveModelOverlapMm3+' mm³',
    'Largest small positive modeled overlap: '+validated.largestSubthresholdModelOverlapMm3+' mm³',
    'Source-linked evidence report: READY TO EXPORT (not independently attested)',
    'Mechanical fastener/physical BOM qualification: NO',
    'Real-world fit, manufacture, procurement, power/flight: NOT APPROVED'
   ].join('\n');
  }catch(err){if(ticket===busy)resultBox.textContent=
   'REJECTED SOURCE BREP WORKER RESULT: '+String(err.message||err)+
   '. No clearance or hardware authorization.';}
 });
 return {panel,reset,setEvidence};
}
