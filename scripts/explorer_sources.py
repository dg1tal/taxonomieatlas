"""Source-bound policy for the official AviList Explorer and individually reviewed names."""
import copy
import gzip
import hashlib
import html
import json
import re
from pathlib import Path

FIELDS = 'sequence rank order family familyEn sciName authority citation name nameClements nameBirdLife proposalNumber decisionSummary range extinct iucn birdLifeUrl cornellCode bowUrl avibaseId genusGender typeSpecies typeLocality originalDescriptionTitle originalDescriptionUrl protonym'.split()
RANKS = {'order', 'family', 'genus', 'species', 'subspecies'}
FILES = ['avilist-explorer.json.gz', 'avilist-versions.json', 'avilist-references.json']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text())


def raw_data(folder):
    return gzip.decompress((Path(folder) / FILES[0]).read_bytes())


def text(value):
    if isinstance(value, dict):
        if set(value) != {'richText'} or not isinstance(value['richText'], list):
            raise ValueError('Unknown AviList rich-text schema')
        value = ''.join(part['text'] for part in value['richText'])
    if value is None:
        return None
    if not isinstance(value, (str, int, float)):
        raise ValueError('Unsupported AviList cell type')
    # The XLSX reader retains OOXML's escaped U+0002 in two type-locality cells;
    # the official JSON carries the same control character literally.
    value = str(value).replace('_x0002_', '\x02')
    return ' '.join(html.unescape(re.sub(r'<[^>]*>', '', value)).split()) or None


def rows(data):
    if not isinstance(data, list) or not 1 <= len(data) <= 100000:
        raise ValueError('Invalid AviList row count')
    seen = set()
    result = []
    for values in data:
        if not isinstance(values, list) or len(values) != len(FIELDS):
            raise ValueError('Unknown AviList Explorer row schema')
        for field in ['name', 'cornellCode']:
            value = values[FIELDS.index(field)]
            if value is not None and (not isinstance(value, str) or not value.strip() or len(value) > 200 or value.startswith('=')):
                raise ValueError('Invalid source name/code cell')
        row = dict(zip(FIELDS, (text(value) for value in values)))
        key = (row['rank'], row['sciName'])
        if row['rank'] not in RANKS or not row['sciName'] or key in seen:
            raise ValueError('Invalid/duplicate AviList taxon')
        seen.add(key)
        result.append(row)
    return result


def version_entry(manifest, version):
    if list(manifest['columnMap']) != FIELDS:
        raise ValueError('Explorer column map changed')
    matches = [entry for entry in manifest['versions'] if entry['id'] == version]
    if len(matches) != 1 or 'CC BY 4.0' not in matches[0].get('license', ''):
        raise ValueError('AviList version or license requires review')
    return matches[0]


def verify_workbook_baseline(xlsx, data, manifest, version):
    """Enrollment compares every shared field of every taxon against the original XLSX."""
    import openpyxl
    entry = version_entry(manifest, version)
    book = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    try:
        source = book.worksheets[0].iter_rows(values_only=True)
        headers = next(source)
        workbook_rows = [dict(zip(headers, values)) for values in source if dict(zip(headers, values)).get('RANK') in RANKS]
    finally:
        book.close()
    converted = rows(data)
    if len(converted) != len(workbook_rows):
        raise ValueError('Explorer/XLSX taxon count differs')
    english_families = {r['SCIENTIFIC NAME']: text(r['ENGLISH NAME: AVILIST']) for r in workbook_rows if r['RANK'] == 'family'}
    for original, row in zip(workbook_rows, converted):
        for field in FIELDS:
            if field == 'familyEn':
                expected = english_families.get(row['family'])
            else:
                label = manifest['columnMap'][field][0].replace('{clementsVersion}', entry['clementsVersion']).replace('{birdLifeVersion}', entry['birdLifeVersion'])
                if label not in headers:
                    raise ValueError('Explorer field absent from original workbook: ' + label)
                expected = text(original[label])
            if row[field] != expected:
                raise ValueError('Explorer/XLSX mismatch: ' + row['sciName'] + '/' + field)
    return len(converted)


