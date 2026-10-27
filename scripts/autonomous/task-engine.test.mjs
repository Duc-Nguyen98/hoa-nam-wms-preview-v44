import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createTask, recordGate, transition, assess, evidenceFromFile, recordDefect, outputContract } from './task-engine.mjs';

const SHA = 'a'.repeat(40), NEXT = 'b'.repeat(40);
const actors = Object.fromEntries([1, 2, 3, 4, 5, 6].map(n => [n, { role: `S00#${n}`, sessionId: `session-${n}` }]));
const spec = () => ({ intakeKey: 'canary-badge-001', originalRequest: 'Check notification badge 0/1/9/10/99/100/999', target: 'Notification bell',
  repository: 'repository', baseBranch: 'DEV', baseSha: SHA, designAuthority: 'DESIGN_CONTRACT 1.2.0-recovery', priority: 'P1', references: [], constraints: ['No runtime edit if correct'], dependencies: [],
  acceptanceCriteria: ['Counts >=100 display 99+'], leases: [{ owner: 'S00#2', path: 'tests/canary/' }], gates: [
    { id: 'design', stage: 'design', required: true, reviewerRole: 'S00#6' },
    { id: 'functional', stage: 'qa', required: true, reviewerRole: 'S00#4' },
    { id: 'visual', stage: 'qa', required: true, reviewerRole: 'S00#3' },
    { id: 'ci', stage: 'ci', required: true, reviewerRole: 'S00#5' },
  ] });
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'hn-task-'));
  try { const path = join(dir, 'evidence.json'); writeFileSync(path, '{"actual":"test evidence"}\n'); return fn({ dir, path, evidence: [evidenceFromFile(path, SHA)] }); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}
