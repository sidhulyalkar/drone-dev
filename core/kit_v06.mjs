/* AeroForge v0.6: manufacturer-documented X500v2 kit variant screening.
   PASS_DOCUMENTED is NOT a power-on, purchase, or flight authorization. */
export const sources=Object.freeze({
 KIT:{url:'https://holybro.com/products/px4-development-kit-x500-v2?variant=43018371629245',reviewed:'2026-10-10',kind:'manufacturer-kit'},
 FRAME:{url:'https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2',reviewed:'2026-10-10',kind:'manufacturer-frame'},
 ARF:{url:'https://holybro.com/collections/multicopter-kit/products/x500-v2-kits',reviewed:'2026-10-10',kind:'manufacturer-arf'},
 PM:{url:'https://holybro.com/products/pm02d-power-module',reviewed:'2026-10-10',kind:'manufacturer-power'},
 PX4:{url:'https://docs.px4.io/main/en/assembly/quick_start_pixhawk6c',reviewed:'2026-10-10',kind:'px4-wiring'},
 GAZEBO:{url:'https://docs.px4.io/main/en/sim_gazebo_gz/vehicles',reviewed:'2026-10-10',kind:'px4-upstream-simulation'}
});
export const variants=Object.freeze({
 six_c:{id:'six_c',label:'Pixhawk 6C + analog PM02 V3',fc:'Pixhawk 6C',power:'pm02v3',interface:'analog',target:'px4_fmu-v6c_default'},
 six_x:{id:'six_x',label:'Pixhawk 6X + digital PM02D',fc:'Pixhawk 6X',power:'pm02d',interface:'i2c',target:null}
});
export const components=Object.freeze({
 frame:{id:'x500v2-30120',qty:1,name:'X500 V2 frame',wheelbaseMm:500,plateMm:[144,144],motorPatternMm:16,source:'FRAME'},
 motor:{id:'holybro-2216-kv920',qty:4,name:'2216 KV920 motors',source:'KIT'},
 esc:{id:'holybro-blheli-s-20a-4s',qty:4,name:'BLHeli S 20A ESC, kit 4S',ratedA:20,packCells:4,source:'KIT'},
 prop:{id:'holybro-1045',qty:4,name:'1045 propellers',source:'KIT'},
 pdb:{id:'x500v2-xt60-xt30',qty:1,name:'XT60 battery / XT30 ESC PDB',source:'KIT'},
 gps:{id:'gps-version-unresolved',qty:1,name:'GPS model M8N versus M10 conflict',source:'KIT'},
 telemetry:{id:'sik-v3-band-unresolved',qty:1,name:'SiK telemetry regional band unresolved',source:'KIT'}
});
export const defaults=Object.freeze({variant:'six_c',power:'auto',batteryCells:4,batterySku:'',radioSku:'',receiverSku:'',chargerSku:'',cadImported:false,physicalInspected:false});
const knownKeys=new Set(Object.keys(defaults));
const powerTypes={pm02v3:{id:'pm02v3',interface:'analog',name:'PM02 V3 analog',source:'KIT'},pm02d:{id:'pm02d',interface:'i2c',name:'PM02D I2C digital',source:'PM'}};
export function qualifyKit(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid selection');
 for(const key of Object.keys(input))if(!knownKeys.has(key))throw Error('Unknown kit field: '+key);
 const x={...defaults,...input};
 if(!Object.hasOwn(variants,x.variant))throw Error('Unknown variant');
 if(!['auto','pm02v3','pm02d'].includes(x.power))throw Error('Unknown power type');
 if(!Number.isInteger(x.batteryCells)||x.batteryCells<2||x.batteryCells>12)throw Error('Battery cells outside allowed input range');
 for(const k of ['batterySku','radioSku','receiverSku','chargerSku'])if(typeof x[k]!=='string'||x[k].length>120)throw Error('Invalid '+k);
 for(const k of ['cadImported','physicalInspected'])if(typeof x[k]!=='boolean')throw Error('Invalid '+k);
 const v=variants[x.variant],p=powerTypes[x.power==='auto'?v.power:x.power],facts=[];
 const add=(id,status,detail,source,next)=>facts.push({id,status,detail,source,next});
 add('flight-controller','DOCUMENTED',v.fc+' is offered for the X500 V2 PX4 development kit.',['KIT'],'Record actual FC board revision and flashed firmware release.');
 add('power-module',v.interface===p.interface?'DOCUMENTED':'FAIL',v.fc+' bundle expects '+v.interface+' power; selected '+p.name+' is '+p.interface+'.',['KIT','PM','PX4'],'Confirm exact FC power connector, manual and matched power module before wiring.');
 add('esc-battery',x.batteryCells===4?'DOCUMENTED':'FAIL','Kit ESC is documented for 4S. Selected '+x.batteryCells+'S.',['KIT','ARF'],'Inspect actual ESC label and battery full-charge voltage.');
 add('motor-prop','DOCUMENTED','Kit specifies four 2216 KV920 motors and 1045 propellers.',['KIT'],'Source version-specific static thrust and operating-current curves.');
 add('frame-geometry','HOLD','Manufacturer frame CAD is offered but imported 3D assembly, rotor positions and physical clearance are unverified.',['FRAME'],'Import vendor STEP with source hash and register components.');
 add('physical-cad',x.cadImported?'HOLD':'MISSING',x.cadImported?'User-reported CAD import does not provide source/hash or clearance proof.':'No registered and independently validated CAD assembly.',['FRAME'],'Record STEP hash, units, measured motor coordinates, prop sweeps and intersection audit.');
 add('current-thermal','HOLD','20A nominal ESC rating alone cannot establish motor current or thermal limits.',['KIT'],'Bench-measure the exact motor/prop combination and duty cycle.');
 add('connector-variation','HOLD','XT30 ESC power is described; motor-side MR30 vs XT30 specifications differ between listings.',['KIT','ARF'],'Photograph and compare received connectors and wiring revisions.');
 add('gps-revision','HOLD','Current store includes M10 while the documentation guide references M8N.',['KIT','FRAME'],'Confirm supplied GNSS model, wiring and firmware settings.');
 add('telemetry-band','HOLD','SiK telemetry can vary by country and 433/915 MHz bundle choice.',['KIT'],'Verify legal frequencies and radio pairing.');
 add('battery-identity',x.batterySku?'HOLD':'MISSING','Battery is separately sourced; no verified battery discharge or connector rating.',['KIT'],'Confirm exact 4S pack chemistry, mass, XT60 mating, current limit and charging workflow.');
 add('radio-failsafe',x.radioSku&&x.receiverSku?'HOLD':'MISSING','Radio/receiver identity and failsafe testing are unresolved.',['KIT','PX4'],'Record receiver protocol, RC mapping and loss-of-link test.');
 add('charger-identity',x.chargerSku?'HOLD':'MISSING','Charger, balance mode and battery safety are not qualified.',['KIT'],'Confirm appropriate charger and charging procedure.');
 add('physical-validation',x.physicalInspected?'HOLD':'MISSING','A user checkbox is not an independent inspection record.',['PX4'],'Collect prop-off power inspection, mass/inertia and staged test logs.');
 add('custom-simulation','MISSING','PX4 generic x500 exists; kit-specific inertia, rotor positions and calibrated propulsion remain unknown.',['GAZEBO'],'Collect measured mass, rotor XYZ, motor coefficients and PX4 actuator mapping.');
 const failed=facts.filter(f=>f.status==='FAIL').length;
 const unresolved=facts.filter(f=>['HOLD','MISSING'].includes(f.status)).length;
 return {schema:'aeroforge/x500-kit/v0.6',reference:'holybro-x500-v2',sourceReviewDate:'2026-10-10',selected:{...x,power:p.id},
  flightController:{...v},powerModule:{...p},components,sources,findings:facts,
  counts:{documented:facts.length-failed-unresolved,failed,unresolved},
  status:failed?'BLOCKED_INCOMPATIBLE':'INCOMPLETE_EVIDENCE',procurementReady:false,flightQualified:false,
  notice:'Documented component matching is not validation of physical fit, sourcing, commissioning, or flight.'};
}
export function simulationHandoff(input={}){
 const q=qualifyKit(input);
 return {schema:'aeroforge/px4-sitl-handoff/v0.6',reference:q.reference,variant:q.selected.variant,
  baseline:{status:'DOCUMENTED_UPSTREAM_NOT_EXECUTED',command:'make px4_sitl gz_x500',depth:'make px4_sitl gz_x500_depth',vision:'make px4_sitl gz_x500_vision',source:sources.GAZEBO.url},
  custom:{status:'BLOCKED_UNCALIBRATED',frameStepHash:null,measuredMassKg:null,inertiaKgM2:null,rotorXYZm:null,motorThrustCoefficient:null,motorMomentCoefficient:null,motorTimeConstants:null,powerCurve:null,escMapping:null},flightQualified:false,
  notice:'The generic PX4 x500 simulation is not a calibrated digital twin of this Holybro aircraft.'};
}
export function assemblyPacket(input={}){
 const q=qualifyKit(input);
 const lines=['# AeroForge v0.6 · X500 V2 evidence packet','','Selected bundle: '+q.flightController.label,'Selection status: '+q.status,'','## Component reference',
 ...Object.values(q.components).map(c=>'- '+c.qty+' × '+c.name+' ('+c.id+')'),
 '- 1 × '+q.flightController.fc,
 '- 1 × '+q.powerModule.name,
 '','## Verification and assembly stages',
 '1. Identify shipment variant, source revisions, regional telemetry frequency, and actual SKUs.',
 '2. Import and register the manufacturer X500 V2 STEP. Inspect rotor swept disks and all component clearances.',
 '3. With battery disconnected and propellers removed, review actual manuals, power polarity, harnesses and electrical limits.',
 '4. Verify PX4 target, actual output mapping, RC receiver and failsafe, GNSS and telemetry.',
 '5. Run generic upstream PX4 x500 SITL separately. Build custom aircraft model only from measurements.',
 '6. Require documented independent inspection, physical measurements and safe flight qualification.',
 '','## Open engineering findings'];
 for(const f of q.findings)lines.push('- **'+f.status+'** '+f.id+': '+f.detail+' Sources: '+f.source.join(', ')+'. Next: '+f.next);
 lines.push('','No authorization to purchase, energize or fly is implied.','');
 return lines.join('\n');
}