def inspect_explorer(root, folder, bundle):
    root, folder = Path(root), Path(folder)
    baseline = root / 'sources'
    before_raw, after_raw = raw_data(baseline), raw_data(folder)
    old_manifest, new_manifest = read_json(baseline / FILES[1]), read_json(folder / FILES[1])
    version_entry(new_manifest, bundle['version'])
    if old_manifest != new_manifest:
        raise ValueError('Explorer versions, license, citation or column map changed; review required')
    if read_json(baseline / FILES[2]) != read_json(folder / FILES[2]):
        raise ValueError('AviList reference bibliography changed; review required')
    original_sha = sha((baseline / 'avilist-2026.xlsx').read_bytes())
    if bundle['source']['sha256'] != original_sha:
        raise ValueError('Original workbook provenance mismatch')
    previous = bundle['source'].get('explorer')
    if previous:
        if previous['sha256'] != sha(before_raw) or previous['versions_sha256'] != sha((baseline / FILES[1]).read_bytes()) or previous['references_sha256'] != sha((baseline / FILES[2]).read_bytes()):
            raise ValueError('Published Explorer baseline checksum mismatch')
    else:
        verify_workbook_baseline(baseline / 'avilist-2026.xlsx', json.loads(before_raw), old_manifest, bundle['version'])
    old_rows, new_rows = rows(json.loads(before_raw)), rows(json.loads(after_raw))
    if len(old_rows) != len(new_rows):
        raise ValueError('AviList row count changed')
    nodes = {(n['rank'], n['name']): n for n in bundle['nodes']}
    if {(r['rank'], r['sciName']) for r in old_rows} != {key for key in nodes if key[0] != 'class'}:
        raise ValueError('Explorer baseline taxonomy differs from published taxa')
    patches = []
    for before, after in zip(old_rows, new_rows):
        for field in FIELDS:
            if before[field] == after[field]:
                continue
            if field not in {'name', 'cornellCode'}:
                raise ValueError('Non-automatic AviList field: ' + field)
            node = nodes.get((before['rank'], before['sciName']))
            target = {'name': 'en', 'cornellCode': 'code'}[field]
            if not node or node['rank'] == 'genus' or node.get(target) != before[field] or not after[field]:
                raise ValueError('Source field has no unambiguous published target')
            patches.append(dict(id=node['id'], field=target, before=before[field], after=after[field]))
    metadata = dict(url=f"https://explore.avilist.org/data/avilist-{bundle['version']}.json", sha256=sha(after_raw),
                    versions_url='https://explore.avilist.org/versions.json', versions_sha256=sha((folder / FILES[1]).read_bytes()),
                    references_sha256=sha((folder / FILES[2]).read_bytes()), fields=FIELDS)
    return patches, metadata


def semantics(value):
    """Retrieval dates are provenance, not a change to a source name."""
    if isinstance(value, dict):
        return {key: semantics(item) for key, item in value.items() if key != 'retrieved'}
    if isinstance(value, list):
        return [semantics(item) for item in value]
    return value


