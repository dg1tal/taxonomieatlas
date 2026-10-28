import assert from 'node:assert/strict';import fs from 'node:fs';import {validate,compare,index} from '../dist/engine.mjs';
const b=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url)));assert.deepEqual(validate(b),[]);
const idx=index(b);assert.equal(idx.matches,11172);assert.equal(idx.root.count,idx.matches);
for(const n of idx.byid.values())if(n.rank!=='species')assert.equal(n.children.reduce((s,id)=>s+idx.byid.get(id).count,0),n.count);
assert.equal(b.germany_source.records.length,527);assert.equal(index(b,'germany').matches,492);assert.equal(index(b,'global','all','Parus major').matches,1);
const bad=structuredClone(b);bad.nodes[2].parent=bad.nodes[2].id;assert.ok(validate(bad).length);
const duplicate=structuredClone(b);duplicate.nodes.push(duplicate.nodes[3]);assert.ok(validate(duplicate).length);
const idChange=structuredClone(b);idChange.nodes.at(-1).id='new-id';assert.ok(compare(b,idChange).identityErrors.length);
const move=structuredClone(b);const species=move.nodes.find(n=>n.rank==='species');species.parent='missing';assert.ok(validate(move).length);
assert.equal(compare(b,b).added.length,0);assert.equal(compare(b,b).removed.length,0);
console.log('PASS: Originalimport, 527 DOG-Datensätze, 492 Namenskandidaten, Summen aller Knoten, Suche, Zyklus, Duplikat, fehlender Parent, ID-Drift, Versionsvergleich.');
for(const f of ['all','breeding','migrant','winter','rare','historic','introduced']){const i=index(b,'germany',f);for(const n of i.byid.values())if(n.rank!=='species')assert.equal(n.children.reduce((s,id)=>s+i.byid.get(id).count,0),n.count);}
const changedGermany=structuredClone(b);changedGermany.germany_source.records[0].category='B';assert.equal(compare(b,changedGermany).germanyChanged,true);
const badSource=structuredClone(b);badSource.source.sha256='bad';assert.ok(validate(badSource).length);
const falseApproval=structuredClone(b);falseApproval.germany_source.records[0].review='confirmed';assert.ok(validate(falseApproval).length);
const split=structuredClone(b);const original=split.nodes.find(n=>n.rank==='species');split.nodes.push({...original,id:'split-example',name:original.name+'test'});assert.equal(compare(b,split).added.length,1);assert.equal(compare(b,split).removed.length,0);assert.equal(compare(b,split).added[0].id,'split-example');
assert.equal(index(b,'global','all','Sperlingsvögel').matches,index(b).byid.get(b.nodes.find(n=>n.name==='Passeriformes').id).count);
console.log('PASS: Alle Deutschlandfilter und Teilbaumsummen, geänderte Deutschlanddaten, Quellenhash, unbelegte Freigabe, neuer Split-Kandidat ohne Statusübertragung, deutsche Ordnungssuche.');
