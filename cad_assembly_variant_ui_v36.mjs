/** v3.6 isolated, read-only source CAD assembly-variant planner.
 * Never drives the original CAD pose, removes model geometry or issues a BOM.
 */
import {createX500UnqualifiedVariant,VARIANT_MODES,MOTOR_SITES} from './core/x500_assembly_variant_v36.mjs';
const el=(tag,text='')=>{const x=document.createElement(tag);x.textContent=text;return x;};
export function createX500VariantPanel(){
 const panel=el('details');panel.id='cad-v36-variant-plan';panel.hidden=true;
 panel.append(el('summary','Compare retain-existing versus hypothetical AIR2216II replacement (unqualified)'));
 const intro=el('p','Original STEP contains DJ-2216-KV880 geometry at four arm locations. Choose a source-only simulation alternative; physical part compatibility and actual assembly configuration remain unknown.');
 const controls=el('div');controls.className='cad-v36-controls';
 const modeLabel=el('label','Research scenario');
 const mode=el('select');mode.id='cad-v36-scenario-mode';
 for(const [value,label] of [
  [VARIANT_MODES.RETAIN,'Retain existing source motor geometry, do not add AIR2216II'],
  [VARIANT_MODES.REPLACE,'Hypothetically replace one source motor with AIR2216II CAD']
 ]){
  const opt=el('option',label);opt.value=value;mode.append(opt);
 }
 modeLabel.append(mode);
 const siteLabel=el('label','Target frame arm');
 const site=el('select');site.id='cad-v36-target-site';
 for(const s of MOTOR_SITES){
  const opt=el('option',s.id+' · '+s.framePatternId);opt.value=s.id;site.append(opt);
 }
 siteLabel.append(site);controls.append(modeLabel,siteLabel);
 const status=el('p','No original XCAF assembly review loaded.');
 status.id='cad-v36-status';
 const masks=el('pre');masks.className='cad-v36-readout';
 const gates=el('p','Mechanical, electrical, BOM and flight gates are unqualified.');
 const exportBtn=el('button','Export source-only scenario plan JSON');exportBtn.type='button';
 exportBtn.id='cad-v36-export';exportBtn.disabled=true;
 const warning=el('small','Excluding a motor CAD occurrence in this hypothetical plan is NOT removal of a real part. A historical collision report does not become a new fit test. All nine original source-model collision groups remain in the permanent evidence history.');
 panel.append(intro,controls,status,masks,gates,exportBtn,warning);
 let verifiedReview=null,raw=null,digest=null,result=null;
 function reset(){
  verifiedReview=null;raw=null;digest=null;result=null;
  panel.hidden=true;mode.value=VARIANT_MODES.RETAIN;site.value='arm-1';
  status.textContent='No original XCAF assembly review loaded.';
  masks.textContent='';exportBtn.disabled=true;
 }
 function update(){
  if(!verifiedReview||!raw||!digest)return;
  result=createX500UnqualifiedVariant(verifiedReview,raw,digest,{
   mode:mode.value,siteId:site.value
  });
  exportBtn.disabled=false;
  const previous=result.originalCollisionEvidence;
  const historical=result.hypotheticalHistoricalComparison;
  status.textContent=(result.proposedMotorModel?
   'UNQUALIFIED REPLACEMENT STUDY':'RETAIN ORIGINAL-SOURCE MOTOR MODEL')+
   ' · original CAD pairs '+previous.exactOriginalSourceRawPairs+
   ' · original positive intersections '+previous.exactOriginalPositivePairComparisons+
   ' · nine distinct positive geometry groups preserved.';
  masks.textContent=[
   'Source site: '+result.targetSiteId+' ('+result.targetFramePatternId+')',
   'Original motor model: '+result.originalSourceMotorModel,
   'Proposed motor model: '+(result.proposedMotorModel??'NOT INCLUDED'),
   'Hypothetical old motor CAD leaf mask: '+
    (result.excludedFromHypotheticalStudyOnly.join(', ')||'NONE'),
   'Original STEP modified: NO',
   'Exact original source BREP evidence: 30 raw pairs / 13 raw positives',
   'Remaining model-only comparison status: '+historical.status,
   'Historical BREP pairs after hypothetical mask (when comparable): '+
    (historical.sourceGeometryPairsAfterModelMask??'NOT EVALUATED'),
   'Historical positive groups in filtered view: '+
    (historical.historicallyPositivePairsAmongUnmasked??'NOT EVALUATED'),
   'Fresh exact BREP for selected variant: NOT RUN',
   'Received motor revision and OEM BOM: NOT VERIFIED',
   'Actual compatibility, mounting threads, ESC/prop fit: NOT VERIFIED',
   'Physical assembly approval: NO'
  ].join('\n');
  gates.textContent='Open gates: manufacturer/actual kit identity, replacement intent, seating plane, bolt/thread engagement, assembly part multiplicity, fresh BREP collisions, tolerances, ESC compatibility and rotor clearance.';
 }
 function setEvidence(review,rawReport,reportSha256){
  // Validate before changing any visible state; a source mismatch fails closed.
  createX500UnqualifiedVariant(review,rawReport,reportSha256,
   {mode:VARIANT_MODES.RETAIN,siteId:'arm-1'});
  verifiedReview=review;raw=rawReport;digest=reportSha256;
  panel.hidden=false;mode.value=VARIANT_MODES.RETAIN;site.value='arm-1';update();
 }
 mode.addEventListener('change',update);site.addEventListener('change',update);
 exportBtn.addEventListener('click',()=>{
  if(!result)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)+'\n'],
   {type:'application/json'}));
  const link=el('a');link.href=url;link.download='aeroforge-X500-unqualified-assembly-scenario-v36.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 return {panel,setEvidence,reset};
}
