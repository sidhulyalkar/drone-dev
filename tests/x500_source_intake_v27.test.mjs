import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareX500SourceIntake,X500_INTAKE_SCHEMA} from '../core/x500_source_intake_v27.mjs';
const sha=x=>x.repeat(64);
function source(role){
 const isFrame=role==='frame';
 const name=isFrame?'x500v2-frame.step':'AIR2216II_Motor_3D.STEP';
 const glb=isFrame?'x500v2-frame.glb':'AIR2216II_Motor_3D.glb';
 const srcHash=sha(isFrame?'a':'b'),meshHash=sha(isFrame?'c':'d');
 return {
  file:{fileName:name,sha256:srcHash,sizeBytes:isFrame?23120200:790300,
   sourceRevisionDeclaredByOperator:'SYNTHETIC_REVISION',
   origin:'USER_ACQUIRED_SOURCE_NOT_VENDOR_AUTHENTICATED',
   stepEnvelopeRecognized:true,unitsIndependentlyVerified:false,redistributionAuthorized:false},
  conversion:{glbName:glb,glbSha256:meshHash,
   visualManifestName:glb.replace(/\.glb$/,'.visual-package.json'),
   solidCount:2,triangleCount:12,unreviewedGeometry:true},
  preview:{schema:'aeroforge/cad-preview-evidence/v1.3',
   glbHashMatchesManifest:true,localStepHashMatchesManifest:true,
   sourceAuthenticated:false,physicalFit:false,
   manifest:{source:{fileName:name,sha256:srcHash,revision:'SYNTHETIC_REVISION',
     sizeBytes:isFrame?23120200:790300},
    mesh:{fileName:glb,sha256:meshHash},
    conversion:{solidCount:2,triangleCount:12}}}
 };
}
function setup(){
 const frame=source('frame'),motor=source('motor');
 return {frame,motor,receipt:{
  schema:X500_INTAKE_SCHEMA,sourcePage:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download',
  licenseNotes:'Research use only; manufacturer redistribution permission not established.',
  files:{frame:frame.file,motor:motor.file},
  conversionResults:{frame:frame.conversion,motor:motor.conversion},
  manufacturerIdentityVerified:false,inputUnitsIndependentlyVerified:false,
  assemblyDatumsRegistered:false,physicalFitQualified:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  sourcesCopiedOrRedistributed:false,readyForMechanicalManufacture:false,
  readyForBrowserResearch:true}};
}
test('dual receipt matches current local original and GLB digests, never authorizes flight',()=>{
 const x=setup(),r=compareX500SourceIntake(x.receipt,x.frame.preview,x.motor.preview);
 assert.equal(r.matchedToTwoLocalFiles,true);
 assert.equal(r.manufacturerAuthenticated,false);
 assert.equal(r.sourceUnitsIndependentlyVerified,false);
 assert.equal(r.flightApproved,false);
 assert.equal(r.files[0].sourceSha256,sha('a'));
});
test('a mismatched source digest or swapped manifest fails instead of inheriting old evidence',()=>{
 const x=setup();x.receipt.files.motor.sha256=sha('e');
 assert.throws(()=>compareX500SourceIntake(x.receipt,x.frame.preview,x.motor.preview),/digest mismatch/);
 const y=setup();y.receipt.conversionResults.frame.visualManifestName='other.json';
 assert.throws(()=>compareX500SourceIntake(y.receipt,y.frame.preview,y.motor.preview),/mapping mismatch/);
 const z=setup();z.receipt.conversionResults.motor.triangleCount=99;
 assert.throws(()=>compareX500SourceIntake(z.receipt,z.frame.preview,z.motor.preview),/triangle counts/);
});
test('manufacturing, source authentication and missing local STEP cannot be smuggled into intake',()=>{
 for(const changed of [
  x=>x.receipt.flightApproved=true,
  x=>x.receipt.manufacturerIdentityVerified=true,
  x=>x.receipt.sourcesCopiedOrRedistributed=true,
  x=>x.receipt.readyForMechanicalManufacture=true,
  x=>x.receipt.files.frame.redistributionAuthorized=true,
  x=>x.frame.preview.localStepHashMatchesManifest=false,
  x=>x.receipt.conversionResults.motor.unreviewedGeometry=false
 ]){
  const x=setup();changed(x);
  assert.throws(()=>compareX500SourceIntake(x.receipt,x.frame.preview,x.motor.preview));
 }
});
test('browser carries optional intake receipt without removing original STEP verification',()=>{
 const ui=readFileSync(new URL('../cad_mating_ui_v24.mjs',import.meta.url),'utf8');
 assert.match(ui,/cad-v27-intake-receipt/);
 assert.match(ui,/compareX500SourceIntake/);
 assert.match(ui,/verifyCadPackage/);
 assert.match(ui,/localStepHashMatchesManifest|verifyCadPackage/);
});
