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

// German genus labels require a separate, genus-specific review. The publish
// command independently replays its fingerprints against the source files.
const germanOld=structuredClone(old),genus=germanOld.nodes.find(n=>n.name==='Heterotetrax');
for(const key of ['de','de_source','de_match'])delete genus[key];
delete genus.vernacular_names.de;
const after=structuredClone(genus);
after.de='Rüppelltrappen';after.de_source='iNaturalist';after.de_match='supplemental_genus_name';
after.vernacular_names.de=[{name:after.de,evidence:[{source:'iNaturalist',url:'https://www.inaturalist.org/taxa/1505952',field:'preferred valid locale name',retrieved:'2026-11-06'}]}];
const germanReport={publish:true,errors:[],blocked:[],patches:[],mode:'explorer',from_sha256:old.source.sha256,to_sha256:old.source.sha256,explorer:old.source.explorer,name_sources:old.name_sources,dataset_revision:'2026-11-06.reviewed',genus_patches:[{id:genus.id,before:genus,after}],name_decisions:[{genus:'Heterotetrax',decision:'accept',evidence:'Source-bound German review',reviewed_languages:['de']}]};
const germanCandidate=structuredClone(germanOld);
Object.assign(germanCandidate.nodes.find(n=>n.id===genus.id),after);
germanCandidate.dataset_revision=germanReport.dataset_revision;
assert.equal(verifyCandidate(germanOld,germanCandidate,germanReport).approved,true);
for(const decisions of [[],[{genus:'Other',decision:'accept',evidence:'review',reviewed_languages:['de']}],[{genus:'Heterotetrax',decision:'accept',evidence:'review',reviewed_languages:['en']}]]){
 assert.throws(()=>verifyCandidate(germanOld,germanCandidate,{...germanReport,name_decisions:decisions}));
}
for(const mutate of [n=>n.parent='other',n=>n.name='Other',n=>n.range='Unreviewed range']){
 const badReport=structuredClone(germanReport),badCandidate=structuredClone(germanCandidate);
 mutate(badReport.genus_patches[0].after);mutate(badCandidate.nodes.find(n=>n.id===genus.id));
 assert.throws(()=>verifyCandidate(germanOld,badCandidate,badReport));
}
console.log('PASS: separately reviewed German genus label; reject missing/wrong-language review and taxonomy changes.');
