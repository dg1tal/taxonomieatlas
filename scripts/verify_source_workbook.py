"""Independent publication-job replay of the cell policy and candidate construction."""
import json
import sys
from pathlib import Path
from check_sources import ROOT, avi_patches, candidate, digest, workbook

folder = Path(sys.argv[1])
old = json.loads((ROOT / 'dist/data.json').read_text())
report = json.loads((folder / 'report.json').read_text())
if report.get('mode') == 'explorer':
    from explorer_sources import build_candidate, compact_inat
    expected, evidence, names_report, changed = build_candidate(ROOT, folder, old, report['checked_at'])
    assert changed, 'No source update to publish'
    assert all(report.get(key) == value for key, value in evidence.items()), 'Evidence differs from source-bound replay'
    assert expected == json.loads((folder / 'candidate.json').read_text()), 'Candidate differs from source-bound replay'
    assert names_report == json.loads((folder / 'genus-names-candidate.json').read_text()), 'Name report differs from actual candidate'
    snapshot = compact_inat(json.loads((folder / 'inaturalist.json').read_text()), report['checked_at'][:10])
    (folder / 'inaturalist-reviewed.json').write_text(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')))
    print('PASS: official Explorer and individually reviewed name updates replayed from original source files')
else:
    assert digest((ROOT / 'sources/avilist-2026.xlsx').read_bytes()) == report['from_sha256']
    assert digest((folder / 'avilist.xlsx').read_bytes()) == report['to_sha256']
    patches = avi_patches(workbook(ROOT / 'sources/avilist-2026.xlsx'), workbook(folder / 'avilist.xlsx'), old)
    assert patches == report['patches'], 'Patches do not match the actual workbook changes'
    assert candidate(old, report['to_sha256'], patches, report['checked_at']) == json.loads((folder / 'candidate.json').read_text())
    print('PASS: source-bound workbook replay; no extra candidate changes')
