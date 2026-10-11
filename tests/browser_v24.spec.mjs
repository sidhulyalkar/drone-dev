import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
// Synthetic local file bytes only; never represent actual Holybro geometry.
function fixture(filename,marker){
 const json=JSON.stringify({asset:{version:'2.0'},
  scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'synthetic-triangle'}],
  meshes:[{primitives:[{attributes:{POSITION:0},mode:4}]}],
  buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'}]});
 const padded=json+' '.repeat((4-json.length%4)%4);
 const raw=Buffer.alloc(36);
 [0,0,0,1,0,0,0,1,0].forEach((v,i)=>raw.writeFloatLE(v,i*4));
 const glb=Buffer.alloc(12+8+padded.length+8+36);
 glb.write('glTF',0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
 glb.writeUInt32LE(padded.length,12);glb.write('JSON',16);glb.write(padded,20);
 const at=20+padded.length;glb.writeUInt32LE(36,at);glb.write('BIN\0',at+4);raw.copy(glb,at+8);
 const step=Buffer.from('ISO-10303-21; SYNTHETIC TEST FILE '+marker+'; END-ISO-10303-21;');
 const sha=x=>createHash('sha256').update(x).digest('hex');
 const manifest={schema:'aeroforge/cad-visual-package/v1.3',
  source:{fileName:filename,sha256:sha(step),sizeBytes:step.length,
   revision:'SYNTHETIC_NOT_MANUFACTURER',documentationUrl:'https://example.org/test',
   licenseNote:'Synthetic test fixture only, not actual Holybro CAD'},
  mesh:{fileName:filename+'.glb',sha256:sha(glb),sizeBytes:glb.length,
   format:'GLB_2',units:'m'},
  conversion:{coordinateFrame:'CAD_NATIVE_UNREGISTERED',scaleFromKernelToGLTF:.001,
   solidCount:1,triangleCount:1,sourceAabbKernelMm:{min:[-10,-10,0],max:[10,10,35]}},
  qualification:{manufacturerAuthenticated:false,axesRegisteredToFRD:false,
   physicalFit:false,rotorCentersMeasured:false,flightReady:false},
  scope:'VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED'};
 return {manifest,glb,step};
}
async function choose(page,index,fixture){
 const fields=page.locator('#cad-v24-pair fieldset').nth(index).locator('input[type=file]');
 await fields.nth(0).setInputFiles({name:'synthetic.visual-package.json',
  mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture.manifest))});
 await fields.nth(1).setInputFiles({name:fixture.manifest.mesh.fileName,
  mimeType:'model/gltf-binary',buffer:fixture.glb});
 await fields.nth(2).setInputFiles({name:fixture.manifest.source.fileName,
  mimeType:'application/octet-stream',buffer:fixture.step});
}
test('dual source CAD research needs both matching original STEP files and leaves physical approval false',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);
 await choose(page,1,motor);
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText('Two local STEP and GLB digests matched');
 await page.locator('#cad-v24-pair form input[type=text]').nth(2).fill('Engineer A');
 await page.locator('#cad-v24-pair form textarea').nth(0).fill(
  'Synthetic source-frame feature hypotheses for browser software testing only.');
 await page.locator('#cad-v24-pair form textarea').nth(1).fill(
  'No real fastener or motor shaft mating surfaces were inspected or measured.');
 await page.locator('#cad-v24-pair form input[type=checkbox]').check();
 await page.getByRole('button',{name:'Create unverified mating proposal'}).click();
 await expect(page.locator('.cad-v24-report')).toContainText('ALL PHYSICAL AND FLIGHT APPROVALS: FALSE');
 await expect(page.getByRole('button',{name:'Export proposal JSON'})).toBeEnabled();
 const exportPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export proposal JSON'}).click();
 const download=await exportPromise;
 expect(download.suggestedFilename()).toContain('mating-hypothesis');
 await page.locator('#v22-inspection > summary').click();
 await page.locator('#v23-checklist > summary').click();
 await expect(page.locator('#v23-checklist')).toContainText('Unverified dual-source CAD pose available');
 await page.locator('#cad-v24-pair form input[type=text]').first().fill('1, 2, 3');
 await expect(page.getByRole('button',{name:'Export proposal JSON'})).toBeDisabled();
});
test('altered original STEP refuses paired mechanical proposal',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 await choose(page,0,fixture('x500v2-frame.step','FRAME'));
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,1,motor);
 await page.locator('#cad-v24-pair fieldset').nth(1).locator('input[type=file]').nth(2)
  .setInputFiles({name:motor.manifest.source.fileName,mimeType:'application/octet-stream',
   buffer:Buffer.from('SYNTHETIC ALTERED BYTES IN TEST')});
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText('CAD intake rejected');
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});
