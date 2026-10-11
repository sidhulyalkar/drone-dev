/** v0.5 programs are architecture studies, not purchased BOMs or aircraft certifications. */
const freeze = Object.freeze;
export const programs = freeze({
  px4_explorer: freeze({
    id:'px4_explorer',name:'Atlas / PX4 Explorer',class:'Autonomous research / modular sensing',
    target:'PX4',frame:'Larger 450–550 mm-class quadrotor; exact frame SKU OPEN',
    targetPayloadG:250,goalMinutes:15,
    needs:['Documented PX4-compatible autopilot and board target','Measured frame motor/propeller geometry','Dedicated ESCs or documented compatible power train','Battery and power distribution with checked ratings','GNSS/compass and tested loss-of-link behavior','Measured payload mount and interference','Ground link and optional companion compute','Mass/inertia and actuator calibration'],
    source:['https://docs.px4.io/main/en/config/actuators','https://docs.px4.io/main/en/sim_gazebo_gz/'],
    blockers:['No qualified frame SKU','No qualified PX4 FC + output topology','No qualified ESC/pack/power distribution','No measured flight model','No physical or ground-link tests']
  }),
  fpv_reference:freeze({
    id:'fpv_reference',name:'Source Two / FPV Benchmark',class:'Mechanical and propulsion calibration reference',
    target:'Research benchmark; existing stack uses Betaflight',frame:'TBS Source Two v0.1 · source CAD exists upstream',
    targetPayloadG:0,goalMinutes:null,
    needs:['Import/verify upstream GPL-3.0 STEP','Register assembled rotor shaft centers','Identify currently obtainable flight stack','Measure propulsion and physical mass properties','Verify pack, connector, RX, video and failsafes'],
    source:['https://github.com/ps915/source_two','https://store.tmotor.com/product/v2207-v2-fpv-motor.html'],
    blockers:['Upstream STEP not yet imported or registered','No available and qualified flight stack','Current Betaflight stack is NOT a PX4 hardware target','Payload and ground systems not qualified']
  })
});
function integer(n,lo,hi){return Number.isInteger(n)&&n>=lo&&n<=hi;}
export function programPlan(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Program input must be an object');
 const {program='px4_explorer',payloadG=200,budgetUSD=1200,prioritize='sensing'}=input;
 if(!Object.hasOwn(programs,program))throw Error('Unknown program');
 if(!integer(payloadG,0,3000)||!integer(budgetUSD,0,25000)||!['sensing','duration','agility','cost'].includes(prioritize))throw Error('Invalid mission requirement');
 const p=programs[program];
 const warnings=[];
 if(program==='fpv_reference'&&payloadG>150)warnings.push('Source Two reference is not an evidence-qualified carrier for this payload.');
 if(program==='px4_explorer'&&payloadG>p.targetPayloadG)warnings.push('Payload exceeds unverified planning target. Recompute propulsion after selecting a real frame.');
 if(budgetUSD<750)warnings.push('Startup budget may be insufficient for a PX4-class research quadrotor plus ground equipment; current SKU pricing is not qualified.');
 const milestones=[
  {id:'sources',title:'Specify real hardware',gate:'BLOCKED',why:'Part identities, available listings and manufacturer manuals incomplete'},
  {id:'geometry',title:'Register physical CAD',gate:'BLOCKED',why:'No verified assembled rotor positions and component clearance meshes'},
  {id:'electrical',title:'Power / control interface audit',gate:'BLOCKED',why:'Unqualified wiring, telemetry, ESC and failure states'},
  {id:'model',title:'Calibrate simulation',gate:'BLOCKED',why:'Measured inertia, thrust / moment, motor dynamics and aero effects unavailable'},
  {id:'assembly',title:'Revision-locked build packet',gate:'BLOCKED',why:'Hardware and source evidence not complete'},
  {id:'flight',title:'Independent field qualification',gate:'BLOCKED',why:'No built machine, physical inspection or flight-test logs'}
 ];
 return {schema:'aeroforge/program-plan/v0.5',program:p.id,mission:{payloadG,budgetUSD,prioritize},class:p.class,airframe:p.frame,autopilot:p.target,
  requirements:[...p.needs],warnings,holds:[...p.blockers],milestones,release:'NOT PROCURE-READY / NOT FLIGHT QUALIFIED',sources:[...p.source]};
}
