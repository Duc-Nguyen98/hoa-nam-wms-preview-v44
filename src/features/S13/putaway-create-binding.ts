import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { BoxData, OperationalCommand, OperationalOutcome, OperationalSnapshot, PutawayData, TypedOperationalRecord } from '../../contracts/operational-preview';
import { hasOperationalCommitProof, isOperationalOutcome, type createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { validateCommitSnapshot } from '../../preview-mock/business-atomic';
import type { BusinessRecord } from '../../preview-mock/business-repository';

export type PutawayCreateAdapter = ReturnType<typeof createOperationalWebAdapter>;
export type PutawayFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
export interface PutawaySelection { boxId: string; version: number; fence: PutawayFence }
export type PutawayBox = TypedOperationalRecord<BoxData>;
export type PutawayTask = TypedOperationalRecord<PutawayData>;
export interface PutawayCreateState {
  snapshot: OperationalSnapshot | null; catalog: CatalogSnapshot | null; busy: boolean; recovery: boolean; error: string;
  acceptedId: string | null; acceptedSequence: number; acceptedLocal: boolean; pendingRequest: OperationalCommand | null; archivedReconciled: boolean;
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const code = (error: unknown) => (error as { code?: string })?.code ?? 'READ_FAILED';
const scoped = (snapshot: OperationalSnapshot, data: { scenarioId: string; generation: number }) => data.scenarioId === snapshot.token.scenarioId && data.generation === snapshot.token.generation;
export function assertPutawayFence(snapshot: OperationalSnapshot, fence: PutawayFence) {
  if (!snapshot.scenario || snapshot.epoch !== fence.epoch || snapshot.token.scenarioId !== fence.scenarioId || snapshot.token.generation !== fence.generation) fail('STALE_SCENARIO');
}
export function boxQuantity(snapshot: OperationalSnapshot, id: string): number {
  return snapshot.stockEvents.filter(event => event.data.boxId === id && scoped(snapshot, event.data)).reduce((sum, event) => {
    const next = sum + event.data.signedQuantity;
    if (!Number.isSafeInteger(next)) return fail('QUANTITY_OVERFLOW');
    return next;
  }, 0);
}
/** Read projection of the handed-off putaway eligibility; the command rechecks it atomically. */
export function eligiblePutawayBoxes(snapshot: OperationalSnapshot): PutawayBox[] {
  if (!snapshot.scenario) return [];
  return snapshot.boxes.filter(box => scoped(snapshot, box.data) && box.data.posted && box.data.status === 'IN_STOCK' && box.data.trayId === null
    && snapshot.receipts.some(receipt => receipt.id === box.data.sourceReceiptId && scoped(snapshot, receipt.data) && receipt.data.status === 'POSTED')
    && !snapshot.putaways.some(task => scoped(snapshot, task.data) && task.data.boxId === box.id && task.data.status === 'DRAFT')
    && boxQuantity(snapshot, box.id) > 0);
}
export function refreshPutawaySelection(selection: PutawaySelection, snapshot: OperationalSnapshot): PutawaySelection {
  assertPutawayFence(snapshot, selection.fence);
  const box = eligiblePutawayBoxes(snapshot).find(row => row.id === selection.boxId);
  if (!box) return fail('BOX_NOT_ELIGIBLE');
  return { ...selection, version: box.version };
}
/** Revalidate an open confirmation after another tab changes the canonical view. */
export function putawaySelectionError(selection: PutawaySelection, snapshot: OperationalSnapshot): string {
  try {
    const current = refreshPutawaySelection(selection, snapshot);
    return current.version === selection.version ? '' : 'STALE_BOX_VERSION';
  } catch (error) { return code(error); }
}
export function assertPutawayAccepted(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome): PutawayTask {
  if (request.command !== 'putaway.create' || !isOperationalOutcome(outcome, request, snapshot.actorKey)) return fail('INVALID_RESPONSE');
  assertPutawayFence(snapshot, request);
  if (!hasOperationalCommitProof(snapshot, request, outcome)) return fail('INVALID_RESPONSE');
  const saved = outcome.receipt.record.data as PutawayData, payload = request.payload as { boxId: string; observedBoxVersion: number };
  const task = snapshot.putaways.find(row => row.id === outcome.receipt.entityId);
  const box = snapshot.boxes.find(row => row.id === payload.boxId && scoped(snapshot, row.data));
  const receipt = snapshot.receipts.find(row => row.id === saved.receiptId && scoped(snapshot, row.data));
  if (!task || task.kind !== 'putaway' || task.version < outcome.receipt.version || !scoped(snapshot, task.data)
    || !box || !receipt || receipt.data.status !== 'POSTED' || saved.boxId !== payload.boxId || saved.receiptId !== box.data.sourceReceiptId
    || saved.capturedBoxVersion !== payload.observedBoxVersion || !Number.isSafeInteger(saved.capturedContentRevision) || saved.capturedContentRevision < 1
    || !Number.isSafeInteger(saved.quantityAtCreate) || saved.quantityAtCreate <= 0 || saved.status !== 'DRAFT' || saved.trayId !== null || saved.cancellationReason !== null
    || task.data.boxId !== saved.boxId || task.data.receiptId !== saved.receiptId || task.data.capturedBoxVersion !== saved.capturedBoxVersion
    || task.data.capturedContentRevision !== saved.capturedContentRevision || task.data.quantityAtCreate !== saved.quantityAtCreate) return fail('INVALID_RESPONSE');
  validateCommitSnapshot([...snapshot.putaways, ...snapshot.boxes, ...snapshot.receipts, ...snapshot.auditEvents, ...snapshot.stockEvents, ...snapshot.commitSnapshots] as BusinessRecord[], outcome.receipt);
  return task;
}

/** No local repository: this controller only orchestrates the canonical S13 adapter. */
export function createPutawayCreateBinding(adapter: PutawayCreateAdapter, readCatalog: () => Promise<CatalogSnapshot>) {
  let state: PutawayCreateState = { snapshot: null, catalog: null, busy: false, recovery: false, error: '', acceptedId: null, acceptedSequence: 0, acceptedLocal: false, pendingRequest: null, archivedReconciled: false };
  let active = true, serial = 0;
  const listeners = new Set<() => void>(), issued = new Set<string>();
  const publish = (patch: Partial<PutawayCreateState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const current = (token: number) => active && serial === token;
  async function read() {
    const catalog = await readCatalog(), snapshot = await adapter.read();
    if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey) fail('STALE_DEMO_EPOCH');
    return { catalog, snapshot };
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, explicitRecovery = false) {
    const next = await read();
    const archived = request.epoch === next.snapshot.epoch && request.generation < next.snapshot.token.generation && request.scenarioId !== next.snapshot.token.scenarioId;
    if (archived && explicitRecovery) {
      if (request.command !== 'putaway.create' || !hasOperationalCommitProof(next.snapshot, request, outcome)) {
        if (current(token)) publish({ ...next, recovery: true, error: 'ARCHIVED_PROOF_UNAVAILABLE' });
        return;
      }
      if (!current(token)) return;
      await adapter.recovery.acknowledge(request.commandId);
      if (!current(token)) return;
      const refreshed = await read();
      if (current(token)) publish({ ...refreshed, recovery: false, pendingRequest: null, error: '', archivedReconciled: true });
      return;
    }
    const task = assertPutawayAccepted(next.snapshot, request, outcome);
    if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (current(token)) publish({ ...next, recovery: false, pendingRequest: null, error: '', acceptedId: task.id, acceptedSequence: state.acceptedSequence + 1, acceptedLocal: issued.has(request.commandId) });
  }
  async function load(retry = false) {
    if (state.busy || !active) return;
    const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE');
      const recovered = retry ? await adapter.recovery.retry() : await adapter.recovery.restore();
      if (!current(token)) return;
      publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : null });
      if (recovered.kind === 'blocked') fail(recovered.code);
      if (recovered.kind === 'committed' && retry) await accept(recovered.request, recovered.outcome, token, true);
      else {
        const next = await read();
        if (current(token)) publish({ ...next, error: recovered.kind === 'empty' ? '' : 'OUTCOME_UNKNOWN' });
      }
    } catch (error) { if (current(token)) publish({ snapshot: null, catalog: null, error: code(error) }); }
    finally { if (current(token)) publish({ busy: false }); }
  }
  async function create(selection: PutawaySelection) {
    if (!active || state.busy || state.recovery || !state.snapshot) return;
    const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false });
    try {
      const snapshot = state.snapshot!;
      assertPutawayFence(snapshot, selection.fence);
      const box = eligiblePutawayBoxes(snapshot).find(row => row.id === selection.boxId);
      if (!box) return fail('BOX_NOT_ELIGIBLE');
      if (box.version !== selection.version) return fail('STALE_BOX_VERSION');
      const request: OperationalCommand<'putaway.create'> = { command: 'putaway.create', commandId: crypto.randomUUID(), epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation, payload: { boxId: box.id, observedBoxVersion: selection.version } };
      issued.add(request.commandId);
      const outcome = await adapter.execute(request);
      if (!current(token)) return;
      publish({ recovery: true, pendingRequest: request });
      await accept(request, outcome, token);
    } catch (error) {
      if (!current(token)) return;
      const recovered = await adapter.recovery.restore().catch(() => ({ kind: 'blocked' as const, code: 'RECOVERY_UNAVAILABLE' }));
      if (!current(token)) return;
      publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : null, error: code(error),
        ...(recovered.kind !== 'empty' || ['SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN'].includes(code(error)) ? { snapshot: null, catalog: null } : {}) });
    } finally { if (current(token)) publish({ busy: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load, create,
    retry: () => load(true), resume() { active = true; ++serial; publish({ busy: false }); return load(); }, suspend() { active = false; ++serial; } };
}
