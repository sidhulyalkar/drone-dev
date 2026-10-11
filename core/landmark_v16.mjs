/**
 * v1.6 audit-friendly CAD landmark geometry.
 * Invariant: coordinates are in NATIVE CAD KERNEL MILLIMETRES, not FRD and not CG.
 * A circle fit of arbitrary clicked surfaces NEVER establishes a motor shaft center.
 */
export const LANDMARK_SCHEMA='aeroforge/cad-feature-measurement/v1.6';
const hashRe=/^[a-f0-9]{64}$/;
const vec=(x,label)=>{if(!Array.isArray(x)||x.length!==3||x.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>100000))throw Error('Invalid '+label);return [...x];};
const sub=(a,b)=>a.map((x,i)=>x-b[i]),sum=(a,b)=>a.map((x,i)=>x+b[i]),scale=(v,s)=>v.map(x=>x*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const norm=v=>Math.sqrt(dot(v,v));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const rounded=x=>Math.round(x*1e5)/1e5;
const roundVec=x=>x.map(rounded);
function validatePoint(p,i){
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid CAD-picked point '+i);
 const point=vec(p.pointKernelMm,'point coordinates');
 if(!Number.isInteger(p.meshIndex)||p.meshIndex<0||p.meshIndex>500)throw Error('Invalid mesh index');
 if(typeof p.meshName!=='string'||p.meshName.length>160)throw Error('Invalid mesh label');
 const origin=p.origin??'VISUAL_SURFACE_RAYCAST_NOT_SHAFT_DATUM';
 if(!['VISUAL_SURFACE_RAYCAST_NOT_SHAFT_DATUM','USER_TYPED_SURFACE_COORDINATES_NOT_VERIFIED'].includes(origin))
  throw Error('Unsupported surface-point evidence origin');
 return {pointKernelMm:point,meshIndex:p.meshIndex,meshName:p.meshName,origin};
}
/** Convert Three.js scene-root local GLTF metre positions back into kernel millimetres. */
export function gltfMetersToKernelMm(x){return roundVec(vec(x,'GLTF local point').map(v=>v*1000));}
export function kernelMmToGltfMeters(x){return vec(x,'CAD mm position').map(v=>v/1000);}
export function fitCadCircle(points,source){
 if(!Array.isArray(points)||points.length<4||points.length>64)throw Error('Circle feature requires 4..64 distinct picked surface points');
 if(!source||!hashRe.test(source.stepSha256)||!hashRe.test(source.glbSha256)||
  typeof source.revision!=='string'||!source.revision.trim()||source.revision.length>160)
  throw Error('Valid source STEP and derived GLB identity required');
 const anchors=points.map(validatePoint);
 const unique=new Set(anchors.map(a=>a.pointKernelMm.map(v=>v.toFixed(5)).join(',')));
 if(unique.size!==anchors.length)throw Error('Duplicate picked surface point');
 // Find the greatest-area triangle to reduce degeneracy for a 3D circumcircle seed.
 let best=null,areaSq=0;
 for(let i=0;i<anchors.length-2;i++)for(let j=i+1;j<anchors.length-1;j++)for(let k=j+1;k<anchors.length;k++){
  const p=anchors[i].pointKernelMm,u=sub(anchors[j].pointKernelMm,p),v=sub(anchors[k].pointKernelMm,p);
  const crossUV=cross(u,v),n2=dot(crossUV,crossUV);
  if(n2>areaSq){best={i,j,k,u,v,crossUV,p};areaSq=n2;}
 }
 if(!best||areaSq<1e-10)throw Error('Selected CAD points are collinear or nearly coincident');
 const {u,v,p,crossUV}=best;
 const n=scale(crossUV,1/Math.sqrt(areaSq));
 // Solve 2x2 Gram system for circumcenter in the plane of the three seed points.
 const uu=dot(u,u),uv=dot(u,v),vv=dot(v,v),den=uu*vv-uv*uv;
 if(den<=1e-10)throw Error('Circle fit is numerically degenerate');
 const alpha=vv*(uu-uv)/(2*den);
 const beta=uu*(vv-uv)/(2*den);
 const center=sum(p,sum(scale(u,alpha),scale(v,beta)));
 const radius=norm(sub(center,p));
 if(!Number.isFinite(radius)||radius<0.5||radius>10000)throw Error('Fitted circular feature radius out of bounds');
 const residuals=anchors.map(a=>{
  const q=sub(a.pointKernelMm,center);
  const offPlane=dot(q,n);
  const radial=Math.sqrt(Math.max(0,dot(q,q)-offPlane*offPlane));
  return {meshIndex:a.meshIndex,planeMm:rounded(offPlane),
   radialMm:rounded(radial-radius)};
 });
 const planarRmsMm=rounded(Math.sqrt(residuals.reduce((x,r)=>x+r.planeMm**2,0)/residuals.length));
 const radialRmsMm=rounded(Math.sqrt(residuals.reduce((x,r)=>x+r.radialMm**2,0)/residuals.length));
 const nonSeed=anchors.filter((_,idx)=>![best.i,best.j,best.k].includes(idx)).length;
 const maxPlaneMm=rounded(Math.max(...residuals.map(r=>Math.abs(r.planeMm))));
 const maxRadiusMm=rounded(Math.max(...residuals.map(r=>Math.abs(r.radialMm))));
 const highResidual=maxPlaneMm>Math.max(1.5,radius*.025)||maxRadiusMm>Math.max(1.5,radius*.025);
 return {
  schema:LANDMARK_SCHEMA,source:{stepSha256:source.stepSha256,glbSha256:source.glbSha256,
   revision:source.revision},
  fitType:'CIRCLE_THROUGH_LARGEST_AREA_TRIANGLE_WITH_HOLDOUT_RESIDUALS',
  pointCount:anchors.length,holdoutPointCount:nonSeed,
  points:anchors,centerKernelMm:roundVec(center),radiusKernelMm:rounded(radius),planeNormalCad:roundVec(n),
  diagnostics:{planarRmsMm,radialRmsMm,maxPlaneMm,maxRadiusMm,highResidual,
   status:highResidual?'REVIEW_OUTLIERS_OR_NONCIRCULAR_FEATURE':'NUMERICALLY_PLAUSIBLE_ONLY'},
  centerIsVerifiedMotorAxis:false,featureIdentityVerified:false,manufacturingUnitsVerified:false,
  independentPhysicalReview:false,qualifiedForConstruction:false,qualifiedForFlight:false,
  warning:'Only a mathematical circle through candidate surface points. Confirm that points lie on the correct concentric motor feature and actual motor axis. No independent manufacturer authentication or physical fit.'};
}
export function annotateRotorWithCircle(rotor,fit,source){
 if(fit?.schema!==LANDMARK_SCHEMA||!fit.centerKernelMm||fit.centerIsVerifiedMotorAxis!==false||
 !source||fit.source.stepSha256!==source.stepSha256||fit.source.glbSha256!==source.glbSha256||
 fit.source.revision!==source.revision)throw Error('Circle candidate is not bound to the current CAD source');
 if(fit.diagnostics.highResidual)throw Error('Circle contains high geometric residual; inspect and repick');
 if(!rotor||typeof rotor.id!=='string'||!rotor.id)throw Error('Rotor identity required');
 return {...rotor,centerKernelMm:[...fit.centerKernelMm],
  observationKind:'CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS',
  featureEvidence:{schema:LANDMARK_SCHEMA,
   stepSha256:fit.source.stepSha256,glbSha256:fit.source.glbSha256,revision:fit.source.revision,
   featureCenterKernelMm:[...fit.centerKernelMm],fitRadiusKernelMm:fit.radiusKernelMm,
   pointCount:fit.pointCount,radialRmsMm:fit.diagnostics.radialRmsMm,
   planarRmsMm:fit.diagnostics.planarRmsMm,
   shaftCenterIndependentlyVerified:false}};
}
