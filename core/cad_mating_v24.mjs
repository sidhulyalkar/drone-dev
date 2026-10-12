/**
 * AeroForge v2.4: dual-source X500 frame/motor CAD mating *hypothesis*.
 * Uses local STEP+GLB digest receipts. Translation and bounding boxes are not proof of fit.
 */
import {validateCadManifest} from './cad_package_v13.mjs';
import {signedAxisMatrix} from './registration_v15.mjs';

export const CAD_PAIR_SCHEMA='aeroforge/x500-cad-mating-proposal/v2.4';
const SHA=/^[0-9a-f]{64}$/;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fail=s=>{throw Error(s);};
function point(p,label){
 if(!Array.isArray(p)||p.length!==3||p.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>20000))
  fail('Invalid '+label+' CAD-native coordinates');
 return [...p];
}
function text(v,label,min=12,max=1200){
 if(typeof v!=='string'||v.trim().length<min||v.length>max)fail('Missing or invalid '+label);
 return v.trim();
}
function source(preview,name,label){
 if(preview?.schema!=='aeroforge/cad-preview-evidence/v1.3'||
 preview.glbHashMatchesManifest!==true||preview.localStepHashMatchesManifest!==true||
 preview.sourceAuthenticated!==false||preview.physicalFit!==false||
 preview.manufacturerCadRegisteredToAircraft!==false)
  fail(label+' needs matching original STEP and GLB bytes verified locally');
 const m=validateCadManifest(preview.manifest);
 if(m.source.fileName.toLowerCase()!==name.toLowerCase())
  fail(label+' must use the named manufacturer-source candidate STEP filename');
 if(!SHA.test(m.source.sha256)||!SHA.test(m.mesh.sha256))
  fail('Missing content fingerprints');
 const b=m.conversion.sourceAabbKernelMm;
 if(!isObj(b)||!Array.isArray(b.min)||!Array.isArray(b.max))fail(label+' requires CAD-native bounding coordinates');
 const low=point(b.min,label+' lower bound'),high=point(b.max,label+' upper bound');
 if(low.some((v,i)=>v>high[i]))fail('Inverted CAD source bounds');
 return {filename:m.source.fileName,sourceSha256:m.source.sha256,
  meshSha256:m.mesh.sha256,sourceRevision:m.source.revision,
  sourceUrl:m.source.documentationUrl,licenseNote:m.source.licenseNote,
  claimedManufacturer:'Holybro (source URL and naming user-declared, not authenticated)',
  boundsKernelMm:{min:low,max:high},sourceBytesLocallyMatched:true};
}
const round=v=>Math.round(v*10000)/10000;
const corners=box=>{
 const x=box.min,y=box.max;
 return Array.from({length:8},(_,n)=>[n&1?y[0]:x[0],n&2?y[1]:x[1],n&4?y[2]:x[2]]);
};
const bounds=pts=>({min:[0,1,2].map(i=>round(Math.min(...pts.map(p=>p[i])))),
 max:[0,1,2].map(i=>round(Math.max(...pts.map(p=>p[i]))))});
