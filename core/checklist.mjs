export const stages=[
 {id:'catalog',title:'Manufacturer evidence',items:[
  ['sku','Find exact manufacturer SKUs, revisions and purchase sources for every part'],
  ['mechanical','Verify manufacturer drawings and measure prop, motor, frame, camera and stack fits'],
  ['power','Obtain motor/prop thrust-current curves and documented ESC/BEC electrical limits']
 ]},
 {id:'mechanical',title:'Unpowered assembly',items:[
  ['hardware','Inspect arm thickness, fastener length, motor screw clearance and structural joints'],
  ['mass','Weigh components and assembled aircraft; locate center of gravity including payload'],
  ['prop_off','Remove all propellers before any electrical work or motor testing']
 ]},
 {id:'electrical',title:'Electrical integration',items:[
  ['polarity','Independently inspect power polarity, insulation, shorts and voltage rails'],
  ['current','Use current-limited initial power-up with props off and an appropriate fire-safety setup'],
  ['failsafe','Check receiver binding, mode behavior, disarm, link loss and low-battery response']
 ]},
 {id:'software',title:'Firmware & bench validation',items:[
  ['firmware','Verify exact FC firmware target and ESC protocol against manufacturer guidance'],
  ['orientation','Check motor order, direction, sensor orientation and control mapping with props off'],
  ['logs','Record bench thrust/current/temperature/vibration data and retain a build revision log']
 ]},
 {id:'operations',title:'Flight operations review',items:[
  ['law','Check flight category, TRUST, FAA registration, Remote ID and relevant local rules'],
  ['airspace','Check current airspace authorization, conditions and safe operating location'],
  ['flight','Obtain independent physical inspection before a staged low-risk outdoor test']
 ]}
];
export const checklistCount=stages.reduce((n,s)=>n+s.items.length,0);
export function progress(done={}){return {checked:stages.reduce((n,s)=>n+s.items.filter(([id])=>done[id]===true).length,0),total:checklistCount};}
