/**
 * AeroForge v0.4 qualification graph.
 * Documented dimensions are NOT a qualified joint; sourced, measured and assumed are separate.
 * All outputs remain NOT FLIGHT QUALIFIED. Nothing here can authorize powered operation.
 */
import {evaluateReference,referenceRevision,references,simulationContract} from './reference_lab.mjs';

export const parts=Object.freeze({
 frame:{id:'tbs-source-two-v01',sku:references.frame.sku,revision:'v0.1',vendor:'Team BlackSheep / ps915',kind:'frame',url:references.frame.cad,availability:'UNKNOWN',evidence:'TBS-CAD',facts:{wheelbaseMm:220,frameMassG:72,stackPatternsMm:[20,30.5]},sourceQuality:'manufacturer-cad'},
 motor:{id:'tmotor-v2207v2-1750',sku:references.motor.sku,revision:'V2 / 1750KV',vendor:'T-Motor',kind:'motor',url:references.motor.url,availability:'UNKNOWN',evidence:'TMOTOR-MOTOR',facts:{cellsMin:5,cellsMax:6,maxTestCurrentA:34.11,shaftMm:4,massG:35.1},sourceQuality:'manufacturer-test'},
 prop:{id:'tmotor-t5143s-revision-unknown',sku:references.prop.sku,revision:'UNIDENTIFIED',vendor:'T-Motor',kind:'propeller',url:references.prop.url,availability:'UNKNOWN',evidence:'TMOTOR-PROP',facts:{diameterNominalIn:5.1},sourceQuality:'manufacturer-product-identifier'},
 stack:{id:'speedybee-f405v5-55a',sku:references.stack.sku,revision:'V5 / OX32 55A',vendor:'SpeedyBee',kind:'fc-esc',url:references.stack.url,availability:'DISCONTINUED',evidence:'SPEEDYBEE-STACK',facts:{cellsMin:3,cellsMax:6,continuousA:55,patternMm:30.5,massG:27.2,firmware:'Betaflight'},sourceQuality:'manufacturer-specification'},
 researchStack:{id:'iflight-blitz-f7-e55s',sku:'iFlight BLITZ F7 Stack (E55S 4-in-1)',revision:'BLITZ F7 V1.2 / E55S (seller listing)',vendor:'iFlight',kind:'fc-esc-research-lead',url:'https://iflight-rc.eu/en/products/blitz-f7-stack-e55s-4-in-1esc',availability:'OUT_OF_STOCK_AT_CHECKED_RETAILER',evidence:'IFLIGHT-RESEARCH',facts:{cellsMin:2,cellsMax:6,continuousA:55,patternMm:30.5,fcMassG:7.8,escMassG:14.7,firmware:'IFRC-IFLIGHT_BLITZ_F722 / Betaflight'},sourceQuality:'retailer-specification-not-independent-pinout-qualification'}
});
export const evidenceRegistry=Object.freeze({
 'TBS-CAD':{kind:'upstream-cad',url:parts.frame.url,revision:'source_two v0.1',status:'DOCUMENTED',license:'GPL-3.0',accessed:'2026-10-10'},
 'TBS-MAIN-DXF':{kind:'upstream-cad',url:'https://github.com/ps915/source_two/blob/master/S2_v0.1_main_plate_3mm.dxf',revision:'git blob 2849f408855942877b273a66a5e9e67b2987b425',status:'DOCUMENTED',license:'GPL-3.0',accessed:'2026-10-10'},
 'TMOTOR-MOTOR':{kind:'manufacturer-test-table',url:parts.motor.url,revision:parts.motor.revision,status:'DOCUMENTED',accessed:'2026-10-10'},
 'TMOTOR-PROP':{kind:'manufacturer-catalog',url:parts.prop.url,revision:'UNKNOWN',status:'PARTIAL',accessed:'2026-10-10'},
 'SPEEDYBEE-STACK':{kind:'manufacturer-product',url:parts.stack.url,revision:parts.stack.revision,status:'DISCONTINUED',accessed:'2026-10-10'},
 'IFLIGHT-RESEARCH':{kind:'retailer-specification',url:parts.researchStack.url,revision:'RECONFIRM',status:'NOT_AVAILABLE_AT_RETAILER',accessed:'2026-10-10'}
});
const fixed=(n,d=3)=>Number(n.toFixed(d));
const rule=(id,from,to,kind,status,why,evidence,action)=>({id,from,to,kind,status,why,evidence,action});
const finite=(n)=>typeof n==='number'&&Number.isFinite(n);

