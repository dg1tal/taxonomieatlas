"""Import the DOG 2018 full checklist. Keep source rows, status rules and mapping decisions."""
import collections, hashlib, json, re
from pathlib import Path
import pdfplumber
ROOT=Path(__file__).resolve().parents[1]
URL='https://www.do-g.de/fileadmin/Ablage/DOG/Fachkommissionen/Kommission_Artenliste/Dokumente/Barthel_Kr%C3%BCger_2018_Artenliste_Deutschland.pdf'
SUB=re.compile(r'\b([A-Z])\.\s*([a-z])\.\s+([a-z][a-z-]+)\b')
SP=re.compile(r'\b([A-Z][a-z]+)\s+([a-z][a-z-]+)\b')
CAT=re.compile(r'^(?:Ao?|B(?:C1|D|E)?|C[1-5]?)$')
FLAG=re.compile(r'^(?:[NRL][1-6]E?|0|VE?|[JjZzWwSs]+|\([BE]\))$')
def read_source(pdf):
    records=[];species_rows=[];parent=None;family=None
    with pdfplumber.open(pdf) as doc:
        for page_index,page in enumerate(doc.pages):
            if page_index<5:continue
            groups=[]
            for word in sorted(page.extract_words(),key=lambda w:(round(w['top']/2)*2,w['x0'])):
                group=next((g for g in groups if abs(g[0]['top']-word['top'])<1.5),None)
                if group is None:groups.append([word])
                else:group.append(word)
            groups=[sorted(g,key=lambda w:w['x0']) for g in groups];cat_positions=[]
            for g in groups:
                text=' '.join(w['text'] for w in g)
                if not SUB.search(text) and SP.search(text):
                    cats=[w for w in g if CAT.fullmatch(w['text']) and w['x0']>page.width*.5]
                    if cats:cat_positions.append((cats[0]['x0']+cats[0]['x1'])/2)
            if not cat_positions:continue
            cat_x=sorted(cat_positions)[len(cat_positions)//2]
            def flags(g):
                breed=[];other=[]
                for w in g:
                    if not FLAG.fullmatch(w['text']):continue
                    if cat_x+9<w['x0']<cat_x+34:breed.append(w['text'])
                    elif cat_x+34<=w['x0']<cat_x+90:other.append(w['text'])
                return {'breeding':' '.join(breed),'nonbreeding':' '.join(other)}
            for g in groups:
                text=' '.join(w['text'] for w in g)
                if text.startswith('Anhang 1:'):return records,species_rows
                family_match=re.search(r'Familie ([A-Z][a-z]+idae)',text)
                if family_match:family=family_match[1]
                match=SUB.search(text)
                if match:
                    if not parent:raise ValueError('Subspecies without species: '+text)
                    genus,epithet=parent['scientific_name'].split()
                    if genus[0]!=match[1] or epithet[0]!=match[2]:raise ValueError('Ambiguous abbreviation: '+text)
                    name=genus+' '+epithet+' '+match[3]
                    vernacular=re.search('„([^“]+)“',text[:match.start()])
                    records.append(dict(scientific_name=name,source_species=parent['scientific_name'],source_family=parent['family'],german_name=vernacular[1] if vernacular else '',name_kind='informal' if vernacular else None,category=parent['category'],source_flags=flags(g),species_flags=dict(parent['source_flags']),source_uncertain='(?)' in text,source_page=171+page_index,pdf_page=page_index+1,source_line=text,source_species_line=parent['source_line']))
                else:
                    m=SP.search(text)
                    cats=[w for w in g if CAT.fullmatch(w['text']) and abs((w['x0']+w['x1'])/2-cat_x)<4]
                    if m and cats:
                        parent=dict(scientific_name=m[0],family=family,category=cats[0]['text'],source_flags=flags(g),source_line=text)
                        species_rows.append(parent)
    return records,species_rows

def build(bundle):
    pdf=ROOT/'sources/germany-2018.pdf';records,species=read_source(pdf)
    assert len(records)==377, f'Expected 377 subspecies, found {len(records)}'
    assert len(species)==527, f'Expected 527 species, found {len(species)}'
    totals=collections.Counter(r['source_species'] for r in records)
    names={n['name']:n for n in bundle['nodes']};subs=[n for n in bundle['nodes'] if n['rank']=='subspecies']
    ids={n['id']:n for n in bundle['nodes']}
    def in_family(n,family):
        while n and n['rank']!='family':n=ids.get(n.get('parent'))
        return n and n['name']==family
    for r in records:
        explicit=any(r['source_flags'].values())
        r['flags']=dict(r['source_flags'] if explicit else r['species_flags'])
        r['status_rule']='explicit_subspecies_row' if explicit else 'species_row_default_DOG_2018_p174_175'
        if '(B)' in r['flags']['nonbreeding']:r['category']='B'
        if '(E)' in r['flags']['nonbreeding']:r['category']='E'
        target=names.get(r['scientific_name'])
        if target and target['rank']=='subspecies':
            r['candidate_id']=target['id'];r['match_method']='exact_trinomial';r['mapping_status']='source_uncertain' if r['source_uncertain'] else 'confirmed';r['mapping_evidence']='Exact source trinomial equals AviList 2026 trinomial; species parent verified.'
        else:
            r['mapping_status']='open';r['mapping_reason']='No exact AviList 2026 subspecies match; possible rank, genus or species-concept change. No occurrence transferred.'
            r['possible_matches']=[dict(id=n['id'],name=n['name']) for n in subs if in_family(n,r['source_family']) and n['name'].split()[-1]==r['scientific_name'].split()[-1] and n['name'].split()[1]==r['scientific_name'].split()[1]]
    return dict(version='DOG 3.1 (2018)',as_of='2018-06-30',citation='Barthel & Krüger (2018), Vogelwarte 56: 171–203',url=URL,sha256=hashlib.sha256(pdf.read_bytes()).hexdigest(),records=records,unresolved=[r['scientific_name'] for r in records if r['mapping_status']!='confirmed'],later_records=[],note='Source-complete as of 30 June 2018; later records have not been systematically evaluated.')
if __name__=='__main__':
    bundle=json.loads((ROOT/'dist/data.json').read_text());result=build(bundle)
    (ROOT/'sources/germany-subspecies-2018.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(collections.Counter(r['mapping_status'] for r in result['records']))
    for r in result['records']:
        if r['mapping_status']!='confirmed':print(r['scientific_name'],r['mapping_status'],r.get('possible_matches'))
    for r in result['records']:
        if r['source_species']=='Turdus torquatus':print(r)