const gate = (task, id, status, evidence) => recordGate(task, { id, status, candidateSha: task.candidateSha, evidence }, actors[{ design: 6, functional: 4, visual: 3, ci: 5 }[id]]);
function qaTask(evidence) {
  let task = createTask(spec(), actors[1]);
  task = transition(task, 'TRIAGED', actors[1], evidence);
  task = gate(task, 'design', 'PASS', evidence);
  task = transition(task, 'DESIGN_READY', actors[1], evidence);
  task = transition(task, 'IMPLEMENTING', actors[2], evidence);
  task = transition(task, 'READY_FOR_QA', actors[2], evidence);
  return transition(task, 'QA_RUNNING', actors[1], evidence);
}
test('intake IDs are unique and mandatory context is validated', () => {
  assert.notEqual(createTask(spec(), actors[1]).taskId, createTask(spec(), actors[1]).taskId);
  assert.throws(() => createTask({ ...spec(), baseSha: 'HEAD' }, actors[1]), /Exact base SHA/);
  assert.throws(() => createTask({ ...spec(), gates: [] }, actors[1]), /cannot be empty/);
});
test('ordered transitions and missing design gate fail closed', () => fixture(({ evidence }) => {
  const task = createTask(spec(), actors[1]);
  assert.throws(() => transition(task, 'COMPLETED', actors[1], evidence), /Invalid transition/);
  assert.throws(() => transition(transition(task, 'TRIAGED', actors[1], evidence), 'DESIGN_READY', actors[1], evidence), /Design gates blocked/);
}));
test('required FAIL, BLOCKED and NOT_RUN prevent QA PASS', () => fixture(({ evidence }) => {
  for (const status of ['FAIL', 'BLOCKED', 'NOT_RUN']) {
    let task = qaTask(evidence); task = gate(task, 'functional', status, evidence); task = gate(task, 'visual', 'PASS', evidence);
    assert.throws(() => transition(task, 'QA_PASS', actors[1], evidence), /Acceptance blocked/);
  }
}));
test('negative control rejects failed fixture gate and records recovery without erasing history', () => fixture(({ path, evidence }) => {
  let task = qaTask(evidence);
  task = gate(task, 'functional', 'FAIL', evidence);
  assert.equal(assess(task, 'qa').status, 'BLOCKED');
  task = transition(task, 'FIX_REQUIRED', actors[1], evidence);
  task = transition(task, 'IMPLEMENTING', actors[2], evidence);
  task = transition(task, 'READY_FOR_QA', actors[2], evidence);
  task = transition(task, 'QA_RUNNING', actors[1], evidence);
  task = gate(task, 'functional', 'PASS', evidence); task = gate(task, 'visual', 'PASS', evidence);
  task = transition(task, 'QA_PASS', actors[1], evidence);
  assert.ok(task.history.some(event => event.gate?.status === 'FAIL'));
  assert.equal(task.attempts, 1); assert.equal(task.state, 'QA_PASS');
  writeFileSync(path, 'changed'); assert.equal(assess(task, 'qa').status, 'BLOCKED');
}));
test('overlapping leases across owners are rejected', () => {
  assert.throws(() => createTask({ ...spec(), leases: [{ owner: 'S00#2', path: 'src/shared/**' }, { owner: 'S00#3', path: 'src/shared/badge.tsx' }] }, actors[1]), /Overlapping leases/);
});
test('candidate change invalidates old approval and requires newly hashed candidate evidence', () => fixture(({ path, evidence }) => {
  let task = qaTask(evidence); task = transition(task, 'FIX_REQUIRED', actors[1], evidence); task = transition(task, 'IMPLEMENTING', actors[2], evidence);
  task = transition(task, 'READY_FOR_QA', actors[2], evidence, { candidateSha: NEXT, changedFiles: ['tests/canary/check.mjs'] });
  assert.equal(task.gates.length, 0); assert.deepEqual(task.changedFiles, ['tests/canary/check.mjs']);
  assert.throws(() => gate(task, 'functional', 'PASS', evidence), /Evidence SHA mismatch/);
  assert.doesNotThrow(() => gate(task, 'functional', 'PASS', [evidenceFromFile(path, NEXT)]));
}));
test('independent reviewer, exact evidence and critical defect gates are enforced', () => fixture(({ evidence }) => {
  let task = qaTask(evidence);
  assert.throws(() => recordGate(task, { id: 'functional', status: 'PASS', candidateSha: SHA, evidence }, actors[2]), /ownership/);
  assert.throws(() => recordGate(task, { id: 'functional', status: 'PASS', candidateSha: SHA, evidence }, { ...actors[4], sessionId: actors[2].sessionId }), /self-approve/);
  task = recordDefect(task, { id: 'NC-001', severity: 'P1', owner: 'S00#2', status: 'OPEN', evidence }, actors[4]);
  assert.ok(assess(task).blockers.includes('NC-001:P1'));
  assert.throws(() => recordDefect(task, { id: 'NC-001', severity: 'P1', owner: 'S00#2', status: 'CLOSED', evidence }, actors[4]), /fix SHA/);
}));
test('completion requires all gates including CI and never grants FULL mode', () => fixture(({ evidence }) => {
  let task = qaTask(evidence); task = gate(task, 'functional', 'PASS', evidence); task = gate(task, 'visual', 'PASS', evidence);
  task = transition(task, 'QA_PASS', actors[1], evidence); task = transition(task, 'CI_VALIDATING', actors[1], evidence);
  assert.throws(() => transition(task, 'READY_FOR_REVIEW', actors[1], evidence), /ci:NOT_RUN/);
  task = gate(task, 'ci', 'PASS', evidence); task = transition(task, 'READY_FOR_REVIEW', actors[1], evidence); task = transition(task, 'COMPLETED', actors[1], evidence);
  assert.equal(outputContract(task).verdict, 'COMPLETED'); assert.equal(task.mode, 'CONTROLLED_AUTOMATION');
}));
test('CLI duplicate intake resumes same state and status exits nonzero for missing gates', () => fixture(({ dir }) => {
  const statePath = join(dir, 'task.json'), inputPath = join(dir, 'input.json');
  writeFileSync(inputPath, JSON.stringify({ spec: spec(), actor: actors[1] }));
  const cli = new URL('./task-cli.mjs', import.meta.url);
  const run = (...args) => spawnSync(process.execPath, [cli.pathname.replace(/^\/(\w:)/, '$1'), ...args], { encoding: 'utf8' });
  const first = run('create', statePath, inputPath), second = run('create', statePath, inputPath);
  assert.equal(first.status, 0, first.stderr); assert.equal(second.status, 0, second.stderr); assert.equal(first.stdout, second.stdout);
  assert.equal(run('status', statePath).status, 2);
}));
