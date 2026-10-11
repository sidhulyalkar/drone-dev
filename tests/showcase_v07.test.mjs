import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluate} from '../core/engine.mjs';
import {presets} from '../core/presets.mjs';
import {GEOMETRY_AUTHORITY,buildShowcaseManifest,createTourController,SUBSYSTEMS} from '../core/showcase_v07.mjs';
const fixture=id=>evaluate({...presets.find(p=>p.id===id).settings,groundKit:'none'});
test('every preset has independently selectable structural, motor, ESC, prop and power geometry',()=>{
 for(const p of presets){const m=buildShowcaseManifest(fixture(p.id));const ids=m.parts.map(x=>x.id);
  assert.equal(ids.length,new Set(ids).size);assert.equal(ids.length,20+(p.settings.payload>0?1:0));
  for(const prefix of ['motor','esc','prop'])assert.equal(ids.filter(id=>id.startsWith(prefix+'-')).length,4);
  for(const key of ['frame','canopy','battery','stack','pdb','camera','antenna','harness'])assert.ok(ids.includes(key));
  assert.ok(m.parts.every(x=>x.geometryAuthority===GEOMETRY_AUTHORITY));
  assert.equal(m.authority,GEOMETRY_AUTHORITY);
 }
});
test('payload is represented only if present and with explicit mass assumption',()=>{
 const s=fixture('pocket');const withPayload={...s,settings:{...s.settings,payload:185}};
 const m=buildShowcaseManifest(withPayload);assert.equal(m.parts.length,21);
 assert.ok(m.parts.find(p=>p.id==='payload').specs.some(([key,value])=>key==='User-added mass'&&value==='185 g'));
});
test('motor and prop center line match and explode outward symmetrically',()=>{
 const m=buildShowcaseManifest(fixture('freestyle'));
 for(let i=0;i<4;i++){
  const mot=m.parts.find(p=>p.id==='motor-'+i),prop=m.parts.find(p=>p.id==='prop-'+i);
  assert.equal(mot.anchor[0],prop.anchor[0]);assert.equal(mot.anchor[2],prop.anchor[2]);
  assert.ok(mot.explode[0]*mot.anchor[0]>=0);assert.ok(mot.explode[2]*mot.anchor[2]>=0);
  assert.ok(prop.explode[1]>mot.explode[1]);
 }
});
test('tour plays all parts in order and ends reassembled',()=>{
 const m=buildShowcaseManifest(fixture('freestyle'));const sequence=[];
 const c=createTourController(m.parts,s=>sequence.push(s.partId));c.play();
 for(let i=0;i<15000&&c.getState().playing;i++)c.tick(.05);
 assert.equal(c.getState().mode,'assembled');assert.equal(c.getState().playing,false);
 const visited=sequence.filter(x=>x!==null);for(const p of m.parts)assert.ok(visited.includes(p.id),p.id);
});
test('pause freezes elapsed progress, restart after reassemble resets cleanly',()=>{
 const m=buildShowcaseManifest(fixture('pocket'));const c=createTourController(m.parts);c.play();c.tick(.5);c.pause();const before=c.getState();c.tick(5);assert.deepEqual(c.getState(),before);
 c.assemble();assert.equal(c.getState().partId,null);c.play();assert.equal(c.getState().currentIndex,0);
});
test('manual focus and previous/next clamping are deterministic',()=>{
 const m=buildShowcaseManifest(fixture('endurance'));const c=createTourController(m.parts);
 c.select('battery');assert.equal(c.getState().partId,'battery');assert.equal(c.getState().playing,false);
 c.step(100);assert.equal(c.getState().currentIndex,m.parts.length-1);
 c.step(-100);assert.equal(c.getState().partId,'frame');
 assert.throws(()=>c.select('fake'));assert.throws(()=>c.step(.5));
});
test('subsystem filters control tour part count without mutating source parts',()=>{
 const m=buildShowcaseManifest(fixture('micro'));const c=createTourController(m.parts);
 c.setFilter('propulsion');assert.equal(c.getState().total,12);
 c.play();for(let i=0;i<10000&&c.getState().playing;i++)c.tick(.05);
 assert.equal(c.getState().mode,'assembled');assert.equal(m.parts.length,20);
 c.setFilter('control');assert.equal(c.getState().total,1);
 c.select('battery');assert.equal(c.getState().filter,'all');assert.equal(c.getState().partId,'battery');
});
test('malformed controller data or extreme tour speed is rejected',()=>{
 assert.throws(()=>buildShowcaseManifest({}));assert.throws(()=>createTourController([]));
 const c=createTourController(buildShowcaseManifest(fixture('research')).parts);
 assert.throws(()=>c.setFilter('imaginary'));assert.throws(()=>c.setSpeed(3));assert.throws(()=>c.tick(-1));assert.throws(()=>c.tick(NaN));
});
test('UI anchors and controls exist, no duplicate ids, selected design propagates',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 const js=readFileSync(new URL('../showcase_ui_v07.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const match of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),match[1]);
 assert.match(html,/showcase_ui_v07\.mjs/);assert.match(html,/showcase_v07\.css/);
 assert.match(app,/export function getCurrentDesign/);assert.match(app,/aeroforge:design-updated/);
 assert.ok(SUBSYSTEMS.some(x=>x.id==='propulsion'));
});
