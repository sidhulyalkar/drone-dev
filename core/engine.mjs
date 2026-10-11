import {getPart,commonItems} from './catalog.mjs';
import {getGroundKit} from './ground.mjs';
export const findParts = settings => Object.fromEntries(Object.entries({frame:'frames',motor:'motors',stack:'stacks',battery:'batteries',prop:'props',video:'video'}).map(([key,type])=>[key,getPart(type,settings[key])]));
const round=(n,d=1)=>Number(n.toFixed(d));
const missionFactor={freestyle:1.9,cinematic:1.3,explore:1.34,research:1.4};
function finding(code,level,message,why,category='evidence',action='Record revision-specific evidence and re-evaluate.'){
 return {code,level,message,why,category,action};
}
function assertSettings(settings){
 if(!settings||typeof settings!=='object')throw new Error('Missing design settings');
 if(Object.keys(settings).length>40)throw new Error('Unexpected configuration object');
 const payload=Number(settings.payload??0);
 if(!Number.isFinite(payload)||payload<0||payload>400)throw new Error('Payload must be between 0 and 400 g');
 if(!Object.hasOwn(missionFactor,settings.mission))throw new Error('Unknown flight mission');
 if(!getGroundKit(settings.groundKit||'none'))throw new Error('Unknown ground kit');
 return payload;
}
function estimate({mass,prop,battery,video,mission,hoverEfficiency=.42,usableFraction=.75}){
 const radius=prop.size*0.0254/2;
 const rotorArea=4*Math.PI*radius*radius;
 const idealHoverPower=Math.pow(mass/1000*9.80665,1.5)/Math.sqrt(2*1.225*rotorArea);
 const hoverPower=idealHoverPower/hoverEfficiency+video.watts+6;
 const averagePower=hoverPower*missionFactor[mission];
 const energyWh=battery.cells*3.7*battery.capacity/1000;
 return {flightMin:60*energyWh*usableFraction/averagePower,hoverPower,averagePower,energyWh,rotorArea};
}
export function evaluate(input){
 const payload=assertSettings(input);
 const settings={...input,payload,groundKit:input.groundKit||'none'};
 const parts=findParts(settings);
 if(Object.values(parts).some(v=>!v))throw new Error('Unknown catalog selection');
 const {frame,motor,stack,battery,prop,video}=parts;
 const kit=getGroundKit(settings.groundKit);
 const items=[
  {slot:'Frame',name:frame.name,quantity:1,unitPrice:frame.price,mass:frame.mass,evidence:'illustrative'},
  {slot:'Motors',name:motor.name,quantity:4,unitPrice:motor.price,mass:motor.mass*4,evidence:'illustrative'},
  {slot:'Flight controller + ESC',name:stack.name,quantity:1,unitPrice:stack.price,mass:stack.mass,evidence:'illustrative'},
  {slot:'Battery',name:battery.name,quantity:1,unitPrice:battery.price,mass:battery.mass,evidence:'illustrative'},
  {slot:'Propellers',name:prop.name,quantity:4,unitPrice:prop.price/4,mass:prop.mass*4,evidence:'illustrative'},
  {slot:'Camera / video',name:video.name,quantity:1,unitPrice:video.price,mass:video.mass,evidence:'illustrative'},
  ...commonItems.filter(x=>!x.ground).map(x=>({slot:'Essentials',name:x.name,quantity:1,unitPrice:x.price,mass:x.mass,evidence:'illustrative'}))
 ];
 const benchItems=commonItems.filter(x=>x.ground).map(x=>({name:x.name,price:x.price}));
 const groundItems=[...benchItems,...kit.items];
 const mass=items.reduce((n,p)=>n+p.mass,0)+payload;
 const airframeUSD=items.reduce((n,p)=>n+p.quantity*p.unitPrice,0);
 const groundUSD=groundItems.reduce((n,p)=>n+p.price,0);
 const totalUSD=airframeUSD+groundUSD;
 const thrustRatio=motor.maxThrust*4/mass;
 const nominal=estimate({mass,prop,battery,video,mission:settings.mission});
 // Deliberately broad, NOT probabilistic bounds or validated predictions.
 const low=estimate({mass,prop,battery,video,mission:settings.mission,hoverEfficiency:.30,usableFraction:.65});
 const high=estimate({mass,prop,battery,video,mission:settings.mission,hoverEfficiency:.55,usableFraction:.82});
 const propGap=frame.wheelbase/Math.SQRT2-prop.size*25.4;
 const findings=[];
 if(prop.size>frame.size+1e-9)findings.push(finding('PROP_ENVELOPE','blocked',`${prop.size}″ props exceed ${frame.size}″ frame limit`,'Propeller tips may strike frame elements.','mechanical','Choose a smaller propeller or an airframe with verified clearance.'));
 if(!frame.protected&&propGap<10)findings.push(finding('PROP_SPACING','blocked',`Adjacent rotors have only ${round(propGap)} mm calculated tip clearance`,'Symmetric X layout assumes the wheelbase is the diagonal motor separation; target here is 10 mm minimum.','mechanical','Measure actual motor centers and swept propeller envelope.'));
 if(frame.protected)findings.push(finding('DUCT_CLEARANCE','measure','Guard/duct-to-prop clearance is not geometrically verified','Nominal prop diameter alone does not guarantee clearance inside ducts.','mechanical','Measure inside-duct diameter and concentricity.'));
 if(prop.size<motor.propRange[0]||prop.size>motor.propRange[1])findings.push(finding('MOTOR_PROP','blocked',`Propeller diameter outside motor screening range (${motor.propRange.join('–')}″)`,'Manufacturer-tested motor/propeller pairing is required.','propulsion','Find thrust/current curves for this exact combination.'));
 if(!motor.cells.includes(battery.cells))findings.push(finding('MOTOR_CELLS','blocked',`Motor ${motor.kv}KV not screened for ${battery.cells}S`,'Motor kV, voltage and propeller loading must be assessed together.','electrical','Use a documented motor/propeller/battery combination.'));
 if(!stack.cells.includes(battery.cells))findings.push(finding('STACK_CELLS','blocked',`Flight stack not screened for ${battery.cells}S`,'Verify ESC, flight-controller and regulator absolute maximum ratings.','electrical','Select a compatible stack or battery.'));
 if(!frame.motorMount.includes(motor.mount))findings.push(finding('MOTOR_MOUNT','blocked',`${motor.mount}×${motor.mount} mm motor hole pattern does not match frame`,'Motor bolt circle and fastener depth need manufacturer drawings.','mechanical','Find matching arm/motor drawings.'));
 if(frame.mount!==stack.mount)findings.push(finding('STACK_MOUNT','blocked',`${stack.mount} mm stack does not fit ${frame.mount} mm frame pattern`,'Mounting hole centers are incompatible without engineered adapters.','mechanical','Choose matching stack pattern.'));
 if(stack.escA<motor.maxCurrent*1.15)findings.push(finding('ESC_MARGIN','warning','ESC current headroom is below the 15% planning target','Motor maximum-current placeholders require exact prop and voltage test data and thermal derating.','electrical','Verify per-motor test curves, ESC operating conditions and cooling.'));
 if(!stack.bec.includes(video.voltage))findings.push(finding('VIDEO_BEC','blocked',`No listed ${video.voltage} V BEC rail for video equipment`,'The video load needs a documented regulated rail with adequate current.','electrical','Select a rated regulator or a compatible video system.'));
 if(video.cameraWidth>frame.cameraWidth)findings.push(finding('CAMERA_FIT','blocked',`${video.cameraWidth} mm camera exceeds ${frame.cameraWidth} mm frame mount`,'A custom mount would need its own validation.','mechanical','Confirm camera geometry and add a verified mount.'));
 if(thrustRatio<2)findings.push(finding('THRUST_MARGIN','blocked','Placeholder thrust-to-weight below 2:1','Available thrust comes from synthetic catalog values, not physical measurement.','propulsion','Test exact motor/prop performance and reduce weight if needed.'));
 else if(thrustRatio<3)findings.push(finding('THRUST_MARGIN','warning','Limited nominal thrust reserve for aggressive flight','Voltage sag, altitude, handling demands and temperature are not represented.','propulsion','Validate reserve at realistic battery voltage.'));
 if(payload>0)findings.push(finding('PAYLOAD','measure',`${payload} g payload needs verified mounting and center of gravity`,'No structural loads, support brackets or rotational inertia model.','mechanical','Create payload CAD with actual mass locations.'));
 if(kit.video&&!kit.video.includes(settings.video))findings.push(finding('GROUND_VIDEO','warning','Ground video kit may not receive the selected air system','Digital systems are not mutually interoperable; analog and digital equipment differ.','operations','Choose a matching ground receiver/display and confirm model-specific compatibility.'));
 if(!kit.video) findings.push(finding('GROUND_EQUIPMENT','measure','Existing ground equipment has not been specified','Transmitter protocol, video link, battery charger and safety accessories need confirmation.','operations','Document equipment with manufacturer SKUs.'));
 if(mass>=250)findings.push(finding('REMOTE_ID','regulatory','At least 250 g estimated: FAA registration and Remote ID review needed','U.S. recreational registration generally applies at 250 g or above; registered drones generally need Remote ID, subject to exceptions.','regulatory','Review FAA rules and airspace for the intended operation.'));
 else findings.push(finding('MASS_250','regulatory','Sub-250 g estimate: verify final mass and intended flight category','Registration exemption is limited to qualifying recreational flights; TRUST and operating rules still apply.','regulatory','Weigh the ready-to-fly aircraft and review FAA guidance.'));
 findings.push(finding('MANUFACTURER_EVIDENCE','measure','No selected airframe components have manufacturer-verified SKUs','All current airframe catalog entries use illustrative engineering placeholders.','evidence','Confirm vendor, exact part number, revisions, data sheets and checkout links.'));
 findings.push(finding('FLIGHT_DATA','measure','Hover-time range is assumption sensitivity, not a prediction interval','Efficiency, battery usable fraction, aerodynamic drag, flight control and pack voltage sag are not measured.','evidence','Record thrust-stand and hover logs, then fit a performance model.'));
 findings.push(finding('BATTERY_SAFETY','measure','Inspect battery charging, polarity and insulation before testing','Initial power-up must be props-off; LiPo handling and fire precautions are essential.','operations','Complete independent electrical inspection and staged bench tests.'));
 const blockers=findings.filter(x=>x.level==='blocked');
 const warnings=findings.filter(x=>x.level==='warning');
 const status=blockers.length?'BLOCKED':warnings.length?'REVIEW':'CONCEPT';
 return {settings,parts,items,groundItems,metrics:{
   massG:round(mass,0),budgetUSD:round(airframeUSD,0),groundUSD:round(groundUSD,0),startupUSD:round(totalUSD,0),
   thrustRatio:round(thrustRatio,2),flightMin:round(nominal.flightMin,1),flightLowMin:round(low.flightMin,1),flightHighMin:round(high.flightMin,1),
   hoverW:round(nominal.hoverPower,0),batteryWh:round(nominal.energyWh,1),estPowerW:round(nominal.averagePower,0),diskCm2:round(nominal.rotorArea*10000,0),
   tipGapMm:round(propGap,1)
 },findings,status,blockers,warnings,meta:{model:'screening-v0.2',catalog:'illustrative-v0.1',evidence:'UNVERIFIED_ESTIMATES',assumedAirDensity:1.225,hoverEfficiency:.42,usableEnergyFraction:.75,flightRange:{low:{hoverEfficiency:.30,usableFraction:.65},high:{hoverEfficiency:.55,usableFraction:.82}},physicalReadiness:'NOT_VERIFIED'}};
}
export function getSensitivity(result,points=[0,50,100,150,200,300]){
 return points.map(extra=>{
  const mass=result.metrics.massG+extra;
  const {flightMin}=estimate({mass,prop:result.parts.prop,battery:result.parts.battery,video:result.parts.video,mission:result.settings.mission});
  return {extraG:extra,massG:mass,minutes:round(flightMin,1),thrustRatio:round(result.parts.motor.maxThrust*4/mass,2)};
 });
}
export function toPortableJSON(result){
 return JSON.stringify({schema:'aeroforge-design/v0.2',created:new Date().toISOString(),settings:result.settings,metrics:result.metrics,status:result.status,findings:result.findings,bom:{airframe:result.items,ground:result.groundItems},assumptions:result.meta},null,2);
}
