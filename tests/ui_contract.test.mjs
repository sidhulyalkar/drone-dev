import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),html=readFileSync(new URL('index.html',root),'utf8'),app=readFileSync(new URL('app.mjs',root),'utf8');
test('UI anchors for all critical v0.2 interactions exist',()=>{
 for(const id of ['plan-form','plan-results','ground-kit','startup-cost','flight-range','system-architecture','csv-btn','import-file','validation-checks','sensitivity','evidence-queue','compare-output'])
   assert.ok(html.includes(`id="${id}"`),`Missing UI anchor ${id}`);
});
test('UI initializes non-network-dependent planning, fallback and exports',()=>{
 for(const feature of ['updatePlan();','renderFallback();','parseDesignJSON(','bomCSV(','designKey(','renderArchitecture();','renderChecklist();'])
  assert.ok(app.includes(feature),`Missing application hook ${feature}`);
});
