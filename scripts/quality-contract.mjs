import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'output', 'tray-approved', 'reference', 'reference-manifest.json');
const contractPath = path.join(root, 'DESIGN_CONTRACT.md');
const gapsPath = path.join(root, 'GAP_REGISTER.md');

const fail = (message) => { console.error(`QUALITY_CONTRACT_FAIL: ${message}`); process.exitCode = 1; };
for (const file of [manifestPath, contractPath, gapsPath]) {
  if (!fs.existsSync(file)) fail(`missing ${path.relative(root, file)}`);
}
if (process.exitCode) process.exit();

let manifest;
try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
catch (error) { fail(`invalid manifest JSON: ${error.message}`); process.exit(); }

if (manifest.version !== 1 || manifest.approval?.sourceImagesImmutable !== true) {
  fail('manifest version/immutability policy is invalid');
}
if (manifest.profiles?.desktop?.cssWidth !== 1920 || manifest.profiles?.tablet?.cssWidth !== 800) {
  fail('locked viewport profiles are missing or changed');
}
if (!Array.isArray(manifest.states) || manifest.states.length !== 13) {
  fail(`expected 13 reference states, found ${manifest.states?.length ?? 0}`);
}

const ids = new Set();
for (const state of manifest.states ?? []) {
  if (ids.has(state.id)) fail(`duplicate state id ${state.id}`);
  ids.add(state.id);
  for (const profile of ['desktop', 'tablet']) {
    const source = path.join(root, 'output', 'tray-approved', 'reference', state[profile]);
    if (!fs.existsSync(source)) fail(`missing ${profile} reference for state ${state.id}: ${state[profile]}`);
  }
  if (!state.route || !state.owner) fail(`state ${state.id} lacks route or owner`);
}

const forbiddenPathFiles = [
  'playwright.notification.config.ts',
  'playwright.notification-independent.config.ts',
  'tests/visual/notification.spec.ts',
  'tests/visual/notification-independent.spec.ts',
  'tests/visual/compare-reference.py',
];
for (const relative of forbiddenPathFiles) {
  const content = fs.readFileSync(path.join(root, relative), 'utf8');
  if (/\b[Ww]:[\\/]/.test(content)) fail(`${relative} contains a machine-specific W: output path`);
}

if (!process.exitCode) {
  console.log(`QUALITY_CONTRACT_PASS: ${manifest.states.length} states, ${manifest.states.length * 2} references, immutable source policy`);
}
