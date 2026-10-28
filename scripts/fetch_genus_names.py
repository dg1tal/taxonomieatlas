"""Fetch source snapshots; importing them never changes AviList parent relationships."""
import urllib.request,urllib.parse,json,concurrent.futures,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];S=ROOT/'sources';UA='BirdTaxonomyAtlas/1.0 (public ornithological reference; genus common-name import)'
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
 with urllib.request.urlopen(req,timeout=35) as r:return json.load(r)
def wikidata():
 q='''SELECT ?item ?scientific ?de ?en ?common ?deArticle ?enArticle WHERE { ?item wdt:P105 wd:Q34740; wdt:P225 ?scientific; wdt:P171* wd:Q5113. OPTIONAL { ?item rdfs:label ?de FILTER(LANG(?de)="de") } OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en)="en") } OPTIONAL { ?item wdt:P1843 ?common FILTER(LANG(?common) IN ("de","en")) } OPTIONAL { ?deArticle schema:about ?item; schema:isPartOf <https://de.wikipedia.org/> } OPTIONAL { ?enArticle schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> } }'''
 return get('https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':q,'format':'json'}))
def inat(page):return get('https://api.inaturalist.org/v1/taxa?'+urllib.parse.urlencode(dict(taxon_id=3,rank='genus',per_page=200,page=page,all_names='true',locale='de')))
if __name__=='__main__':
 # Existing snapshots may be kept for reproducible offline import.
 if not (S/'wikidata-bird-genera.json').exists():(S/'wikidata-bird-genera.json').write_text(json.dumps(wikidata(),ensure_ascii=False))
 first=inat(1);pages=(first['total_results']+199)//200;data=first['results']
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  for part in pool.map(inat,range(2,pages+1)):data.extend(part['results'])
 if len(data)!=first['total_results']:raise ValueError('Incomplete iNaturalist snapshot')
 (S/'inat-bird-genera.json').write_text(json.dumps(dict(retrieved='2026-10-23',total_results=len(data),results=data),ensure_ascii=False))
 print('iNaturalist genera:',len(data),'Wikidata rows:',len(json.loads((S/'wikidata-bird-genera.json').read_text())['results']['bindings']))
