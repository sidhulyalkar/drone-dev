import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';

function fixture(){
 const json=JSON.stringify({asset:{version:'2.0',generator:'SYNTHETIC BROWSER TEST ONLY'},
  scenes:[{nodes:[0]}],scene:0,nodes:[{mesh:0,name:'Synthetic test triangle'}],
  meshes:[{primitives:[{attributes:{POSITION:0},mode:4}]}],
  buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]}]});
 const padded=json+' '.repeat((4-json.length%4)%4);
 const glb=Buffer.alloc(12+8+padded.length+8+36);
 glb.write('glTF',0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
 glb.writeUInt32LE(padded.length,12);glb.write('JSON',16);glb.write(padded,20);
 const bin=20+padded.length;glb.writeUInt32LE(36,bin);glb.write('BIN\0',bin+4);
 [0,0,0,1,0,0,0,1,0].forEach((x,i)=>glb.writeFloatLE(x,bin+8+i*4));
 const step=Buffer.from('ISO-10303-21; BROWSER SYNTHETIC TEST FILE ONLY; END-ISO-10303-21;');
 const sha=b=>createHash('sha256').update(b).digest('hex');
 const manifest={
  schema:'aeroforge/cad-visual-package/v1.3',
  source:{fileName:'browser-fixture.step',sha256:sha(step),sizeBytes:step.length,
   revision:'SYNTHETIC_FIXTURE',documentationUrl:'https://example.org/synthetic',
   licenseNote:'Synthetic test-only fixture, no manufacturer data.',manufacturerIdentityVerified:false},
  mesh:{fileName:'browser-fixture.glb',sha256:sha(glb),sizeBytes:glb.length,
   format:'GLB_2',units:'m',assetGeometryIsCadDerived:true},
  conversion:{engine:'Browser synthetic fixture',sourceUnitsDeclared:'mm',
   coordinateFrame:'CAD_NATIVE_UNREGISTERED',scaleFromKernelToGLTF:.001,
   solidCount:1,triangleCount:1,sourceAabbKernelMm:{min:[0,0,0],max:[1,1,0]}},
  qualification:{manufacturerAuthenticated:false,axesRegisteredToFRD:false,
   physicalFit:false,rotorCentersMeasured:false,flightReady:false},
  scope:'VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED'
 };
 return {glb,step,manifest};
}
const upload=async (page,f,tamper=false,includeStep=false)=>{
 await page.locator('#cad-v13-manifest').setInputFiles({name:'browser-fixture.visual-package.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(f.manifest))});
 const raw=Buffer.from(f.glb);
 if(tamper)raw[raw.length-1]^=1;
 await page.locator('#cad-v13-glb').setInputFiles({name:'browser-fixture.glb',mimeType:'model/gltf-binary',buffer:raw});
 if(includeStep)await page.locator('#cad-v13-step').setInputFiles({name:'browser-fixture.step',mimeType:'application/octet-stream',buffer:f.step});
};
test('screening an explicitly synthetic example, editing, and reinspection never preserves stale exports',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#dim-example').click();
 await expect(page.locator('#dim-review-proof')).toContainText('CURRENT');
 await expect(page.locator('#dim-export')).toBeEnabled();
 await page.locator('#dim-gap').fill('12');
 await page.locator('#dim-gap').press('Tab'); // Commit the number-field edit before review.
 await expect(page.locator('#dim-result')).toContainText('STALE');
 await expect(page.locator('#dim-export')).toBeDisabled();
 await page.locator('#dim-inspect').click();
 await expect(page.locator('#dim-review-proof')).toContainText('CURRENT');
 await expect(page.locator('#dim-export')).toBeEnabled();
});
test('tampered local GLB remains rejected without rendering or export',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await upload(page,fixture(),true,true);
 await page.locator('#cad-v13-inspect').click();
 await expect(page.locator('#cad-v13-status')).toContainText('GLB SHA-256 mismatch');
 await expect(page.locator('#cad-v13-export')).toBeDisabled();
 await expect(page.locator('#cad-v13-parts button')).toHaveCount(0);
});
test('exact local mesh/source identity is exposed without claiming trusted manufacturer origin',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await upload(page,fixture(),false,true);
 await page.locator('#cad-v13-inspect').click();
 await expect(page.locator('#cad-v13-package-evidence')).toContainText('MATCH LOCAL FILE');
 await expect(page.locator('#cad-v13-package-evidence')).toContainText('NO APPROVED PHYSICAL FIT');
 await expect(page.locator('#cad-v13-export')).toBeEnabled();
 await expect(page.locator('#cad-v13-status')).not.toContainText('Package rejected');
});
test('X500 canonical compatibility blockers stay visible and keep PX4 assembly selection synchronized',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await page.locator('#assembly-track').selectOption('px4');
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#v06-kit-variant').selectOption('six_x');
 await expect(page.locator('#v14-identity')).toContainText('six_x');
 await expect(page.locator('#assembly-variant')).toHaveValue('six_x');
 await page.locator('#v06-kit-power').selectOption('pm02v3');
 await expect(page.locator('#v14-identity')).toContainText('BLOCKED');
 await expect(page.locator('#v14-connections')).toContainText('BLOCK_FAMILY_MISMATCH');
 await expect(page.locator('#v14-parts')).toContainText('Pixhawk 6X');
});

