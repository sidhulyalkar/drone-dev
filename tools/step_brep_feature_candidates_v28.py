#!/usr/bin/env python3
"""Audit exact locally acquired STEP surfaces for unlabeled cylindrical features.

Cylinders may represent bosses, shafts, holes, recesses, threads, fillets or
decorative geometry. The output is a REVIEW QUEUE, not physical feature labels,
hole spacing, a certified axis, or hardware qualification.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

SCHEMA="aeroforge/step-brep-cylindrical-surface-candidates/v2.8"

def finite_number(x,label):
    x=float(x)
    if not math.isfinite(x) or abs(x)>1e7:raise ValueError("Invalid "+label)
    return round(x,6)

def row_for_cylinder(cylinder,face_area,solid_index,face_index):
    axis=cylinder.Axis()
    location=axis.Location()
    direction=axis.Direction()
    coords=[finite_number(getattr(location,k)(),k) for k in ("X","Y","Z")]
    vector=[finite_number(getattr(direction,k)(),k) for k in ("X","Y","Z")]
    radius=finite_number(cylinder.Radius(),"cylinder radius")
    if radius<=0 or abs(sum(k*k for k in vector)-1)>.0001:
        raise ValueError("Invalid radius or non-unit cylinder axis")
    return {
        "solidIndex":solid_index,"faceIndex":face_index,
        "radiusKernelMm":radius,"diameterKernelMm":round(radius*2,6),
        "axisLocationKernelMm":coords,"axisDirectionKernel":vector,
        "faceAreaKernelMm2":finite_number(face_area,"face area"),
        "featureType":"UNLABELED_BREP_CYLINDRICAL_SURFACE",
    }

def inspect_brep(path,expected_sha,max_solids=500,max_faces=30000):
    path=Path(path)
    if path.is_symlink() or not path.is_file() or path.suffix.lower() not in (".step",".stp"):
        raise ValueError("Local regular STEP file required")
    if path.stat().st_size>120*1024*1024 or path.stat().st_size<=0:
        raise ValueError("Source size outside limits")
    if len(expected_sha)!=64 or any(c not in "0123456789abcdef" for c in expected_sha):
        raise ValueError("Expected lowercase SHA-256 required")
    digest=hashlib.file_digest(path.open("rb"),"sha256").hexdigest()
    if digest!=expected_sha:raise ValueError("Exact source STEP SHA-256 mismatch")
    try:
        import cadquery as cq
        from OCP.BRepAdaptor import BRepAdaptor_Surface
        from OCP.GeomAbs import GeomAbs_Cylinder
    except ImportError as exc:
        raise RuntimeError("CadQuery/OCP must be installed into the isolated CAD environment") from exc
    imported=cq.importers.importStep(str(path))
    solids=[]
    for obj in imported.objects:
        inner=list(obj.Solids())
        solids.extend(inner if inner else [obj])
    if not 1<=len(solids)<=max_solids:
        raise ValueError("CAD shape count violates strict limit; cannot truncate")
    rows=[];total_faces=0
    for i,solid in enumerate(solids):
        faces=list(solid.Faces());total_faces+=len(faces)
        if total_faces>max_faces:raise ValueError("Too many CAD faces; fail closed")
        for j,face in enumerate(faces):
            adapter=BRepAdaptor_Surface(face.wrapped)
            if adapter.GetType()==GeomAbs_Cylinder:
                rows.append(row_for_cylinder(adapter.Cylinder(),face.Area(),i,j))
    return {
        "schema":SCHEMA,"source":{"fileName":path.name,"sha256":digest,
            "sizeBytes":path.stat().st_size,
            "manufacturerSignatureVerified":False},
        "cadEngine":"CadQuery/OCP","sourceCoordinateFrame":"STEP_NATIVE_UNREGISTERED",
        "sourceLengthUnit":"OCP_KERNEL_MM_DECLARATION_NOT_METROLOGY",
        "solidCount":len(solids),"faceCount":total_faces,
        "cylindricalSurfaceFaceCount":len(rows),"candidateCylinders":rows,
        "holeOrBossClassificationApproved":False,
        "motorMountCentersIndependentlyVerified":False,
        "motorShaftAxisIndependentlyVerified":False,
        "physicalInterferenceTested":False,
        "flightApproved":False,
        "warning":"Cylindrical BREP surfaces are geometric candidates only. Do not infer bolt holes, shaft direction, revisions or fit without independent face-level review."
    }

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("step",type=Path)
    p.add_argument("--sha256",required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    if a.out.exists():p.error("Destination exists; never silently overwrite a prior inspection")
    result=inspect_brep(a.step,a.sha256.lower())
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    print(result["cylindricalSurfaceFaceCount"],
      "unlabeled CAD cylinders inspected; NOT verified mounting or shaft axes")

if __name__=="__main__":main()
