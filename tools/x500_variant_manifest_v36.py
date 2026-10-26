#!/usr/bin/env python3
"""v3.6 standalone original-report-linked assembly variant manifest generator.

Produces only an OFFLINE RESEARCH PLAN, not a modified STEP, an exact Boolean
result, a manufacturer BOM, a motor replacement approval or a physical fit.
Can be run without original STEP bytes because *their verified historical
reports* are already source-hashed. Never represent that as remeasurement.
"""
import argparse
import hashlib
import json
from pathlib import Path

FRAME_SHA='e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360'
MOTOR_SHA='ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15'
MODE_RETAIN='RETAIN_ORIGINAL_SOURCE_CAD_MOTOR'
MODE_REPLACE='HYPOTHETICAL_AIR2216II_REPLACEMENT'
SITES={
 'arm-1':(56,189,'HMX5V-ARM-V1_ASM:1'),
 'arm-2':(83,191,'HMX5V-ARM-V1_ASM:2'),
 'arm-3':(110,190,'HMX5V-ARM-V1_ASM:3'),
 'arm-4':(137,188,'HMX5V-ARM-V1_ASM:4'),
}
SCHEMA='aeroforge/x500-unqualified-assembly-variant-manifest/v3.6'
def require(ok,message):
 if not ok:raise ValueError(message)
def sha(path):
 with Path(path).open('rb') as stream:
  return hashlib.file_digest(stream,'sha256').hexdigest()
def read(path):
 file=Path(path)
 require(file.is_file() and not file.is_symlink() and
         100<file.stat().st_size<=1_000_000,'Missing or oversized private CAD evidence')
 return json.loads(file.read_bytes())
def build(v34_path,v35_path,mode,site_id):
 require(mode in (MODE_RETAIN,MODE_REPLACE),'Unsupported motor assembly mode')
 require(site_id in SITES,'Unknown original X500 arm position')
 v34=read(v34_path);v35=read(v35_path)
 require(v34.get('schema')=='aeroforge/x500-source-occurrence-reconciliation/v3.4'
  and v35.get('schema')=='aeroforge/x500-xcaf-assembly-identity/v3.5',
  'Original source occurrence/assembly evidence schemas required')
 require(v35.get('source',{}).get('sourceV34ByteSha256')==sha(v34_path) and
  v34.get('source',{}).get('frameStepSha256')==FRAME_SHA and
  v34.get('source',{}).get('motorStepSha256')==MOTOR_SHA and
  v35.get('source',{}).get('frameStepSha256')==FRAME_SHA and
  v35.get('source',{}).get('motorStepSha256')==MOTOR_SHA,
  'Byte-bound predecessor source report chain changed')
 for rep in (v34,v35):
  for key in ('physicalFitApproved','procurementApproved','powerApproved','flightApproved'):
   require(rep.get(key) is False,'Original source evidence claims unapproved physical fit')
 require(v35.get('frameStepMotorAndSeparateCandidateInterchangeabilityVerified') is False
  and v35.get('manufacturerBomIndependentlyVerified') is False
  and v35.get('installedMotorCountVerified') is False,
  'Original motor interchangeability or BOM cannot be assumed')
 leaves=v35.get('sourceLeafInstances')
 require(len(leaves)==244 and v35.get('sourceRootComponentCount')==111,
  'Incomplete original source assembly inventory')
 for candidate,(nested,top,arm) in SITES.items():
  p,q=leaves[nested],leaves[top]
  require(p['flatSolidIndex']==nested and q['flatSolidIndex']==top and
   p['sourceDefinitionLabel']==q['sourceDefinitionLabel'] and
   p['assemblyPath'][1]==arm and len(p['assemblyPath'])==3 and
   len(q['assemblyPath'])==2 and
   p['sourceComponentName'].startswith('DJ-2216-KV880:') and
   q['sourceComponentName'].startswith('DJ-2216-KV880:'),
   'A source motor identity/presence relationship was altered')
 rows=v35.get('collisionGroups',[])
 require(len(rows)==26 and sum(x['sourceModelInterferencePresent'] for x in rows)==9
  and v34.get('sourceModelRawPositiveOverlapCount')==13,
  'Historical BREP model collision observations cannot be omitted')
 allowed={39,56,57,58,59,60}
 require({x['canonicalFrameSolidIndex'] for x in rows
   if x['sourceModelInterferencePresent']}==allowed,
   'Historical positive source-solid families do not match original source')
 nested,top,arm=SITES[site_id];replacing=mode==MODE_REPLACE
 excluded=[nested,top] if replacing else []
 matched=replacing and site_id=='arm-1'
 historical=[r for r in rows
   if not set(r['originalFrameSolidIndices']).intersection(excluded)]
 if matched:
  require(len(historical)==22 and sum(r['sourceModelInterferencePresent'] for r in historical)==5,
   'Source-only hypothetical mask lost unresolved bracket or fastener geometry')
 return {
  'schema':SCHEMA,'authority':'SOURCE_REPORT_DERIVED_PLAN_ONLY',
  'source':{'frameStepSha256':FRAME_SHA,'motorStepSha256':MOTOR_SHA,
    'v34AuditByteSha256':sha(v34_path),'v35AssemblyByteSha256':sha(v35_path)},
  'mode':mode,'siteId':site_id,
  'originalMotorModel':'DJ-2216-KV880','candidateMotorModel':'AIR2216II' if replacing else None,
  'originalFrameSolidOccurrences':244,
  'excludedOriginalIndicesOnlyWithinHypotheticalModelMask':excluded,
  'originalCollisionRawPositiveComparisons':13,
  'originalCollisionDistinctPositiveGroups':9,
  'historicalComparisonApplicableOnlyToFirstArm':matched,
  'historicalGroupsAfterHypotheticalMask':len(historical) if matched else None,
  'historicalPositiveGroupsAfterMask':sum(
    x['sourceModelInterferencePresent'] for x in historical) if matched else None,
  'originalSourceFilesRehashedThisExecution':False,
  'originalCADModified':False,'exactBREPRecomputedOnVariant':False,
  'actualHardwareOrManufacturerBomVerified':False,'physicalFitApproved':False,
  'procurementApproved':False,'powerApproved':False,'flightApproved':False,
  'warning':'This report-derived scenario is NOT an exact Boolean evaluation on the modified source assembly, nor an approved real-world motor substitution. Source CAD and earlier collision measurements were not modified.'
 }
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--v34',type=Path,required=True)
 p.add_argument('--v35',type=Path,required=True)
 p.add_argument('--mode',choices=[MODE_RETAIN,MODE_REPLACE],required=True)
 p.add_argument('--site',choices=list(SITES),required=True)
 p.add_argument('--out',type=Path,required=True)
 a=p.parse_args()
 require(not a.out.exists(),'Refusing to overwrite original source-derived variant evidence')
 result=build(a.v34,a.v35,a.mode,a.site)
 a.out.parent.mkdir(parents=True,exist_ok=True)
 a.out.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n',encoding='utf8')
 print('Variant plan saved. No original STEP geometry changed, no fresh Boolean clearance, no physical approvals.')
if __name__=='__main__':
 main()