/** An AABB intersection is only a broad-phase cue. It cannot prove mesh interference or mechanical fit. */
export function proposeX500CadMating(framePreview,motorPreview,input){
 const frame=source(framePreview,'x500v2-frame.step','Frame');
 const motor=source(motorPreview,'AIR2216II_Motor_3D.STEP','Motor');
 if(frame.sourceSha256===motor.sourceSha256)fail('Frame and motor must be independent STEP assets');
 if(!isObj(input))fail('Two-part datum observations required');
 const allowed=['frameMountKernelMm','motorMountKernelMm','axisMap','observer','datumNotes',
  'sourceUnitsReviewed','framePatternMm','motorPatternMm','fastenerNotes'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))fail('Unknown datum input');
 const matrix=signedAxisMatrix(input.axisMap);
 const frameDatum=point(input.frameMountKernelMm,'frame mount');
 const motorDatum=point(input.motorMountKernelMm,'motor base mount');
 if(input.sourceUnitsReviewed!==true)fail('Explicit, self-declared source-unit inspection required');
 const observer=text(input.observer,'observer',2,80);
 const datumNotes=text(input.datumNotes,'source datum justification',20);
 const fastenerNotes=text(input.fastenerNotes,'fastener/shaft uncertainty',20);
 const patterns=[input.framePatternMm,input.motorPatternMm];
 if(patterns.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<=0||x>100))
  fail('Measured mounting pattern hypotheses must be positive millimetres');
 const placed=p=>matrix.map((row,i)=>round(row.reduce((v,c,j)=>v+c*(p[j]-motorDatum[j]),frameDatum[i])));
 const transformed=corners(motor.boundsKernelMm).map(placed);
 const positioned=bounds(transformed),frameBox=frame.boundsKernelMm;
 const overlap=[0,1,2].every(i=>positioned.max[i]>=frameBox.min[i]&&frameBox.max[i]>=positioned.min[i]);
 const translation=placed([0,0,0]);
 return {schema:CAD_PAIR_SCHEMA,sourceAuthority:'LOCAL_MATCHING_BYTES_MANUFACTURER_ORIGIN_UNAUTHENTICATED',
  frame,motor,observer,datumNotes,fastenerNotes,sourceUnitsReviewed:'USER_ATTESTED_ONLY',
  registration:{frameMountKernelMm:frameDatum,motorMountKernelMm:motorDatum,
   motorToFrameAxisMap:[...input.axisMap],axisMatrix:matrix,
   motorToFrameTranslationMm:translation,provenance:'USER_SELECTED_NOT_INDEPENDENTLY_REGISTERED'},
  patternHypotheses:{frameMm:patterns[0],motorMm:patterns[1],
   frameMinusMotorMm:round(patterns[0]-patterns[1]),
   publishedReferenceAlternativesMm:[16,19],
   status:'USER_MEASUREMENT_HYPOTHESES_NO_TOLERANCE_OR_FIT_DECISION'},
  broadphase:{frameAabbKernelMm:frameBox,positionedMotorAabbKernelMm:positioned,
   status:overlap?'AABB_OVERLAP_POSSIBLE_INSPECTION_REQUIRED':'AABB_DISJOINT_REVIEW_DATUM',
   meshIntersectionTested:false,clearanceMeasured:false},
  independence:{secondPersonReviewRecorded:false,sourceManufacturerAuthenticated:false,
   independentDatumInspection:false,toolCalibrationVerified:false},
  independentlyQualified:false,mechanicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false,
  warning:'Manual relative transform and box overlap are ONLY research hypotheses. Frame and motor source, mounts, units, axes, clearance, and fasteners require independent physical review.'};
}

/**
 * Bind a locally verified, but unqualified CAD placement to exactly one X500
 * selection. This is a revision-scoped research association, not verification.
 * Unscoped historical proposals never display as evidence for the current kit.
 */
export const CAD_SCOPE_AUTHORITY='REVISION_SCOPED_USER_PROPOSAL_NOT_QUALIFIED';
function x500Context(record){
 if(record?.schema!=='aeroforge/x500-aircraft-record/v1.4'||
  record.reference!=='holybro-x500-v2'||!['six_c','six_x'].includes(record.variant)||
  !Number.isInteger(record.selected?.batteryCells)||
  record.selected.batteryCells<2||record.selected.batteryCells>12||
  typeof record.revisionIdentity!=='string'||!record.revisionIdentity||
  record.revisionIdentity.length>6000)
  fail('Canonical X500 revision identity is required for CAD association');
 return {aircraftReference:record.reference,revisionIdentity:record.revisionIdentity,
  variant:record.variant,batteryCells:record.selected.batteryCells};
}
function safeProposal(p){
 if(!isObj(p)||p.schema!==CAD_PAIR_SCHEMA||
  p.sourceAuthority!=='LOCAL_MATCHING_BYTES_MANUFACTURER_ORIGIN_UNAUTHENTICATED'||
  p.independentlyQualified!==false||p.mechanicalFitApproved!==false||
  p.procurementApproved!==false||p.powerApproved!==false||p.flightApproved!==false||
  !SHA.test(p.frame?.sourceSha256)||!SHA.test(p.motor?.sourceSha256)||
  !SHA.test(p.frame?.meshSha256)||!SHA.test(p.motor?.meshSha256)||
  p.frame?.sourceSha256===p.motor?.sourceSha256||
  p.registration?.provenance!=='USER_SELECTED_NOT_INDEPENDENTLY_REGISTERED')
  fail('Unqualified source-bound CAD proposal required');
 return p;
}
export function scopeX500CadMating(proposal,record){
 safeProposal(proposal);
 return {...proposal,aircraftScope:x500Context(record),
  aircraftScopeAuthority:CAD_SCOPE_AUTHORITY,
  independentlyQualified:false,mechanicalFitApproved:false,procurementApproved:false,
  powerApproved:false,flightApproved:false};
}
/** A prior variant, changed source/revision, or legacy unscoped proposal never applies. */
export function cadMatingAppliesToRecord(proposal,record){
 try{
  safeProposal(proposal);
  const current=x500Context(record),scope=proposal.aircraftScope;
  return proposal.aircraftScopeAuthority===CAD_SCOPE_AUTHORITY&&
   scope?.aircraftReference===current.aircraftReference&&
   scope?.revisionIdentity===current.revisionIdentity&&
   scope?.variant===current.variant&&scope?.batteryCells===current.batteryCells;
 }catch{return false;}
}
