import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate} from '../core/engine.mjs';
import {presets} from '../core/presets.mjs';
import {compileBuildPlan} from '../core/assembly_v08.mjs';
import {INSPECTOR_SCHEMA,compileComponentInspector,screenCatalogAlternatives}
 from '../core/component_inspector_v19.mjs';

const design=(name='freestyle')=>evaluate({...presets.find(x=>x.id===name).settings,groundKit:'digital'});
const plan=d=>compileBuildPlan({track:'fpv',videoSystem:'analog',variant:'six_c',
 selection:Object.fromEntries(['frame','motor','prop','stack','battery','video'].map(k=>[k,d.parts[k].id]))});
test('the selected motor maps to the actual design class without asserting exact SKU',()=>{
 const d=design(),p=plan(d),x=compileComponentInspector(d,'motor-0',{plan:p});
 assert.equal(x.schema,INSPECTOR_SCHEMA);
 assert.equal(x.identity.slot,'motor');
 assert.equal(x.identity.selectedCatalogId,d.parts.motor.id);
 assert.equal(x.identity.exactSku,null);
 assert.equal(x.identity.manufacturerRevision,null);
 assert.equal(x.procurementApproved,false);
 assert.equal(x.powerApproved,false);
 assert.equal(x.flightApproved,false);
 assert.ok(x.specifications.some(s=>s.key==='kv'));
 assert.ok(x.steps.some(s=>s.id==='motors'));
 assert.equal(x.steps.find(s=>s.id==='motors').evidenceAuthority,'LEARNING_STEP_NOT_ASSEMBLY_APPROVAL');
});
test('all procedural showcase part IDs resolve; wiring and canopy do not create fake part SKUs',()=>{
 const d=design();
 for(const id of ['frame','canopy','stack','pdb','battery','camera','antenna','harness','payload',
  ...[0,1,2,3].flatMap(i=>['motor-'+i,'prop-'+i,'esc-'+i])]){
  const x=compileComponentInspector(d,id);
  assert.equal(x.procurementApproved,false,id);
  assert.equal(x.flightApproved,false,id);
  if(['canopy','pdb','antenna','harness','payload'].includes(id))assert.equal(x.alternatives.length,0,id);
 }
});
test('alternatives rerun full engine and remain illustrative, even with no synthetic blockers',()=>{
 const d=design(),alts=screenCatalogAlternatives(d,'motor');
 assert.ok(alts.length>0);
 assert.ok(alts.every(x=>x.id!==d.parts.motor.id));
 assert.ok(alts.every(x=>x.exactSkuVerified===false&&x.physicalFitVerified===false&&!x.priceLive));
 assert.ok(alts.some(x=>x.screen.status==='CONCEPT_SCREEN_BLOCKED'));
 assert.ok(alts.some(x=>x.canPreview));
});
test('source-backed candidates are kept apart from the selected illustrative class',()=>{
 const d=design(),f=compileComponentInspector(d,'frame');
 assert.ok(f.candidateSources.some(x=>x.id==='source-one-v5'));
 assert.ok(f.candidateSources.every(x=>x.noOrderClaim&&x.unresolved.length));
 assert.equal(f.identity.exactSku,null);
 const alternative=compileComponentInspector(d,'motor-0');
 assert.equal(alternative.candidateSources.length,0);
});
test('assembly cross-links use current revision plan step identities, never guessed step indices',()=>{
 const d=design(),p=plan(d);
 const r=compileComponentInspector(d,'motor-0',{plan:p});
 assert.equal(r.assemblyContext.planKey,p.key);
 assert.equal(r.assemblyContext.track,'fpv');
 assert.ok(r.steps.every(s=>p.steps.some(v=>v.id===s.id&&v.parts.includes('motor-0'))));
});
test('unrecognized part and malformed plan cannot elevate authority',()=>{
 const d=design();
 assert.throws(()=>compileComponentInspector(d,'not-a-part'),/Unrecognized/);
 assert.throws(()=>screenCatalogAlternatives(d,'missing-slot'),/Unknown/);
 const card=compileComponentInspector(d,'frame',{plan:{key:'invalid',steps:[]}});
 assert.equal(card.flightApproved,false);
});
test('UI preserves source candidate, alternative and exact revision-scoped step actions',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../inspector_ui_v19.mjs',import.meta.url),'utf8');
 const assembly=readFileSync(new URL('../assembly_ui_v08.mjs',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['af-inspector-v19','af-v19-facts','af-v19-assembly','af-v19-alternatives',
  'af-v19-sources','af-v19-steps','af-v19-options','af-v19-source-list','af-v19-part-browser'])
  assert.ok(ids.includes(id),id);
 assert.ok(html.includes('inspector_ui_v19.mjs')&&html.includes('inspector_v19.css'));
 assert.match(ui,/aeroforge:select-catalog-alternative/);
 assert.match(ui,/aeroforge:assembly-open-step/);
 assert.match(assembly,/aeroforge:assembly-context-updated/);
 assert.match(assembly,/plan.key!==planKey/);
 assert.match(app,/aeroforge:select-catalog-alternative/);
});
