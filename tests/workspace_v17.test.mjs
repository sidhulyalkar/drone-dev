import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORKSPACES,workspaceForRoot,selectWorkspaceFromLocation,NAVIGATION_AUTHORITY}
 from '../core/workspace_v17.mjs';

test('three minimal workspaces preserve distinct purposes',()=>{
 assert.deepEqual(WORKSPACES,['explore','build','engineering']);
 assert.equal(NAVIGATION_AUTHORITY,'PRESENTATION_ONLY_DOES_NOT_CHANGE_EVIDENCE');
 for(const key of WORKSPACES)assert.equal(selectWorkspaceFromLocation({view:key}),key);
 assert.equal(selectWorkspaceFromLocation({view:'other'}),'explore');
});
test('mission and configurator are Explore; two instruction sections are Build',()=>{
 for(const id of ['mission-planner','mission-v09','mission-v10'])assert.equal(workspaceForRoot(id),'explore');
 for(const cls of ['intro','planner-section','preset-section','workspace'])assert.equal(workspaceForRoot('',[cls]),'explore');
 for(const id of ['showcase-v07','assembly-v08'])assert.equal(workspaceForRoot(id),'build');
});
test('CAD, source, simulation, safety and historical labs default to Engineering',()=>{
 for(const id of ['reference-lab','qualification-console','v05-program-lab','x500-kit-lab','dimensional-v11','cad-package-v13'])
  assert.equal(workspaceForRoot(id),'engineering');
 assert.equal(workspaceForRoot('unknown-new-lab'),'engineering');
});
test('workspace URL selection rejects unsafe/unknown values without rewriting evidence',()=>{
 assert.equal(selectWorkspaceFromLocation({hash:'#af-workspace-build',view:'engineering'}),'build');
 assert.equal(selectWorkspaceFromLocation({hash:'#af-workspace-nope',view:'build'}),'build');
 assert.equal(selectWorkspaceFromLocation({hash:'#dimensional-v11',view:'engineering'}),'engineering');
 assert.equal(selectWorkspaceFromLocation({view:'foobar'}),'explore');
});
test('HTML shell includes nav, disclosure controls and every previous engineering deep link',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const nav=readFileSync(new URL('../navigator_ui_v12.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../workspace_v17.css',import.meta.url),'utf8');
 const all=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(all).size,all.length);
 for(const id of ['af-workspace-explore','af-workspace-build','af-workspace-engineering',
  'af-tool-menu','af-plan-options','af-customize','af-analysis','workflow-v12-status'])
  assert.ok(all.includes(id),id);
 for(const id of ['mission-planner','showcase-v07','assembly-v08','reference-lab','qualification-console',
  'v05-program-lab','x500-kit-lab','mission-v09','mission-v10','dimensional-v11','cad-package-v13'])
  assert.ok(html.includes('href="#'+id+'"'),id);
 assert.ok(html.includes('workspace_v17.css'));
 assert.ok(nav.includes('main.children')&&nav.includes('root.hidden=kind!==group'));
 assert.ok(nav.includes("window.addEventListener('hashchange',syncFromLocation)"));
 assert.ok(nav.includes('aeroforge:workspace-changed'));
 assert.ok(css.includes('main > [hidden]{display:none!important}'));
});
test('v1.6 feature scripts/styles are loaded once after UI simplification',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const filename of ['feature_ui_v16.mjs','feature_v16.css'])
  assert.equal(html.split(filename).length-1,1,filename);
});
