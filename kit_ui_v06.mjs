import {qualifyKit,simulationHandoff,assemblyPacket} from './core/kit_v06.mjs';
import {compileX500Record,attachX500Cad,compareX500Records} from './core/x500_record_v14.mjs';
import {attachX500Registration} from './core/registration_v15.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const config={variant:'six_c',power:'auto',batteryCells:4,batterySku:'',radioSku:'',receiverSku:'',chargerSku:'',cadImported:false,physicalInspected:false};
let last=null,record=null,cadPreview=null,registration=null;
function file(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function show(){
 try{
 last=qualifyKit(config);
 const previous=record;
 record=compileX500Record(config);
 if(cadPreview){
  try{record=registration?attachX500Registration(record,cadPreview,registration):attachX500Cad(record,cadPreview);}
  catch{cadPreview=null;registration=null;}
 }
 $('v14-identity').textContent=record.variant+' · '+record.graphStatus+
  ' · local frame CAD '+(record.geometry.sourceHash?'linked but UNVERIFIED':'not linked');
 $('v14-parts').innerHTML=Object.values(record.parts).map(p=>
  '<li>'+p.qty+' × '+esc(p.label)+' <small>['+esc(p.familyId)+'] · revision UNKNOWN · '+(p.sourceUrl?
   '<a target="_blank" rel="noopener noreferrer" href="'+esc(p.sourceUrl)+'">source ↗</a>':'source unresolved')+
   '</small></li>').join('');
 $('v14-connections').innerHTML=record.edges.map(e=>
  '<details class="v06-finding"><summary><b class="v06-chip '+(e.status.startsWith('BLOCK')?'v06-fail':'v06-hold')+'">'+
  esc(e.status)+'</b> '+esc(e.from)+' → '+esc(e.to)+'</summary><p>'+esc(e.kind)+
  '</p><p>Verify: '+esc(e.mustVerify.join('; '))+'</p><small>NO VERIFIED PIN MAP OR CABLE RELEASE</small></details>').join('');
 if(previous){
  const changes=compareX500Records(previous,record);
  $('v14-change').textContent=changes.changedSlots.length||changes.geometryChanged?
   'Revision change invalidates: '+changes.invalidatedEvidence.join(', '):
   'No new revision changes since the previous inspection.';
 }
 window.dispatchEvent(new CustomEvent('aeroforge:x500-record-updated',
  {detail:{record,variant:record.variant}}));
 $('v06-status').textContent=last.status;
 $('v06-metrics').textContent=last.counts.documented+' documented screening facts · '+last.counts.unresolved+' unresolved · '+last.counts.failed+' failures';
 $('v06-module').textContent=last.flightController.fc+' / '+last.powerModule.name;
 $('v06-provenance').innerHTML=Object.entries(last.sources).map(([id,s])=>'<li><a href="'+esc(s.url)+'" rel="noopener noreferrer" target="_blank">'+esc(id)+'</a> <small>'+esc(s.kind)+' · reviewed '+esc(s.reviewed)+'</small></li>').join('');
 $('v06-components').innerHTML=Object.values(last.components).map(p=>'<li>'+p.qty+' × '+esc(p.name)+'</li>').join('')+
   '<li>1 × '+esc(last.flightController.fc)+'</li><li>1 × '+esc(last.powerModule.name)+'</li>';
 $('v06-findings').innerHTML=last.findings.map(f=>'<details class="v06-finding"><summary><b class="v06-chip '+(f.status==='FAIL'?'v06-fail':f.status==='DOCUMENTED'?'v06-documented':'v06-hold')+'">'+esc(f.status)+'</b><span>'+esc(f.id)+'</span></summary><p>'+esc(f.detail)+'</p><p><b>Next:</b> '+esc(f.next)+'</p><small>Evidence: '+esc(f.source.join(', '))+'</small></details>').join('');
 $('v06-sim').textContent='Upstream baseline: make px4_sitl gz_x500 · Documented, NOT run here. Custom Holybro model: BLOCKED, no measured inertia, rotor coordinates or motor coefficients.';
 $('v06-alert').textContent=last.counts.failed?'Incompatible selection. Do not connect or power this configuration.':'Manufacturer-documented pairing only. Aircraft assembly, source versions, budget, commissioning and flight remain unqualified.';
 }catch(e){last=null;$('v06-alert').textContent='Invalid selection: '+e.message;}
}
function init(){if(!$('v06-kit-variant'))return;
 const selectIds={variant:'v06-kit-variant',power:'v06-kit-power',batteryCells:'v06-kit-cells'};
 for(const [k,id] of Object.entries(selectIds)){$(id).value=config[k];$(id).addEventListener('change',e=>{config[k]=k==='batteryCells'?Number(e.target.value):e.target.value;show();});}
 const optional={batterySku:'v06-battery-sku',radioSku:'v06-radio-sku',receiverSku:'v06-rx-sku',chargerSku:'v06-charger-sku'};
 for(const [k,id] of Object.entries(optional))$(id).addEventListener('input',e=>{config[k]=e.target.value.trim();show();});
 for(const [k,id] of [['cadImported','v06-cad-flag'],['physicalInspected','v06-physical-flag']])$(id).addEventListener('change',e=>{config[k]=e.target.checked;show();});
 $('v14-download').onclick=()=>{if(record)file(JSON.stringify(record,null,2)+'\n',
  'aeroforge-x500-revision-record-v14.json','application/json');};
 window.addEventListener('aeroforge:cad-visual-package-verified',e=>{
  const preview=e.detail?.preview;
  if(preview?.manifest?.source?.fileName?.toLowerCase()==='x500v2-frame.step'){
   cadPreview=preview;show();
  }
 });
 window.addEventListener('aeroforge:cad-visual-package-cleared',()=>{
  if(cadPreview||registration){cadPreview=null;registration=null;show();}
 });
 window.addEventListener('aeroforge:x500-registration-cleared',()=>{
  if(registration){registration=null;show();}
 });
  window.addEventListener('aeroforge:x500-registration-proposed',e=>{
  if(e.detail?.proposal?.schema==='aeroforge/x500-registration-proposal/v1.5'&&
     e.detail?.preview?.manifest?.source?.sha256===cadPreview?.manifest?.source?.sha256){
   registration=e.detail.proposal;show();
  }
 });
  $('v06-download-json').onclick=()=>{if(last)file(JSON.stringify(last,null,2)+'\n','aeroforge-v06-x500-kit-qualification.json','application/json');};
 $('v06-download-assembly').onclick=()=>file(assemblyPacket(config),'aeroforge-v06-assembly-evidence.md','text/markdown');
 $('v06-download-sim').onclick=()=>file(JSON.stringify(simulationHandoff(config),null,2)+'\n','aeroforge-v06-generic-sitl-handoff.json','application/json');
 show();
}
init();
