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
function intakeReport(frame,motor){
 const pack=(fixture)=>({
  fileName:fixture.manifest.source.fileName,
  sha256:fixture.manifest.source.sha256,
  sizeBytes:fixture.manifest.source.sizeBytes,
  sourceRevisionDeclaredByOperator:fixture.manifest.source.revision,
  origin:'USER_ACQUIRED_SOURCE_NOT_VENDOR_AUTHENTICATED',
  stepEnvelopeRecognized:true,unitsIndependentlyVerified:false,redistributionAuthorized:false
 });
 const conversion=(fixture)=>({
  glbName:fixture.manifest.mesh.fileName,
  glbSha256:fixture.manifest.mesh.sha256,
  visualManifestName:fixture.manifest.mesh.fileName.replace(/\.glb$/i,'.visual-package.json'),
  solidCount:fixture.manifest.conversion.solidCount,
  triangleCount:fixture.manifest.conversion.triangleCount,
  unreviewedGeometry:true
 });
 return {
  schema:'aeroforge/x500-paired-source-intake/v2.7',
  sourcePage:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download',
  files:{frame:pack(frame),motor:pack(motor)},
  conversionResults:{frame:conversion(frame),motor:conversion(motor)},
  licenseNotes:'Synthetic test files only; no manufacturer redistribution grant or origin verified.',
  manufacturerIdentityVerified:false,inputUnitsIndependentlyVerified:false,
  assemblyDatumsRegistered:false,physicalFitQualified:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  readyForMechanicalManufacture:false,sourcesCopiedOrRedistributed:false,
  readyForBrowserResearch:true
 };
}
test('dual source CAD research needs both matching original STEP files and leaves physical approval false',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);
 await choose(page,1,motor);
 await page.locator('#cad-v27-intake-receipt').setInputFiles({
  name:'x500-paired-source-intake.v27.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(intakeReport(frame,motor)))});
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText('match BOTH paired source-intake report entries');
 await page.locator('#cad-v24-pair form input[type=text]').nth(0).fill('250, 0, 20');
 await page.locator('#cad-v24-pair form input[type=text]').nth(1).fill('0, 0, 0');
 await page.locator('#cad-v24-pair form input[type=number]').nth(0).fill('16');
 await page.locator('#cad-v24-pair form input[type=number]').nth(1).fill('19');
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
 await page.locator('#v06-kit-variant').selectOption('six_x');
 await expect(page.locator('#v23-checklist')).not.toContainText('Unverified dual-source CAD pose available');
 await expect(page.getByRole('button',{name:'Export proposal JSON'})).toBeDisabled();
 await page.locator('#v06-kit-variant').selectOption('six_c');
 await expect(page.locator('#v23-checklist')).not.toContainText('Unverified dual-source CAD pose available');
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

test('paired report cannot describe another CAD source while browser file hashes match',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME'),motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 const swapped=intakeReport(frame,motor);
 swapped.conversionResults.motor.glbSha256='e'.repeat(64);
 await page.locator('#cad-v27-intake-receipt').setInputFiles({
  name:'spoofed-intake.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(swapped))});
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText('CAD intake rejected: motor source or tessellation digest mismatch');
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v2.9 candidate report cannot elevate geometry when its source is a synthetic STEP',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME'),motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);
 await choose(page,1,motor);
 const untrusted={
  schema:'aeroforge/x500-mount-feature-candidates/v2.9',
  source:{frameSha256:frame.manifest.source.sha256,
   motorSha256:motor.manifest.source.sha256},
  candidates:[],candidateCount:0,
  mountingHoleIdentityApproved:true,physicalFitApproved:true,flightApproved:true
 };
 await page.locator('#cad-v29-feature-index').setInputFiles({
  name:'untrusted-feature-review.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(untrusted))});
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'CAD intake rejected: Mounting candidate report rejected: original uploaded STEP fingerprints differ');
 await expect(page.locator('#cad-v29-feature-review')).toBeHidden();
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v3.0 reported BREP planes require both source files and the exact underlying v2.9 report',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME'),motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await page.locator('#cad-v30-topology-report').setInputFiles({
  name:'unlinked-plane-report.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({
   schema:'aeroforge/x500-brep-plane-adjacency/v3.0',
   flightApproved:true,verifiedPhysicalMountingFaceCount:4
  }))
 });
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'CAD intake rejected: v3.0 BREP adjacency requires the original v2.9 feature index');
 await expect(page.locator('#cad-v30-topology-review')).toBeHidden();
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v3.1 contours cannot bypass v2.9+v3.0 original source report requirements',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await page.locator('#cad-v31-contour-report').setInputFiles({
  name:'forged-brep-contours.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({
   schema:'aeroforge/x500-brep-contour-groups/v3.1',
   physicalFitApproved:true,flightApproved:true
  }))
 });
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'CAD intake rejected: v3.1 BREP contours require both original v2.9 pattern and v3.0 topology reports');
 await expect(page.locator('#cad-v31-contour-review')).toBeHidden();
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v3.2 plan-view solver remains hidden without exact verified source BREP contours',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 await expect(page.locator('#cad-v32-planar-fit')).toBeHidden();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'No paired intake report selected');
 await expect(page.locator('#cad-v32-planar-fit')).toBeHidden();
 await expect(page.locator('#cad-v32-export')).toBeDisabled();
});

