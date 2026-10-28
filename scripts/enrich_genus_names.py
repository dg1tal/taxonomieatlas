"""Supplement common names only, with exact scientific-name/rank/bird checks."""
import json,re,hashlib,unicodedata
from pathlib import Path
from urllib.parse import unquote
ROOT=Path(__file__).resolve().parents[1];S=ROOT/'sources';D=ROOT/'dist';DATE='2026-10-23'
def norm(s):return unicodedata.normalize('NFC',s).strip().casefold()
def structure(b):return json.dumps({'taxonomy':[(n['id'],n['parent'],n['rank'],n['name']) for n in b['nodes']],'germany':b['germany_source']},ensure_ascii=False,separators=(',',':'))
def clean(name,scientific):
 if not isinstance(name,str):return None
 name=unicodedata.normalize('NFC',name).strip()
 name=re.sub(r'\s*\((?:Gattung|Vogelgattung|Vögel|genus|bird genus|birds)\)$','',name,flags=re.I)
 if not name or norm(name)==norm(scientific) or len(name)>120 or re.search(r'[<>\n\r]|^(?:Category:|Kategorie:|Liste |List of |Wikidata:)',name,re.I):return None
 return name

def enrich(bundle,wd,inat):
 before=structure(bundle);genera={n['name']:n for n in bundle['nodes'] if n['rank']=='genus'};pool={};rejected=[]
 def add(scientific,lang,name,source,url,field,priority,**extra):
  if scientific not in genera or lang not in ['de','en']:return
  name=clean(name,scientific)
  if not name:return
  rec=dict(name=name,source=source,url=url,field=field,retrieved=DATE,priority=priority,**extra)
  pool.setdefault(scientific,{}).setdefault(lang,[]).append(rec)
 # Query itself requires taxonomic rank genus and parent-taxon ancestry to Aves.
 for r in wd['results']['bindings']:
  scientific=r.get('scientific',{}).get('value');item=r.get('item',{}).get('value','').replace('http:','https:')
  if scientific not in genera or not re.fullmatch(r'https://www.wikidata.org/entity/Q\d+',item):continue
  item=item.replace('/entity/','/wiki/')
  for lang in ['de','en']:
   article=r.get(lang+'Article',{}).get('value');label=r.get(lang,{}).get('value')
   if label:add(scientific,lang,label,'Wikidata',item,'rdfs:label',72 if article else 60,license='CC0 1.0',article_url=article)
   # Sitelink titles are structured Wikidata data; no article prose is copied.
   if article and article.startswith('https://'+lang+'.wikipedia.org/wiki/'):
    title=unquote(article.split('/wiki/',1)[1]).replace('_',' ')
    add(scientific,lang,title,'Wikidata · Wikipedia-Verknüpfung',item,'sitelink title',76,license='CC0 1.0',article_url=article)
  common=r.get('common',{});lang=common.get('xml:lang')
  if lang in ['de','en']:add(scientific,lang,common.get('value'),'Wikidata',item,'P1843',70,license='CC0 1.0')
 for r in inat['results']:
  scientific=r.get('name');ancestors=r.get('ancestor_ids',[])
  if scientific not in genera or r.get('rank')!='genus' or 3 not in ancestors or not r.get('is_active'):continue
  for lang in ['de','en']:
   values=[n for n in r.get('names',[]) if n.get('locale')==lang and n.get('is_valid') and clean(n.get('name'),scientific)]
   if not values:continue
   values.sort(key=lambda n:(n.get('position',99999),n['name']))
   n=values[0] # Do not import every community alias: some belong to merged genera/subgroups.
   add(scientific,lang,n['name'],'iNaturalist',f"https://www.inaturalist.org/taxa/{r['id']}",'preferred valid locale name',75)
 # A few independently checked primary-source names have precedence.
 curated=[
 ('Turdus','de','Echte Drosseln','LBV','https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/singdrossel/'),
 ('Corvus','de','Raben und Krähen','LBV','https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/rabenkraehe-oder-aaskraehe/'),
 ('Falco','de','Falken','LBV','https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/baumfalke/'),
 ('Corvus','en','Crows','ITIS','https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=179724'),
 ('Falco','en','Falcons','ITIS','https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=TSN&search_value=175598'),
 ('Anas','en','Dabbling Ducks','U.S. Fish & Wildlife Service','https://www.fws.gov/species/dabbling-ducks-anas')]
 for sci,lang,name,source,url in curated:add(sci,lang,name,source,url,'explicit genus common name',100)
 report={};totals={'de':0,'en':0,'either':0}
 for scientific,n in genera.items():
  values=pool.get(scientific,{});n.pop('vernacular_names',None)
  for lang in ['de','en']:
   if n.get(lang+'_match')=='supplemental_genus_name':
    for key in [lang,lang+'_source',lang+'_match']:n.pop(key,None)
  accepted={}
  for lang,candidates in values.items():
   candidates.sort(key=lambda r:(-r['priority'],r['name'].casefold(),r['url']))
   dedup={}
   for rec in candidates:
    key=norm(rec['name'])
    if key not in dedup:dedup[key]={'name':rec['name'],'evidence':[],'priority':rec['priority']}
    ev={k:v for k,v in rec.items() if k not in ['name','priority'] and v is not None}
    if ev not in dedup[key]['evidence']:dedup[key]['evidence'].append(ev)
   names=list(dedup.values());preferred=names[0]
   if n.get(lang):continue
   for entry in names:entry.pop('priority',None)
   accepted[lang]=names;n[lang]=preferred['name'];n[lang+'_source']=preferred['evidence'][0]['source'];n[lang+'_match']='supplemental_genus_name';totals[lang]+=1
  if accepted:n['vernacular_names']=accepted;report[scientific]=accepted;totals['either']+=1
 assert structure(bundle)==before,'Names changed taxonomy or Germany status'
 sha=hashlib.sha256(before.encode()).hexdigest()
 metadata=dict(name='Ergänzende Gattungsnamen',retrieved=DATE,scope='Vernacular labels only; no classification imported',sources=[dict(name='Wikidata',url='https://www.wikidata.org/',license='CC0 1.0'),dict(name='iNaturalist',url='https://www.inaturalist.org/'),dict(name='LBV',url='https://www.lbv.de/'),dict(name='ITIS',url='https://www.itis.gov/'),dict(name='USFWS',url='https://www.fws.gov/')],counts=totals,structure_sha256=sha)
 bundle['name_sources']=[s for s in bundle.get('name_sources',[]) if s.get('name')!=metadata['name']]+[metadata]
 return bundle,dict(metadata=metadata,genera=report)
if __name__=='__main__':
 b=json.loads((D/'data.json').read_text());b,report=enrich(b,json.loads((S/'wikidata-bird-genera.json').read_text()),json.loads((S/'inat-bird-genera.json').read_text()))
 (D/'data.json').write_text(json.dumps(b,ensure_ascii=False,separators=(',',':')))
 (S/'genus-name-supplement.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(report['metadata']['counts'])
 for sci in ['Turdus','Corvus','Falco','Anas','Parus','Phoenicurus']:
  print(sci,[(lang,[v['name'] for v in names]) for lang,names in report['genera'].get(sci,{}).items()])
