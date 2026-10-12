#!/usr/bin/env python3
"""v3.1 exact-source BREP obround and split-cylinder contour audit.

Operate only on operator-acquired original STEP bytes and the v2.9/v3.0 report
chain. CAD-native contours are not licensed OEM approval or physical fit.
"""
import argparse
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

SCHEMA = "aeroforge/x500-brep-contour-groups/v3.1"
ORIGINAL = {
    "frame": ("x500v2-frame.step",
              "e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360", 244),
    "motor": ("AIR2216II_Motor_3D.STEP",
              "ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15", 4),
}

def require(cond,why):
    if not cond: raise ValueError(why)

def fingerprint(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream,"sha256").hexdigest()

def xyz(p):
    return [round(float(v),6) for v in (p.X(),p.Y(),p.Z())]

def near(x,y,tol=.02):
    return math.isfinite(x) and abs(x-y)<=tol

def recognize_obround(edges,radius,straight):
    """Pure topological contour invariant, independent of labels and CAD engine."""
    if len(edges)!=4:return None
    arcs=[e for e in edges if e.get("type")=="CIRCLE"]
    segments=[e for e in edges if e.get("type")=="LINE"]
    if len(arcs)!=2 or len(segments)!=2:return None
    if not all(near(a["radiusMm"],radius,.002) and
               near(a["lengthMm"],math.pi*radius,.004) for a in arcs):return None
    if not all(near(e["lengthMm"],straight,.004) for e in segments):return None
    if not near(math.dist(arcs[0]["centerMm"],arcs[1]["centerMm"]),straight,.005):
        return None
    center=[round((a+b)/2,6) for a,b in zip(arcs[0]["centerMm"],arcs[1]["centerMm"])]
    return {"kind":"CLOSED_OBROUND_INNER_WIRE_CANDIDATE",
            "nativeCenterMm":center,"nominalContourRadiusMm":radius,
            "nominalWidthMm":round(2*radius,6),
            "nominalLengthMm":round(2*radius+straight,6),
            "straightSectionMm":straight,
            "fastenerHoleIdentityVerified":False}

def import_solids(source,role):
    import cadquery as cq
    expected_name,expected_hash,expected_count=ORIGINAL[role]
    source=Path(source)
    require(source.is_file() and not source.is_symlink() and
            source.name==expected_name,"Original "+role+" STEP filename/file required")
    require(source.stat().st_size<=120*1024*1024 and
            fingerprint(source)==expected_hash,role+" original STEP bytes changed")
    imported=cq.importers.importStep(str(source))
    solids=[]
    for obj in imported.objects:
        contents=list(obj.Solids())
        solids.extend(contents if contents else [obj])
    require(len(solids)==expected_count,role+" CAD solid order/count changed")
    return solids

