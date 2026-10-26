import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalCommand, OperationalOutcome, OperationalSnapshot, ReversalData, PartsIssueData, TypedOperationalRecord } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { hasOperationalCommitProof, isOperationalOutcome } from '../../data/http/operational-preview-adapter';
import { validateCommitSnapshot, type CommitSnapshotData } from '../../preview-mock/business-atomic';
import { canonicalBusinessJson, type BusinessRecord } from '../../preview-mock/business-repository';
import { EVIDENCE_MAX_BYTES, EVIDENCE_MEDIA_TYPES } from '../../preview-mock/reversal-policy';
import { opText } from '../../preview-mock/operational-policy';
import { sha256Bytes } from '../../preview-mock/operational-hash';

export { EVIDENCE_MAX_BYTES, EVIDENCE_MEDIA_TYPES };
export type ReversalWebAdapter = ReturnType<typeof createOperationalWebAdapter>;
export type ReversalRecord = TypedOperationalRecord<ReversalData>;
export type IssueRecord = TypedOperationalRecord<PartsIssueData>;
export type ReversalFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
export interface ReversalTarget { id: string; version: number; fence: ReversalFence }
export interface ReversalSelection { id: string; fence: ReversalFence }
export function findSelectedReversal(snapshot: OperationalSnapshot | null, selection: ReversalSelection | null) {
  if(!snapshot?.scenario||!selection||snapshot.epoch!==selection.fence.epoch||snapshot.token.scenarioId!==selection.fence.scenarioId||snapshot.token.generation!==selection.fence.generation)return null;
  return snapshot.reversals.find(row=>row.id===selection.id)??null;
}
export interface ReversalCreateDraft { originalIssueId: string; observedIssueVersion: number; returnedUnused: boolean; reasonText: string; fence: ReversalFence }
export interface EvidenceData { reversalId: string; label: string; mediaType: string; bytes: number[]; byteLength: number; sha256: string; attachmentRef: string }
export interface ReversalActionDraft { kind: 'attach' | 'confirm' | 'post' | 'cancel'; target: ReversalTarget }
export type VerifiedReversalEvidence = Record<string, EvidenceData[]>;
export interface ReversalBindingState {
  snapshot: OperationalSnapshot | null; catalog: CatalogSnapshot | null; busy: boolean; recovery: boolean; error: string;
  verifiedEvidence: VerifiedReversalEvidence;
  acceptedId: string | null; acceptedSequence: number; acceptedLocal: boolean; pendingRequest: OperationalCommand | null; archivedReconciled: boolean;
}
const COMMANDS = ['reversal.create', 'reversal.attach-evidence', 'reversal.confirm-return', 'reversal.post', 'reversal.cancel'];
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const errorCode = (e: unknown) => (e as { code?: string })?.code ?? 'READ_FAILED';
const equal = (a: unknown, b: unknown) => canonicalBusinessJson(a) === canonicalBusinessJson(b);
export function assertReversalFence(snapshot: OperationalSnapshot, fence: ReversalFence) {
  if (!snapshot.scenario || snapshot.token.epoch !== fence.epoch || snapshot.token.scenarioId !== fence.scenarioId || snapshot.token.generation !== fence.generation) fail('STALE_SCENARIO');
}
/** Only actual posted warranty issues are offered; command policy rechecks physical eligibility atomically. */
export function reversalIssueOptions(snapshot: OperationalSnapshot) {
  return snapshot.partsIssues.filter(issue => issue.data.status === 'POSTED' && issue.data.purpose === 'WARRANTY' && issue.data.lines.length > 0
    && !snapshot.reversals.some(reversal => reversal.data.originalIssueId === issue.id && reversal.data.status !== 'CANCELLED'));
}
/** Explicit adoption only: callers must show the reviewed record before invoking this helper. */
export function adoptReviewedReversal<T extends ReversalActionDraft>(draft: T, snapshot: OperationalSnapshot, reviewed: ReversalTarget): T {
  assertReversalFence(snapshot, draft.target.fence); assertReversalFence(snapshot, reviewed.fence);
  if (draft.target.id !== reviewed.id) return fail('STALE_VERSION');
  const row = snapshot.reversals.find(r => r.id === reviewed.id);
  if (!row || row.version !== reviewed.version) return fail('STALE_VERSION');
  if (row.data.status !== 'DRAFT') return fail('REVERSAL_IMMUTABLE');
  if (draft.kind === 'confirm' && row.data.physicalReturn !== 'PENDING') return fail('STALE_VERSION');
  if ((draft.kind === 'confirm' || draft.kind === 'post') && !row.data.evidenceRefs.length) return fail('EVIDENCE_REQUIRED');
  if (draft.kind === 'post' && row.data.physicalReturn !== 'CONFIRMED') return fail('PHYSICAL_RETURN_REQUIRED');
  return { ...draft, target: { ...draft.target, version: row.version } };
}
function verifyReversalEvidence(snapshot: OperationalSnapshot): VerifiedReversalEvidence {
  return Object.fromEntries(snapshot.reversals.map(record => [record.id,
    record.data.evidenceRefs.map(id => assertEvidence(snapshot.evidence.find(e => e.id === id), record.id))]));
}
function assertEvidence(record: BusinessRecord | undefined, reversalId: string): EvidenceData {
  if (!record || record.kind !== 'evidence-attachment') return fail('INVALID_RESPONSE');
  const e = record.data as EvidenceData;
  if (!e || typeof e.label !== 'string' || !e.label.length || e.label.length > 200 || /[\u0000-\u001f\u007f]/.test(e.label)
    || e.reversalId !== reversalId || e.attachmentRef !== record.id || !Array.isArray(e.bytes) || e.byteLength !== e.bytes.length || !e.byteLength || e.byteLength > EVIDENCE_MAX_BYTES
    || !EVIDENCE_MEDIA_TYPES.includes(e.mediaType as typeof EVIDENCE_MEDIA_TYPES[number]) || e.bytes.some(b => !Number.isInteger(b) || b < 0 || b > 255)
    || sha256Bytes(Uint8Array.from(e.bytes)) !== e.sha256) return fail('INVALID_RESPONSE');
  return e;
}
function originalProof(snapshot: OperationalSnapshot, saved: ReversalData) {
  const issue = snapshot.partsIssues.find(r => r.id === saved.originalIssueId);
  if (!issue || issue.version !== saved.originalIssueVersion || issue.data.status !== 'POSTED' || issue.data.purpose !== 'WARRANTY'
    || !equal(issue.data.postedEventIds, saved.originalEventIds) || !equal(issue.data.lines.map(l => l.id), saved.originalLineIds)) return fail('INVALID_RESPONSE');
  const events = saved.originalEventIds.map(id => snapshot.stockEvents.find(e => e.id === id));
  if (!events.length || events.length !== issue.data.lines.length || new Set(saved.originalEventIds).size !== events.length) return fail('INVALID_RESPONSE');
  const proof = snapshot.commitSnapshots.find(p => p.id === events[0]?.data.commitSnapshotId)?.data as CommitSnapshotData | undefined;
  if (!proof || !proof.changes.some(c => c.entityId === issue.id && c.canonicalRecord === canonicalBusinessJson(issue))) return fail('INVALID_RESPONSE');
  for (const event of events) {
    const line = issue.data.lines.find(l => l.id === event?.data.sourceLineId);
    if (!event || !line || event.data.eventType !== 'PARTS_ISSUE_POST' || event.data.documentId !== issue.id || event.data.signedQuantity !== -line.quantity
      || event.data.skuId !== line.skuId || event.data.unit !== line.unit || event.data.boxId !== line.boxId || !equal(event.data.physicalIds, line.physicalIds)
      || event.data.commitSnapshotId !== proof.id || !proof.changes.some(c => c.entityId === event.id && c.canonicalRecord === canonicalBusinessJson(event))) return fail('INVALID_RESPONSE');
  }
  return issue;
}
export function assertReversalAccepted(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome) {
  if (!COMMANDS.includes(request.command) || !isOperationalOutcome(outcome, request, snapshot.actorKey)) return fail('INVALID_RESPONSE');
  assertReversalFence(snapshot, request);
  const row = snapshot.reversals.find(r => r.id === outcome.receipt.entityId), saved = outcome.receipt.record.data as ReversalData;
  if (!row || row.kind !== 'reversal' || row.version < outcome.receipt.version || snapshot.snapshotRevision < outcome.receipt.snapshotRevision
    || row.data.scenarioId !== request.scenarioId || row.data.generation !== request.generation) return fail('INVALID_RESPONSE');
  validateCommitSnapshot([...snapshot.reversals, ...snapshot.partsIssues, ...snapshot.evidence, ...snapshot.boxes, ...snapshot.physical, ...snapshot.stockEvents, ...snapshot.auditEvents, ...snapshot.commitSnapshots], outcome.receipt);
  const original = originalProof(snapshot, saved);
  if (saved.returnedUnused !== true) fail('INVALID_RESPONSE');
  for (const id of saved.evidenceRefs) assertEvidence(snapshot.evidence.find(e => e.id === id), row.id);
  if (request.command === 'reversal.create') {
    const p = request.payload as { originalIssueId: string; observedIssueVersion: number; reasonText: string };
    if (saved.originalIssueId !== p.originalIssueId || saved.originalIssueVersion !== p.observedIssueVersion || saved.reasonText !== p.reasonText || saved.status !== 'DRAFT' || saved.physicalReturn !== 'PENDING' || saved.evidenceRefs.length) fail('INVALID_RESPONSE');
  } else if (request.command === 'reversal.attach-evidence') {
    const p = request.payload as { label: string; mediaType: string; bytes: number[] };
    const evidence = assertEvidence(snapshot.evidence.find(e => e.id === `evidence:${request.commandId}`), row.id);
    if (!saved.evidenceRefs.includes(evidence.attachmentRef) || evidence.label !== p.label || evidence.mediaType !== p.mediaType || !equal(evidence.bytes, p.bytes) || saved.status !== 'DRAFT') fail('INVALID_RESPONSE');
  } else if (request.command === 'reversal.confirm-return') {
    if (saved.status !== 'DRAFT' || saved.physicalReturn !== 'CONFIRMED' || !saved.evidenceRefs.length) fail('INVALID_RESPONSE');
  } else if (request.command === 'reversal.cancel') {
    if (saved.status !== 'CANCELLED' || saved.cancelReason !== (request.payload as { reason: string }).reason || saved.postedCompensationEventIds.length) fail('INVALID_RESPONSE');
  } else {
    if (saved.status !== 'POSTED' || row.data.status !== 'POSTED' || saved.physicalReturn !== 'CONFIRMED' || !saved.evidenceRefs.length
      || saved.postedCompensationEventIds.length !== saved.originalEventIds.length || new Set(saved.postedCompensationEventIds).size !== saved.postedCompensationEventIds.length) fail('INVALID_RESPONSE');
    const proof = snapshot.commitSnapshots.find(p => p.id === outcome.receipt.commitSnapshotId)!.data as CommitSnapshotData;
    const compensation = saved.postedCompensationEventIds.map(id => snapshot.stockEvents.find(e => e.id === id));
    for (const originalId of saved.originalEventIds) {
      const source = snapshot.stockEvents.find(e => e.id === originalId)!, matches = compensation.filter(e => e?.data.originalEventId === originalId), event = matches[0];
      const line = original.data.lines.find(l => l.id === source.data.sourceLineId)!;
      if (matches.length !== 1 || !event || event.data.eventType !== 'REVERSAL_POST' || event.data.documentId !== row.id || event.data.sourceLineId !== source.data.sourceLineId
        || event.data.commandId !== request.commandId || event.data.commitSnapshotId !== outcome.receipt.commitSnapshotId || event.data.signedQuantity !== -source.data.signedQuantity
        || event.data.skuId !== source.data.skuId || event.data.unit !== source.data.unit || event.data.boxId !== source.data.boxId || !equal(event.data.physicalIds, source.data.physicalIds)) return fail('INVALID_RESPONSE');
      // Restoration is verified at its immutable commit; subsequent legitimate issues may advance current stock.
      const id = line.boxId ?? line.physicalIds[0], change = proof.changes.find(c => c.entityId === id);
      if (!change) return fail('INVALID_RESPONSE');
      const restored = JSON.parse(change.canonicalRecord) as BusinessRecord, data = restored.data as Record<string, unknown>;
      if (data.skuId !== line.skuId || data.unit !== line.unit || data.status !== 'IN_STOCK'
        || (line.boxId ? data.contentRevision !== Number(line.contentRevision) + 2 : data.issuedDocumentId !== null)) fail('INVALID_RESPONSE');
    }
  }
  return row;
}