/** Exact manufacturer DXF circle positions for one plate, not motor locations. */
export const mainPlateMounts=Object.freeze({
  provenance:'TBS-MAIN-DXF',unit:'mm',datum:'unregistered-manufacturer-DXF-XY',
  pattern30_5:[[-15.25,-10.25],[-15.25,20.25],[15.25,-10.25],[15.25,20.25]],
  pattern20:[[-10,-5],[-10,15],[10,-5],[10,15]]
});
export function validateRotorLayout(rotors,propDiameterMm,minimumGapMm=2){
 if(!Array.isArray(rotors)||rotors.length!==4||rotors.some(p=>!p||!finite(p.x)||!finite(p.y)||!finite(p.z)||Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))>1000))throw Error('Four measured rotor centers {x,y,z} in millimeters are required');
 if(!finite(propDiameterMm)||propDiameterMm<50||propDiameterMm>400)throw Error('Measured diameter must be 50–400 mm');
 if(!finite(minimumGapMm)||minimumGapMm<0||minimumGapMm>100)throw Error('Invalid clearance threshold');
 const gaps=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
  const a=rotors[i],b=rotors[j],dist=Math.hypot(a.x-b.x,a.y-b.y),dz=Math.abs(a.z-b.z);
  // XY disks conservatively overlap even if separate in Z; propwash and flex clearance still need review.
  gaps.push({pair:`M${i+1}–M${j+1}`,horizontalCenterDistanceMm:fixed(dist),verticalOffsetMm:fixed(dz),radialGapMm:fixed(dist-propDiameterMm),status:dist-propDiameterMm<minimumGapMm?'FAIL_ENVELOPE':'PASS_PLAN_ONLY'});
 }
 const nearest=Math.min(...gaps.map(g=>g.radialGapMm));
 return {schema:'aeroforge/rotor-clearance/v0.4',unit:'mm',minimumGapMm,measuredInputAttestationRequired:true,nearestGapMm:nearest,gaps,hasInterference:gaps.some(x=>x.status==='FAIL_ENVELOPE'),
  status:gaps.some(x=>x.status==='FAIL_ENVELOPE')?'FAIL_ENVELOPE':'PASS_PLAN_ONLY',
  limit:'Pairwise XY circular envelopes only. Ignores blade flex, frame/antenna/payload collision, dynamic propwash and 3D mesh intersection.'};
}
function exactCandidate(inputs){return inputs.stackCandidate==='iflight-research'?parts.researchStack:parts.stack;}
export const qualificationDefaults=Object.freeze({stackCandidate:'reference-eol',packCells:6,packConnector:'UNSPECIFIED',escConnector:'UNSPECIFIED',escProtocol:'DShot',fcFirmware:'Betaflight',flightStackSourceRevision:'',verifiedStackMountDiameterMm:null,measurementNote:'',
 motorCentersMeasured:false,rotors:null,measuredPropDiameterMm:null,requiredRotorGapMm:2,
 payloadOffsetMm:{x:0,y:0,z:0},payloadMassG:0,measuredAircraftMassG:null,batterySku:'',motorScrewEngagementMm:null,manualPinoutReviewed:false});
