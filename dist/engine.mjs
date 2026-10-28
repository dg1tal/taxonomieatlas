import {normalizeSearch} from './ux.mjs';
import {addCladeOverlay} from './clades.mjs';
export const RANKS={class:'Klasse · Class',clade:'Klade · Clade',order:'Ordnung · Order',family:'Familie · Family',genus:'Gattung · Genus',species:'Art · Species',subspecies:'Unterart · Subspecies'};
const parentRank={order:'class',family:'order',genus:'family',species:'genus',subspecies:'species'};
export function validate(b){
 const errors=[];
 if(!b||b.schema_version!==1||typeof b.version!=='string'||!b.version.trim())return ['Ungültiges Datenformat oder fehlende Version.'];
 if(!b.source||b.source.name!=='AviList'||!/^https:\/\//.test(b.source.url||'')||!b.source.license||!b.source.citation||!/^[0-9a-f]{64}$/.test(b.source.sha256||''))errors.push('Quellenangabe, Lizenz, Zitat oder SHA-256 fehlt.');
 if(!Array.isArray(b.nodes)||b.nodes.length<2||b.nodes.length>100000)return [...errors,'Ungültige Anzahl von Taxa.'];
 if(b.dataset_revision!==undefined&&(typeof b.dataset_revision!=='string'||!b.dataset_revision.trim()||b.dataset_revision.length>100))errors.push('Ungültige App-Datenrevision.');
 const ids=new Map(),names=new Set();let roots=0;
 for(const n of b.nodes){
  if(!n||typeof n.id!=='string'||!n.id||typeof n.name!=='string'||!n.name||!RANKS[n.rank]){errors.push('Ungültiger Taxonknoten.');continue;}
  if(ids.has(n.id))errors.push('Doppelte Taxon-ID: '+n.id);
  if(names.has(n.rank+':'+n.name))errors.push('Doppelter Taxonname: '+n.name);
  ids.set(n.id,n);names.add(n.rank+':'+n.name);
  if(n.rank==='clade')errors.push('Kladen gehören nicht in das AviList-Datenpaket.');
  if(n.rank==='class'){roots++;if(n.parent!==null||n.name!=='Aves')errors.push('Die Wurzel muss Aves sein.');}
 }
 if(roots!==1)errors.push('Genau eine Klasse Aves erforderlich.');
 for(const n of ids.values()){
  if(n.rank==='class')continue;
  const p=ids.get(n.parent);
  if(!p||p.rank!==parentRank[n.rank])errors.push('Ungültige Elternbeziehung: '+n.name);
  if(n.rank==='species'&&p&&n.name.split(' ')[0]!==p.name)errors.push('Artname passt nicht zur Gattung: '+n.name);
  if(n.rank==='subspecies'&&(!p||n.name.split(' ').length!==3||n.name.split(' ').slice(0,2).join(' ')!==p.name))errors.push('Unterartname passt nicht zur Art: '+n.name);
  if(n.name_sources!==undefined){if(n.rank!=='subspecies'||!n.name_sources||typeof n.name_sources!=='object')errors.push('Ungültige Unterart-Namensquellen.');else for(const [lang,ev] of Object.entries(n.name_sources))if(!['de','en'].includes(lang)||!n[lang]||!ev?.source||!/^https:\/\//.test(ev.url||'')||!/^\d{4}-\d{2}-\d{2}$/.test(ev.retrieved||''))errors.push('Ungültiger Unterart-Namensbeleg.');}
  if((n.code!==undefined&&(typeof n.code!=='string'||! /^[a-z0-9]+$/.test(n.code)))||(n.en!==undefined&&typeof n.en!=='string'))errors.push('Ungültiger Cornell-Code oder englischer Name: '+n.name);
  if(n.de!==undefined&&typeof n.de!=='string')errors.push('Ungültiger deutscher Name: '+n.name);
  if(n.vernacular_names!==undefined){
   if(!n.vernacular_names||typeof n.vernacular_names!=='object'||Array.isArray(n.vernacular_names)||n.rank!=='genus')errors.push('Ungültige ergänzende Gattungsnamen.');
   else for(const [lang,entries] of Object.entries(n.vernacular_names)){
    if(!['de','en'].includes(lang)||!Array.isArray(entries)||!entries.length||entries.length>100){errors.push('Ungültige Namensliste.');continue;}
    for(const entry of entries){
     if(!entry||typeof entry.name!=='string'||!entry.name.trim()||!Array.isArray(entry.evidence)||!entry.evidence.length){errors.push('Gattungsname ohne Beleg.');continue;}
     for(const ev of entry.evidence)if(!ev||typeof ev.source!=='string'||!/^https:\/\//.test(ev.url||'')||(ev.article_url&&!/^https:\/\/(?:de|en)\.wikipedia\.org\/wiki\//.test(ev.article_url))||!/^\d{4}-\d{2}-\d{2}$/.test(ev.retrieved||''))errors.push('Ungültiger Namensbeleg.');
    }
    if(n[lang]!==entries[0]?.name)errors.push('Bevorzugter Name und Namensliste widersprechen sich.');
   }
  }

 }
 const g=b.germany_source;
 if(!g||typeof g.version!=='string'||!Array.isArray(g.records)||!Array.isArray(g.unresolved))errors.push('Deutscher Quelldatenstand fehlt.');
 else{
  const seen=new Set();
  for(const r of g.records){
   if(!r||typeof r.scientific_name!=='string'||typeof r.german_name!=='string'||!Array.isArray(r.flags)||!['pending','confirmed'].includes(r.review)){errors.push('Ungültiger oder nicht unterstützter deutscher Prüfstatus.');continue;}
   if(r.review==='confirmed'&&(!r.candidate_id||typeof r.evidence!=='string'||!r.evidence.trim()))errors.push('Bestätigte Zuordnung ohne Beleg: '+r.scientific_name);
   if(typeof r.category!=='string'||!/^A[o]?$|^B(?:C1|D|E)?$|^C[1-5]?$/.test(r.category))errors.push('Ungültige DOG-Kategorie.');
   if(seen.has(r.scientific_name))errors.push('Doppelter deutscher Quelldatensatz: '+r.scientific_name);seen.add(r.scientific_name);
   if(r.candidate_id&&ids.get(r.candidate_id)?.rank!=='species')errors.push('Ungültiger Deutschland-Kandidat: '+r.scientific_name);
  }
 }
 const subs=b.germany_subspecies_source;
 if(subs!==undefined){
  if(!subs||!/^https:\/\//.test(subs.url||'')||!/^[0-9a-f]{64}$/.test(subs.sha256||'')||!/^\d{4}-\d{2}-\d{2}$/.test(subs.as_of||'')||!Array.isArray(subs.records)||!Array.isArray(subs.later_records))errors.push('Ungültige Deutschland-Unterartenquelle.');
  else {const seen=new Set();for(const r of [...subs.records,...subs.later_records]){if(!r||typeof r.scientific_name!=='string'||seen.has(r.scientific_name+'|'+(r.source_url||subs.url)+'|'+(r.as_of||subs.as_of))||!['confirmed','open','source_uncertain'].includes(r.mapping_status)||!Number.isInteger(r.pdf_page)||r.pdf_page<1||!Number.isInteger(r.source_page)||!r.source_line||!r.flags||typeof r.flags.breeding!=='string'||typeof r.flags.nonbreeding!=='string'||!['A','Ao','B','BD','BE','BC1','C1','C2','C3','C4','C5','E'].includes(r.category)){errors.push('Ungültiger Deutschland-Unterartbeleg.');continue;}seen.add(r.scientific_name+'|'+(r.source_url||subs.url)+'|'+(r.as_of||subs.as_of));if(subs.later_records.includes(r)&&(!/^https:\/\//.test(r.source_url||'')||!/^[0-9a-f]{64}$/.test(r.source_sha256||'')||!/^\d{4}-\d{2}-\d{2}$/.test(r.as_of||'')||!r.citation))errors.push('Späterer Unterartbeleg ohne eigene datierte Quelle.');if(r.candidate_id&&ids.get(r.candidate_id)?.rank!=='subspecies')errors.push('Deutschland-Unterartbeleg mit falschem Rang.');if(r.mapping_status==='confirmed'&&(!r.candidate_id||typeof r.mapping_evidence!=='string'||!r.mapping_evidence.trim()||r.source_uncertain))errors.push('Bestätigter Unterartbeleg ohne eindeutige Zuordnung.');if(r.mapping_status==='confirmed'&&r.match_method==='exact_trinomial'&&ids.get(r.candidate_id)?.name!==r.scientific_name)errors.push('Widersprüchlicher Unterart-Namensabgleich.');if(r.mapping_status==='confirmed'&&r.match_method==='exact_trinomial'&&ids.get(ids.get(r.candidate_id)?.parent)?.name!==r.source_species)errors.push('Unterart-Elternkonzept abweichend.');if(r.mapping_status==='open'&&r.candidate_id)errors.push('Offene Zuordnung darf keinen bestätigten Zielknoten haben.');}}
 }
 return errors;
}
export function compare(old,next){
 const a=new Map(old.nodes.map(n=>[n.id,n])),b=new Map(next.nodes.map(n=>[n.id,n]));
 const result={added:[],removed:[],renamed:[],moved:[],labels:[],identityErrors:[],germanyChanged:JSON.stringify(old.germany_source)!==JSON.stringify(next.germany_source)||JSON.stringify(old.germany_subspecies_source)!==JSON.stringify(next.germany_subspecies_source),sourceChanged:old.source.sha256!==next.source.sha256};
 const oldNames=new Map(old.nodes.map(n=>[n.rank+':'+n.name,n.id]));
 for(const n of next.nodes){const prior=a.get(n.id);
  if(!prior){result.added.push(n);if(oldNames.has(n.rank+':'+n.name))result.identityErrors.push(n.name+': bestehendes Taxon erhielt eine andere ID.');}
  else{if(prior.rank!==n.rank)result.identityErrors.push(n.name+': Rangänderung benötigt Migration.');if(prior.name!==n.name)result.renamed.push({before:prior,after:n});if(prior.parent!==n.parent)result.moved.push({before:prior,after:n});if(prior.de!==n.de||prior.en!==n.en||prior.code!==n.code||JSON.stringify(prior.vernacular_names)!==JSON.stringify(n.vernacular_names)||JSON.stringify(prior.name_sources)!==JSON.stringify(n.name_sources)||['authority','range','avibase_id','extinction_status'].some(k=>prior[k]!==n[k]))result.labels.push({before:prior,after:n});}
 }
 for(const n of old.nodes)if(!b.has(n.id))result.removed.push(n);
 return result;
}
export function index(b,scope='global',filter='all',query='',orderIds=null,clades=false,subspecies=false){
 const allowedOrders=orderIds===null?null:new Set(orderIds);
 const term=normalizeSearch(query.trim());
 const totals=new Map();for(const n of b.nodes)if(n.rank==='subspecies')totals.set(n.parent,(totals.get(n.parent)||0)+1);
 const byid=new Map(b.nodes.filter(n=>n.rank!=='subspecies'||subspecies||term).map(n=>[n.id,{...n,count:0,subspeciesCount:0,subspeciesTotal:totals.get(n.id)||0,children:[]}]))
 for(const n of byid.values())if(n.rank==='subspecies'){const parent=byid.get(n.parent),epithet=n.name.split(' ').at(-1);for(const lang of ['de','en'])if(!n[lang]){n[lang]=`${parent?.[lang]||parent?.name} (${epithet})`;n[lang+'_descriptive']=true;}}
 const germanySubspecies=new Map(),germanyOpenCandidates=new Map(),speciesSubspeciesEvidence=new Map(),sourceNodes=new Map(b.nodes.map(n=>[n.id,n]));
 for(const r of [...(b.germany_subspecies_source?.records||[]),...(b.germany_subspecies_source?.later_records||[])]){if(r.candidate_id){if(!germanySubspecies.has(r.candidate_id))germanySubspecies.set(r.candidate_id,[]);germanySubspecies.get(r.candidate_id).push(r);const parent=sourceNodes.get(r.candidate_id)?.parent;if(parent&&r.mapping_status==='confirmed'){if(!speciesSubspeciesEvidence.has(parent))speciesSubspeciesEvidence.set(parent,[]);speciesSubspeciesEvidence.get(parent).push(r);}}else for(const target of r.possible_matches||[]){if(!germanyOpenCandidates.has(target.id))germanyOpenCandidates.set(target.id,[]);germanyOpenCandidates.get(target.id).push(r);}}
 for(const n of byid.values())if(n.rank==='subspecies'){const records=germanySubspecies.get(n.id)||[];n.germany_status=records.some(r=>r.mapping_status==='confirmed')?'confirmed':records.length?'source_uncertain':germanyOpenCandidates.has(n.id)?'open':'not_evaluated';}
 const candidates=new Map();for(const r of b.germany_source.records)if(r.candidate_id){if(!candidates.has(r.candidate_id))candidates.set(r.candidate_id,[]);candidates.get(r.candidate_id).push(r);}
 for(const n of byid.values())if(n.parent&&byid.has(n.parent))byid.get(n.parent).children.push(n.id);
 const overlay=clades?addCladeOverlay(byid):{active:false,unknown:[],missing:[]};
 for(const n of byid.values())n.subspeciesCount??=0;
 let matches=0,subspeciesMatches=0;
 const nameMatches=n=>[n.name,n.de,n.en,...Object.values(n.vernacular_names||{}).flatMap(entries=>entries.map(v=>v.name))].filter(Boolean).map(normalizeSearch).join(' ').includes(term);
 for(const n of byid.values()){
  if(n.rank!=='species')continue;
  const records=candidates.get(n.id)||[];
  const subRecords=speciesSubspeciesEvidence.get(n.id)||[];let include=scope==='global'||records.length>0||subRecords.length>0;
  if(include&&allowedOrders!==null){let ancestor=n;while(ancestor&&ancestor.rank!=='order')ancestor=byid.get(ancestor.parent);include=!!ancestor&&allowedOrders.has(ancestor.id);}
  if(scope!=='global'&&filter!=='all')include=include&&(records.some(r=>statusMatches(r,filter))||subRecords.some(r=>statusMatches(r,filter)));
  let ancestorMatch=!term;if(include&&term){let p=n;while(p){if(nameMatches(p)){ancestorMatch=true;break;}p=byid.get(p.parent);}}
  // Only source-evidenced subspecies pass the Germany filter; unknown is never absence.
  const children=n.children.map(id=>byid.get(id)).filter(s=>s.rank==='subspecies'&&(scope==='global'||(germanySubspecies.get(s.id)||[]).some(r=>r.mapping_status==='confirmed'&&statusMatches(r,filter)))&&(!term||ancestorMatch||nameMatches(s)));
  if(include&&term)include=ancestorMatch||children.length>0;
  if(include){matches++;let p=n;while(p){p.count++;p.subspeciesCount+=children.length;p=byid.get(p.parent);}for(const child of children){child.count=1;child.subspeciesCount=1;subspeciesMatches++;}}

 }
 return {byid,root:[...byid.values()].find(n=>n.rank==='class'),matches,subspeciesMatches,candidates,overlay,germanySubspecies,germanyOpenCandidates,speciesSubspeciesEvidence};
}

export function taxonCountLabel(n,num=String){if(n.rank==='subspecies')return '1 Unterart';const base=`${num(n.count)} ${n.count===1?'Art':'Arten'}`;return n.subspeciesCount?`${base} · ${num(n.subspeciesCount)} Unterarten`:base;}

export function statusMatches(record,filter){const flags=Array.isArray(record.flags)?record.flags:[record.flags?.breeding||'',record.flags?.nonbreeding||''];if(filter==='all')return true;if(filter==='historic')return record.category.startsWith('B');if(filter==='introduced')return record.category.includes('C')||record.category==='E';if(filter==='breeding')return flags.some(f=>/^[NRL][1-6]/.test(f));if(filter==='winter')return flags.some(f=>/[Ww]/.test(f));if(filter==='migrant')return flags.some(f=>/[Zz]/.test(f));if(filter==='rare')return flags.some(f=>/[Ss]/.test(f));return false;}
export const GERMANY_SUBSPECIES_STATUS={confirmed:'Für Deutschland belegt',open:'Zuordnung taxonomisch offen',source_uncertain:'Nachweiszuordnung in Quelle unsicher',not_evaluated:'Vorkommen noch nicht ausgewertet'};
