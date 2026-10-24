#!/usr/bin/env python3
"""AeroForge v3.7: independent, bounded OpenCascade X500 variant exact BREP batch.

Run from a CAD-FREE supervisor, against BOTH exact original operator-supplied
STEP binaries. Every expensive source import and Boolean runs in a separate
fresh Python interpreter/process group. A pending, partial, timed-out or failed
run cannot become a clearance or physical-fit claim.

This is an original-source *research CAD calculation* only. Manufacturer
revision, physical mating and safety are never certified by this tool.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time

SCHEMA="aeroforge/x500-variant-exact-brep-run-plan/v3.7"
RESULT_SCHEMA="aeroforge/x500-variant-exact-brep-run-result/v3.7"
FRAME_HASH="e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360"
MOTOR_HASH="ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15"
SOURCE_NAMES={"frame":"x500v2-frame.step","motor":"AIR2216II_Motor_3D.STEP"}
SITES={"arm-1":([56,189],35),"arm-2":([83,191],62),
       "arm-3":([110,190],89),"arm-4":([137,188],116)}
EPS=0.00001

def require(condition,message):
    if not condition:
        raise ValueError("X500 v3.7 BREP run blocked: "+message)

def digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream,"sha256").hexdigest()

def reject_duplicate_keys(items):
    """Disallow payloads that different JSON readers might interpret differently."""
    result={}
    for key,value in items:
        require(key not in result,"Duplicate key in source-bound JSON: "+key)
        result[key]=value
    return result

def reject_nonfinite_constant(value):
    raise ValueError("X500 v3.7 BREP run blocked: Non-finite JSON number "+value)

def read_json(path,limit=2_000_000):
    path=Path(path)
    require(path.is_file() and not path.is_symlink() and
            20<path.stat().st_size<=limit,"Missing/oversized source-bound JSON evidence")
    try:
        return json.loads(path.read_bytes(),object_pairs_hook=reject_duplicate_keys,
                          parse_constant=reject_nonfinite_constant)
    except (UnicodeDecodeError,json.JSONDecodeError) as e:
        raise ValueError("X500 v3.7 BREP run blocked: Invalid source-bound JSON") from e

def verify_step(path,role):
    path=Path(path)
    target=FRAME_HASH if role=="frame" else MOTOR_HASH
    require(path.is_file() and not path.is_symlink() and
            path.name==SOURCE_NAMES[role] and path.stat().st_size<=120_000_000
            and digest(path)==target,
            "Original unmodified "+role+" STEP filename/bytes required")

def check_matrix(matrix):
    require(isinstance(matrix,list) and len(matrix)==3 and
        all(isinstance(row,list) and len(row)==3 and
            all(isinstance(v,(int,float)) and math.isfinite(v) for v in row)
            for row in matrix),"Finite right-handed rotation 3x3 required")
    determinant=(matrix[0][0]*(matrix[1][1]*matrix[2][2]-matrix[1][2]*matrix[2][1])
      -matrix[0][1]*(matrix[1][0]*matrix[2][2]-matrix[1][2]*matrix[2][0])
      +matrix[0][2]*(matrix[1][0]*matrix[2][1]-matrix[1][1]*matrix[2][0]))
    require(abs(determinant-1)<.00001,"No improper reflection allowed")
    for i in range(3):
        for j in range(3):
            dot=sum(matrix[i][k]*matrix[j][k] for k in range(3))
            require(abs(dot-(1 if i==j else 0))<.00001,
                    "Orthonormal rotation source geometry required")

def pair_id(pair):
    return (pair["frameSolidIndex"],pair["motorSolidIndex"])

def preflight(plan_path,variant_path,survey_path,frame_path,motor_path):
    # All checks before importing CadQuery/OCP or starting any Boolean.
    plan=read_json(plan_path)
    variant=read_json(variant_path)
    survey=read_json(survey_path)
    verify_step(frame_path,"frame");verify_step(motor_path,"motor")
    require(plan.get("schema")==SCHEMA and
      plan.get("authority")=="ORIGINAL_SOURCE_BREP_EXECUTION_REQUEST_NOT_RESULT" and
      variant.get("schema")=="aeroforge/x500-unqualified-assembly-variant/v3.6" and
      survey.get("schema")=="aeroforge/x500-source-contact-hypotheses/v3.3" and
      plan.get("source",{}).get("frameStepSha256")==FRAME_HASH and
      plan.get("source",{}).get("motorStepSha256")==MOTOR_HASH and
      plan["source"].get("originalVariantJsonSha256")==digest(variant_path) and
      plan["source"].get("originalContactSurveyJsonSha256")==digest(survey_path),
      "Original plan/variant/contact bytes not consistent")
    site=plan.get("targetSiteId")
    require(site in SITES and plan.get("scenarioMode")==
      "HYPOTHETICAL_AIR2216II_REPLACEMENT" and
      variant.get("targetSiteId")==site and
      variant.get("scenarioMode")==plan.get("scenarioMode") and
      variant.get("authority")=="UNQUALIFIED_ASSEMBLY_PLAN_ONLY" and
      variant.get("proposedMotorModel")=="AIR2216II" and
      variant.get("originalSourceMotorModel")=="DJ-2216-KV880",
      "A named, explicit hypothetical source-motor replacement is required")
    linked=variant.get("source",{})
    require(linked.get("frameStepSha256")==FRAME_HASH and
      linked.get("motorStepSha256")==MOTOR_HASH and
      isinstance(linked.get("v35AssemblyReportSha256"),str) and
      len(linked["v35AssemblyReportSha256"])==64 and
      all(c in "0123456789abcdef" for c in linked["v35AssemblyReportSha256"]) and
      plan["source"].get("originalAssemblyJsonSha256")==
        linked["v35AssemblyReportSha256"] and
      variant.get("originalFrameSolidOccurrences")==244 and
      variant.get("hypotheticalFrameOccurrenceCount")==242 and
      variant.get("originalGeometryWasModified") is False and
      variant.get("physicalExistingMotorRemovalAuthorized") is False and
      variant.get("replacementApproved") is False and
      variant.get("selectedPhysicalBomQualified") is False and
      plan.get("originalCadFilesEdited") is False,
      "Original source assembly lineage or hypothetical-only safety gates changed")
    comparison=variant.get("hypotheticalHistoricalComparison",{})
    require(comparison.get("overlapVolumesRecomputedAfterMask") is False and
      comparison.get("newExactBooleanResult") is None,
      "Historical BREP comparisons must not masquerade as a fresh variant result")
    excluded,plate=SITES[site]
    require(variant.get("unmodifiedOriginalSourceMotorPairs")==[
      {"siteId":arm,"originalLeafIndexes":list(mask),
       "nestedArmPath":path,"sourceCadGeometryUnmodified":True,
       "physicalMotorPresentVerified":False}
      for arm,(mask,_),path in [
       ("arm-1",SITES["arm-1"],"HMX5V-ARM-V1_ASM:1"),
       ("arm-2",SITES["arm-2"],"HMX5V-ARM-V1_ASM:2"),
       ("arm-3",SITES["arm-3"],"HMX5V-ARM-V1_ASM:3"),
       ("arm-4",SITES["arm-4"],"HMX5V-ARM-V1_ASM:4")
      ]],"All four original motor source occurrences must be preserved")
    frame=plan.get("memberSourceFrameSolidIndices")
    motor=plan.get("memberSourceMotorSolidIndices")
    wanted=[i for i in range(244) if i not in excluded]
    require(plan.get("explicitlyMaskedFrameSolidIndices")==excluded and
      variant.get("excludedFromHypotheticalStudyOnly")==excluded and
      frame==wanted and motor==[0,1,2,3] and
      plan.get("totalSourceFrameSolids")==244 and
      plan.get("totalOriginalMotorSolids")==4 and
      plan.get("mustReimportOriginalStepFiles") is True and
      plan.get("mustRecomputeAllAabbs") is True and
      plan.get("mustMatchOriginalAabbBroadphaseIdentity") is True and
      plan.get("mustEvaluateEveryAabbPositiveSourceSolidPair") is True and
      plan.get("jobStatus")=="NOT_EXECUTED",
      "Original 244-member assembly/4-motor mask is not exact")
    for o in (plan,variant,survey):
        for k in ("physicalFitApproved","procurementApproved","powerApproved","flightApproved"):
            require(o.get(k) is False,"Unqualified source promoted physical status")
    pose=plan.get("pose",{})
    raw=next((x for x in survey.get("hypotheses",[]) if
      x.get("id")==pose.get("id")),None)
    require(raw is not None and
      raw.get("frameSourceFaceIndex")==pose.get("originalFramePlaneFaceIndex") and
      raw.get("motorSourceFaceIndex")==pose.get("originalMotorPlaneFaceIndex") and
      raw.get("planeNormalsOppose") is True and
      raw.get("frameSourceSolidIndex")==plate and
      pose.get("opposingSourceNormals") is True and
      pose.get("actualMatingSurfaceQualified") is False and
      raw.get("rightHandedRotation3x3")==pose.get("rotation3x3") and
      raw.get("translationNativeMm")==pose.get("nativeTranslationMm"),
      "Selected source 3D pose cannot be authenticated to exact v3.3 witness")
    check_matrix(pose["rotation3x3"])
    shift=pose["nativeTranslationMm"]
    require(isinstance(shift,list) and len(shift)==3 and
      all(isinstance(x,(int,float)) and math.isfinite(x) for x in shift),
      "Finite source-native 3D translation required")
    pairs=plan.get("expectedOriginalSourceAabbPairs",[])
    expected=set()
    for p in pairs:
        require(isinstance(p,dict) and
          type(p.get("frameSolidIndex")) is int and
          type(p.get("motorSolidIndex")) is int and
          p["frameSolidIndex"] in wanted and p["motorSolidIndex"] in motor and
          pair_id(p) not in expected,
          "Missing, duplicated or excluded source candidate collision pair")
        expected.add(pair_id(p))
    raw_pairs={pair_id(p) for p in raw.get("broadPhaseAabbPairs",[])}
    require(len(raw_pairs)==raw.get("broadPhasePotentialPairCount") and
      expected=={p for p in raw_pairs if p[0] not in excluded} and
      (plate,0) in expected and len(expected)>0,
      "Plan's predicted retained pair set differs from complete original v3.3 broadphase")
    return plan,pairs

def shape_bbox(shape):
    """Bounded 3D source-solid box, not a substitute for a solid BREP witness."""
    try:
        b=shape.BoundingBox()
        low=[b.xmin,b.ymin,b.zmin]
        high=[b.xmax,b.ymax,b.zmax]
    except (AttributeError,TypeError,ValueError,RuntimeError) as exc:
        raise ValueError("Invalid source BREP bounding box") from exc
    require(all(isinstance(v,(int,float)) and math.isfinite(v)
                for v in [*low,*high]) and
            all(low[i]<high[i] for i in range(3)),
            "Non-finite, inverted or degenerate source BREP bounding box")
    return low,high

def validate_source_solids(parts,count,role):
    """Count, solid topology and positive 3D volume are separate invariants."""
    require(len(parts)==count,
            "CAD reimport "+role+" source solid count changed")
    for index,solid in enumerate(parts):
        try:
            is_solid=solid.ShapeType()=="Solid"
            volume=solid.Volume()
        except (AttributeError,TypeError,ValueError,RuntimeError) as exc:
            raise ValueError("Invalid "+role+" BREP source solid at "+str(index)) from exc
        require(is_solid and isinstance(volume,(int,float)) and
                math.isfinite(volume) and volume>0,
                "Missing, non-solid or non-positive-volume "+role+
                " BREP source member "+str(index))
        shape_bbox(solid)

def import_parts(frame_path,motor_path):
    import cadquery as cq
    def flatten(path):
        result=cq.importers.importStep(str(path))
        shapes=[]
        for obj in result.objects:
            # Reject empty/surface-only parents instead of silently promoting
            # them to source solids and manufacturing model-only zero volumes.
            children=list(obj.Solids())
            require(len(children)>0,
                    "Source STEP import contained a component without solids")
            shapes.extend(children)
        return shapes
    frame=flatten(frame_path);motor=flatten(motor_path)
    validate_source_solids(frame,244,"frame")
    validate_source_solids(motor,4,"motor")
    return frame,motor

def transform_corner(point,R,t):
    return [t[i]+sum(R[i][j]*point[j] for j in range(3)) for i in range(3)]

def projected_aabb(bounds,R,t):
    low,high=bounds
    pts=[transform_corner([x,y,z],R,t)
       for x in (low[0],high[0]) for y in (low[1],high[1])
       for z in (low[2],high[2])]
    return ([min(p[i] for p in pts) for i in range(3)],
            [max(p[i] for p in pts) for i in range(3)])

def overlaps(a,b,epsilon=EPS):
    return all(min(a[1][i],b[1][i])-max(a[0][i],b[0][i])>epsilon
               for i in range(3))

def screen_parts(plan,frame_path,motor_path):
    frame,motor=import_parts(frame_path,motor_path)
    R=plan["pose"]["rotation3x3"]
    t=plan["pose"]["nativeTranslationMm"]
    boxesF={i:shape_bbox(frame[i]) for i in plan["memberSourceFrameSolidIndices"]}
    boxesM={i:projected_aabb(shape_bbox(motor[i]),R,t) for i in (0,1,2,3)}
    observed=[{"frameSolidIndex":i,"motorSolidIndex":j}
       for i,fb in boxesF.items() for j,mb in boxesM.items()
       if overlaps(fb,mb)]
    return {"schema":"aeroforge/x500-brep-worker-screen/v3.7",
      "sourceReimportedFrameSolids":len(frame),
      "sourceReimportedMotorSolids":len(motor),
      "sourceMembershipCount":len(boxesF),
      "freshAllSourceAabbPairs":observed,
      "physicalFitApproved":False}

def exact_pair(plan,frame_path,motor_path,frame_id,motor_id):
    from OCP.gp import gp_Trsf
    from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
    from OCP.BRepAlgoAPI import BRepAlgoAPI_Common
    from OCP.BRepGProp import BRepGProp
    from OCP.GProp import GProp_GProps
    frame,motor=import_parts(frame_path,motor_path)
    R=plan["pose"]["rotation3x3"]
    t=plan["pose"]["nativeTranslationMm"]
    xf=gp_Trsf()
    xf.SetValues(R[0][0],R[0][1],R[0][2],t[0],
       R[1][0],R[1][1],R[1][2],t[1],
       R[2][0],R[2][1],R[2][2],t[2])
    moved=BRepBuilderAPI_Transform(motor[motor_id].wrapped,xf,True).Shape()
    common=BRepAlgoAPI_Common(frame[frame_id].wrapped,moved)
    common.Build()
    require(common.IsDone(),"OpenCascade exact Boolean did not complete")
    result=common.Shape()
    props=GProp_GProps()
    if not result.IsNull():
        BRepGProp.VolumeProperties_s(result,props)
    volume=0.0 if result.IsNull() else props.Mass()
    require(math.isfinite(volume) and volume>=-1e-7,
      "OpenCascade intersection volume not a finite nonnegative value")
    volume=max(0.0,volume)
    return {"schema":"aeroforge/x500-brep-worker-pair/v3.7",
      "frameSolidIndex":frame_id,"motorSolidIndex":motor_id,
      "status":"MODEL_POSITIVE_INTERSECTION" if volume>.0001 else "MODEL_ZERO_INTERSECTION",
      "modelIntersectionVolumeMm3":volume,
      "physicalFitApproved":False}

def invoke_worker(args,stage,timeout_s,frame_id=None,motor_id=None):
    require(os.name=="posix","Process-group-cancellable exact BREP supervisor requires POSIX")
    cmd=[sys.executable,str(Path(__file__).resolve()),"--_worker",stage,
      "--plan",str(args.plan),"--frame-step",str(args.frame_step),
      "--motor-step",str(args.motor_step)]
    if frame_id is not None:
        cmd+=["--_frame-index",str(frame_id),"--_motor-index",str(motor_id)]
    with tempfile.TemporaryFile(mode="w+t") as stdout, tempfile.TemporaryFile(mode="w+t") as stderr:
        proc=subprocess.Popen(cmd,stdout=stdout,stderr=stderr,start_new_session=True)
        try:
            proc.wait(timeout=timeout_s)
        except subprocess.TimeoutExpired:
            try:os.killpg(proc.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            proc.wait()
            return None,"INDETERMINATE_TIMEOUT"
        stdout.seek(0);stderr.seek(0)
        if proc.returncode:
            return None,"INDETERMINATE_WORKER_ERROR"
        try:
            data=json.loads(stdout.read(1_000_000),
                            object_pairs_hook=reject_duplicate_keys,
                            parse_constant=reject_nonfinite_constant)
            return (data,None) if isinstance(data,dict) else (None,"INDETERMINATE_WORKER_ERROR")
        except (json.JSONDecodeError,ValueError):
            return None,"INDETERMINATE_WORKER_ERROR"

def execute(args):
    require(not args.out.exists(),"Output already exists: never replace an earlier CAD run receipt")
    require(os.name=="posix","Unsupported supervisor OS: use Linux/macOS POSIX processes")
    require(5<=args.worker_timeout<=240 and 10<=args.screen_timeout<=300,
            "Worker timeout budgets must remain bounded")
    plan,pairs=preflight(args.plan,args.variant,args.source_survey,
                         args.frame_step,args.motor_step)
    require(1<=args.max_pairs<=len(pairs),"Unbounded or zero CAD test pairs requested")
    screen,error=invoke_worker(args,"screen",args.screen_timeout)
    require(error is None and screen is not None and
      screen.get("schema")=="aeroforge/x500-brep-worker-screen/v3.7" and
      screen.get("sourceReimportedFrameSolids")==244 and
      screen.get("sourceReimportedMotorSolids")==4 and
      screen.get("sourceMembershipCount")==242 and
      screen.get("physicalFitApproved") is False,
      "Independent fresh source AABB screening failed or timed out: INDETERMINATE")
    actual_pairs=screen.get("freshAllSourceAabbPairs")
    require(isinstance(actual_pairs,list) and all(
      isinstance(p,dict) and type(p.get("frameSolidIndex")) is int and
      type(p.get("motorSolidIndex")) is int and
      p["frameSolidIndex"] in plan["memberSourceFrameSolidIndices"] and
      p["motorSolidIndex"] in plan["memberSourceMotorSolidIndices"]
      for p in actual_pairs),
      "Malformed new source-solid AABB screening result: INDETERMINATE")
    actual=[pair_id(p) for p in actual_pairs]
    expected=[pair_id(p) for p in pairs]
    require(len(actual)==len(set(actual)) and set(actual)==set(expected),
      "Fresh original STEP AABB screen disagrees with planned broadphase: INDETERMINATE")
    observed=[]
    for p in pairs[:args.max_pairs]:
        i,j=pair_id(p)
        payload,error=invoke_worker(args,"pair",args.worker_timeout,i,j)
        if error is not None:
            row={"frameSolidIndex":i,"motorSolidIndex":j,"status":error,
                 "modelIntersectionVolumeMm3":None}
        elif (payload.get("schema")!="aeroforge/x500-brep-worker-pair/v3.7" or
          payload.get("frameSolidIndex")!=i or payload.get("motorSolidIndex")!=j or
          payload.get("status") not in ("MODEL_POSITIVE_INTERSECTION","MODEL_ZERO_INTERSECTION") or
          payload.get("physicalFitApproved") is not False or
          not isinstance(payload.get("modelIntersectionVolumeMm3"),(int,float)) or
          not math.isfinite(payload["modelIntersectionVolumeMm3"]) or
          payload["modelIntersectionVolumeMm3"]<0 or
          (payload["status"]=="MODEL_POSITIVE_INTERSECTION")!=
           (payload["modelIntersectionVolumeMm3"]>.0001)):
            row={"frameSolidIndex":i,"motorSolidIndex":j,
                 "status":"INDETERMINATE_WORKER_ERROR",
                 "modelIntersectionVolumeMm3":None}
        else:
            row={k:payload[k] for k in (
              "frameSolidIndex","motorSolidIndex","status","modelIntersectionVolumeMm3")}
        observed.append(row)
    receipt={
      "schema":RESULT_SCHEMA,
      "sourcePlanJsonSha256":digest(args.plan),
      "frameStepSha256":FRAME_HASH,"motorStepSha256":MOTOR_HASH,
      "poseId":plan["pose"]["id"],"siteId":plan["targetSiteId"],
      "originalFrameSourceCount":244,"frameSolidMembersEvaluated":242,
      "motorSolidMembersEvaluated":4,
      "maskedFrameSolidIndices":plan["explicitlyMaskedFrameSolidIndices"],
      "broadPhaseRecomputedFromOriginalStep":True,
      "broadPhasePairIdentityMatched":True,
      "all244OriginalFrameSolidsAccountedFor":True,
      "expectedPairCount":len(pairs),
      "complete":len(observed)==len(pairs),
      "pairs":observed,"originalCadFilesEdited":False,
      "exactModelNotPhysicalFit":True,
      "manufacturerRevisionAuthenticated":False,
      "physicalFitApproved":False,"procurementApproved":False,
      "powerApproved":False,"flightApproved":False,
      "warning":"Original CAD model intersections only. Partial/timeouts are indeterminate. No source BOM, physical motor fit, electrical or flight approval."
    }
    args.out.parent.mkdir(parents=True,exist_ok=True)
    with args.out.open("x",encoding="utf8") as stream:
        json.dump(receipt,stream,indent=2);stream.write("\n")
    positive=sum(p["status"]=="MODEL_POSITIVE_INTERSECTION" for p in observed)
    unknown=sum(p["status"].startswith("INDETERMINATE_") for p in observed)
    print(f"Source-BREP pair evidence: {len(observed)}/{len(pairs)} recorded; "
          f"{positive} modeled positive intersections; {unknown} indeterminate. "
          "Physical fit NOT APPROVED.")

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--plan",type=Path,required=True)
    p.add_argument("--frame-step",type=Path,required=True)
    p.add_argument("--motor-step",type=Path,required=True)
    p.add_argument("--variant",type=Path)
    p.add_argument("--source-survey",type=Path)
    p.add_argument("--out",type=Path)
    p.add_argument("--max-pairs",type=int,default=999)
    p.add_argument("--worker-timeout",type=int,default=90)
    p.add_argument("--screen-timeout",type=int,default=150)
    p.add_argument("--_worker",choices=["screen","pair"],help=argparse.SUPPRESS)
    p.add_argument("--_frame-index",type=int,help=argparse.SUPPRESS)
    p.add_argument("--_motor-index",type=int,help=argparse.SUPPRESS)
    a=p.parse_args()
    if a._worker:
        # Isolated fresh subprocess: original STEP hashes are checked again.
        verify_step(a.frame_step,"frame");verify_step(a.motor_step,"motor")
        run=read_json(a.plan)
        require(run.get("schema")==SCHEMA and
           run.get("source",{}).get("frameStepSha256")==FRAME_HASH and
           run.get("source",{}).get("motorStepSha256")==MOTOR_HASH,
           "Independent CAD subprocess plan source mismatch")
        if a._worker=="screen":
            print(json.dumps(screen_parts(run,a.frame_step,a.motor_step)))
        else:
            i,j=a._frame_index,a._motor_index
            require(type(i)==int and type(j)==int and
              i in run.get("memberSourceFrameSolidIndices",[]) and
              j in run.get("memberSourceMotorSolidIndices",[]) and
              (i,j) in {pair_id(row) for row in
                run.get("expectedOriginalSourceAabbPairs",[])},
              "Unplanned exact source pair execution rejected")
            print(json.dumps(exact_pair(run,a.frame_step,a.motor_step,i,j)))
    else:
        require(a.variant is not None and a.source_survey is not None and
          a.out is not None,"Original variant, v3.3 source survey and output required")
        if a.max_pairs==999:
            original=read_json(a.plan)
            a.max_pairs=len(original.get("expectedOriginalSourceAabbPairs",[]))
        execute(a)

if __name__=="__main__":
    main()
