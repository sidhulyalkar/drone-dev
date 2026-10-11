/**
 * Two distinct contracts:
 * (a) Calibrated PX4-model readiness checks; (b) a synthetic 1D vertical-motion sandbox.
 * Synthetic output MUST NEVER be confused with PX4/Gazebo or measured performance.
 */
const finite = n=>typeof n==='number'&&Number.isFinite(n);
export const requiredMeasurements = Object.freeze([
 'massKg','inertia','rotorXYZm','spinDirections','motorThrustCoefficient','motorMomentCoefficient',
 'motorTimeConstantUpS','motorTimeConstantDownS','maxMotorRadS','airframeSource','autopilotTarget','escProtocol',
 'batteryAndEscSource','measurementEvidence'
]);
function positive(n, hi){return finite(n)&&n>0&&n<=hi;}
function posDef(m){
 if(!m||['ixx','iyy','izz','ixy','ixz','iyz'].some(k=>!finite(m[k])))return false;
 const {ixx:a,iyy:d,izz:f,ixy:b,ixz:c,iyz:e}=m;
 const determinant=a*d*f+2*b*c*e-a*e*e-d*c*c-f*b*b;
 return a>0 && a*d-b*b>1e-14 && determinant>1e-18;
}
function evidenced(source,field){return Boolean(source&&source[field]&&typeof source[field].sha256==='string'&&/^[0-9a-f]{64}$/i.test(source[field].sha256)&&typeof source[field].method==='string'&&source[field].method.trim().length>4&&typeof source[field].revision==='string'&&source[field].revision.trim().length>0);}
export function auditCalibration(x={}){
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Calibration must be an object');
 const issues=[];const hold=(field,why)=>issues.push({field,reason:why});
 if(!positive(x.massKg,100))hold('massKg','Measure integrated ready-to-fly mass with actual payload and pack');
 if(!posDef(x.inertia))hold('inertia','Six measured symmetric inertia entries in kg·m² must form a positive-definite tensor');
 if(!Array.isArray(x.rotorXYZm)||x.rotorXYZm.length!==4||x.rotorXYZm.some(r=>!r||['x','y','z'].some(k=>!finite(r[k])||Math.abs(r[k])>2)))hold('rotorXYZm','Register four motor center coordinates in vehicle frame (meters)');
 else {
  const a=x.rotorXYZm;
  if(a.some((r,i)=>a.some((s,j)=>j>i&&Math.hypot(s.x-r.x,s.y-r.y,s.z-r.z)<.05)))hold('rotorXYZm','Motor centers contain collocated/near-collocated rotors');
 }
 if(!Array.isArray(x.spinDirections)||x.spinDirections.length!==4||x.spinDirections.some(d=>d!=='cw'&&d!=='ccw')||x.spinDirections.filter(d=>d==='cw').length!==2)hold('spinDirections','Exactly two CW and two CCW motors needed; verify channel order against actual frame');
 for(const [field,max] of [['motorThrustCoefficient',.1],['motorMomentCoefficient',1],['motorTimeConstantUpS',5],['motorTimeConstantDownS',5],['maxMotorRadS',50000]])if(!positive(x[field],max))hold(field,'Measured coefficient/dynamic parameter required in SI units; do not copy values from PX4 x500');
 for(const field of ['airframeSource','autopilotTarget','escProtocol','batteryAndEscSource'])if(typeof x[field]!=='string'||x[field].trim().length<3)hold(field,'Provide exact identified source/revision or PX4-compatible hardware target');
 if(!x.measurementEvidence||typeof x.measurementEvidence!=='object')hold('measurementEvidence','Provide SHA-256 files, methods and revisions for calibrated parameters');
 else for(const field of ['massKg','inertia','rotorXYZm','spinDirections','motorThrustCoefficient','motorMomentCoefficient','motorTimeConstantUpS','motorTimeConstantDownS','maxMotorRadS'])if(!evidenced(x.measurementEvidence,field))hold(`evidence:${field}`,'Attach independently inspectable source file hash, method and revision');
 // Even with complete records, the result authorizes only a candidate model for additional QA.
 return {schema:'aeroforge/simulation-audit/v0.5',candidateModelReady:issues.length===0,physicalFlightQualified:false,
  status:issues.length?'BLOCKED_MISSING_MEASUREMENT':'MODEL_INPUTS_COMPLETE_REQUIRES_SIM_QA',issues,
  caution:'Parameter completeness cannot validate calibration quality, SITL fidelity, actuator mapping, or real flight safety.'};
}
export const DEMO_PARAMETERS=Object.freeze({massKg:1.2,motorMaxThrustN:6,motorResponseS:.12,linearDragKgPerS:.25,gravity:9.80665});
/** Explicitly synthetic vertical force balance with four identical motors, zero wind, ideal controller, no attitude dynamics. */
export function syntheticHoverDemo({seconds=8,payloadG=0,throttle=0.5,parameters=DEMO_PARAMETERS}={}){
 if(!finite(seconds)||seconds<=0||seconds>30||!finite(payloadG)||payloadG<0||payloadG>3000||!finite(throttle)||throttle<0||throttle>1)throw Error('Invalid synthetic experiment');
 const {massKg,motorMaxThrustN,motorResponseS,linearDragKgPerS,gravity}=parameters;
 if(!positive(massKg,100)||!positive(motorMaxThrustN,1000)||!positive(motorResponseS,5)||!finite(linearDragKgPerS)||linearDragKgPerS<0||!positive(gravity,20))throw Error('Invalid synthetic constants');
 const dt=.02,m=massKg+payloadG/1000;let z=0,vz=0,thrust=0;const points=[];
 for(let step=0;step<=Math.round(seconds/dt);step++){
  const t=step*dt;
  if(step%10===0)points.push({t:Number(t.toFixed(2)),z:Number(z.toFixed(4)),vz:Number(vz.toFixed(4))});
  const commanded=4*motorMaxThrustN*throttle;
  thrust+=(commanded-thrust)*(1-Math.exp(-dt/motorResponseS));
  const acceleration=(thrust-linearDragKgPerS*vz)/m-gravity;
  vz+=acceleration*dt;z+=vz*dt;
  if(z<0){z=0;vz=0;}
 }
 return {schema:'aeroforge/synthetic-vertical-demo/v0.5',status:'DEMONSTRATION_ONLY_NOT_PX4',model:'one-dimensional rigid mass; no pitch/roll/yaw, wind or ground effect',
  parameters:{...parameters,payloadG,throttle},hoverThrottle:m*gravity/(4*motorMaxThrustN),points,
  finalAltitudeM:Number(z.toFixed(3)),isPhysicallyQualified:false};
}
