#!/usr/bin/env python3
"""Produce conservative, exact-source X500 BREP mounting-*candidate* index.

Requires two full, separately saved BREP face inventories made from original
locally hash-matched STEP files by step_brep_feature_candidates_v28.py.
Every candidate is a cylindrical-face geometry pattern, NEVER a verified hole,
mounting pad, fastener, shaft, fit, or flight authorization. No source or
derived geometry is uploaded to the repository.
"""
import argparse
from collections import defaultdict
from itertools import combinations
import hashlib
import json
import math
from pathlib import Path

SCHEMA="aeroforge/x500-mount-feature-candidates/v2.9"
BREP_SCHEMA="aeroforge/step-brep-cylindrical-surface-candidates/v2.8"
HASHES={
    "frame":"e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360",
    "motor":"ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15",
}
NAMES={"frame":"x500v2-frame.step","motor":"AIR2216II_Motor_3D.STEP"}
def require(ok,message):
    if not ok:raise ValueError(message)
def round6(x):
    require(isinstance(x,(int,float)) and math.isfinite(x),"Nonfinite geometry")
    return round(x,6)
def load_brep(path,role):
    path=Path(path)
    require(path.is_file() and not path.is_symlink(),"BREP evidence must be a local regular JSON file")
    require(100<=path.stat().st_size<=15*1024*1024,"Unexpected BREP report size")
    raw=path.read_bytes()
    report=json.loads(raw)
    require(report.get("schema")==BREP_SCHEMA,"Wrong BREP report version")
    source=report.get("source",{})
    require(source.get("fileName")==NAMES[role] and source.get("sha256")==HASHES[role],
            role+" BREP report does not refer to the exact user-uploaded source")
    require(source.get("manufacturerSignatureVerified") is False and
            report.get("flightApproved") is False and
            report.get("holeOrBossClassificationApproved") is False,
            "Upgraded BREP trust claims are prohibited")
    items=report.get("candidateCylinders")
    require(isinstance(items,list) and 10<len(items)<20000 and
            report.get("cylindricalSurfaceFaceCount")==len(items),
            "Incomplete or malformed BREP candidate list")
    for item in items:
        require(isinstance(item.get("solidIndex"),int) and item["solidIndex"]>=0 and
                isinstance(item.get("faceIndex"),int) and item["faceIndex"]>=0 and
                isinstance(item.get("radiusKernelMm"),(int,float)) and
                0<item["radiusKernelMm"]<10000 and
                isinstance(item.get("axisDirectionKernel"),list) and
                len(item["axisDirectionKernel"])==3 and
                isinstance(item.get("axisLocationKernelMm"),list) and
                len(item["axisLocationKernelMm"])==3,
                "Invalid BREP face evidence")
        for x in item["axisDirectionKernel"]+item["axisLocationKernelMm"]:
            round6(x)
    return report,hashlib.sha256(raw).hexdigest()

def keyed_points(items,axis,radius):
    """Do not count repeated faces of the same infinite cylinder axis as holes."""
    out=defaultdict(dict)
    remaining=[i for i in range(3) if i!=axis]
    for face in items:
        direction=face["axisDirectionKernel"]
        if abs(abs(direction[axis])-1)>.00001:continue
        if any(abs(direction[a])>.00001 for a in remaining):continue
        if abs(face["radiusKernelMm"]-radius)>.00002:continue
        coords=tuple(round(face["axisLocationKernelMm"][a],3) for a in remaining)
        key=(face["solidIndex"],coords)
        out[key[0]].setdefault(coords,[]).append(face)
    return out

def pattern_is_19mm_diagonal(pts):
    ds=sorted(math.dist(p,q) for p,q in combinations(pts,2))
    expected_side=19/math.sqrt(2)
    return all(abs(d-expected_side)<.035 for d in ds[:4]) and all(abs(d-19)<.035 for d in ds[4:])

