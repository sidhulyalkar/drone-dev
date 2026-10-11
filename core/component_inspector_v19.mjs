/**
 * AeroForge v1.9: one source-aware, revision-conscious part inspector.
 * No demo catalog object is a physical SKU. Alternatives are re-screened design hypotheses.
 */
import {catalog} from './catalog.mjs';
import {evaluate} from './engine.mjs';
import {findEvidence} from './evidence.mjs';

export const INSPECTOR_SCHEMA='aeroforge/component-inspector/v1.9';
const roleMap=Object.freeze({
 frame:{slot:'frame',group:'frames',label:'Frame / structure'},
 canopy:{slot:'frame',group:'frames',label:'Upper mounting plate',proxyOnly:true},
 stack:{slot:'stack',group:'stacks',label:'Flight controller and ESC stack'},
 pdb:{slot:'stack',group:'stacks',label:'Power distribution',proxyOnly:true},
 battery:{slot:'battery',group:'batteries',label:'Battery pack'},
 camera:{slot:'video',group:'video',label:'Camera and video'},
 antenna:{slot:'video',group:'video',label:'Radio antenna',proxyOnly:true},
 harness:{slot:'battery',group:'batteries',label:'Battery and power harness',proxyOnly:true},
 payload:{slot:null,group:null,label:'Optional payload',proxyOnly:true}
});
function roleFor(partId){
 if(typeof partId!=='string'||partId.length>80)throw Error('Invalid selected part identity');
 if(roleMap[partId])return roleMap[partId];
 const indexed=/^(motor|prop|esc)-([0-3])$/.exec(partId);
 if(indexed){
  if(indexed[1]==='motor')return {slot:'motor',group:'motors',label:'Brushless motor '+(Number(indexed[2])+1)};
  if(indexed[1]==='prop')return {slot:'prop',group:'props',label:'Propeller '+(Number(indexed[2])+1)};
  return {slot:'stack',group:'stacks',label:'ESC on arm '+(Number(indexed[2])+1),proxyOnly:true};
 }
 throw Error('Unrecognized procedural part '+partId);
}
function specFacts(part){
 if(!part)return [];
 const desired=['wheelbase','size','mount','motorMount','kv','propRange','maxCurrent','escA','cells','connector','capacity','voltage','cameraWidth','firmware','watts','mass','price'];
 return desired.filter(k=>part[k]!==undefined).map(k=>{
  const v=part[k];
  const label={wheelbase:'Wheelbase (mm)',size:'Nominal size',mount:'Nominal mount pattern (mm)',motorMount:'Motor-mount patterns (mm)',
   kv:'Nominal KV',propRange:'Nominal prop range (in)',maxCurrent:'Catalog max current (A)',escA:'Catalog ESC rating (A)',
   cells:'Catalog battery cells',connector:'Connector family',capacity:'Catalog capacity (mAh)',voltage:'Catalog voltage (V)',
   cameraWidth:'Catalog camera width (mm)',firmware:'Listed firmware families',watts:'Catalog draw (W)',
   mass:'Illustrative mass (g)',price:'Illustrative cost (USD)'}[k]||k;
  return {key:k,label,value:Array.isArray(v)?v.join(', '):String(v),authority:'UNVERIFIED_CATALOG_CLASS'};
 });
}
export function summarizeScreen(result){
 const findings=result?.findings||[];
 const blockers=findings.filter(x=>x.level==='blocked');
 const measures=findings.filter(x=>x.level==='measure');
 return {blockers:blockers.map(x=>({code:x.code,why:x.message})),
  measurementHolds:measures.length,totalFindings:findings.length,
  status:blockers.length?'CONCEPT_SCREEN_BLOCKED':'CONCEPT_SCREEN_NO_BLOCKERS_NOT_FIT_VALIDATED'};
}
export function screenCatalogAlternatives(design,slot,{limit=6}={}){
 if(!design?.settings||!design.parts)throw Error('Design result required');
 const key={frame:'frames',motor:'motors',stack:'stacks',battery:'batteries',prop:'props',video:'video'}[slot];
 if(!key)throw Error('Unknown catalog slot');
 const current=design.parts[slot];
 return catalog[key].filter(x=>x.id!==current.id).slice(0,limit).map(alt=>{
  try{
   const evaluated=evaluate({...design.settings,[slot]:alt.id});
   const screen=summarizeScreen(evaluated);
   return {id:alt.id,name:alt.name,price:alt.price,illustrativeMassGrams:alt.mass,
    screen,canPreview:true,exactSkuVerified:false,physicalFitVerified:false,
    priceLive:false,notice:'Alternative is a candidate for a new screening run, not confirmed interchangeable.'};
  }catch(e){
   return {id:alt.id,name:alt.name,price:alt.price,illustrativeMassGrams:alt.mass,
    screen:{status:'CONCEPT_SCREEN_UNAVAILABLE',blockers:[],measurementHolds:null,totalFindings:null},
    canPreview:false,exactSkuVerified:false,physicalFitVerified:false,priceLive:false,
    notice:'Alternative screening failed: '+e.message};
  }
 });
}
export function compileComponentInspector(design,partId,{plan=null}={}){
 const part=roleFor(partId);
 if(!design?.parts||!design.settings)throw Error('Current design required');
 const selected=part.slot?design.parts[part.slot]:null;
 if(part.slot&&!selected)throw Error('Missing selected slot '+part.slot);
 const evidence=!part.proxyOnly&&selected?findEvidence(part.slot,selected.id):[];
 const steps=Array.isArray(plan?.steps)?plan.steps.filter(s=>s.parts?.includes(partId)).map(s=>({
  id:s.id,title:s.title,stage:s.stage,gate:s.gate,
  source:s.source?.url||null,warning:s.warning,checks:s.checks?.slice(0,3)||[],
  evidenceAuthority:'LEARNING_STEP_NOT_ASSEMBLY_APPROVAL'})):[];
 const alternatives=part.proxyOnly||!part.slot?[]:screenCatalogAlternatives(design,part.slot);
 return {
  schema:INSPECTOR_SCHEMA,partId,title:part.label,
  identity:{slot:part.slot,selectedCatalogId:selected?.id||null,selectedName:selected?.name||null,
   kind:part.proxyOnly?'ILLUSTRATIVE_SUBASSEMBLY_PROXY':'ILLUSTRATIVE_COMPONENT_CLASS',
   exactSku:null,manufacturerRevision:null,receivedPartInspected:false},
  specifications:part.proxyOnly?[]:specFacts(selected),
  candidateSources:evidence.map(e=>({id:e.id,title:e.name,url:e.url,sourceType:e.sourceType,
   status:e.status,reviewedAt:e.retrieved,known:e.facts,unresolved:e.unknowns,
   noOrderClaim:true})),
  alternatives,
  steps,assemblyContext:plan?.key?{planKey:plan.key,track:plan.track,
   authority:plan.modelAuthority}:null,
  designScreen:summarizeScreen(design),
  procurementApproved:false,powerApproved:false,flightApproved:false,
  message:'Concept class, NOT a purchasable qualified SKU. Verify exact model, revision, dimensions, pinouts, price and local availability before ordering.'
 };
}
