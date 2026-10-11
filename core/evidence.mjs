// An evidence trail is NOT a shopping catalog. These are possible real-world analogues for
// synthetic slot types, kept separate so a part is never silently substituted for a generic.
// Statements reflect limited public manufacturer/distributor documentation consulted 2026-10-10.
// Physical fit, availability, current pricing and electrical integration are NOT validated.
export const candidateEvidence=[
 {id:'source-one-v5',slot:'frame',illustrativeId:'kestrel',name:'TBS Source One V5 5-inch frame',status:'research-only',sourceType:'vendor specification',url:'https://www.lumenier.com/products/tbs-source-one-v5-5-frame-kit',retrieved:'2026-10-10',facts:['226 mm motor diagonal','30.5 × 30.5 mm or 20 × 20 mm stack mounts','123.5 g vendor-listed frame weight'],unknowns:['Exact supplied revision (V5 vs V5.1)','Motor pattern and fastener depths on chosen SKU','Camera and battery clearance after assembly']},
 {id:'speedybee-f405-v4',slot:'stack',illustrativeId:'f405',name:'SpeedyBee F405 V4 BLS 55A stack',status:'discontinued-check-alternatives',sourceType:'manufacturer specification',url:'https://www.speedybee.com/speedybee-f405-v4-bls-55a-30x30-fc-esc-stack/',retrieved:'2026-10-10',facts:['FC + ESC: 30.5 × 30.5 mm pattern','3S–6S input; 55 A × 4 continuous ESC specification','5 V and 9 V regulator rails'],unknowns:['Manufacturer indicates this SKU is discontinued','Flight-control target and current firmware distribution','Connector/air-unit version compatibility and total BEC loads']}
];
export function findEvidence(slot,illustrativeId){return candidateEvidence.filter(x=>x.slot===slot&&x.illustrativeId===illustrativeId);}
export function evidenceIntegrity(){return candidateEvidence.every(x=>x.id&&x.url.startsWith('https://')&&x.unknowns.length&&x.retrieved&&x.status!=='verified-for-build');}
