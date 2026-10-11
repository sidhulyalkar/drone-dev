/**
 * v1.5 human-observed X500 CAD datum registration bridge.
 * Coordinates are entered by a human in the source STEP kernel frame in mm.
 * A local STEP SHA-256 is checked, but vendor identity and frame transforms are NOT verified.
 */
import {evaluateDimensionalInput,GEOMETRY_SCHEMA,FRAME} from './dimensional_v11.mjs';
import {attachX500Cad,KIT_RECORD_SCHEMA} from './x500_record_v14.mjs';

export const REGISTRATION_SCHEMA='aeroforge/x500-registration-proposal/v1.5';
export const X500_REFERENCE_FACTS=Object.freeze([
 {id:'wheelbase',name:'Nominal wheelbase',valueMm:500,source:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2',kind:'MANUFACTURER_PUBLISHED'},
 {id:'body-plate',name:'Body plate width',valueMm:144,source:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2',kind:'MANUFACTURER_PUBLISHED'},
 {id:'plate-gap',name:'Plate separation',valueMm:28,source:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2',kind:'MANUFACTURER_PUBLISHED'},
 {id:'motor-pattern-old',name:'Motor pattern documented on older product page',valueMm:16,source:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2',kind:'REVISION_DEPENDENT'},
 {id:'motor-pattern-other',name:'Additional motor pattern on current store',valueMm:19,source:'https://holybro.com/products/px4-development-kit-x500-v2',kind:'REVISION_DEPENDENT'}
]);
const sha=/^[a-f0-9]{64}$/;
const fail=message=>{throw Error(message);};
const number=(x,label,min=-20000,max=20000)=>{
 if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)fail('Invalid '+label);
 return x;
};
const xyz=(v,name)=>{
 if(!Array.isArray(v)||v.length!==3)fail(name+' must have three coordinates');
 return v.map((x,i)=>number(x,name+' axis '+i));
};
const det3=a=>a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])
 -a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])
 +a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