def frame_obround_wires(solid,candidate):
    from OCP.BRepAdaptor import BRepAdaptor_Surface,BRepAdaptor_Curve
    from OCP.BRepTools import BRepTools
    from OCP.GeomAbs import GeomAbs_Plane,GeomAbs_Circle,GeomAbs_Line
    faces=solid.Faces()
    require(len(candidate["supportingFaceIndices"])==4,"Four source frame cylinder faces required")
    observations=[]
    for plane_id in (105,103):
        planar=faces[plane_id]
        adap=BRepAdaptor_Surface(planar.wrapped)
        require(adap.GetType()==GeomAbs_Plane,"Frame source face stopped being planar")
        native_y=adap.Plane().Location().Y()
        require(near(native_y,15.5,.002) or near(native_y,17,.002),
                "Frame plane axial coordinate changed")
        outer=BRepTools.OuterWire_s(planar.wrapped)
        located=[]
        for wire_index,wire in enumerate(planar.Wires()):
            if wire.wrapped.IsSame(outer):continue
            require(wire.IsClosed(),"Frame loop not topologically closed")
            edges=wire.Edges()
            segments=[]
            for edge in edges:
                curve=BRepAdaptor_Curve(edge.wrapped)
                if curve.GetType()==GeomAbs_Circle:
                    circle=curve.Circle()
                    segments.append({"type":"CIRCLE","radiusMm":circle.Radius(),
                                     "lengthMm":edge.Length(),
                                     "centerMm":xyz(circle.Location())})
                elif curve.GetType()==GeomAbs_Line:
                    segments.append({"type":"LINE","lengthMm":edge.Length()})
                else:
                    segments.append({"type":"OTHER"})
            found=recognize_obround(segments,2.9,1.5)
            if found is None:continue
            matched=[]
            for face_id in candidate["supportingFaceIndices"]:
                if any(a.wrapped.IsSame(b.wrapped)
                       for a in faces[face_id].Edges() for b in edges):
                    matched.append(face_id)
            require(len(matched)==1,
                    "Each inner obround wire must meet exactly one selected frame cylinder")
            found.update({"sourcePlaneFaceIndex":plane_id,"wireIndex":wire_index,
                          "sourceNativeAxialMm":round(native_y,6),
                          "selectedCylinderFaceIndex":matched[0],
                          "verifiedPhysicalMount":False})
            located.append(found)
        require(len(located)==4 and
                {x["selectedCylinderFaceIndex"] for x in located}==
                set(candidate["supportingFaceIndices"]),
                "Four unique source obround loops on both frame planes required")
        # Source BREP circle-axis sites are 9.5 mm from the center, whereas
        # the complete obround wire centers lie 8.75 mm from the center.
        for o in located:
            radial=math.dist([o["nativeCenterMm"][0],o["nativeCenterMm"][2]],
                             candidate["centerTransverseMm"])
            require(near(radial,8.75,.02),"Actual slot centers moved in source CAD")
        observations.extend(located)
    # Both physical plate faces must describe the very same four obround
    # transverse centers; a pattern coincidence on only one side is insufficient.
    for cylinder_id in candidate["supportingFaceIndices"]:
        twins=[x for x in observations if x["selectedCylinderFaceIndex"]==cylinder_id]
        require(len(twins)==2 and
                math.dist([twins[0]["nativeCenterMm"][i] for i in (0,2)],
                          [twins[1]["nativeCenterMm"][i] for i in (0,2)])<.002,
                "Source obround contours disagree across plate thickness")
    return {"id":candidate["id"],"sourceSolidIndex":candidate["solidIndex"],
            "shapeFamily":"FOUR_OBROUND_SLOT_CONTOURS",
            "sourcePlaneWireContours":observations,"planeFaceIndices":[105,103],
            "nominalContourRadiusMm":2.9,"nominalContourStraightSegmentMm":1.5,
            "nominalContourWidthMm":5.8,"nominalContourLengthMm":7.3,
            "sourceNativePlateThicknessMm":1.5,
            "slotCenterRadialDistanceFromPatternCenterMm":8.75,
            "verifiedFastenerHoleIdentity":False,"contactFaceQualified":False,
            "fitTested":False}

