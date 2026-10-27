import assert from 'node:assert/strict';
import test from 'node:test';
import { auditFixture } from './s27/fixture';
import { createCommitSnapshot, type CommitSnapshotData } from '../src/preview-mock/business-atomic';
import { canonicalBusinessJson, type BusinessRecord } from '../src/preview-mock/business-repository';
import { createOperationalAuditReader, currentAuditPeriod, projectOperationalAudit } from '../src/features/S27/audit-operational-binding';
import { getBusinessDateWindow } from '../src/shared/date-policy';

const period = { from: '2026-10-25', to: '2026-10-25' }, asOf = '2026-10-27T08:00:00.000Z';
const project = (source: ReturnType<typeof auditFixture>) => projectOperationalAudit(source, { ...period, asOf });

/** Isolated canonical batch: two entity audits and a command audit share one proof. */
function batchFixture() {
  const source = auditFixture(3), template = source.stockEvents[0];
  const commandId = 'qa-batch-command', commitSnapshotId = 'commit-snapshot:qa-batch';
  const meta = source.scenario!.data, changed: BusinessRecord[] = [], batchAudits: BusinessRecord[] = [];
  for (const suffix of ['a', 'b']) {
    const entityId = `putaway:qa-${suffix}`, receiptId = `receipt:qa-${suffix}`, eventId = `stock-event:qa-${suffix}`;
    const receipt = { ...structuredClone(source.receipts[0]), id: receiptId, version: 1 };
    receipt.data.postedEventIds = [eventId];
    const event = { ...structuredClone(template), id: eventId, data: { ...template.data, actor: 'preview:ducquang', commandId, commitSnapshotId, documentId: receiptId } };
    const entity = { id: entityId, kind: 'putaway', version: 1, data: { ...meta, boxId: `box:${suffix}`, receiptId, capturedBoxVersion: 1, capturedContentRevision: 1, quantityAtCreate: 1, status: 'DRAFT' as const, trayId: null, cancellationReason: null } };
    const audit = { id: `audit:qa-${suffix}`, kind: 'audit-event', version: 1, data: { ...meta, actor: 'preview:ducquang', action: 'putaway.create', entityId, commandId, sourceSurface: 'WEB', timestamp: template.data.committedAt, commitSnapshotId, previousVersion: null, newVersion: 1, FK: [receiptId, eventId], eventIds: [eventId] } };
    source.receipts.push(receipt); source.stockEvents.push(event); source.putaways.push(entity); batchAudits.push(audit);
    changed.push(receipt, event, entity, audit);
  }
  const audit = structuredClone(batchAudits[0]);
  audit.id = 'audit:qa-batch';
  Object.assign(audit.data as object, { action: 'scenario.seed-approved', sourceSurface: 'QA', FK: changed.map(record => record.id), eventIds: source.stockEvents.slice(-2).map(event => event.id) });
  changed.push(audit); source.auditEvents.push(...batchAudits, audit);
  source.commitSnapshots.push(createCommitSnapshot({ id: commitSnapshotId, epoch: source.epoch, revision: 5, commandId, actorKey: 'preview:ducquang', committedAt: template.data.committedAt }, [], changed));
  source.snapshotRevision = source.token.revision = 5;
  return source;
}

function auditData(source: ReturnType<typeof batchFixture>) {
  return source.auditEvents.find(record => record.id === 'audit:qa-a')!.data as { eventIds: string[]; FK: string[]; [key: string]: unknown };
}
/** Retain a self-consistent canonical audit to exercise S27 relationship checks. */
function recanonicalize(source: ReturnType<typeof batchFixture>, id = 'audit:qa-a') {
  const record = [...source.auditEvents, ...source.stockEvents].find(row => row.id === id)!;
  const proof = source.commitSnapshots.at(-1)!.data as CommitSnapshotData;
  proof.changes.find(change => change.entityId === id)!.canonicalRecord = canonicalBusinessJson(record);
}
const rejectsIntegrity = (source: ReturnType<typeof batchFixture>) => assert.throws(() => project(source), (error: unknown) => (error as { code: string }).code === 'INCOMPLETE_AUDIT_RELATIONSHIP');

