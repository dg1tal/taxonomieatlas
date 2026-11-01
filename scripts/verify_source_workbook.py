"""Independent publication-job replay of the cell policy and candidate construction."""
import json
import sys
from pathlib import Path
from check_sources import ROOT, avi_patches, candidate, digest, workbook

folder = Path(sys.argv[1])
old = json.loads((ROOT / 'dist/data.json').read_text())
report = json.loads((folder / 'report.json').read_text())
assert digest((ROOT / 'sources/avilist-2026.xlsx').read_bytes()) == report['from_sha256']
assert digest((folder / 'avilist.xlsx').read_bytes()) == report['to_sha256']
patches = avi_patches(workbook(ROOT / 'sources/avilist-2026.xlsx'), workbook(folder / 'avilist.xlsx'), old)
assert patches == report['patches'], 'Patches do not match the actual workbook changes'
assert candidate(old, report['to_sha256'], patches, report['checked_at']) == json.loads((folder / 'candidate.json').read_text())
print('PASS: source-bound workbook replay; no extra candidate changes')