export function normalizeQualification(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Qualification input must be object');
 for(const key of Object.keys(input))if(!Object.hasOwn(qualificationDefaults,key))throw Error(`Unknown qualification field: ${key}`);
 const x={...qualificationDefaults,...input};
 if(!['reference-eol','iflight-research'].includes(x.stackCandidate))throw Error('Invalid stack candidate');
 if(!Number.isInteger(x.packCells)||x.packCells<1||x.packCells>12)throw Error('Invalid battery cells');
 for(const key of ['packConnector','escConnector','escProtocol','fcFirmware','flightStackSourceRevision','measurementNote','batterySku'])if(typeof x[key]!=='string'||x[key].length>240)throw Error(`Invalid ${key}`);
 for(const key of ['measuredAircraftMassG','motorScrewEngagementMm','verifiedStackMountDiameterMm'])if(x[key]!==null&&(!finite(x[key])||x[key]<=0||x[key]>10000))throw Error(`Invalid ${key}`);
 for(const key of ['motorCentersMeasured','manualPinoutReviewed'])if(typeof x[key]!=='boolean')throw Error(`Invalid ${key}`);
 if(x.measuredPropDiameterMm!==null&&(!finite(x.measuredPropDiameterMm)||x.measuredPropDiameterMm<50||x.measuredPropDiameterMm>400))throw Error('Invalid prop diameter');
 if(!finite(x.requiredRotorGapMm)||x.requiredRotorGapMm<0||x.requiredRotorGapMm>100)throw Error('Invalid rotor gap');
 if(!finite(x.payloadMassG)||x.payloadMassG<0||x.payloadMassG>3000)throw Error('Invalid payload mass');
 if(!x.payloadOffsetMm||typeof x.payloadOffsetMm!=='object'||['x','y','z'].some(k=>!finite(x.payloadOffsetMm[k])||Math.abs(x.payloadOffsetMm[k])>500))throw Error('Invalid payload offset');
 if(x.rotors!==null)validateRotorLayout(x.rotors,x.measuredPropDiameterMm??129.5,x.requiredRotorGapMm);
 return {...x,payloadOffsetMm:{...x.payloadOffsetMm},rotors:x.rotors?.map(x=>({...x}))??null};
}
/** Payload CG delta: assumes measured *baseline* aircraft mass is before added payload. */
export function payloadCgShift(baseMassG,payloadMassG,payloadOffsetMm){
 if(!finite(baseMassG)||baseMassG<=0||!finite(payloadMassG)||payloadMassG<0) return null;
 if(!payloadOffsetMm||['x','y','z'].some(k=>!finite(payloadOffsetMm[k])))return null;
 const total=baseMassG+payloadMassG;
 return {x:fixed(payloadMassG*payloadOffsetMm.x/total),y:fixed(payloadMassG*payloadOffsetMm.y/total),z:fixed(payloadMassG*payloadOffsetMm.z/total),unit:'mm',reference:'baseline measured CG; offset measured from that datum',baselineVerified:false};
}
export function qualify(input={}){
 const x=normalizeQualification(input),stack=exactCandidate(x),rules=[];const add=(...args)=>rules.push(rule(...args));
 add('frame-stack-pattern','frame','fc-esc','mechanical','PASS_DOCUMENTED','Source Two DXF reveals 30.5-mm square mount and stack lists 30.5-mm nominal pattern. Bolt-hole/spacing and installation not yet qualified.',['TBS-MAIN-DXF',stack.evidence],'Check actual bolt diameter, spacers, plate and board shape in 3D.');
 add('stack-height','frame','fc-esc','geometry','HOLD_GEOMETRY','No registered manufacturer STEP/GLB and stack Z-envelope for this pairing.',['TBS-CAD',stack.evidence],'Perform datum registration and collision check against actual mesh.');
 const volts=x.packCells>=parts.motor.facts.cellsMin&&x.packCells<=parts.motor.facts.cellsMax;
 add('battery-motor-voltage','battery','motor','electrical',volts?'PASS_DOCUMENTED':'FAIL',`${x.packCells}S is ${volts?'within':'outside'} the motor documented 5–6S screening range.`,['TMOTOR-MOTOR'],'Confirm pack sag, connector, current and thermal limits.');
 const escVolts=x.packCells>=stack.facts.cellsMin&&x.packCells<=stack.facts.cellsMax;
 add('battery-esc-voltage','battery','fc-esc','electrical',escVolts?'PASS_DOCUMENTED':'FAIL',`${x.packCells}S is ${escVolts?'within':'outside'} the selected stack 2/3–6S rating.`,[stack.evidence],'Check measured pack voltage transients and exact harness.');
 const cur=stack.facts.continuousA>parts.motor.facts.maxTestCurrentA;
 add('esc-current','motor','fc-esc','electrical',cur?'PASS_DOCUMENTED':'FAIL','Nominal ESC continuous per-channel exceeds max current in one T-Motor static test. Does not qualify thermal duty cycle.',[stack.evidence,'TMOTOR-MOTOR'],'Measure application current, temperatures and harness bottlenecks.');
 const knownConnector=x.packConnector!=='UNSPECIFIED'&&x.escConnector!=='UNSPECIFIED';
 add('battery-connector','battery','fc-esc','connector',!knownConnector?'HOLD_SOURCE':x.packConnector===x.escConnector?'PASS_PLAN_ONLY':'FAIL',!knownConnector?'Connector pairing not specified':`Pack ${x.packConnector} vs ESC ${x.escConnector}`,[stack.evidence],'Verify current, polarity, real connector gender and wiring before powering.');
 const outOfStock=stack.availability==='DISCONTINUED'||stack.availability.startsWith('OUT_OF_STOCK');
 add('stack-availability','fc-esc','procurement','sourcing',outOfStock?'FAIL_SOURCE':'HOLD_SOURCE',`${stack.sku}: ${stack.availability}. Retail listings are not real-time procurement authority.`,[stack.evidence],'Choose a current, exact and demonstrably obtainable stack before ordering.');
 add('fc-firmware','fc-esc','autopilot','protocol','HOLD_SOURCE',`Candidate advertises ${stack.facts.firmware}; the current simulation contract targets PX4 and has no validated PX4 firmware target.`,[stack.evidence],'Validate the exact autopilot and simulator path independently (do not assume Betaflight compatibility with PX4).');
 add('fc-pinout','fc-esc','receiver-video','connector',x.manualPinoutReviewed?'HOLD_TEST':'HOLD_SOURCE','No version-locked actual battery, receiver, video/BEC pinout integration is provided.',[stack.evidence],'Record source revision, ports, BEC load, UART assignment, continuity and props-off bench results.');
 add('motor-screw-depth','frame','motor','mechanical','HOLD_MEASUREMENT',x.motorScrewEngagementMm===null?'Motor bolt clearance/engagement is unknown.':'User-entered engagement does not establish winding clearance or frame thread-fit.',['TBS-CAD','TMOTOR-MOTOR'],'Inspect fastener lengths/clearance against original mechanical drawings and actual motor.');
 add('prop-hub','motor','prop','mechanical','HOLD_SOURCE','4-mm manufacturer motor shaft value does not prove prop hub/retention fit.',['TMOTOR-MOTOR','TMOTOR-PROP'],'Inspect specific propeller revision, bore, fastener and directions.');
 let rotor=null;if(x.rotors&&x.measuredPropDiameterMm!==null){rotor=validateRotorLayout(x.rotors,x.measuredPropDiameterMm,x.requiredRotorGapMm)}
 add('rotor-clearance','frame','prop','geometry',rotor?.hasInterference?'FAIL':rotor?'PASS_PLAN_ONLY':'HOLD_MEASUREMENT',rotor?`Minimum rotor-to-rotor radial gap ${rotor.nearestGapMm} mm (XY envelope, no frame mesh).`:'Measured XYZ motor centers and prop swept diameter not supplied.',['TBS-CAD','TMOTOR-PROP'],'Extract motor XYZ from registered original STEP, inspect all 3D intersections and dynamic clearance.');
 const measured=x.motorCentersMeasured&&x.rotors!==null;
 add('coordinate-provenance','frame','rotor','evidence',measured?'HOLD_TEST':'HOLD_MEASUREMENT',measured?'Coordinates user-attested, not source-matched or independently checked.':'Motor centers are not measured or registered to source CAD.',['TBS-CAD'],'Check actual source revision, axes, datums and independent measurements.');
 add('ready-to-fly-mass','aircraft','test','evidence',x.measuredAircraftMassG===null?'HOLD_MEASUREMENT':'HOLD_TEST',x.measuredAircraftMassG===null?'No weighed aircraft with installed battery and flight hardware.':'User-entered mass has no independent calibrated-scale evidence.',[],'Attach test record with scale serial, method, revision and date.');
 const cg=payloadCgShift(x.measuredAircraftMassG,x.payloadMassG,x.payloadOffsetMm);
 add('cg-inertia','aircraft','simulator','physics','HOLD_MEASUREMENT',cg?`Computed payload delta ${JSON.stringify(cg)}; inertia tensor still absent.`:'No measured baseline mass/CG and inertial tensor.',[],'Measure base CG and 6 inertial tensor components; include wiring/battery position.');
 add('simulation','aircraft','PX4-Gazebo','simulation','HOLD_CALIBRATION','Missing measured inertias, motor coefficients, spin response, actual rotor mappings and valid PX4 target.',['TMOTOR-MOTOR'],'Complete physical tests and then execute pinned SITL.');
 const critical=rules.filter(r=>r.status==='FAIL'||r.status==='FAIL_SOURCE');
 const ref=evaluateReference();
 return {schema:'aeroforge/qualification-graph/v0.4',referenceId:ref.referenceId,baselineRevision:referenceRevision(ref),inputs:x,parts:{frame:parts.frame.id,motor:parts.motor.id,prop:parts.prop.id,stack:stack.id},stack,ruleCount:rules.length,rules,failed:critical.length,holds:rules.filter(r=>r.status.startsWith('HOLD')).length,documented:rules.filter(r=>r.status==='PASS_DOCUMENTED').length,rotor,cg,sourceManifest:'data/source_two_dxf_datums.v0.4.json',readiness:'NOT_FLIGHT_QUALIFIED',status:critical.length?'BLOCKED':'EVIDENCE_HOLD',sourceIDs:Object.keys(evidenceRegistry)};
}
/** Stable snapshot of qualification inputs, supplier facts and source revisions; no weak checkbox promotion. */
export function canonicalSnapshot(q){const r=qualify(q),entries=Object.keys(r.parts).sort().map(k=>[k,r.parts[k]]);return {schema:'aeroforge/design-snapshot/v0.4',qualificationEngine:'qualification_v04/1.0.0',referenceId:r.referenceId,partFacts:Object.fromEntries(Object.entries(r.parts).map(([k,id])=>[k,Object.values(parts).find(p=>p.id===id)?.facts])),partIDs:Object.fromEntries(entries),partRevisions:Object.fromEntries(entries.map(([k,id])=>[k,Object.values(parts).find(p=>p.id===id)?.revision])),sourceRevisions:Object.fromEntries(Object.entries(evidenceRegistry).map(([k,v])=>[k,v.revision])),inputs:r.inputs,qualification:{status:r.status,failed:r.failed,holds:r.holds,documented:r.documented,readiness:r.readiness},simulation:{schema:'aeroforge/px4-handoff/v0.4',status:'BLOCKED_MISSING_CALIBRATION',readyForSITL:false,selectedFlightStackId:r.stack.id,selectedFirmware:r.stack.facts.firmware,px4TargetVerified:false,measuredInertiaKgM2:null,motorCoefficients:null,motorDirectionMap:null,registeredCadGeometry:null,actualRotorXYZ:r.rotor&&r.inputs.motorCentersMeasured?r.inputs.rotors:null,measuredMassKg:r.inputs.measuredAircraftMassG===null?null:r.inputs.measuredAircraftMassG/1000,disclaimer:'This is a blocked handoff; no Gazebo SDF should be generated from these values.'},notice:'Documented screening only. Not a build approval, flight qualification or runnable simulation.'};}
export function inspectionPacket(q){const r=qualify(q);const out=['# AeroForge v0.4 · Engineering inspection packet','','Reference: '+r.referenceId,'Engineering status: '+r.status,'Flight authorization: NEVER DERIVED FROM AEROFORGE','','## Part identities',...Object.entries(r.parts).map(([slot,id])=>`- ${slot}: ${id}`),'','## Interface graph'];for(const a of r.rules){out.push(`- **${a.status}** [${a.id}] ${a.from} → ${a.to} (${a.kind}): ${a.why}`);out.push(`  - Evidence: ${a.evidence.join(', ')||'MISSING'}`);out.push(`  - Next: ${a.action}`)}out.push('','## Source and measurement separation','Manufacturer facts, source CAD, user assertions and calibrated measured findings remain different evidence classes.','DXF-derived holes only prove 2D manufacturing drawing locations, not 3D assembly registration.','No powered or flight operation is authorized by this inspection packet.');return out.join('\n')+'\n'}

