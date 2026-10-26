#!/usr/bin/env python3
"""v3.5: recover real STEP/XCAF source assembly instance names, preserve 244 solids.

The original STEP file is required. XCAF source occurrence order is independently
cross-checked against the SHA-linked v2.8 244-solid flat source inventory.
Labels are NOT authenticated BOM entries or sufficient replacement clearance.
"""
import argparse,hashlib,json,math
from pathlib import Path

FRAME_SHA="e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360"
MOTOR_SHA="ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15"
SCHEMA="aeroforge/x500-xcaf-assembly-identity/v3.5"
def demand(ok,reason):
 if not ok:raise ValueError(reason)
def digest(p):
 with Path(p).open("rb") as f:return hashlib.file_digest(f,"sha256").hexdigest()
def source(path,name,sha):
 p=Path(path)
 demand(p.is_file() and not p.is_symlink() and p.name==name and
        p.stat().st_size<120_000_000 and digest(p)==sha,
        "Unchanged original STEP source required: "+name)
def json_input(path,maximum):
 p=Path(path)
 demand(p.is_file() and not p.is_symlink() and p.stat().st_size<=maximum,
        "Missing source-linked input report")
 return json.loads(p.read_bytes())
def xcaf(frame,inventory):
 from OCP.STEPCAFControl import STEPCAFControl_Reader
 from OCP.TDocStd import TDocStd_Document
 from OCP.TCollection import TCollection_ExtendedString,TCollection_AsciiString
 from OCP.XCAFDoc import XCAFDoc_DocumentTool,XCAFDoc_ShapeTool
 from OCP.TDF import TDF_Label,TDF_LabelSequence,TDF_Tool
 from OCP.TDataStd import TDataStd_Name
 from OCP.TopLoc import TopLoc_Location
 from OCP.Bnd import Bnd_Box
 from OCP.BRepBndLib import BRepBndLib
 r=STEPCAFControl_Reader();r.SetNameMode(True)
 demand("RetDone" in str(r.ReadFile(str(frame))) and
        inventory.get("sha256")==FRAME_SHA and inventory.get("solidCount")==244
        and len(inventory.get("solids",[]))==244,
        "Original STEP / source flat inventory changed")
 doc=TDocStd_Document(TCollection_ExtendedString("XmlXCAF"))
 demand(r.Transfer(doc),"Original AP214 XCAF assembly transfer failed")
 tool=XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
 def ident(label):
  text=TCollection_AsciiString();TDF_Tool.Entry_s(label,text)
  return text.ToCString()
 def named(label):
  attr=TDataStd_Name()
  return attr.Get().ToExtString() if label.FindAttribute(TDataStd_Name.GetID_s(),attr) else None
 def bounds(shape):
  b=Bnd_Box();BRepBndLib.Add_s(shape,b,True)
  return [round(v,6) for v in b.Get()]
 top=TDF_LabelSequence();tool.GetFreeShapes(top)
 demand(top.Length()==1,"Expected one original source assembly root")
 root=top.Value(1)
 rootParts=TDF_LabelSequence();XCAFDoc_ShapeTool.GetComponents_s(root,rootParts,False)
 demand(rootParts.Length()==111,"Original source root assembly occurrences changed")
 leaves=[]
 def visit(label,prior,path,ids):
  ref=TDF_Label();isref=XCAFDoc_ShapeTool.GetReferredShape_s(label,ref)
  definition=ref if isref else label
  transform=prior.Multiplied(XCAFDoc_ShapeTool.GetShape_s(label).Location())
  name=named(label) or "UNNAMED"
  sequence=TDF_LabelSequence();XCAFDoc_ShapeTool.GetComponents_s(definition,sequence,False)
  if sequence.Length():
   for j in range(1,sequence.Length()+1):
    visit(sequence.Value(j),transform,path+[name],ids+[ident(label)])
  else:
   shape=XCAFDoc_ShapeTool.GetShape_s(definition).Moved(transform)
   leaves.append({"flatSolidIndex":len(leaves),
     "sourceComponentName":name,"sourceDefinitionName":named(definition),
     "sourceOccurrenceLabel":ident(label),"sourceDefinitionLabel":ident(definition),
     "assemblyPath":path+[name],"assemblyLabelPath":ids+[ident(label)],
     "sourceInstanceBoundsKernelMm":bounds(shape),
     "sourcePartCountOrRealPresenceVerified":False})
 for i in range(1,rootParts.Length()+1):
  visit(rootParts.Value(i),TopLoc_Location(),
        [named(root) or "ROOT"],[ident(root)])
 demand(len(leaves)==244,"Flat XCAF leaf count no longer matches source solids")
 aliases={188:137,189:56,190:110,191:83}
 largest=0
 for i,v in enumerate(leaves):
  flat=inventory["solids"][i]
  f=flat.get("boundsKernelMm")
  demand(flat.get("index")==i and isinstance(f,list) and len(f)==6
    and all(isinstance(y,(int,float)) and math.isfinite(y) for y in f),
    "Malformed original source-flat solid evidence")
  distance=lambda w:max(abs(a-b) for a,b in zip(f,w["sourceInstanceBoundsKernelMm"]))
  own=distance(v);closest=min(range(len(leaves)),key=lambda j:distance(leaves[j]))
  demand(closest in (i,aliases.get(i,i)) and own<=6,
    "XCAF-to-flat source-solid mapping order was not confirmed")
  v["flatIndexBoundingAabbDisagreementMm"]=round(own,6)
  v["nearestXcafLeafIndex"]=closest
  largest=max(largest,own)
 return leaves,rootParts.Length(),largest
