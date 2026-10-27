"""Read frozen QA artifacts without rewriting images, archives, reports or baselines."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, subprocess, zipfile
from PIL import Image

repo = Path(__file__).resolve().parents[4]
task = repo / 'docs/quality/uiux-task-HN-NC-003'
accepted_visual = 'visual/after-830f83d-recovery-ignored-temp/'
accepted_functional = ('functional/tablet-delta-final/', 'functional/tablet-delta-retest/')
rows = []
candidates = list(task.glob('*.log'))
for group in ('visual', 'functional', 'implementation'):
    candidates.extend((task / group).rglob('*'))
for p in sorted(candidates):
        if not p.is_file() or p.suffix.lower() not in ('.png', '.zip', '.json', '.log', '.tap'):
            continue
        relative = p.relative_to(task).as_posix()
        if any(part.startswith('.tmp') or part in ('browser-cache', 'node_modules', 'output') for part in p.relative_to(task).parts):
            continue
        raw = p.read_bytes()
        row = {'file': relative, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(),
               'category': 'accepted-final' if relative.startswith((accepted_visual, *accepted_functional)) else 'historical-or-supporting',
               'validation': 'NOT_APPLICABLE'}
        try:
            if p.suffix.lower() == '.png':
                with Image.open(p) as img:
                    row['dimensions'] = list(img.size)
                    img.verify()
                row['validation'] = 'VALID_PNG'
            elif p.suffix.lower() == '.json':
                json.loads(raw.decode('utf-8-sig'))
                row['validation'] = 'VALID_JSON'
            elif p.suffix.lower() == '.zip':
                with zipfile.ZipFile(p) as archive:
                    bad = archive.testzip()
                    if bad:
                        raise ValueError(f'CRC failed: {bad}')
                    row['entries'] = len(archive.namelist())
                    row['containsTrace'] = any(n.endswith('.trace') for n in archive.namelist())
                row['validation'] = 'VALID_ZIP_CRC'
        except Exception as exc:
            row['validation'] = 'INVALID_OR_INCOMPLETE'
            row['error'] = str(exc)
        rows.append(row)

owner_checks = []
for manifest, base, pathkey in (
    (task / 'functional/EVIDENCE_MANIFEST.json', repo, 'path'),
    (task / 'visual/final-artifact-integrity-830f83d.json', task / 'visual', 'file'),
):
    manifest_raw = manifest.read_bytes()
    entries = json.loads(manifest_raw.decode('utf-8-sig'))['files']
    mismatches = []
    for entry in entries:
        p = base / entry[pathkey]
        if not p.is_file():
            mismatches.append({'file': entry[pathkey], 'reason': 'MISSING'})
            continue
        raw = p.read_bytes()
        if len(raw) != entry['bytes'] or hashlib.sha256(raw).hexdigest() != entry['sha256']:
            mismatches.append({'file': entry[pathkey], 'reason': 'SIZE_OR_SHA256_MISMATCH'})
    owner_checks.append({'manifest': manifest.relative_to(task).as_posix(),
                         'manifestSha256': hashlib.sha256(manifest_raw).hexdigest(),
                         'checkedFiles': len(entries), 'mismatches': mismatches})

result = {
    'observedAtUtc': datetime.now(timezone.utc).isoformat(),
    'candidateSourceSha': '830f83d48eac84c3e2467de7f41c388439cc7eb2',
    'candidateSourceTree': '65ac25d235682469452f60d50664b3e6acb3a753',
    'functionalFullMatrixBaselineSha': '76059cce616543356c623ec248c6350ddd07cdf5',
    'functionalBaselineNote': 'Full browser/Node matrix, axe-final and focus-final evidence retain their original 76059cc provenance; final 830f83d impact reruns are tablet-delta-final and tablet-delta-retest. An accepted file can still document a failed test execution.',
    'observedHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip(),
    'scope': 'Frozen visual/functional/implementation PNG, JSON, ZIP, TAP and LOG artifacts plus root command logs; excludes dynamic root Markdown, .tmp*, browser cache and output scratch. Historical entries retain original source chronology from their owner reports.',
    'acceptedFinalVisualNamespace': accepted_visual,
    'acceptedFinalFunctionalNamespaces': list(accepted_functional),
    'integrityIsNotQaPass': True,
    'historicalRunCompletionWarnings': [
        {'namespace': 'visual/after-830f83d/', 'runStatus': 'INCOMPLETE_ENVIRONMENT', 'reason': 'Owner report preserves bootstrap ERR_NETWORK_CHANGED/login timeout and tracing.stop ENOSPC. Existing valid files do not prove completed tracing/provenance; absent archives cannot be CRC-validated.'},
        {'namespace': 'visual/after-830f83d-recovery/', 'runStatus': 'INTERRUPTED', 'reason': 'First process-only scratch recovery was interrupted before accepted recovery. Preserve existing artifacts; not completed QA evidence.'},
    ],
    'files': rows,
    'ownerManifestChecks': owner_checks,
    'fileCount': len(rows),
    'invalidOrIncomplete': [r for r in rows if r['validation'] == 'INVALID_OR_INCOMPLETE'],
    'acceptedFinalInvalidOrIncomplete': [r for r in rows if r['category'] == 'accepted-final' and r['validation'] == 'INVALID_OR_INCOMPLETE'],
    'temporaryVisualDirectoryStillExists': (task / 'visual/.tmp-830f83d').exists(),
}
destination = task / 'release/final-artifact-integrity.json'
destination.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: result[k] for k in ('fileCount', 'temporaryVisualDirectoryStillExists')} | {
    'invalidOrIncompleteCount': len(result['invalidOrIncomplete']),
    'acceptedFinalInvalidOrIncompleteCount': len(result['acceptedFinalInvalidOrIncomplete'])}))
