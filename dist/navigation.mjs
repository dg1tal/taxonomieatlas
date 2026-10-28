// Snapshots are detached from live camera/open/filter state so later gestures cannot mutate history.
export class ViewHistory {
 constructor(limit=50){this.entries=[];this.position=-1;this.limit=limit;this.sequence=Math.random().toString(36).slice(2);this.counter=0;}
 get currentKey(){return this.entries[this.position]?._historyKey;}
 nextKey(){return this.sequence+'-'+(++this.counter);}
 restore(key,view){const i=this.entries.findIndex(v=>v._historyKey===key);if(i>=0){this.position=i;return;}this.entries=[];this.position=-1;this.remember(view);}
 get canBack(){return this.position>0;}
 get canForward(){return this.position<this.entries.length-1;}
 remember(view){const copy={...structuredClone(view),_historyKey:this.currentKey||this.nextKey()};if(this.position<0){this.entries=[copy];this.position=0;}else this.entries[this.position]=copy;}
 push(view){this.entries=this.entries.slice(0,this.position+1);this.entries.push({...structuredClone(view),_historyKey:this.nextKey()});if(this.entries.length>this.limit)this.entries.shift();this.position=this.entries.length-1;}
 travel(delta,current){const target=this.position+delta;if(target<0||target>=this.entries.length)return null;this.remember(current);this.position=target;return structuredClone(this.entries[target]);}
}
export const normalizeName=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('de').replace(/ß/g,'ss');
export function siblingTaxa(index,id,query=''){
 const n=index.byid.get(id),parent=index.byid.get(n?.parent),term=normalizeName(query.trim());
 return (parent?parent.children.map(id=>index.byid.get(id)):[n]).filter(n=>n?.count&&(!term||normalizeName([n.name,n.de,n.en].filter(Boolean).join(' ')).includes(term))).sort((a,b)=>a.name.localeCompare(b.name,'la'));
}
