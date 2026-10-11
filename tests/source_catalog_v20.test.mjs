import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileX500Record} from '../core/x500_record_v14.mjs';
import {SOURCE_CATALOG_SCHEMA,SOURCE_SKUS,REVIEW_DATE,findSourceSku,sourceSkuChoices,
 diffSourceSku,inspectSourceSku,createSourcingResearchPacket,attachSourcingReference}
 from '../core/source_catalog_v20.mjs';

test('exact manufacturer identity catalog has unique published SKUs and source metadata',()=>{
 assert.equal(SOURCE_SKUS.length,6);
 assert.equal(new Set(SOURCE_SKUS.map(x=>x.sku)).size,SOURCE_SKUS.length);
 assert.equal(REVIEW_DATE,'2026-10-11');
 for(const s of SOURCE_SKUS){
  assert.match(s.sku,/^[A-Z0-9-]+$/);
  assert.ok(s.source.url.startsWith('https://'));
  assert.equal(s.source.reviewed,REVIEW_DATE);
  assert.equal(s.referenceOnly,true);
  assert.equal(s.livePrice,false);
  assert.equal(s.inventoryVerified,false);
  assert.equal(s.qualifiedForPurchase,false);
  assert.equal(s.revision.actualDeliveredRevision,null);
  assert.ok(s.requiredChecks.length>0);
 }
 assert.equal(findSourceSku('missing'),null);
 assert.equal(sourceSkuChoices({group:'complete-kit'}).length,4);
});
test('store variant SKUs uniquely map controller, GPS, region and power family',()=>{
 const expected=[
  ['30188','six_c',433,'pm02v3',579],
  ['30189','six_c',915,'pm02v3',579],
  ['30199','six_x',433,'pm02d',669],
  ['30200','six_x',915,'pm02d',669]
 ];
 for(const [sku,variant,band,power,usd] of expected){
  const p=findSourceSku(sku);
  assert.equal(p.variant,variant);assert.equal(p.telemetryMHz,band);
  assert.equal(p.powerFamily,power);assert.equal(p.gnssModel,'M10');
  assert.equal(p.listedPriceUsd,usd);
  assert.equal(p.lifecycle,'VENDOR_LISTING_DOCUMENTED');
  assert.ok(p.conflicts.some(x=>/M8N/.test(x)));
 }
});
test('dated price remains historical and is never a live availability or purchasing authorization',()=>{
 const a=inspectSourceSku('30189',{selectedVariant:'six_c',batteryCells:4});
 assert.equal(a.schema,SOURCE_CATALOG_SCHEMA);
 assert.equal(a.blockCount,0);
 assert.equal(a.sourceIdentityDocumented,true);
 assert.equal(a.procurementApproved,false);
 assert.equal(a.physicalCompatibilityVerified,false);
 assert.equal(a.livePricing,false);
 assert.equal(a.liveAvailability,false);
 const packet=createSourcingResearchPacket('30189',{selectedVariant:'six_c',batteryCells:4});
 assert.equal(packet.cartReady,false);assert.equal(packet.receivedRevision,null);
 assert.equal(packet.item.historicalListingUsd,579);
 assert.equal(packet.sourceAsOf,REVIEW_DATE);
});
test('mismatched controller and 3S/6S selections are clearly blocked, even with exact SKU',()=>{
 const mismatched=inspectSourceSku('30200',{selectedVariant:'six_c',batteryCells:4});
 assert.equal(mismatched.blockCount,1);
 assert.ok(mismatched.holds[0].startsWith('BLOCK:'));
 const pack=inspectSourceSku('30189',{selectedVariant:'six_c',batteryCells:6});
 assert.equal(pack.blockCount,1);
 assert.match(pack.holds[0],/4S/);
 assert.throws(()=>inspectSourceSku('30189',{batteryCells:2.5}),/Invalid battery cells/);
 assert.throws(()=>inspectSourceSku('not-real'),/Unknown manufacturer SKU/);
});
test('real frame identity exposes documented geometry and revision-dependent discrepancy',()=>{
 const f=findSourceSku('30120');
 assert.equal(f.group,'frame');
 assert.deepEqual(f.claims.find(x=>x.key==='motor_pattern_mm').value,[16,19]);
 assert.equal(f.claims.find(x=>x.key==='motor_pattern_mm').authority,'CONFLICTING_REVISION_DEPENDENT_DOCUMENTATION');
 assert.ok(f.conflicts.length>0);
 assert.equal(f.qualifiedForPurchase,false);
});
test('discontinued SpeedyBee stack is not offered as an available order SKU',()=>{
 const p=inspectSourceSku('SB-F4V4-55-STACK');
 assert.equal(p.lifecycle,'MANUFACTURER_DISCONTINUED');
 assert.equal(p.blockCount,1);
 assert.match(p.holds[0],/discontinued/);
 assert.equal(p.procurementApproved,false);
});
test('SKU comparison surfaces model and radio differences without qualifying interchange',()=>{
 const radio=diffSourceSku('30188','30189');
 assert.ok(radio.rows.find(x=>x.key==='telemetryMHz').changed);
 assert.equal(radio.rows.find(x=>x.key==='variant').changed,false);
 const architecture=diffSourceSku('30189','30200');
 assert.equal(architecture.rows.find(x=>x.key==='variant').changed,true);
 assert.equal(architecture.rows.find(x=>x.key==='powerFamily').changed,true);
 assert.equal(architecture.bothOrderReady,false);
 assert.equal(architecture.bothPhysicalFitQualified,false);
 assert.throws(()=>diffSourceSku('missing','30189'),/Both published/);
});
test('source SKU can annotate ONLY a matching canonical X500 variant, never a purchased machine',()=>{
 const c=compileX500Record({variant:'six_c',batteryCells:4});
 const out=attachSourcingReference(c,'30189');
 assert.equal(out.sourceCatalogCandidate.sku,'30189');
 assert.equal(out.sourceCatalogCandidate.variant,'six_c');
 assert.equal(out.sourceCatalogCandidate.orderApproved,false);
 assert.equal(out.sourceCatalogCandidate.identityStatus,'PUBLISHED_SKU_NOT_RECEIVED_PART');
 assert.equal(out.procurementApproved,false);
 assert.equal(out.flightApproved,false);
 assert.equal(c.sourceCatalogCandidate,undefined);
 assert.throws(()=>attachSourcingReference(c,'30200'),/conflicts/);
 assert.throws(()=>attachSourcingReference(c,'30120'),/Only published complete-kit/);
 assert.throws(()=>attachSourcingReference(compileX500Record({variant:'six_c',batteryCells:3}),'30189'),/4S/);
});
test('catalog is wired as a secondary engineering disclosure and exports remain research-only',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../sourcing_ui_v20.mjs',import.meta.url),'utf8');
 const kit=readFileSync(new URL('../kit_ui_v06.mjs',import.meta.url),'utf8');
 const all=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(all.length,new Set(all).size);
 for(const id of ['v20-source-catalog','v20-primary','v20-secondary','v20-use','v20-export',
  'v20-official-source','v20-compare-toggle','v20-compare-table','v20-linked','v20-status'])
  assert.ok(all.includes(id),'Missing '+id);
 assert.ok(html.includes('sourcing_ui_v20.mjs')&&html.includes('source_catalog_v20.css'));
 assert.ok(html.includes('<details id="v20-source-catalog"'));
 assert.ok(ui.includes('createSourcingResearchPacket'));
 assert.ok(ui.includes('aeroforge:sourcing-reference-selected'));
 assert.ok(kit.includes('attachSourcingReference'));
 assert.ok(kit.includes('sourcingSku=null'));
});
