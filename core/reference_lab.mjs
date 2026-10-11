/** AeroForge reference engineering lab v0.3. Source facts never overwrite the synthetic candidate catalog. */
export const references = Object.freeze({
  frame: {
    sku:'TBS Source Two V0.1, 5-inch',revision:'v0.1',kind:'frame',vendor:'Team BlackSheep',
    url:'https://www.team-blacksheep.com/products/prod:source_two_5in',
    cad:'https://github.com/ps915/source_two',cadLicense:'GPL-3.0',
    facts:{wheelbaseMm:220,massG:72,topPlateMm:2,bottomPlateMm:3,armThicknessMm:4,standoffMm:25,stackMountMm:[20,30.5]},
    provenance:{wheelbaseMm:'manufacturer',massG:'manufacturer',topPlateMm:'manufacturer',bottomPlateMm:'manufacturer',armThicknessMm:'manufacturer',standoffMm:'manufacturer',stackMountMm:'manufacturer'},
    unknown:['Exact motor XY coordinates (source CAD not imported)','Arm motor bolt-hole pattern and usable screw depth','Camera and propeller swept-volume interference']
  },
  motor: {
    sku:'T-Motor Velox V2207 V2 1750KV',revision:'V2 / 1750KV',kind:'motor',vendor:'T-Motor',
    url:'https://store.tmotor.com/product/v2207-v2-fpv-motor.html',
    facts:{massG:35.1,cellsMin:5,cellsMax:6,peakCurrentA60s:36.6,shaftMm:4,diameterMm:27.5,heightMm:31.35},
    provenance:{massG:'manufacturer',cellsMin:'manufacturer',cellsMax:'manufacturer',peakCurrentA60s:'manufacturer',shaftMm:'manufacturer',diameterMm:'manufacturer',heightMm:'manufacturer'},
    unknown:['Exact mounting hole dimensions (require mechanical drawing inspection)','Actual thermal current limits on chosen airframe'],
    bench:{propeller:'T5143S',testVoltageV:23.77,points:[
      {throttlePct:50,thrustG:546.27,currentA:6.79,voltageV:23.77,powerW:161.38},
      {throttlePct:60,thrustG:740.45,currentA:10.87,voltageV:23.58,powerW:256.48},
      {throttlePct:70,thrustG:943.32,currentA:15.66,voltageV:23.38,powerW:366.10},
      {throttlePct:80,thrustG:1140.46,currentA:20.92,voltageV:23.17,powerW:484.67},
      {throttlePct:90,thrustG:1343.13,currentA:27.15,voltageV:22.86,powerW:620.70},
      {throttlePct:100,thrustG:1507.11,currentA:34.11,voltageV:22.51,powerW:767.59}
    ]}
  },
  prop: {
    sku:'T-Motor T5143S',revision:'version unspecified',kind:'propeller',vendor:'T-Motor',
    url:'https://store.tmotor.com/product/t5143s-fpv-propeller.html',
    facts:{nominalSizeIn:5.1},provenance:{nominalSizeIn:'model-name-inference'},
    unknown:['Measured tip-to-tip diameter','Hub bore/shaft interface and locking mechanism','Per-propeller measured mass, dynamic balance','Matched clockwise/counterclockwise configuration']
  },
  stack:{
    sku:'SpeedyBee F405 V5 OX32 55A stack',revision:'V5 / OX32 55A',kind:'flight-stack',vendor:'SpeedyBee',
    url:'https://www.speedybee.com/speedybee-f405-v5-55a-stack/',discontinued:true,
    facts:{stackMountMm:30.5,cellsMin:3,cellsMax:6,escContinuousA:55,fcMassG:8.1,escMassG:19.1,fcDimensionsMm:[39,39,4.9],escDimensionsMm:[40.9,44.9,8],bec5VA:2.5,bec9VA:2.5,firmware:'Betaflight'},
    provenance:{stackMountMm:'manufacturer',cellsMin:'manufacturer',cellsMax:'manufacturer',escContinuousA:'manufacturer',fcMassG:'manufacturer',escMassG:'manufacturer',fcDimensionsMm:'manufacturer',escDimensionsMm:'manufacturer',bec5VA:'manufacturer',bec9VA:'manufacturer',firmware:'manufacturer'},
    unknown:['Current replacement SKU with verified pinout','Compatible mounting clearance above frame plates','BEC thermal derating for actual accessory load']
  }
});
export const referenceSources = Object.freeze([
  {id:'TBS-FRAME',title:'TBS Source Two V0.1 product specification',url:references.frame.url,accessed:'2026-10-10',license:'Manufacturer facts; original frame CAD GPL-3.0'},
  {id:'TBS-CAD',title:'Source Two v0.1 STEP/DXF/F3D source',url:references.frame.cad,accessed:'2026-10-10',license:'GPL-3.0, not bundled'},
  {id:'TMOTOR-MOTOR',title:'T-Motor V2207 V2 1750KV datasheet and bench table',url:references.motor.url,accessed:'2026-10-10',license:'Manufacturer specifications'},
  {id:'TMOTOR-PROP',title:'T-Motor T5143S propeller product',url:references.prop.url,accessed:'2026-10-10',license:'Manufacturer product reference'},
  {id:'SPEEDYBEE-STACK',title:'SpeedyBee F405 V5 OX32 55A stack (DISCONTINUED)',url:references.stack.url,accessed:'2026-10-10',license:'Manufacturer specifications'},
  {id:'PX4-SITL',title:'PX4 Gazebo custom models documentation',url:'https://docs.px4.io/v1.18/en/sim_gazebo_gz/',accessed:'2026-10-10',license:'Reference documentation'},
  {id:'FAA-REG',title:'FAA recreational registration and Remote ID',url:'https://www.faa.gov/uas/getting_started/register_drone',accessed:'2026-10-10',license:'Official agency guidance'}
]);
export const defaultReferenceInputs=Object.freeze({batteryCells:6,batteryMassG:210,batterySku:'',otherMassG:210,otherMassEvidence:'assumption',massMeasuredG:null,motorHalfSpanXMm:77.78,motorHalfSpanYMm:77.78,rotorCoordinatesVerified:false,propDiameterMeasuredMm:null,stackReplacementVerified:false,stackReplacementSku:'',motorMountVerified:false,propHubVerified:false,groundControlVerified:false,remoteIdVerified:false});
const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
const safe=(v,min,max)=>finite(v)&&v>=min&&v<=max;
const round=(n,d=2)=>Number(n.toFixed(d));
export function normalizeReferenceInputs(src={}){
 if(src===null||typeof src!=='object'||Array.isArray(src))throw Error('Reference settings must be an object');
 const permitted=Object.keys(defaultReferenceInputs);for(const k of Object.keys(src))if(!permitted.includes(k))throw Error(`Unknown reference field ${k}`);
 const o={...defaultReferenceInputs,...src};
 for(const [k,a,b] of [['batteryMassG',0,1200],['otherMassG',0,1200],['motorHalfSpanXMm',30,300],['motorHalfSpanYMm',30,300]])if(!safe(o[k],a,b))throw Error(`Invalid ${k}`);
 for(const [k,a,b] of [['massMeasuredG',50,5000],['propDiameterMeasuredMm',50,400]])if(o[k]!==null&&!safe(o[k],a,b))throw Error(`Invalid ${k}`);
 if(![4,5,6,7,8].includes(o.batteryCells))throw Error('Invalid cell count');
 for(const k of ['rotorCoordinatesVerified','stackReplacementVerified','motorMountVerified','propHubVerified','groundControlVerified','remoteIdVerified'])if(typeof o[k]!=='boolean')throw Error(`Invalid ${k}`);
 if(typeof o.batterySku!=='string'||o.batterySku.length>100)throw Error('Invalid battery SKU');
 if(typeof o.stackReplacementSku!=='string'||o.stackReplacementSku.length>100)throw Error('Invalid stack replacement SKU');
 if(o.otherMassEvidence!=='assumption'&&o.otherMassEvidence!=='weighed')throw Error('Invalid other mass evidence');
 return o;
}
function issue(id,severity,summary,evidence,action){return {id,severity,summary,evidence,action};}
const knownAirframeMassG=references.frame.facts.massG+4*references.motor.facts.massG+references.stack.facts.fcMassG+references.stack.facts.escMassG;
export function referenceLayout(input={}){
 const s=normalizeReferenceInputs(input),x=s.motorHalfSpanXMm,y=s.motorHalfSpanYMm;
 // Coordinates below are user-modifiable proxy positions; no source CAD or measured motor locations included.
 const coords=[{x:-x,y:-y},{x:x,y:-y},{x:-x,y:y},{x:x,y:y}];
 const diagonal=Math.hypot(coords[0].x-coords[3].x,coords[0].y-coords[3].y);
 const diameter=s.propDiameterMeasuredMm??references.prop.facts.nominalSizeIn*25.4;
 let closest=Infinity,pair=null;
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
  const clearance=Math.hypot(coords[i].x-coords[j].x,coords[i].y-coords[j].y)-diameter;
  if(clearance<closest){closest=clearance;pair=[i,j]}
 }
 return {coords,diagonalMm:round(diagonal),framePublishedWheelbaseMm:220,propDiameterMm:round(diameter),tipClearanceMm:round(closest),closestPair:pair,rotorGeometrySource:s.rotorCoordinatesVerified?'user-attested measurements':'symmetrical-X proxy, NOT source frame geometry',propSource:s.propDiameterMeasuredMm!==null?'user-entered measurement':'model designation inference'};
}
function stageStatus(issues){if(issues.some(x=>x.severity==='BLOCKER'))return 'BLOCKED';if(issues.some(x=>x.severity==='HOLD'))return 'EVIDENCE_HOLD';return 'REVIEW';}
export function evaluateReference(input={}){
 const s=normalizeReferenceInputs(input),layout=referenceLayout(s);const issues=[];
 const add=(...args)=>issues.push(issue(...args));
 if(Math.abs(layout.diagonalMm-220)>3)add('WHEELBASE','HOLD',`Entered motor positions imply ${layout.diagonalMm}mm diagonal, not the published 220mm`,'Frame publishes wheelbase, not individual motor XY positions.','Derive the true coordinates from Source Two v0.1 CAD.');
 if(!s.rotorCoordinatesVerified)add('ROTOR_XY','HOLD','Motor centers are a symmetric-X visualization proxy','Source Two is described as stretched; exact motor XY must come from original CAD.','Import the original CAD, extract the motor centers, and record their drawing revision.');
 if(s.propDiameterMeasuredMm===null)add('PROP_SWEEP','HOLD','Propeller tip envelope is inferred from model name','T5143S product name is not dimensional inspection.','Measure the actual tip-to-tip diameter and fixture/hub stack-up.');
 if(layout.tipClearanceMm<=0)add('PROP_OVERLAP','BLOCKER',`Calculated rotor swept circles overlap by ${round(-layout.tipClearanceMm)} mm`,'A geometric overlap is unsafe even at conceptual stage.','Change motor spacing or prop diameter; remeasure before testing.');
 else if(layout.tipClearanceMm<10)add('PROP_GAP','HOLD',`Calculated nearest tip gap is only ${layout.tipClearanceMm} mm`,'Flex, manufacturing tolerance, yaw/pitch and frame obstacles not accounted for.','Derive real rotor disks from exact CAD and check moving envelopes.');
 if(!s.motorMountVerified)add('MOTOR_ARM_INTERFACE','HOLD','Arm-to-motor mounting is not qualified','V2207 technical drawing and frame DXF mounting interfaces have not been compared.','Inspect both mechanical drawings and motor fastener lengths.');
 if(!s.propHubVerified)add('PROP_HUB','HOLD','Propeller hub and motor shaft interface is not qualified','Published 4mm motor shaft does not establish prop hub mating features.','Inspect original prop and motor drawings; check retention system.');
 if(s.batteryCells<references.motor.facts.cellsMin||s.batteryCells>references.motor.facts.cellsMax)add('MOTOR_VOLTAGE','BLOCKER',`${s.batteryCells}S is outside documented motor screening range`,'T-Motor specifies this 1750KV model for 5–6S.','Select a documented compatible voltage.');
 if(s.batteryCells<references.stack.facts.cellsMin||s.batteryCells>references.stack.facts.cellsMax)add('ESC_VOLTAGE','BLOCKER','Battery cell count is outside documented stack input range','Stack is documented for 3–6S.','Use an ESC/FC rated for the selected pack.');
 if(!s.stackReplacementSku.trim())add('STACK_EOL','HOLD','Reference SpeedyBee F405 V5 stack is discontinued','Manufacturer explicitly labels its product discontinued.','Record a specific available replacement SKU and obtain its exact manufacturer documentation.');
 else add('STACK_REQUAL','HOLD',`Replacement ${s.stackReplacementSku} requires independent qualification`,'The published 30.5mm/3–6S/55A specifications belong to discontinued V5, NOT the entered replacement.','Re-extract dimensions, pinout, input voltage, BEC current, ESC performance and firmware target for the replacement; update the catalog model.');
 if(references.stack.facts.escContinuousA<references.motor.facts.peakCurrentA60s)add('ESC_CURRENT','BLOCKER','Published per-channel ESC rating below measured motor test peak','Bench peak current is 34.11 A at 100%; ESC continuous is 55 A.','Choose a suitable ESC and thermal rating.');
 if(s.batterySku.trim()==='')add('BATTERY_SKU','HOLD','Battery is an unqualified 6S mass assumption','No actual battery manufacturer, pack current rating, size, chemistry, connector, or BMS/charger specification.','Specify the exact pack SKU and inspect its datasheet.');
 if(s.otherMassEvidence!=='weighed')add('UNRESOLVED_MASS','HOLD','Accessories and assembly mass are assumptions','Video/radio/antenna/wires/fasteners masses are not measured as an integrated aircraft.','Weigh the revision-specific parts and complete BOM.');
 if(s.massMeasuredG===null)add('NO_ALL_UP_MASS','HOLD','No measured ready-to-fly mass','Even known component masses cannot substitute for a measured assembled aircraft.','Weigh the assembled aircraft with actual battery/props/camera.');
 if(!s.groundControlVerified)add('RC_FAILSAFE','HOLD','Radio, receiver, failsafe and ground link are unspecified','No controls/receiver/firmware pairing or link-loss bench evidence.','Specify exact control link and test failsafe props-off.');
 if(!s.remoteIdVerified)add('REGULATORY','HOLD','Operation requirements not independently documented','U.S. recreational flight may require TRUST, FAA registration and Remote ID.','Review current FAA and local airspace rules for actual aircraft/operation.');
 add('SITL_COEFFICIENTS','HOLD','Gazebo thrust/torque coefficients and inertias are missing','Bench thrust table alone is not a calibrated model; there is no measured inertia or dynamic actuator response.','Measure mass properties and identify motor kT/kQ and spin-up dynamics; then calibrate SITL.');
 const nominalMassG=round(knownAirframeMassG+s.batteryMassG+s.otherMassG,1);
 const massG=s.massMeasuredG??nominalMassG;
 const last=references.motor.bench.points.at(-1);
 const testThrustRatio=round(4*last.thrustG/massG,2);
 const benchMinThrustG=references.motor.bench.points[0].thrustG;
 // Hover current at user assumed/observed mass would require extrapolation below the measured range.
 const hoverInBenchRange=massG/4>=benchMinThrustG&&massG/4<=last.thrustG;
 return {schema:'aeroforge-reference-assessment/v0.3',referenceId:'source-two-v0.1-tmotor-1750',inputs:s,layout,
  knownAirframeMassG:round(knownAirframeMassG,1),nominalMassG,massG,massStatus:s.massMeasuredG===null?'assumed':'user-attested-measurement',
  bench:{maxMeasuredThrustPerMotorG:last.thrustG,maxMeasuredCurrentA:last.currentA,testPointVoltageV:last.voltageV,staticThrustRatioAtAssumedMass:testThrustRatio,
    hoverInsidePublishedTestWindow:hoverInBenchRange,staticAtPerMotorThrust:interpolateMeasuredStaticCurve(massG/4),hoverPowerW:null,enduranceMin:null},
  cost:{knownManufacturerFrameUSD:16.95,unknownSlots:['motor actual price/stock','replacement stack','battery','prop pack shipping/taxes','FPV/video','receiver/radio','charger','wiring/mounts','Remote ID equipment']},
  issues,status:stageStatus(issues),readiness:'NOT FLIGHT QUALIFIED',assumptions:['Symmetric X geometry is a proxy, not exact Source Two CAD','Mass estimate combines manufacturer subset and user inputs','Bench thrust data at specified conditions cannot predict flight time','Physical verification and valid operating authorization are always required']};
}
export function interpolateMeasuredStaticCurve(thrustG){
 const pts=references.motor.bench.points;
 if(!finite(thrustG)||thrustG<pts[0].thrustG||thrustG>pts.at(-1).thrustG)return null;
 if(thrustG===pts[0].thrustG)return {...pts[0],method:'manufacturer test point'};
 for(let i=1;i<pts.length;i++){
  const prev=pts[i-1],next=pts[i];if(thrustG<=next.thrustG){
   const f=(thrustG-prev.thrustG)/(next.thrustG-prev.thrustG);
   const fields=['throttlePct','currentA','powerW','voltageV'];
   const out=Object.fromEntries(fields.map(k=>[k,round(prev[k]+f*(next[k]-prev[k]),2)]));
   return {...out,thrustG,method:f===1?'manufacturer test point':'linear interpolation between manufacturer static thrust test points'};
  }
 }
 return null;
}
export function referenceRevision(result){
 const s=result.inputs;
 const stable=JSON.stringify({ref:result.referenceId,frame:references.frame.revision,motor:references.motor.revision,stack:references.stack.revision,...s});
 let h=2166136261;for(let i=0;i<stable.length;i++){h^=stable.charCodeAt(i);h=Math.imul(h,16777619)}return `AF-${(h>>>0).toString(16).padStart(8,'0')}`;
}
export function simulationContract(result){
 const required={mass_kg:result.inputs.massMeasuredG===null?null:result.inputs.massMeasuredG/1000,
  inertia_kg_m2:{ixx:null,iyy:null,izz:null,ixy:null,ixz:null,iyz:null},
  rotor_coordinates_m:result.inputs.rotorCoordinatesVerified?result.layout.coords.map(p=>({x:p.x/1000,y:p.y/1000,z:null})):null,
  motor_thrust_coefficient:null,motor_moment_coefficient:null,motor_time_constant_up_s:null,motor_time_constant_down_s:null,
  propeller_direction_each:null,drag_coefficients:null,flight_controller_target:null};
 return {schema:'aeroforge-px4-gazebo-handoff/v0.3',revision:referenceRevision(result),status:'BLOCKED_MISSING_CALIBRATION',
  readyForSITL:false,simulationEnvironment:'PX4 Gazebo (proposed)',required,
  openIssues:result.issues.filter(i=>i.severity==='BLOCKER'||i.severity==='HOLD').map(x=>x.id),
  caution:'NOT a runnable SDF or a calibrated model. Values that have not been measured remain null.'};
}
export const assemblyStages=[
 {id:'source',title:'01 · Source evidence',steps:['Freeze exact frame, motor, prop, ESC/FC, battery, radio/video SKU revisions','Download the Source Two v0.1 CAD directly from upstream, preserving GPL terms','Inspect manufacturer mechanical drawings and dimensional interfaces','Replace the discontinued FC/ESC with an available specified assembly']},
 {id:'geometry',title:'02 · Mechanical qualification',steps:['Import actual frame STEP and identify each of four motor shaft centers','Inspect clearance volumes for props, battery, stack, camera, wiring and antenna','Check every motor screw length against mounting-plate depth and winding clearance','Weigh components and determine assembled center of gravity and mass properties']},
 {id:'electrical',title:'03 · Unpowered build & electrical',steps:['Assemble frame without propellers and check fastening/stack isolation','Derive connector-specific schematic from current FC/ESC/BEC and VTX manuals','Double-check polarity, continuity, fused protections and correct charger/LiPo handling','Props-off initial power-up through current-limited protective equipment']},
 {id:'firmware',title:'04 · Firmware and test evidence',steps:['Verify exact firmware target, motor ordering, spin directions and sensor alignment props-off','Configure and test RX link-loss, arming interlock and low-voltage response props-off','Record revision-scoped ESC and propulsion tests in controlled fixture','Build/calibrate PX4 SITL ONLY after required measured inertial/actuator parameters exist']},
 {id:'flight',title:'05 · Independent approval & staged flight',steps:['Verify TRUST/registration/Remote ID and airspace suitability for the actual mission','Obtain an experienced independent inspection before any prop-on tests','Perform controlled first flight at appropriate authorized site and log findings','Review logs and close discrepancies before increasing flight envelope']}
];
export function assemblyPacket(result){
 const rev=referenceRevision(result);
 const lines=[`# AeroForge engineering assembly packet`, ``, `Design revision: ${rev}`, `Status: ${result.status}; ${result.readiness}`, `Frame: ${references.frame.sku}`,`Motors: 4× ${references.motor.sku}`,`Prop: 4× ${references.prop.sku}`,`Reference stack: ${references.stack.sku} (DISCONTINUED; must replace)`, `Battery: ${result.inputs.batterySku||'UNSPECIFIED'}`,``, `## Evidence blockers / holds`,...result.issues.map(i=>`- **${i.severity} ${i.id}:** ${i.summary}. Next: ${i.action}`),``, `## Sequence`];
 for(const stage of assemblyStages){lines.push(``,`### ${stage.title}`,...stage.steps.map(x=>`- [ ] ${x}`))}
 lines.push(``,`## Reference sources`,...referenceSources.map(s=>`- ${s.id}: ${s.url}`),``,`> The packet is a planning checklist, NOT assembly approval, a wiring diagram, or an operating permit.`);return lines.join('\n');
}
