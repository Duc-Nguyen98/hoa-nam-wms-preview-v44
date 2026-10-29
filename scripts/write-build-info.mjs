import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const inventory = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (!filename.endsWith('build-info.json')) inventory.push({
      path: filename.split(String.fromCharCode(92)).join('/').replace(/^dist[/]/, ''),
      sha256: createHash('sha256').update(fs.readFileSync(filename)).digest('hex'),
      bytes: fs.statSync(filename).size,
    });
  }
}
walk('dist');
inventory.sort((a, b) => a.path.localeCompare(b.path, 'en'));
const source = JSON.parse(fs.readFileSync('SOURCE_PROVENANCE.json'));
// The import manifest identifies historical source, not this build's revision.
// Archive builders without Git must provide the exact source SHA explicitly.
let sourceCommit = process.env.HN_BUILD_SOURCE_SHA?.trim() || null;
let sourceCommitEvidence = sourceCommit ? 'build-environment' : 'unverified';
if (sourceCommit && !/^[a-f0-9]{40}$/i.test(sourceCommit)) throw new Error('HN_BUILD_SOURCE_SHA must be a full commit SHA.');
if (!sourceCommit) {
  try {
    sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    sourceCommitEvidence = 'git-head';
  } catch { /* An archive without Git has no verified revision by default. */ }
}
const info = {
  release: source.version,
  sourceCommit,
  sourceCommitEvidence,
  importedSourceCommit: source.sourceCommit,
  baseBuildId: source.baseBuildId,
  buildId: createHash('sha256').update(inventory.map(f => f.path + String.fromCharCode(0) + f.sha256 + String.fromCharCode(10)).join('')).digest('hex'),
  mode: 'MOCK', publicDemo: true, assets: inventory,
};
fs.writeFileSync('dist/build-info.json', JSON.stringify(info, null, 2));
console.log(JSON.stringify({ release: info.release, sourceCommit, sourceCommitEvidence, buildId: info.buildId, assets: inventory.length }));
