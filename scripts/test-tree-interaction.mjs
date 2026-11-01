import assert from 'node:assert/strict';
import fs from 'node:fs';
import {index,RANKS} from '../dist/engine.mjs';
import {layoutTree,expandSubtree,graphContents,overviewLabels,detailLevel,attachCamera} from '../dist/tree.mjs';
const data=JSON.parse(fs.readFileSync('dist/data.json')),idx=index(data),find=name=>data.nodes.find(n=>n.name===name),passer=find('Passeriformes'),tit=find('Parus major');
const expanded=expandSubtree(idx,idx.root.id),full=layoutTree(idx,idx.root.id,expanded),opts={expanded,selectedId:tit.id,activeId:tit.id,ranks:RANKS,label:n=>n.de||n.name,num:String};
assert.equal(detailLevel(.85),'full');assert.equal(detailLevel(.5),'compact');assert.equal(detailLevel(.49),'overview');
assert.equal(detailLevel(.83,'full'),'full');assert.equal(detailLevel(.81,'full'),'compact');
assert.equal(detailLevel(.51,'overview'),'overview');assert.equal(detailLevel(.53,'overview'),'compact');
assert.equal(detailLevel(.86,'compact'),'compact');assert.equal(detailLevel(.88,'compact'),'full');assert.equal(detailLevel(.46,'compact'),'overview');
const compactLayout=layoutTree(idx,find('Paridae').id,expanded);
for(const z of [.47,.5,.65,.84]){
 const html=graphContents(compactLayout,{...opts,detail:'compact',touchTargets:true},null,false,z);
 assert.ok(html.includes('compact-label'));assert.ok(html.includes('Parus major'));assert.ok(!html.includes('undefined'));
 for(const [,size] of html.matchAll(/style="font-size:([\d.]+)px"/g))assert.ok(Number(size)*z>=12-1e-9);
 for(const [,size] of html.matchAll(/class="node-port-target"[^>]*width="([\d.]+)"/g))assert.ok(Number(size)*z>=44-1e-9);
}
const original=JSON.stringify(full.nodes.map(n=>[n.id,n.x,n.y]));
for(const detail of ['overview','compact','full'])graphContents(full,{...opts,detail},null,false,.6);
assert.equal(JSON.stringify(full.nodes.map(n=>[n.id,n.x,n.y])),original);
const labels=overviewLabels(full,{selectedId:tit.id,activeId:find('Turdus merula').id},null,.001);
assert.ok(labels.some(n=>n.id===tit.id));assert.ok(labels.some(n=>n.id===find('Turdus merula').id));
for(let i=0;i<labels.length;i++)for(const b of labels.slice(i+1)){const a=labels[i];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}
assert.ok(graphContents(full,{...opts,detail:'overview'},null,false,.001).includes(`data-node-toggle="${tit.id}"`));
for(const detail of ['overview','compact','full'])assert.ok(!graphContents(compactLayout,{...opts,tabStopId:null,detail},null,false,.6).includes('tabindex="0"')); 
console.log('PASS: Three detail levels with hysteresis, screen-sized text/touch targets, priority/collision-free overview labels and unchanged layout.');

let clock=0,reduced=false,rafId=0;const frames=new Map();
globalThis.requestAnimationFrame=fn=>{const id=++rafId;frames.set(id,fn);return id;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
globalThis.matchMedia=()=>({matches:reduced});globalThis.CSS={escape:s=>s};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
const emitter=extra=>Object.assign({handlers:new Map(),attrs:{},addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(fn);},removeEventListener(type,fn){this.handlers.get(type)?.delete(fn);},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]??null;},contains(){return false;},emit(type,props={}){const e={button:0,detail:1,pointerId:1,pointerType:'mouse',clientX:100,clientY:100,target:this,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...props};for(const fn of this.handlers.get(type)||[]){fn(e);if(e.stopped)break;}return e;}},extra);
const doc=emitter({activeElement:null,querySelector(){return null;}});globalThis.document=doc;
const step=time=>{clock=time;const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(time);};
function widget(layout,state={},extra={}){
 const scene=emitter({innerHTML:'',querySelector(){return null;}}),box=emitter(),miniScene=emitter(),mini=emitter({innerHTML:'',querySelector:s=>s==='.mini-scene'?miniScene:s==='.mini-viewport'?box:null,getBoundingClientRect:()=>({left:0,top:0,width:220,height:140})});
 const host={getBoundingClientRect:()=>({left:0,top:0,width:1000,height:620}),closest:()=>null,querySelector:s=>s==='#mini-map'?mini:null};
 const svg=emitter({parentElement:host,querySelector:()=>scene,setPointerCapture(){this.captures=(this.captures||0)+1;},closest(){return null;}});
 const camera=attachCamera(svg,layout,state,{anchorId:extra.anchorId,options:{...opts,now:()=>clock,...extra}});
 return {camera,state,svg,scene,mini};
}
const shallow=layoutTree(idx,idx.root.id,new Set([idx.root.id])),openPasser=new Set([idx.root.id,passer.id]),next=layoutTree(idx,idx.root.id,openPasser),p=shallow.positions.get(passer.id);
clock=0;const state={camera:{x:80-p.x,y:210-p.y,z:1},positions:shallow.positions};
const anchored=widget(next,state,{anchorId:passer.id,animate:true,expanded:openPasser});
for(const time of [0,90,180]){step(time);anchored.camera.paint();const n=state.renderedPositions.get(passer.id);assert.ok(Math.abs(state.camera.x+n.x-80)<1);assert.ok(Math.abs(state.camera.y+n.y-210)<1);assert.equal(state.camera.z,1);}
anchored.camera.destroy();assert.equal(frames.size,0);
console.log('PASS: Expanded node stays within one screen pixel throughout the 180 ms layout transition; zoom is unchanged.');

