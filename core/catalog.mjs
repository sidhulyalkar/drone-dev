// AeroForge v0.1: demonstrator catalog, NOT a validated purchasing catalog.
// Illustrative nominal values must be replaced by revision-specific evidence.
export const catalog = {
  frames: [
    {id:'pocket',name:'Pocket 2.5 · guarded',class:'Sub-250 concept',size:2.5,wheelbase:120,mass:46,price:39,mount:25.5,motorMount:[9],cameraWidth:19,protected:true,color:'#b0db94',description:'Small guarded quad with a target takeoff mass below 250g.'},
    {id:'wisp',name:'Wisp 3 · ducted',class:'Cinewhoop',size:3, wheelbase:155, mass:118, price:54, mount:20, motorMount:[9,12],cameraWidth:19,protected:true,color:'#8a9fae',description:'Ducted, protected 3-inch cinematic frame.'},
    {id:'scout',name:'Scout 3.5 · compact',class:'Micro explorer',size:3.5,wheelbase:175,mass:83,price:49,mount:20,motorMount:[12,16],cameraWidth:19,protected:false,color:'#56bcd0',description:'Portable open-prop micro quad.'},
    {id:'kestrel',name:'Kestrel 5 · freestyle',class:'FPV freestyle',size:5.2,wheelbase:226,mass:125,price:42,mount:30.5,motorMount:[16],cameraWidth:19,protected:false,color:'#d18f60',description:'High-durability X-frame for responsive flight.'},
    {id:'horizon',name:'Horizon 7 · cruiser',class:'Long range',size:7.1,wheelbase:315,mass:232,price:93,mount:30.5,motorMount:[16,19],cameraWidth:19,protected:false,color:'#70a594',description:'Larger disk area, GPS, and efficient cruising.'},
    {id:'atlas',name:'Atlas 8 · research',class:'Robotics',size:8.2,wheelbase:385,mass:328,price:139,mount:30.5,motorMount:[19],cameraWidth:20,protected:false,color:'#ae93d4',description:'Modular payload deck with room for edge compute.'}
  ],
  motors: [
    {id:'1204',name:'1204 · 5000KV',mass:6,price:16,kv:5000,cells:[2],mount:9,maxThrust:200,maxCurrent:9,propRange:[2.3,2.6]},
    {id:'1404',name:'1404 · 3800KV',mass:9,price:17,kv:3800,cells:[4],mount:9,maxThrust:370,maxCurrent:14,propRange:[2.5,3.2]},
    {id:'2004',name:'2004 · 3000KV',mass:18,price:20,kv:3000,cells:[4],mount:12,maxThrust:790,maxCurrent:25,propRange:[3,4]},
    {id:'2207',name:'2207 · 1750KV',mass:32,price:22,kv:1750,cells:[6],mount:16,maxThrust:1550,maxCurrent:42,propRange:[4.5,5.2]},
    {id:'2507',name:'2507 · 1500KV',mass:46,price:32,kv:1500,cells:[6],mount:16,maxThrust:1900,maxCurrent:48,propRange:[6,7.2]},
    {id:'2807',name:'2807 · 1300KV',mass:63,price:39,kv:1300,cells:[6],mount:19,maxThrust:2350,maxCurrent:55,propRange:[7,8.2]}
  ],
  stacks: [
    {id:'aio',name:'F4 AIO · 25.5×25.5 · 12A',mass:10,price:68,mount:25.5,escA:12,cells:[2],bec:[5],firmware:['Betaflight']},
    {id:'mini',name:'F405 Mini · 20×20 · 35A',mass:17,price:65,mount:20,escA:35,cells:[4,6],bec:[5,9],firmware:['Betaflight','INAV']},
    {id:'f405',name:'F405 · 30.5×30.5 · 55A',mass:35,price:85,mount:30.5,escA:55,cells:[4,6],bec:[5,9],firmware:['Betaflight','INAV']},
    {id:'h7',name:'H7 autopilot · 30.5×30.5 · 65A',mass:49,price:165,mount:30.5,escA:65,cells:[6],bec:[5,9,12],firmware:['ArduPilot','PX4']}
  ],
  batteries: [
    {id:'2s650',name:'2S · 650mAh · XT30',mass:40,price:17,cells:2,capacity:650,connector:'XT30'},
    {id:'4s850',name:'4S · 850mAh · XT30',mass:105,price:25,cells:4,capacity:850,connector:'XT30'},
    {id:'4s1500',name:'4S · 1500mAh · XT60',mass:165,price:31,cells:4,capacity:1500,connector:'XT60'},
    {id:'6s1300',name:'6S · 1300mAh · XT60',mass:210,price:37,cells:6,capacity:1300,connector:'XT60'},
    {id:'6s2200',name:'6S · 2200mAh · XT60',mass:345,price:65,cells:6,capacity:2200,connector:'XT60'},
    {id:'6s4000',name:'6S · 4000mAh · XT60',mass:640,price:115,cells:6,capacity:4000,connector:'XT60'}
  ],
  props: [
    {id:'p25',name:'2.5″ · tri-blade',size:2.5,blades:3,mass:1.3,price:5},
    {id:'p3',name:'3.0″ · tri-blade',size:3,blades:3,mass:2,price:5},
    {id:'p35',name:'3.5″ · tri-blade',size:3.5,blades:3,mass:3,price:5},
    {id:'p5',name:'5.1″ · tri-blade',size:5.1,blades:3,mass:5,price:6},
    {id:'p7',name:'7.0″ · bi-blade',size:7,blades:2,mass:9,price:8},
    {id:'p8',name:'8.0″ · bi-blade',size:8,blades:2,mass:13,price:12}
  ],
  video: [
    {id:'analog',name:'Analog FPV camera + VTX',mass:22,price:62,voltage:5,cameraWidth:19,watts:5},
    {id:'digital',name:'Digital FPV camera + VTX',mass:47,price:195,voltage:9,cameraWidth:19,watts:11},
    {id:'research',name:'HD camera + companion vision',mass:148,price:249,voltage:12,cameraWidth:20,watts:20}
  ]
};
export const getPart=(type,id)=>catalog[type].find(x=>x.id===id);
export const commonItems = [
 {name:'ExpressLRS receiver (illustrative)',mass:4,price:19},
 {name:'Wiring, XT lead, antenna, straps & fasteners',mass:32,price:29},
 {name:'Props-off inspection / smoke stopper',mass:0,price:18,ground:true}
];