def motor_split_circular_passages(solid,candidate):
    from OCP.BRepAdaptor import BRepAdaptor_Surface,BRepAdaptor_Curve
    from OCP.GeomAbs import GeomAbs_Cylinder,GeomAbs_Circle
    from cadquery import Vector
    faces=solid.Faces()
    ids=sorted({i for pair in candidate["supportingPairs"]
                for i in pair["supportingFaceIndices"]})
    require(len(ids)==8,"Expected eight original motor half-cylinder faces")
    groups=defaultdict(list)
    for face_id in ids:
        adapter=BRepAdaptor_Surface(faces[face_id].wrapped)
        require(adapter.GetType()==GeomAbs_Cylinder,
                "Original motor surface changed from cylindrical to another type")
        cylinder=adapter.Cylinder()
        direction=cylinder.Axis().Direction()
        require(near(cylinder.Radius(),1.25,.001) and
                near(abs(direction.X()),1,.00001) and
                near(direction.Y(),0,.00001) and near(direction.Z(),0,.00001),
                "Unexpected motor native cylinder radius or axis")
        require(near(adapter.LastUParameter()-adapter.FirstUParameter(),math.pi,.0001)
                and near(adapter.LastVParameter()-adapter.FirstVParameter(),2.3,.001),
                "Original motor half-cylinder parameters changed")
        key=(round(cylinder.Axis().Location().Y(),3),
             round(cylinder.Axis().Location().Z(),3))
        groups[key].append(face_id)
    require(len(groups)==4 and all(len(group)==2 for group in groups.values()),
            "Motor face fragments do not pair into four cylinder axes")
    passage=[]
    for center,parts in sorted(groups.items()):
        left,right=(faces[i] for i in parts)
        shared=[a for a in left.Edges() for b in right.Edges()
                if a.wrapped.IsSame(b.wrapped)]
        require(len(shared)==2 and all(near(x.Length(),2.3,.001) for x in shared),
                "Motor circular faces lack both longitudinal shared-seam edges")
        cap_arcs=defaultdict(list)
        for face_id in parts:
            for edge in faces[face_id].Edges():
                curve=BRepAdaptor_Curve(edge.wrapped)
                if curve.GetType()!=GeomAbs_Circle:continue
                circ=curve.Circle()
                require(near(circ.Radius(),1.25,.001) and
                        near(edge.Length(),math.pi*1.25,.004),
                        "Motor cap arc is not a semicircle of radius 1.25 mm")
                cap_arcs[round(circ.Location().X(),4)].append(face_id)
        require(len(cap_arcs)==2 and all(len(v)==2 for v in cap_arcs.values()),
                "Motor end contours are not two complementary semicircles")
        extents=sorted(cap_arcs)
        require(near(extents[1]-extents[0],2.3,.002),
                "Native motor circular passage axial extent changed")
        middle=sum(extents)/2
        empty=not solid.isInside(Vector(middle,center[0],center[1]),.001)
        surrounding=[solid.isInside(Vector(middle,center[0]+dy,center[1]+dz),.001)
                     for dy,dz in ((1.4,0),(-1.4,0),(0,1.4),(0,-1.4))]
        require(empty and all(surrounding),
                "Motor axis is not an empty passage surrounded by solid material")
        passage.append({"centerTransverseNativeMm":list(center),
                        "sourceFaceIndices":sorted(parts),
                        "circularWallRadiusMm":1.25,"circularWallDiameterMm":2.5,
                        "sourceAxialStartMm":extents[0],"sourceAxialEndMm":extents[1],
                        "sourceAxialLengthMm":2.3,
                        "sharedLongitudinalSeamEdges":2,"pairedSemicircularCapArcs":4,
                        "centerEmptyInSourceSolid":True,"surroundingMaterialSampleCount":4,
                        "type":"SOURCE_SPLIT_FACE_CIRCULAR_PASSAGE",
                        "confirmedThreadedHole":False,"fastenerEngagementVerified":False})
    distances=[math.dist(a["centerTransverseNativeMm"],b["centerTransverseNativeMm"])
               for a in passage for b in passage if a is not b]
    require(any(near(d,16,.04) for d in distances) and
            any(near(d,19,.04) for d in distances),
            "Original motor candidate 16/19 mm pair geometry changed")
    return {"id":candidate["id"],"sourceSolidIndex":candidate["solidIndex"],
            "shapeFamily":"FOUR_SPLIT_FACE_CIRCULAR_PASSAGES",
            "candidatePassageCount":4,"candidatePassages":passage,
            "nominal16And19MmPairsObserved":True,
            "motorMountingFaceVerified":False,"threadSpecificationVerified":False,
            "physicalFitTested":False}

