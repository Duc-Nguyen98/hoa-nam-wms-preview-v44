import type { BusinessRecord, BusinessReceipt } from './business-repository';
import { canonicalBusinessJson } from './business-repository';
import { PreviewHttpError } from './errors';

/** Internal policy output, never accepted from an HTTP command payload. */
export interface DependentRecordWrite {
  id: string; kind: string; expectedVersion: number | null; data: unknown;
}
export interface CommitSnapshotData {
  id: string; epoch: string; revision: number; commandId: string; actorKey: string; committedAt: string;
  changes: { entityId: string; previousVersion: number | null; version: number; canonicalRecord: string }[];
  eventIds: string[]; auditIds: string[];
}
const fail = (code: string, status = 409): never => { throw new PreviewHttpError(status, code, 'Giao dịch chưa thể hoàn tất.'); };
const immutableKinds = new Set(['stock-event', 'audit-event', 'commit-snapshot', 'physical-registry', 'app-submission', 'scan-observation', 'case-event', 'evidence-attachment']);

/** Validate the complete plan before the repository publishes any of it. */
export function planDependentRecords(records: readonly BusinessRecord[], primaryId: string, writes: readonly DependentRecordWrite[]): BusinessRecord[] {
  if (!Array.isArray(writes)) return fail('MOCK_COMMAND_FAILED', 500);
  const ids = new Set([primaryId]);
  return writes.map(write => {
    if (!write || typeof write.id !== 'string' || !write.id || typeof write.kind !== 'string' || !write.kind
      || ids.has(write.id) || write.kind === 'commit-snapshot') return fail('INVALID_DEPENDENT_WRITE', 500);
    ids.add(write.id);
    const current = records.find(record => record.id === write.id);
    if (write.expectedVersion === null) {
      if (current) return fail('DUPLICATE_ENTITY');
    } else {
      if (!Number.isSafeInteger(write.expectedVersion) || Number(write.expectedVersion) < 1) return fail('INVALID_DEPENDENT_WRITE', 500);
      if (!current || current.kind !== write.kind) return fail('NOT_FOUND', 404);
      if (current.version !== write.expectedVersion) return fail('STALE_DEPENDENT_VERSION');
      if (immutableKinds.has(current.kind)) return fail('IMMUTABLE_EVENT');
      if (current.version >= Number.MAX_SAFE_INTEGER) return fail('MOCK_STATE_INVALID', 503);
    }
    canonicalBusinessJson(write.data);
    return { id: write.id, kind: write.kind, version: current ? current.version + 1 : 1, data: structuredClone(write.data) };
  });
}

export function createCommitSnapshot(input: Omit<CommitSnapshotData, 'changes' | 'eventIds' | 'auditIds'>, before: readonly BusinessRecord[], changed: readonly BusinessRecord[]): BusinessRecord {
  if (before.some(record => record.id === input.id) || changed.some(record => record.id === input.id)) return fail('DUPLICATE_ENTITY');
  const data: CommitSnapshotData = { ...input,
    changes: changed.map(record => ({ entityId: record.id, previousVersion: before.find(old => old.id === record.id)?.version ?? null,
      version: record.version, canonicalRecord: canonicalBusinessJson(record) })),
    eventIds: changed.filter(record => record.kind === 'stock-event').map(record => record.id),
    auditIds: changed.filter(record => record.kind === 'audit-event').map(record => record.id),
  };
  return { id: input.id, kind: 'commit-snapshot', version: 1, data };
}

/** Revalidate retained commit evidence independently of today's handler registry. */
export function validateCommitSnapshot(records: readonly BusinessRecord[], receipt: BusinessReceipt): void {
  const snapshot = records.find(record => record.id === receipt.commitSnapshotId);
  if (!snapshot || snapshot.kind !== 'commit-snapshot' || snapshot.version !== 1) return fail('MOCK_STATE_INVALID', 503);
  const data = snapshot.data as CommitSnapshotData;
  if (!data || data.id !== snapshot.id || data.epoch !== receipt.epoch || data.commandId !== receipt.commandId
    || data.actorKey !== receipt.actorKey || data.revision !== receipt.snapshotRevision || data.committedAt !== receipt.committedAt
    || !Array.isArray(data.changes) || !data.changes.length || !Array.isArray(data.eventIds) || !Array.isArray(data.auditIds)) return fail('MOCK_STATE_INVALID', 503);
  const ids = new Set<string>(), events: string[] = [], audits: string[] = [];
  for (const change of data.changes) {
    const proof = JSON.parse(change.canonicalRecord) as BusinessRecord;
    const current = records.find(record => record.id === change.entityId);
    if (ids.has(change.entityId) || proof.id !== change.entityId || proof.version !== change.version
      || canonicalBusinessJson(proof) !== change.canonicalRecord || !current || current.kind !== proof.kind
      || current.version < proof.version || ((current.version === proof.version || immutableKinds.has(proof.kind)) && canonicalBusinessJson(current) !== change.canonicalRecord)
      || (change.previousVersion === null ? proof.version !== 1 : !Number.isSafeInteger(change.previousVersion) || change.previousVersion < 1 || proof.version !== change.previousVersion + 1)) return fail('MOCK_STATE_INVALID', 503);
    ids.add(change.entityId);
    if (proof.kind === 'stock-event') events.push(proof.id);
    if (proof.kind === 'audit-event') audits.push(proof.id);
    if (['stock-event','audit-event'].includes(proof.kind) && (proof.data as {commitSnapshotId?: string})?.commitSnapshotId !== snapshot.id) return fail('MOCK_STATE_INVALID', 503);
    if (change.entityId === receipt.entityId && canonicalBusinessJson(proof) !== canonicalBusinessJson(receipt.record)) return fail('MOCK_STATE_INVALID', 503);
  }
  if (!ids.has(receipt.entityId) || canonicalBusinessJson(events) !== canonicalBusinessJson(data.eventIds)
    || canonicalBusinessJson(audits) !== canonicalBusinessJson(data.auditIds)) return fail('MOCK_STATE_INVALID', 503);
}