def fingerprint(value):
    return sha(json.dumps(semantics(value), ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode())


def inspect_names(root, folder, bundle, checked_at):
    from enrich_genus_names import enrich
    root, folder = Path(root), Path(folder)
    wd = read_json(root / 'sources/wikidata-bird-genera.json')
    old_inat = read_json(root / 'sources/inat-bird-genera.json')
    new_inat = read_json(folder / 'inaturalist.json')
    _, old = enrich(copy.deepcopy(bundle), wd, old_inat)
    enriched, new = enrich(copy.deepcopy(bundle), wd, new_inat)
    approvals = read_json(root / 'sources/inaturalist-name-review.json')
    source = {r['name']: r for r in new_inat['results']}
    original = {n['name']: n for n in bundle['nodes'] if n['rank'] == 'genus'}
    fresh = {n['name']: n for n in enriched['nodes'] if n['rank'] == 'genus'}
    patches, decisions = [], []
    for genus in sorted(set(old['genera']) | set(new['genera'])):
        before, after = old['genera'].get(genus), new['genera'].get(genus)
        if fingerprint(before) == fingerprint(after):
            continue
        approval = next((r for r in approvals['decisions'] if r['genus'] == genus and r['before_sha256'] == fingerprint(before) and r['after_sha256'] == fingerprint(after)), None)
        if not approval or approval['decision'] != 'accept' or not approval.get('evidence') or not approvals.get('rights_assessment'):
            raise ValueError('Unreviewed iNaturalist name change: ' + genus)
        record = source.get(genus)
        if not record or record['id'] != approval['inaturalist_id'] or record.get('rank') != 'genus' or not record.get('is_active') or 3 not in record.get('ancestor_ids', []):
            raise ValueError('Reviewed iNaturalist taxon identity changed: ' + genus)
        node = copy.deepcopy(fresh[genus])
        for lang in ['de', 'en']:
            # Only the changed English evidence gets a new receipt date.
            if fingerprint((before or {}).get(lang)) != fingerprint((after or {}).get(lang)):
                if lang != 'en':
                    raise ValueError('German name change requires separate review')
                for name in node.get('vernacular_names', {}).get(lang, []):
                    for evidence in name['evidence']:
                        if evidence['source'] == 'iNaturalist':
                            evidence['retrieved'] = checked_at[:10]
        # Preserve existing receipt dates and all other fields outside changed evidence.
        for lang in ['de', 'en']:
            if fingerprint((before or {}).get(lang)) == fingerprint((after or {}).get(lang)):
                for field in [lang, lang + '_source', lang + '_match']:
                    if field in original[genus]:
                        node[field] = original[genus][field]
                    else:
                        node.pop(field, None)
                if lang in original[genus].get('vernacular_names', {}):
                    node.setdefault('vernacular_names', {})[lang] = copy.deepcopy(original[genus]['vernacular_names'][lang])
        patches.append(dict(id=node['id'], before=original[genus], after=node))
        decisions.append(dict(genus=genus, decision='accept', evidence=approval['evidence']))
    name_sources = copy.deepcopy(bundle.get('name_sources', []))
    if patches:
        for metadata in name_sources:
            if metadata['name'] == new['metadata']['name']:
                metadata['counts'] = new['metadata']['counts']
                metadata['retrieved'] = checked_at[:10]
        new['metadata']['retrieved'] = checked_at[:10]
        # Keep the stored enrichment report aligned with the actual candidate evidence.
        for patch in patches:
            genus = patch['after']['name']
            if patch['after'].get('vernacular_names'):
                new['genera'][genus] = patch['after']['vernacular_names']
            else:
                new['genera'].pop(genus, None)
    return patches, name_sources, new, decisions


def build_candidate(root, folder, bundle, checked_at):
    patches, metadata = inspect_explorer(root, folder, bundle)
    genus_patches, name_sources, names_report, decisions = inspect_names(root, folder, bundle, checked_at)
    next_bundle = copy.deepcopy(bundle)
    nodes = {n['id']: n for n in next_bundle['nodes']}
    for patch in patches:
        nodes[patch['id']][patch['field']] = patch['after']
    for patch in genus_patches:
        node = nodes[patch['id']]
        node.clear()
        node.update(patch['after'])
    next_bundle['source']['explorer'] = metadata
    next_bundle['name_sources'] = name_sources
    changed = bool(patches or genus_patches or bundle['source'].get('explorer') != metadata)
    if changed:
        marker = sha((metadata['sha256'] + fingerprint([p['after'] for p in genus_patches])).encode())[:12]
        next_bundle['dataset_revision'] = checked_at[:10] + '.auto-' + marker
    names_report['genera'] = {n['name']: n['vernacular_names'] for n in next_bundle['nodes'] if n['rank'] == 'genus' and n.get('vernacular_names')}
    names_report['metadata'] = copy.deepcopy(next(s for s in name_sources if s['name'] == 'Ergänzende Gattungsnamen'))
    evidence = dict(patches=patches, explorer=metadata, genus_patches=genus_patches,
                    name_sources=name_sources, name_decisions=decisions, dataset_revision=next_bundle.get('dataset_revision'))
    return next_bundle, evidence, names_report, changed


def compact_inat(snapshot, retrieved):
    """Retain taxonomic facts only; no media, observation counts or user metadata."""
    records = []
    for row in sorted(snapshot['results'], key=lambda r: r['id']):
        record = {key: row[key] for key in ['id', 'name', 'rank', 'is_active', 'ancestor_ids']}
        record['names'] = [{key: name[key] for key in ['name', 'locale', 'position', 'is_valid'] if key in name}
                           for name in row.get('names', []) if name.get('locale') in ['de', 'en']]
        records.append(record)
    return dict(retrieved=retrieved, total_results=len(records), results=records)
