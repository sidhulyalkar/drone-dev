/**
 * AeroForge v0.9 / Mission Architecture Studio.
 * Every module is an engineering CLASS, not a vendor SKU, calibrated model or purchasing link.
 * Mass, thrust, electrical, aerodynamic performance and regulatory eligibility remain unresolved.
 */
const TOP=['guarded-quad','quad','hex','vtol'];
const C=['airframe','autopilot','propulsion','navigation','imaging','sensing','compute','power','safety','comms','software','payload'];
const make=(id,name,category,opts={})=>Object.freeze({
 id,name,category,topologies:opts.topologies||TOP,requires:opts.requires||[],
 conflicts:opts.conflicts||[],interface:opts.interface||'REVISION_SPECIFIC_NOT_RESOLVED',
 designRole:opts.designRole||'Mission adaptation candidate',hold:opts.hold||'Physical placement, mass, wiring, thermal limits and SKU compatibility unverified.',
 stage:opts.stage||'CONCEPT_ONLY'
});
export const MODULE_CATEGORIES=Object.freeze(C);
export const TOPOLOGIES=Object.freeze(TOP);
export const MODULES=Object.freeze([
 make('cage-frame','Fully guarded micro airframe','airframe',{topologies:['guarded-quad'],designRole:'Enclosed small propellers for controlled indoor work',hold:'Propeller protection and human-contact testing are not validated.'}),
 make('folding-x','Serviceable foldable X-frame','airframe',{topologies:['quad'],designRole:'Portable outdoor aircraft for structured surveys'}),
 make('inspection-x','Stabilized inspection quad frame','airframe',{topologies:['quad'],designRole:'Camera clearance and standoff access'}),
 make('survey-hex','Redundant hexacopter frame','airframe',{topologies:['hex'],designRole:'Six-rotor survey and payload geometry',hold:'Motor-out controllability is not assured by rotor count alone.'}),
 make('vtol-wing','VTOL fixed-wing airframe','airframe',{topologies:['vtol'],designRole:'Large-area coverage with vertical takeoff',hold:'Transition, stall, trim, wing loads and flight characteristics require independent validation.'}),
 make('propulsion-4','Matched four-motor/ESC/prop set','propulsion',{topologies:['quad','guarded-quad'],designRole:'Rotor-matched four-motor propulsion',hold:'No measured thrust, ESC currents or swept-disk geometry.'}),
 make('propulsion-6','Matched six-motor/ESC/prop set','propulsion',{topologies:['hex'],designRole:'Six-motor propulsion architecture',hold:'No motor-out performance or measured electrical current envelope.'}),
 make('transition-actuation','VTOL hover and cruise actuators','propulsion',{topologies:['vtol'],designRole:'Lift-to-wing-borne transition',hold:'No validated mixing, transition model, airspeed or actuator authority.'}),
 make('flight-stack','PX4/ArduPilot-capable flight stack class','autopilot',{designRole:'Programmable autopilot reference, not a firmware-qualified SKU'}),
 make('vio-core','Visual inertial odometry','navigation',{requires:['companion'],interface:'camera+IMU+time sync',designRole:'GNSS-denied relative positioning',hold:'Feature texture, illumination, estimator drift and recovery require tests.'}),
 make('optical-flow','Downward optical-flow sensor','navigation',{interface:'flow+rangefinder',designRole:'Short-range ground-relative motion tracking',hold:'Requires surface texture, scale/range and tested estimator fusion.'}),
 make('rtk','RTK GNSS receiver pair','navigation',{topologies:['quad','hex','vtol'],interface:'GNSS corrections+serial',designRole:'Geotag survey images and improve positioning',hold:'Needs tested antenna geometry, corrections source and environmental validation.'}),
 make('geofence','Geofencing and flight-boundary monitor','safety',{topologies:['quad','hex','vtol'],designRole:'Operational boundary planning',hold:'Never substitutes for airspace compliance or human piloting.'}),
 make('depth-stereo','Stereo depth camera','sensing',{requires:['companion'],interface:'camera+time sync',designRole:'Near-field 3D mapping and obstacle perception',hold:'Blind regions, sunlight and accuracy are untested.'}),
 make('tof-range','Short-range ToF distance sensor','sensing',{designRole:'Near-ground and proximity distance sensing',hold:'Surface reflectivity, range and false returns unresolved.'}),
 make('micro-lidar','Compact scanning LiDAR','sensing',{requires:['companion'],interface:'Ethernet/serial class',designRole:'3D surface reconstruction',hold:'Rotating mounts, vibration, occlusion and power budget unverified.'}),
 make('rgb-mapping','Global-shutter RGB mapping camera class','imaging',{interface:'MAVLink Camera Protocol candidate',designRole:'Georeferenced still imagery',hold:'Camera trigger latency and lens calibration unresolved.'}),
 make('rgb-gimbal','3-axis stabilized inspection camera','imaging',{interface:'MAVLink Gimbal v2 candidate',designRole:'Inspection from a safe standoff',hold:'Gimbal control/EMI/mount dimensions not validated.'}),
 make('radiometric-thermal','Radiometric thermal camera class','imaging',{topologies:['quad','hex'],designRole:'Temperature anomaly surveys with calibrated radiometry',hold:'Sensor calibration, emissivity and solar loading interpretation unresolved.'}),
 make('multispectral','Multispectral vegetation camera','imaging',{topologies:['quad','hex','vtol'],designRole:'Vegetation reflectance imagery',hold:'Band response, illumination corrections and georegistration unverified.'}),
 make('light-panel','Reflectance calibration panel workflow','software',{requires:['multispectral'],designRole:'Field reflectance calibration reference',hold:'Panel measurement and camera-specific workflow unresolved.'}),
 make('privacy-redaction','On-device person/plate redaction','software',{requires:['companion'],designRole:'Reduce unnecessary personally identifiable imagery',hold:'Accuracy and irreversible-redaction guarantees not demonstrated.'}),
 make('offline-map','Offline terrain reconstruction software','software',{requires:['rgb-mapping'],designRole:'Build stitched imagery and surface maps',hold:'No validated geospatial accuracy or software-license audit.'}),
 make('defect-review','Human-in-loop anomaly annotation','software',{designRole:'Capture inspection candidates for expert review',hold:'An anomaly is not a confirmed defect or diagnosis.'}),
 make('companion','Companion compute board','compute',{designRole:'Edge processing and sensor recording',hold:'Power, cooling, mass and interface wiring not measured.'}),
 make('secure-logger','Encrypted removable data logger','compute',{designRole:'Offline evidence collection',hold:'No verified encryption/configuration, retention or recovery procedure.'}),
 make('pm25','PM2.5 particulate sensor class','sensing',{topologies:['quad','hex'],designRole:'Particulate screening along a supervised route',hold:'Prop wash, humidity and reference co-location can bias measurements.'}),
 make('air-inlet-boom','Remote air-sampling inlet boom','payload',{topologies:['quad','hex'],requires:['pm25'],designRole:'Reduce propwash contamination at sampled location',hold:'Airflow model, inlet loss, vibration and payload CG remain untested.'}),
 make('humidity-temp','Temperature/humidity sensor class','sensing',{designRole:'Environmental context for other sensor signals',hold:'Solar heating, rotor wash and enclosure bias require checks.'}),
 make('waterproof-housing','Weather-resistant enclosure concept','airframe',{topologies:['quad','hex'],designRole:'Protect electronics near spray and debris',hold:'No IP ingress rating, condensation or cooling validation.'}),
 make('emergency-stop','Independent emergency disarm control','safety',{designRole:'Human-controlled shutdown planning',hold:'Tested fail-safe architecture, receiver health and recovery logic missing.'}),
 make('prop-guards','Rotor guard retrofit class','safety',{topologies:['guarded-quad','quad'],designRole:'Reduce contact exposure, not eliminate injury',hold:'Mounting loads and guard performance not physically tested.'}),
 make('rid','Remote ID integration slot','comms',{topologies:['quad','hex','vtol'],designRole:'Document Remote ID path where required',hold:'No proven legal compliance or accepted device SKU.'}),
 make('telemetry','Telemetry and manual radio link','comms',{designRole:'Pilot control and status link',hold:'RF band, link budget, legal use and failsafe not evaluated.'}),
 make('ground-charger','Battery charger and field safety equipment','power',{designRole:'Safe battery operations and maintenance planning',hold:'Exact chemistry, charger, pack and electrical safety not selected.'}),
 make('smart-power','Smart battery monitor/power distribution','power',{designRole:'Estimate energy usage and power health',hold:'Unverified pack, current limits, connector pinout and redundancy.'}),
 make('parachute-class','Emergency recovery concept','safety',{topologies:['quad','hex','vtol'],designRole:'Risk-mitigation candidate subject to engineering review',hold:'May not be suitable or legally sufficient; deployment testing unperformed.'}),
 make('airspeed','Fixed-wing airspeed and pitot system','navigation',{topologies:['vtol'],designRole:'Stall and transition state estimation',hold:'Probe calibration, icing, static pressure and estimator fusion untested.'}),
 make('terrain-led','Task lighting and visual status lamps','payload',{topologies:['guarded-quad','quad','hex'],designRole:'Illuminate a controlled indoor or inspection subject',hold:'Glare, battery effects and human-facing lighting safety untested.'}),
 make('spare-props','Service kit and spare propellers','payload',{designRole:'Repairability and field maintenance planning',hold:'Part-number and hardware interchangeability unconfirmed.'}),
 make('collision-sensors','Multi-direction collision perception','sensing',{requires:['companion'],designRole:'Detect selected nearby obstacles, not guarantee avoidance',hold:'Coverage gaps, sensor degradation, controller behavior and latency untested.'})
]);
export const MODULE_BY_ID=Object.freeze(Object.fromEntries(MODULES.map(m=>[m.id,m])));
const scenario=(id,name,eyebrow,topology,environment,mission,modules,optional,holds,deliverable,baseline=null)=>Object.freeze({
 id,name,eyebrow,topology,environment,mission,modules,optional,holds,deliverable,baseline,geometryAuthority:'SCHEMATIC_ONLY_NOT_DIMENSIONED_CAD',qualification:'RESEARCH_CONCEPT_NOT_AIRWORTHY'
});
export const SCENARIOS=Object.freeze([
 scenario('indoor-inventory','Aisle Wisp','Indoor shelf and inventory inspection','guarded-quad','indoor','Document high shelves without ladders, in a controlled empty interior.',
 ['cage-frame','propulsion-4','flight-stack','companion','vio-core','optical-flow','tof-range','rgb-mapping','secure-logger','emergency-stop','prop-guards'],
 ['terrain-led','collision-sensors','privacy-redaction','ground-charger','spare-props'],
 ['GNSS-denied positioning drift and reflective aisle geometry','Guard contact risk and localization failure','Indoor property permission, people exclusion and safe operating envelope'],
 'Geotagged-by-local-map shelf imagery for human review; no inventory accuracy claim','pocket'),
 scenario('solar-roof','Solar Surveyor','Roof and solar-panel inspection','quad','outdoor','Document roof surfaces and solar-panel anomalies from appropriate standoff distances.',
 ['inspection-x','propulsion-4','flight-stack','rgb-gimbal','radiometric-thermal','rtk','companion','secure-logger','telemetry','geofence','emergency-stop'],
 ['tof-range','collision-sensors','defect-review','rid','privacy-redaction','ground-charger'],
 ['Radiometric emissivity, angle and solar-condition calibration','Property permission, power-line standoff and flying around structures','Commercial Part 107/Remote ID/airspace and privacy evaluation'],
 'Paired RGB/thermal image report with human anomaly review; not an electrical diagnosis','research'),
 scenario('air-sampler','Air Mosaic','Community air-quality observation','quad','outdoor','Investigate spatial particulate patterns with calibrated ground reference stations.',
 ['folding-x','propulsion-4','flight-stack','pm25','air-inlet-boom','humidity-temp','companion','secure-logger','telemetry','geofence','emergency-stop'],
 ['rtk','rid','smart-power','ground-charger','privacy-redaction'],
 ['Prop wash, sampling height and transport effects','EPA-style sensor collocation and correction with ground references','No health/regulatory claims from an uncalibrated airborne sensor'],
 'Exploratory particulate heatmap with uncertainty and co-location metadata','research'),
 scenario('garden-mapper','Garden Atlas','Garden and small-farm health mapping','quad','outdoor','Create repeatable vegetation maps for home gardens, orchards and community farms.',
 ['folding-x','propulsion-4','flight-stack','rgb-mapping','multispectral','light-panel','rtk','offline-map','telemetry','geofence','emergency-stop'],
 ['companion','secure-logger','humidity-temp','rid','ground-charger','spare-props'],
 ['Sun angle, reflectance panel workflow and spectral band calibration','Accurate image georegistration and plant/non-plant masking','Plant indices suggest variation, not disease or nutrient diagnosis'],
 'Multidate vegetation-index maps for a human gardener to interpret','endurance'),
 scenario('accessible-trails','Pathfinder Mapper','Park and trail-accessibility surveying','hex','outdoor','Survey trail surfaces and potential access barriers while avoiding occupied areas.',
 ['survey-hex','propulsion-6','flight-stack','micro-lidar','companion','rgb-mapping','rtk','privacy-redaction','offline-map','secure-logger','geofence','emergency-stop'],
 ['collision-sensors','parachute-class','rid','smart-power','spare-props'],
 ['Survey permission, sensitive locations and no overflight of bystanders','LiDAR occlusion, terrain geometry and absolute accuracy','Human access audit and accessibility standard required for any conclusions'],
 '3D trail surface map and candidate obstacles for trained accessibility assessors',null),
 scenario('habitat-vtol','Canopy Cartographer','Habitat restoration and land-cover mapping','vtol','outdoor','Map larger conservation sites with supervised vertical launch and efficient wing-borne cruise.',
 ['vtol-wing','transition-actuation','flight-stack','airspeed','rtk','rgb-mapping','multispectral','light-panel','offline-map','telemetry','geofence','emergency-stop'],
 ['secure-logger','smart-power','parachute-class','rid','ground-charger','spare-props'],
 ['Hover/cruise transition control and aerodynamic testing','Site/wildlife protections and habitat disturbance','Airspeed/stall margins and flight controller airframe support'],
 'Repeatable large-area land-cover layers for ecological review',null)
]);
export const SCENARIO_BY_ID=Object.freeze(Object.fromEntries(SCENARIOS.map(s=>[s.id,s])));
export function analyzeMission(id, additions=[]){
 const sc=SCENARIO_BY_ID[id];if(!sc)throw Error('Unknown scenario');
 if(!Array.isArray(additions)||additions.length>40)throw Error('Invalid optional module selections');
 const chosen=[];for(const moduleId of [...sc.modules,...additions]){
  if(typeof moduleId!=='string'||!MODULE_BY_ID[moduleId])throw Error('Unknown module '+String(moduleId));
  if(additions.includes(moduleId)&&!sc.optional.includes(moduleId)&&!sc.modules.includes(moduleId))throw Error('Module not offered by scenario '+moduleId);
  if(!chosen.includes(moduleId))chosen.push(moduleId);
 }
 const findings=[];const append=(severity,id,summary,next)=>findings.push({severity,id,summary,next});
 for(const id of chosen){
  const m=MODULE_BY_ID[id];
  if(!m.topologies.includes(sc.topology))append('BLOCK','topology:'+id,m.name+' does not list '+sc.topology+' as a supported *conceptual* topology.','Reconsider this module or choose an applicable aircraft architecture.');
  for(const require of m.requires)if(!chosen.includes(require))append('BLOCK','requires:'+id,m.name+' needs '+MODULE_BY_ID[require].name+'.','Add its prerequisite or remove this module.');
  for(const other of m.conflicts)if(chosen.includes(other))append('BLOCK','conflict:'+id,m.name+' conflicts with '+MODULE_BY_ID[other].name+'.','Select one module variant.');
  append('HOLD','evidence:'+id,m.hold,'Select an exact manufacturer SKU; verify measured mass, physical fit, interfaces and test evidence.');
 }
 if(sc.environment==='indoor'&&chosen.includes('rtk'))append('BLOCK','indoor-rtk','RTK GNSS is not a reliable indoor localization basis.','Use verified GNSS-denied sensing and human oversight.');
 if(sc.topology==='vtol'&&!chosen.includes('airspeed'))append('BLOCK','vtol-airspeed','Airspeed measurement is missing for VTOL model assumptions.','Plan a validated airspeed estimation approach.');
 for(const [i,hold] of sc.holds.entries())append('HOLD','mission:'+i,hold,'Design a scenario-specific qualification and measurement protocol.');
 append('HOLD','airspace','Outdoor operation needs pilot, airspace, location, Remote ID/registration and people-overflight review where applicable. Indoor operation still needs site authorization and a people-exclusion plan.','Consult current official regulations and perform human operational review.');
 append('HOLD','safety','No verified propulsion calibration, battery/ESC/current envelope, CG/inertia, motor mapping, communications failsafe or physical inspection.','Do not manufacture, energize or fly based on this concept.');
 const active=chosen.map(id=>MODULE_BY_ID[id]);
 const groups=MODULE_CATEGORIES.filter(cat=>active.some(m=>m.category===cat)).map(category=>({category,modules:active.filter(m=>m.category===category).map(m=>m.id)}));
 return {schema:'aeroforge/mission-architecture/v0.9',concept:sc,selectedIds:chosen,
  modules:active,groups,findings,counts:{modules:active.length,blocks:findings.filter(x=>x.severity==='BLOCK').length,
  holds:findings.filter(x=>x.severity==='HOLD').length},readiness:'CONCEPT_ONLY',
  priced:false,qualified:false,permittedToFly:false,geometryAuthority:sc.geometryAuthority,
  warning:'Module class recommendations only. No dimensioned CAD, priced BOM, measured thrust/runtime, inspected wiring or airworthiness evidence.'};
}
export function compareMissions(aId,bId,aExtras=[],bExtras=[]){
 const a=analyzeMission(aId,aExtras),b=analyzeMission(bId,bExtras);
 return {left:aId,right:bId,shared:a.selectedIds.filter(id=>b.selectedIds.includes(id)),
  onlyLeft:a.selectedIds.filter(id=>!b.selectedIds.includes(id)),
  onlyRight:b.selectedIds.filter(id=>!a.selectedIds.includes(id)),
  topologyDifference:a.concept.topology!==b.concept.topology,
  counts:{left:a.counts,right:b.counts},
  notice:'Differences compare proposed module classes, not validated physical aircraft or flight performance.'};
}