test('v3.3 proposed contact plane evidence cannot bypass original v3.1 contours and v3.2 reference',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await expect(page.locator('#cad-v33-contact-survey')).toBeHidden();
 await page.locator('#cad-v33-contact-report').setInputFiles({
  name:'forged-source-contact.v33.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({schema:'aeroforge/x500-source-contact-hypotheses/v3.3',
   physicalFitApproved:true,flightApproved:true}))
 });
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'CAD intake rejected: v3.3 BREP contact study requires original v3.1 contours and the v3.2 independent source report');
 await expect(page.locator('#cad-v33-contact-survey')).toBeHidden();
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v3.4 coincident CAD source audit cannot bypass original exact Boolean evidence',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await expect(page.locator('#cad-v34-occurrence-review')).toBeHidden();
 await page.locator('#cad-v34-occurrence-report').setInputFiles({
  name:'forged-original-brep-occurrences.v34.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({schema:'aeroforge/x500-source-occurrence-reconciliation/v3.4',
   physicalFitApproved:true,sourceModelRawPositiveOverlapCount:0}))
 });
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'CAD intake rejected: v3.4 duplicate BREP occurrence analysis requires the original v3.3 survey and completed exact Boolean pair report');
 await expect(page.locator('#cad-v34-occurrence-review')).toBeHidden();
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v3.5 XCAF part names never authenticate a forged manufacturer BOM without original v3.4 evidence',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await expect(page.locator('#cad-v35-xcaf-hierarchy')).toBeHidden();
 await page.locator('#cad-v35-xcaf-report').setInputFiles({
  name:'forged-step-assembly.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({
   schema:'aeroforge/x500-xcaf-assembly-identity/v3.5',
   manufacturerBomIndependentlyVerified:true,
   frameStepMotorAndSeparateCandidateInterchangeabilityVerified:true,
   physicalFitApproved:true
  }))
 });
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'CAD intake rejected: v3.5 XCAF assembly labels require all original-source v3.4 BREP collision evidence');
 await expect(page.locator('#cad-v35-xcaf-hierarchy')).toBeHidden();
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeDisabled();
});

test('v3.6 assembly scenarios stay inaccessible without the exact original XCAF source-report chain',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 await expect(page.locator('#cad-v36-variant-plan')).toBeHidden();
 await expect(page.locator('#cad-v36-export')).toBeDisabled();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'Two local STEP and GLB digests matched their manifests');
 await expect(page.locator('#cad-v36-variant-plan')).toBeHidden();
 await expect(page.locator('#cad-v36-export')).toBeDisabled();
 // Hash-matched SYNTHETIC files allow an explicitly unverified v2.4 research
 // pose, but not a source-authenticated v3.6 variant evaluation.
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeEnabled();
});

test('v3.7 exact source BREP execution planning remains inaccessible without original XCAF and v3.3 geometry evidence',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 await expect(page.locator('#cad-v37-brep-execution')).toBeHidden();
 await expect(page.locator('#cad-v37-export-variant')).toBeDisabled();
 await expect(page.locator('#cad-v37-export-plan')).toBeDisabled();
 await expect(page.locator('#cad-v37-export-report')).toBeDisabled();
 const frame=fixture('x500v2-frame.step','FRAME');
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,0,frame);await choose(page,1,motor);
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'Two local STEP and GLB digests matched their manifests');
 await expect(page.locator('#cad-v37-brep-execution')).toBeHidden();
 await expect(page.locator('#cad-v37-export-plan')).toBeDisabled();
 await expect(page.locator('#cad-v37-export-report')).toBeDisabled();
 // The explicitly unverified v2.4 research action has a lower trust gate.
 await expect(page.getByRole('button',{name:'Create unverified mating proposal'})).toBeEnabled();
});

test('failed reverification revokes the previously enabled unverified research pose',async({page})=>{
 await page.goto('http://127.0.0.1:8080',{waitUntil:'domcontentloaded'});
 await page.locator('#af-workspace-engineering').click();
 await page.locator('#cad-v24-pair > summary').click();
 await choose(page,0,fixture('x500v2-frame.step','FRAME'));
 const motor=fixture('AIR2216II_Motor_3D.STEP','MOTOR');
 await choose(page,1,motor);
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText(
  'Two local STEP and GLB digests matched their manifests');
 const proposal=page.getByRole('button',{name:'Create unverified mating proposal'});
 await expect(proposal).toBeEnabled();
 // Tampering a local source revokes even the research-only action immediately.
 await page.locator('#cad-v24-pair fieldset').nth(1).locator('input[type=file]').nth(2)
  .setInputFiles({name:motor.manifest.source.fileName,
   mimeType:'application/octet-stream',buffer:Buffer.from('SYNTHETIC TAMPERED STEP')});
 await expect(proposal).toBeDisabled();
 await page.getByRole('button',{name:'Verify two source packages'}).click();
 await expect(page.locator('#cad-v24-pair')).toContainText('CAD intake rejected');
 await expect(proposal).toBeDisabled();
 await expect(page.locator('#cad-v37-brep-execution')).toBeHidden();
 await expect(page.locator('#cad-v37-export-plan')).toBeDisabled();
 await expect(page.locator('#cad-v37-export-report')).toBeDisabled();
});
