"""Fetch source snapshots; importing them never changes AviList parent relationships."""
import urllib.request,urllib.parse,json,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];S=ROOT/'sources';UA='BirdTaxonomyAtlas/1.0 (public ornithological reference; genus common-name import)'
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
 with urllib.request.urlopen(req,timeout=35) as r:return json.load(r)
def wikidata():
 q='''SELECT ?item ?scientific ?de ?en ?common ?deArticle ?enArticle WHERE { ?item wdt:P105 wd:Q34740; wdt:P225 ?scientific; wdt:P171* wd:Q5113. OPTIONAL { ?item rdfs:label ?de FILTER(LANG(?de)="de") } OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en)="en") } OPTIONAL { ?item wdt:P1843 ?common FILTER(LANG(?common) IN ("de","en")) } OPTIONAL { ?deArticle schema:about ?item; schema:isPartOf <https://de.wikipedia.org/> } OPTIONAL { ?enArticle schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> } }'''
 return get('https://query.wikidata.org/sparql?'+urllib.parse.urlencode({'query':q,'format':'json'}))
def inat(page, get_json=None):
 return (get_json or get)('https://api.inaturalist.org/v1/taxa?'+urllib.parse.urlencode(dict(taxon_id=3,rank='genus',is_active='true',per_page=200,page=page,all_names='true',locale='de',order_by='id',order='asc')))

def fetch_inaturalist(get_page=None):
 """Read a complete ID-ordered snapshot; restart inconsistent pagination at page 1."""
 get_page = get_page or inat
 for attempt in range(3):
  try:
   first = get_page(1)
   total = first['total_results']
   if type(total) is not int or not 1 <= total <= 10000:
    raise ValueError('Unexpected iNaturalist result count')
   rows = []
   for page in range(1, (total + 199) // 200 + 1):
    part = first if page == 1 else get_page(page)
    batch = part['results']
    if part['total_results'] != total or not isinstance(batch, list) or len(batch) != min(200, total - len(rows)):
     raise ValueError('Incomplete iNaturalist page or result count changed during pagination')
    rows.extend(batch)
   ids = [row['id'] for row in rows]
   if any(type(value) is not int for value in ids) or any(a >= b for a, b in zip(ids, ids[1:])):
    raise ValueError('Incomplete/duplicate or unordered iNaturalist pagination')
   return {'total_results': total, 'results': rows}
  except ValueError:
   if attempt == 2:
    raise
   time.sleep(2 ** attempt)
if __name__=='__main__':
 # Existing snapshots may be kept for reproducible offline import.
 if not (S/'wikidata-bird-genera.json').exists():(S/'wikidata-bird-genera.json').write_text(json.dumps(wikidata(),ensure_ascii=False))
 data=fetch_inaturalist()['results']
 (S/'inat-bird-genera.json').write_text(json.dumps(dict(retrieved='2026-10-23',total_results=len(data),results=data),ensure_ascii=False))
 print('iNaturalist genera:',len(data),'Wikidata rows:',len(json.loads((S/'wikidata-bird-genera.json').read_text())['results']['bindings']))