def build(frame,motor,v28_path,v34_path):
 source(frame,"x500v2-frame.step",FRAME_SHA)
 source(motor,"AIR2216II_Motor_3D.STEP",MOTOR_SHA)
 v28=json_input(v28_path,2_000_000);v34=json_input(v34_path,100_000)
 demand(v34.get("schema")=="aeroforge/x500-source-occurrence-reconciliation/v3.4"
   and v34.get("source",{}).get("frameStepSha256")==FRAME_SHA
   and v34.get("source",{}).get("motorStepSha256")==MOTOR_SHA
   and v34.get("bomHierarchyVerified") is False and
   v34.get("physicalFitApproved") is False and
   v34.get("sourceModelRawPositiveOverlapCount")==13 and
   v34.get("geometryCanonicalPositiveOverlapCount")==9,
   "The exact prior collision and duplicate source evidence must remain unqualified")
 leaves,rootCount,maximum=xcaf(frame,v28)
 pairs=[[56,189],[83,191],[110,190],[137,188]]
 for a,b in pairs:
  x,y=leaves[a],leaves[b]
  demand(x["sourceDefinitionLabel"]==y["sourceDefinitionLabel"] and
         x["sourceComponentName"].startswith("DJ-2216-KV880") and
         y["sourceComponentName"].startswith("DJ-2216-KV880") and
         len(x["assemblyPath"])==3 and len(y["assemblyPath"])==2,
         "Reused source CAD motor geometry has unexpected assembly identities")
 namedMotors=[x for x in leaves if x["sourceComponentName"].startswith("DJ-2216-KV880")]
 demand(len(namedMotors)==8,"Expected eight original frame STEP motor-model leaf occurrences")
 collided=[]
 for group in v34["geometryCanonicalCollisionPairs"]:
  indices=group["originalFrameSolidIndices"]
  collided.append({"canonicalFrameSolidIndex":group["canonicalFrameSolidIndex"],
   "motorSolidIndex":group["motorSolidIndex"],
   "originalFrameSolidIndices":indices,
   "frameOccurrenceNames":[leaves[i]["sourceComponentName"] for i in indices],
   "frameAssemblyPaths":[leaves[i]["assemblyPath"] for i in indices],
   "conservativeModelOverlapMm3":group["maxReportedModelIntersectionMm3"],
   "sourceModelInterferencePresent":group["possibleModelCollision"],
   "selectedHardwareConfigurationVerified":False})
 demand(len(collided)==26 and sum(c["sourceModelInterferencePresent"] for c in collided)==9,
        "Original 26 distinct source collision groups must be retained")
 return {"schema":SCHEMA,"source":{
    "frameStepSha256":FRAME_SHA,"motorStepSha256":MOTOR_SHA,
    "sourceV34ByteSha256":digest(v34_path),
    "v28FlatInventoryByteSha256":digest(v28_path),
    "frameImportedSolids":244,"motorImportedSolids":4},
    "stepFileSchema":"AUTOMOTIVE_DESIGN_AP214",
    "sourceAssemblyName":"(Unsaved)","sourceRootComponentCount":rootCount,
    "flatSourceSolidCount":244,
    "flatIndexMappingMode":"XCAF_DEPTH_FIRST_LEAF_ORDER_CROSSCHECKED_244_AABB_MATCHES",
    "maxFlatToSourceAabbInflationDifferenceMm":round(maximum,6),
    "maxNearestLeafAabbInflationDifferenceMm":round(maximum,6),
    "sourceLeafInstances":leaves,
    "sourceNamedMotorModel":"DJ-2216-KV880",
    "frameStepMotorModelOccurrences":8,
    "frameStepCoincidentMotorModelPairs":pairs,
    "separateCandidateMotorSourceName":"AIR2216II",
    "frameStepMotorAndSeparateCandidateInterchangeabilityVerified":False,
    "frameStepMotorAndSeparateCandidateSamePartVerified":False,
    "installedMotorCountVerified":False,
    "sourceAssemblyOccurrenceTreeRecovered":True,
    "manufacturerBomIndependentlyVerified":False,
    "selectedAssemblyVariantIndependentlyVerified":False,
    "physicalMotorSeatQualified":False,"fastenerCompatibilityVerified":False,
    "sourceModelRawCollisionPositivePairs":13,
    "sourceModelDistinctPositiveGroups":9,
    "sourceModelInterferenceRemains":True,"collisionGroups":collided,
    "procurementApproved":False,"physicalFitApproved":False,
    "powerApproved":False,"flightApproved":False,
    "warning":"XCAF component names are source metadata, not a qualified OEM BOM. The frame STEP includes existing DJ-2216-KV880 motor geometry at four locations, represented twice per location. The separate AIR2216II STEP is an UNVERIFIED replacement candidate, not an automatically addable installed motor. Source model collisions remain unresolved."}
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for option in ("--frame-step","--motor-step","--v28-inventory","--v34","--out"):
  p.add_argument(option,type=Path,required=True)
 a=p.parse_args()
 demand(not a.out.exists(),"Refusing to overwrite earlier source audit")
 result=build(a.frame_step,a.motor_step,a.v28_inventory,a.v34)
 a.out.parent.mkdir(parents=True,exist_ok=True)
 a.out.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n")
 print("Source assembly",result["sourceRootComponentCount"],"roots / 244 leaves; 8 duplicate motor representations, no OEM part count approved")
if __name__=="__main__":main()
