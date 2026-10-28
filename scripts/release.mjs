// Prepare an immutable public update after an explicit, source-bound review.
// node scripts/release.mjs NEXT.json REVIEW.json
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {validate,compare} from '../dist/engine.mjs';
const [input,reviewPath]=process.argv.slice(2);if(!input||!reviewPath)throw Error('Usage: node scripts/release.mjs NEXT.json REVIEW.json');
const old=JSON.parse(fs.readFileSync('dist/data.json')),next=JSON.parse(fs.readFileSync(input)),review=JSON.parse(fs.readFileSync(reviewPath));
const errors=validate(next);if(errors.length)throw Error(errors.join('\n'));const diff=compare(old,next);if(diff.identityErrors.length)throw Error(diff.identityErrors.join('\n'));
if(review.from_sha256!==old.source.sha256||review.to_sha256!==next.source.sha256||review.approved!==true||!review.reviewer||!review.evidence)throw Error('Source-bound review required: from_sha256, to_sha256, approved:true, reviewer, evidence.');
const changed=new Set([...diff.added,...diff.removed,...diff.renamed.map(x=>x.after),...diff.moved.map(x=>x.after)].map(n=>n.id));
for(const id of changed)if(!review.change_reviews?.some(r=>r.id===id&&r.evidence&&r.decision))throw Error('Taxon needs an evidenced migration decision: '+id);
if(diff.germanyChanged&&!review.germany_review)throw Error('Changed Germany assignments require germany_review.');
const text=JSON.stringify(next),sha=crypto.createHash('sha256').update(text).digest('hex'),rel='releases/'+sha+'.json';
fs.mkdirSync('dist/releases',{recursive:true});fs.mkdirSync('sources/reviews',{recursive:true});
fs.writeFileSync('dist/'+rel,text);fs.writeFileSync('sources/reviews/'+sha+'.json',JSON.stringify({review,diff},null,2));
// Write the pointer last. Hosting deploys the resulting dist directory atomically.
fs.writeFileSync('dist/releases.json',JSON.stringify({version:next.version,source_sha256:next.source.sha256,sha256:sha,path:rel}));
console.log(JSON.stringify({prepared:rel,changes:changed.size,note:'Prepared only; publish via Sites after remaining checks.'}));
