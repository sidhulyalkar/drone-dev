import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf-8');
const js=readFileSync(new URL('../qualification_ui.mjs',import.meta.url),'utf-8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
test('qualification UI: every referenced DOM anchor exists and IDs are unique',()=>{
 assert.equal(new Set(ids).size,ids.length);
 for(const match of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),`Missing ${match[1]}`);
 assert.ok(html.includes('qualification_ui.mjs'));
 assert.ok(html.includes('type="module" src="./qualification_ui.mjs"'));
});
test('qualification controls are interactive, not decorative',()=>{
 for(const id of ['q-export-snapshot','q-export-packet','q-export-sitl','q-reset','q-load-rotors','q-example-rotors']){
  assert.ok(html.includes('id="'+id+'"'));
  assert.ok(js.includes("$('"+id+"')"));
 }
});
