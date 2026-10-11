import {catalog} from './catalog.mjs';
import {getGroundKit} from './ground.mjs';
import {evaluate} from './engine.mjs';
const slots={frame:'frames',motor:'motors',prop:'props',stack:'stacks',battery:'batteries',video:'video'};
export function validateSettings(settings){
 if(!settings||typeof settings!=='object'||Array.isArray(settings))throw new Error('Design settings must be an object');
 const clean={};
 for(const [key,cat] of Object.entries(slots)){
  if(typeof settings[key]!=='string'||!catalog[cat].some(part=>part.id===settings[key]))throw new Error(`Unknown ${key} part ID`);
  clean[key]=settings[key];
 }
 if(!['cinematic','freestyle','explore','research'].includes(settings.mission))throw new Error('Unsupported mission');
 clean.mission=settings.mission;
 if(typeof settings.payload!=='number'||!Number.isFinite(settings.payload)||settings.payload<0||settings.payload>400)throw new Error('Invalid payload mass');
 clean.payload=settings.payload;
 clean.groundKit=settings.groundKit??'none';
 if(typeof clean.groundKit!=='string'||!getGroundKit(clean.groundKit))throw new Error('Unknown ground equipment kit');
 evaluate(clean);
 return clean;
}
export function parseDesignJSON(contents){
 if(typeof contents!=='string'||contents.length>200000)throw new Error('Design file too large');
 let data;try{data=JSON.parse(contents)}catch{throw new Error('File is not valid JSON')}
 if(!['aeroforge-design/v0.1','aeroforge-design/v0.2'].includes(data?.schema))throw new Error('Not a supported AeroForge design export');
 return validateSettings(data.settings);
}
export function bomCSV(result){
 const lines=[['Group','Component','Quantity','Mass_g_total','Unit_cost_USD_assumed','Total_cost_USD_assumed','Verification']];
 for(const row of result.items)lines.push(['Aircraft',row.name,row.quantity,row.mass,row.unitPrice,row.quantity*row.unitPrice,'UNVERIFIED']);
 if(result.settings.payload)lines.push(['Aircraft','Custom added payload (unpriced)',1,result.settings.payload,'', '', 'UNSPECIFIED']);
 for(const row of result.groundItems)lines.push(['Ground',row.name,1,0,row.price,row.price,'UNVERIFIED']);
 return lines.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
}
export function designKey(settings){const clean=validateSettings(settings);return Object.entries(clean).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('|');}
