import type { BusinessApplyContext, BusinessHandler, BusinessRecord, BusinessRepositoryOptions } from './business-repository';
import { canonicalBusinessJson } from './business-repository';
import { validateCommitSnapshot } from './business-atomic';
import type { OperationalSurface } from '../contracts/operational-preview';
import { assertScope, opFail, opFields, opMeta, opObject, unpackOperational } from './operational-policy';
import { INACTIVE_MASTER_ALLOWLIST, INACTIVE_MASTER_SCOPE } from './inactive-master-allowlist';
import { resolveInactiveMasterSetups, sameInactiveScope } from './inactive-master-scope';
import type { OperationalScope } from '../contracts/operational-preview';

type Entry = typeof INACTIVE_MASTER_ALLOWLIST[number];
const ownedKinds = new Set(['sku-operational-profile', 'receipt', 'inbound-line', 'physical', 'box', 'stock-event',
  'outbound', 'warranty-case', 'case-event', 'parts-issue', 'reversal', 'evidence-attachment', 'app-submission',
  'scan-observation', 'physical-registry', 'putaway', 'audit-event']);
const referenceFields = new Set(['id', 'entityId', 'scenarioId', 'skuId', 'productId', 'recipientId', 'resolvedSkuId', 'receiptId',
  'sourceReceiptId', 'sourceLineId', 'documentId', 'outboundId', 'physicalId', 'boxId', 'trayId', 'locationId',
  'issuedDocumentId', 'profileId', 'caseId', 'issueId', 'originalIssueId', 'originalEventId', 'submissionId',
  'appSubmissionId', 'scanSessionId', 'commitSnapshotId', 'selectedSkuIds', 'physicalIds', 'allocatedPhysicalIds',
  'postedEventIds', 'postedCompensationEventIds', 'originalEventIds', 'originalLineIds', 'eventIds', 'auditIds', 'FK', 'evidenceRefs']);

/** Full records, including nested line/snapshot FKs and immutable canonicalRecord proofs.
 * Unknown fields containing a related ID fail closed instead of silently skipping a new relationship. */
