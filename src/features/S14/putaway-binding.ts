import type { OperationalCommand, OperationalOutcome, OperationalSnapshot, PutawayData, TypedOperationalRecord } from '../../contracts/operational-preview';
import { hasOperationalCommitProof, isOperationalOutcome, type createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { validateCommitSnapshot, type CommitSnapshotData } from '../../preview-mock/business-atomic';
import type { BusinessRecord } from '../../preview-mock/business-repository';

export type PutawayAdapter = ReturnType<typeof createOperationalWebAdapter>;
export type PutawayRecord = TypedOperationalRecord<PutawayData>;
export type PutawayFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
export interface PutawayEditor { id: string; version: number; fence: PutawayFence; action: 'confirm' | 'cancel'; trayId: string; reason: string }
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const code = (error: unknown) => (error as { code?: string })?.code ?? 'READ_FAILED';
export function assertPutawayFence(snapshot: OperationalSnapshot, fence: PutawayFence) {
  if (!snapshot.scenario || snapshot.epoch !== fence.epoch || snapshot.token.scenarioId !== fence.scenarioId || snapshot.token.generation !== fence.generation) fail('STALE_SCENARIO');
}
export function refreshPutawayEditor(editor: PutawayEditor, snapshot: OperationalSnapshot): PutawayEditor {
  assertPutawayFence(snapshot, editor.fence);
  const row = snapshot.putaways.find(r => r.id === editor.id);
  if (!row) return fail('TASK_NOT_FOUND');
  if (row.data.status !== 'DRAFT') return fail('TASK_NOT_DRAFT');
  // This refresh never rebases the task's captured BOX content or the user's draft.
  return { ...editor, version: row.version };
}
export function normalizePutawayReason(reason: string) {
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(reason)) return fail('VALIDATION_FAILED');
  const value = reason.trim().normalize('NFC');
  if ([...value].length < 1 || [...value].length > 500) return fail('VALIDATION_FAILED');
  return value;
}
export const boxQuantity = (snapshot: OperationalSnapshot, id: string) => snapshot.stockEvents.filter(r => r.data.boxId === id).reduce((total, r) => total + r.data.signedQuantity, 0);
export function availablePutawayTrays(snapshot: OperationalSnapshot, warehouseId: string) {
  return snapshot.setupMasters.filter(r => {
    const d = r.data as { warehouseId: string; active: boolean; locationId: string };
    return r.kind === 'operational-setup-tray' && d.active && d.warehouseId === warehouseId && snapshot.setupMasters.some(location => {
      const linked = location.data as { active: boolean; warehouseId: string };
      return location.id === d.locationId && location.kind === 'operational-setup-location' && linked.active && linked.warehouseId === warehouseId;
    });
  });
}
export function assertPutawayAccepted(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome) {
  if (!['putaway.confirm', 'putaway.cancel'].includes(request.command) || !isOperationalOutcome(outcome, request, snapshot.actorKey)) fail('INVALID_RESPONSE');
  assertPutawayFence(snapshot, request);
  if (!hasOperationalCommitProof(snapshot, request, outcome)) fail('INVALID_RESPONSE');
  const records = [...snapshot.putaways, ...snapshot.boxes, ...snapshot.receipts, ...snapshot.stockEvents, ...snapshot.auditEvents, ...snapshot.commitSnapshots] as BusinessRecord[];
  validateCommitSnapshot(records, outcome.receipt);
  const proof = snapshot.commitSnapshots.find(r => r.id === outcome.receipt.commitSnapshotId)!.data as CommitSnapshotData;
  const changed = proof.changes.map(c => JSON.parse(c.canonicalRecord) as BusinessRecord);
  const saved = outcome.receipt.record.data as PutawayData, row = snapshot.putaways.find(r => r.id === outcome.receipt.entityId);
  if (!row || row.version < outcome.receipt.version || row.data.boxId !== saved.boxId || row.data.receiptId !== saved.receiptId || proof.eventIds.length || changed.some(r => r.kind === 'stock-event')) fail('INVALID_RESPONSE');
  const box = snapshot.boxes.find(r => r.id === saved.boxId), receipt = snapshot.receipts.find(r => r.id === saved.receiptId);
  if (!box || !receipt || box.data.sourceReceiptId !== receipt.id) fail('INVALID_RESPONSE');
  if (request.command === 'putaway.confirm') {
    const mapped = changed.find(r => r.kind === 'box' && r.id === saved.boxId) as OperationalSnapshot['boxes'][number] | undefined;
    if (saved.status !== 'CONFIRMED' || saved.trayId !== (request.payload as { trayId: string }).trayId || !mapped || mapped.data.trayId !== saved.trayId || mapped.data.contentRevision !== saved.capturedContentRevision || mapped.version !== saved.capturedBoxVersion + 1 || (box!.version === mapped.version && box!.data.trayId !== saved.trayId)) fail('INVALID_RESPONSE');
  } else if (saved.status !== 'CANCELLED' || saved.cancellationReason !== (request.payload as { reason: string }).reason || changed.some(r => r.kind === 'box')) fail('INVALID_RESPONSE');
  return row;
}
export interface PutawayBindingState {
  snapshot: OperationalSnapshot | null; busy: boolean; recovery: boolean; error: string;
  acceptedId: string | null; acceptedSequence: number; acceptedLocal: boolean; archivedReconciled: boolean;
}
/** Uses the canonical adapter's journal; this module owns only screen orchestration. */
export function createPutawayBinding(adapter: PutawayAdapter) {
  let state: PutawayBindingState = { snapshot: null, busy: false, recovery: false, error: '', acceptedId: null, acceptedSequence: 0, acceptedLocal: false, archivedReconciled: false };
  const listeners = new Set<() => void>(), issued = new Set<string>();
  let active = true, serial = 0;
  const publish = (patch: Partial<PutawayBindingState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const current = (token: number) => active && token === serial;
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, explicitRecovery = false) {
    const snapshot = await adapter.read();
    const archived = request.epoch === snapshot.epoch && request.generation < snapshot.token.generation && request.scenarioId !== snapshot.token.scenarioId;
    if (archived && explicitRecovery) {
      if (!['putaway.confirm', 'putaway.cancel'].includes(request.command) || !hasOperationalCommitProof(snapshot, request, outcome)) {
        if (current(token)) publish({ snapshot, error: 'ARCHIVED_PROOF_UNAVAILABLE', recovery: true });
        return;
      }
      if (!current(token)) return;
      await adapter.recovery.acknowledge(request.commandId);
      if (current(token)) publish({ snapshot, recovery: false, error: '', archivedReconciled: true });
      return;
    }
    assertPutawayAccepted(snapshot, request, outcome);
    if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (current(token)) publish({ snapshot, recovery: false, error: '', acceptedId: outcome.receipt.entityId, acceptedSequence: state.acceptedSequence + 1, acceptedLocal: issued.has(request.commandId) });
  }
  async function load(retry = false) {
    if (!active || state.busy) return;
    const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE');
      const recovered = retry ? await adapter.recovery.retry() : await adapter.recovery.restore();
      if (!current(token)) return;
      publish({ recovery: recovered.kind !== 'empty' });
      if (recovered.kind === 'blocked') fail(recovered.code);
      if (retry && recovered.kind === 'committed') await accept(recovered.request, recovered.outcome, token, true);
      else { const snapshot = await adapter.read(); if (current(token)) publish({ snapshot, error: recovered.kind === 'empty' ? '' : 'OUTCOME_UNKNOWN' }); }
    } catch (error) { if (current(token)) publish({ snapshot: null, error: code(error) }); }
    finally { if (current(token)) publish({ busy: false }); }
  }
  async function save(editor: PutawayEditor) {
    if (!active || state.busy || state.recovery || !state.snapshot) return;
    const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try {
      const snapshot = state.snapshot!; assertPutawayFence(snapshot, editor.fence);
      const row = snapshot.putaways.find(r => r.id === editor.id);
      if (!row || row.version !== editor.version) fail('STALE_VERSION');
      if (row!.data.status !== 'DRAFT') fail('TASK_NOT_DRAFT');
      const request: OperationalCommand = { commandId: crypto.randomUUID(), epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation,
        entityId: editor.id, expectedVersion: editor.version, command: editor.action === 'confirm' ? 'putaway.confirm' : 'putaway.cancel',
        payload: editor.action === 'confirm' ? { trayId: editor.trayId } : { reason: normalizePutawayReason(editor.reason) } };
      issued.add(request.commandId);
      const outcome = await adapter.execute(request);
      if (!current(token)) return;
      publish({ recovery: true }); await accept(request, outcome, token);
    } catch (error) {
      if (!current(token)) return;
      const recovered = await adapter.recovery.restore().catch(() => ({ kind: 'blocked' as const }));
      if (current(token)) publish({ error: code(error), recovery: recovered.kind !== 'empty', ...(recovered.kind !== 'empty' || ['SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN'].includes(code(error)) ? { snapshot: null } : {}) });
    } finally { if (current(token)) publish({ busy: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load, save, retry: () => load(true),
    resume() { active = true; ++serial; publish({ busy: false }); return load(); }, suspend() { active = false; ++serial; } };
}