clock=0;const small=layoutTree(idx,find('Paridae').id,new Set([find('Paridae').id]));
const moving=widget(small,{camera:{x:50,y:40,z:1}},{animate:true});moving.camera.center(tit.id);step(90);
assert.notEqual(moving.state.camera.x,50);const midpoint={...moving.state.camera};moving.camera.pan('right');step(400);
assert.equal(moving.state.camera.x,midpoint.x-650);assert.equal(moving.state.camera.y,midpoint.y);moving.camera.destroy();
reduced=true;clock=0;const quiet=widget(small,{camera:{x:50,y:40,z:1}},{animate:true});quiet.camera.center(tit.id);assert.notEqual(quiet.state.camera.x,50);assert.equal(frames.size,1);step(10);assert.equal(frames.size,0);quiet.camera.destroy();reduced=false;
console.log('PASS: Camera flights are interrupted at their displayed state; reduced motion resolves immediately without animation frames continuing.');

clock=0;let mode='page-scroll';const touch=widget(small,{camera:{x:0,y:0,z:1}},{gestureMode:()=>mode,selectedId:find('Parus').id});
assert.equal(touch.svg.emit('touchmove',{touches:[{}]}).prevented,false);assert.equal(touch.svg.emit('touchstart',{touches:[{},{}]}).prevented,true);
const before={...touch.state.camera};touch.svg.emit('pointerdown',{pointerType:'touch'});touch.svg.emit('pointermove',{pointerType:'touch',clientY:190});
assert.deepEqual(touch.state.camera,before);assert.equal(touch.svg.captures||0,0);touch.svg.emit('pointerup',{pointerType:'touch'});
touch.svg.emit('pointerdown',{pointerType:'touch',pointerId:1,clientX:100});touch.svg.emit('pointerdown',{pointerType:'touch',pointerId:2,clientX:200});touch.svg.emit('pointermove',{pointerType:'touch',pointerId:2,clientX:250});assert.ok(touch.state.camera.z>1);
touch.svg.emit('pointercancel',{pointerType:'touch'});const canceled={...touch.state.camera};assert.equal(touch.svg.emit('touchmove',{touches:[{},{}]}).prevented,false);touch.svg.emit('pointerdown',{pointerType:'touch',clientX:500});touch.svg.emit('pointermove',{pointerType:'touch',clientX:700});assert.deepEqual(touch.state.camera,canceled);
touch.svg.emit('touchend',{touches:[]});mode='direct';touch.camera.updateInteraction();touch.svg.emit('pointerdown',{pointerType:'touch',clientX:100});touch.svg.emit('pointermove',{pointerType:'touch',clientX:160});assert.equal(touch.state.camera.x,canceled.x+60);touch.svg.emit('pointerup',{pointerType:'touch'});
assert.equal(touch.svg.emit('wheel',{deltaX:0,deltaY:30}).prevented,false);touch.svg.emit('focusin');assert.equal(touch.svg.emit('wheel',{deltaX:0,deltaY:30}).prevented,true);
step(30);assert.ok(touch.mini.innerHTML.includes('mini-path'));assert.ok(touch.mini.innerHTML.includes('mini-selected'));
touch.camera.destroy();assert.ok([...touch.svg.handlers.values()].every(s=>!s.size));assert.ok([...touch.mini.handlers.values()].every(s=>!s.size));assert.ok([...doc.handlers.values()].every(s=>!s.size));assert.equal(frames.size,0);
console.log('PASS: One-finger page-scroll policy, two-pointer transform, no reclaimed browser scroll, direct fullscreen drag, deliberate wheel activation and complete listener/RAF cleanup.');

const overview=widget(small,{camera:{x:0,y:0,z:.2}});
const labelClick=overview.svg.emit('click',{target:{closest:s=>s==='[data-node-toggle]'?{}:null}});
assert.equal(labelClick.stopped,false);assert.equal(overview.state.camera.z,.2);overview.camera.destroy();
console.log('PASS: Overview labels keep the same selection activation as cards and keyboard; only unlabelled diagram areas zoom.');
