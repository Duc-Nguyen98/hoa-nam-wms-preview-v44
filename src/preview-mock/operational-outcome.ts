import type { OperationalCommand, OperationalOutcome, OperationalSnapshot } from '../contracts/operational-preview';
import type { CatalogSnapshot } from '../contracts/catalog-create';
import { canonicalBusinessJson } from './business-repository';
import type { CommitSnapshotData } from './business-atomic';
import { isRecord } from '../data/http/api-contract';
import { INACTIVE_MASTER_ALLOWLIST, INACTIVE_MASTER_SCOPE } from './inactive-master-allowlist';
import { inactiveMasterProjectionScopes, sameInactiveScope } from './inactive-master-scope';

type InactiveCommand = 'qa.product.set-status' | 'qa.sku.set-status' | 'qa.recipient.set-status';
type InactiveStatus = 'active' | 'inactive';

export function inactiveMasterTarget(version: number | null, status: unknown): InactiveStatus | null {
  return version === 1 && status === 'active' ? 'inactive' : version === 2 && status === 'inactive' ? 'active' : null;
}

export function inactiveMasterStateKnown(version: number | null, status: unknown): boolean {
  return inactiveMasterTarget(version, status) !== null || (version === 3 && status === 'active');
}

export function isInactiveMasterCatalogFresh(catalog: CatalogSnapshot | null, snapshot: OperationalSnapshot | null): boolean {
  return !!catalog && !!snapshot && catalog.actorKey === INACTIVE_MASTER_SCOPE.actorKey
    && catalog.epoch === INACTIVE_MASTER_SCOPE.epoch && catalog.snapshotRevision === snapshot.snapshotRevision;
}

function inactiveCommand(value: unknown): InactiveCommand | null {
  if (value === 'qa.product.set-status' || value === 'qa.sku.set-status' || value === 'qa.recipient.set-status') return value;
  return null;
}

function allowlistedCommand(entry: (typeof INACTIVE_MASTER_ALLOWLIST)[number]): InactiveCommand | null {
  return inactiveCommand(entry.command);
}

function inactiveEntry(request: OperationalCommand): { entry: (typeof INACTIVE_MASTER_ALLOWLIST)[number]; command: InactiveCommand } | null {
  const command = inactiveCommand(request.command);
  if (!command) return null;
  for (const entry of INACTIVE_MASTER_ALLOWLIST) {
    if (entry.entityId === request.entityId && allowlistedCommand(entry) === command) return { entry, command };
  }
  return null;
}

function statusPayload(value: unknown): value is { confirmed: true; status: InactiveStatus } {
  return isRecord(value) && Object.keys(value).length === 2 && value.confirmed === true
    && (value.status === 'active' || value.status === 'inactive');
}

function statusOnlyRecord(original: unknown, next: unknown, target: InactiveStatus): boolean {
  if (!isRecord(original) || !isRecord(next) || Object.keys(original).some(key => !Object.hasOwn(next, key)) || Object.keys(next).some(key => !Object.hasOwn(original, key))) return false;
  try {
    for (const key of Object.keys(original)) {
      if (key === 'status') {
        if (original[key] !== 'active' || next[key] !== target) return false;
      } else if (canonicalBusinessJson(original[key]) !== canonicalBusinessJson(next[key])) return false;
    }
    return true;
  } catch { return false; }
}

/** Validate the bounded QA status outcome against the immutable original Create. */
function isInactiveMasterOutcome(value: unknown, request: OperationalCommand, actorKey: string): value is OperationalOutcome {
  const selected = inactiveEntry(request);
  if (!selected || actorKey !== INACTIVE_MASTER_SCOPE.actorKey || request.epoch !== INACTIVE_MASTER_SCOPE.epoch
    // Response shape only. Planned G2/G3 authorization is checked inside the repository;
    // readback acceptance additionally requires the exact planned setup proof.
    || !(sameInactiveScope(request, INACTIVE_MASTER_SCOPE) || (request.generation === 2 || request.generation === 3) && typeof request.scenarioId === 'string' && /^scenario:[0-9a-f-]{36}$/i.test(request.scenarioId))
    || typeof request.entityId !== 'string' || !Number.isSafeInteger(request.expectedVersion)
    || (request.expectedVersion !== 1 && request.expectedVersion !== 2) || !statusPayload(request.payload)
    || request.payload.status !== (request.expectedVersion === 1 ? 'inactive' : 'active')) return false;
  const entry = selected.entry;
  if (!isRecord(value) || typeof value.replayed !== 'boolean' || !isRecord(value.receipt)) return false;
  const receipt = value.receipt;
  const original = entry.originalReceipt;
  if (!isRecord(original) || !isRecord(original.record) || !isRecord((original.record as { data?: unknown }).data)) return false;
  const expectedVersion = request.expectedVersion + 1;
  return receipt.mode === 'MOCK' && receipt.actorKey === actorKey && receipt.commandId === request.commandId
    && receipt.epoch === request.epoch && receipt.command === selected.command && receipt.entityId === entry.entityId
    && receipt.previousVersion === request.expectedVersion && receipt.version === expectedVersion && receipt.changed === true
    && Number.isSafeInteger(receipt.snapshotRevision) && Number(receipt.snapshotRevision) > 0
    && typeof receipt.committedAt === 'string' && Number.isFinite(Date.parse(receipt.committedAt as string))
    && typeof receipt.commitSnapshotId === 'string' && receipt.commitSnapshotId.startsWith('commit-snapshot:')
    && isRecord(receipt.record) && receipt.record.id === entry.entityId && receipt.record.kind === entry.kind
    && receipt.record.version === expectedVersion
    && statusOnlyRecord((original.record as { data: unknown }).data, receipt.record.data, request.payload.status);
}

