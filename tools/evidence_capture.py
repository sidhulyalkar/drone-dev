#!/usr/bin/env python3
"""Compute a provenance entry for an existing local evidence file; never copies copyrighted assets.

The record is NOT verification of an engineering claim. Review documentation, revision and physical fit separately.
"""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

KINDS = ('source-document', 'cad-drawing', 'bench-measurement', 'manual-inspection')

def record(path, *, identifier, subject, claim, url, revision, method, kind, license_name):
    path = Path(path)
    if not path.is_file() or path.stat().st_size > 160 * 1024 * 1024:
        raise ValueError('Evidence must be an existing regular file under 160MB')
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.netloc:
        raise ValueError('Provide an HTTPS authoritative source URL')
    if kind not in KINDS or any(not v or not str(v).strip() for v in [identifier, subject, claim, revision, method, license_name]):
        raise ValueError('Provide nonempty provenance fields and valid kind')
    digest=hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda:handle.read(1024 * 1024), b''):
            digest.update(block)
    return dict(schema='aeroforge/evidence-record/v0.5', id=identifier, subject=subject, claim=claim,
                sourceUrl=url, sourceRevision=revision, method=method, artifactName=path.name,
                kind=kind, license=license_name, sha256=digest.hexdigest(), verified=False,
                note='A hash identifies source bytes only. It does not prove the evidence claim or fit.')

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('file',type=Path)
    for k in ['id','subject','claim','url','revision','method','license']:
        p.add_argument('--'+k,required=True)
    p.add_argument('--kind',choices=KINDS,required=True)
    p.add_argument('--out',type=Path)
    args=p.parse_args()
    o=record(args.file,identifier=args.id,subject=args.subject,claim=args.claim,url=args.url,
             revision=args.revision,method=args.method,kind=args.kind,license_name=args.license)
    result=json.dumps(o,indent=2)+'\n'
    if args.out:
        args.out.parent.mkdir(parents=True,exist_ok=True)
        args.out.write_text(result,encoding='utf-8')
        print(args.out)
    else:
        print(result,end='')
if __name__=='__main__':main()