function references(value: unknown, related: Set<string>, field = '', typedOnly = false): boolean {
  if (typeof value === 'string') {
    if (field === 'canonicalRecord') {
      try { return references(JSON.parse(value), related, '', typedOnly); }
      catch { return opFail('QA_REFERENCE_UNVERIFIED'); }
    }
    return related.has(value) && (!typedOnly || referenceFields.has(field));
  }
  if (Array.isArray(value)) return value.some(item => references(item, related, field, typedOnly));
  return opObject(value) && Object.entries(value).some(([key, item]) => references(item, related, key, typedOnly));
}
function approvedScope(scope: OperationalScope, c: BusinessApplyContext) {
  const setups = resolveInactiveMasterSetups(c);
  if (!sameInactiveScope(scope, INACTIVE_MASTER_SCOPE) && !setups.some(setup => sameInactiveScope(scope, setup))) return opFail('QA_SCOPE_REQUIRED', 403);
  return scope;
}
function assertOwned(record: BusinessRecord, c: BusinessApplyContext) {
  const d = record.data;
  if (!opObject(d) || typeof d.scenarioId !== 'string' || !Number.isSafeInteger(d.generation)) return opFail('QA_FOREIGN_REFERENCE');
  const scope = { scenarioId: d.scenarioId, generation: Number(d.generation) };
  const setups = resolveInactiveMasterSetups(c);
  if ((!sameInactiveScope(scope, INACTIVE_MASTER_SCOPE) && !setups.some(setup => sameInactiveScope(scope, setup)))
    || d.warehouseId !== 'warehouse-hn-01' || d.createdBy !== INACTIVE_MASTER_SCOPE.actorKey || d.updatedBy !== INACTIVE_MASTER_SCOPE.actorKey
    || d.actor !== undefined && d.actor !== INACTIVE_MASTER_SCOPE.actorKey
    || d.ownerActor !== undefined && d.ownerActor !== INACTIVE_MASTER_SCOPE.actorKey) return opFail('QA_FOREIGN_REFERENCE');
  if (record.kind === 'operational-scenario') {
    if (record.id !== scope.scenarioId || d.ownerActor !== INACTIVE_MASTER_SCOPE.actorKey || !['ACTIVE', 'ARCHIVED'].includes(String(d.status))) return opFail('QA_FOREIGN_REFERENCE');
  } else if (!ownedKinds.has(record.kind)) return opFail('QA_REFERENCE_UNVERIFIED');
  return scope;
}
function assertNestedOwnership(value: unknown, scope: OperationalScope): void {
  if (Array.isArray(value)) { value.forEach(item => assertNestedOwnership(item, scope)); return; }
  if (!opObject(value)) return;
  for (const [key, expected] of Object.entries({ scenarioId: scope.scenarioId, generation: scope.generation,
    warehouseId: 'warehouse-hn-01', createdBy: INACTIVE_MASTER_SCOPE.actorKey, updatedBy: INACTIVE_MASTER_SCOPE.actorKey,
    ownerActor: INACTIVE_MASTER_SCOPE.actorKey, actorKey: INACTIVE_MASTER_SCOPE.actorKey, actor: INACTIVE_MASTER_SCOPE.actorKey })) {
    if (Object.hasOwn(value, key) && value[key] !== expected) return opFail('QA_FOREIGN_REFERENCE');
  }
  for (const child of Object.values(value)) assertNestedOwnership(child, scope);
}
function assertProofOwned(record: BusinessRecord, c: BusinessApplyContext) {
  const d = record.data;
  if (!opObject(d) || d.epoch !== INACTIVE_MASTER_SCOPE.epoch || d.actorKey !== INACTIVE_MASTER_SCOPE.actorKey
    || !Array.isArray(d.auditIds) || !d.auditIds.length || !Array.isArray(d.changes)) return opFail('QA_REFERENCE_UNVERIFIED');
  const committed = typeof d.commandId === 'string' ? c.committedCommand(d.commandId) : undefined;
  if (!committed || committed.receipt.commitSnapshotId !== record.id) return opFail('QA_REFERENCE_UNVERIFIED');
  validateCommitSnapshot([...c.records], committed.receipt);
  for (const id of d.auditIds) {
    const audit = c.records.find(r => r.id === id && r.kind === 'audit-event');
    if (!audit || !opObject(audit.data) || audit.data.commitSnapshotId !== record.id || audit.data.commandId !== d.commandId) return opFail('QA_REFERENCE_UNVERIFIED');
    assertOwned(audit, c);
  }
  for (const change of d.changes) {
    if (!opObject(change) || typeof change.canonicalRecord !== 'string') return opFail('QA_REFERENCE_UNVERIFIED');
    let r: BusinessRecord;
    try { r = JSON.parse(change.canonicalRecord) as BusinessRecord; } catch { return opFail('QA_REFERENCE_UNVERIFIED'); }
    const approved = INACTIVE_MASTER_ALLOWLIST.find(entry => entry.entityId === r.id && entry.kind === r.kind);
    if (approved) assertBoundRecord(r, approved);
    else { const scope = assertOwned(r, c); assertNestedOwnership(r.data, scope); }
  }
}
function assertOwnedReference(record: BusinessRecord, c: BusinessApplyContext) {
  const scope = assertOwned(record, c); assertNestedOwnership(record.data, scope);
  if (record.kind === 'operational-scenario') return;
  const canonical = canonicalBusinessJson(record);
  const proofs = c.records.filter(r => r.kind === 'commit-snapshot' && opObject(r.data) && Array.isArray(r.data.changes)
    && r.data.changes.some(change => opObject(change) && change.entityId === record.id && change.version === record.version && change.canonicalRecord === canonical));
  // Own-looking metadata alone does not establish provenance of a frozen submission or any dependency.
  if (proofs.length !== 1) return opFail('QA_REFERENCE_UNVERIFIED');
  assertProofOwned(proofs[0], c);
}
function assertBoundRecord(record: Readonly<BusinessRecord>, entry: Entry) {
  if (!opObject(record.data) || ![1, 2, 3].includes(record.version)
    || canonicalBusinessJson(record.data) !== canonicalBusinessJson({ ...entry.originalReceipt.record.data, status: record.version === 2 ? 'inactive' : 'active' })) return opFail('QA_ORIGINAL_CREATE_REQUIRED');
}
function assertOriginal(entry: Entry, c: BusinessApplyContext) {
  const original = c.committedCommand(entry.originalCreateCommandId);
  if (!original || canonicalBusinessJson(original.request) !== canonicalBusinessJson(entry.originalRequest)
    || canonicalBusinessJson(original.receipt) !== canonicalBusinessJson(entry.originalReceipt)) return opFail('QA_ORIGINAL_CREATE_REQUIRED');
}
function assertStatusHistory(record: Readonly<BusinessRecord>, entry: Entry, c: BusinessApplyContext) {
  for (let version = 2; version <= record.version; version++) {
    const audits = c.records.filter(r => r.kind === 'audit-event' && opObject(r.data)
      && r.data.entityId === record.id && r.data.action === entry.command && r.data.newVersion === version);
    if (audits.length !== 1) return opFail('QA_STATUS_HISTORY_REQUIRED');
    const audit = audits[0], d = audit.data as Record<string, unknown>;
    const scope = assertOwned(audit, c);
    const prior = typeof d.commandId === 'string' ? c.committedCommand(d.commandId) : undefined;
    const status = version === 2 ? 'inactive' : 'active';
    if (!prior || d.sourceSurface !== 'QA' || d.originalCreateCommandId !== entry.originalCreateCommandId
      || d.previousVersion !== version - 1 || d.previousStatus !== (version === 2 ? 'active' : 'inactive') || d.status !== status
      || canonicalBusinessJson(prior.request) !== canonicalBusinessJson({ commandId: d.commandId, epoch: c.epoch, command: entry.command,
        entityId: record.id, expectedVersion: version - 1, payload: { scope, input: { confirmed: true, status } } })
      || prior.receipt.entityId !== record.id || prior.receipt.previousVersion !== version - 1 || prior.receipt.version !== version
      || !prior.receipt.changed || prior.receipt.snapshotRevision <= entry.originalReceipt.snapshotRevision
      || prior.receipt.commitSnapshotId !== d.commitSnapshotId || typeof prior.receipt.commitSnapshotId !== 'string'
      || canonicalBusinessJson(prior.receipt.record) !== canonicalBusinessJson({ id: record.id, kind: entry.kind, version, data: { ...entry.originalReceipt.record.data, status } })) return opFail('QA_STATUS_HISTORY_REQUIRED');
    validateCommitSnapshot([...c.records], prior.receipt);
  }
}
function assertReferences(current: Readonly<BusinessRecord>, c: BusinessApplyContext) {
  const related = new Set([current.id]);
  // Reverse dependency closure finds Product children, nested outbound lines, physical/ledger links,
  // and proof records even when they are absent from the active operational projection.
  let added = true;
  while (added) {
    added = false;
    for (const record of c.records) {
      if (related.has(record.id) || !references(record.data, related)) continue;
      if (!references(record.data, related, '', true)) return opFail('QA_REFERENCE_UNVERIFIED');
      const approved = INACTIVE_MASTER_ALLOWLIST.find(entry => entry.entityId === record.id && entry.kind === record.kind);
      if (approved) { assertBoundRecord(record, approved); assertOriginal(approved, c); assertStatusHistory(record, approved, c); }
      else if (record.kind === 'commit-snapshot') assertProofOwned(record, c);
      else assertOwnedReference(record, c);
      related.add(record.id); added = true;
    }
  }
}

