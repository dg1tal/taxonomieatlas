import {freeCanvasArea} from './ux.mjs';
import {taxonCountLabel,GERMANY_SUBSPECIES_STATUS} from './engine.mjs';
// Full visible hierarchy; rendering is limited to the current viewport, never the data.
export const NODE_WIDTH=300,NODE_HEIGHT=180,LEVEL_GAP=100,ROW_GAP=24,PAGE_SIZE=Infinity;
export function layoutTree(index,rootId,expanded){
 const nodes=[],edges=[],positions=new Map();let cursor=24;
 function walk(id,depth,parent=null){
  const taxon=index.byid.get(id);if(!taxon||!taxon.count)return null;
  const node={id,taxon,depth,parent,x:24+depth*(NODE_WIDTH+LEVEL_GAP),y:0,children:[]};nodes.push(node);positions.set(id,node);
  const children=taxon.children.filter(id=>index.byid.get(id).count);node.childCount=children.length;
  if(expanded.has(id))for(const child of children){walk(child,depth+1,id);node.children.push(child);edges.push({from:id,to:child});}
  if(node.children.length)node.y=depth===0&&node.children.length>20?positions.get(node.children[0]).y+NODE_HEIGHT*1.5:(positions.get(node.children[0]).y+positions.get(node.children.at(-1)).y)/2;
  else{node.y=cursor;cursor+=NODE_HEIGHT+ROW_GAP;}
  return node;
 }
 const root=walk(rootId,0);let width=0,height=0;for(const n of nodes){width=Math.max(width,n.x+NODE_WIDTH+24);height=Math.max(height,n.y+NODE_HEIGHT+24);}
 return {nodes,edges,positions,root,width,height};
}
export function expandSubtree(index,rootId){const expanded=new Set();function visit(id){const n=index.byid.get(id);if(!n||!n.count)return;if(n.children.some(id=>index.byid.get(id)?.count)){expanded.add(id);n.children.forEach(visit);}}visit(rootId);return expanded;}
export function branchPath(a,b){const x1=a.x+NODE_WIDTH,y1=a.y+NODE_HEIGHT/2,x2=b.x,y2=b.y+NODE_HEIGHT/2,mid=(x1+x2)/2;return `M${x1},${y1}C${mid},${y1} ${mid},${y2} ${x2},${y2}`;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let textContext;const widthCache=new Map();
export function measureTextWidth(text,font){const key=font+'|'+text;if(widthCache.has(key))return widthCache.get(key);if(textContext===undefined){try{textContext=globalThis.document?.createElement?.('canvas').getContext('2d')||null;}catch{textContext=null;}}let width;if(textContext){textContext.font=font;width=textContext.measureText(text).width;}else{const size=Number(font.match(/(\d+)px/)?.[1]||14);width=[...String(text)].reduce((sum,c)=>sum+(/[ilI.,' ]/.test(c)?.3:/[MW@]/.test(c)?.9:.56)*size,0);}if(widthCache.size>25000)widthCache.clear();widthCache.set(key,width);return width;}
// The last line reserves room for its small language suffix, not a permanent left column.
export function wrapCardText(text,font,{width=NODE_WIDTH-32,suffix=0,maxLines=2,measure=measureTextWidth}={}){
 const words=String(text).trim().split(/\s+/),out=[];let current='';
 for(const word of words){if(current&&measure(current+' '+word,font)>width){out.push(current);current=word;}else current=(current+' '+word).trim();}if(current)out.push(current);
 if(out.length===1&&measure(out[0],font)>width-suffix){const split=out[0].lastIndexOf(' ');if(split>0)out.splice(0,1,out[0].slice(0,split),out[0].slice(split+1));}
 if(!out.length)out.push('');if(out.length>maxLines)out.splice(maxLines-1,out.length,out.slice(maxLines-1).join(' '));
 return out.map((line,i)=>{const available=width-(i===out.length-1?suffix:0);if(measure(line,font)<=available)return line;let chars=[...line];while(chars.length&&measure(chars.join('')+'…',font)>available)chars.pop();return chars.join('').trimEnd()+'…';});
}
export function vernacular(n,lang){return n[lang]||(n.rank==='genus'?'in den Quellen nicht hinterlegt':'noch nicht zugeordnet');}
export function inViewport(n,v){return !v||(n.x+NODE_WIDTH>=v.left&&n.x<=v.right&&n.y+NODE_HEIGHT>=v.top&&n.y<=v.bottom);}
// Rendering detail is camera state, not a change to the hierarchy or its layout.
export function detailLevel(scale,previous){
 if(previous==='full'&&scale>=.82)return 'full';
 if(previous==='overview'&&scale<.53)return 'overview';
 if(previous==='compact'){if(scale<.47)return 'overview';if(scale>=.88)return 'full';return 'compact';}
 return scale>=.85?'full':scale>=.5?'compact':'overview';
}
export function overviewLabels(layout,{selectedId,activeId},viewport,scale){
 const path=new Set();for(const id of [selectedId,activeId]){let n=layout.positions.get(id);while(n){path.add(n.id);n=layout.positions.get(n.parent);}}
 const priority=n=>n.id===activeId?0:n.id===selectedId?1:path.has(n.id)?2:3;
 const candidates=layout.nodes.filter(n=>inViewport(n,viewport)&&(path.has(n.id)||['class','clade','order','family'].includes(n.taxon.rank))).sort((a,b)=>priority(a)-priority(b)||a.depth-b.depth||a.y-b.y);
 const placed=[];for(const n of candidates){if(placed.length===20)break;const x=n.x*scale,y=n.y*scale,important=priority(n)<2;
  const bounds=viewport?{left:viewport.left*scale,top:viewport.top*scale,right:viewport.right*scale,bottom:viewport.bottom*scale}:null;
  const width=bounds?Math.min(280,Math.max(80,bounds.right-bounds.left-12)):280;
  for(const dy of important?[0,66,-66,132,-132]:[0]){let px=x,py=y+dy;if(bounds){px=Math.max(bounds.left+6,Math.min(px,bounds.right-width-6));py=Math.max(bounds.top+6,Math.min(py,bounds.bottom-66));}
   if(placed.some(p=>px<p.x+p.width+5&&px+width+5>p.x&&py<p.y+65&&py+65>p.y))continue;
   placed.push({id:n.id,node:n,x:px,y:py,width,height:60});break;
  }
 }return placed;
}
function nodeControls(n,isOpen,cardHeight,scale,touch){
 const target=touch?44/scale:26,half=target/2;
 return n.childCount?`<rect class="node-port-target" data-node-expand="${esc(n.id)}" x="${NODE_WIDTH-half}" y="${cardHeight/2-half}" width="${target}" height="${target}"/><circle class="node-port" data-node-expand="${esc(n.id)}" cx="${NODE_WIDTH}" cy="${cardHeight/2}" r="${touch?Math.min(17/scale,20):13}"/><text class="node-plus" data-node-expand="${esc(n.id)}" x="${NODE_WIDTH}" y="${cardHeight/2+5/scale}" text-anchor="middle" style="font-size:${16/scale}px">${isOpen?'−':'+'}</text>`:'';
}
export function graphContents(layout,{expanded,selectedId,activeId,tabStopId=activeId,ranks,label,num,detail,touchTargets=false,labelViewport},viewport=null,coarse=false,scale=1){
 const level=detail||(coarse?'overview':'full');
 const ancestors=new Set();let a=layout.positions.get(selectedId);while(a){ancestors.add(a.id);a=layout.positions.get(a.parent);}
 const visible=layout.nodes.filter(n=>inViewport(n,viewport));let plain='',highlight='';
 for(const e of layout.edges){const a=layout.positions.get(e.from),b=layout.positions.get(e.to);if(viewport&&(b.x<viewport.left||a.x+NODE_WIDTH>viewport.right||Math.max(a.y,b.y)+NODE_HEIGHT<viewport.top||Math.min(a.y,b.y)>viewport.bottom))continue;const d=branchPath(a,b);if(ancestors.has(a.id)&&ancestors.has(b.id))highlight+=d;else plain+=d;}
 const branches=`<g class="branches" aria-hidden="true"><path class="branch" d="${plain}"/><path class="branch on-path" d="${highlight}"/></g>`;
 if(level==='overview'){
  const boxes=visible.map(n=>`M${n.x},${n.y}h${NODE_WIDTH}v${NODE_HEIGHT}h-${NODE_WIDTH}z`).join('');
  const labels=overviewLabels(layout,{selectedId,activeId},labelViewport||viewport,scale).map(p=>{const n=p.node,short=(value,size=12,prefix='')=>wrapCardText(value,`${size}px system-ui`,{width:p.width-12-measureTextWidth(prefix,`${size}px system-ui`),maxLines:1})[0];return `<g class="semantic-label ${n.id===selectedId?'selected':''}" role="button" tabindex="${n.id===tabStopId?0:-1}" data-node-toggle="${esc(n.id)}" data-overview-node="${esc(n.id)}" aria-label="${esc(ranks[n.taxon.rank]+': '+n.taxon.name+'. Deutsch: '+vernacular(n.taxon,'de')+'. English: '+vernacular(n.taxon,'en')+'. '+taxonCountLabel(n.taxon,num))}" transform="translate(${p.x/scale} ${p.y/scale}) scale(${1/scale})"><rect width="${p.width}" height="60" rx="5"/><text x="6" y="16">${esc(short(n.taxon.name,14))}</text><text class="semantic-common" x="6" y="34">DE: ${esc(short(n.taxon.de||n.taxon.name,12,'DE: '))}</text><text class="semantic-common" x="6" y="51">EN: ${esc(short(vernacular(n.taxon,'en'),12,'EN: '))}</text><title>${esc(n.taxon.name)} · ${taxonCountLabel(n.taxon,num)}</title></g>`;}).join('');
  return `${branches}<path class="overview-boxes" d="${boxes}"/>${labels}`;
 }
 const cards=visible.map(n=>{const t=n.taxon,isOpen=expanded.has(n.id),de=vernacular(t,'de'),en=vernacular(t,'en'),desc=`${ranks[t.rank]}: ${t.name}. Deutsch: ${de}. English: ${en}. ${taxonCountLabel(t,num)}.${t.rank==='subspecies'?' Deutschland: '+GERMANY_SUBSPECIES_STATUS[t.germany_status||'not_evaluated']+'.':''}${t.de_descriptive||t.en_descriptive?' Namen mit Stern sind beschreibende Anzeigen aus dem Artnamen und Unterartepitheton.':''}`;
 if(level==='compact'){
  const cardHeight=74/scale,top=(NODE_HEIGHT-cardHeight)/2,width=NODE_WIDTH*scale-78,short=(text,size)=>wrapCardText(text,`${size}px system-ui`,{width,maxLines:1})[0];
  return `<g class="graph-node compact ${n.id===selectedId?'selected':''} ${ancestors.has(n.id)?'on-path':''}" data-node-id="${esc(n.id)}" transform="translate(${n.x},${n.y})"><g transform="translate(0 ${top})"><g class="node-hit" role="button" tabindex="${n.id===tabStopId?0:-1}" data-node-toggle="${esc(n.id)}" ${n.childCount?`aria-expanded="${isOpen}"`:''} aria-label="${esc(desc)}"><title>${esc(desc)}</title><rect class="node-card" width="300" height="${cardHeight}" rx="10"/><text class="compact-label" x="${12/scale}" y="${22/scale}" style="font-size:${14/scale}px">${esc(short(t.de||t.name,14))}</text><text class="compact-scientific" x="${12/scale}" y="${42/scale}" style="font-size:${12/scale}px">${esc(short(t.name,12))}</text><text class="compact-total" x="${12/scale}" y="${62/scale}" style="font-size:${12/scale}px">${esc(short(taxonCountLabel(t,num),12))}</text>${nodeControls(n,isOpen,cardHeight,scale,touchTargets)}</g><g class="node-isolate" role="button" tabindex="-1" data-node-focus="${esc(n.id)}" aria-label="${esc(label(t))} als Teilbaum öffnen"><rect x="${300-66/scale}" width="${44/scale}" height="${44/scale}"/><text x="${300-44/scale}" y="${23/scale}" text-anchor="middle" style="font-size:${16/scale}px">↗</text></g></g></g>`;
 }
 const deFont=`${t.de?'550':'400'} 18px system-ui`,enFont='400 16px system-ui',scientificFont=`${['genus','species','subspecies'].includes(t.rank)?'italic ':''}16px Georgia`;const deLines=wrapCardText(de,deFont,{suffix:t.de_descriptive?34:26}),enLines=wrapCardText(en,enFont,{suffix:t.en_descriptive?34:26}),scientificLines=wrapCardText(t.name,scientificFont);const deY=36,scientificY=deY+(deLines.length-1)*22+22,enY=scientificY+(scientificLines.length-1)*20+22,totalY=enY+(enLines.length-1)*20+23,cardHeight=totalY+12,cardTop=(NODE_HEIGHT-cardHeight)/2;const block=(content,cls,y,step)=>`<text class="${cls}" x="16" y="${y}">${content.map((line,i)=>`<tspan x="16" dy="${i?step:0}">${esc(line)}</tspan>`).join('')}</text>`;const suffix=(content,font,language,y,step)=>`<text class="node-language" x="${16+measureTextWidth(content.at(-1),font)+8}" y="${y+(content.length-1)*step}">${language}</text>`;
 return `<g class="graph-node ${n.id===selectedId?'selected':''} ${ancestors.has(n.id)?'on-path':''}" data-node-id="${esc(n.id)}" transform="translate(${n.x},${n.y})"><g transform="translate(0 ${cardTop})"><g class="node-hit" role="button" tabindex="${n.id===tabStopId?0:-1}" data-node-toggle="${esc(n.id)}" ${n.childCount?`aria-expanded="${isOpen}"`:''} aria-label="${esc(desc)}"><title>${esc(desc)}</title><rect class="node-card" width="${NODE_WIDTH}" height="${cardHeight}" rx="12"/><text class="node-rank" x="16" y="16">${esc(ranks[t.rank])}</text>${block(deLines,`node-label ${t.de?'':'name-missing'}`,deY,22)}${suffix(deLines,deFont,t.de_descriptive?'DE*':'DE',deY,22)}${block(scientificLines,`node-scientific ${['genus','species','subspecies'].includes(t.rank)?'scientific':''}`,scientificY,20)}${block(enLines,`node-english ${t.en?'':'name-missing'}`,enY,20)}${suffix(enLines,enFont,t.en_descriptive?'EN*':'EN',enY,20)}<text class="node-total" x="16" y="${totalY}">${t.rank==='subspecies'?'':taxonCountLabel(t,num)}${t.rank==='subspecies'?'Deutschland: '+({confirmed:'belegt',open:'offen',source_uncertain:'Quelle unsicher',not_evaluated:'ungeprüft'}[t.germany_status]||'ungeprüft'):''}${n.childCount&&t.rank!=='species'&&!t.subspeciesCount?' · '+n.childCount+(n.childCount===1?' Zweig':' Zweige'):''}</text>${nodeControls(n,isOpen,cardHeight,scale,touchTargets)}</g><g class="node-isolate" role="button" tabindex="-1" data-node-focus="${esc(n.id)}" aria-label="${esc(label(t))} als Teilbaum öffnen"><rect x="${touchTargets?300-66/scale:256}" y="0" width="${touchTargets?44/scale:44}" height="${touchTargets?44/scale:28}" rx="10"/><text x="${touchTargets?300-44/scale:278}" y="21" text-anchor="middle">↗</text></g></g></g>`;}).join('');return branches+cards;
}
export function graphMarkup(layout,options){return `<svg id="branch-canvas" role="group" aria-label="Interaktiver Taxonomiebaum, ${layout.nodes.length} aufgeklappte Knoten" tabindex="0"><g id="branch-scene"></g></svg>`;}
// One uniform map scale includes the entire viewport, even beyond the tree bounds.
export function minimapGeometry(layout,camera,width,height,mapWidth=220,mapHeight=140,bounds=null){
 const viewport={left:-camera.x/camera.z,top:-camera.y/camera.z,right:(width-camera.x)/camera.z,bottom:(height-camera.y)/camera.z};
 const left=Math.min(bounds?.left??0,viewport.left),top=Math.min(bounds?.top??0,viewport.top),right=Math.max(bounds?.right??layout.width,viewport.right),bottom=Math.max(bounds?.bottom??layout.height,viewport.bottom);
 const scale=Math.min((mapWidth-12)/(right-left),(mapHeight-12)/(bottom-top));
 return {viewport,scale,x:(mapWidth-(right-left)*scale)/2-left*scale,y:(mapHeight-(bottom-top)*scale)/2-top*scale};
}
export function attachCamera(svg,layout,state,{anchorId,reset=false,options={}}={}){
 const scene=svg.querySelector('#branch-scene'),host=svg.parentElement,rect=()=>host.getBoundingClientRect();
 let w=rect().width||800,h=rect().height||620,frame=0,disposed=false,activated=false,cameraMotion=null,layoutMotion=null;
 const removers=[],listen=(target,type,handler,config)=>{target?.addEventListener?.(type,handler,config);removers.push(()=>target?.removeEventListener?.(type,handler,config));};
 const now=()=>options.now?.()??globalThis.performance?.now?.()??Date.now();
 const reduce=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const animated=()=>options.animate===true&&!reduce();
 const previous=state.renderedPositions||state.positions,oldCamera=state.camera?{...state.camera}:null;
 let camera=state.camera;
 if(reset||!camera){camera={x:24-layout.root.x,y:h/2-layout.root.y-NODE_HEIGHT/2,z:1};state.camera=camera;}
 else if(anchorId&&previous?.has(anchorId)&&layout.positions.has(anchorId)){
  const old=previous.get(anchorId),next=layout.positions.get(anchorId);camera.x+=(old.x-next.x)*camera.z;camera.y+=(old.y-next.y)*camera.z;
 }
 if(animated()&&oldCamera&&previous){
  const dx=(oldCamera.x-camera.x)/camera.z,dy=(oldCamera.y-camera.y)/camera.z,from=new Map();let changed=false;
  for(const n of layout.nodes){const p=previous.get(n.id)||previous.get(n.parent)||n;const point={x:p.x+dx,y:p.y+dy};from.set(n.id,point);if(Math.abs(point.x-n.x)>.01||Math.abs(point.y-n.y)>.01)changed=true;}
  if(changed)layoutMotion={from,start:now()};
 }
 state.positions=layout.positions;
 let level=detailLevel(camera.z,state.detailLevel),mapGeometry;
 const mode=()=>typeof options.gestureMode==='function'?options.gestureMode():options.gestureMode||'direct';
 const touchTargets=()=>typeof options.touchTargets==='function'?options.touchTargets():!!options.touchTargets;
 const active=()=>activated||document.activeElement===svg||!!svg.contains?.(document.activeElement);
 const progress=(motion,time)=>Math.max(0,Math.min(1,(time-motion.start)/180));
 const ease=t=>t*t*(3-2*t);
 function sample(time){if(cameraMotion){const t=progress(cameraMotion,time),e=ease(t);for(const k of ['x','y','z'])camera[k]=cameraMotion.from[k]+(cameraMotion.to[k]-cameraMotion.from[k])*e;if(t===1)cameraMotion=null;}}
 function rendered(time){
  if(!layoutMotion)return layout;const t=progress(layoutMotion,time),e=ease(t);if(t===1){layoutMotion=null;return layout;}
  const nodes=layout.nodes.map(n=>{const p=layoutMotion.from.get(n.id);return {...n,x:p.x+(n.x-p.x)*e,y:p.y+(n.y-p.y)*e};});
  const positions=new Map(nodes.map(n=>[n.id,n]));return {...layout,nodes,positions,root:positions.get(layout.root.id)};
 }
 const mini=host.querySelector('#mini-map'),mw=220,mh=140;
 if(mini){
  mini.setAttribute('viewBox',`0 0 ${mw} ${mh}`);const boxes=layout.nodes.map(n=>`M${n.x},${n.y}h${NODE_WIDTH}v${NODE_HEIGHT}h-${NODE_WIDTH}z`).join('');
  let n=layout.positions.get(options.selectedId),path='';while(n?.parent){const parent=layout.positions.get(n.parent);path+=branchPath(parent,n);n=parent;}
  n=layout.positions.get(options.selectedId);mini.innerHTML=`<g class="mini-scene"><path class="mini-nodes" d="${boxes}"/><path class="mini-path" d="${path}"/>${n?`<circle class="mini-selected" cx="${n.x+NODE_WIDTH/2}" cy="${n.y+NODE_HEIGHT/2}"/>`:''}</g><rect class="mini-viewport"/>`;
  listen(mini,'click',e=>{if(!mapGeometry)return;const r=mini.getBoundingClientRect(),screenScale=Math.min(r.width/mw,r.height/mh),px=(e.clientX-r.left-(r.width-mw*screenScale)/2)/screenScale,py=(e.clientY-r.top-(r.height-mh*screenScale)/2)/screenScale,x=(px-mapGeometry.x)/mapGeometry.scale,y=(py-mapGeometry.y)/mapGeometry.scale;move({x:w/2-x*camera.z,y:h/2-y*camera.z,z:camera.z});});
 }
 function paint(time=now()){
  if(disposed)return;if(reduce()){if(cameraMotion)Object.assign(camera,cameraMotion.to);cameraMotion=null;layoutMotion=null;}sample(time);const current=rendered(time);state.renderedPositions=current.positions;
  const pad=90/camera.z,viewport={left:-camera.x/camera.z-pad,right:(w-camera.x)/camera.z+pad,top:-camera.y/camera.z-pad,bottom:(h-camera.y)/camera.z+pad};
  const focus=document.activeElement?.getAttribute?.('data-node-toggle');
  level=detailLevel(camera.z,level);state.detailLevel=level;
  scene.innerHTML=graphContents(current,{...options,activeId:state.activeNode,tabStopId:document.activeElement===svg||svg.contains?.(document.activeElement)?state.activeNode:null,detail:level,touchTargets:touchTargets(),labelViewport:{left:-camera.x/camera.z,right:(w-camera.x)/camera.z,top:-camera.y/camera.z,bottom:(h-camera.y)/camera.z}},viewport,false,camera.z);
  scene.setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.z})`);
  svg.setAttribute('data-detail-level',level);svg.setAttribute('data-gesture-mode',mode());
  if(focus){const target=scene.querySelector(`[data-node-toggle="${CSS.escape(focus)}"]`);target?.setAttribute?.('tabindex','0');target?.focus({preventScroll:true});}
  const output=document.querySelector('#zoom-level');if(output)output.textContent=(camera.z<.01?(camera.z*100).toFixed(3):Math.round(camera.z*100))+' %';
  const box=mini?.querySelector('.mini-viewport');if(box){
   const vx=-camera.x/camera.z,vy=-camera.y/camera.z;mapGeometry=minimapGeometry(layout,camera,w,h,mw,mh,options.minimapLocal?{left:vx-w/camera.z,top:vy-h/camera.z,right:vx+2*w/camera.z,bottom:vy+2*h/camera.z}:null);
   const {viewport:v,scale:m,x,y}=mapGeometry;mini.querySelector('.mini-scene').setAttribute('transform',`translate(${x} ${y}) scale(${m})`);mini.querySelector('.mini-selected')?.setAttribute('r',4/m);box.setAttribute('x',x+v.left*m);box.setAttribute('y',y+v.top*m);box.setAttribute('width',(v.right-v.left)*m);box.setAttribute('height',(v.bottom-v.top)*m);
  }
  const guide=host.querySelector('.graph-map-guide');if(guide){guide.hidden=level==='full'&&layout.root.childCount<=20;guide.textContent=level==='overview'?'Übersicht · Beschriftung: Details · Knotenfläche: vergrößern. Auswahl und Pfad bleiben hervorgehoben.':level==='compact'?'Kompakte Ansicht · Namen und Artenzahl. Vergrößern zeigt alle Kartendetails.':`${layout.root.childCount} Zweige · Teilbaum erkunden oder Liste wählen.`;}
  const hint=host.closest?.('.branch-panel')?.querySelector('.graph-hint');if(hint)hint.textContent=mode()==='page-scroll'?'Ein Finger scrollt die Seite · Zwei Finger verschieben und zoomen den Baum · Große Ansicht: direkt mit einem Finger verschieben':'Karte: Details · +/−: Untergruppen · ↗: Teilbaum · Fläche ziehen · Mausrad nach Aktivierung';
  options.onCameraChange?.();
 }
 function tick(time){frame=0;if(!Number.isFinite(time)){cameraMotion=null;layoutMotion=null;}paint(Number.isFinite(time)?time:now());if(cameraMotion||layoutMotion)queue();}
 function queue(){if(disposed||frame)return;frame=-1;const id=requestAnimationFrame(tick);if(frame===-1)frame=id;}
 function apply(){sample(now());scene.setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.z})`);queue();}
 function interrupt(){sample(now());cameraMotion=null;}
 function move(to,animate=true){interrupt();if(animate&&animated()){cameraMotion={from:{...camera},to,start:now()};queue();}else{Object.assign(camera,to);apply();}}
 const area=()=>{const details=host.closest?.('.branch-panel')?.querySelector('.detail');return freeCanvasArea(rect(),details&&getComputedStyle(details).position!=='static'?details.getBoundingClientRect():null);};
 const center=id=>{interrupt();const n=layout.positions.get(id)||layout.root,a=area();move({x:(a.left+a.right)/2-(n.x+NODE_WIDTH/2)*camera.z,y:(a.top+a.bottom)/2-(n.y+NODE_HEIGHT/2)*camera.z,z:camera.z});};
 const ensureVisible=id=>{
  state.activeNode=id;sample(now());const n=rendered(now()).positions.get(id)||layout.root,a=area(),left=camera.x+n.x*camera.z,top=camera.y+n.y*camera.z,right=left+NODE_WIDTH*camera.z,bottom=top+NODE_HEIGHT*camera.z;
  let x=camera.x,y=camera.y;if(right-left>a.right-a.left)x+=(a.left+a.right-left-right)/2;else if(left<a.left)x+=a.left-left;else if(right>a.right)x-=right-a.right;
  if(bottom-top>a.bottom-a.top)y+=(a.top+a.bottom-top-bottom)/2;else if(top<a.top)y+=a.top-top;else if(bottom>a.bottom)y-=bottom-a.bottom;
  // Visibility correction is immediate so the restored keyboard target exists now.
  if(x!==camera.x||y!==camera.y)move({x,y,z:camera.z},false);
 };
 const fit=()=>{const a=area(),z=Math.max(.00001,Math.min(1.2,(a.right-a.left)/layout.width,(a.bottom-a.top)/layout.height));move({x:(a.left+a.right-layout.width*z)/2,y:(a.top+a.bottom-layout.height*z)/2,z});};
 const zoom=(factor,cx=w/2,cy=h/2)=>{interrupt();const z=Math.max(.00001,Math.min(2,camera.z*factor)),ratio=z/camera.z;camera.x=cx-(cx-camera.x)*ratio;camera.y=cy-(cy-camera.y)*ratio;camera.z=z;apply();};
 const pan=direction=>{interrupt();if(direction==='left')camera.x+=w*.65;if(direction==='right')camera.x-=w*.65;if(direction==='up')camera.y+=h*.65;if(direction==='down')camera.y-=h*.65;apply();};
 const pointers=new Map();let gesture=null,moved=false,touchBlocked=false;
 listen(svg,'focusin',()=>{activated=true;});listen(svg,'focusout',e=>{if(!svg.contains?.(e.relatedTarget))activated=false;});
 listen(globalThis.document,'pointerdown',e=>{if(e.target!==svg&&!svg.contains?.(e.target))activated=false;},true);
 listen(svg,'pointerdown',e=>{
  if(e.button!==0||touchBlocked&&e.pointerType==='touch')return;interrupt();if(!pointers.size)moved=false;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,touch:e.pointerType==='touch'});
  if(e.pointerType!=='touch')activated=true;
  if(pointers.size===1){gesture={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y};if(mode()==='direct'&&!e.target.closest('[role=button]'))svg.setPointerCapture?.(e.pointerId);}
  else if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={distance:Math.hypot(b.x-a.x,b.y-a.y),midX:(a.x+b.x)/2-rect().left,midY:(a.y+b.y)/2-rect().top,z:camera.z,x:camera.x,y:camera.y};for(const id of pointers.keys())svg.setPointerCapture?.(id);}
 });
 listen(svg,'pointermove',e=>{
  if(!pointers.has(e.pointerId))return;const touch=pointers.get(e.pointerId).touch;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,touch});
  if(pointers.size===1&&gesture&&gesture.distance===undefined){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>5)moved=true;if(touch&&mode()==='page-scroll')return;
   if(moved){svg.setPointerCapture?.(e.pointerId);camera.x=gesture.cx+dx;camera.y=gesture.cy+dy;apply();}
  }else if(pointers.size===2&&gesture?.distance){moved=true;const [a,b]=[...pointers.values()],distance=Math.hypot(b.x-a.x,b.y-a.y),z=Math.max(.00001,Math.min(2,gesture.z*distance/gesture.distance)),ratio=z/gesture.z,mx=(a.x+b.x)/2-rect().left,my=(a.y+b.y)/2-rect().top;camera.x=mx-(gesture.midX-gesture.x)*ratio;camera.y=my-(gesture.midY-gesture.y)*ratio;camera.z=z;apply();}
 });
 const release=e=>{pointers.delete(e.pointerId);if(pointers.size===1){const a=[...pointers.values()][0];gesture={x:a.x,y:a.y,cx:camera.x,cy:camera.y};}else if(!pointers.size)gesture=null;};
 listen(svg,'pointerup',release);listen(svg,'pointercancel',e=>{if(e.pointerType==='touch'&&mode()==='page-scroll')touchBlocked=true;pointers.clear();gesture=null;moved=true;});
 // Do not reclaim a sequence once the browser has started native page scrolling.
 const twoTouches=e=>{if(mode()==='page-scroll'&&!touchBlocked&&e.touches.length>=2)e.preventDefault();};
 listen(svg,'touchstart',twoTouches,{passive:false});listen(svg,'touchmove',twoTouches,{passive:false});listen(svg,'touchend',e=>{if(!e.touches.length)touchBlocked=false;});listen(svg,'touchcancel',()=>{touchBlocked=false;pointers.clear();gesture=null;});
 listen(svg,'click',e=>{
  if(moved){e.stopImmediatePropagation();e.preventDefault();moved=false;return;}activated=true;
  if(level==='overview'&&e.detail!==0&&!e.target.closest('[data-node-toggle]')){const x=(e.clientX-rect().left-camera.x)/camera.z,y=(e.clientY-rect().top-camera.y)/camera.z,id=e.target.closest('[data-overview-node]')?.dataset.overviewNode,n=layout.positions.get(id)||layout.nodes.find(n=>x>=n.x&&x<=n.x+NODE_WIDTH&&y>=n.y&&y<=n.y+NODE_HEIGHT);
   if(n){const a=area();move({x:(a.left+a.right)/2-(n.x+NODE_WIDTH/2),y:(a.top+a.bottom)/2-(n.y+NODE_HEIGHT/2),z:1});e.stopImmediatePropagation();}
  }
 },true);
 listen(svg,'wheel',e=>{if(!active())return;e.preventDefault();if(e.ctrlKey||e.metaKey)zoom(Math.exp(-e.deltaY*.006),e.clientX-rect().left,e.clientY-rect().top);else{interrupt();camera.x-=e.deltaX;camera.y-=e.deltaY;apply();}},{passive:false});
 listen(svg,'keydown',e=>{if(!['+','=','-','0'].includes(e.key)&&e.target!==svg)return;const delta=65;if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='0')fit();else if(e.key==='ArrowLeft')panKey(delta,0);else if(e.key==='ArrowRight')panKey(-delta,0);else if(e.key==='ArrowUp')panKey(0,delta);else if(e.key==='ArrowDown')panKey(0,-delta);else return;e.preventDefault();});
 function panKey(x,y){interrupt();camera.x+=x;camera.y+=y;apply();}
 const observer=new ResizeObserver(()=>{const r=rect();w=r.width;h=r.height;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);apply();});observer.observe(host);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);paint();if(layoutMotion)queue();
 return {zoom,fit,center,ensureVisible,paint,pan,updateInteraction:()=>paint(),destroy:()=>{sample(now());state.renderedPositions=rendered(now()).positions;disposed=true;observer.disconnect();cancelAnimationFrame(frame);cameraMotion=null;layoutMotion=null;for(const remove of removers)remove();pointers.clear();}};
}