/** Standards-compliant SHA-256 fallback for contexts without SubtleCrypto (e.g. offline previews). */
export function sha256Fallback(bytes){
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],n=bytes.length;
 const padded=Math.ceil((n+9)/64)*64,data=new Uint8Array(padded);data.set(bytes);data[n]=128;
 const bitlen=BigInt(n)*8n;for(let i=0;i<8;i++)data[padded-1-i]=Number((bitlen>>BigInt(i*8))&255n);
 const rotr=(v,d)=>(v>>>d)|(v<<(32-d));
 for(let offset=0;offset<padded;offset+=64){
  const w=new Uint32Array(64);for(let i=0;i<16;i++){const p=offset+4*i;w[i]=(data[p]<<24)|(data[p+1]<<16)|(data[p+2]<<8)|data[p+3]}
  for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(((w[i-16]+(rotr(a,7)^rotr(a,18)^(a>>>3)))>>>0)+w[i-7]+(rotr(b,17)^rotr(b,19)^(b>>>10)))>>>0}
  let [a,b,c,d,e,f,g,h]=H;
  for(let i=0;i<64;i++){
   const s1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g);
   const t1=(h+s1+ch+K[i]+w[i])>>>0;
   const s0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c);
   const t2=(s0+maj)>>>0;
   h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
  }
  const state=[a,b,c,d,e,f,g,h];for(let i=0;i<8;i++)H[i]=(H[i]+state[i])>>>0;
 }
 return H.map(n=>n.toString(16).padStart(8,'0')).join('');
}
/** Cryptographic content lock for the exact snapshot. A digest does NOT attest its accuracy. */
export async function snapshotSha256(input={}){
 const snapshot=canonicalSnapshot(input);
 const bytes=new TextEncoder().encode(JSON.stringify(snapshot));
 if(!globalThis.crypto?.subtle)return sha256Fallback(bytes);
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