def build(frame_step,motor_step,candidates_path,topology_path):
    source_files=[Path(candidates_path),Path(topology_path)]
    for p in source_files:
        require(p.is_file() and not p.is_symlink() and 100<p.stat().st_size<512*1024,
                "Missing or oversized private evidence report")
    candidate_bytes,topology_bytes=(p.read_bytes() for p in source_files)
    cand=json.loads(candidate_bytes);topo=json.loads(topology_bytes)
    require(cand.get("schema")=="aeroforge/x500-mount-feature-candidates/v2.9" and
            topo.get("schema")=="aeroforge/x500-brep-plane-adjacency/v3.0",
            "Unknown linked original source evidence")
    require(topo["source"]["sourceCandidateReportSha256"]==
            hashlib.sha256(candidate_bytes).hexdigest(),
            "v3.0 report does not bind exact v2.9 report bytes")
    require(cand["source"]["frameSha256"]==ORIGINAL["frame"][1] and
            cand["source"]["motorSha256"]==ORIGINAL["motor"][1] and
            topo["source"]["frameStepSha256"]==ORIGINAL["frame"][1] and
            topo["source"]["motorStepSha256"]==ORIGINAL["motor"][1],
            "CAD report references another original source pair")
    for report in (cand,topo):
        for key in ("procurementApproved","powerApproved","flightApproved"):
            require(report[key] is False,"Report asserts unauthorized "+key)
    require(cand.get("candidateCount")==5 and topo.get("candidateCount")==5 and
            topo.get("topologicalSharedEdgesTested") is True and
            topo.get("verifiedPhysicalMountingFaceCount")==0 and
            topo.get("verifiedPhysicalFastenerHoleCount")==0 and
            all(topo.get(k) is False for k in ("tolerancedFitTested","collisionCertified")),
            "Unsupported CAD topology result or claimed physical qualification")
    require(len(cand["candidates"])==5 and len(topo["candidates"])==5,
            "Incomplete candidate evidence family")
    loaded={"frame":import_solids(frame_step,"frame"),"motor":import_solids(motor_step,"motor")}
    observations=[]
    for c in cand["candidates"]:
        if c["role"]=="frame":
            observations.append(frame_obround_wires(loaded["frame"][c["solidIndex"]],c))
        elif c["role"]=="motor":
            observations.append(motor_split_circular_passages(loaded["motor"][c["solidIndex"]],c))
        else:raise ValueError("Unknown source part in candidate report")
    require(len(observations)==5 and
            sum(x["shapeFamily"]=="FOUR_OBROUND_SLOT_CONTOURS" for x in observations)==4 and
            sum(x["shapeFamily"]=="FOUR_SPLIT_FACE_CIRCULAR_PASSAGES" for x in observations)==1,
            "Incomplete or changed source contour family")
    return {
        "schema":SCHEMA,"candidateCount":5,"candidates":observations,
        "source":{"frameStepSha256":ORIGINAL["frame"][1],
                  "motorStepSha256":ORIGINAL["motor"][1],
                  "candidateReportSha256":hashlib.sha256(candidate_bytes).hexdigest(),
                  "topologyReportSha256":hashlib.sha256(topology_bytes).hexdigest()},
        "totalFrameObroundSlotsDetected":16,"motorCircularPassageCount":4,
        "sourceSolidsInterferenceTested":False,"relativeMatingPlaneVerified":False,
        "manufacturerOriginAuthenticated":False,"screwThreadsVerified":False,
        "independentlyMeasured":False,"tolerancedCompatibilityVerified":False,
        "physicalFitApproved":False,"procurementApproved":False,"powerApproved":False,
        "flightApproved":False,
        "warning":"Exact original BREP contours and void probes are research evidence, not a vendor revision signature, certified hole thread, mounting intent, actual face contact or toleranced fit."
    }

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for flag in ("--frame-step","--motor-step","--candidates","--topology","--out"):
        parser.add_argument(flag,required=True,type=Path)
    args=parser.parse_args()
    require(not args.out.exists(),"Refusing to overwrite an earlier CAD contour report")
    result=build(args.frame_step,args.motor_step,args.candidates,args.topology)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf8")
    print("CAD contours:",result["totalFrameObroundSlotsDetected"],"source obround slots and",
          result["motorCircularPassageCount"],"split-face circular passages; NO APPROVED FIT")
if __name__=="__main__":main()
