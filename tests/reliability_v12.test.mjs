import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syntheticExample,evaluateDimensionalInput} from '../core/dimensional_v11.mjs';
import {HASH_ORIGINS,REVIEW_SCHEMA,newReviewState,invalidateReview,bindInspection,getCurrentReview,
 exportReviewPacket,importReviewMeasurements} from '../core/review_v12.mjs';
import {compileBuildPlan,newBuildSession,recordObservation,reconcileBuildSession} from '../core/assembly_v08.mjs';
import {WORKSPACE_SCHEMA,emptyWorkspace,planIdentity,storeSession,getStoredSession,readWorkspace,migrateLegacySession} from '../core/workspace_v12.mjs';
const base={track:'fpv',videoSystem:'analog',selection:{frame:'frame-rev1',motor:'motor-rev1',stack:'stack-rev1',battery:'pack-rev1'}};
test('dimensional review exports the exact inspected snapshot, with no manufacturer authority',()=>{
 const input=syntheticExample();
 const state=bindInspection(newReviewState(),input);
 const current=getCurrentReview(state,input);
 assert.equal(current.evaluation.schema,'aeroforge/dimensional-evaluation/v1.1');
 const exp=exportReviewPacket(state,input);
 assert.equal(exp.schema,REVIEW_SCHEMA);
 assert.equal(exp.sourceHashOrigin,HASH_ORIGINS.NONE);
 assert.equal(exp.sourceAuthenticated,false);
 assert.equal(exp.manufacturerCadImported,false);
 assert.equal(exp.qualifiedForFlight,false);
 assert.deepEqual(exp.inspection,current.evaluation.design);
});
test('silent form mutation is caught at export even without a UI input event',()=>{
 const input=syntheticExample();const reviewed=bindInspection(newReviewState(),input);
 input.rotors[0].centerMm[0]+=10;
 assert.throws(()=>getCurrentReview(reviewed,input),/Form differs/);
 assert.throws(()=>exportReviewPacket(reviewed,input),/Form differs/);
});
test('invalidated inspection cannot export old geometry, but new review can',()=>{
 const input=syntheticExample();let s=bindInspection(newReviewState(),input);
 s=invalidateReview(s,'FIELD_EDITED');
 assert.throws(()=>getCurrentReview(s,input),/stale/);
 const changed=structuredClone(input);changed.minimumGapMm=14;
 s=bindInspection(s,changed);
 assert.equal(getCurrentReview(s,changed).evaluation.design.minimumGapMm,14);
 assert.equal(s.revision,1);
});
test('local bytes digest and imported digest are different unverified evidence types',()=>{
 const input=syntheticExample();input.source.sha256='a'.repeat(64);
 const local=bindInspection(newReviewState(),input,HASH_ORIGINS.LOCAL);
 const report=exportReviewPacket(local,input);
 assert.equal(report.sourceHashOrigin,HASH_ORIGINS.LOCAL);
 assert.equal(report.sourceAuthenticated,false);
 const claimed=importReviewMeasurements(report);
 assert.equal(claimed.sourceHashOrigin,HASH_ORIGINS.CLAIM);
 assert.equal(claimed.importedDocumentUntrusted,true);
 const x=bindInspection(newReviewState(),claimed.input,claimed.sourceHashOrigin);
 assert.equal(exportReviewPacket(x,claimed.input).sourceHashOrigin,HASH_ORIGINS.CLAIM);
});
test('a digest cannot be claimed without source bytes, nor silently omit its origin',()=>{
 const x=syntheticExample();
 assert.throws(()=>bindInspection(newReviewState(),x,HASH_ORIGINS.LOCAL));
 x.source.sha256='b'.repeat(64);
 assert.throws(()=>bindInspection(newReviewState(),x,HASH_ORIGINS.NONE));
 assert.throws(()=>bindInspection(newReviewState(),x,'MANUFACTURER_VERIFIED'));
});
test('v1.1 evaluation and v1.2 review files can be safely reopened as claims',()=>{
 const x=syntheticExample(),q=evaluateDimensionalInput(x);
 assert.deepEqual(importReviewMeasurements(q).input,q.design);
 const s=bindInspection(newReviewState(),x);
 assert.deepEqual(importReviewMeasurements(exportReviewPacket(s,x)).input,q.design);
 assert.throws(()=>importReviewMeasurements({schema:'evil',design:x}));
});
test('workspace archives exact design plans, not only short plan hashes',()=>{
 const p=compileBuildPlan(base),q=compileBuildPlan({...base,selection:{...base.selection,stack:'stack-rev2'}});
 assert.notEqual(planIdentity(p),planIdentity(q));
 let session=newBuildSession(p);
 session=recordObservation(session,p,'inventory',{note:'Checked delivered components and serial labels'});
 let workspace=storeSession(emptyWorkspace(),p,session);
 const candidate=reconcileBuildSession(session,q);
 workspace=storeSession(workspace,q,candidate);
 assert.equal(workspace.schema,WORKSPACE_SCHEMA);
 assert.equal(workspace.entries.length,2);
 assert.equal(getStoredSession(workspace,p).entries.inventory.receipts.length,1);
 assert.equal(getStoredSession(workspace,q).planKey,q.key);
 assert.equal(readWorkspace(JSON.stringify(workspace)).entries.length,2);
});
test('revisiting a previous design retrieves its own old notes without destructive reconciliation',()=>{
 const a=compileBuildPlan(base);
 const b=compileBuildPlan({...base,videoSystem:'dji-o3'});
 const entry=recordObservation(newBuildSession(a),a,'fpv-video',{note:'Camera model and VTX variant recorded'});
 let w=storeSession(emptyWorkspace(),a,entry);
 w=storeSession(w,b,reconcileBuildSession(entry,b));
 assert.equal(getStoredSession(w,a).entries['fpv-video'].receipts.length,1);
 assert.equal(getStoredSession(w,b).entries['fpv-video'],undefined);
});
test('workspace bad JSON, duplicate identities and oversized payloads fail closed',()=>{
 assert.deepEqual(readWorkspace(null),emptyWorkspace());
 assert.throws(()=>readWorkspace('{broken'),/invalid JSON/);
 assert.throws(()=>readWorkspace('x'.repeat(1900001)),/limit/);
 const p=compileBuildPlan(base);
 const w=storeSession(emptyWorkspace(),p,newBuildSession(p));
 w.entries.push(structuredClone(w.entries[0]));
 assert.throws(()=>readWorkspace(JSON.stringify(w)),/Duplicate/);
 assert.throws(()=>storeSession(emptyWorkspace(),p,{schema:'wrong'}));
});
test('archive capacity is fail-closed and never silently evicts prior build notes',()=>{
 let w=emptyWorkspace();
 for(let i=0;i<12;i++){
  const p=compileBuildPlan({...base,selection:{...base.selection,stack:'revision-'+i}});
  w=storeSession(w,p,newBuildSession(p));
 }
 assert.equal(w.entries.length,12);
 const newPlan=compileBuildPlan({...base,selection:{...base.selection,stack:'revision-12'}});
 assert.throws(()=>storeSession(w,newPlan,newBuildSession(newPlan)),/revision limit/);
 assert.equal(w.entries.length,12);
});
test('legacy v0.8 session migrates only into exactly matching selected plan',()=>{
 const p=compileBuildPlan(base),s=newBuildSession(p);
 assert.equal(migrateLegacySession(JSON.stringify(s),p).planKey,p.key);
 const b=compileBuildPlan({...base,videoSystem:'walksnail'});
 assert.equal(migrateLegacySession(JSON.stringify(s),b),null);
 assert.equal(migrateLegacySession('{bad',p),null);
});
test('v1.2 UI integration has valid anchors and exports gated by current input',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../dimensional_ui_v11.mjs',import.meta.url),'utf8');
 const nav=readFileSync(new URL('../navigator_ui_v12.mjs',import.meta.url),'utf8');
 const assembly=readFileSync(new URL('../assembly_ui_v08.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const id of ['workflow-v12','workflow-v12-status','dim-review-proof'])assert.ok(ids.includes(id));
 for(const m of nav.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]));
 const links=[...html.matchAll(/<a href="#([^"]+)"/g)].map(x=>x[1]);
 for(const id of links)assert.ok(ids.includes(id),'Missing anchor '+id);
 assert.ok(ui.includes('getCurrentReview(reviewState,snapshot())'));
 assert.ok(ui.includes('if(token!==hashToken)return'));
 assert.ok(ui.includes("invalidate('FIELD_EDITED:"));
 assert.ok(assembly.includes('getStoredSession(archive,candidate)'));
 for(const id of ['assembly-export-all','assembly-clear-archive'])assert.ok(ids.includes(id));
 assert.ok(html.includes('ILLUSTRATIVE MASS')&&html.includes('ILLUSTRATIVE TIME'));
 assert.ok(html.includes('navigator_ui_v12.mjs'));
});
