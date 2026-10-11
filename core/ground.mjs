// Planning-only ground systems. Unverified placeholder prices and compatibility profiles.
// A receiver / transmitter protocol is not proof of firmware, region, band, or RF compatibility.
export const groundKits = [
  {id:'none',name:'Already equipped',description:'No radio/display/charger added; basic bench safety-tool allowance remains. Verify your existing kit.',items:[]},
  {id:'analog',name:'Analog starter',description:'Basic ground kit for analog video aircraft.',video:['analog'],items:[
    {name:'ELRS-capable radio transmitter (unverified estimate)',price:95},
    {name:'Analog FPV display / goggles (unverified estimate)',price:125},
    {name:'Battery charger with suitable chemistry and lead (unverified estimate)',price:65},
    {name:'LiPo-safe storage & safety supplies (unverified estimate)',price:35}
  ]},
  {id:'digital',name:'Digital FPV starter',description:'Digital-compatible video receiver / goggles planning allowance.',video:['digital'],items:[
    {name:'ELRS-capable radio transmitter (unverified estimate)',price:95},
    {name:'Digital video receiver / goggles (unverified estimate)',price:390},
    {name:'Battery charger and appropriate lead (unverified estimate)',price:85},
    {name:'LiPo-safe storage & safety supplies (unverified estimate)',price:35}
  ]},
  {id:'research',name:'Research ground station',description:'Telemetry, pilot radio and lab charging planning allowance; video downlink must be defined.',video:['research'],items:[
    {name:'Compatible manual radio control system (unverified estimate)',price:150},
    {name:'Telemetry ground radio / data link (unverified estimate)',price:95},
    {name:'Programmable charger and adapters (unverified estimate)',price:120},
    {name:'LiPo-safe storage and workbench supplies (unverified estimate)',price:50}
  ]}
];
export const getGroundKit=id=>groundKits.find(k=>k.id===id)||null;
