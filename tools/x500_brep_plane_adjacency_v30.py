#!/usr/bin/env python3
"""v3.0: exact-source CAD BREP cylindrical-to-planar face topology study.

No inferred mating datums. STEP solids/faces indexed under the current CadQuery/OCP
import only. Neighboring planar faces MUST share a TopoDS edge with each cited
cylinder face. Nearby/parallel planes without that edge are recorded separately
and never upgraded to connected surfaces.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

SCHEMA="aeroforge/x500-brep-plane-adjacency/v3.0"
CANDIDATES_SCHEMA="aeroforge/x500-mount-feature-candidates/v2.9"
EXPECTED={
 "frame":("x500v2-frame.step","e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360",244),
 "motor":("AIR2216II_Motor_3D.STEP","ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15",4),
}
def require(ok,why):
 if not ok:raise ValueError(why)
def digest(path):
 with Path(path).open("rb") as f:return hashlib.file_digest(f,"sha256").hexdigest()
def xyz(p):
 return [round(v,6) for v in (p.X(),p.Y(),p.Z())]
def cylinder_indices(c):
 if c["role"]=="frame":return sorted(set(c["supportingFaceIndices"]))
 return sorted(set(i for pair in c["supportingPairs"] for i in pair["supportingFaceIndices"]))
def validate_report(candidate_path):
 p=Path(candidate_path)
 require(p.is_file() and p.stat().st_size<=256*1024,"Missing or oversize local candidate report")
 raw=p.read_bytes();doc=json.loads(raw)
 require(doc.get("schema")==CANDIDATES_SCHEMA,"Wrong version of candidate report")
 src=doc.get("source",{})
 require(src.get("frameSha256")==EXPECTED["frame"][1] and
         src.get("motorSha256")==EXPECTED["motor"][1],"Candidate source fingerprints do not agree")
 for key in ("mountingHoleIdentityApproved","motorShaftAxisApproved",
             "tolerancedFitTested","procurementApproved","powerApproved","flightApproved"):
  require(doc.get(key) is False,"Candidate report asserts unauthorized physical approval")
 items=doc.get("candidates",[])
 require(len(items)==5 and doc.get("candidateCount")==5,"Incomplete candidate report")
 ids={c.get("id") for c in items}
 require(ids=={"frame-quadrant-nn","frame-quadrant-np","frame-quadrant-pn",
               "frame-quadrant-pp","motor-coaxial-16-19-pairs"},
         "Candidate identity set is incomplete or duplicated")
 return doc,hashlib.sha256(raw).hexdigest()
def import_solids(source,role):
 name,sha,count=EXPECTED[role];p=Path(source)
 require(p.is_file() and not p.is_symlink() and p.name==name,"Original STEP name/file required")
 require(digest(p)==sha,"Original STEP bytes differ from operator-verified source fingerprint")
 try:import cadquery as cq
 except ImportError as e:raise RuntimeError("CadQuery/OCP required for real BREP inspection") from e
 imported=cq.importers.importStep(str(p))
 solids=[]
 for obj in imported.objects:
  inner=list(obj.Solids());solids.extend(inner if inner else [obj])
 require(len(solids)==count,"STEP solid hierarchy changed")
 return solids
def per_candidate(solids,c):
 from OCP.BRepAdaptor import BRepAdaptor_Surface
 from OCP.GeomAbs import GeomAbs_Plane,GeomAbs_Cylinder
 role=c["role"];solidIndex=c["solidIndex"];require(isinstance(solidIndex,int) and
   0<=solidIndex<len(solids),"Invalid source solid index")
 faces=solids[solidIndex].Faces()
 ids=cylinder_indices(c)
 require(4<=len(ids)<=32 and len(set(ids))==len(ids),"Missing or duplicated cylindrical faces")
 center=c["centerTransverseMm"];require(len(center)==2 and all(math.isfinite(x) for x in center),"Invalid transverse center")
 mainAxis=1 if role=="frame" else 0
 cylinder_evidence=[]
 connected={} # plane id -> set of cylinder face indices
 for i in ids:
  require(isinstance(i,int) and 0<=i<len(faces),"Invalid source face index")
  cyl=faces[i];ad=BRepAdaptor_Surface(cyl.wrapped)
  require(ad.GetType()==GeomAbs_Cylinder,"Candidate index no longer points to a BREP cylinder")
  cylinder=ad.Cylinder();normal=xyz(cylinder.Axis().Direction())
  require(abs(abs(normal[mainAxis])-1)<.0001 and
          all(abs(normal[k])<.0001 for k in range(3) if k!=mainAxis),
          "Cylinder axis not aligned with declared source-native pattern")
  radius=cylinder.Radius()
  require(abs(radius-c["cylinderRadiusMm"])<.005,"Source cylinder radius changed")
  loc=xyz(cylinder.Axis().Location())
  other=[k for k in range(3) if k!=mainAxis]
  projected=[loc[k] for k in other]
  if role=="frame":
   require(abs(math.dist(projected,center)-9.5)<.03,
          "Frame cylinder is not on the 19 mm diagonal face family")
  else:
   endpoints=[pt for pair in c["supportingPairs"] for pt in pair["endpointsTransverseMm"]]
   require(any(math.dist(projected,q)<.03 for q in endpoints),
          "Motor cylinder is not on the declared 16/19 opposite-axis face pairs")
  shape_edges=cyl.Edges();neighbors=[]
  for j,face in enumerate(faces):
   if j==i:continue
   plane=BRepAdaptor_Surface(face.wrapped)
   if plane.GetType()!=GeomAbs_Plane:continue
   shared=sum(1 for edge in face.Edges()
              if any(edge.wrapped.IsSame(candidate.wrapped) for candidate in shape_edges))
   if not shared:continue
   direction=xyz(plane.Plane().Axis().Direction())
   plane_point=xyz(plane.Plane().Location())
   axial_normal=abs(direction[mainAxis])>.9999
   datum={
    "faceIndex":j,"sharedTopoDsEdgeCount":shared,
    "planeLocationNativeMm":plane_point,
    "planeNormalNative":direction,
    "planarFaceAreaKernelMm2":round(face.Area(),6),
    "normalParallelToCylinderAxis":axial_normal,
    "planeAxialCoordinateMm":round(plane_point[mainAxis],6) if axial_normal else None,
   }
   neighbors.append(datum)
   if axial_normal:connected.setdefault(j,{"face":datum,"touching":set()})["touching"].add(i)
  cylinder_evidence.append({
   "faceIndex":i,"radiusKernelMm":round(radius,6),
   "cylinderAxisLocationNativeMm":loc,
   "cylinderAxisUnitDirection":normal,
   "edgeAdjacentPlanarFaces":neighbors,
   "surfaceClassifiedAsFastenerHole":False,
  })
 common=[{**v["face"],"touchingCylinderFaceIndices":sorted(v["touching"])}
         for v in connected.values() if len(v["touching"])==len(ids)]
 common.sort(key=lambda x:x["planeAxialCoordinateMm"])
 nearby=[]
 for j,face in enumerate(faces):
  plane=BRepAdaptor_Surface(face.wrapped)
  if plane.GetType()!=GeomAbs_Plane:continue
  normal=xyz(plane.Plane().Axis().Direction())
  if abs(normal[mainAxis])<.9999:continue
  transverse=[face.Center().toTuple()[k] for k in range(3) if k!=mainAxis]
  delta=math.dist(transverse,center)
  if delta>32:continue
  nearby.append({"faceIndex":j,"distanceToPatternCenterTransverseMm":round(delta,6),
    "planeAxialCoordinateMm":round(xyz(plane.Plane().Location())[mainAxis],6),
    "areaKernelMm2":round(face.Area(),6),
    "connectsToEverySelectedCylinder":j in {x["faceIndex"] for x in common}})
 nearby.sort(key=lambda x:(x["distanceToPatternCenterTransverseMm"],-x["areaKernelMm2"]))
 return {
  "candidateId":c["id"],"role":role,"sourceSolidIndex":solidIndex,
  "sourceNativeAxialDimension":"Y" if role=="frame" else "X",
  "sourceTransverseCenterMm":[round(x,6) for x in center],
  "supportCylinderFaceIndices":ids,"supportCylinderFaceCount":len(ids),
  "cylinderSurfaceTopology":cylinder_evidence,
  "commonEdgeAdjacentAxialPlanes":common,
  "nearbyAxisNormalPlaneCandidates":nearby[:16],
  "topologyFinding":"COMMON_PLANAR_EDGES_OBSERVED" if common else "NO_COMMON_AXIAL_PLANE_SHARED_BY_ALL_CYLINDER_FACES",
  "matingFaceVerified":False,"fastenerHoleIdentityVerified":False,
  "axialMountingPositionQualified":False,
 }
def build(frame_step,motor_step,candidate_path):
 report,receipt=validate_report(candidate_path)
 loaded={"frame":import_solids(frame_step,"frame"),"motor":import_solids(motor_step,"motor")}
 rows=[per_candidate(loaded[c["role"]],c) for c in report["candidates"]]
 return {
  "schema":SCHEMA,
  "source":{"frameStepSha256":EXPECTED["frame"][1],
   "motorStepSha256":EXPECTED["motor"][1],
   "sourceCandidateReportSha256":receipt,
   "sourceUnitsAreCadNativeNotIndependentlyMetrologized":True},
  "candidates":rows,"candidateCount":len(rows),
  "topologicalSharedEdgesTested":True,
  "verifiedPhysicalMountingFaceCount":0,
  "verifiedPhysicalFastenerHoleCount":0,
  "sourceIdentityManufacturerAuthenticated":False,
  "independentDatumInspection":False,
  "tolerancedFitTested":False,"collisionCertified":False,
  "procurementApproved":False,"powerApproved":False,"flightApproved":False,
  "warning":"BREP shared-edge topology establishes surface adjacency only. It does not establish a mounting face, threaded hole, axial motor seat, toleranced fit, CAD export revision compatibility or flight readiness.",
 }
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--frame-step",type=Path,required=True)
 p.add_argument("--motor-step",type=Path,required=True)
 p.add_argument("--candidates",type=Path,required=True)
 p.add_argument("--out",type=Path,required=True)
 args=p.parse_args()
 if args.out.exists():p.error("Evidence destination already exists; refusing to overwrite")
 result=build(args.frame_step,args.motor_step,args.candidates)
 args.out.parent.mkdir(parents=True,exist_ok=True)
 args.out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
 print("Source-bound BREP adjacency reviewed:",result["candidateCount"],
   "patterns; VERIFIED MECHANICAL MATES: 0")
if __name__=="__main__":main()