/** Screen orchestration; canonical adapter owns authorization, storage and durable intent. */
export function createReversalBinding(adapter: ReversalWebAdapter, readCatalog: () => Promise<CatalogSnapshot>) {
  let state: ReversalBindingState = { snapshot: null, catalog: null, verifiedEvidence: {}, busy: false, recovery: false, error: '', acceptedId: null, acceptedSequence: 0, acceptedLocal: false, pendingRequest: null, archivedReconciled: false };
  const listeners = new Set<() => void>(), issued = new Set<string>(); let active = true, serial = 0;
  const current = (token: number) => active && token === serial;
  const publish = (patch: Partial<ReversalBindingState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  async function read() {
    for (let attempt = 0; attempt < 3; attempt++) {
      const catalog = await readCatalog(), snapshot = await adapter.read();
      if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey) fail('STALE_DEMO_EPOCH');
      if (catalog.snapshotRevision !== snapshot.snapshotRevision) continue;
      return { snapshot, catalog, verifiedEvidence: verifyReversalEvidence(snapshot) };
    }
    return fail('STALE_SNAPSHOT');
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, explicitRecovery = false) {
    const next = await read(), archived = request.epoch === next.snapshot.epoch && request.generation < next.snapshot.token.generation && request.scenarioId !== next.snapshot.token.scenarioId;
    if (archived && explicitRecovery) {
      if (!COMMANDS.includes(request.command) || !hasOperationalCommitProof(next.snapshot, request, outcome)) { if (current(token)) publish({ ...next, recovery: true, error: 'ARCHIVED_PROOF_UNAVAILABLE' }); return; }
      if (!current(token)) return; await adapter.recovery.acknowledge(request.commandId);
      if (current(token)) publish({ ...next, error: '', recovery: false, pendingRequest: null, archivedReconciled: true }); return;
    }
    assertReversalAccepted(next.snapshot, request, outcome); if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (current(token)) publish({ ...next, error: '', recovery: false, pendingRequest: null, acceptedId: outcome.receipt.entityId, acceptedSequence: state.acceptedSequence + 1, acceptedLocal: issued.has(request.commandId) });
  }
  async function load(retry = false) {
    if (!active || state.busy) return; const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE'); const recovered = retry ? await adapter.recovery.retry() : await adapter.recovery.restore(); if (!current(token)) return;
      publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : null });
      if (recovered.kind === 'blocked') fail(recovered.code);
      if (recovered.kind === 'committed' && retry) await accept(recovered.request, recovered.outcome, token, true);
      else { const next = await read(); if (current(token)) publish({ ...next, error: recovered.kind === 'empty' ? '' : 'OUTCOME_UNKNOWN' }); }
    } catch (error) { if (current(token)) publish({ snapshot: null, catalog: null, verifiedEvidence: {}, error: errorCode(error) }); }
    finally { if (current(token)) publish({ busy: false }); }
  }
  async function execute(make: (snapshot: OperationalSnapshot) => OperationalCommand | Promise<OperationalCommand>) {
    if (!active || state.busy || state.recovery || !state.snapshot) return; const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try {
      const request = await make(state.snapshot!); if (!current(token)) return; issued.add(request.commandId);
      const outcome = await adapter.execute(request); if (!current(token)) return; publish({ recovery: true }); await accept(request, outcome, token);
    } catch (error) {
      if (!current(token)) return; const held = await adapter.recovery.restore().catch(() => ({ kind: 'blocked' as const, code: 'RECOVERY_UNAVAILABLE' })); if (!current(token)) return;
      publish({ error: errorCode(error), recovery: held.kind !== 'empty', pendingRequest: held.kind === 'pending' || held.kind === 'committed' ? held.request : null,
        ...(held.kind !== 'empty' || ['SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN'].includes(errorCode(error)) ? { snapshot: null, catalog: null, verifiedEvidence: {} } : {}) });
    } finally { if (current(token)) publish({ busy: false }); }
  }
  function envelope(snapshot: OperationalSnapshot, fence: ReversalFence) { assertReversalFence(snapshot, fence); return { commandId: crypto.randomUUID(), epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation }; }
  function update(snapshot: OperationalSnapshot, target: ReversalTarget) {
    const base = envelope(snapshot, target.fence), row = snapshot.reversals.find(r => r.id === target.id);
    if (!row || row.version !== target.version) return fail('STALE_VERSION'); if (row.data.status !== 'DRAFT') return fail('REVERSAL_IMMUTABLE');
    return { base: { ...base, entityId: row.id, expectedVersion: target.version }, row };
  }
  return {
    getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load, retry: () => load(true),
    resume() { active = true; ++serial; publish({ busy: false }); return load(); }, suspend() { active = false; ++serial; },
    create(draft: ReversalCreateDraft) { return execute(snapshot => {
      const base = envelope(snapshot, draft.fence), original = snapshot.partsIssues.find(r => r.id === draft.originalIssueId);
      if (!original || original.version !== draft.observedIssueVersion) return fail('STALE_ISSUE_VERSION');
      if (!reversalIssueOptions(snapshot).some(r => r.id === original.id)) return fail('REVERSAL_TYPE_NOT_ALLOWED'); if (!draft.returnedUnused) return fail('UNUSED_RETURN_REQUIRED');
      return { ...base, command: 'reversal.create', payload: { originalIssueId: original.id, observedIssueVersion: draft.observedIssueVersion, returnedUnused: true, reasonText: opText(draft.reasonText, 1, 500) } };
    }); },
    attach(target: ReversalTarget, file: File, label: string) { return execute(async snapshot => {
      const { base } = update(snapshot, target), cleanLabel = opText(label, 1, 200), mediaType = file.type;
      if (!EVIDENCE_MEDIA_TYPES.includes(mediaType as typeof EVIDENCE_MEDIA_TYPES[number]) || !file.size || file.size > EVIDENCE_MAX_BYTES) return fail('EVIDENCE_INVALID');
      const bytes = new Uint8Array(await file.arrayBuffer()); if (bytes.length !== file.size || bytes.length > EVIDENCE_MAX_BYTES) return fail('EVIDENCE_INVALID');
      return { ...base, command: 'reversal.attach-evidence', payload: { label: cleanLabel, mediaType, bytes: Array.from(bytes) } };
    }); },
    confirmReturn(target: ReversalTarget) { return execute(snapshot => { const { base } = update(snapshot, target); return { ...base, command: 'reversal.confirm-return', payload: { confirmed: true } }; }); },
    post(target: ReversalTarget) { return execute(snapshot => { const { base } = update(snapshot, target); return { ...base, command: 'reversal.post', payload: { reversalId: target.id } }; }); },
    cancel(target: ReversalTarget, reason: string) { return execute(snapshot => { const { base } = update(snapshot, target); return { ...base, command: 'reversal.cancel', payload: { reason: opText(reason, 1, 500) } }; }); },
  };
}
