"""Run only after coordinator freeze. Read input files once; output outside inventory scope."""
import argparse, hashlib, json, subprocess, zipfile, re
from datetime import datetime, timezone
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--candidate', required=True)
parser.add_argument('--freeze-receipt', required=True, help='Coordinator freeze instruction text')
parser.add_argument('--output', required=True, help='New JSON path inside release/')
args = parser.parse_args()
repo = Path('E:/WMS_HoaNam/Scanner_CMS/sites/hoa-nam-wms-tray-approved-20261026')
packet = repo / 'docs/quality/uiux-task-HN-S27-005'
out = (repo / args.output).resolve()
if not out.is_relative_to((packet / 'release').resolve()) or out.exists():
    raise SystemExit('Output must be a new file under owned release/')
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def git(*argv):
    return subprocess.check_output(['git', '-C', str(repo), *argv], text=True).strip()
if git('rev-parse', 'HEAD') != args.candidate:
    raise SystemExit('Candidate differs from HEAD')
# release/ contains audit control outputs and is excluded to avoid recursive receipts.
paths = sorted(p for p in packet.rglob('*') if p.is_file()
               and not p.is_relative_to(packet / 'release'))
freeze = json.loads(Path(args.freeze_receipt).read_text(encoding='utf-8-sig'))
external_packet = repo / freeze['packetPath']
paths.append(external_packet)
entries, errors, secret_findings = [], [], []
for path in paths:
    item = dict(path=path.relative_to(repo).as_posix(), bytes=path.stat().st_size, sha256=sha(path))
    try:
        if path.suffix.lower() == '.json':
            json.loads(path.read_text(encoding='utf-8-sig')); item['jsonParse'] = 'PASS'
        elif path.suffix.lower() == '.png':
            with Image.open(path) as im:
                im.load(); item.update(pngDecode='PASS', width=im.width, height=im.height)
        elif path.suffix.lower() == '.zip':
            with zipfile.ZipFile(path) as z:
                bad = z.testzip()
                if bad: raise ValueError('CRC failed: ' + bad)
                item.update(zipCRC='PASS', zipMembers=len(z.infolist()))
    except Exception as exc:
        item['error'] = str(exc); errors.append(item['path'])
    if path.suffix.lower() in {'.json', '.md', '.txt', '.log', '.ps1', '.py', '.mjs', '.ts', '.tsx', '.html'}:
        content = path.read_text(encoding='utf-8-sig', errors='replace')
        # High precision literal credential signatures; record path/type only, never value.
        for label, pattern in [('private-key', r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
                               ('github-token', r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'),
                               ('persisted-bearer', r'(?i)Bearer\s+[A-Za-z0-9._-]{24,}')]:
            if re.search(pattern, content): secret_findings.append(dict(path=item['path'], kind=label))
    entries.append(item)
manifest = json.loads((packet / 'design/REFERENCE_MANIFEST.json').read_text(encoding='utf-8-sig'))
refs = manifest.get('references', manifest.get('files', []))
if not refs:
    # Fail visibly rather than silently treating unknown manifest schema as empty success.
    raise SystemExit('Reference manifest needs references/files array; inspect schema')
references = []
for ref in refs:
    original, custody = Path(ref['original']), packet / ref['custody']
    expected = ref['sha256']
    match = sha(original) == sha(custody) == expected
    references.append(dict(original=str(original), custody=str(custody.relative_to(repo)), expectedSha256=expected, matches=match))
    if not match: errors.append(str(custody))
protected = []
for record in json.loads((packet / 'PROTECTED_SOURCE_BEFORE.json').read_text(encoding='utf-8-sig'))['files']:
    actual = sha(repo / record['path'])
    match = actual == record['sha256']
    protected.append(dict(path=record['path'], expectedSha256=record['sha256'], actualSha256=actual, matches=match))
    if not match: errors.append(record['path'])
# Detect concurrent edits to inventoried files during the collector, without including its own output.
changed = [e['path'] for e in entries if sha(repo / e['path']) != e['sha256']]
errors.extend(changed)
owner_manifests = []
for name, key, expected_count in [('visual/FINAL_CAPTURE_MANIFEST.json', 'assets', 721), ('functional/FINAL_EVIDENCE_MANIFEST.json', 'files', 119)]:
    declared = json.loads((packet / name).read_text(encoding='utf-8-sig'))[key]
    failures = []
    for record in declared:
        target = (packet / record['path']).resolve()
        if not target.is_relative_to(packet.resolve()) or not target.is_file():
            failures.append(dict(path=record['path'], reason='missing or outside packet')); continue
        if sha(target) != record['sha256'] or target.stat().st_size != record['bytes']:
            failures.append(dict(path=record['path'], reason='hash/size mismatch'))
    if len(declared) != expected_count: failures.append(dict(reason='unexpected declared count'))
    owner_manifests.append(dict(path=name, count=len(declared), failures=failures, status='PASS' if not failures else 'FAIL'))
    errors.extend(failures)
required_images = []
for group in ['before-synthetic', 'final-normal-ebcf0d3']:
    for profile in ['desktop', 'tablet']:
        for state in ['list', 'modal']:
            required_images.append('visual/' + group + '/' + profile + '-' + state + '.png')
for group in ['before', 'before-eventdate']:
    for profile in ['desktop', 'tablet']:
        required_images.append('visual/' + group + '/' + profile + '-failure.png')
review_sets = sorted(p for p in (packet / 'visual/final-review-ebcf0d3').iterdir() if p.is_dir())
for directory in review_sets:
    for name in ['before-aligned.png', 'after-aligned.png', 'reference-aligned.png', 'reference-before-after.png', 'reference-after-overlay.png', 'reference-after-diff-x3.png', 'before-after-overlay.png', 'before-after-diff-x3.png']:
        required_images.append((directory / name).relative_to(packet).as_posix())
missing_images = [name for name in required_images if not (packet / name).is_file()]
errors.extend(missing_images)
if len(review_sets) != 4: errors.append('Expected four final review sets')
packet_matches = sha(external_packet) == freeze['packetSha256']
tree_matches = git('rev-parse', 'HEAD:src') == freeze['srcTree'] and git('rev-parse', 'HEAD:tests') == freeze['testsTree']
if not packet_matches: errors.append('External packet hash differs from freeze')
if not tree_matches: errors.append('Tree identity differs from freeze')
errors.extend(secret_findings)
result = dict(observedAtUtc=datetime.now(timezone.utc).isoformat(), candidateSha=args.candidate,
              freezeReceipt=args.freeze_receipt, headEnd=git('rev-parse', 'HEAD'),
              scope='All packet files except release/**; final reports included, no outputs recursively inventoried',
              sourceStatus=git('status', '--short', '--', 'src', 'tests'), entries=entries,
              ownerManifests=owner_manifests, externalPacket=dict(path=freeze['packetPath'], expectedSha256=freeze['packetSha256'], actualSha256=sha(external_packet), matches=packet_matches),
              treeMatchesFreeze=tree_matches, requiredImages=dict(count=len(required_images), missing=missing_images, reviewSets=[p.name for p in review_sets]),
              credentialSignatureScan=dict(scope='Inventoried text inputs; high precision literal tokens, private keys, persisted bearer strings', findings=secret_findings),
              references=references, protectedSources=protected, changedDuringCollection=changed,
              errors=errors, status='PASS' if not errors and git('rev-parse', 'HEAD') == args.candidate else 'FAIL')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(dict(status=result['status'], files=len(entries), png=sum('pngDecode' in e for e in entries),
                     json=sum('jsonParse' in e for e in entries), zip=sum('zipCRC' in e for e in entries),
                     bytes=sum(e['bytes'] for e in entries), maxFile=max(entries, key=lambda e:e['bytes']), ownerManifests=owner_manifests,
                     references=len(references), protected=len(protected), packetMatch=packet_matches, requiredImages=result['requiredImages'], errors=errors)))

