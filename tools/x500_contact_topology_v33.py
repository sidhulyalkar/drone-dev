#!/usr/bin/env python3
"""Source-native X500 v3.3 topology/3D survey.

The full offline reference implementation and verified input are delivered
privately. This public command implements the portable safety-critical math
and strict original-source evidence rules. Exact BREP source libraries and
binary STEP geometry stay local to the operator.
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

FRAME_SHA="e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360"
MOTOR_SHA="ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15"
SOURCE={
 "frame":("x500v2-frame.step",FRAME_SHA,244),
 "motor":("AIR2216II_Motor_3D.STEP",MOTOR_SHA,4),
}
SCHEMA="aeroforge/x500-source-contact-hypotheses/v3.3"

def require(valid,message):
    if not valid:raise ValueError(message)

def source_sha(path):
    with Path(path).open("rb") as f:return hashlib.file_digest(f,"sha256").hexdigest()

def verify_step(path,role):
    expected,sha,size=SOURCE[role]
    path=Path(path)
    require(path.is_file() and not path.is_symlink() and path.name==expected,
            "Original "+role+" STEP file/name required")
    require(path.stat().st_size<=120*1024*1024 and source_sha(path)==sha,
            "Original "+role+" STEP SHA-256 is not the qualified operator source")
    return True

def planar_pose(yaw_deg, motor_axial_x_mm, frame_axial_y_mm,
                frame_xz_mm, motor_yz_mm):
    values=[yaw_deg,motor_axial_x_mm,frame_axial_y_mm,*frame_xz_mm,*motor_yz_mm]
    require(len(values)==7 and all(isinstance(x,(int,float)) and math.isfinite(x) for x in values),
            "All source-native 3D pose coordinates must be finite")
    a=math.radians(yaw_deg);c=math.cos(a);s=math.sin(a)
    R=[[0,c,-s],[-1,0,0],[0,s,c]]
    src=[motor_axial_x_mm,*motor_yz_mm]
    dst=[frame_xz_mm[0],frame_axial_y_mm,frame_xz_mm[1]]
    t=[dst[i]-sum(R[i][j]*src[j] for j in range(3)) for i in range(3)]
    return R,t

def map_point(point,R,t):
    return [sum(R[i][j]*point[j] for j in range(3))+t[i] for i in range(3)]

def transformed_aabb(bounds,R,t):
    low,high=bounds
    require(len(low)==3 and len(high)==3 and
            all(math.isfinite(x) for x in [*low,*high]) and
            all(low[i]<=high[i] for i in range(3)),
            "Invalid original BREP source AABB")
    corners=[map_point([x,y,z],R,t)
             for x in (low[0],high[0])
             for y in (low[1],high[1])
             for z in (low[2],high[2])]
    return [[min(p[i] for p in corners) for i in range(3)],
            [max(p[i] for p in corners) for i in range(3)]]

def possible_aabb_overlap(a,b,tolerance_mm=1e-5):
    require(math.isfinite(tolerance_mm) and tolerance_mm>=0,"Invalid overlap tolerance")
    return all(min(a[1][i],b[1][i])-max(a[0][i],b[0][i])>tolerance_mm
               for i in range(3))

def run_supervised(command,timeout_seconds):
    """One expensive Boolean process group, hard deadline, never false-clear."""
    require(os.name=="posix","Exact Boolean isolation requires POSIX process groups")
    require(isinstance(timeout_seconds,(int,float)) and
            1<=timeout_seconds<=60,"Budget 1-60 seconds required")
    start=time.monotonic()
    with tempfile.TemporaryFile(mode="w+t") as stdout, tempfile.TemporaryFile(mode="w+t") as stderr:
        proc=subprocess.Popen(command,stdout=stdout,stderr=stderr,start_new_session=True)
        timed_out=False
        try:proc.wait(timeout=timeout_seconds)
        except subprocess.TimeoutExpired:
            timed_out=True
            try:os.killpg(proc.pid,signal.SIGKILL)
            except ProcessLookupError:pass
            try:proc.wait(timeout=2)
            except subprocess.TimeoutExpired:pass
        elapsed=round(time.monotonic()-start,3)
        if timed_out:return {"status":"INDETERMINATE_TIMEOUT","elapsedSeconds":elapsed,
                              "physicalFitApproved":False}
        stdout.seek(0);stderr.seek(0)
        if proc.returncode:
            return {"status":"INDETERMINATE_WORKER_FAILURE",
                    "reason":stderr.read(512)[-512:],
                    "elapsedSeconds":elapsed,"physicalFitApproved":False}
        try:
            data=json.loads(stdout.read(4096))
            require(data.get("schema")=="aeroforge/x500-brep-worker-evidence/v3.3" and
                    data.get("manufactureOrPhysicalFitApproved") is False and
                    isinstance(data.get("intersectionVolumeMm3"),(int,float)) and
                    0<=data["intersectionVolumeMm3"]<1e12,
                    "Invalid or privileged BREP result")
            return {"status":"MODEL_ONLY_BREP_BOOLEAN_REPORTED","workerResult":data,
                    "elapsedSeconds":elapsed,"physicalFitApproved":False}
        except (json.JSONDecodeError,ValueError):
            return {"status":"INDETERMINATE_INVALID_WORKER_OUTPUT",
                    "elapsedSeconds":elapsed,"physicalFitApproved":False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frame-step",type=Path,required=True)
    parser.add_argument("--motor-step",type=Path,required=True)
    parser.add_argument("--v31",type=Path,required=True)
    parser.add_argument("--v32",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    require(not args.out.exists(),"Refusing to replace prior operator CAD evidence")
    verify_step(args.frame_step,"frame");verify_step(args.motor_step,"motor")
    v31=json.loads(args.v31.read_text())
    v32=json.loads(args.v32.read_text())
    h31=source_sha(args.v31);h32=source_sha(args.v32)
    require(v31.get("schema")=="aeroforge/x500-brep-contour-groups/v3.1" and
            v32.get("schema")=="aeroforge/x500-nominal-planar-registration-reference/v3.2" and
            v32.get("sourceReportSha256",{}).get("v31")==h31,
            "Incomplete or changed source-linked v3.1/v3.2 provenance")
    # The heavy BREP inspector is delivered separately and should run in an
    # isolated CAD environment. Do not substitute AABB for exact collision.
    result={"schema":SCHEMA,"source":{"frameStepSha256":FRAME_SHA,
      "motorStepSha256":MOTOR_SHA,"v31ReportSha256":h31,"v32ReportSha256":h32},
      "exactBrepBooleanStatus":"NOT_RUN","physicalFitApproved":False,
      "flightApproved":False,"warning":"Source identity preflight only. Run the local full BREP survey for 3D candidate results."}
    args.out.write_text(json.dumps(result,indent=2)+"\n")
    print("Operator source fingerprints match. No physical fit was approved.")

if __name__=="__main__":main()
