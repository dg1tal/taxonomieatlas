import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyCandidate} from './prepare_source_release.mjs';
const old=JSON.parse(fs.readFileSync('dist/data.json'));
const n=old.nodes.find(n=>n.rank==='species'&&n.en);
const report={publish:true,errors:[],blocked:[],from_sha256:old.source.sha256,to_sha256:'b'.repeat(64),checked_at:'2026-11-01T04:37:00Z',patches:[{id:n.id,field:'en',before:n.en,after:n.en+' corrected'}]};
const candidate=structuredClone(old);candidate.nodes.find(x=>x.id===n.id).en=report.patches[0].after;candidate.source.sha256=report.to_sha256;candidate.dataset_revision='2026-11-01.auto-'+report.to_sha256.slice(0,12);
assert.equal(verifyCandidate(old,candidate,report).approved,true);
for(const mutate of [
 b=>b.nodes[1].parent=n.id,
 b=>b.nodes[1].name='Unreviewed taxon',
 b=>b.nodes.pop(),
 b=>b.nodes.find(x=>x.id===n.id).de='Unreviewed name',
 b=>b.germany_source.records[0].review='confirmed',
 b=>b.source.license='MIT',
 b=>b.name_sources=[],
 b=>b.version='2027',
 b=>b.nodes.find(x=>x.id===n.id).range='Unreviewed range'
]){const bad=structuredClone(candidate);mutate(bad);assert.throws(()=>verifyCandidate(old,bad,report));}
for(const change of [{publish:false},{errors:['timeout']},{blocked:['new edition']},{from_sha256:'a'.repeat(64)},{patches:[...report.patches,...report.patches]}])assert.throws(()=>verifyCandidate(old,candidate,{...report,...change}));
console.log('PASS: source-bound auto-release; reject taxonomy, country, German names, licenses, version, extra fields, duplicate patches and failed source checks.');
