import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalCommand, OperationalOutcome, OperationalSnapshot, ReceiptData, TypedOperationalRecord } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { hasOperationalCommitProof, isOperationalOutcome } from '../../data/http/operational-preview-adapter';
import { validateCommitSnapshot } from '../../preview-mock/business-atomic';
import type { BusinessRecord } from '../../preview-mock/business-repository';
import type { ReceiptHeaderContext, ReceiptHeaderDraft, ReceiptHeaderSubmission } from './receipt-header-form';

export type ReceiptAdapter = ReturnType<typeof createOperationalWebAdapter>;
export type ReceiptRecord = TypedOperationalRecord<ReceiptData>;
export type ReceiptFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
export interface ReceiptEditor { context: ReceiptHeaderContext; draft: ReceiptHeaderDraft; fence: ReceiptFence; version?: number }
/** Refreshes one existing editor without changing its identity, scope or user input. */
export function refreshReceiptEditor(editor: ReceiptEditor, snapshot: OperationalSnapshot): ReceiptEditor {
  assertReceiptFence(snapshot, editor.fence);
  if (editor.context.intent === 'create') return editor;
  const id = editor.context.receiptId, row = snapshot.receipts.find(r => r.id === id);
  if (!row) return fail('STALE_VERSION');
  return { ...editor, version: row.version, context: { intent: 'update', receiptId: id, mode: row.data.mode, receiptStatus: row.data.status, scanCount: receiptCodeCount(snapshot, id) } };
}
export interface ReceiptBindingState {
  snapshot: OperationalSnapshot | null; catalog: CatalogSnapshot | null;
  busy: boolean; recovery: boolean; error: string; acceptedId: string | null; acceptedSequence: number; acceptedLocal: boolean; pendingRequest: OperationalCommand | null; archivedReconciled: boolean;
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const code = (e: unknown) => (e as { code?: string })?.code ?? 'READ_FAILED';
export const receiptLines = (snapshot: OperationalSnapshot, id: string) => snapshot.lines.filter(row => row.data.receiptId === id);
export const receiptCodeCount = (snapshot: OperationalSnapshot, id: string) => receiptLines(snapshot, id).reduce((count, row) => count + row.data.physicalIds.length + (row.data.boxId ? 1 : 0), 0);
export function assertReceiptFence(snapshot: OperationalSnapshot, fence: ReceiptFence) {
  if (!snapshot.scenario || snapshot.token.epoch !== fence.epoch || snapshot.token.scenarioId !== fence.scenarioId || snapshot.token.generation !== fence.generation) fail('STALE_SCENARIO');
}
export function assertReceiptAccepted(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome) {
  if (!['inbound.create', 'inbound.update-header', 'inbound.post'].includes(request.command) || !isOperationalOutcome(outcome, request, snapshot.actorKey)) fail('INVALID_RESPONSE');
  assertReceiptFence(snapshot, request);
  if (snapshot.snapshotRevision < outcome.receipt.snapshotRevision) fail('INVALID_RESPONSE');
  const row = snapshot.receipts.find(r => r.id === outcome.receipt.entityId);
  if (!row || row.kind !== 'receipt' || row.version < outcome.receipt.version || row.data.scenarioId !== request.scenarioId || row.data.generation !== request.generation) return fail('INVALID_RESPONSE');
  validateCommitSnapshot([...snapshot.receipts, ...snapshot.lines, ...snapshot.physical, ...snapshot.boxes, ...snapshot.stockEvents, ...snapshot.auditEvents, ...snapshot.commitSnapshots] as BusinessRecord[], outcome.receipt);
  const saved = outcome.receipt.record.data as ReceiptData;
  if (request.command === 'inbound.post') {
    if (saved.status !== 'POSTED' || !saved.postedEventIds.length || row.data.status !== 'POSTED') fail('INVALID_RESPONSE');
    for (const id of saved.postedEventIds) {
      const event = snapshot.stockEvents.find(e => e.id === id);
      const line = snapshot.lines.find(l => l.id === event?.data.sourceLineId);
      if (!event || !line || line.data.receiptId !== row.id || event.data.documentId !== row.id || event.data.commandId !== request.commandId || event.data.commitSnapshotId !== outcome.receipt.commitSnapshotId || event.data.signedQuantity !== line.data.quantity || event.data.skuId !== line.data.skuId) fail('INVALID_RESPONSE');
    }
  } else {
    const payload = request.payload as { mode: string; sourceText: string; referenceText: string };
    if (saved.mode !== payload.mode || saved.sourceText !== payload.sourceText || saved.referenceText !== payload.referenceText || saved.status !== 'DRAFT' || saved.postedEventIds.length) fail('INVALID_RESPONSE');
  }
  return row;
}

/** Screen orchestration only. The handed-off adapter owns authorization, journal and storage. */
export function createReceiptBinding(adapter: ReceiptAdapter, readCatalog: () => Promise<CatalogSnapshot>) {
  let state: ReceiptBindingState = { snapshot: null, catalog: null, busy: false, recovery: false, error: '', acceptedId: null, acceptedSequence: 0, acceptedLocal: false, pendingRequest: null, archivedReconciled: false };
  const listeners = new Set<() => void>();
  let active = true, serial = 0;
  const issued = new Set<string>();
  const publish = (patch: Partial<ReceiptBindingState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const current = (token: number) => active && token === serial;
  async function read() {
    const catalog = await readCatalog(), snapshot = await adapter.read();
    if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey) fail('STALE_DEMO_EPOCH');
    return { snapshot, catalog };
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, explicitRecovery = false) {
    const next = await read();
    const archived = request.epoch === next.snapshot.epoch && request.generation < next.snapshot.token.generation && request.scenarioId !== next.snapshot.token.scenarioId;
    if (archived && explicitRecovery) {
      if (!['inbound.create', 'inbound.update-header', 'inbound.post'].includes(request.command) || !hasOperationalCommitProof(next.snapshot, request, outcome)) {
        if (current(token)) publish({ ...next, error: 'ARCHIVED_PROOF_UNAVAILABLE', recovery: true });
        return;
      }
      if (!current(token)) return;
      await adapter.recovery.acknowledge(request.commandId);
      if (current(token)) publish({ ...next, recovery: false, error: '', pendingRequest: null, archivedReconciled: true });
      return;
    }
    assertReceiptAccepted(next.snapshot, request, outcome);
    if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (!current(token)) return;
    publish({ ...next, recovery: false, error: '', acceptedId: outcome.receipt.entityId, acceptedSequence: state.acceptedSequence + 1, acceptedLocal: issued.has(request.commandId), pendingRequest: null });
  }
  async function restore(token: number, retry: boolean) {
    const recovered = retry ? await adapter.recovery.retry() : await adapter.recovery.restore();
    if (!current(token)) return;
    publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : null });
    if (recovered.kind === 'blocked') fail(recovered.code);
    if (recovered.kind === 'committed' && retry) { await accept(recovered.request, recovered.outcome, token, true); return; }
    const next = await read();
    if (current(token)) publish({ ...next, error: recovered.kind !== 'empty' ? 'OUTCOME_UNKNOWN' : '' });
  }
  async function load(retry = false) {
    if (state.busy || !active) return;
    const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try { if (!adapter.available) fail('COMMAND_UNAVAILABLE'); await restore(token, retry); }
    catch (error) { if (current(token)) publish({ snapshot: null, catalog: null, error: code(error) }); }
    finally { if (current(token)) publish({ busy: false }); }
  }
  async function execute(make: (snapshot: OperationalSnapshot) => OperationalCommand) {
    if (!active || state.busy || state.recovery || !state.snapshot) return;
    const token = ++serial; publish({ busy: true, error: '' });
    try {
      const request = make(state.snapshot);
      issued.add(request.commandId);
      const outcome = await adapter.execute(request);
      if (!current(token)) return;
      publish({ recovery: true });
      await accept(request, outcome, token);
    } catch (error) {
      if (!current(token)) return;
      const recovered = await adapter.recovery.restore().catch(() => ({ kind: 'blocked' as const, code: 'RECOVERY_UNAVAILABLE' }));
      if (!current(token)) return;
      // Only an empty durable journal permits a replacement command. Draft is UI-owned.
      publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : null, error: code(error), ...(recovered.kind !== 'empty' || ['SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN'].includes(code(error)) ? { snapshot: null, catalog: null } : {}) });
    } finally { if (current(token)) publish({ busy: false }); }
  }
  function envelope(snapshot: OperationalSnapshot, fence: ReceiptFence) {
    assertReceiptFence(snapshot, fence);
    return { commandId: crypto.randomUUID(), epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation };
  }
  return {
    getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume() { active = true; ++serial; publish({ busy: false }); return load(); },
    suspend() { active = false; ++serial; },
    retry: () => load(true),
    saveHeader(submission: ReceiptHeaderSubmission, fence: ReceiptFence, expectedVersion?: number) {
      return execute(snapshot => {
        const base = envelope(snapshot, fence);
        if (submission.intent === 'create') return { ...base, command: 'inbound.create', payload: submission.payload };
        const row = snapshot.receipts.find(r => r.id === submission.receiptId);
        if (!row || row.version !== expectedVersion) return fail('STALE_VERSION');
        if (row.data.status !== 'DRAFT' || receiptCodeCount(snapshot, row.id)) return fail('RECEIPT_HEADER_LOCKED');
        return { ...base, command: 'inbound.update-header', entityId: row.id, expectedVersion: row.version, payload: { mode: row.data.mode, ...submission.payload } };
      });
    },
    post(id: string, expectedVersion: number, fence: ReceiptFence) {
      return execute(snapshot => {
        const base = envelope(snapshot, fence), row = snapshot.receipts.find(r => r.id === id);
        if (!row || row.version !== expectedVersion) return fail('STALE_VERSION');
        if (row.data.status !== 'SUBMITTED' || !row.data.appSubmissionId || row.data.submittedVersion !== row.version || !row.data.submittedHash) return fail('APP_SUBMISSION_REQUIRED');
        return { ...base, command: 'inbound.post', entityId: id, expectedVersion, payload: { receiptId: id } };
      });
    },
  };
}
