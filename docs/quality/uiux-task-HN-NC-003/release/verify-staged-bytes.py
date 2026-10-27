"""Compare actual index blob object IDs to raw workspace bytes (no text conversion)."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, subprocess

repo = Path(__file__).resolve().parents[4]
task = repo / 'docs/quality/uiux-task-HN-NC-003'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=repo)
staged = [x.decode('utf-8') for x in git('diff', '--cached', '--name-only', '-z').split(b'\0') if x]
index = {}
for record in git('ls-files', '--stage', '-z').split(b'\0'):
    if not record:
        continue
    metadata, filename = record.split(b'\t', 1)
    mode, sha, stage = metadata.decode('ascii').split()
    index[filename.decode('utf-8')] = (mode, sha, stage)
rows = []
outside = []
for filename in staged:
    if filename != 'docs/agent-handoffs/HN-NC-UIUX-003.md' and not filename.startswith('docs/quality/uiux-task-HN-NC-003/'):
        outside.append(filename)
    raw = (repo / filename).read_bytes()
    calculated = hashlib.sha1(b'blob ' + str(len(raw)).encode('ascii') + b'\0' + raw).hexdigest()
    mode, staged_sha, stage = index[filename]
    rows.append({'file': filename, 'bytes': len(raw), 'indexBlobSha1': staged_sha,
                 'rawWorkspaceBlobSha1': calculated, 'identical': staged_sha == calculated,
                 'indexStage': stage, 'mode': mode})
result = {'observedAtUtc': datetime.now(timezone.utc).isoformat(),
          'head': git('rev-parse', 'HEAD').decode().strip(),
          'sourceTree': git('rev-parse', 'HEAD:src').decode().strip(),
          'method': 'For each staged path, compare git index object ID with SHA1(blob + space + raw byte length + NUL + exact workspace bytes); no clean filter/text conversion.',
          'scopeNote': 'Snapshot before this report and its checker were staged; root must stage final leased outputs before committing.',
          'stagedFileCount': len(rows), 'outsideTaskPaths': outside,
          'scratchPaths': [p for p in staged if '/.tmp' in p or 'browser-cache' in p or p.startswith('output/')],
          'mismatches': [r for r in rows if not r['identical'] or r['indexStage'] != '0'],
          'files': rows}
output = task / 'release/staged-byte-integrity.json'
output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: result[k] for k in ('stagedFileCount', 'outsideTaskPaths', 'scratchPaths')} | {'mismatchCount': len(result['mismatches'])}))
