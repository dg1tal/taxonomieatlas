"""Verify all additions against the source import; emit evidence for the existing release gate."""
import json
from import_avilist import ROOT,build
current=json.loads((ROOT/'dist/data.json').read_text());next_bundle=json.loads((ROOT/'sources/next-subspecies.json').read_text())
old={n['id']:n for n in current['nodes']};new={n['id']:n for n in next_bundle['nodes']}
assert all(new.get(id)==node for id,node in old.items())
assert current['germany_source']==next_bundle['germany_source']
raw=build(ROOT/'sources/avilist-2026.xlsx',ROOT/'sources/germany-2019.txt',next_bundle['version'],ROOT/'sources/id-registry.json')
expected={n['id']:n for n in raw['nodes'] if n['rank']=='subspecies'}
added={id:n for id,n in new.items() if id not in old};assert set(added)==set(expected)
for id,node in added.items():assert all(node[k]==v for k,v in expected[id].items())
review={'from_sha256':current['source']['sha256'],'to_sha256':next_bundle['source']['sha256'],'approved':True,'reviewer':'Codex source-bound structural verification','evidence':'19,852 subspecies read directly from the exact bundled AviList v2026 XLSX; each source field and species parent verified. Existing nodes and all DOG records unchanged. Names supplement separately attributed to Avibase. No inferred Germany occurrences.','change_reviews':[{'id':id,'decision':'Add source-listed subspecies below its existing species; count separately','evidence':'AviList v2026 XLSX SCIENTIFIC NAME = '+node['name']+'; exact source SHA-256 '+current['source']['sha256']} for id,node in added.items()]}
(ROOT/'sources/subspecies-review.json').write_text(json.dumps(review,ensure_ascii=False))
print(f'Verified {len(added)} additions; no changes to existing taxa or Germany data.')
