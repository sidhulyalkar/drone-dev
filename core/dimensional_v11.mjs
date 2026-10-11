/**
 * AeroForge v1.1: dimensional source-registration and conservative geometry screening.
 * Contract: mm, aircraft BODY FRD (+X forward,+Y right,+Z down), datum is defined by
 * the user. Motor locations MUST NOT be interpreted as PX4 CG-relative locations.
 * All human-entered dimensions are unverified until independently inspected.
 */
export const GEOMETRY_SCHEMA='aeroforge/dimensional-inspection/v1.1';
export const FRAME='BODY_FRD_USER_DATUM_NOT_CG';
export const SOURCE_CATALOG=Object.freeze([
 {id:'x500-frame',label:'Holybro X500 V2 frame STEP',nominalFilename:'x500v2-frame.step',
  sourceUrl:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download',
  manufacturerDocumented:true,fileHash:null,cadImported:false,manufacturerGeometryAudited:false},
 {id:'x500-motor',label:'Holybro AIR2216II motor STEP',nominalFilename:'AIR2216II_Motor_3D.STEP',
  sourceUrl:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download',
  manufacturerDocumented:true,fileHash:null,cadImported:false,manufacturerGeometryAudited:false}
]);
const isNum=v=>typeof v==='number'&&Number.isFinite(v);
const range=(n,min,max,label)=>{if(!isNum(n)||n<min||n>max)throw Error('Invalid '+label+' (expected '+min+'..'+max+')');return n;};
const vec=(v,label)=>{if(!Array.isArray(v)||v.length!==3)throw Error('Invalid '+label+' vector');return v.map((a,i)=>range(a,-10000,10000,label+' axis '+i));};
const positiveVec=(v,label)=>vec(v,label).map(x=>range(x,0.000001,10000,label));
const str=(v,label,n=120)=>{if(typeof v!=='string'||v.length>n||!v.trim())throw Error('Invalid '+label);return v.trim();};
const allowed=(o,keys,label)=>{if(!o||typeof o!=='object'||Array.isArray(o))throw Error('Invalid '+label);for(const k of Object.keys(o))if(!keys.includes(k))throw Error('Unknown '+label+' field '+k);};
const squared=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const round=n=>Math.round(n*10000)/10000;
const emptyCheck=(id,status,detail,metrics=null)=>({id,status,detail,metrics});
export function normalizeDimensionalInput(raw){
 allowed(raw,['schema','mode','frame','source','minimumGapMm','rotors','components','frameReference','notes'],'inspection');
 if(raw.schema!==GEOMETRY_SCHEMA||raw.frame!==FRAME)throw Error('Wrong dimensional schema or coordinate frame');
 if(!['USER_MEASURED_UNREVIEWED','SYNTHETIC_DEMO'].includes(raw.mode))throw Error('Mode must identify measured-unreviewed or synthetic');
 allowed(raw.source,['label','fileName','sha256','sourceUrl'],'source');
 const source={
  label:str(raw.source.label,'source label'),fileName:str(raw.source.fileName,'source filename'),
  sha256:raw.source.sha256==null?null:str(raw.source.sha256,'source sha256',64).toLowerCase(),
  sourceUrl:raw.source.sourceUrl==null?null:str(raw.source.sourceUrl,'source URL',1000)
 };
 if(source.sha256&&!/^[a-f0-9]{64}$/.test(source.sha256))throw Error('SHA256 must be 64 hex digits');
 if(source.sourceUrl&&!/^https:\/\//.test(source.sourceUrl))throw Error('Source URL must be HTTPS');
 range(raw.minimumGapMm,0,250,'clearance requirement');
 if(!Array.isArray(raw.rotors)||raw.rotors.length<1||raw.rotors.length>12)throw Error('Rotor inventory must contain 1..12 entries');
 if(!Array.isArray(raw.components)||raw.components.length>70)throw Error('Components must be an array of at most 70');
 const rotors=raw.rotors.map((r,i)=>{
  allowed(r,['id','centerMm','propDiameterMm','spinDirection'],'rotor '+i);
  return {id:str(r.id,'rotor ID'),centerMm:vec(r.centerMm,'rotor center'),
   propDiameterMm:range(r.propDiameterMm,1,2000,'rotor propeller diameter'),
   spinDirection:r.spinDirection===undefined?'UNKNOWN':str(r.spinDirection,'spin direction')};
 });
 const components=raw.components.map((c,i)=>{
  allowed(c,['id','label','centerMm','dimensionsMm','massG','mountPatternMm'],'component '+i);
  const mountPatternMm=c.mountPatternMm===undefined||c.mountPatternMm===null?null:
   (Array.isArray(c.mountPatternMm)&&c.mountPatternMm.length===2?
    c.mountPatternMm.map((n,i)=>range(n,.01,500,'mount pattern '+i)):(()=>{throw Error('Invalid mount pattern')})());
  return {id:str(c.id,'component ID'),label:str(c.label,'component label'),
   centerMm:vec(c.centerMm,'component center'),
   dimensionsMm:positiveVec(c.dimensionsMm,'component dimensions'),
   massG:c.massG==null?null:range(c.massG,0.000001,1000000,'component mass'),
   mountPatternMm};
 });
 const allIds=[...rotors,...components].map(x=>x.id);
 if(new Set(allIds).size!==allIds.length)throw Error('All rotor/component identifiers must be unique');
 const notes=raw.notes==null?'':(typeof raw.notes==='string'&&raw.notes.length<=800?raw.notes:(()=>{throw Error('Invalid notes')})());
 const frameReference=raw.frameReference===undefined||raw.frameReference===null?null:
  str(raw.frameReference,'frame reference');
 return {schema:GEOMETRY_SCHEMA,mode:raw.mode,frame:FRAME,source,
  minimumGapMm:raw.minimumGapMm,rotors,components,frameReference,notes};
}
export function rotorDiskClearance(a,b){
 const distanceMm=Math.hypot(a.centerMm[0]-b.centerMm[0],a.centerMm[1]-b.centerMm[1]);
 const radialGapMm=distanceMm-(a.propDiameterMm+b.propDiameterMm)/2;
 return {pair:[a.id,b.id],distanceMm:round(distanceMm),gapMm:round(radialGapMm),
  method:'CONSERVATIVE_XY_DISK_PROJECTION_IGNORES_HEIGHT_DIFFERENCE'};
}
function overlapAabb(a,b){
 const axisOverlap=[0,1,2].map(axis=>
  (a.dimensionsMm[axis]+b.dimensionsMm[axis])/2-Math.abs(a.centerMm[axis]-b.centerMm[axis]));
 return {pair:[a.id,b.id],overlapMm:axisOverlap.map(round),
  overlapping:axisOverlap.every(t=>t>0),
  touching:axisOverlap.every(t=>t>=0),
  method:'BROAD_PHASE_AXIS_ALIGNED_ONLY_NO_FINE_MESH_INTERSECTION'};
}
function diskBoxXY(rotor,box){
 const closestX=Math.max(box.centerMm[0]-box.dimensionsMm[0]/2,
  Math.min(rotor.centerMm[0],box.centerMm[0]+box.dimensionsMm[0]/2));
 const closestY=Math.max(box.centerMm[1]-box.dimensionsMm[1]/2,
  Math.min(rotor.centerMm[1],box.centerMm[1]+box.dimensionsMm[1]/2));
 const distanceMm=Math.hypot(rotor.centerMm[0]-closestX,rotor.centerMm[1]-closestY);
 const gapMm=distanceMm-rotor.propDiameterMm/2;
 return {pair:[rotor.id,box.id],gapMm:round(gapMm),
  method:'CONSERVATIVE_XY_PROP_DISK_VS_COMPONENT_AABB_IGNORES_HEIGHT_AND_DOWNWASH'};
}
export function evaluateDimensionalInput(raw){
 const d=normalizeDimensionalInput(raw),checks=[];
 const add=(id,status,detail,metrics=null)=>checks.push(emptyCheck(id,status,detail,metrics));
 const disks=[],boxes=[],parts=[];
 if(d.rotors.length===1)add('rotor-coverage','HOLD','Only one rotor supplied; cannot infer complete aircraft geometry.');
 for(let i=0;i<d.rotors.length;i++)for(let j=i+1;j<d.rotors.length;j++){
  const x=rotorDiskClearance(d.rotors[i],d.rotors[j]);disks.push(x);
  add('disk:'+x.pair.join(':'),x.gapMm<d.minimumGapMm?'CONFLICT':'SCREEN_CLEAR',
   'Projected disk gap '+x.gapMm+' mm; requirement '+d.minimumGapMm+' mm. Different rotor heights do not waive this conservative warning.',x);
 }
 for(let i=0;i<d.components.length;i++)for(let j=i+1;j<d.components.length;j++){
  const x=overlapAabb(d.components[i],d.components[j]);boxes.push(x);
  if(x.touching)add('aabb:'+x.pair.join(':'),x.overlapping?'INTERFERENCE_CANDIDATE':'HOLD',
   'AABB boxes touch/overlap; validate the real mesh, allowed nested parts, fasteners and fit.',x);
 }
 for(const rotor of d.rotors)for(const component of d.components){
  const x=diskBoxXY(rotor,component);parts.push(x);
  if(x.gapMm<d.minimumGapMm)add('prop-box:'+x.pair.join(':'),'CONFLICT',
   'Projected propeller disk overlaps or falls within the required XY gap of a component. Verify actual 3D height and airflow envelope.',x);
 }
 const measured=d.components.filter(c=>c.massG!==null);
 const subtotalG=measured.reduce((s,c)=>s+c.massG,0);
 const subtotalCentroidMm=subtotalG>0?
  [0,1,2].map(k=>round(measured.reduce((sum,c)=>sum+c.massG*c.centerMm[k],0)/subtotalG)):null;
 const massComplete=d.components.length>0&&measured.length===d.components.length;
 if(!massComplete)add('mass-coverage','HOLD','One or more component masses missing; measured-component subtotal is not aircraft total mass.');
 if(d.mode==='SYNTHETIC_DEMO')add('demo-origin','HOLD','Synthetic demonstration coordinates are never measured CAD evidence.');
 if(!d.source.sha256)add('cad-hash','HOLD','No source-file SHA-256 registered. A file hash only identifies file bytes; it does not prove a file is authentic manufacturer CAD.');
 if(!d.frameReference)add('datum','HOLD','Frame datum reference undefined; rotor coordinates cannot be treated as CG-relative PX4 positions.');
 add('survey','HOLD','Requires true CG (including all parts, harness and battery), independently checked source registration, rotor spin/output mapping and calibrated performance.');
 const conflicts=checks.filter(c=>c.status==='CONFLICT').length;
 return {schema:'aeroforge/dimensional-evaluation/v1.1',design:d,
  projection:{diskPairs:disks,componentAabbs:boxes,propToPart:parts},
  knownComponentMass:{componentCount:d.components.length,measuredCount:measured.length,
   subtotalG:round(subtotalG),subtotalCentroidMm,massComplete,
   notAircraftAllUpMass:true,notQualifiedCG:true},
  checks,counts:{conflicts,interferenceCandidates:checks.filter(c=>c.status==='INTERFERENCE_CANDIDATE').length,
   holds:checks.filter(c=>c.status==='HOLD').length,
   screenClearPairs:checks.filter(c=>c.status==='SCREEN_CLEAR').length},
  status:conflicts?'CONFLICT_SCREEN':checks.some(c=>c.status==='INTERFERENCE_CANDIDATE')?'INSPECT_OVERLAP':'UNQUALIFIED_PLAN_ONLY',
  cadImportedByApp:false,manufacturerCadParsed:false,
  positionApproval:false,powerApproval:false,flightApproval:false};
}
/** Needs independently reviewed actual all-up CG coordinates, not arithmetic subtotal. */
export function px4GeometryHandoff(evaluation){
 if(evaluation?.schema!=='aeroforge/dimensional-evaluation/v1.1')throw Error('Invalid evaluation');
 return {schema:'aeroforge/px4-frd-geometry-handoff/v1.1',
  inputDatum:FRAME,inputUnits:'mm',px4TargetFrame:'FRD_RELATIVE_TO_MEASURED_CG',px4TargetUnits:'m',
  sourceFileHash:evaluation.design.source.sha256,sourceAuthority:evaluation.design.mode,
  measuredCgMm:null,verifiedMotorSpinDirections:null,outputMapping:null,
  px4MotorPositionMeters:null,
  measuredPositionsFromUserDatum:evaluation.design.rotors.map(r=>({id:r.id,centerMm:[...r.centerMm],propDiameterMm:r.propDiameterMm})),
  status:'BLOCKED_MEASURED_CG_AND_SOURCE_VERIFICATION_REQUIRED',
  warning:'PX4 rotor positions require FRD metres relative to independently measured whole-aircraft CG, not this datum or estimated component subtotal.'};
}
export function inspectionPacket(evaluation){
 const d=evaluation?.design;
 if(evaluation?.schema!=='aeroforge/dimensional-evaluation/v1.1')throw Error('Invalid evaluation');
 return ['# AeroForge v1.1 — dimensional inspection','',
  'STATUS: '+evaluation.status,
  'SOURCE: '+d.source.label,
  'FILENAME: '+d.source.fileName,
  'SHA-256: '+(d.source.sha256??'MISSING'),
  'FRAME: '+d.frame,
  'MODE: '+d.mode,'',
  '## Rotors',...d.rotors.map(r=>'- '+r.id+': '+r.centerMm.join(', ')+' mm, prop '+r.propDiameterMm+' mm'),
  '','## Components',...d.components.map(c=>'- '+c.id+' / '+c.label+': '+c.centerMm.join(', ')+
   ' mm, dimensions '+c.dimensionsMm.join('×')+' mm, mass '+(c.massG??'UNKNOWN')+' g'),
  '','## Results',...evaluation.checks.map(c=>'- ['+c.status+'] '+c.id+': '+c.detail),
  '','Known component subtotal: '+evaluation.knownComponentMass.subtotalG+' g (NOT total aircraft mass)',
  '','**AABB and XY disk checks are conservative planning screens, not proof of collision-free fit. No physical or flight approval.**',''].join('\n');
}
/** Synthetic geometry is visually useful but must NEVER seed default measured fields. */
export function syntheticExample(){
 const q={schema:GEOMETRY_SCHEMA,mode:'SYNTHETIC_DEMO',frame:FRAME,frameReference:'SYNTHETIC_LOCAL_ORIGIN',
 source:{label:'SYNTHETIC CLASSROOM GEOMETRY, NOT HOLYBRO CAD',fileName:'synthetic-example-not-a-file',
  sha256:null,sourceUrl:null},minimumGapMm:5,
 rotors:[
  {id:'R1',centerMm:[180,180,0],propDiameterMm:254},
  {id:'R2',centerMm:[-180,180,0],propDiameterMm:254},
  {id:'R3',centerMm:[-180,-180,0],propDiameterMm:254},
  {id:'R4',centerMm:[180,-180,0],propDiameterMm:254}
 ],components:[
  {id:'frame-proxy',label:'Synthetic frame AABB',centerMm:[0,0,0],dimensionsMm:[140,140,25],massG:610,mountPatternMm:null},
  {id:'sensor-proxy',label:'Synthetic camera payload AABB',centerMm:[0,-68,40],dimensionsMm:[42,52,40],massG:90,mountPatternMm:null}
 ],notes:'Not derived from X500 STEP. Do not use dimensions for a real drone.'};
 return q;
}
