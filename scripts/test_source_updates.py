"""Tests for the boundary between source corrections and expert review."""
import copy
import json
import tempfile
import gzip
import os
import shutil
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError

from check_sources import ROOT, avi_patches, candidate, check, digest, fetch_json, fetch_wikidata, publication_links
import openpyxl
from explorer_sources import FIELDS, FILES, build_candidate, inspect_explorer, inspect_names, verify_workbook_baseline, version_entry


class PolicyTests(unittest.TestCase):
    def setUp(self):
        self.bundle = {'source': {'sha256': 'a' * 64}, 'germany_source': {'records': []},
                       'nodes': [{'id': 'bird', 'rank': 'species', 'name': 'Parus major', 'en': 'Great Tit', 'de': 'Kohlmeise', 'code': 'gretit1'}]}
        self.sheets = [('AviList', [['RANK', 'SCIENTIFIC NAME', 'ENGLISH NAME: AVILIST', 'SPECIES CODE CORNELL LAB', 'FAMILY'],
                                   ['species', 'Parus major', 'Great Tit', 'gretit1', 'Paridae']]), ('Decisions', [['No changes']])]

    def test_source_correction_preserves_other_evidence(self):
        new = copy.deepcopy(self.sheets)
        new[0][1][1][2] = 'Great Tit (corrected)'
        patches = avi_patches(self.sheets, new, self.bundle)
        result = candidate(self.bundle, 'b' * 64, patches, '2026-11-01T04:37:00+00:00')
        self.assertEqual(result['nodes'][0]['en'], 'Great Tit (corrected)')
        self.assertEqual(result['nodes'][0]['de'], 'Kohlmeise')
        self.assertEqual(result['germany_source'], self.bundle['germany_source'])
        self.assertEqual(self.bundle['nodes'][0]['en'], 'Great Tit')

    def test_taxonomy_decisions_and_schema_require_review(self):
        for column, value in [(0, 'genus'), (1, 'Parus minor'), (4, 'OtherFamily')]:
            new = copy.deepcopy(self.sheets)
            new[0][1][1][column] = value
            with self.assertRaises(ValueError):
                avi_patches(self.sheets, new, self.bundle)
        for new in [self.sheets[:1], self.sheets + [('Extra', [])],
                    [('AviList', self.sheets[0][1]), ('Decisions', [['Split']])]]:
            with self.assertRaises(ValueError):
                avi_patches(self.sheets, new, self.bundle)

    def test_new_deleted_rows_and_labels_are_not_silently_applied(self):
        for value in [None, '', '=1+1']:
            new = copy.deepcopy(self.sheets)
            new[0][1][1][2] = value
            with self.assertRaises(ValueError):
                avi_patches(self.sheets, new, self.bundle)
        new = copy.deepcopy(self.sheets)
        new[0][1].append(list(new[0][1][1]))
        with self.assertRaises(ValueError):
            avi_patches(self.sheets, new, self.bundle)
        self.bundle['nodes'][0]['en'] = 'Locally curated name'
        new = copy.deepcopy(self.sheets)
        new[0][1][1][2] = 'Other name'
        with self.assertRaises(ValueError):
            avi_patches(self.sheets, new, self.bundle)

    def test_new_editions_detected_without_site_assets(self):
        html = b'<a href="/checklist/v2027/">New</a><a href="/file.xlsx">Download</a><a href="/theme.css">CSS</a>'
        self.assertEqual(publication_links(html, 'https://www.avilist.org/'),
                         ['https://www.avilist.org/checklist/v2027/', 'https://www.avilist.org/file.xlsx'])

    def test_full_immutable_release_in_isolated_fixture(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for directory in ['scripts', 'sources', 'dist', 'source-update']:
                (root / directory).mkdir()
            for script in ['prepare_source_release.mjs', 'verify_source_workbook.py', 'check_sources.py',
                           'enrich_genus_names.py', 'fetch_genus_names.py', 'explorer_sources.py', 'release.mjs']:
                shutil.copy(ROOT / 'scripts' / script, root / 'scripts' / script)
            for module in ['engine.mjs', 'ux.mjs', 'clades.mjs']:
                shutil.copy(ROOT / 'dist' / module, root / 'dist' / module)
            bundle = json.loads((ROOT / 'dist/data.json').read_text())
            bird = next(n for n in bundle['nodes'] if n['rank'] == 'species' and n.get('en'))
            paths = [root / 'sources/avilist-2026.xlsx', root / 'source-update/avilist.xlsx']
            for index, path in enumerate(paths):
                book = openpyxl.Workbook()
                sheet = book.active
                sheet.title = 'AviList'
                sheet.append(['RANK', 'SCIENTIFIC NAME', 'ENGLISH NAME: AVILIST', 'SPECIES CODE CORNELL LAB'])
                sheet.append(['species', bird['name'], bird['en'] + (' corrected' if index else ''), bird.get('code')])
                book.save(path)
            old_sha, new_sha = [digest(path.read_bytes()) for path in paths]
            bundle['source']['sha256'] = old_sha
            patches = [{'id': bird['id'], 'field': 'en', 'before': bird['en'], 'after': bird['en'] + ' corrected'}]
            report = {'publish': True, 'errors': [], 'blocked': [], 'from_sha256': old_sha,
                      'to_sha256': new_sha, 'checked_at': '2026-11-01T04:37:00Z', 'patches': patches}
            next_bundle = candidate(bundle, new_sha, patches, report['checked_at'])
            (root / 'dist/data.json').write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
            for name, value in [('report.json', report), ('candidate.json', next_bundle)]:
                (root / 'source-update' / name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')))
            env = dict(os.environ, PATH=str(Path(sys.executable).parent) + os.pathsep + os.environ['PATH'])
            subprocess.run(['node', 'scripts/prepare_source_release.mjs', 'source-update'], cwd=root,
                           env=env, check=True, capture_output=True, text=True)
            manifest = json.loads((root / 'dist/releases.json').read_text())
            released = (root / 'dist' / manifest['path']).read_bytes()
            self.assertEqual(digest(released), manifest['sha256'])
            self.assertEqual(json.loads(released), next_bundle)
            self.assertEqual(json.loads((root / 'dist/data.json').read_text()), next_bundle)
            self.assertEqual(digest(paths[0].read_bytes()), new_sha)
            self.assertTrue((root / 'sources/reviews' / (manifest['sha256'] + '.json')).is_file())
            self.assertTrue((root / 'sources/reviews' / (manifest['sha256'] + '.source-check.json')).is_file())

    def explorer_fixture(self, root):
        for directory in ['scripts', 'sources', 'dist', 'source-update']:
            (root / directory).mkdir()
        for name in ['prepare_source_release.mjs', 'verify_source_workbook.py', 'check_sources.py',
                     'enrich_genus_names.py', 'fetch_genus_names.py', 'explorer_sources.py', 'release.mjs']:
            shutil.copy(ROOT / 'scripts' / name, root / 'scripts' / name)
        for name in ['engine.mjs', 'ux.mjs', 'clades.mjs']:
            shutil.copy(ROOT / 'dist' / name, root / 'dist' / name)
        for name in ['wikidata-bird-genera.json', 'inat-bird-genera.json', 'inaturalist-name-review.json']:
            shutil.copy(ROOT / 'sources' / name, root / 'sources' / name)
        bundle = json.loads((ROOT / 'dist/data.json').read_text())
        species = next(n for n in bundle['nodes'] if n['rank'] == 'species' and n.get('en'))
        byid = {n['id']: n for n in bundle['nodes']}
        lineage = [species]
        while lineage[-1]['parent']:
            lineage.append(byid[lineage[-1]['parent']])
        bundle['nodes'] = copy.deepcopy(list(reversed(lineage)))
        bundle['germany_source']['records'] = []
        bundle['germany_source']['unresolved'] = []
        bundle.pop('germany_subspecies_source', None)
        for node in bundle['nodes']:
            node.pop('germany_candidates', None)
        manifest = json.loads((ROOT / 'sources/avilist-versions.json').read_text())
        entry = version_entry(manifest, bundle['version'])
        headers = [manifest['columnMap'][key][0].replace('{clementsVersion}', entry['clementsVersion']).replace('{birdLifeVersion}', entry['birdLifeVersion']) for key in FIELDS if key != 'familyEn']
        family = next(n for n in bundle['nodes'] if n['rank'] == 'family')
        order = next(n for n in bundle['nodes'] if n['rank'] == 'order')
        data = []
        book = openpyxl.Workbook()
        sheet = book.active
        sheet.append(headers)
        for index, node in enumerate(bundle['nodes'][1:], 1):
            row = dict(sequence=str(index), rank=node['rank'], sciName=node['name'],
                       order=order['name'], family=None if node['rank'] == 'order' else family['name'],
                       familyEn=None if node['rank'] == 'order' else family.get('en'),
                       name=None if node['rank'] == 'genus' else node.get('en'), cornellCode=node.get('code'))
            data.append([row.get(key) for key in FIELDS])
            sheet.append([row.get(key) for key in FIELDS if key != 'familyEn'])
        book.save(root / 'sources/avilist-2026.xlsx')
        bundle['source'].pop('explorer', None)
        bundle['source']['sha256'] = digest((root / 'sources/avilist-2026.xlsx').read_bytes())
        (root / 'sources' / FILES[0]).write_bytes(gzip.compress(json.dumps(data).encode(), mtime=0))
        (root / 'sources' / FILES[1]).write_text(json.dumps(manifest))
        (root / 'sources' / FILES[2]).write_text('[]')
        for name in FILES:
            shutil.copy(root / 'sources' / name, root / 'source-update' / name)
        shutil.copy(root / 'sources/inat-bird-genera.json', root / 'source-update/inaturalist.json')
        return bundle, data, manifest

    def test_explorer_release_replay_and_noop_after_publication(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle, data, manifest = self.explorer_fixture(root)
            self.assertEqual(verify_workbook_baseline(root / 'sources/avilist-2026.xlsx', data, manifest, bundle['version']), 4)
            data[-1][FIELDS.index('name')] += ' corrected'
            folder = root / 'source-update'
            (folder / FILES[0]).write_bytes(gzip.compress(json.dumps(data).encode(), mtime=0))
            next_bundle, evidence, names, changed = build_candidate(root, folder, bundle, '2026-11-01T18:00:00Z')
            self.assertTrue(changed)
            self.assertEqual(len(evidence['patches']), 1)
            report = dict(mode='explorer', checked_at='2026-11-01T18:00:00Z', publish=True, errors=[], blocked=[],
                          from_sha256=bundle['source']['sha256'], to_sha256=bundle['source']['sha256'], **evidence)
            (root / 'dist/data.json').write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
            for name, value in [('report.json', report), ('candidate.json', next_bundle), ('genus-names-candidate.json', names)]:
                (folder / name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')))
            env = dict(os.environ, PATH=str(Path(sys.executable).parent) + os.pathsep + os.environ['PATH'])
            subprocess.run(['node', 'scripts/prepare_source_release.mjs', 'source-update'], cwd=root, env=env, check=True, capture_output=True, text=True)
            published = json.loads((root / 'dist/data.json').read_text())
            manifest = json.loads((root / 'dist/releases.json').read_text())
            released = (root / 'dist' / manifest['path']).read_bytes()
            self.assertEqual(digest(released), manifest['sha256'])
            self.assertEqual(published, json.loads(released))
            again, _, _, changed = build_candidate(root, folder, published, '2026-11-02T18:00:00Z')
            self.assertFalse(changed)
            self.assertEqual(again, published)

    def test_explorer_blocks_taxonomy_license_and_reference_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bundle, data, manifest = self.explorer_fixture(root)
            folder = root / 'source-update'
            for field, value in [('sciName', 'Other name'), ('range', 'Changed range'), ('name', '=formula')]:
                modified = copy.deepcopy(data)
                modified[-1][FIELDS.index(field)] = value
                (folder / FILES[0]).write_bytes(gzip.compress(json.dumps(modified).encode(), mtime=0))
                with self.assertRaises(ValueError):
                    inspect_explorer(root, folder, bundle)
            shutil.copy(root / 'sources' / FILES[0], folder / FILES[0])
            modified = copy.deepcopy(manifest)
            modified['versions'][-1]['license'] = 'Other license'
            (folder / FILES[1]).write_text(json.dumps(modified))
            with self.assertRaises(ValueError):
                inspect_explorer(root, folder, bundle)
            shutil.copy(root / 'sources' / FILES[1], folder / FILES[1])
            (folder / FILES[2]).write_text('[{"short":"new reference"}]')
            with self.assertRaises(ValueError):
                inspect_explorer(root, folder, bundle)

    def test_seven_reviewed_names_and_unknown_changes(self):
        bundle = json.loads((ROOT / 'dist/data.json').read_text())
        snapshot = json.loads((ROOT / 'sources/inat-bird-genera.json').read_text())
        fixture = json.loads((ROOT / 'scripts/fixtures/inaturalist-reviewed-changes.json').read_text())
        replacements = {r['id']: r for r in fixture['results']}
        snapshot['results'] = [r for r in snapshot['results'] if r['id'] not in replacements] + list(replacements.values())
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / 'inaturalist.json').write_text(json.dumps(snapshot))
            patches, _, _, _ = inspect_names(ROOT, folder, bundle, '2026-11-01T18:00:00Z')
            result = {n['id']: copy.deepcopy(n) for n in bundle['nodes']}
            for patch in patches:
                result[patch['id']] = patch['after']
            wanted = {'Emberiza':'Emberiza buntings', 'Eurocephalus':'White-crowned Shrikes',
                      'Fringillaria':'African buntings', 'Nannus':'Holarctic wrens',
                      'Pinarostola':'Drab honeyeaters', 'Pycnopygius':None, 'Sapayoa':'Sapayoas'}
            for genus, name in wanted.items():
                node = next(n for n in result.values() if n['name'] == genus)
                self.assertEqual(node.get('en'), name)
            sapayoa = next(r for r in snapshot['results'] if r['name'] == 'Sapayoa')
            next(n for n in sapayoa['names'] if n['locale'] == 'en')['name'] = 'Unreviewed name'
            (folder / 'inaturalist.json').write_text(json.dumps(snapshot))
            with self.assertRaisesRegex(ValueError, 'Unreviewed iNaturalist'):
                inspect_names(ROOT, folder, bundle, '2026-11-01T18:00:00Z')

    def test_batched_queries_and_retry_truncated_json(self):
        urls = []
        def get_json(url):
            urls.append(url)
            return {'results': {'bindings': [{'scientific': {'value': 'Test'}}]}}
        result = fetch_wikidata(['Genus' + str(i) for i in range(201)], get_json)
        self.assertEqual(len(urls), 3)
        self.assertEqual(len(result['results']['bindings']), 3)
        self.assertTrue(all('VALUES' in url and 'LIMIT' not in url for url in urls))
        with patch('check_sources.download', side_effect=[b'{truncated', b'{"ok":true}']), patch('check_sources.time.sleep'):
            self.assertEqual(fetch_json('https://example.test/api'), {'ok': True})

    def test_permanent_denial_does_not_hammer_source(self):
        from check_sources import download
        with patch('check_sources.urlopen', side_effect=HTTPError('https://example.test/', 403, 'Forbidden', {}, None)) as request, patch('check_sources.time.sleep') as sleep:
            with self.assertRaises(HTTPError):
                download('https://example.test/')
            self.assertEqual(request.call_count, 1)
            sleep.assert_not_called()

    def test_upstream_failure_preserves_report_and_never_publishes(self):
        config = {'documents': [{'id': 'avilist.xlsx', 'url': 'https://invalid.test/data', 'local': 'unused'}], 'publication_pages': []}
        with tempfile.TemporaryDirectory() as tmp, patch('check_sources.download', side_effect=OSError('Source unavailable')):
            folder = Path(tmp)
            self.assertEqual(check(folder, config), 1)
            report = json.loads((folder / 'report.json').read_text())
            self.assertFalse(report['publish'])
            self.assertTrue(any(error.startswith('Wikidata:') for error in report['errors']))
            self.assertTrue(any(error.startswith('iNaturalist:') for error in report['errors']))
            self.assertFalse((folder / 'candidate.json').exists())


if __name__ == '__main__':
    unittest.main()
