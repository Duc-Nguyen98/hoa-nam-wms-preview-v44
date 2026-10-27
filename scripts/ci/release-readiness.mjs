import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const requiredGates = ['typecheck','build','contract','unit','criticalE2E','visual','responsive','console','accessibility','ci'];
export async function evaluateReceipt(receipt, candidate, root) {
  const reasons = [];
  const check = (condition, reason) => { if (!condition) reasons.push(reason); };
  check(/^[a-f0-9]{40}$/.test(candidate ?? ''), 'Candidate must be a full commit SHA');
  if (!receipt || typeof receipt !== 'object') return {status:'BLOCKED', reasons:[...reasons,'QA receipt MISSING']};
  check(receipt.commit === candidate, 'Receipt commit differs from candidate');
  for (const name of requiredGates) {
    const gate = receipt.gates?.[name];
    check(gate?.status === 'PASS', `${name}: MISSING or not PASS`);
    check(gate?.commit === candidate, `${name}: stale or missing commit`);
    check(Array.isArray(gate?.artifacts) && gate.artifacts.length > 0, `${name}: artifacts MISSING`);
    for (const artifact of Array.isArray(gate?.artifacts) ? gate.artifacts : []) {
      try {
        const relative = artifact.path;
        if (typeof relative !== 'string' || !relative || /[\\:]/.test(relative) || path.posix.isAbsolute(relative) || relative.split('/').includes('..')) throw Error('unsafe path');
        const absolute = await fs.realpath(path.resolve(root, relative));
        const base = await fs.realpath(root);
        const inside = path.relative(base, absolute);
        if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) throw Error('outside evidence root');
        const digest = createHash('sha256').update(await fs.readFile(absolute)).digest('hex');
        if (!/^[a-f0-9]{64}$/.test(artifact.sha256 ?? '') || digest !== artifact.sha256) throw Error('checksum mismatch');
      } catch (error) { reasons.push(`${name}: invalid artifact (${error.message})`); }
    }
  }
  check(receipt.openP0 === 0 && receipt.openP1 === 0, 'P0/P1 defects unresolved or counts MISSING');
  check(typeof receipt.designChanged === 'boolean', 'Design change declaration MISSING');
  for (const owner of ['S00#1','S00#3','S00#4', ...(receipt.designChanged ? ['S00#6'] : [])]) {
    const approval = receipt.approvals?.[owner];
    check(approval?.status === 'APPROVED' && approval.commit === candidate && typeof approval.reference === 'string' && approval.reference.trim().length > 0, `${owner}: current-commit approval MISSING`);
  }
  return {status:reasons.length ? 'BLOCKED' : 'EVIDENCE_STRUCTURALLY_VALID', reasons};
}

async function main() {
  const root = process.cwd();
  const receiptPath = path.resolve(root, 'docs/release-governance/release-evidence.json');
  let receipt;
  try { receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') console.error('QA receipt unreadable or invalid JSON'); }
  const evaluated = await evaluateReceipt(receipt, process.env.CANDIDATE_SHA, root);
  // A file supplied by a PR cannot authenticate its own reviewer approvals.
  // Keep release blocked until a trusted, separately reviewed evidence transport exists.
  const result = {...evaluated, structuralStatus:evaluated.status, status:'BLOCKED', candidate:process.env.CANDIDATE_SHA ?? null,
    reasons:[...evaluated.reasons,'Authenticated QA approval/evidence integration MISSING; verify actual PR reviews, required checks, conflicts and S00#1 readiness'], checkedAt:new Date().toISOString()};
  await fs.mkdir('output/ci', {recursive:true});
  await fs.writeFile('output/ci/release-readiness.json', JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
