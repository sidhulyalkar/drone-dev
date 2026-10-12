/** Read a local v2.7 two-STEP pipeline receipt WITHOUT escalating vendor trust.
 * Both original STEP and both GLB files have already been SHA-checked in the
 * browser by verifyCadPackage. This is a cross-source bookkeeping check only.
 */
export const X500_INTAKE_SCHEMA='aeroforge/x500-paired-source-intake/v2.7';
const SHA=/^[a-f0-9]{64}$/;
const PAGE='https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download';
function check(flag,message){if(!flag)throw Error(message);}
function isObject(x){return x!==null&&typeof x==='object'&&!Array.isArray(x);}
export function compareX500SourceIntake(receipt,framePreview,motorPreview){
 check(isObject(receipt)&&receipt.schema===X500_INTAKE_SCHEMA&&
  receipt.sourcePage===PAGE,'Unknown source-intake receipt or documentation origin');
 for(const k of ['manufacturerIdentityVerified','inputUnitsIndependentlyVerified',
  'assemblyDatumsRegistered','physicalFitQualified','procurementApproved','powerApproved',
  'flightApproved','readyForMechanicalManufacture','sourcesCopiedOrRedistributed']){
  check(receipt[k]===false,'Imported report attempts to assert a privileged '+k);
 }
 check(receipt.readyForBrowserResearch===true,'Source intake has not completed two conversions');
 check(isObject(receipt.conversionResults)&&isObject(receipt.files),
  'Both source and conversion receipts are required');
 check(typeof receipt.licenseNotes==='string'&&receipt.licenseNotes.length>=15,
  'Source license declaration missing');
 const refs=[];
 for(const [role,p,expectedName] of [
  ['frame',framePreview,'x500v2-frame.step'],
  ['motor',motorPreview,'AIR2216II_Motor_3D.STEP']]){
  const f=receipt.files[role],o=receipt.conversionResults[role];
  check(isObject(f)&&isObject(o),'Missing '+role+' source/conversion receipt');
  check(p?.schema==='aeroforge/cad-preview-evidence/v1.3'&&
   p.glbHashMatchesManifest===true&&p.localStepHashMatchesManifest===true&&
   p.sourceAuthenticated===false&&p.physicalFit===false,
   role+' original bytes and GLB must be verified in this browser');
  const m=p.manifest;
  check(m?.source?.fileName.toLowerCase()===expectedName.toLowerCase()&&
   f.fileName.toLowerCase()===expectedName.toLowerCase(),
   role+' original filename mismatch');
  check(SHA.test(f.sha256)&&SHA.test(o.glbSha256)&&
   f.sha256===m.source.sha256&&o.glbSha256===m.mesh.sha256,
   role+' source or tessellation digest mismatch');
  check(f.sizeBytes===m.source.sizeBytes&&
   f.sourceRevisionDeclaredByOperator===m.source.revision,
   role+' size or revision declaration changed after conversion');
  check(o.glbName===m.mesh.fileName&&
   o.visualManifestName===o.glbName.replace(/\\.glb$/i,'.visual-package.json'),
   role+' source/mesh manifest mapping mismatch');
  check(o.solidCount===m.conversion.solidCount&&
   o.triangleCount===m.conversion.triangleCount,
   role+' converted solid/triangle counts do not match intake report');
  check(f.origin==='USER_ACQUIRED_SOURCE_NOT_VENDOR_AUTHENTICATED'&&
   f.stepEnvelopeRecognized===true&&f.unitsIndependentlyVerified===false&&
   f.redistributionAuthorized===false&&o.unreviewedGeometry===true,
   role+' receipt has attempted to upgrade source authority');
  refs.push({role,sourceSha256:f.sha256,glbSha256:o.glbSha256,
   sourceRevisionDeclaredByOperator:f.sourceRevisionDeclaredByOperator,
   sourceUnitsIndependentlyVerified:false});
 }
 check(refs[0].sourceSha256!==refs[1].sourceSha256,'Frame and motor have the same fingerprint');
 return {schema:'aeroforge/x500-browser-intake-comparison/v2.7',
  files:refs,matchedToTwoLocalFiles:true,manufacturerAuthenticated:false,
  sourceUnitsIndependentlyVerified:false,physicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false,
  warning:'The report matches the selected local STEP and GLB bytes, not an authenticated vendor signature or physical fit.'};
}