export function signedAxisMatrix(axisMap){
 if(!Array.isArray(axisMap)||axisMap.length!==3)fail('Axis map must have exactly three signed axes');
 const matrix=[0,1,2].map(i=>{
  const token=axisMap[i];
  if(typeof token!=='string'||!/^[-+][XYZ]$/.test(token))fail('Invalid signed axis token');
  return 'XYZ'.split('').map(letter=>letter===token[1]?(token[0]==='+'?1:-1):0);
 });
 const used=new Set(axisMap.map(token=>token[1]));
 if(used.size!==3)fail('Axis map repeats a CAD source axis');
 if(det3(matrix)!==1)fail('Axis conversion must be a right-handed rotation (determinant +1), not a reflection');
 return matrix;
}
const transform=(point,datum,matrix)=>matrix.map(row=>row.reduce((sum,c,i)=>sum+c*(point[i]-datum[i]),0));
const rounded=x=>Math.round(x*10000)/10000;
const str=(s,label,max=160)=>{
 if(typeof s!=='string'||!s.trim()||s.length>max)fail('Invalid '+label);
 return s.trim();
};
/** A manually observed position is never accepted as independent manufacturer evidence. */
export function proposeX500Registration(preview,input){
 if(preview?.schema!=='aeroforge/cad-preview-evidence/v1.3'||preview.glbHashMatchesManifest!==true)
  fail('Load a hash-checked CAD visual package');
 if(preview.localStepHashMatchesManifest!==true)fail('Original STEP bytes must match local visual manifest before annotating');
 const packageSource=preview.manifest?.source;
 if(packageSource?.fileName?.toLowerCase()!=='x500v2-frame.step'||!sha.test(packageSource.sha256))
  fail('An exact-name X500 V2 frame STEP source is required');
 if(input==null||typeof input!=='object'||Array.isArray(input))fail('Registration input is required');
 for(const k of Object.keys(input))
  if(!['axisMap','datumKernelMm','rotors','observationNotes','reviewerLabel','sourceUnitsReviewed'].includes(k))
   fail('Unknown registration input '+k);
 const matrix=signedAxisMatrix(input.axisMap);
 const datumKernelMm=xyz(input.datumKernelMm,'CAD origin datum');
 const reviewerLabel=str(input.reviewerLabel,'observer label',80);
 const observationNotes=str(input.observationNotes,'observation source and notes',1200);
 if(input.sourceUnitsReviewed!==true)fail('Explicit source unit inspection declaration required; no automatic proof');
 if(!Array.isArray(input.rotors)||input.rotors.length!==4)fail('X500 reference requires four distinct observed motor centers');
 const rotors=input.rotors.map((r,i)=>{
  if(!r||typeof r!=='object'||Array.isArray(r))fail('Invalid motor observation');
  for(const k of Object.keys(r))if(!['id','centerKernelMm','propDiameterMm','observationKind','featureEvidence'].includes(k))fail('Unknown motor field '+k);
  const id=str(r.id,'motor ID',40);
  const centerKernelMm=xyz(r.centerKernelMm,'motor center '+id);
  const propDiameterMm=number(r.propDiameterMm,'propeller diameter',1,2000);
  const kind=r.observationKind??'MANUAL_COORDINATE_HYPOTHESIS';
  if(!['MANUAL_COORDINATE_HYPOTHESIS','CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS'].includes(kind))
   fail('Unknown motor observation kind');
  let featureEvidence=null;
  if(kind==='CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS'){
   const e=r.featureEvidence;
   if(e?.schema!=='aeroforge/cad-feature-measurement/v1.6'||
      e.stepSha256!==packageSource.sha256||
      e.glbSha256!==preview.manifest?.mesh?.sha256||
      e.revision!==packageSource.revision||
      e.shaftCenterIndependentlyVerified!==false||
      !Array.isArray(e.featureCenterKernelMm)||e.featureCenterKernelMm.length!==3||
      e.featureCenterKernelMm.some((n,i)=>typeof n!=='number'||Math.abs(n-centerKernelMm[i])>1e-4))
    fail('Circle-fit annotation does not match this exact CAD revision and measured center');
   featureEvidence={...e};
  }else if(r.featureEvidence!==undefined)fail('Manual center cannot carry a CAD circle fit receipt');
  return {id,centerKernelMm,centerDatumFRDMm:transform(centerKernelMm,datumKernelMm,matrix).map(rounded),
   propDiameterMm,annotationSource:kind,featureEvidence};
 });
 if(new Set(rotors.map(r=>r.id)).size!==4)fail('Motor identifiers must be unique');
 const points=rotors.map(r=>r.centerDatumFRDMm);
 const pairings=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
 const candidates=pairings.map(pairs=>{
  const distances=pairs.map(([a,b])=>rounded(Math.hypot(points[a][0]-points[b][0],points[a][1]-points[b][1])));
  const totalDeviationMm=rounded(distances.reduce((s,x)=>s+Math.abs(x-500),0));
  return {pairs:pairs.map(pair=>pair.map(i=>rotors[i].id)),diagonalDistancesMm:distances,totalDeviationMm};
 });
 candidates.sort((a,b)=>a.totalDeviationMm-b.totalDeviationMm);
 const best=candidates[0];
 const referenceComparison={
  source:'MANUFACTURER_NOMINAL_WHEELBASE_NOT_A_CALIBRATED_TOLERANCE',
  expectedDiagonalMm:500,selectedPairing:best.pairs,
  candidateDiagonalDistancesMm:best.diagonalDistancesMm,maximumDeviationMm:rounded(Math.max(...best.diagonalDistancesMm.map(x=>Math.abs(x-500)))),
  assessment:best.diagonalDistancesMm.every(x=>Math.abs(x-500)<=15)?
   'CLOSE_TO_NOMINAL_REFERENCE_ONLY':'REVIEW_DIMENSION_OR_PAIRING',
  warning:'Pairing is a heuristic selected from three alternatives. A close dimension never verifies manufacturer source, mounting datums, rotor labels or orientation.'
 };
 const design={
  schema:GEOMETRY_SCHEMA,mode:'USER_MEASURED_UNREVIEWED',frame:FRAME,
  frameReference:'Human-entered CAD datum; source FRD mapping user-declared; NOT whole-aircraft CG.',
  source:{label:'User-observed X500 V2 CAD motor markers, NOT independently verified',fileName:packageSource.fileName,
   sha256:packageSource.sha256,sourceUrl:packageSource.documentationUrl},
  minimumGapMm:5,
  rotors:rotors.map(r=>({id:r.id,centerMm:r.centerDatumFRDMm,
   propDiameterMm:r.propDiameterMm})),
  components:[],
  notes:'Manually identified STEP coordinate observations, unreviewed. No independent axes, CG, motor or propeller physical verification.'
 };
 const preliminary=evaluateDimensionalInput(design);
 return {
  schema:REGISTRATION_SCHEMA,reference:'holybro-x500-v2',
  sourcePackage:{sha256:packageSource.sha256,glbSha256:preview.manifest.mesh.sha256,
   revision:packageSource.revision,sourceFile:packageSource.fileName,
   localStepBytesMatched:true,manufacturerAuthenticated:false},
  axisMap:[...input.axisMap],axisMatrix:matrix,datumKernelMm,sourceUnitsReviewedByUser:true,
  reviewerLabel,observationNotes,rotors,referenceComparison,
  referenceFacts:X500_REFERENCE_FACTS,
  dimensionalDraft:design,dimensionalScreen:preliminary,
  manufacturerIdentityVerified:false,axesIndependentlyRegistered:false,
  measuredAircraftCgMm:null,fitQualified:false,flightApproved:false,
  status:'UNVERIFIED_CAD_MEASUREMENT_PROPOSAL'
 };
}
export function attachX500Registration(record,preview,registration){
 if(record?.schema!==KIT_RECORD_SCHEMA)fail('Expected canonical X500 hardware record');
 if(registration?.schema!==REGISTRATION_SCHEMA)fail('Invalid registration proposal');
 if(preview?.localStepHashMatchesManifest!==true)fail('Verified local original STEP bytes required');
 if(preview.manifest.source.sha256!==registration.sourcePackage.sha256||
    preview.manifest.mesh.sha256!==registration.sourcePackage.glbSha256)
  fail('Registration references a different CAD package revision');
 const linked=attachX500Cad(record,preview);
 return {...linked,geometry:{...linked.geometry,
  unverifiedMotorDatumFRDMm:registration.rotors.map(r=>({id:r.id,centerMm:[...r.centerDatumFRDMm]})),
  unverifiedAxisMapping:[...registration.axisMap],
  referenceWheelbaseComparison:registration.referenceComparison,
  aircraftDatumRegistered:false,motorXYZm:null,measuredCgMm:null,collisionQualified:false},
  procurementApproved:false,powerApproved:false,flightApproved:false};
}
