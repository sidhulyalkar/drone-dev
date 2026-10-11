#!/usr/bin/env python3
"""Reproduce Source Two manufacturer 2D hole observations from locally downloaded DXFs.

Does NOT map the 2D production drawing to an assembled 3D airframe.
Does NOT redistribute upstream GPL-3.0 files. Files can be obtained from
https://github.com/ps915/source_two; honor their GPLv3 terms.

Usage:
 python tools/source_dxf_audit.py --source-dir /path/to/source_two --manifest data/source_two_dxf_datums.v0.4.json
"""
import argparse
import hashlib
import json
from pathlib import Path


def git_blob_sha1(blob: bytes):
    return hashlib.sha1(f'blob {len(blob)}\0'.encode() + blob).hexdigest()


def circles_from_dxf(path):
    import ezdxf
    doc=ezdxf.readfile(str(path))
    return [[round(float(e.dxf.center.x), 3),round(float(e.dxf.center.y), 3),round(float(e.dxf.radius), 3)] for e in doc.modelspace().query('CIRCLE')]


def audit(source_dir: Path, manifest: Path):
    data=json.loads(manifest.read_text(encoding='utf-8'))
    reports=[]
    for file in data['files']:
        p=source_dir / file['path']
        if not p.is_file():
            reports.append({'file':file['path'],'status':'MISSING','expected_blob':file['github_git_blob_sha1']});continue
        raw=p.read_bytes(); digest=git_blob_sha1(raw)
        circles=circles_from_dxf(p)
        actual=sorted(map(tuple,circles));expected=sorted(map(tuple,file['circles']))
        reports.append({'file':file['path'],'status':'MATCH' if digest==file['github_git_blob_sha1'] and actual==expected else 'MISMATCH',
                        'expected_blob':file['github_git_blob_sha1'],'actual_blob':digest,
                        'expected_circles':len(expected),'actual_circles':len(actual),'drawing_unit':'mm (INSUNITS value 4)'})
    return {'schema':'aeroforge/dxf-source-audit/v0.4','status':'MATCH' if all(r['status']=='MATCH' for r in reports) else 'SOURCE_HOLD',
            'reports':reports,'caution':'DXF hole records do not establish assembled 3D motor coordinates, free space, fastening engagement or flight readiness.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir',required=True,type=Path)
    parser.add_argument('--manifest',default=Path('data/source_two_dxf_datums.v0.4.json'),type=Path)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    result=audit(args.source_dir,args.manifest)
    payload=json.dumps(result,indent=2)+'\n'
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(payload,encoding='utf-8')
    print(payload,end='')
    return 0 if result['status']=='MATCH' else 2

if __name__=='__main__':
    raise SystemExit(main())