test('verified local X500-named STEP accepts human annotations but blocks physical qualification',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 const f=fixture(); // Entirely synthetic test bytes, NOT manufacturer STEP
 f.manifest.source.fileName='x500v2-frame.step';
 await page.locator('#cad-v13-manifest').setInputFiles({name:'fixture.visual-package.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(f.manifest))});
 await page.locator('#cad-v13-glb').setInputFiles({name:'browser-fixture.glb',mimeType:'model/gltf-binary',buffer:f.glb});
 await page.locator('#cad-v13-step').setInputFiles({name:'x500v2-frame.step',mimeType:'application/octet-stream',buffer:f.step});
 await page.locator('#cad-v13-inspect').click();
 await expect(page.locator('#cad-v15-inspect')).toBeEnabled();
 await page.locator('#cad-v15-observer').fill('SYNTHETIC BROWSER QA');
 await page.locator('#cad-v15-notes').fill('Motor shaft positions are fabricated browser fixture values; not manufacturer CAD evidence.');
 await page.locator('#cad-v15-units').check();
 await page.locator('#cad-v15-rotors').fill(
  'R1,200,150,0,254\nR2,-200,150,0,254\nR3,-200,-150,0,254\nR4,200,-150,0,254');
 await page.locator('#cad-v15-inspect').click();
 await expect(page.locator('#cad-v15-summary')).toContainText('500 / 500 mm');
 await expect(page.locator('#cad-v15-summary')).toContainText('NO VERIFIED AIRCRAFT DATUM');
 await expect(page.locator('#cad-v15-export')).toBeEnabled();
 await expect(page.locator('#v14-identity')).toContainText('linked but UNVERIFIED');
 await page.locator('#cad-v15-transfer').click();
 await expect(page.locator('#dim-rotors')).toHaveValue(/R1, 200, 150, 0, 254/);
 await expect(page.locator('#dim-export')).toBeDisabled();
 await page.locator('#dim-inspect').click();
 await expect(page.locator('#dim-review-proof')).toContainText('CURRENT');
 await page.locator('#cad-v15-rotors').fill('R1,201,150,0,254\nR2,-200,150,0,254\nR3,-200,-150,0,254\nR4,200,-150,0,254');
 await expect(page.locator('#cad-v15-export')).toBeDisabled();
 await expect(page.locator('#cad-v15-summary')).toContainText('No current');
 await page.locator('#cad-v13-reset').click();
 await expect(page.locator('#cad-v15-inspect')).toBeDisabled();
 await expect(page.locator('#v14-identity')).toContainText('not linked');
});

test('source-bound circular feature hypothesis propagates without claiming a motor shaft center',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 const f=fixture();
 f.manifest.source.fileName='x500v2-frame.step'; // synthetic test file, no manufacturer geometry
 await page.locator('#cad-v13-manifest').setInputFiles({name:'fixture.visual-package.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(f.manifest))});
 await page.locator('#cad-v13-glb').setInputFiles({name:'browser-fixture.glb',mimeType:'model/gltf-binary',buffer:f.glb});
 await page.locator('#cad-v13-step').setInputFiles({name:'x500v2-frame.step',mimeType:'application/octet-stream',buffer:f.step});
 await page.locator('#cad-v13-inspect').click();
 await expect(page.locator('#cad-v16-add-points')).toBeEnabled();
 await page.locator('#cad-v15-observer').fill('SYNTHETIC BROWSER QA');
 await page.locator('#cad-v15-notes').fill('Synthetic circular-feature coordinates only, not Holybro CAD.');
 await page.locator('#cad-v15-units').check();
 await page.locator('#cad-v15-rotors').fill('R1,199,150,0,254\nR2,-200,150,0,254\nR3,-200,-150,0,254\nR4,200,-150,0,254');
 await page.locator('#cad-v16-point-input').fill(
  '210,150,0,2,ring-edge\n200,160,0,2,ring-edge\n190,150,0,2,ring-edge\n200,140,0,2,ring-edge\n207.0710678,157.0710678,0,2,ring-edge');
 await page.locator('#cad-v16-add-points').click();
 await expect(page.locator('#cad-v16-status')).toContainText('unverified coordinate claim');
 await page.locator('#cad-v16-fit').click();
 await expect(page.locator('#cad-v16-output')).toContainText('200, 150, 0 mm');
 await expect(page.locator('#cad-v16-use')).toBeEnabled();
 await page.locator('#cad-v16-use').click();
 await expect(page.locator('#cad-v15-rotors')).toHaveValue(/R1, 200, 150, 0, 254/);
 await expect(page.locator('#cad-v15-export')).toBeDisabled();
 await page.locator('#cad-v15-inspect').click();
 await expect(page.locator('#cad-v15-summary')).toContainText('NO VERIFIED AIRCRAFT DATUM');
 await expect(page.locator('#cad-v15-export')).toBeEnabled();
 await page.locator('#cad-v13-reset').click();
 await expect(page.locator('#cad-v16-add-points')).toBeDisabled();
 await expect(page.locator('#cad-v15-export')).toBeDisabled();
});

test('minimal shell defaults to Explore with engineering sections unmounted from view, not DOM',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#af-workspace-explore')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#mission-planner')).toBeVisible();
 await expect(page.locator('#assembly-v08')).toBeHidden();
 await expect(page.locator('#dimensional-v11')).toBeHidden();
 await expect(page.locator('#showcase-v07')).toBeHidden();
 await expect(page.locator('#cad-v13-manifest')).toHaveCount(1);
 await expect(page.locator('#af-tool-menu')).not.toHaveAttribute('open');
});
test('component and metric details reveal without resetting design controls or changing engineering status',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#plan-payload')).toBeHidden();
 await page.locator('#af-plan-options').click();
 await expect(page.locator('#plan-payload')).toBeVisible();
 await page.locator('#plan-payload').fill('20');
 await page.locator('#af-plan-options').click();
 await expect(page.locator('#plan-payload')).toHaveValue('20');
 await expect(page.locator('#config-inputs')).toBeHidden();
 await page.locator('#af-customize').click();
 await expect(page.locator('#config-inputs')).toBeVisible();
 await expect(page.locator('#af-customize')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('#screening-status')).toBeAttached();
 await expect(page.locator('#af-analysis')).toBeVisible();
 await page.locator('#af-analysis').click();
 await expect(page.locator('.metrics-panel .envelope')).toBeVisible();
});
test('swapping workspaces keeps assembly state and CAD inspector form values',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#dim-example').click();
 await expect(page.locator('#dim-review-proof')).toContainText('CURRENT');
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#assembly-v08')).toBeVisible();
 await expect(page.locator('#dimensional-v11')).toBeHidden();
 await page.locator('#af-workspace-engineering').click();
 await expect(page.locator('#dim-review-proof')).toContainText('CURRENT');
 await expect(page.locator('#dim-rotors')).not.toHaveValue('');
 await expect(page.locator('#dim-export')).toBeEnabled();
});
test('deep links reveal engineering and nested Explore views even from a conflicting query',async({page})=>{
 await page.goto('http://127.0.0.1:8080/?view=build#dimensional-v11',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#af-workspace-engineering')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#dimensional-v11')).toBeVisible();
 await page.goto('http://127.0.0.1:8080/?view=engineering#mission-v10',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#af-workspace-explore')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#mission-v10')).toBeVisible();
});

test('Build has a single persistent viewer and uses aircraft/exploded modes without reconstructing it',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#showcase-v07')).toBeVisible();
 await expect(page.locator('#af-view-aircraft')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#af-view-cad')).toBeDisabled();
 await page.locator('#af-view-exploded').click();
 await expect(page.locator('#af-view-exploded')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#showcase-explode')).toHaveAttribute('aria-pressed','true');
 await page.locator('#af-view-aircraft').click();
 await expect(page.locator('#af-view-aircraft')).toHaveAttribute('aria-pressed','true');
 await page.locator('#af-workspace-engineering').click();
 await expect(page.locator('#showcase-v07')).toBeHidden();
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#showcase-v07')).toBeVisible();
 await expect(page.locator('#af-view-aircraft')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#showcase-viewport')).toHaveCount(1);
});
test('local CAD is shown in the same Build canvas only after rechecking hashes; reset revokes it',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#showcase-renderer-status')).toContainText('3D active',{timeout:15000});
 const canvasesBefore=await page.locator('#showcase-viewport canvas').count();
 expect(canvasesBefore).toBe(1);
 await page.locator('#af-workspace-engineering').click();
 await upload(page,fixture(),false,true);
 await page.locator('#cad-v13-inspect').click();
 await expect(page.locator('#cad-v13-package-evidence')).toContainText('MATCH LOCAL FILE');
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#af-view-cad')).toBeEnabled({timeout:15000});
 await page.locator('#af-view-cad').click();
 await expect(page.locator('#af-view-cad')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#af-v18-cad-details')).toBeVisible();
 await expect(page.locator('#af-v18-source')).toContainText('UNAUTHENTICATED');
 expect(await page.locator('#showcase-viewport canvas').count()).toBe(1);
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v13-reset').click();
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#af-view-cad')).toBeDisabled();
 await expect(page.locator('#af-view-aircraft')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#af-v18-cad-details')).toBeHidden();
});

test('clicking a 3D part reveals one contextual record and jumps to its real assembly step',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await page.locator('#af-v19-part-browser summary').click();
 await page.locator('#showcase-parts [data-showcase-id="motor-0"]').click();
 await expect(page.locator('#af-v19-current')).toContainText('2207');
 await expect(page.locator('#af-v19-status')).toContainText('NO VERIFIED SKU');
 await page.locator('#af-v19-assembly summary').click();
 await expect(page.locator('#af-v19-steps [data-step-id="motors"]')).toBeVisible();
 await page.locator('#af-v19-steps [data-step-id="motors"]').click();
 await expect(page.locator('#assembly-step-title')).toContainText('Mount motors');
 await expect(page.locator('#assembly-step-status')).not.toContainText('APPROVED');
});
test('alternative selection reruns concept screening and preserves the selected component inspector',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await page.locator('#af-v19-part-browser summary').click();
 await page.locator('#showcase-parts [data-showcase-id="motor-0"]').click();
 await page.locator('#af-v19-alternatives summary').click();
 await expect(page.locator('#af-v19-alternative-count')).not.toHaveText('0');
 await page.locator('#af-v19-options [data-alt-id="1204"]').click();
 await expect(page.locator('#af-v19-current')).toContainText('1204');
 await expect(page.locator('#af-v19-current')).toContainText('screening blocker');
 await expect(page.locator('#af-v19-status')).toContainText('NO VERIFIED SKU');
 await expect(page.locator('#showcase-part-title')).toContainText('Brushless motor');
});
test('a real-world candidate remains labeled research-only, never a qualified order link',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await page.locator('#af-v19-part-browser summary').click();
 await page.locator('#showcase-parts [data-showcase-id="frame"]').click();
 await page.locator('#af-v19-sources summary').click();
 await expect(page.locator('#af-v19-source-list')).toContainText('TBS Source One');
 await expect(page.locator('#af-v19-source-list')).toContainText('Unresolved');
 await expect(page.locator('#af-v19-status')).toContainText('NO VERIFIED SKU');
});

test('source SKU research separates a variant mismatch and allows only a matching X500 research reference',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#v20-source-catalog > summary').click();
 await expect(page.locator('#v20-primary')).toBeVisible();
 await page.locator('#v20-primary').selectOption('30200');
 await expect(page.locator('#v20-status')).toContainText('blocking mismatch');
 await expect(page.locator('#v20-use')).toBeDisabled();
 await page.locator('#v06-kit-variant').selectOption('six_x');
 await expect(page.locator('#v20-use')).toBeEnabled();
 await page.locator('#v20-use').click();
 await expect(page.locator('#v14-identity')).toContainText('source SKU 30200');
 await expect(page.locator('#v20-linked')).toContainText('30200');
 await expect(page.locator('#v20-feedback')).toContainText('RESEARCH ONLY');
 await page.locator('#v06-kit-cells').selectOption('3');
 await expect(page.locator('#v20-linked')).toContainText('No exact kit SKU linked');
 await expect(page.locator('#v20-use')).toBeDisabled();
});
test('source catalog marks discontinued stacks without enabling kit-link action',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#v20-source-catalog > summary').click();
 await page.locator('#v20-primary').selectOption('SB-F4V4-55-STACK');
 await expect(page.locator('#v20-subtitle')).toContainText('MANUFACTURER DISCONTINUED');
 await expect(page.locator('#v20-status')).toContainText('blocking mismatch');
 await expect(page.locator('#v20-use')).toBeHidden();
 await page.locator('.v20-holds > summary').click();
 await expect(page.locator('#v20-holds')).toContainText('discontinued');
 await expect(page.locator('#v20-official-source')).toHaveAttribute('href',/speedybee.com/);
});
test('two published kit variants can be compared and exported as unapproved research',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#v20-source-catalog > summary').click();
 await page.locator('#v20-primary').selectOption('30189');
 await page.locator('#v20-compare-toggle > summary').click();
 await page.locator('#v20-secondary').selectOption('30200');
 await expect(page.locator('#v20-compare-table')).toContainText('powerFamily');
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#v20-export').click();
 const downloaded=await downloadPromise;
 expect(downloaded.suggestedFilename()).toContain('30189');
});

