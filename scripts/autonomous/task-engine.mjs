import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const STATES = Object.freeze({
  RECEIVED: ['TRIAGED'], TRIAGED: ['DESIGN_READY'], DESIGN_READY: ['IMPLEMENTING'],
  IMPLEMENTING: ['READY_FOR_QA'], READY_FOR_QA: ['QA_RUNNING'],
  QA_RUNNING: ['FIX_REQUIRED', 'QA_PASS'], FIX_REQUIRED: ['IMPLEMENTING'],
  QA_PASS: ['CI_VALIDATING'], CI_VALIDATING: ['READY_FOR_REVIEW'], READY_FOR_REVIEW: ['COMPLETED'],
});
const EXCEPTIONS = ['BLOCKED_DESIGN', 'BLOCKED_ENVIRONMENT', 'BLOCKED_PERMISSION', 'FAILED', 'CANCELLED'];
const SHA = /^[a-f0-9]{40}$/;
const ROLES = ['S00#1', 'S00#2', 'S00#3', 'S00#4', 'S00#5', 'S00#6'];
const GATE_RESULTS = ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'];
const hash = value => createHash('sha256').update(value).digest('hex');
const requireValue = (value, name) => { if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${name}`); };
const clone = value => structuredClone(value);
function actorCheck(actor) {
  if (!actor || !ROLES.includes(actor.role)) throw new Error('Unknown actor role');
  requireValue(actor.sessionId, 'actor sessionId');
}
function addEvent(task, kind, actor, details, now) {
  actorCheck(actor);
  const event = { sequence: task.history.length + 1, timestamp: now, kind, actor, ...details, previousHash: task.history.at(-1)?.hash ?? null };
  task.history.push({ ...event, hash: hash(JSON.stringify(event)) });
}
export function evidenceFromFile(path, candidateSha) {
  if (!SHA.test(candidateSha)) throw new Error('Evidence requires exact candidate SHA');
  return { path, sha256: hash(readFileSync(path)), candidateSha };
}
export function verifyEvidence(items, candidateSha) {
  if (!Array.isArray(items) || !items.length) throw new Error('Evidence is required');
  for (const item of items) {
    if (item.candidateSha !== candidateSha || !/^[a-f0-9]{64}$/.test(item.sha256 ?? '')) throw new Error('Evidence SHA mismatch');
    if (hash(readFileSync(item.path)) !== item.sha256) throw new Error(`Evidence content changed: ${item.path}`);
  }
}
export function createTask(spec, actor, now = new Date().toISOString()) {
  actorCheck(actor);
  if (actor.role !== 'S00#1') throw new Error('Intake belongs to S00#1');
  for (const field of ['intakeKey', 'originalRequest', 'target', 'repository', 'baseBranch', 'designAuthority', 'priority']) requireValue(spec[field], field);
  if (!SHA.test(spec.baseSha ?? '')) throw new Error('Exact base SHA required');
  for (const field of ['references', 'constraints', 'dependencies', 'acceptanceCriteria', 'gates', 'leases']) {
    if (!Array.isArray(spec[field])) throw new Error(`Missing array ${field}`);
  }
  if (!spec.acceptanceCriteria.length || !spec.gates.length) throw new Error('Acceptance criteria and required gates cannot be empty');
  if (new Set(spec.gates.map(g => g.id)).size !== spec.gates.length) throw new Error('Duplicate gate');
  for (const gate of spec.gates) {
    requireValue(gate.id, 'gate id');
    if (!ROLES.includes(gate.reviewerRole) || typeof gate.required !== 'boolean' || !['design', 'qa', 'ci'].includes(gate.stage)) throw new Error('Invalid gate reviewer/required/stage');
  }
  for (const stage of ['design', 'qa', 'ci']) if (!spec.gates.some(g => g.stage === stage && g.required)) throw new Error(`Missing required ${stage} gate`);
  for (const lease of spec.leases) {
    if (!ROLES.includes(lease.owner)) throw new Error('Invalid lease owner');
    requireValue(lease.path, 'lease path');
    if (/^(?:[A-Za-z]:|\/)|(?:^|[\\/])\.\.(?:[\\/]|$)/.test(lease.path)) throw new Error('Lease must be repository-relative');
  }
  const prefix = path => path.replaceAll('\\', '/').replace(/\*.*$/, '').replace(/\/$/, '').toLowerCase();
  for (const [index, lease] of spec.leases.entries()) for (const other of spec.leases.slice(index + 1)) {
    const a = prefix(lease.path), b = prefix(other.path);
    if (lease.owner !== other.owner && (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`))) throw new Error('Overlapping leases require serialization');
  }
  const task = { schemaVersion: 1, taskId: spec.taskId ?? `HN-TASK-${now.slice(0, 10).replaceAll('-', '')}-${randomUUID()}`,
    intakeKey: spec.intakeKey, intakeHash: hash(JSON.stringify(spec)), intake: clone(spec), state: 'RECEIVED',
    mode: 'CONTROLLED_AUTOMATION', candidateSha: spec.baseSha, implementationSessions: [], changedFiles: [], gates: [], defects: [], history: [], attempts: 0, maxFixAttempts: 3 };
  addEvent(task, 'RECEIVED', actor, { state: task.state }, now);
  return task;
}
export function recordGate(task, gate, actor, now = new Date().toISOString()) {
  actorCheck(actor);
  if (['COMPLETED', 'CANCELLED'].includes(task.state)) throw new Error('Terminal task');
  const definition = task.intake.gates.find(g => g.id === gate.id);
  if (!definition || actor.role !== definition.reviewerRole) throw new Error('Gate reviewer ownership violation');
  if (!GATE_RESULTS.includes(gate.status)) throw new Error('Invalid gate result');
  if (gate.candidateSha !== task.candidateSha) throw new Error('Stale gate candidate SHA');
  if (gate.status === 'PASS' && task.implementationSessions.includes(actor.sessionId)) throw new Error('Implementer cannot self-approve');
  verifyEvidence(gate.evidence, task.candidateSha);
  const next = clone(task);
  next.gates = next.gates.filter(g => g.id !== gate.id);
  next.gates.push({ ...clone(gate), reviewer: clone(actor), timestamp: now });
  addEvent(next, 'GATE_RECORDED', actor, { gate: clone(gate) }, now);
  return next;
}
export function assess(task, stage = 'all') {
  const definitions = task.intake.gates.filter(g => g.required && (stage === 'all' || g.stage === stage));
  const blockers = definitions.flatMap(def => {
    const gate = task.gates.find(g => g.id === def.id);
    if (!gate || gate.candidateSha !== task.candidateSha || gate.status !== 'PASS') return [`${def.id}:${gate?.status ?? 'NOT_RUN'}`];
    try { verifyEvidence(gate.evidence, task.candidateSha); } catch (error) { return [`${def.id}:INVALID_EVIDENCE:${error.message}`]; }
    return [];
  });
  blockers.push(...task.defects.filter(d => d.status !== 'CLOSED' && ['P0', 'P1'].includes(d.severity)).map(d => `${d.id}:${d.severity}`));
  return { status: blockers.length ? 'BLOCKED' : 'PASS', blockers, candidateSha: task.candidateSha };
}
export function transition(task, to, actor, evidence, options = {}, now = new Date().toISOString()) {
  actorCheck(actor);
  if (['COMPLETED', 'CANCELLED'].includes(task.state)) throw new Error('Terminal task');
  const resuming = task.state.startsWith('BLOCKED_') && to === task.resumeState;
  if (!resuming && !EXCEPTIONS.includes(to) && !STATES[task.state]?.includes(to)) throw new Error(`Invalid transition ${task.state} -> ${to}`);
  verifyEvidence(evidence, task.candidateSha);
  const next = clone(task);
  if (to.startsWith('BLOCKED_')) next.resumeState = task.state;
  if (resuming) delete next.resumeState;
  if (to === 'DESIGN_READY' && assess(task, 'design').status !== 'PASS') throw new Error('Design gates blocked');
  if (to === 'IMPLEMENTING') {
    if (actor.role !== 'S00#2') throw new Error('Implementation belongs to S00#2');
    if (task.state === 'FIX_REQUIRED' && task.attempts >= task.maxFixAttempts) throw new Error('Fix attempt limit reached');
    next.attempts += task.state === 'FIX_REQUIRED' ? 1 : 0;
    next.implementationSessions = [...new Set([...next.implementationSessions, actor.sessionId])];
  }
  if (options.candidateSha && options.candidateSha !== task.candidateSha) {
    if (to !== 'READY_FOR_QA' || !SHA.test(options.candidateSha)) throw new Error('Candidate changes only at READY_FOR_QA with exact SHA');
    next.candidateSha = options.candidateSha;
    next.gates = [];
  }
  if (options.changedFiles) {
    if (to !== 'READY_FOR_QA' || !Array.isArray(options.changedFiles)) throw new Error('Record changed files only at READY_FOR_QA');
    next.changedFiles = clone(options.changedFiles);
  }
  if (to === 'READY_FOR_QA') next.gates = next.gates.filter(g => task.intake.gates.find(def => def.id === g.id)?.stage === 'design');
  if (['QA_PASS', 'READY_FOR_REVIEW', 'COMPLETED'].includes(to)) {
    if (next.implementationSessions.includes(actor.sessionId)) throw new Error('Implementer cannot approve own task');
    const stage = to === 'QA_PASS' ? 'qa' : 'all';
    const result = assess(next, stage);
    if (result.status !== 'PASS') throw new Error(`Acceptance blocked: ${result.blockers.join(', ')}`);
  }
  if (to === 'COMPLETED' && actor.role !== 'S00#1') throw new Error('Completion belongs to S00#1');
  next.state = to;
  addEvent(next, 'STATE_CHANGED', actor, { from: task.state, to, candidateSha: next.candidateSha, evidence }, now);
  return next;
}
export function recordDefect(task, defect, actor, now = new Date().toISOString()) {
  actorCheck(actor);
  if (['COMPLETED', 'CANCELLED'].includes(task.state)) throw new Error('Terminal task');
  if (!['S00#3', 'S00#4', 'S00#5', 'S00#6'].includes(actor.role)) throw new Error('Defect evidence belongs to independent reviewer');
  requireValue(defect.id, 'defect id');
  requireValue(defect.owner, 'defect owner');
  if (!['P0', 'P1', 'P2', 'P3'].includes(defect.severity) || !['OPEN', 'CLOSED'].includes(defect.status)) throw new Error('Invalid defect severity/status');
  verifyEvidence(defect.evidence, task.candidateSha);
  if (defect.status === 'CLOSED' && (!SHA.test(defect.fixSha ?? '') || defect.fixSha !== task.candidateSha)) throw new Error('Closing defect requires tested fix SHA');
  const next = clone(task);
  next.defects = [...next.defects.filter(d => d.id !== defect.id), clone(defect)];
  addEvent(next, 'DEFECT_RECORDED', actor, { defect: clone(defect) }, now);
  return next;
}
export function outputContract(task) {
  return { taskId: task.taskId, summary: task.intake.originalRequest, target: task.intake.target, mode: task.mode, state: task.state,
    agents: [...new Map(task.history.map(event => [event.actor.sessionId, event.actor])).values()],
    candidateSha: task.candidateSha, changedFiles: task.changedFiles, leasedScopes: task.intake.leases, references: task.intake.references,
    gates: task.gates, defects: task.defects, preview: task.intake.preview ?? { status: 'NOT_VERIFIED' },
    verdict: task.state === 'COMPLETED' && assess(task).status === 'PASS' ? 'COMPLETED' : assess(task).status === 'PASS' ? 'PARTIAL' : 'BLOCKED' };
}
