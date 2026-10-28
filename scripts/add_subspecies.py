"""Extend the enriched bundle from its exact AviList source, without replacing existing taxa."""
import hashlib,json
from pathlib import Path
from import_avilist import build,ROOT
if __name__=='__main__':
    current=json.loads((ROOT/'dist/data.json').read_text())
    xlsx=ROOT/'sources/avilist-2026.xlsx'
    assert hashlib.sha256(xlsx.read_bytes()).hexdigest()==current['source']['sha256']
    original=build(xlsx,ROOT/'sources/germany-2019.txt',current['version'],ROOT/'sources/id-registry.json')
    names=json.loads((ROOT/'sources/subspecies-name-supplement.json').read_text())
    subs=[dict(n,**names.get(n['name'],{})) for n in original['nodes'] if n['rank']=='subspecies']
    base=[n for n in current['nodes'] if n['rank']!='subspecies']
    assert {n['id'] for n in original['nodes'] if n['rank']!='subspecies'}=={n['id'] for n in base}
    current['nodes']=base+subs
    out=ROOT/'sources/next-subspecies.json';out.write_text(json.dumps(current,ensure_ascii=False,separators=(',',':')))
    print(json.dumps({'subspecies':len(subs),'total_taxa':len(current['nodes']),'output':str(out),'bytes':out.stat().st_size}))
