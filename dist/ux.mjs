// Shared interaction rules. Storage failures never prevent reading the taxonomy.
export function safeRead(key,fallback=null){try{return globalThis.localStorage?.getItem(key)??fallback;}catch{return fallback;}}
export function safeWrite(key,value){try{globalThis.localStorage?.setItem(key,value);return true;}catch{return false;}}
export function readStoredView(){try{const v=JSON.parse(safeRead('taxonomy-view','null'));return v?.format===1?v.view:null;}catch{return null;}}
export function storeView(view){return safeWrite('taxonomy-view',JSON.stringify({format:1,view}));}
export function viewHash(view){return '#view='+encodeURIComponent(JSON.stringify(view));}
export function parseViewHash(hash){try{if(!hash?.startsWith('#view='))return null;const v=JSON.parse(decodeURIComponent(hash.slice(6)));return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{return null;}}
export function reconcileView(before,after,view){
 const nearest=id=>{let n=before?.byid.get(id)||after.byid.get(id);while(n&&!after.byid.get(n.id)?.count)n=before?.byid.get(n.parent)||after.byid.get(n.parent);return n?.id||after.root.id;};
 return {focusId:nearest(view.focusId),selectedId:after.byid.get(view.selectedId)?.count?view.selectedId:null,open:[...view.open].filter(id=>after.byid.get(id)?.count),listActiveId:nearest(view.listActiveId||view.selectedId||view.focusId)};
}
export function freeCanvasArea(viewport,overlay){
 let a={left:16,top:16,right:viewport.width-16,bottom:viewport.height-16};if(!overlay)return a;
 const o={left:overlay.left-viewport.left,top:overlay.top-viewport.top,right:overlay.right-viewport.left,bottom:overlay.bottom-viewport.top};
 if(o.right<=0||o.left>=viewport.width||o.bottom<=0||o.top>=viewport.height)return a;
 if(overlay.width>=viewport.width*.6){if((o.top+o.bottom)/2>viewport.height/2)a.bottom=Math.max(16,o.top-12);else a.top=Math.min(viewport.height-16,o.bottom+12);}
 else if((o.left+o.right)/2>viewport.width/2)a.right=Math.max(16,o.left-12);else a.left=Math.min(viewport.width-16,o.right+12);
 return a;
}
export const normalizeSearch=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').replace(/ß/g,'ss');
export function searchTaxa(idx,query,rank='all'){
 const term=normalizeSearch(query.trim());const names=n=>[n.name,n.de,n.en,...Object.values(n.vernacular_names||{}).flatMap(a=>a.map(v=>v.name))].filter(Boolean).map(normalizeSearch);
 const score=n=>{const a=names(n);return a.includes(term)?0:a.some(s=>s.startsWith(term))?1:a.some(s=>s.includes(term))?2:3;};
 return [...idx.byid.values()].filter(n=>n.count&&(rank==='all'||n.rank===rank)&&(names(n).some(s=>s.includes(term))||['species','subspecies'].includes(n.rank))).sort((a,b)=>score(a)-score(b)||a.name.localeCompare(b.name,'la'));
}
export function readableStatus(value,breeding=false){if(!value)return 'nicht angegeben';if(breeding){if(/^[NRL][1-6]/.test(value))return `Brutvogel (${value})`;if(value.startsWith('V'))return `Gelegentlicher Brutgast (${value})`;if(value.includes('0'))return `Kein aktueller Brutbestand laut Quelle (${value})`;return value;}const parts=[];if(/[Jj]/.test(value))parts.push('Jahresvogel');if(/[Zz]/.test(value))parts.push('Durchzügler');if(/[Ww]/.test(value))parts.push('Wintergast');if(/[Ss]/.test(value))parts.push('Seltenheit');return parts.length?`${parts.join(', ')} (${value})`:value;}
export function trapLayer(layer,{restoreFocus=null}={}){
 if(!layer?.addEventListener)return ()=>{};const changed=[];let node=layer;
 while(node?.parentElement){for(const sibling of node.parentElement.children){if(sibling===node||['SCRIPT','STYLE'].includes(sibling.tagName))continue;changed.push([sibling,sibling.inert]);sibling.inert=true;}node=node.parentElement;if(node===document.body)break;}
 const old={role:layer.getAttribute('role'),modal:layer.getAttribute('aria-modal'),tab:layer.getAttribute('tabindex')};layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('tabindex','-1');
 const controls=()=>[...layer.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')].filter(e=>!e.hidden&&e.getClientRects().length);
 const key=e=>{if(e.key!=='Tab')return;const c=controls();if(!c.length){e.preventDefault();layer.focus();return;}const first=c[0],last=c.at(-1);if(e.shiftKey&&(document.activeElement===first||first.contains?.(document.activeElement)||document.activeElement===layer)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!layer.contains(document.activeElement))){e.preventDefault();first.focus();}};
 layer.addEventListener('keydown',key);(controls()[0]||layer).focus({preventScroll:true});
 return (focus=true)=>{layer.removeEventListener('keydown',key);for(const [e,inert] of changed)e.inert=inert;for(const [name,value] of [['role',old.role],['aria-modal',old.modal],['tabindex',old.tab]])value===null?layer.removeAttribute(name):layer.setAttribute(name,value);if(focus)restoreFocus?.focus({preventScroll:true});};
}
