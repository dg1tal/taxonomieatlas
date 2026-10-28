import assert from 'node:assert/strict';import fs from 'node:fs';import {index,RANKS} from '../dist/engine.mjs';import {minimapGeometry,layoutTree,expandSubtree,graphContents,graphMarkup,wrapCardText,measureTextWidth,vernacular,inViewport,branchPath,NODE_HEIGHT,NODE_WIDTH} from '../dist/tree.mjs';
const b=JSON.parse(fs.readFileSync(new URL('../dist/data.json',import.meta.url))),idx=index(b),root=idx.root,open=new Set([root.id]);
const first=layoutTree(idx,root.id,open);assert.equal(first.nodes.length,46);assert.equal(first.edges.length,45);assert.ok(first.nodes.every(n=>!n.kind));
const all=expandSubtree(idx,root.id);const start=performance.now(),full=layoutTree(idx,root.id,all);const ms=performance.now()-start;
assert.equal(full.nodes.length,b.nodes.filter(n=>n.rank!=='subspecies').length);assert.equal(full.nodes.filter(n=>n.taxon.rank==='species').length,11172);assert.equal(full.edges.length,13846);assert.equal(full.positions.size,13847);assert.equal(full.root.taxon.count,11172);
assert.deepEqual([...full.positions.keys()].sort(),b.nodes.filter(n=>n.rank!=='subspecies').map(n=>n.id).sort());
for(const e of full.edges){const a=full.positions.get(e.from),b=full.positions.get(e.to);assert.ok(b.x>a.x+NODE_WIDTH);assert.ok(branchPath(a,b).includes('C'));}
for(let depth=0;depth<=4;depth++){const level=full.nodes.filter(n=>n.depth===depth).sort((a,b)=>a.y-b.y);for(let i=1;i<level.length;i++)assert.ok(level[i].y-level[i-1].y>=NODE_HEIGHT,'Overlapping nodes at depth '+depth);}
const closed=layoutTree(idx,root.id,new Set());assert.equal(closed.nodes.length,1);
const order=idx.byid.get(b.nodes.find(n=>n.name==='Passeriformes').id),part=layoutTree(idx,order.id,expandSubtree(idx,order.id));assert.equal(part.nodes.filter(n=>n.taxon.rank==='species').length,order.count);
for(const filter of ['all','winter','breeding','rare']){const f=index(b,'germany',filter),g=layoutTree(f,f.root.id,expandSubtree(f,f.root.id));assert.equal(g.nodes.filter(n=>n.taxon.rank==='species').length,f.matches);assert.ok(g.nodes.every(n=>n.taxon.count>0));}
const species=full.nodes.find(n=>n.taxon.name==='Parus major'),v={left:species.x-30,right:species.x+NODE_WIDTH+30,top:species.y-30,bottom:species.y+NODE_HEIGHT+30};assert.ok(inViewport(species,v));
const opts={expanded:all,selectedId:species.id,ranks:RANKS,label:n=>n.de||n.name,num:String},markup=graphContents(full,opts,v);assert.ok(markup.includes('Kohlmeise'));assert.ok(markup.includes('Great Tit'));assert.ok(markup.includes('Parus major'));assert.ok(markup.includes('Art · Species'));assert.ok(!markup.includes('undefined'));assert.ok(!markup.includes('NaN'));assert.ok((markup.match(/class="graph-node/g)||[]).length<12);
const coarse=graphContents(full,opts,null,true);assert.ok(coarse.includes('overview-boxes'));assert.ok(!coarse.includes('node-hit'));assert.ok(coarse.length<4000000);assert.ok((coarse.match(/<path/g)||[]).length<=3);
assert.equal(vernacular({rank:'genus'},'de'),'in den Quellen nicht hinterlegt');assert.equal(vernacular({rank:'species'},'de'),'noch nicht zugeordnet');assert.ok(graphMarkup(full,opts).includes('13847 aufgeklappte Knoten'));
const before=species.taxon.de;species.taxon.de='<script>alert(1)</script>';const safe=graphContents(full,opts,v);assert.ok(!safe.includes('<script>'));assert.ok(safe.includes('&lt;script&gt;'));species.taxon.de=before;
console.log(`PASS: Vollständiger Baum (13.847 Knoten, 11.172 Arten, ${ms.toFixed(1)} ms Layout), Teilbäume, alle Filter, keine Überlappungen, Ausschnittbegrenzung, vereinfachte Gesamtansicht, DE/EN/wissenschaftliche Namen, Escaping.`);

// Pixel width, not a character count, determines line breaks and suffix placement.
const measure=(s,font)=>[...s].reduce((w,c)=>w+(c==='W'?12:c==='i'?3:6),0);
assert.equal(wrapCardText('iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii', '16px system-ui',{width:268,measure}).length,1);
assert.equal(wrapCardText('WWWW WWWW WWWW WWWW WWWW', '16px system-ui',{width:268,suffix:26,measure}).length,2);
for(const n of b.nodes)for(const [value,font,suffix] of [[n.de||'noch nicht zugeordnet','550 18px system-ui',26],[n.name,'16px Georgia',0],[n.en||'noch nicht zugeordnet','16px system-ui',26]]){const rows=wrapCardText(value,font,{suffix});assert.ok(rows.length<=2);for(let i=0;i<rows.length;i++)assert.ok(measureTextWidth(rows[i],font)<=NODE_WIDTH-32-(i===rows.length-1?suffix:0)+.01,`${value}: overflow`);}
assert.ok(markup.includes('x="16" y="36"'));assert.ok(markup.includes('height="115"'));assert.ok(!markup.includes('x="42"'));
console.log('PASS: Full-width name blocks, measured wrapping, DE/EN suffix space, long names across all taxa, Content-sized cards and unchanged 300px width.');

// Map retains canvas proportions and the complete viewport at all edges/zoom levels.
for(const [width,height] of [[1200,400],[390,620],[2000,900]])for(const camera of [{x:0,y:0,z:1},{x:800,y:-900,z:.2},{x:-9000,y:500,z:2}]){
 const g=minimapGeometry(first,camera,width,height),v=g.viewport,box={x:g.x+v.left*g.scale,y:g.y+v.top*g.scale,width:(v.right-v.left)*g.scale,height:(v.bottom-v.top)*g.scale};
 assert.ok(Math.abs(box.width/box.height-width/height)<1e-10);
 assert.ok(box.x>=5.999&&box.y>=5.999&&box.x+box.width<=214.001&&box.y+box.height<=134.001);
 const centerX=box.x+box.width/2,centerY=box.y+box.height/2;
 assert.ok(Math.abs((centerX-g.x)/g.scale-(width/2-camera.x)/camera.z)<1e-8);
 assert.ok(Math.abs((centerY-g.y)/g.scale-(height/2-camera.y)/camera.z)<1e-8);
}
console.log('PASS: Uniform minimap scale, full viewport aspect ratio and inverse navigation at all boundaries.');

const localCamera={x:-500,y:-900,z:1},localBounds={left:-500,top:300,right:2500,bottom:2100};
const localMap=minimapGeometry({width:50000,height:1000000},localCamera,1000,600,220,140,localBounds);
assert.ok(1000*localMap.scale>40,'Local overview compressed the visible viewport to a hairline');
assert.ok(Math.abs((localMap.viewport.right-localMap.viewport.left)/(localMap.viewport.bottom-localMap.viewport.top)-1000/600)<1e-10);
console.log('PASS: Local overview remains usable for a very tall world tree.');