def frame_candidates(report):
    groups=keyed_points(report["candidateCylinders"],1,2.9)
    found={}
    for solid,lines in sorted(groups.items()):
        if len(lines)>24:continue  # never truncate and silently assert a pattern
        for quartet in combinations(sorted(lines),4):
            if not pattern_is_19mm_diagonal(quartet):continue
            cx=sum(p[0] for p in quartet)/4
            cz=sum(p[1] for p in quartet)/4
            if math.hypot(cx,cz)<230:continue
            quadrant=("+" if cx>0 else "-")+("+" if cz>0 else "-")
            if quadrant in found:continue
            faces=sorted({int(f["faceIndex"]) for p in quartet for f in lines[p]})
            found[quadrant]={
                "id":"frame-quadrant-"+quadrant.replace("+","p").replace("-","n"),
                "role":"frame","featureKind":"CYLINDRICAL_FACE_SQUARE_CANDIDATE",
                "sourceNativeAxis":"Y",
                "centerTransverseMm":[round6(cx),round6(cz)],
                "axialCoordinateMm":None,
                "displayPointNativeMm":[round6(cx),None,round6(cz)],
                "solidIndex":solid,"supportingFaceIndices":faces,
                "cylinderRadiusMm":2.9,"squareSideMm":round6(19/math.sqrt(2)),
                "squareDiagonalMm":19,
                "surfaceClassification":"UNLABELED_NOT_VERIFIED_MOUNT_HOLES",
            }
    require(set(found)=={"++","+-","-+","--"},
            "Expected four distinct outer frame geometric quartets; no partial result allowed")
    return [found[k] for k in ("--","-+","++","+-")]

def motor_candidates(report):
    groups=keyed_points(report["candidateCylinders"],0,1.25)
    candidates=[]
    for solid,lines in sorted(groups.items()):
        if len(lines)>32:continue
        coords=sorted(lines)
        pairs={}
        for a,b in combinations(coords,2):
            d=math.dist(a,b)
            for target in (16,19):
                if abs(d-target)<.03:
                    mid=((a[0]+b[0])/2,(a[1]+b[1])/2)
                    pairs.setdefault(target,[]).append((a,b,mid))
        for a,b in combinations(pairs.get(16,[]),pairs.get(19,[])):
            if set(a[:2]) & set(b[:2]):continue
            if math.dist(a[2],b[2])>.02:continue
            y=(a[2][0]+b[2][0])/2
            z=(a[2][1]+b[2][1])/2
            evidence=[]
            for target,pair in ((16,a),(19,b)):
                evidence.append({
                    "centerDistanceMm":target,
                    "endpointsTransverseMm":[list(pair[0]),list(pair[1])],
                    "supportingFaceIndices":sorted({f["faceIndex"] for c in pair[:2] for f in lines[c]}),
                })
            candidates.append({
                "id":"motor-coaxial-16-19-pairs","role":"motor",
                "featureKind":"TWO_COAXIAL_CYLINDER_AXIS_PAIRS",
                "sourceNativeAxis":"X",
                "centerTransverseMm":[round6(y),round6(z)],
                "axialCoordinateMm":None,
                "displayPointNativeMm":[None,round6(y),round6(z)],
                "solidIndex":solid,"cylinderRadiusMm":1.25,
                "supportingPairs":evidence,
                "surfaceClassification":"UNLABELED_NOT_VERIFIED_FASTENER_HOLES_OR_SHAFT",
            })
    require(len(candidates)==1,"Expected exactly one motor 16+19 mm paired-face geometry candidate")
    return candidates

def build(frame_path,motor_path):
    f,f_digest=load_brep(frame_path,"frame")
    m,m_digest=load_brep(motor_path,"motor")
    features=frame_candidates(f)+motor_candidates(m)
    require(len(features)==5 and len({x["id"] for x in features})==5,
            "Unqualified feature count changed")
    return {
        "schema":SCHEMA,
        "source":{"frameSha256":HASHES["frame"],"motorSha256":HASHES["motor"],
            "frameBrepReportSha256":f_digest,"motorBrepReportSha256":m_digest,
            "frameSolidCount":f["solidCount"],"motorSolidCount":m["solidCount"]},
        "candidateCount":len(features),"candidates":features,
        "algorithm":"PROJECT_SOURCE_CYLINDER_AXIS_LINES_FIND_4_SQUARE_19MM_DIAGONALS_AND_2_MOTOR_OPPOSITE_PAIRS",
        "candidateCoordinatesAreSourceNativeAndUnregistered":True,
        "axialFaceCoordinatesAreNotInferred":True,
        "independentMountMeasurement":False,
        "mountingHoleIdentityApproved":False,
        "motorShaftAxisApproved":False,
        "tolerancedFitTested":False,
        "procurementApproved":False,"powerApproved":False,"flightApproved":False,
        "warning":"Geometric cylinder-axis patterns detected in operator CAD. The square has a 19 mm DIAGONAL, NOT a 19 mm side. Motor pairs span 16 and 19 mm; none proves which are threaded holes, receiving surfaces, axial mating positions, or physical compatibility.",
    }

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--frame-brep",type=Path,required=True)
    p.add_argument("--motor-brep",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    if args.out.exists():p.error("Refusing to overwrite an existing candidate report")
    result=build(args.frame_brep,args.motor_brep)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print("Created",len(result["candidates"]),"UNQUALIFIED BREP mounting pattern candidates:",args.out)

if __name__=="__main__":
    main()
