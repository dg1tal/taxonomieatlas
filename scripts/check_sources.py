"""Daily read-only acquisition and conservative, source-bound AviList candidate builder.

Never writes published files. A separate job validates/releases a candidate.
"""
import argparse
import copy
import hashlib
import json
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlparse
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from zipfile import ZipFile

import openpyxl
from enrich_genus_names import enrich
import fetch_genus_names as feeds

ROOT = Path(__file__).resolve().parents[1]
AUTO_FIELDS = {'ENGLISH NAME: AVILIST': 'en', 'SPECIES CODE CORNELL LAB': 'code'}
UA = 'BirdTaxonomyAtlas/1.0 (+https://github.com/dg1tal/taxonomieatlas; daily source check)'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def download(url, accept="*/*"):
    if urlparse(url).scheme != 'https':
        raise ValueError('Only HTTPS sources are accepted')
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': UA, 'Accept': accept}), timeout=45) as response:
                if urlparse(response.url).scheme != 'https':
                    raise ValueError('Insecure source redirect')
                content = response.read(40 * 1024 * 1024 + 1)
                if len(content) > 40 * 1024 * 1024:
                    raise ValueError('Source exceeds 40 MiB limit')
                return content
        except HTTPError as error:
            # Permanent denials are retried tomorrow, not hammered every few seconds.
            if error.code in (400, 401, 403, 404) or attempt == 2:
                raise
            delay = int(error.headers.get('Retry-After', 2 ** attempt)) if error.headers.get('Retry-After', '').isdigit() else 2 ** attempt
            if delay > 60:
                raise
            time.sleep(delay)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def fetch_json(url):
    # A 200 response can still be truncated by the upstream query service.
    for attempt in range(3):
        try:
            return json.loads(download(url, 'application/json'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def fetch_wikidata(genera, get_json=fetch_json):
    # Bound the query to the genera we use: the global ancestry query can time
    # out mid-response. No LIMIT that could silently truncate matching taxa.
    bindings = []
    names = sorted(set(genera))
    for offset in range(0, len(names), 100):
        values = ' '.join(json.dumps(name) for name in names[offset:offset + 100])
        query = ('SELECT ?item ?scientific ?de ?en ?common ?deArticle ?enArticle WHERE { '
                 'hint:Query hint:optimizer "None". '
                 'VALUES ?scientific { ' + values + ' } '
                 '?item wdt:P225 ?scientific. ?item wdt:P105 wd:Q34740. '
                 '?item wdt:P171* wd:Q5113. hint:Prior hint:gearing "forward". '
                 'OPTIONAL { ?item rdfs:label ?de FILTER(LANG(?de)="de") } '
                 'OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en)="en") } '
                 'OPTIONAL { ?item wdt:P1843 ?common FILTER(LANG(?common) IN ("de","en")) } '
                 'OPTIONAL { ?deArticle schema:about ?item; schema:isPartOf <https://de.wikipedia.org/> } '
                 'OPTIONAL { ?enArticle schema:about ?item; schema:isPartOf <https://en.wikipedia.org/> } }')
        result = get_json('https://query.wikidata.org/sparql?' + urlencode({'query': query, 'format': 'json'}))
        rows = result['results']['bindings']
        if not isinstance(rows, list):
            raise ValueError('Invalid Wikidata response structure')
        bindings.extend(rows)
    if not bindings:
        raise ValueError('Empty Wikidata results')
    return {'results': {'bindings': bindings}}


class Links(HTMLParser):
    def __init__(self, text, base):
        super().__init__()
        self.urls = set()
        self.base = base
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href = dict(attrs).get('href', '')
            if href:
                self.urls.add(urljoin(self.base, href).split('#')[0])


def publication_links(content, url):
    links = Links(content.decode('utf-8'), url).urls
    # Detect new editions/URLs without treating site navigation/CSS changes as data.
    return sorted(u for u in links if urlparse(u).path.lower().endswith(('.xlsx', '.pdf')) or re.search(r'/checklist/v[0-9]', urlparse(u).path))


def workbook(path):
    with ZipFile(path) as archive:
        if sum(info.file_size for info in archive.infolist()) > 300 * 1024 * 1024:
            raise ValueError('Uncompressed workbook exceeds limit')
    book = openpyxl.load_workbook(path, read_only=True, data_only=False)
    try:
        return [(sheet.title, [list(row) for row in sheet.iter_rows(values_only=True)]) for sheet in book]
    finally:
        book.close()


def avi_patches(old_sheets, new_sheets, bundle):
    """Only two source fields may change; all other cells/sheets/order must match."""
    if [s[0] for s in old_sheets] != [s[0] for s in new_sheets]:
        raise ValueError('Workbook sheets changed; expert review required')
    if old_sheets[1:] != new_sheets[1:]:
        raise ValueError('Decisions, citation or other supporting sheets changed')
    old_rows, new_rows = old_sheets[0][1], new_sheets[0][1]
    if not old_rows or not new_rows or old_rows[0] != new_rows[0] or len(old_rows) != len(new_rows):
        raise ValueError('AviList schema or row count changed')
    headers = old_rows[0]
    required = ['RANK', 'SCIENTIFIC NAME', *AUTO_FIELDS]
    if any(headers.count(key) != 1 for key in required):
        raise ValueError('Missing/duplicate required AviList column')
    allowed = {headers.index(key): value for key, value in AUTO_FIELDS.items()}
    nodes = {(n['rank'], n['name']): n for n in bundle['nodes']}
    patches = []
    for before, after in zip(old_rows[1:], new_rows[1:]):
        if len(before) != len(after):
            raise ValueError('AviList column count changed')
        row = dict(zip(headers, before))
        for col, (a, b) in enumerate(zip(before, after)):
            if a == b:
                continue
            if col not in allowed:
                raise ValueError('Non-automatic source change: ' + str(headers[col]))
            node = nodes.get((row['RANK'], row['SCIENTIFIC NAME']))
            field = allowed[col]
            if not node or row['RANK'] == 'genus':
                raise ValueError('Changed field lacks an unambiguous source-only target')
            if not isinstance(a, str) or not isinstance(b, str) or not b.strip() or b.startswith('='):
                raise ValueError('Removed, empty or non-text source field')
            if node.get(field) != a:
                raise ValueError('Published value differs from original source')
            patches.append({'id': node['id'], 'field': field, 'before': a, 'after': b})
    return patches


def candidate(bundle, new_sha, patches, checked_at):
    result = copy.deepcopy(bundle)
    nodes = {n['id']: n for n in result['nodes']}
    for patch in patches:
        nodes[patch['id']][patch['field']] = patch['after']
    result['source']['sha256'] = new_sha
    result['dataset_revision'] = checked_at[:10] + '.auto-' + new_sha[:12]
    return result


def check(out, config):
    out.mkdir(parents=True, exist_ok=True)
    (out / 'candidate.json').unlink(missing_ok=True)
    bundle = json.loads((ROOT / 'dist/data.json').read_text())
    report = {'checked_at': datetime.now(timezone.utc).isoformat(), 'sources': [],
              'blocked': [], 'errors': [], 'publish': False, 'patches': []}
    avi_download = None
    for entry in config['documents']:
        try:
            print('Checking ' + entry['id'], flush=True)
            content = download(entry['url'])
            (out / entry['id']).write_bytes(content)
            actual = digest(content)
            expected = digest((ROOT / entry['local']).read_bytes())
            report['sources'].append({'id': entry['id'], 'url': entry['url'], 'before': expected, 'after': actual})
            if entry['id'] == 'avilist.xlsx':
                if expected != bundle['source']['sha256']:
                    raise ValueError('Published AviList source checksum differs from local workbook')
                if actual != expected:
                    patches = avi_patches(workbook(ROOT / entry['local']), workbook(out / entry['id']), bundle)
                    report['patches'] = patches
                    report['from_sha256'], report['to_sha256'] = expected, actual
                    avi_download = content
            elif actual != expected:
                report['blocked'].append(entry['id'] + ': document changed; expert/rights review required')
        except Exception as error:
            report['errors'].append(entry['id'] + ': ' + str(error))
    for entry in config['publication_pages']:
        try:
            print('Checking ' + entry['id'], flush=True)
            content = download(entry['url'])
            (out / entry['id']).write_bytes(content)
            links = publication_links(content, entry['url'])
            if not links:
                raise ValueError('No publication links found; source page may have changed')
            report['sources'].append({'id': entry['id'], 'url': entry['url'], 'links': links})
            if links != entry['links']:
                report['blocked'].append(entry['id'] + ': publication links changed; review edition/schema/license')
        except Exception as error:
            report['errors'].append(entry['id'] + ': ' + str(error))
    # The same enrichment logic compares only imported names, not API timestamps,
    # unrelated genera, images or observation metadata. Never replaces their sources.
    old_wd = json.loads((ROOT / 'sources/wikidata-bird-genera.json').read_text())
    old_wd['results']['bindings'].sort(key=lambda row: canonical(row))
    old_inat = json.loads((ROOT / 'sources/inat-bird-genera.json').read_text())
    _, old_names = enrich(copy.deepcopy(bundle), old_wd, old_inat)
    baseline_names_sha = digest(canonical(old_names))
    wd, inat = None, None
    try:
        print('Checking Wikidata (batches of 100 existing genera)', flush=True)
        wd = fetch_wikidata(n['name'] for n in bundle['nodes'] if n['rank'] == 'genus')
        wd['results']['bindings'].sort(key=lambda row: canonical(row))
        (out / 'wikidata.json').write_bytes(canonical(wd))
        _, names = enrich(copy.deepcopy(bundle), wd, old_inat)
        actual = digest(canonical(names))
        report['sources'].append({'id': 'Wikidata', 'before': baseline_names_sha, 'after': actual})
        if actual != baseline_names_sha:
            report['blocked'].append('Wikidata genus names changed; source review required')
    except Exception as error:
        report['errors'].append('Wikidata: ' + str(error))
    try:
        print('Checking iNaturalist (complete paginated genera)', flush=True)
        feeds.get = fetch_json
        first = feeds.inat(1)
        total = first['total_results']
        if not isinstance(total, int) or not 1 <= total <= 10000:
            raise ValueError('Unexpected iNaturalist result count')
        with ThreadPoolExecutor(max_workers=2) as pool:
            parts = list(pool.map(feeds.inat, range(2, (total + 199) // 200 + 1)))
        if any(part['total_results'] != total for part in parts):
            raise ValueError('iNaturalist result count changed during pagination')
        rows = first['results'] + [row for part in parts for row in part['results']]
        if len(rows) != total or len({row['id'] for row in rows}) != total:
            raise ValueError('Incomplete/duplicate iNaturalist pagination')
        inat = {'results': sorted(rows, key=lambda row: row['id'])}
        (out / 'inaturalist.json').write_bytes(canonical(inat))
        _, names = enrich(copy.deepcopy(bundle), old_wd, inat)
        actual = digest(canonical(names))
        report['sources'].append({'id': 'iNaturalist', 'before': baseline_names_sha, 'after': actual})
        if actual != baseline_names_sha:
            report['blocked'].append('iNaturalist genus names changed; source/rights review required')
    except Exception as error:
        report['errors'].append('iNaturalist: ' + str(error))
    if wd is not None and inat is not None:
        _, names = enrich(copy.deepcopy(bundle), wd, inat)
        (out / 'genus-names-candidate.json').write_bytes(canonical(names))
    if avi_download and not report['blocked'] and not report['errors']:
        report['publish'] = True
        (out / 'candidate.json').write_text(json.dumps(candidate(bundle, report['to_sha256'], report['patches'], report['checked_at']), ensure_ascii=False, separators=(',', ':')))
    (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    summary = ['# Daily bird source check', '', 'Checked: ' + report['checked_at'],
               '', 'Automatic candidate: ' + str(report['publish']),
               '', '## Review required', *['- ' + reason for reason in report['blocked']],
               '', '## Errors', *['- ' + reason for reason in report['errors']],
               '', 'See report.json and downloaded sources in the workflow artifact.']
    (out / 'summary.md').write_text('\n'.join(summary) + '\n')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as stream:
            stream.write((out / 'summary.md').read_text())
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a') as stream:
            stream.write('publish=' + str(report['publish']).lower() + '\n')
    print((out / 'summary.md').read_text())
    return 1 if report['errors'] or report['blocked'] else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'source-update')
    args = parser.parse_args()
    raise SystemExit(check(args.output, json.loads((ROOT / 'sources/watch.json').read_text())))