test('canonical batch accepts complete per-entity subsets and command-wide relationships without mutating source', () => {
  const source = batchFixture(), before = JSON.stringify(source), model = project(source);
  assert.equal(model.rows.length, 6);
  assert.deepEqual(model.rows.find(row => row.id === 'audit:qa-a')!.eventIds, ['stock-event:qa-a']);
  assert.deepEqual(model.rows.find(row => row.id === 'audit:qa-b')!.eventIds, ['stock-event:qa-b']);
  assert.deepEqual(model.rows.find(row => row.id === 'audit:qa-batch')!.eventIds, ['stock-event:qa-a', 'stock-event:qa-b']);
  assert.equal(JSON.stringify(source), before);
  assert.ok(Object.isFrozen(model.rows[3].eventIds));
});

test('self-consistent canonical audit cannot omit, duplicate, invent or borrow an unrelated event', () => {
  for (const eventIds of [[], ['stock-event:qa-a', 'stock-event:qa-a'], ['stock-event:missing'], ['stock-event:qa-b'], ['stock-event:qa-a', 'stock-event:qa-b']]) {
    const source = batchFixture(); auditData(source).eventIds = eventIds; recanonicalize(source); rejectsIntegrity(source);
  }
  const source = batchFixture(); auditData(source).eventIds = [source.stockEvents[0].id]; recanonicalize(source); rejectsIntegrity(source);
});

test('proof event enumeration and per-audit linkage remain complete', () => {
  for (const mutation of ['missing-event', 'duplicate-event', 'foreign-event', 'missing-link'] as const) {
    const source = batchFixture(), proof = source.commitSnapshots.at(-1)!.data as CommitSnapshotData;
    if (mutation === 'missing-event') proof.eventIds.pop();
    if (mutation === 'duplicate-event') proof.eventIds[1] = proof.eventIds[0];
    if (mutation === 'foreign-event') proof.eventIds[1] = source.stockEvents[0].id;
    if (mutation === 'missing-link') { auditData(source).FK = []; recanonicalize(source); }
    rejectsIntegrity(source);
  }
});

test('canonical source gate still rejects tampered action, surface and event relationships', () => {
  for (const [field, value] of [['action', 'putaway.cancel'], ['sourceSurface', 'QA'], ['eventIds', []]] as const) {
    const source = batchFixture(); (auditData(source) as Record<string, unknown>)[field] = value;
    assert.throws(() => project(source), (error: unknown) => (error as { code: string }).code === 'INCOMPLETE_POPULATION');
  }
});

test('actor, command, time, entity, versions, scope and FK checks reject canonical relationship mismatches', () => {
  for (const [field, value] of [['actor', 'preview:other'], ['commandId', 'other'], ['timestamp', '2026-10-25T08:00:00.000Z'], ['entityId', 'putaway:missing'], ['previousVersion', 1], ['newVersion', 2], ['scenarioId', 'scenario:other'], ['generation', 2], ['FK', ['unknown']]] as const) {
    const source = batchFixture(); (auditData(source) as Record<string, unknown>)[field] = value; recanonicalize(source); rejectsIntegrity(source);
  }
  for (const field of ['actor', 'commandId', 'committedAt', 'commitSnapshotId', 'scenarioId', 'generation']) {
    const source = batchFixture(), event = source.stockEvents.find(row => row.id === 'stock-event:qa-a')!;
    (event.data as unknown as Record<string, unknown>)[field] = field === 'generation' ? 2 : 'wrong';
    recanonicalize(source, event.id);
    assert.throws(() => project(source));
  }
});

test('Vietnam current date matches DatePicker policy at midnight; reload preserves a chosen historical period', async () => {
  for (const timestamp of ['2026-10-25T16:59:59.999Z', '2026-10-25T17:00:00.000Z', '2026-10-27T00:00:00.000Z']) {
    const today = getBusinessDateWindow({ now: new Date(timestamp) }).today;
    assert.deepEqual(currentAuditPeriod(timestamp), { from: today, to: today });
  }
  const reader = createOperationalAuditReader({ available: true, read: async () => auditFixture() }, () => asOf);
  await reader.resume(); assert.deepEqual(reader.getSnapshot().period, { from: '2026-10-27', to: '2026-10-27' });
  assert.equal(reader.getSnapshot().model!.rows.length, 0);
  await reader.load(period); await reader.load();
  assert.deepEqual(reader.getSnapshot().period, period); assert.equal(reader.getSnapshot().model!.rows.length, 3);
});
