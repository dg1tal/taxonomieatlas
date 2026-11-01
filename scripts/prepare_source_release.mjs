// Apply only a source-bound, allowlisted candidate; preserve the existing release gate.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {validate} from '../dist/engine.mjs';
export function verifyCandidate(old,next,report){
 if(report.publish!==true||report.errors?.length!==0||report.blocked?.length!==0||!Array.isArray(report.patches))throw Error('Source checks are not clear');
 if(report.from_sha256!==old.source.sha256||report.to_sha256!==next.source.sha256||!/^[a-f0-9]{64}$/.test(report.to_sha256)||(report.mode!=='explorer'&&report.to_sha256===report.from_sha256))throw Error('Source checksum mismatch');
 const expected=structuredClone(old),nodes=new Map(expected.nodes.map(n=>[n.id,n])),seen=new Set();
 for(const p of report.patches){
  const node=nodes.get(p.id),key=p.id+':'+p.field;
  if(!node||node.rank==='genus'||!['en','code'].includes(p.field)||seen.has(key)||node[p.field]!==p.before||typeof p.after!=='string'||!p.after.trim()||p.after===p.before)throw Error('Non-automatic or inconsistent patch');
  seen.add(key);node[p.field]=p.after;
 }
 if(report.mode==='explorer'){
  if(report.from_sha256!==report.to_sha256||!report.explorer?.url?.startsWith('https://explore.avilist.org/data/'))throw Error('Invalid Explorer provenance');
  for(const p of report.genus_patches||[]){
   const node=nodes.get(p.id);if(!node||node.rank!=='genus'||JSON.stringify(node)!==JSON.stringify(p.before))throw Error('Genus review baseline mismatch');
   const allowed=new Set(['en','en_source','en_match','vernacular_names']);
   for(const key of new Set([...Object.keys(node),...Object.keys(p.after)]))if(!allowed.has(key)&&JSON.stringify(node[key])!==JSON.stringify(p.after[key]))throw Error('Unreviewed genus field: '+key);
   if(JSON.stringify(node.vernacular_names?.de)!==JSON.stringify(p.after.vernacular_names?.de))throw Error('German genus evidence changed');
   for(const key of Object.keys(node))delete node[key];Object.assign(node,p.after);
  }
  expected.source.explorer=report.explorer;expected.name_sources=report.name_sources;expected.dataset_revision=report.dataset_revision;
 }else{
  expected.source.sha256=report.to_sha256;expected.dataset_revision=report.checked_at.slice(0,10)+'.auto-'+report.to_sha256.slice(0,12);
 }
 if(JSON.stringify(expected)!==JSON.stringify(next))throw Error('Candidate contains unreviewed changes');
 if(Buffer.byteLength(JSON.stringify(next))>20*1024*1024)throw Error('Candidate exceeds client update size limit');
 const errors=validate(next);if(errors.length)throw Error(errors.join('\n'));
 return {from_sha256:report.from_sha256,to_sha256:report.to_sha256,approved:true,
  reviewer:report.mode==='explorer'?'Daily source workflow: official Explorer and source-bound name review':'Daily source workflow: conservative cell-by-cell AviList verification',
  evidence:report.mode==='explorer'?'Official Explorer dataset, full 26-field row comparison, unchanged version/license/bibliography, replayed checks against pinned source files and individually reviewed iNaturalist names. Original workbook SHA-256 remains the archived provenance; source.explorer records the live source checksums. '+report.checked_at:'Same workbook sheets, schema, row order and every non-allowlisted cell. Only existing AviList English labels/Cornell codes or workbook packaging changed. All taxonomy, German labels, country records, licenses and other sources unchanged. Source check: '+report.checked_at,
  change_reviews:[]};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=process.argv[2]||'source-update',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const old=read('dist/data.json'),next=read(folder+'/candidate.json'),report=read(folder+'/report.json');
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(sha('sources/avilist-2026.xlsx')!==report.from_sha256||(report.mode!=='explorer'&&sha(folder+'/avilist.xlsx')!==report.to_sha256))throw Error('Downloaded/local source file checksum mismatch');
 const review=verifyCandidate(old,next,report);
 // Re-run the Python cell policy against the exact source files in this job.
 execFileSync('python3',['scripts/verify_source_workbook.py',folder],{stdio:'inherit'});
 fs.writeFileSync(folder+'/review.json',JSON.stringify(review,null,2));
 execFileSync(process.execPath,['scripts/release.mjs',folder+'/candidate.json',folder+'/review.json'],{stdio:'inherit'});
 fs.copyFileSync(folder+'/candidate.json','dist/data.json');
 if(report.mode==='explorer'){
  for(const name of ['avilist-explorer.json.gz','avilist-versions.json','avilist-references.json'])fs.copyFileSync(folder+'/'+name,'sources/'+name);
  fs.copyFileSync(folder+'/inaturalist-reviewed.json','sources/inat-bird-genera.json');
  fs.copyFileSync(folder+'/genus-names-candidate.json','sources/genus-name-supplement.json');
 }else fs.copyFileSync(folder+'/avilist.xlsx','sources/avilist-2026.xlsx');
 const manifest=read('dist/releases.json');
 fs.copyFileSync(folder+'/report.json','sources/reviews/'+manifest.sha256+'.source-check.json');
}
