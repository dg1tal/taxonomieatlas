// Optional, source-specific view. This is not part of the AviList import.
export const CLADE_SOURCE={citation:'Stiller et al. (2024), Nature 629, 690–697',url:'https://doi.org/10.1038/s41586-024-07323-1'};
export const CLADE_GROUPS=[
 {id:'phylo:palaeognathae',name:'Palaeognathae',de:'Urkiefervögel',en:'Palaeognaths',parent:'Aves',orders:['Struthioniformes','Casuariiformes','Apterygiformes','Rheiformes','Tinamiformes']},
 {id:'phylo:neognathae',name:'Neognathae',de:'Neukiefervögel',en:'Neognaths',parent:'Aves'},
 {id:'phylo:galloanserae',name:'Galloanserae',de:'Gänse- und Hühnervögel',en:'Fowl',parent:'phylo:neognathae',orders:['Anseriformes','Galliformes']},
 {id:'phylo:neoaves',name:'Neoaves',de:'Neoaves',en:'Neoaves',parent:'phylo:neognathae',orders:['Phoenicopteriformes','Podicipediformes','Musophagiformes','Otidiformes','Cuculiformes','Mesitornithiformes','Pterocliformes','Columbiformes','Opisthocomiformes','Gruiformes','Charadriiformes','Eurypygiformes','Phaethontiformes','Gaviiformes','Sphenisciformes','Procellariiformes','Ciconiiformes','Suliformes','Pelecaniformes','Caprimulgiformes','Steatornithiformes','Nyctibiiformes','Podargiformes','Aegotheliformes','Apodiformes','Strigiformes','Cathartiformes','Accipitriformes','Coliiformes','Leptosomiformes','Trogoniformes','Bucerotiformes','Coraciiformes','Piciformes','Cariamiformes','Falconiformes','Psittaciformes','Passeriformes']}
];
export function addCladeOverlay(byid){const root=[...byid.values()].find(n=>n.rank==='class');const mapping=new Map(CLADE_GROUPS.flatMap(g=>(g.orders||[]).map(name=>[name,g.id])));const sourceOrders=[...byid.values()].filter(n=>n.rank==='order');const unknown=sourceOrders.filter(n=>!mapping.has(n.name));const missing=[...mapping.keys()].filter(name=>!sourceOrders.some(n=>n.name===name));if(unknown.length||missing.length)return {active:false,unknown:unknown.map(n=>n.name),missing};
 for(const g of CLADE_GROUPS)byid.set(g.id,{id:g.id,name:g.name,de:g.de,en:g.en,rank:'clade',parent:g.parent==='Aves'?root.id:g.parent,children:[],count:0,overlay_source:CLADE_SOURCE});
 root.children=[];for(const g of CLADE_GROUPS){const n=byid.get(g.id);byid.get(n.parent).children.push(n.id);}
 for(const n of sourceOrders){n.parent=mapping.get(n.name);byid.get(n.parent).children.push(n.id);}
 return {active:true,unknown:[],missing:[]};}

// Retain real taxa when switching the optional overlay. Insert its ancestors so
// previously open orders remain visible; synthetic clades cannot survive off.
export function remapCladeView(before,after,focusId,selectedId,open){
 let focus=before.byid.get(focusId);
 while(focus&&!after.byid.get(focus.id)?.count)focus=before.byid.get(focus.parent);
 const nextFocus=focus?.id||after.root.id;
 const nextSelected=selectedId&&after.byid.get(selectedId)?.count?selectedId:null;
 const expanded=new Set([...open].filter(id=>after.byid.get(id)?.count&&after.byid.get(id).children.some(child=>after.byid.get(child)?.count)));
 expanded.add(nextFocus);
 for(const id of [...expanded]){let node=after.byid.get(id);while(node&&node.id!==nextFocus){node=after.byid.get(node.parent);if(node?.rank==='clade')expanded.add(node.id);}}
 return {focusId:nextFocus,selectedId:nextSelected,open:expanded};
}