function isStatusCommand(request: OperationalCommand): boolean {
  return inactiveCommand(request.command) !== null;
}

export function isOperationalOutcome(value: unknown, request: OperationalCommand, actorKey = 'preview:ducquang'): value is OperationalOutcome {
  if (isStatusCommand(request)) return isInactiveMasterOutcome(value, request, actorKey);
  if (!isRecord(value) || typeof value.replayed !== 'boolean' || !isRecord(value.receipt)) return false;
  const r = value.receipt;
  return r.mode === 'MOCK' && r.actorKey === actorKey && actorKey === 'preview:ducquang' && r.commandId === request.commandId && r.epoch === request.epoch && r.command === request.command
    && typeof r.entityId === 'string' && Number.isSafeInteger(r.version) && Number(r.version) > 0 && Number.isSafeInteger(r.snapshotRevision) && Number(r.snapshotRevision) > 0
    && typeof r.commitSnapshotId === 'string' && r.commitSnapshotId.startsWith('commit-snapshot:') && isRecord(r.record) && r.record.id === r.entityId && r.record.version === r.version && isRecord(r.record.data)
    && (request.entityId === undefined || request.entityId === r.entityId)
    && (request.command === 'scenario.reset-own' ? r.record.data.scenarioId === r.entityId && r.record.data.generation === request.generation + 1 : r.record.data.scenarioId === request.scenarioId && r.record.data.generation === request.generation);
}

function commitProof(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome): { proof: CommitSnapshotData } | null {
  if (!isOperationalOutcome(outcome, request) || snapshot.epoch !== request.epoch || snapshot.actorKey !== outcome.receipt.actorKey || snapshot.snapshotRevision < outcome.receipt.snapshotRevision) return null;
  const record = [...snapshot.commitSnapshots, ...snapshot.archivedCommitSnapshots].find(r => r.id === outcome.receipt.commitSnapshotId);
  if (!record || record.kind !== 'commit-snapshot' || record.version !== 1) return null;
  const proof = record.data as CommitSnapshotData, r = outcome.receipt;
  try {
    return proof.id === r.commitSnapshotId && proof.epoch === r.epoch && proof.revision === r.snapshotRevision && proof.commandId === r.commandId && proof.actorKey === r.actorKey && proof.committedAt === r.committedAt && Array.isArray(proof.changes) && proof.changes.some(c => c.entityId === r.entityId && c.version === r.version && c.canonicalRecord === canonicalBusinessJson(r.record)) ? { proof } : null;
  } catch { return null; }
}

function hasInactiveMasterAudit(snapshot: OperationalSnapshot, request: OperationalCommand, proof: CommitSnapshotData, actorKey: string): boolean {
  if (!Array.isArray(proof.changes) || proof.changes.length !== 2 || !Array.isArray(proof.eventIds) || proof.eventIds.length !== 0
    || !Array.isArray(proof.auditIds) || proof.auditIds.length !== 1) return false;
  const primaryChange = proof.changes.find(change => change.entityId === request.entityId);
  if (!primaryChange || primaryChange.previousVersion !== request.expectedVersion || primaryChange.version !== (request.expectedVersion as number) + 1) return false;
  const auditId = proof.auditIds[0];
  const auditChange = proof.changes.find(change => change.entityId === auditId);
  if (!auditChange || auditChange.previousVersion !== null || auditChange.version !== 1) return false;
  let parsed: { id?: unknown; kind?: unknown; version?: unknown; data?: unknown };
  try { parsed = JSON.parse(auditChange.canonicalRecord) as typeof parsed; }
  catch { return false; }
  if (!isRecord(parsed) || parsed.id !== auditId || parsed.kind !== 'audit-event' || parsed.version !== 1 || !isRecord(parsed.data)) return false;
  const data = parsed.data;
  if (data.action !== request.command || data.entityId !== request.entityId || data.commandId !== request.commandId
    || data.actor !== actorKey || data.sourceSurface !== 'QA' || data.scenarioId !== request.scenarioId || data.generation !== request.generation
    || data.previousVersion !== request.expectedVersion || data.newVersion !== (request.expectedVersion as number) + 1
    || data.commitSnapshotId !== proof.id) return false;
  // If the projection includes the audit, it must be the exact canonical proof;
  // a separately visible audit cannot repair a tampered commit snapshot.
  try {
    return snapshot.auditEvents.every(visible => !proof.auditIds.includes(visible.id)
      || canonicalBusinessJson(visible) === auditChange.canonicalRecord);
  } catch { return false; }
}

/** Verify the accepted write from canonical immutable evidence, including after archive. */
export function hasOperationalCommitProof(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome): boolean {
  if (isStatusCommand(request) && !sameInactiveScope(request, INACTIVE_MASTER_SCOPE)) {
    const setups = inactiveMasterProjectionScopes(snapshot);
    if (!setups.some(setup => sameInactiveScope(request, setup))) return false;
  }
  const base = commitProof(snapshot, request, outcome);
  if (!base) return false;
  return isStatusCommand(request) ? hasInactiveMasterAudit(snapshot, request, base.proof, outcome.receipt.actorKey) : true;
}
