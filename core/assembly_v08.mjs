/**
 * AeroForge v0.8 Assembly Copilot: original workflow text and revision-aware evidence.
 * Authoring source references are learning links, not a license to copy video content.
 * No browser input or self-attestation may qualify a real aircraft for power or flight.
 */
export const ASSEMBLY_SCHEMA='aeroforge/assembly-session/v0.8';
export const TRACKS=Object.freeze(['fpv','px4']);
export const VIDEO_SYSTEMS=Object.freeze(['analog','dji-o3','walksnail','unspecified']);
const youtube=(id,time=0)=>'https://www.youtube.com/watch?v='+id+(time?'&t='+time+'s':'');
const PX4_X500='https://docs.px4.io/main/en/frames_multicopter/holybro_x500v2_pixhawk6c';
const PX4_ACT='https://docs.px4.io/main/en/config/actuators';
const PX4_GAZEBO='https://docs.px4.io/main/en/sim_gazebo_gz/vehicles';
const bf='https://betaflight.com/docs/wiki/guides/current/Getting-Started';
const safety=['polarity','powered','actuator','failsafe','flight'];
const step=(id,stage,title,about,parts,requires,depends,opts={})=>({
 id,stage,title,about,parts,requires,depends,
 gate:opts.gate||'planning',
 tools:opts.tools||[],
 expect:opts.expect||'Record what you observed and cite the actual hardware revision.',
 checks:opts.checks||[],
 source:opts.source||null,
 warning:opts.warning||'Illustrative training step. Confirm exact hardware manufacturer instructions.',
 troubleshoot:opts.troubleshoot||'Stop and record the mismatch. Compare the component marking and its revision-specific manufacturer manual.',
 templateVersion:2
});
function common(){
 return [
 step('inventory','A · Identify','Inventory delivered parts','Record exact model markings, quantities and purchased revisions before fitting anything.',['frame','motor-0','stack','battery'],[],['frame','motor','stack','battery','video','variant','power'],{tools:['Camera','Parts tray'],checks:['Count four motors and matching props','List missing separately purchased equipment'],expect:'Exact SKU/revision list, including non-kit radio, battery, charger and video equipment.'}),
 step('dryfit','B · Dry fit','Map geometry and service access','Inspect frame, stack height, USB access, antenna clearance and fastener engagement without wiring or power.',['frame','canopy','stack','motor-0'],['inventory'],['frame','motor','stack','prop','variant'],{tools:['Caliper','Correct manufacturer hex drivers'],checks:['Check motor screw penetration with motor winding clearance','Check conductive carbon insulation','Confirm no cable exit is pinched'],source:{label:'FPV assembly overview, educational reference',url:youtube('vQKXGVMLVYU',388)}}),
 step('frame','C · Structure','Assemble frame and standoffs','Follow the current frame revision manual, dry-fit before applying any fastener locking compound.',['frame','canopy'],['dryfit'],['frame'],{tools:['Metric drivers','Frame manual'],checks:['Confirm correct arm orientation','Confirm stand-off lengths and fastener specifications']}),
 step('motors','C · Propulsion','Mount motors, props OFF','Keep propellers away from motors while assembling and inspecting fasteners.',['motor-0','motor-1','motor-2','motor-3'],['frame'],['frame','motor','prop'],{tools:['Manufacturer-specified motor screws','Hex driver'],checks:['Verify no screws contact stator windings','Inspect all four motor mounts'],source:{label:'Motor installation reference',url:youtube('vQKXGVMLVYU',388)}}),
 step('stack','D · Electronics','Install controller and ESC stack','Inspect the board mount, insulating hardware, vibration isolation and access to connectors.',['stack','pdb','esc-0'],['frame'],['frame','stack','variant','power'],{tools:['Insulating standoffs','Manufacturer pinout'],checks:['No PCB contacts conductive frame','Verify mounting hole spacing','Validate connector mating and board orientation'],source:{label:'ESC and FC installation reference',url:youtube('vQKXGVMLVYU',638)}}),
 step('power-routing','E · Wiring','Route power and signal leads','Only use pin-to-pin wiring verified from the actual component revisions. This view does not invent pad assignments.',['battery','pdb','harness','stack'],['stack','motors'],['battery','stack','variant','power'],{tools:['Exact pinout manuals','Multimeter'],gate:'polarity',checks:['Power module matches selected FC family','Insulate solder joints and prevent strain','Do not connect battery during unpowered inspection'],source:{label:'Continuity and first-power safety',url:youtube('9jALj0GPmww',97)}}),
 step('unpowered-qa','F · Safety','Document unpowered electrical inspection','With power disconnected and propellers removed, record the independent continuity/polarity inspection and which instrument was used.',['pdb','harness','battery','stack'],['power-routing'],['battery','stack','variant','power'],{tools:['Calibrated multimeter','Manufacturer schematic'],gate:'polarity',checks:['Record actual XT60 polarity and continuity readings','Check unintended shorts, isolation and protection','Identify qualified reviewer; a user note is not independent signoff'],source:{label:'Continuity and smoke check reference',url:youtube('9jALj0GPmww',97)},warning:'STOP before energizing. A completed online note is not an electrical safety pass.'}),
 step('controlled-power','G · Power','Initial protected power and software identification','Only with appropriate supervision, equipment and manufacturer procedures. AeroForge cannot operate hardware or authorize energization.',['pdb','stack','battery'],['unpowered-qa'],['battery','stack','variant','power'],{gate:'powered',tools:['Appropriate protected bench equipment','Manufacturer manual'],checks:['Unpowered review signed outside AeroForge','Record observed board identification and firmware target'],warning:'HARD HOLD: This application cannot validate the required pre-power inspections or authorize power-on.'}),
 step('finish','J · Retention','Mechanical finishing and retention','Check straps, wires, antenna protection, battery lead protection and payload restraints.',['canopy','battery','antenna','harness'],['motors','stack'],['frame','battery','video','prop'],{checks:['Battery retention does not obstruct propellers','Cable and antenna exits have strain relief','No loose fasteners or exposed conductors'],source:{label:'Battery and final assembly reference',url:youtube('uFHVA_qM3uw')}}),
 step('flight-review','K · Readiness','External flight-readiness review','Document firmware configuration, RC failsafe, airspace, RF rules, appropriate training and an independent inspection.',['frame','battery','prop-0','antenna'],['controlled-power','finish'],['battery','motor','prop','stack','video','variant','power','receiver','radio'],{gate:'flight',checks:['Independent hardware signoff and documented flight-safety procedures','Local regulation, registration, airspace and RF review','Simulator practice and controlled test plan'],source:{label:'First-flight review reference',url:youtube('mS-fJGWN8s0')},warning:'No online completion state or simulation grants flight authority.'})
 ];
}
function fpv(video){
 const shared=common();
 const source={analog:youtube('yIcRf_xSujc'),'dji-o3':youtube('kinmxuOnoUM'),walksnail:youtube('5PWL68Y1Fvs')};
 const title={analog:'Analog camera and VTX','dji-o3':'DJI O3 air unit',walksnail:'Walksnail digital video',unspecified:'Undecided video system'};
 const vi=step('fpv-video','E · Video',title[video]+' wiring and mount',
  video==='unspecified'?'Select a real video-system family and exact unit revision before wiring.':
  'Use the selected video-system manuals for power, signaling, antenna connection and mounting. Do not transplant pinouts across manufacturers.',
  ['camera','antenna','stack'],['stack'],['video','stack'],{
   checks:['Select exact video-system revision','Confirm power and signal pins against source','Verify antenna system before powered checks'],
   source:source[video]?{label:'Bardwell '+video+' video installation, educational reference',url:source[video]}:null,
   gate:video==='unspecified'?'review':'planning',
   warning:video==='unspecified'?'Video family unresolved. Do not wire an unselected VTX.':'Video-system wiring is revision dependent, and the 3D wires are schematic.'});
 const radio=step('fpv-receiver','H · Radio','Bind and configure receiver','Binding a receiver and mapping channels in Betaflight are separate checks.',['antenna','stack'],['stack'],['stack','receiver','radio'],{checks:['Confirm receiver protocol and powered voltage','Record bind procedure and receiver firmware','Verify channel mapping and failsafe with actual controller'],source:{label:'ELRS binding and verification reference',url:youtube('Dz7bdXWKC1Q')}});
 const config=step('betaflight-config','H · Firmware','Betaflight ports, channels and modes','Confirm an actual Betaflight-compatible FC firmware target. Do not apply these settings to PX4.',['stack','motor-0','antenna'],['fpv-receiver','fpv-video'],['stack','receiver','radio','video'],{checks:['Confirm board target and backup configuration','Inspect UART and serial receiver mapping','Verify channel endpoints, switches and flight modes'],source:{label:'Betaflight receiver channel configuration',url:youtube('EDnQEep2X4I')}});
 const actuator=step('fpv-motors','I · Actuation','Motor order and direction audit (props OFF)','Verify motor assignments/direction using manufacturer and current Betaflight documentation under controlled conditions.',['motor-0','motor-1','motor-2','motor-3','stack'],['controlled-power','betaflight-config'],['stack','motor','prop'],{gate:'actuator',checks:['Confirm propellers physically removed','Verify mapping and recorded motor direction','Document ESC protocol and failsafe'],source:{label:'Betaflight motor mapping reference',url:youtube('CBZxFdJUFRg')},warning:'Controlled motor testing requires external supervision; this software never authorizes spin-up.'});
 return [...shared.slice(0,5),vi,...shared.slice(5,8),radio,config,actuator,...shared.slice(8)];
}
function px4(variant){
 const shared=common().map(s=>s.id==='flight-review'?{
  ...s,source:{label:'PX4 flight-readiness and X500 documentation',url:PX4_X500},
  warning:'PX4-specific human flight-readiness review required. Generic FPV video procedures do not apply.'
 }:s.id==='power-routing'?{
  ...s,source:{label:'Holybro X500 controller and power-module documentation',url:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2'}
 }:s);
 const gnss=step('px4-sensors','E · Navigation','Mount GNSS and telemetry','Choose real GNSS, telemetry frequency, companion computer and exact flight-controller interfaces. The X500 documentation varies by kit revision.',['antenna','camera','stack'],['stack'],['variant','stack','power'],{checks:['Record exact M8N/M10 delivery variant','Confirm country-correct telemetry frequency','Check GNSS arrow and placement'],source:{label:'Holybro X500 V2 kit documentation',url:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2'}});
 const control=step('px4-qgc','H · Firmware','PX4 / QGroundControl configuration','Use QGroundControl to record the tested PX4 firmware target, selected X500 airframe and sensor calibration results. Do not use Betaflight instructions.',['stack','antenna'],['px4-sensors','controlled-power'],['variant','power','stack','battery'],{checks:['Match '+(variant==='six_x'?'Pixhawk 6X':'Pixhawk 6C')+' and power-module pinout','Record firmware hash/version and airframe choice','Document compass, accelerometer and radio setup'],source:{label:'PX4 Holybro X500 V2 guide',url:PX4_X500}});
 const actuators=step('px4-actuators','I · Actuation','PX4 actuator and failsafe mapping','Use the actual output wiring and current PX4 actuator setup. Do not copy Betaflight motor order.',['motor-0','motor-1','motor-2','motor-3','stack'],['px4-qgc','controlled-power'],['variant','stack','motor','prop'],{gate:'actuator',checks:['Remove all propellers before any controlled motor tests','Verify output assignment and rotation under qualified review','Record failure modes and recovery behaviors'],source:{label:'PX4 actuator configuration',url:PX4_ACT}});
 const sim=step('px4-sitl','I · Simulation','Simulate the generic PX4 X500 baseline','The upstream Gazebo X500 is not calibrated to the actual Holybro airframe, mass properties or propulsion.',['frame','motor-0','stack'],['px4-qgc'],['variant','frame','motor','battery'],{checks:['Run supported generic simulation on an external PX4 system','Record software version and test logs','Do not treat simulation as proof of real aircraft safety'],source:{label:'PX4 Gazebo supported vehicle models',url:PX4_GAZEBO}});
 return [...shared.slice(0,5),gnss,...shared.slice(5,8),control,actuators,sim,...shared.slice(8)];
}
function cleanInput(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid plan configuration');
 const track=input.track??'fpv';
 if(!TRACKS.includes(track))throw Error('Unsupported flight architecture');
 const videoSystem=input.videoSystem??'unspecified';
 if(!VIDEO_SYSTEMS.includes(videoSystem))throw Error('Unsupported video system');
 const variant=input.variant??'six_c';
 if(!['six_c','six_x'].includes(variant))throw Error('Unknown Pixhawk variant');
 const selection=input.selection||{};
 if(!selection||typeof selection!=='object'||Array.isArray(selection))throw Error('Invalid component selection');
 const allowed=['frame','motor','prop','stack','battery','video','variant','power','receiver','radio','charger'];
 const parts={};
 for(const k of allowed){
  const v=selection[k]??'unresolved';
  if(typeof v!=='string'||v.length>150||!v.trim())throw Error('Invalid selection: '+k);
  parts[k]=v.trim();
 }
 if(track==='px4'){parts.variant=variant;parts.power=variant==='six_c'?'pm02v3':'pm02d';}
 return {track,videoSystem,variant,selection:parts};
}
const keyFor=(stepId,values)=>JSON.stringify([stepId,values]);
/** Hash for display grouping only (non-cryptographic); never evidence integrity. */
function labelKey(str){let h=2166136261;for(const ch of str){h=Math.imul(h^ch.charCodeAt(0),16777619)}return(h>>>0).toString(16).padStart(8,'0');}
export function compileBuildPlan(input){
 const data=cleanInput(input);
 const steps=(data.track==='fpv'?fpv(data.videoSystem):px4(data.variant)).map(t=>{
 const dependents=Object.fromEntries(t.depends.map(k=>[k,data.selection[k]]));
 const extra=t.id==='fpv-video'?data.videoSystem:null;
 return {...t,dependencyKey:keyFor(t.id,[t.templateVersion,dependents,extra]),noteAuthority:'USER_REPORTED_NOT_VERIFIED'};
 });
 const ids=new Set(),positions=new Map();
 for(let i=0;i<steps.length;i++){const s=steps[i];
  if(ids.has(s.id))throw Error('Duplicate assembly step');ids.add(s.id);positions.set(s.id,i);
  for(const parent of s.requires)if(!positions.has(parent)||positions.get(parent)>=i)throw Error('Invalid assembly prerequisite '+parent+' at '+s.id);
 }
 const planIdentity=JSON.stringify([data.track,data.videoSystem,data.variant,data.selection]);
 return {schema:'aeroforge/assembly-plan/v0.8',key:labelKey(planIdentity),track:data.track,videoSystem:data.videoSystem,variant:data.variant,
  selection:data.selection,steps,
  modelAuthority:data.track==='px4'?'X500_REFERENCE_FAMILY_NOT_INSPECTED':'ILLUSTRATIVE_NOT_CAD_VERIFIED',
  flightReady:false,procurementReady:false,warning:'Training and work documentation only. A self-reported receipt is not a completed physical inspection.'};
}
export function newBuildSession(plan){
 if(plan?.schema!=='aeroforge/assembly-plan/v0.8')throw Error('Invalid plan');
 return {schema:ASSEMBLY_SCHEMA,planKey:plan.key,track:plan.track,createdAt:new Date().toISOString(),entries:{},invalidated:[],updateCount:0};
}
function assertSession(session,plan){
 if(session?.schema!==ASSEMBLY_SCHEMA||plan?.schema!=='aeroforge/assembly-plan/v0.8')throw Error('Invalid session/plan');
 if(session.planKey!==plan.key)throw Error('Session requires reconciliation for this design');
}
export function reconcileBuildSession(session,plan){
 if(session?.schema!==ASSEMBLY_SCHEMA||!session.entries||typeof session.entries!=='object'||Array.isArray(session.entries))throw Error('Invalid build session');
 if(plan?.schema!=='aeroforge/assembly-plan/v0.8')throw Error('Invalid target plan');
 const next={...session,planKey:plan.key,track:plan.track,entries:{},invalidated:[...(session.invalidated||[])].slice(-100)};
 for(const s of plan.steps){
  const old=session.entries[s.id];
  if(!old)continue;
  if(old.dependencyKey===s.dependencyKey&&old.track===plan.track){next.entries[s.id]=old;}
  else next.invalidated.push({stepId:s.id,reason:'PART_OR_TEMPLATE_REVISION_CHANGED',oldDependencyKey:old.dependencyKey,newDependencyKey:s.dependencyKey,oldRecord:old});
 }
 for(const [id,old] of Object.entries(session.entries))if(!plan.steps.some(s=>s.id===id))next.invalidated.push({stepId:id,reason:'STAGE_NO_LONGER_APPLICABLE',oldRecord:old});
 next.invalidated=next.invalidated.slice(-100);next.updateCount=(session.updateCount||0)+1;
 return next;
}
export function recordObservation(session,plan,id,evidence){
 assertSession(session,plan);
 const s=plan.steps.find(t=>t.id===id);if(!s)throw Error('Unknown build step');
 if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))throw Error('Invalid observation');
 const {note,kind='note',value=null,unit='',source='personal-notes'}=evidence;
 if(typeof note!=='string'||note.trim().length<8||note.length>1200)throw Error('Observation requires 8-1200 characters');
 if(!['note','measurement','source-reference','issue'].includes(kind))throw Error('Unsupported evidence kind');
 if(typeof source!=='string'||source.length>200)throw Error('Invalid observation source');
 if(typeof unit!=='string'||unit.length>20)throw Error('Invalid unit');
 if(kind==='measurement'&&(!Number.isFinite(value)||!unit))throw Error('Measurement needs finite value and unit');
 if(kind!=='measurement'&&value!==null)throw Error('Only measurements contain numeric values');
 const prev=session.entries[id],receipts=(prev?.receipts||[]);
 if(receipts.length>=20)throw Error('Too many observations; export session before continuing');
 const receipt={kind,note:note.trim(),value,unit,source:source.trim(),trust:'SELF_REPORTED_UNREVIEWED',
  recordedAt:new Date().toISOString(),stepId:id,dependencyKey:s.dependencyKey};
 return {...session,entries:{...session.entries,[id]:{track:plan.track,dependencyKey:s.dependencyKey,receipts:[...receipts,receipt]}},updateCount:session.updateCount+1};
}
export function stepStatus(session,plan,id){
 assertSession(session,plan);
 const s=plan.steps.find(t=>t.id===id);if(!s)throw Error('Unknown step');
 const prior=s.requires.filter(p=>!session.entries[p]?.receipts?.length);
 const entry=session.entries[id],recorded=entry?.dependencyKey===s.dependencyKey?entry.receipts.length:0;
 const blocker=prior.length?'PREREQUISITES_UNRECORDED':null;
 const status=blocker?'BLOCKED_DEPENDENCY':recorded?(s.gate==='planning'?'RECORD_NOT_VERIFICATION':'SAFETY_REVIEW_REQUIRED'):'NOT_STARTED';
 return {id,recorded,status,blocker,prerequisitesMissing:prior,gate:s.gate,
  independentlyVerified:false,releasedForPower:false,releasedForFlight:false};
}
export function sessionSummary(session,plan){
 assertSession(session,plan);
 const states=plan.steps.map(s=>stepStatus(session,plan,s.id));
 return {planKey:plan.key,total:states.length,withNotes:states.filter(s=>s.recorded>0).length,
  unresolvedSafetyGates:states.filter(s=>s.gate!=='planning').length,
  blockedByPrerequisites:states.filter(s=>s.blocker).length,
  invalidated:session.invalidated.length,airworthy:false,powerAuthorized:false,flightAuthorized:false};
}
export function buildPacket(session,plan){
 const q=sessionSummary(session,plan);
 const out=['# AeroForge assembly work record · v0.8','','Track: '+plan.track,'Plan key (not cryptographic): '+plan.key,
 'Geometry: '+plan.modelAuthority,'Observations: '+q.withNotes+'/'+q.total,'Invalidated records: '+q.invalidated,
 'Status: WORK IN PROGRESS / NOT QUALIFIED','','## Steps'];
 for(const s of plan.steps){const st=stepStatus(session,plan,s.id),entry=session.entries[s.id];out.push('### '+s.id+' · '+s.title,'Status: '+st.status,'Relevant part IDs: '+s.parts.join(', '),'Prerequisites: '+(s.requires.join(', ')||'None'),'Task: '+s.about,'Checks: '+s.checks.join('; '),'Tools: '+s.tools.join('; '));if(s.source)out.push('External learning source: '+s.source.url);for(const r of entry?.receipts||[])out.push('- ['+r.recordedAt+'] '+r.kind+' ('+r.trust+'): '+r.note+(r.kind==='measurement'?' '+r.value+' '+r.unit:''));out.push('');}
 out.push('## Invalidated prior work');for(const r of session.invalidated)out.push('- '+r.stepId+': '+r.reason);
 out.push('','**Do not treat any record as an electrical inspection certification, power-on approval or flight authorization.**','');
 return out.join('\n');
}
