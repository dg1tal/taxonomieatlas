"""Name labels only; does not change taxon concepts or Germany assignments."""
import re,json,hashlib,unicodedata
from pathlib import Path
root=Path(__file__).resolve().parents[1]
b=json.loads((root/'dist/data.json').read_text())
text=unicodedata.normalize('NFC',(root/'sources/names-dog-2022.txt').read_text())
names={};orders={};families={};pending=None;english_epithets={}
for line in text.splitlines():
    cols=re.split(r'\s{2,}',line.strip())
    if not cols:continue
    if len(cols)>1 and cols[1].startswith('ORDNUNG'):
        parts=cols[1].split();pending=cols[0]
        if len(parts)>1:orders[parts[1].lower()]=pending.capitalize();pending=None
        continue
    if pending and len(cols)==1 and re.fullmatch(r'[A-Z]+IFORMES',cols[0]):
        orders[cols[0].lower()]=pending.capitalize();pending=None
    if len(cols)>1:
        m=re.search(r'Familie ([A-Za-z]+idae)\b',cols[1])
        if m:families[m[1]]=cols[0]
        if re.fullmatch(r'(?:†\s*)?[A-Z][a-z]+ [a-z][a-z-]+',cols[1]):
            de=cols[0].strip().strip('†').strip()
            if de and len(de)<65 and not re.search(r'\d',de):
                scientific=cols[1].lstrip('†').strip();names[scientific]=de
                if len(cols)>=5:english_epithets.setdefault((cols[-1],scientific.split()[1]),set()).add((de,scientific))
orders['struthioniformes']='Strauße'
orders['suliformes']='Ruderfüßer'
source='Barthel et al. 2022, Die Vögel der Erde, 3. Auflage, doi:10.17617/2.3418299'
for n in b['nodes']:
    match='scientific_name_only'
    candidate=orders.get(n['name'].lower()) if n['rank']=='order' else families.get(n['name']) if n['rank']=='family' else names.get(n['name']) if n['rank']=='species' else None
    if not candidate and n['rank']=='species' and not n.get('de'):
        matches=english_epithets.get((n.get('en'),n['name'].split()[1]),set())
        if len(matches)==1:candidate,old_scientific=next(iter(matches));match='unique_english_name_and_epithet';n['de_source_scientific_name']=old_scientific
    if candidate:n['de']=candidate;n['de_source']=source;n['de_match']=match
    if n['rank']=='class':n['en']='Birds'
for n in b['nodes']:
    if n['name']=='Cathartiformes':
        n['de']='Neuweltgeier';n['de_source']='FU Berlin, ornithologischer Anhang: https://refubium.fu-berlin.de/bitstream/handle/fub188/3616/09_kap7.pdf';n['de_match']='manual_reference'
b['name_sources']=[dict(name=source,url='https://www.do-g.de/dog/kommission-vogelnamen',sha256=hashlib.sha256((root/'sources/names-dog-2022.pdf').read_bytes()).hexdigest(),scope='German order/family/species labels matched by scientific name; not a concept or occurrence validation.')]
(root/'dist/data.json').write_text(json.dumps(b,ensure_ascii=False,separators=(',',':')))
from collections import Counter
print('Extracted source labels:',len(orders),len(families),len(names))
for rank in ['class','order','family','genus','species']:
    nodes=[n for n in b['nodes'] if n['rank']==rank]
    print(rank,len(nodes),'de',sum(bool(n.get('de')) for n in nodes),'en',sum(bool(n.get('en')) for n in nodes))
print('Missing higher German labels',[(n['rank'],n['name']) for n in b['nodes'] if n['rank'] in ['order','family'] and not n.get('de')])
