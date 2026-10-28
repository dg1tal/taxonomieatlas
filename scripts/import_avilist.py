"""Reproducible AviList import. Names are matching aids, not taxon-concept proof."""
import argparse, hashlib, json, re, uuid
from pathlib import Path
import openpyxl
ROOT=Path(__file__).resolve().parents[1]

def build(xlsx, germany, version, registry_path):
    registry=json.loads(registry_path.read_text()) if registry_path.exists() else {}
    def ident(rank,name):
        key=rank+':'+name
        if key not in registry: registry[key]=str(uuid.uuid4())
        return registry[key]
    nodes=[dict(id=ident('class','Aves'),parent=None,rank='class',name='Aves',de='Vögel')]
    byname={}; genus=None; species=None
    rows=openpyxl.load_workbook(xlsx,read_only=True,data_only=True).worksheets[0].iter_rows(values_only=True)
    headers=next(rows)
    required=['RANK','ORDER','FAMILY','SCIENTIFIC NAME','ENGLISH NAME: AVILIST','SPECIES CODE CORNELL LAB']
    if any(h not in headers for h in required): raise ValueError('Unbekanntes AviList-Schema')
    for values in rows:
        r=dict(zip(headers,values)); rank=r['RANK']; name=r['SCIENTIFIC NAME']
        if rank not in ('order','family','genus','species','subspecies'): continue
        if not isinstance(name,str):raise ValueError('Taxon ohne Namen')
        if rank=='order':parent=nodes[0]['id']
        elif rank=='family':parent=ident('order',r['ORDER'])
        elif rank=='genus':parent=ident('family',r['FAMILY']);genus=name
        elif rank=='species':
            species=name
            if not genus or name.split()[0]!=genus:raise ValueError('Gattung inkonsistent: '+name)
            parent=ident('genus',genus)
        else:
            if not species or ' '.join(name.split()[:2])!=species:raise ValueError('Art inkonsistent: '+name)
            parent=ident('species',species)
        node=dict(id=ident(rank,name),parent=parent,rank=rank,name=name)
        for key,field in [('en','ENGLISH NAME: AVILIST'),('code','SPECIES CODE CORNELL LAB')]:
            if r.get(field):node[key]=str(r[field])
        if rank=='subspecies':
            for key,field in [('authority','AUTHORITY'),('range','RANGE'),('avibase_id','AVIBASE ID'),('extinction_status','EXTINCTION STATUS')]:
                if r.get(field):node[key]=str(r[field])
        nodes.append(node); byname[name]=node
    # Established German rank labels from the DOG source, matched by scientific name.
    for line in germany.read_text().splitlines():
        m=re.match(r'^\s*(.+?)\s+(?:[–−-]\s*)?([A-Z][A-Za-z]+(?:iformes|idae))\s*$',line,re.I)
        name=next((n for n in byname if m and n.lower()==m[2].lower()),None) if m else None
        if name:
            de=m[1].strip(' –−-')
            byname[name]['de']=de.capitalize() if de.isupper() else de
    records=[]; unresolved=[]
    for line in germany.read_text().splitlines():
        if not re.match(r'^\s*(?:Ao?|B(?:C1|D|E)?|C[1-5]?)\s',line):continue
        m=re.search(r'\b([A-Z][a-z]+ [a-z]+)( f\. domestica)?\s*$',line)
        if not m:continue
        prefix=line[:m.start()].split();cat=prefix[0];de=prefix[-1];flags=prefix[1:-1]
        rec=dict(scientific_name=m[1]+(m[2] or ''),german_name=de,category=cat,flags=flags,source_version='DOG 3.2 (2019)',review='pending')
        candidate=byname.get(m[1]) if not m[2] else None
        if candidate:
            rec['candidate_id']=candidate['id']
            candidate.setdefault('de',de)
            candidate.setdefault('germany_candidates',[]).append(len(records))
        else: unresolved.append(rec['scientific_name'])
        records.append(rec)
    if len(records)!=527:raise ValueError(f'DOG-Extraktion unvollständig: {len(records)} statt 527')
    bundle=dict(schema_version=1,version=version,source=dict(name='AviList',url='https://www.avilist.org/checklist/v2026/',license='CC BY 4.0',citation='AviList Core Team. 2026. AviList: The Global Avian Checklist, v2026. doi:10.2173/avilist.v2026',sha256=hashlib.sha256(xlsx.read_bytes()).hexdigest()),germany_source=dict(url='https://www.do-g.de/dog/kommission-artenliste',version='3.2 (2019)',records=records,unresolved=unresolved),nodes=nodes)
    registry_path.write_text(json.dumps(registry,ensure_ascii=False,indent=2))
    return bundle

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--xlsx',type=Path,required=True);p.add_argument('--germany-text',type=Path,required=True);p.add_argument('--version',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    b=build(a.xlsx,a.germany_text,a.version,ROOT/'sources/id-registry.json');a.output.write_text(json.dumps(b,ensure_ascii=False,separators=(',',':')))
    print(json.dumps({'nodes':len(b['nodes']),'species':sum(n['rank']=='species' for n in b['nodes']),'germany_records':len(b['germany_source']['records']),'unresolved':b['germany_source']['unresolved']},ensure_ascii=False))