test('X500 interface research exposes exact motor option SKUs and only unverified connector-family matches',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#v21-interface-audit > summary').click();
 await expect(page.locator('#v21-current')).toContainText('6C');
 await expect(page.locator('#v21-part-list')).toContainText('520085');
 await expect(page.locator('#v21-part-list')).toContainText('520086');
 await page.locator('#v21-motor').selectOption('x500-motor-ccw');
 await page.locator('#v21-edge-disclosure > summary').click();
 await expect(page.locator('#v21-edges')).toContainText('MR30');
 await expect(page.locator('#v21-edges')).toContainText('mating unverified');
 await expect(page.locator('#v21-warning')).toContainText('polarity');
 await page.locator('#v21-role').selectOption('esc');
 await expect(page.locator('#v21-part-list')).toContainText('520081');
 await expect(page.locator('#v21-part-list')).toContainText('XT30');
});
test('the source-level X500 interface audit follows kit 6X choice and 6S mismatch',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#v21-interface-audit > summary').click();
 await page.locator('#v21-role').selectOption('power-module');
 await expect(page.locator('#v21-current')).toContainText('6C');
 await expect(page.locator('#v21-part-list')).toContainText('PM02 V3');
 await page.locator('#v06-kit-variant').selectOption('six_x');
 await expect(page.locator('#v21-current')).toContainText('6X');
 await expect(page.locator('#v21-part-list')).toContainText('CURRENT FAMILY');
 await expect(page.locator('#v21-part-list')).toContainText('PM02D');
 await page.locator('#v06-kit-cells').selectOption('6');
 await expect(page.locator('#v21-status')).toContainText('BLOCKED SELECTION');
 await expect(page.locator('#v21-warning')).toContainText('requires 4S');
 const pending=page.waitForEvent('download');
 await page.locator('#v21-export').click();
 const file=await pending;
 expect(file.suggestedFilename()).toContain('x500-six_x');
});
test('Build part research opens X500 documentation without swapping the illustrative FPV part',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-build').click();
 await page.locator('#af-v19-part-browser summary').click();
 await page.locator('#showcase-parts [data-showcase-id="motor-0"]').click();
 const nameBefore=await page.locator('#af-v19-current strong').first().textContent();
 await expect(page.locator('.af-v21-research-button')).toContainText('X500 motor');
 await page.locator('.af-v21-research-button').click();
 await expect(page.locator('#af-workspace-engineering')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#v21-interface-audit')).toHaveAttribute('open');
 await expect(page.locator('#v21-role')).toHaveValue('motor');
 await expect(page.locator('#v21-part-list')).toContainText('520085');
 await page.locator('#af-workspace-build').click();
 await expect(page.locator('#af-v19-current strong').first()).toHaveText(nameBefore);
});
test.describe('small-screen workflow',()=>{
 test.use({viewport:{width:390,height:844}});
 test('navigation, dimensional input and source picker are usable on mobile',async({page})=>{
  await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#workflow-v12')).toBeVisible();
  await page.locator('#af-tool-menu summary').click();
  await page.locator('#workflow-v12 a[href="#dimensional-v11"]').click();
  await expect(page.locator('#dimensional-v11')).toBeVisible();
  await page.locator('#dim-example').click();
  await expect(page.locator('#dim-result')).not.toContainText('INPUT INCOMPLETE');
  await page.screenshot({path:'test-results/aeroforge-mobile-v13.png',fullPage:false});
 });
});