/** A structural v2/v3 catalogue projection is insufficient proof of a legitimate status history.
 * Every canonical read/command composition verifies that history before exposing the snapshot. */
export const validateInactiveMasterHistory: NonNullable<BusinessRepositoryOptions['validateCanonicalState']> = (snapshot, lookup) => {
  // Validate a retained planned setup even before the first status transition.
  // History validation deliberately survives the final FLOW-06 archive.
  resolveInactiveMasterSetups({ records: snapshot.records, epoch: snapshot.epoch,
    committedCommand: id => lookup(INACTIVE_MASTER_SCOPE.actorKey, id) });
  for (const entry of INACTIVE_MASTER_ALLOWLIST) {
    const record = snapshot.records.find(r => r.id === entry.entityId);
    if (!record || record.version === 1) continue;
    if (record.kind !== entry.kind || snapshot.epoch !== INACTIVE_MASTER_SCOPE.epoch) return opFail('QA_STATUS_HISTORY_REQUIRED');
    const c: BusinessApplyContext = { records: snapshot.records, epoch: snapshot.epoch, actorKey: INACTIVE_MASTER_SCOPE.actorKey,
      entityId: record.id, commandId: '', committedAt: '', committedCommand: id => lookup(INACTIVE_MASTER_SCOPE.actorKey, id) };
    assertBoundRecord(record, entry); assertOriginal(entry, c); assertStatusHistory(record, entry, c);
  }
};

