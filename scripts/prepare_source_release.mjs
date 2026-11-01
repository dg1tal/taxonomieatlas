// Apply only a source-bound, allowlisted candidate; preserve the existing release gate.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {validate} from '../dist/engine.mjs';
export function verifyCandidate(old,next,report){
 if(report.publish!==true||report.errors?.length!==0||report.blocked?.length!==0||!Array.isArray(report.patches))throw Error('Source checks are not clear');
 if(report.from_sha256!==old.source.sha256||report.to_sha256!==next.source.sha256||!/^[a-f0-9]{64}$/.test(report.to_sha256)||report.to_sha256===report.from_sha256)throw Error('Source checksum mismatch');
 const expected=structuredClone(old),nodes=new Map(expected.nodes.map(n=>[n.id,n])),seen=new Set();
 for(const p of report.patches){
  const node=nodes.get(p.id),key=p.id+':'+p.field;
  if(!node||node.rank==='genus'||!['en','code'].includes(p.field)||seen.has(key)||node[p.field]!==p.before||typeof p.after!=='string'||!p.after.trim()||p.after===p.before)throw Error('Non-automatic or inconsistent patch');
  seen.add(key);node[p.field]=p.after;
 }
 expected.source.sha256=report.to_sha256;
 expected.dataset_revision=report.checked_at.slice(0,10)+'.auto-'+report.to_sha256.slice(0,12);
 if(JSON.stringify(expected)!==JSON.stringify(next))throw Error('Candidate contains unreviewed changes');
 const errors=validate(next);if(errors.length)throw Error(errors.join('\n'));
 return {from_sha256:report.from_sha256,to_sha256:report.to_sha256,approved:true,
  reviewer:'Daily source workflow: conservative cell-by-cell AviList verification',
  evidence:'Same workbook sheets, schema, row order and every non-allowlisted cell. Only existing AviList English labels/Cornell codes or workbook packaging changed. All taxonomy, German labels, country records, licenses and other sources unchanged. Source check: '+report.checked_at,
  change_reviews:[]};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=process.argv[2]||'source-update',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const old=read('dist/data.json'),next=read(folder+'/candidate.json'),report=read(folder+'/report.json');
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(sha('sources/avilist-2026.xlsx')!==report.from_sha256||sha(folder+'/avilist.xlsx')!==report.to_sha256)throw Error('Downloaded/local source file checksum mismatch');
 const review=verifyCandidate(old,next,report);
 // Re-run the Python cell policy against the exact source files in this job.
 execFileSync('python3',['scripts/verify_source_workbook.py',folder],{stdio:'inherit'});
 fs.writeFileSync(folder+'/review.json',JSON.stringify(review,null,2));
 execFileSync(process.execPath,['scripts/release.mjs',folder+'/candidate.json',folder+'/review.json'],{stdio:'inherit'});
 fs.copyFileSync(folder+'/candidate.json','dist/data.json');
 fs.copyFileSync(folder+'/avilist.xlsx','sources/avilist-2026.xlsx');
 const manifest=read('dist/releases.json');
 fs.copyFileSync(folder+'/report.json','sources/reviews/'+manifest.sha256+'.source-check.json');
}
