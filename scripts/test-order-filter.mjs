import assert from 'node:assert/strict';import fs from 'node:fs';import {index} from '../dist/engine.mjs';import {layoutTree,expandSubtree} from '../dist/tree.mjs';
const b=JSON.parse(fs.readFileSync('dist/data.json')),base=index(b),orders=base.root.children.map(id=>base.byid.get(id));
const ids=names=>new Set(orders.filter(n=>names.includes(n.name)).map(n=>n.id));
const chosen=ids(['Passeriformes','Anseriformes','Strigiformes']);assert.equal(chosen.size,3);
const filtered=index(b,'global','all','',chosen);assert.equal(filtered.matches,orders.filter(n=>chosen.has(n.id)).reduce((sum,n)=>sum+n.count,0));
assert.deepEqual(filtered.root.children.filter(id=>filtered.byid.get(id).count>0).sort(),[...chosen].sort());
const checkTotals=i=>{for(const n of i.byid.values())if(n.rank!=='species')assert.equal(n.children.reduce((sum,id)=>sum+i.byid.get(id).count,0),n.count);};checkTotals(filtered);
const empty=index(b,'global','all','',new Set());assert.equal(empty.matches,0);assert.ok([...empty.byid.values()].every(n=>n.count===0));
assert.equal(index(b,'global','all','',new Set(orders.map(n=>n.id))).matches,base.matches);assert.equal(index(b,'global','all','',null).matches,base.matches);
const single=index(b,'global','all','',ids(['Strigiformes']));assert.equal(single.matches,orders.find(n=>n.name==='Strigiformes').count);
assert.equal(index(b,'global','all','Parus major',ids(['Strigiformes'])).matches,0);assert.equal(index(b,'global','all','Parus major',ids(['Passeriformes'])).matches,1);
for(const status of ['all','breeding','winter','migrant','historic','introduced','rare']){const germany=index(b,'germany',status,'',chosen);checkTotals(germany);assert.ok(germany.matches<=index(b,'germany',status).matches);const tree=layoutTree(germany,germany.root.id,expandSubtree(germany,germany.root.id));assert.equal(tree.nodes.filter(n=>n.taxon.rank==='species').length,germany.matches);}
const leaves=[...filtered.byid.values()].filter(n=>n.rank==='species'&&n.count);assert.equal(leaves.length,filtered.matches);assert.equal(new Set(leaves.map(n=>n.id)).size,leaves.length);
assert.equal(index(b,'global','all','',['nonexistent-id']).matches,0);
const names=orders.map(n=>n.name).sort((a,b)=>a.localeCompare(b,'la'));assert.equal(names[0],'Accipitriformes');assert.equal(names.at(-1),'Trogoniformes');
console.log('PASS: Mehrfachauswahl als Vereinigung, Alle/Keine, Deutschland und Status, Suche, Teilbaumsummen, vollständiger Filterbaum, exportierbare Arten ohne Duplikate und lateinische Sortierung.');
