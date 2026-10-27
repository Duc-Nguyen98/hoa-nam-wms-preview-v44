"""Read frozen evidence; validate bytes and formats without changing owner files."""
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter
import argparse, hashlib, json, subprocess, zipfile
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--scope', choices=('partial', 'final'), default='partial')
parser.add_argument('--output', required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[4]
task = repo / 'docs/quality/uiux-task-HN-S01-004'

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def git(*parts):
    return subprocess.check_output(['git', *parts], cwd=repo, text=True).strip()

def inspect(path):
    raw = path.read_bytes()
    row = {'path': path.relative_to(task).as_posix(), 'bytes': len(raw), 'sha256': digest(raw), 'validation': 'HASHED'}
    try:
        ext = path.suffix.lower()
        if ext == '.png':
            with Image.open(path) as im:
                row['dimensions'] = list(im.size)
                im.verify()
            with Image.open(path) as im:
                im.load()
            row['validation'] = 'VALID_PNG_DECODED'
        elif ext == '.json':
            json.loads(raw.decode('utf-8-sig'))
            row['validation'] = 'VALID_JSON'
        elif ext == '.zip':
            with zipfile.ZipFile(path) as archive:
                bad = archive.testzip()
                if bad:
                    raise ValueError('CRC failed: '+bad)
                row['zipEntries'] = len(archive.namelist())
                row['containsTrace'] = any(n.endswith('.trace') for n in archive.namelist())
            row['validation'] = 'VALID_ZIP_CRC'
    except Exception as exc:
        row['validation'] = 'INVALID_OR_INCOMPLETE'
        row['error'] = str(exc)
    return row

groups = ['visual', 'implementation'] + (['functional', 'integration'] if args.scope == 'final' else [])
paths = [p for group in groups for p in (task/group).rglob('*') if p.is_file()]
paths += [task/'IMPLEMENTATION_REPORT.md']
if args.scope == 'final':
    paths += [p for p in task.glob('*') if p.is_file() and p.suffix.lower() in ('.json', '.log', '.tap')]
    paths += [task/name for name in ('DATA_SCENARIO.md', 'DATA_CONSISTENCY_MATRIX.md', 'FUNCTIONAL_QA_REPORT.md', 'DESIGN_ACCEPTANCE_MATRIX.md', 'DESIGN_GAP_REPORT.md', 'VISUAL_QA_REPORT.md')]
paths = sorted(set(paths))
rows = [inspect(p) for p in paths]

owner_checks = []
for name in ('artifact-manifest.json', 'f56e25c-manifest.json'):
    path = task/'visual'/name
    manifest = json.loads(path.read_text(encoding='utf-8-sig'))
    mismatches = []
    for entry in manifest['files']:
        p = task/'visual'/entry['path']
        if not p.is_file():
            mismatches.append({'path': entry['path'], 'reason': 'MISSING'})
            continue
        raw = p.read_bytes()
        if len(raw) != entry['bytes'] or digest(raw) != entry['sha256']:
            mismatches.append({'path': entry['path'], 'reason': 'SIZE_OR_SHA256_MISMATCH'})
    owner_checks.append({'manifest': 'visual/'+name, 'manifestSha256': digest(path.read_bytes()), 'checkedFiles': len(manifest['files']), 'mismatches': mismatches})

protected = []
for entry in json.loads((task/'PROTECTED_SOURCE_BEFORE.json').read_text(encoding='utf-8-sig')):
    actual = digest((repo/entry['path']).read_bytes())
    protected.append({**entry, 'actualSha256': actual, 'matches': actual == entry['sha256']})
references = []
for name in ('3.png', '4.png', '5.png', '6.png'):
    locations = {'original': Path('C:/Users/Admin/Desktop/HN_Astra')/name, 'custody': repo/'docs/quality/references/hn-astra-20261027'/name, 'visualCopy': task/'visual/references'/name}
    hashes = {key: digest(path.read_bytes()) for key, path in locations.items()}
    references.append({'name': name, 'hashes': hashes, 'matches': len(set(hashes.values())) == 1})
screen_sets = []
for state, before, after in (
    ('DashboardDesktop', 'desktop-dashboard.png', 'desktop-dashboard.png'),
    ('DashboardTablet', 'tablet-dashboard.png', 'tablet-dashboard.png'),
    ('PX0007Desktop', 'desktop-px0007.png', 'desktop-px0007.png'),
    ('PX0007Tablet', 'tablet-px0007.png', 'tablet-px0007.png'),
):
    prefix = {'DashboardDesktop':'dashboard-desktop', 'DashboardTablet':'dashboard-tablet', 'PX0007Desktop':'px0007-desktop', 'PX0007Tablet':'px0007-tablet'}[state]
    mapping = {'before': 'visual/before/'+before, 'after': 'visual/e18305b-normal/'+after,
               'reference': 'visual/references/'+{'DashboardDesktop':'3.png','DashboardTablet':'4.png','PX0007Desktop':'5.png','PX0007Tablet':'6.png'}[state],
               'diff': 'visual/comparison-e18305b/'+prefix+'-diff-3x.png',
               'comparisonActual': 'visual/comparison-e18305b/'+prefix+'-actual-aligned.png',
               'comparisonReference': 'visual/comparison-e18305b/'+prefix+'-reference-crop.png'}
    screen_sets.append({'state': state, 'files': mapping, 'allPresent': all((task/p).is_file() for p in mapping.values()),
                        'scenarioNote': 'Normal AFTER source fixture page10/pending5 differs from isolated comparison input; dashboard comparison QA_SYNTHETIC page4/pending3, modal comparison source-preserving page4/pending5. See comparison-metadata.json for transforms; file presence does not certify fidelity.'})
result = {
    'observedAtUtc': datetime.now(timezone.utc).isoformat(), 'scope': args.scope,
    'freezeStatement': 'Visual and implementation frozen; functional/root reports not yet frozen' if args.scope == 'partial' else 'Final scope explicitly frozen by S00#1',
    'head': git('rev-parse', 'HEAD'), 'srcTree': git('rev-parse', 'HEAD:src'), 'testsTree': git('rev-parse', 'HEAD:tests'),
    'sourceStatus': git('status', '--short', '--', 'src', 'tests'),
    'integrityIsNotQaPass': True, 'allHistoricalAttemptsRetained': True,
    'groups': groups, 'fileCount': len(rows), 'totalBytes': sum(r['bytes'] for r in rows),
    'excludedMutableRootReports': ['AGENT_TRACE.md', 'DEFECT_REGISTER.md', 'REGRESSION_REPORT.md', 'FINAL_REPORT.md', 'EVIDENCE_INDEX.md', 'CI_RELEASE_REPORT.md'],
    'otherExclusions': ['release/** (auditor scripts/receipts)', '.gitattributes', 'verify-candidate.ps1', 'task packet outside quality directory'],
    'validationCounts': dict(Counter(r['validation'] for r in rows)),
    'invalidOrIncomplete': [r for r in rows if r['validation'] == 'INVALID_OR_INCOMPLETE'],
    'ownerManifestChecks': owner_checks, 'protectedBytes': protected, 'referenceChecks': references, 'fourStateEvidenceCompleteness': screen_sets, 'files': rows,
}
(task/'release'/args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({key: result[key] for key in ('scope', 'head', 'fileCount', 'totalBytes', 'validationCounts')} | {'invalidCount': len(result['invalidOrIncomplete']), 'ownerMismatchCount': sum(len(c['mismatches']) for c in owner_checks), 'protectedMismatchCount': sum(not p['matches'] for p in protected), 'referenceMismatchCount': sum(not p['matches'] for p in references)}))