/** Fixed three-kind registry. No entity-kind dispatch from an untrusted payload. */
export function inactiveMasterHandlers(surface: OperationalSurface, enabled: boolean): Record<string, BusinessHandler> {
  if (surface !== 'QA' || !enabled) return {};
  return Object.fromEntries(INACTIVE_MASTER_ALLOWLIST.map(entry => [entry.command, {
    operation: 'update', entityKind: entry.kind,
    apply(raw, current, c) {
      if (!c || c.actorKey !== INACTIVE_MASTER_SCOPE.actorKey || c.epoch !== INACTIVE_MASTER_SCOPE.epoch) return opFail('QA_SCOPE_REQUIRED', 403);
      if (!current || current.id !== entry.entityId) return opFail('QA_ALLOWLIST_REQUIRED', 403);
      const { scope, input } = unpackOperational(raw), p = opFields(input, ['confirmed', 'status']);
      approvedScope(scope, c);
      const scenario = assertScope(c.records, scope); assertOwned(scenario, c);
      if (p.confirmed !== true || !['active', 'inactive'].includes(String(p.status))) return opFail('VALIDATION_FAILED', 422);
      assertOriginal(entry, c); assertBoundRecord(current, entry); assertStatusHistory(current, entry, c);
      if (!(current.version === 1 && p.status === 'inactive' || current.version === 2 && p.status === 'active')) return opFail('QA_STATUS_TRANSITION_FORBIDDEN');
      assertReferences(current, c);
      return { ...entry.originalReceipt.record.data, status: p.status };
    },
    dependentWrites(primary, c) {
      const current = c.records.find(r => r.id === primary.id)!;
      const { scope } = unpackOperational(c.request.payload);
      if (typeof scope.scenarioId !== 'string') return opFail('QA_SCOPE_REQUIRED', 403);
      return [{ id: 'audit:' + c.request.commandId, kind: 'audit-event', expectedVersion: null,
        data: { ...opMeta({ scenarioId: scope.scenarioId, generation: scope.generation }, c.committedAt, c.actorKey), entityId: primary.id, action: entry.command,
          previousVersion: current.version, newVersion: primary.version, commandId: c.request.commandId, sourceSurface: 'QA',
          actor: c.actorKey, timestamp: c.committedAt, FK: [], eventIds: [], commitSnapshotId: c.commitSnapshotId,
          originalCreateCommandId: entry.originalCreateCommandId, previousStatus: (current.data as { status: string }).status,
          status: (primary.data as { status: string }).status } }];
    },
  } satisfies BusinessHandler]));
}
