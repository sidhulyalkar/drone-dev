/**
 * AeroForge v2.0 source catalog: exact published SKU identities, NEVER verified received hardware.
 * Source facts are a dated human-curated manufacturer snapshot, not live inventory or pricing.
 */
export const SOURCE_CATALOG_SCHEMA='aeroforge/source-catalog/v2.0';
export const REVIEW_DATE='2026-10-11';
const holybro='https://holybro.com/products/px4-development-kit-x500-v2';
const guide='https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2';
const speed='https://www.speedybee.com/speedybee-f405-v4-bls-55a-30x30-fc-esc-stack/';
const source=(url,role)=>({url,publisher:role,reviewed:REVIEW_DATE,origin:'PUBLISHED_MANUFACTURER_PAGE'});
const kit=(sku,variant,band,variantId,listedUsd)=>{
 const fc=variant==='six_c'?'Pixhawk 6C':'Pixhawk 6X';
 return {
  id:'holybro-kit-'+sku,manufacturer:'Holybro',sku,group:'complete-kit',
  model:'PX4 Development Kit - X500 V2',
  label:fc+' / M10 / '+band+' MHz',source:source(holybro+'?variant='+variantId,'Holybro Store'),
  variant,telemetryMHz:band,gnssModel:'M10',powerFamily:variant==='six_c'?'pm02v3':'pm02d',
  packageContent:[
   'X500 V2 frame kit (manufacturer SKU 30120)',
   fc+' flight controller, revision not verified on delivered board',
   variant==='six_c'?'PM02 V3 analog power module':'PM02D digital power module (store notes a high-voltage variant)',
   'M10 GPS module',
   'SiK Telemetry Radio V3 '+band+' MHz',
   'Four 2216 KV920 motors and 20A BLHeli S ESCs',
   'Six 1045 propellers'
  ],
  claims:[
   {key:'bundle',value:fc+' / M10 / '+band+' MHz',authority:'VENDOR_PUBLISHED_VARIANT'},
   {key:'manufacturer_listing_usd',value:listedUsd,authority:'HISTORICAL_NOT_LIVE_PRICE'},
   {key:'frame_wheelbase_mm',value:500,authority:'DOCUMENTATION_NOMINAL'},
   {key:'esc_pack_cells',value:4,authority:'MANUFACTURER_DOCUMENTED'},
  ],
  revision:{publishedVariantId:String(variantId),actualDeliveredRevision:null,manufacturerItemRevision:null},
  lifecycle:'VENDOR_LISTING_DOCUMENTED',listedPriceUsd:listedUsd,livePrice:false,
  inventoryVerified:false,shippingVerified:false,qualifiedForPurchase:false,
  requiredChecks:[
   'Inspect received controller hardware revision and supported PX4 firmware',
   'Confirm exact power module (6X store notes PM02D-HV variant)',
   'Check regional SiK frequency permission and radio/RC pairing',
   'Inspect supplied GNSS and motor-side connectors (documentation differs by revision)',
   'Identify separate battery, charger, receiver and any omitted accessories',
   'Verify geometry, actual wiring, and independent electrical testing'
  ],
  conflicts:[
   'Older X500 documentation mentions M8N while current store lists M10',
   'Older documentation lists motor XT30; current store describes motor-side MR30 and ESC-side XT30'
  ],
  referenceOnly:true
 };
};
export const SOURCE_SKUS=Object.freeze([
 kit('30188','six_c',433,'43018371530941',579),
 kit('30189','six_c',915,'43018371563709',579),
 kit('30199','six_x',433,'43018371596477',669),
 kit('30200','six_x',915,'43018371629245',669),
 {
  id:'holybro-frame-30120',manufacturer:'Holybro',sku:'30120',group:'frame',
  model:'X500 V2 Frame Kit',label:'X500 V2 frame kit',
  source:source(guide,'Holybro Documentation'),variant:null,telemetryMHz:null,gnssModel:null,powerFamily:null,
  packageContent:['Carbon fiber frame and mounting hardware (exact received contents to inspect)'],
  claims:[
   {key:'wheelbase_mm',value:500,authority:'DOCUMENTATION_NOMINAL'},
   {key:'frame_plates_mm',value:[144,144],authority:'DOCUMENTATION_NOMINAL'},
   {key:'plate_thickness_mm',value:2,authority:'DOCUMENTATION_NOMINAL'},
   {key:'plate_spacing_mm',value:28,authority:'DOCUMENTATION_NOMINAL'},
   {key:'motor_pattern_mm',value:[16,19],authority:'CONFLICTING_REVISION_DEPENDENT_DOCUMENTATION'},
  ],
  revision:{publishedVariantId:null,actualDeliveredRevision:null,manufacturerItemRevision:null},
  lifecycle:'DOCUMENTED_COMPONENT_FAMILY',listedPriceUsd:null,livePrice:false,inventoryVerified:false,
  shippingVerified:false,qualifiedForPurchase:false,
  requiredChecks:['Determine which 16×16 mm and 19×19 mm patterns are present on received frame',
   'Inspect source CAD revision, units and mounting datums',
   'Check actual mechanical fits and fastener engagement'],
  conflicts:['Older documentation only states 16×16 mm pattern; current store mentions 16×16 mm and 19×19 mm'],
  referenceOnly:true
 },
 {
  id:'speedybee-f405-v4-bls-55',manufacturer:'SpeedyBee',sku:'SB-F4V4-55-STACK',group:'controller-stack',
  model:'F405 V4 BLS 55A FC & ESC Stack',label:'30.5 mm F405 + 55A 4-in-1 ESC',
  source:source(speed,'SpeedyBee Official'),variant:null,telemetryMHz:null,gnssModel:null,powerFamily:null,
  packageContent:['F405 flight-controller board','BLS 55A 4-in-1 ESC'],
  claims:[
   {key:'mount_hole_spacing_mm',value:30.5,authority:'MANUFACTURER_SPECIFICATION'},
   {key:'controller_firmware',value:['Betaflight','INAV'],authority:'MANUFACTURER_SPECIFICATION'},
   {key:'esc_current_a_per_channel',value:55,authority:'MANUFACTURER_SPECIFICATION'},
   {key:'esc_pack_cell_range',value:[3,6],authority:'MANUFACTURER_SPECIFICATION'}
  ],
  revision:{publishedVariantId:null,actualDeliveredRevision:null,manufacturerItemRevision:'V4 (product family)'},
  lifecycle:'MANUFACTURER_DISCONTINUED',listedPriceUsd:null,livePrice:false,inventoryVerified:false,
  shippingVerified:false,qualifiedForPurchase:false,
  requiredChecks:['Manufacturer lists this SKU as discontinued; research replacement separately',
   'Confirm firmware target and exact received controller PCB revision',
   'Verify connector pinouts, BEC load, thermal derating and actual mounting fit'],
  conflicts:[],referenceOnly:true
 }
]);
const skuMap=new Map(SOURCE_SKUS.map(x=>[x.sku,x]));
export function findSourceSku(sku){return skuMap.get(sku)||null;}
export function sourceSkuChoices({group=null}={}){return SOURCE_SKUS.filter(x=>!group||x.group===group);}
export function diffSourceSku(a,b){
 const left=typeof a==='string'?findSourceSku(a):a,right=typeof b==='string'?findSourceSku(b):b;
 if(!left||!right)throw Error('Both published SKUs must exist');
 const fields=['manufacturer','model','label','variant','telemetryMHz','gnssModel',
  'powerFamily','lifecycle','listedPriceUsd'];
 return {schema:'aeroforge/source-sku-diff/v2.0',leftSku:left.sku,rightSku:right.sku,
  rows:fields.map(key=>({key,left:left[key]??null,right:right[key]??null,
   changed:JSON.stringify(left[key]??null)!==JSON.stringify(right[key]??null)})),
  bothPhysicalFitQualified:false,bothOrderReady:false,
  notice:'Published identity comparison only. No stock guarantee, verified pairing, delivery revision or flight approval.'};
}
export function inspectSourceSku(sku,{selectedVariant=null,batteryCells=null}={}){
 const item=findSourceSku(sku);
 if(!item)throw Error('Unknown manufacturer SKU');
 if(selectedVariant!=null&&!['six_c','six_x'].includes(selectedVariant))throw Error('Unknown kit variant');
 if(batteryCells!==null&&(!Number.isInteger(batteryCells)||batteryCells<2||batteryCells>12))
  throw Error('Invalid battery cells');
 const holds=[...item.requiredChecks];
 if(item.group==='complete-kit'&&selectedVariant!==null&&item.variant!==selectedVariant)
  holds.unshift('BLOCK: selected kit variant does not match current X500 controller family');
 if(item.group==='complete-kit'&&batteryCells!==null&&batteryCells!==4)
  holds.unshift('BLOCK: kit ESC family is documented for 4S packs, not '+batteryCells+'S');
 if(item.lifecycle==='MANUFACTURER_DISCONTINUED')
  holds.unshift('BLOCK: manufacturer discontinued the listed SKU');
 return {schema:SOURCE_CATALOG_SCHEMA,sku:item.sku,id:item.id,
  label:item.label,manufacturer:item.manufacturer,source:item.source,
  claims:item.claims,revision:item.revision,lifecycle:item.lifecycle,
  conflicts:item.conflicts,holds,kitVariant:item.variant,telemetryMHz:item.telemetryMHz,
  historicalListingUsd:item.listedPriceUsd,
  blockCount:holds.filter(x=>x.startsWith('BLOCK:')).length,
  verifiedReceivedHardware:false,verifiedManufacturerOriginOfCad:false,
  sourceIdentityDocumented:true,liveAvailability:false,livePricing:false,
  physicalCompatibilityVerified:false,procurementApproved:false,
  powerApproved:false,flightApproved:false,
  notice:'Published SKU ≠ received revision or qualified BOM. Verify current availability, shipping, and source-specific safety before ordering.'};
}
export function createSourcingResearchPacket(sku,{selectedVariant=null,batteryCells=null}={}){
 const record=inspectSourceSku(sku,{selectedVariant,batteryCells});
 return {schema:'aeroforge/sourcing-research-packet/v2.0',
  createdFor:'RESEARCH_ONLY_NOT_PURCHASE_AUTHORITY',item:record,
  vendorLink:record.source.url,
  sourceAsOf:record.source.reviewed,
  receivedRevision:null,receivedSkuVerified:false,cartReady:false,
  financialApproval:false,physicalFitApproved:false,
  unverifiedRequiredWork:[...record.holds]};
}
export function attachSourcingReference(record,sku){
 if(record?.schema!=='aeroforge/x500-aircraft-record/v1.4')
  throw Error('Canonical X500 record required');
 const item=findSourceSku(sku);
 if(!item||item.group!=='complete-kit')throw Error('Only published complete-kit SKU may attach to an X500 kit record');
 if(item.variant!==record.variant)throw Error('Kit SKU controller family conflicts with current X500 selection');
 if(record.selected?.batteryCells!==4)throw Error('Documented X500 kit ESC family requires 4S screening before research linkage');
 const screen=inspectSourceSku(sku,{selectedVariant:record.variant,batteryCells:record.selected?.batteryCells});
 return {...record,sourceCatalogCandidate:{
  sku:item.sku,id:item.id,variant:item.variant,telemetryMHz:item.telemetryMHz,
  sourceUrl:item.source.url,sourceAsOf:item.source.reviewed,
  lifecycle:item.lifecycle,blockCount:screen.blockCount,
  requiresReview:screen.holds,identityStatus:'PUBLISHED_SKU_NOT_RECEIVED_PART',
  physicalFitVerified:false,orderApproved:false},
  procurementApproved:false,powerApproved:false,flightApproved:false};
}
