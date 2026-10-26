import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalCommand, OperationalOutcome, OperationalSnapshot, OutboundData, TypedOperationalRecord } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { hasOperationalCommitProof, isOperationalOutcome } from '../../data/http/operational-preview-adapter';
import { validateCommitSnapshot } from '../../preview-mock/business-atomic';
import type { BusinessRecord } from '../../preview-mock/business-repository';

export type OutboundAdapter = ReturnType<typeof createOperationalWebAdapter>;
export type OutboundRecord = TypedOperationalRecord<OutboundData>;
export type OutboundFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
export type OutboundAction = 'outbound.receive' | 'outbound.post';
export type OutboundFailureStage = 'recovery-read' | 'catalog-read' | 'operational-read' | 'commit-proof' | 'command';
export interface OutboundIntent { id: string; code: string; version: number; fence: OutboundFence; command: OutboundAction }
export interface OutboundBindingState {
  snapshot: OperationalSnapshot | null; catalog: CatalogSnapshot | null;
  busy: boolean; recovery: boolean; error: string; acceptedId: string | null; acceptedSequence: number; acceptedLocal: boolean;
  pendingRequest: OperationalCommand | null; archivedReconciled: boolean;
  failureStage: OutboundFailureStage | null;
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const errorCode = (e: unknown) => (e as { code?: string })?.code ?? 'READ_FAILED';
/** Validate the S15 projection before rendering nested data from an adapter. */
export function assertOutboundReadShape(snapshot: OperationalSnapshot) {
  const strings=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(item=>typeof item==='string')&&new Set(value).size===value.length;
  if (!snapshot || !snapshot.token || !Array.isArray(snapshot.outbounds) || !Array.isArray(snapshot.physical)) return fail('INVALID_RESPONSE');
  const ids=new Set<string>();
  for (const row of snapshot.outbounds) {
    const data=row?.data;
    if (!row || typeof row.id!=='string' || !Number.isSafeInteger(row.version) || row.version<1 || ids.has(row.id) || !data || typeof data.code!=='string' || typeof data.appRequestId!=='string'
      || typeof data.recipientId!=='string' || !['DRAFT','SCANNING','SUBMITTED','READY','POSTED'].includes(data.status)
      || !strings(data.allocatedPhysicalIds) || !strings(data.postedEventIds) || !Array.isArray(data.requestedLines)
      || data.requestedLines.some(line=>!line || typeof line.id!=='string' || typeof line.skuId!=='string' || !Number.isSafeInteger(line.quantity) || line.quantity<=0)
      || new Set(data.requestedLines.map(line=>line.id)).size!==data.requestedLines.length
      || data.scenarioId!==snapshot.token.scenarioId || data.generation!==snapshot.token.generation) return fail('INVALID_RESPONSE');
    ids.add(row.id);
  }
  if(new Set(snapshot.physical.map(row=>row?.id)).size!==snapshot.physical.length) return fail('INVALID_RESPONSE');
  for(const row of snapshot.physical) if(!row?.data || typeof row.id!=='string' || typeof row.data.physicalCode!=='string' || typeof row.data.skuId!=='string') return fail('INVALID_RESPONSE');
}
const durableCommandFeedback = new Set(['STALE_VERSION', 'SUBMISSION_CHANGED', 'OUTBOUND_NOT_RECEIVABLE', 'OUTBOUND_NOT_POSTABLE', 'APP_SUBMISSION_REQUIRED', 'PHYSICAL_UNAVAILABLE', 'INSUFFICIENT_STOCK']);
export function assertOutboundFence(snapshot: OperationalSnapshot, fence: OutboundFence) {
  if (!snapshot.scenario || snapshot.token.epoch !== fence.epoch || snapshot.token.scenarioId !== fence.scenarioId || snapshot.token.generation !== fence.generation) fail('STALE_SCENARIO');
}
export function assertOutboundAccepted(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome) {
  if (!['outbound.receive', 'outbound.post'].includes(request.command) || !isOperationalOutcome(outcome, request, snapshot.actorKey)) fail('INVALID_RESPONSE');
  assertOutboundFence(snapshot, request);
  const row = snapshot.outbounds.find(r => r.id === request.entityId), saved = outcome.receipt.record.data as OutboundData;
  if (!row || row.kind !== 'outbound' || row.id !== outcome.receipt.entityId || (request.payload as { outboundId?: string }).outboundId !== row.id || row.version < outcome.receipt.version
    || snapshot.snapshotRevision < outcome.receipt.snapshotRevision || row.data.scenarioId !== request.scenarioId || row.data.generation !== request.generation) return fail('INVALID_RESPONSE');
  validateCommitSnapshot([...snapshot.outbounds, ...snapshot.physical, ...snapshot.stockEvents, ...snapshot.auditEvents, ...snapshot.commitSnapshots] as BusinessRecord[], outcome.receipt);
  if (!saved.submissionId || !saved.submittedHash || !saved.recipientId || !saved.recipientSnapshot || !saved.requestedLines.length) fail('INVALID_RESPONSE');
  // Receive proof remains valid when another tab subsequently posts this same aggregate.
  if (request.command === 'outbound.receive') {
    if (saved.status !== 'READY' || saved.postedEventIds.length || !['READY', 'POSTED'].includes(row.data.status)) fail('INVALID_RESPONSE');
  } else {
    if (saved.status !== 'POSTED' || row.data.status !== 'POSTED' || saved.postedEventIds.length !== saved.requestedLines.length || new Set(saved.postedEventIds).size !== saved.postedEventIds.length) fail('INVALID_RESPONSE');
    const events = saved.postedEventIds.map(id => snapshot.stockEvents.find(event => event.id === id));
    const seen = new Set<string>();
    for (const line of saved.requestedLines) {
      const matching = events.filter(event => event?.data.sourceLineId === line.id), event = matching[0];
      if (matching.length !== 1 || !event || event.data.eventType !== 'OUTBOUND_POST' || event.data.documentId !== row.id
        || event.data.commandId !== request.commandId || event.data.commitSnapshotId !== outcome.receipt.commitSnapshotId || event.data.skuId !== line.skuId
        || event.data.scenarioId !== request.scenarioId || event.data.generation !== request.generation || event.data.signedQuantity !== -line.quantity || event.data.physicalIds.length !== line.quantity) return fail('INVALID_RESPONSE');
      for (const id of event.data.physicalIds) {
        const physical = snapshot.physical.find(p => p.id === id);
        if (seen.has(id) || !saved.allocatedPhysicalIds.includes(id) || !physical || physical.data.skuId !== line.skuId || physical.data.status !== 'ISSUED' || physical.data.issuedDocumentId !== row.id) fail('INVALID_RESPONSE');
        seen.add(id);
      }
    }
    if (seen.size !== saved.allocatedPhysicalIds.length) fail('INVALID_RESPONSE');
  }
  return row;
}

/** S15 orchestration only; the canonical adapter owns commands, authority and durable recovery. */
export function createOutboundBinding(adapter: OutboundAdapter, readCatalog: () => Promise<CatalogSnapshot>) {
  let state: OutboundBindingState = { snapshot: null, catalog: null, busy: false, recovery: false, error: '', acceptedId: null, acceptedSequence: 0, acceptedLocal: false, pendingRequest: null, archivedReconciled: false, failureStage: null };
  const listeners = new Set<() => void>(), issued = new Set<string>();
  let active = true, serial = 0;
  let commandFeedback: { code: string; actorKey: string; fence: OutboundFence } | null = null;
  const publish = (patch: Partial<OutboundBindingState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const current = (token: number) => active && token === serial;
  async function read(mark: (stage: OutboundFailureStage) => void) {
    for (let attempt=0; attempt<3; attempt++) {
      mark('catalog-read'); const catalog = await readCatalog();
      mark('operational-read'); const snapshot = await adapter.read();
      if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey) fail('STALE_DEMO_EPOCH');
      assertOutboundReadShape(snapshot);
      if (catalog.snapshotRevision === snapshot.snapshotRevision) return { snapshot, catalog };
    }
    return fail('STALE_SNAPSHOT');
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, mark: (stage: OutboundFailureStage) => void, explicitRecovery = false) {
    const next = await read(mark);
    mark('commit-proof');
    const archived = request.epoch === next.snapshot.epoch && request.generation < next.snapshot.token.generation && request.scenarioId !== next.snapshot.token.scenarioId;
    if (archived && explicitRecovery) {
      if (!['outbound.receive', 'outbound.post'].includes(request.command) || !hasOperationalCommitProof(next.snapshot, request, outcome)) {
        if (current(token)) publish({ ...next, error: 'ARCHIVED_PROOF_UNAVAILABLE', recovery: true, failureStage: 'commit-proof' });
        return;
      }
      if (!current(token)) return;
      await adapter.recovery.acknowledge(request.commandId);
      if (current(token)) publish({ ...next, recovery: false, error: '', pendingRequest: null, archivedReconciled: true, failureStage: null });
      return;
    }
    assertOutboundAccepted(next.snapshot, request, outcome);
    if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (current(token)) publish({ ...next, recovery: false, error: '', acceptedId: outcome.receipt.entityId, acceptedSequence: state.acceptedSequence + 1, acceptedLocal: issued.has(request.commandId), pendingRequest: null, failureStage: null });
  }
  async function load(retry = false, background = false) {
    if (state.busy || !active) return;
    const retained = background ? commandFeedback : null;
    if (!background) commandFeedback = null;
    let phase: OutboundFailureStage = 'recovery-read';
    const mark = (stage: OutboundFailureStage) => { phase = stage; };
    const token = ++serial; publish({ busy: true, error: retained?.code ?? '', archivedReconciled: false, failureStage: retained ? 'command' : null });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE');
      const recovered = retry ? await adapter.recovery.retry() : await adapter.recovery.restore();
      if (!current(token)) return;
      // A blocked journal read cannot disprove a request already observed here.
      publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : recovered.kind === 'empty' ? null : state.pendingRequest });
      if (recovered.kind === 'blocked') fail(recovered.code);
      if (recovered.kind === 'committed' && retry) await accept(recovered.request, recovered.outcome, token, mark, true);
      else {
        const next = await read(mark);
        if (current(token)) {
          // A focus refresh is not an acknowledgement of a rejected command.
          // Retain feedback only after the same actor and scenario are read successfully.
          const sameScope = retained && next.snapshot.scenario && next.snapshot.actorKey === retained.actorKey
            && next.snapshot.token.epoch === retained.fence.epoch && next.snapshot.token.scenarioId === retained.fence.scenarioId
            && next.snapshot.token.generation === retained.fence.generation;
          commandFeedback = recovered.kind === 'empty' && sameScope ? retained : null;
          publish({ ...next, error: recovered.kind !== 'empty' ? 'OUTCOME_UNKNOWN' : commandFeedback?.code ?? '', failureStage: commandFeedback ? 'command' : null });
        }
      }
    } catch (error) { if (current(token)) { commandFeedback = null; publish({ snapshot: null, catalog: null, error: errorCode(error), failureStage: phase }); } }
    finally { if (current(token)) publish({ busy: false }); }
  }
  async function act(intent: OutboundIntent) {
    if (!active || state.busy || state.recovery || !state.snapshot) return;
    commandFeedback = null;
    let phase: OutboundFailureStage = 'command', attemptedRequest: OperationalCommand | null = null;
    const mark = (stage: OutboundFailureStage) => { phase = stage; };
    const token = ++serial; publish({ busy: true, error: '', archivedReconciled: false, failureStage: null });
    try {
      const snapshot = state.snapshot!; assertOutboundFence(snapshot, intent.fence);
      const row = snapshot.outbounds.find(r => r.id === intent.id);
      if (!row || row.version !== intent.version) return fail('STALE_VERSION');
      if (!['outbound.receive', 'outbound.post'].includes(intent.command)) return fail('WRONG_COMMAND_SURFACE');
      if (row.data.status !== (intent.command === 'outbound.receive' ? 'SUBMITTED' : 'READY')) return fail(intent.command === 'outbound.receive' ? 'OUTBOUND_NOT_RECEIVABLE' : 'OUTBOUND_NOT_POSTABLE');
      if (!row.data.submissionId || !row.data.submittedHash || row.data.submittedVersion === null) return fail('APP_SUBMISSION_REQUIRED');
      const request: OperationalCommand = { commandId: crypto.randomUUID(), epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation,
        command: intent.command, entityId: row.id, expectedVersion: intent.version, payload: { outboundId: row.id } };
      issued.add(request.commandId);
      attemptedRequest = request;
      const outcome = await adapter.execute(request);
      if (!current(token)) return;
      publish({ recovery: true, pendingRequest: request }); await accept(request, outcome, token, mark);
    } catch (error) {
      if (!current(token)) return;
      const recovered = await adapter.recovery.restore().catch(() => ({ kind: 'blocked' as const, code: 'RECOVERY_UNAVAILABLE' }));
      if (!current(token)) return;
      const code = errorCode(error);
      if (recovered.kind === 'empty' && state.snapshot && durableCommandFeedback.has(code)) {
        commandFeedback = { code, actorKey: state.snapshot.actorKey, fence: { ...state.snapshot.token } };
      }
      publish({ recovery: recovered.kind !== 'empty', pendingRequest: recovered.kind === 'pending' || recovered.kind === 'committed' ? recovered.request : recovered.kind === 'empty' ? null : attemptedRequest ?? state.pendingRequest, error: errorCode(error), failureStage: phase,
        ...(recovered.kind !== 'empty' || ['SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN'].includes(errorCode(error)) ? { snapshot: null, catalog: null } : {}) });
    } finally { if (current(token)) publish({ busy: false }); }
  }
  return {
    getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load, act, refresh: () => load(false, true),
    resume() { active = true; ++serial; publish({ busy: false }); return load(); }, suspend() { active = false; ++serial; }, retry: () => load(true),
  };
}
