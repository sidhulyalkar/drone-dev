import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VIEW_MODES,VIEW_AUTHORITY,isCadPreviewLinked,transitionViewMode,viewportNotice}
 from '../core/viewport_v18.mjs';
const source=()=>({
 schema:'aeroforge/cad-preview-evidence/v1.3',glbHashMatchesManifest:true,
 manifest:{mesh:{sha256:'b'.repeat(64)},source:{fileName:'x500v2-frame.step'},
  conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED'}}
});
test('viewer modes are three explicit presentation-only choices',()=>{
 assert.deepEqual(VIEW_MODES,['aircraft','exploded','cad']);
 assert.equal(VIEW_AUTHORITY,'VISUALIZATION_ONLY_NOT_MECHANICAL_APPROVAL');
 for(const name of VIEW_MODES){
  const v=transitionViewMode(name,{hasCad:true});
  assert.equal(v.fitQualified,false);assert.equal(v.flightQualified,false);
 }
});
test('CAD mode is blocked until source-linked local data exists',()=>{
 assert.throws(()=>transitionViewMode('cad'),/verify a local CAD package/);
 assert.throws(()=>transitionViewMode('unknown'),/Unknown/);
 assert.equal(transitionViewMode('cad',{hasCad:true}).sourceAuthority,'LOCAL_HASH_CHECKED_CAD_UNREGISTERED');
});
test('CAD viewer rejects absent/invalid source identity or falsely elevated frame mapping',()=>{
 assert.equal(isCadPreviewLinked(source()),true);
 const badHash=source();badHash.manifest.mesh.sha256='not-a-sha';
 assert.equal(isCadPreviewLinked(badHash),false);
 const axes=source();axes.manifest.conversion.coordinateFrame='BODY_FRD_VERIFIED';
 assert.equal(isCadPreviewLinked(axes),false);
 assert.equal(isCadPreviewLinked(null),false);
});
test('CAD and procedural labels cannot imply approved mechanical assembly',()=>{
 const cad=viewportNotice('cad',{fileName:'x500v2-frame.step'});
 assert.match(cad,/UNVERIFIED/);
 assert.match(cad,/UNAUTHENTICATED/);
 assert.match(viewportNotice('aircraft'),/NOT MANUFACTURER CAD/);
});
test('one main Build WebGL stage holds all mode and sourcing controls',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../showcase_ui_v07.mjs',import.meta.url),'utf8');
 const gl=readFileSync(new URL('../showcase_3d_v07.mjs',import.meta.url),'utf8');
 const cad=readFileSync(new URL('../cad_package_ui_v13.mjs',import.meta.url),'utf8');
 for(const id of ['af-view-aircraft','af-view-exploded','af-view-cad','af-v18-source',
  'af-v18-cad-parts','af-v18-open-cad']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.includes('viewport_v18.css'));
 assert.equal((html.match(/id="showcase-viewport"/g)||[]).length,1);
 assert.match(gl,/new GLTFLoader\(\)/);
 assert.match(gl,/cadRoot/);
 assert.match(gl,/setCadMode/);
 assert.match(gl,/getClientRects\(\)/);
 assert.match(ui,/verifyCadPackage\(preview.manifest,glb\)/);
 assert.match(cad,/aeroforge:cad-preview-ready/);
 assert.match(cad,/aeroforge:cad-visual-package-cleared/);
});
test('invisible mission and CAD viewers skip rendering while preserving scene state',()=>{
 for(const file of ['mission_3d_v10.mjs','cad_viewer_v13.mjs']){
  const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.match(source,/document.hidden/);
  assert.match(source,/getClientRects\(\)/);
 }
});
