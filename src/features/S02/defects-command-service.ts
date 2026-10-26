import { validateDefectDraft } from '../../contracts/defects';
import type { DefectDraft, DefectRow, DefectsCommandAdapter, DefectsCommandContext, DefectsCommandOperation, DefectsCommandOutcome, DefectsCommandRecoveryResult, DefectsCommandRequest, DefectsCommandTarget, DefectsFormErrors, DefectsPolicyClause } from '../../contracts/defects';

/** Inject only an authoritative policy. These UI checks never authorize the repository. */
export interface DefectsCommandPolicy {
  p01?: (operation: DefectsCommandOperation) => boolean;
  /** Only the approved saved-field subset locks code; unbound local drafts retain their existing behavior. */
  savedCodeEditable?: boolean;
  /** P02's complete Create serializer; no default normalization/uniqueness rule is supplied. */
  p02?: (draft: Readonly<DefectDraft>) => unknown;
  /** P03's complete Update serializer; draft code remains editable until that policy exists. */
  p03?: (draft: Readonly<DefectDraft>, original: Readonly<DefectDraft>) => unknown;
}
export interface DefectsSaveInput {
  operation: DefectsCommandOperation;
  draft: DefectDraft;
  original: DefectDraft;
  context?: DefectsCommandContext;
  target?: DefectsCommandTarget;
}
export type DefectsSaveResult =
  | { kind: 'committed'; outcome: DefectsCommandOutcome }
  | { kind: 'validation'; fieldErrors: DefectsFormErrors }
  | { kind: 'blocked'; missing: DefectsPolicyClause[]; reason: 'POLICY_PENDING' | 'ADAPTER_UNAVAILABLE' | 'COMMAND_CONTEXT_UNAVAILABLE' | 'RECOVERY_REQUIRED' }
  | { kind: 'failed'; code: string; status: number | null; fieldErrors: DefectsFormErrors; outcomeUnknown: boolean };
export interface DefectsCommandState {
  phase: 'idle' | 'submitting' | 'committed' | 'validation' | 'blocked' | 'failed' | 'outcome-unknown';
  result: DefectsSaveResult | null;
  recovery: DefectsCommandRecoveryResult | { kind: 'loading' | 'acknowledging' } | null;
  recoveryReadVerified: boolean;
  recoveryIssue: string | null;
}
export class DefectsCommandError extends Error {
  constructor(readonly code: string, readonly status: number | null = null, readonly details?: unknown, readonly outcomeUnknown = false) {
    super(code); this.name = 'DefectsCommandError';
  }
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const row = (v: unknown): v is DefectRow => object(v)
  && ['key', 'ordinal', 'code', 'name', 'description', 'statusLabel'].every(k => typeof v[k] === 'string')
  && (v.status === 'active' || v.status === 'inactive');

/** A matched committed receipt, never an HTTP success flag, establishes success. */
export function isDefectsCommandOutcome(value: unknown, request: Readonly<DefectsCommandRequest>): value is DefectsCommandOutcome {
  if (!object(value) || typeof value.replayed !== 'boolean' || !object(value.receipt)) return false;
  const r = value.receipt, creating = request.command === 'defects.create';
  return r.mode === 'MOCK' && r.command === request.command && r.commandId === request.commandId && uuid(r.commandId)
    && r.epoch === request.epoch && uuid(r.epoch) && typeof r.actorKey === 'string' && !!r.actorKey
    && typeof r.entityId === 'string' && !!r.entityId && positive(r.version) && typeof r.changed === 'boolean'
    && (creating ? r.previousVersion === null && r.version === 1 && r.changed === true
      : r.entityId === request.entityId && r.previousVersion === request.expectedVersion && positive(request.expectedVersion)
        && r.version === request.expectedVersion + Number(r.changed))
    && typeof r.committedAt === 'string' && Number.isFinite(Date.parse(r.committedAt)) && positive(r.snapshotRevision)
    && object(r.record) && r.record.id === r.entityId && r.record.kind === 'defect' && r.record.version === r.version && row(r.record.data);
}

function failure(error: unknown): Extract<DefectsSaveResult, { kind: 'failed' }> {
  const raw = object(error) ? error : {}, code = typeof raw.code === 'string' ? raw.code : 'OUTCOME_UNKNOWN';
  const status = typeof raw.status === 'number' ? raw.status : null;
  const knownRejection = status !== null && status >= 400 && status < 500 && status !== 408
    || ['MOCK_STORAGE_UNAVAILABLE', 'MOCK_STATE_INVALID'].includes(code);
  const fieldErrors: DefectsFormErrors = {};
  if (object(raw.details) && object(raw.details.fieldErrors)) {
    for (const key of ['code', 'name', 'description', 'status'] as const) {
      if (typeof raw.details.fieldErrors[key] === 'string') fieldErrors[key] = raw.details.fieldErrors[key];
    }
  }
  return { kind: 'failed', code, status, fieldErrors, outcomeUnknown: raw.outcomeUnknown === true || !knownRejection };
}

/** Single-flight saves and exact replay after lost responses; no business policy is implemented here. */
export function createDefectsCommandService(options: { adapter?: DefectsCommandAdapter; policy?: DefectsCommandPolicy; uuid?: () => string } = {}) {
  const recoveryApi = options.adapter?.recovery;
  let state: DefectsCommandState = { phase: 'idle', result: null, recovery: recoveryApi ? { kind: 'loading' } : null,
    recoveryReadVerified: false, recoveryIssue: null };
  let inFlight: Promise<DefectsSaveResult> | null = null;
  let recoveryFlight: Promise<DefectsSaveResult | null> | null = null;
  let recoveryRestored = !recoveryApi;
  let unresolved: DefectsCommandRequest | null = null;
  const listeners = new Set<() => void>();
  const publish = (phase: DefectsCommandState['phase'], result: DefectsSaveResult | null) => {
    state = { ...state, phase, result }; listeners.forEach(listener => listener());
  };
  const recoveryBlocksSave = () => !!recoveryApi && (!recoveryRestored || state.recovery?.kind !== 'empty');
  function availability(operation: DefectsCommandOperation) {
    const missing: DefectsPolicyClause[] = [];
    let writer = false;
    try { writer = options.policy?.p01?.(operation) === true; } catch { /* Deny malformed policy resolvers. */ }
    if (!writer) missing.push('P01');
    if (operation === 'create' && typeof options.policy?.p02 !== 'function') missing.push('P02');
    if (operation === 'update' && typeof options.policy?.p03 !== 'function') missing.push('P03');
    return { available: !missing.length && !!options.adapter && !recoveryBlocksSave(), missing };
  }
  function settle(result: DefectsSaveResult) {
    publish(result.kind === 'failed' && result.outcomeUnknown ? 'outcome-unknown' : result.kind, result);
    return result;
  }
  function receiveRecovery(value: DefectsCommandRecoveryResult): DefectsSaveResult | null {
    const copy = structuredClone(value);
    if (copy.kind === 'pending' || copy.kind === 'committed') {
      const request = copy.request;
      if (!request || !['defects.create', 'defects.update'].includes(request.command) || !uuid(request.commandId) || !uuid(request.epoch)
        || request.command === 'defects.update' && (!request.entityId || !positive(request.expectedVersion))
        || copy.kind === 'committed' && !isDefectsCommandOutcome(copy.outcome, request)) {
        return receiveRecovery({ kind: 'blocked', code: 'RECOVERY_STATE_INVALID' });
      }
    }
    recoveryRestored = true;
    state = { ...state, recovery: copy, recoveryReadVerified: false, recoveryIssue: null };
    unresolved = null; // Durable retry belongs to the host, never this screen's draft.
    if (copy.kind === 'committed') return settle({ kind: 'committed', outcome: structuredClone(copy.outcome) });
    if (copy.kind === 'pending' || copy.kind === 'blocked') return settle({ kind: 'failed',
      code: copy.code ?? 'RECOVERY_PENDING', status: null, fieldErrors: {}, outcomeUnknown: true });
    publish('idle', null);
    return null;
  }
  function readRecovery(retry: boolean): Promise<DefectsSaveResult | null> {
    if (!recoveryApi) return Promise.resolve(null);
    if (recoveryFlight) return recoveryFlight;
    if (inFlight) return inFlight;
    state = { ...state, recovery: { kind: 'loading' }, recoveryReadVerified: false, recoveryIssue: null };
    publish(retry ? 'submitting' : state.phase, state.result);
    const pending = Promise.resolve().then(async () => {
      try { return receiveRecovery(await (retry ? recoveryApi.retry() : recoveryApi.restore())); }
      catch (error) { return receiveRecovery({ kind: 'blocked', code: failure(error).code }); }
    });
    recoveryFlight = pending;
    void pending.finally(() => { if (recoveryFlight === pending) recoveryFlight = null; });
    return pending;
  }
  function execute(request: DefectsCommandRequest): Promise<DefectsSaveResult> {
    const recovering = unresolved !== null;
    publish('submitting', null);
    // Start asynchronously so even a synchronously throwing injected adapter is single-flight.
    const pending = Promise.resolve().then(async (): Promise<DefectsSaveResult> => {
      try {
        const outcome = await options.adapter!.execute(structuredClone(request));
        if (!isDefectsCommandOutcome(outcome, request)) throw new DefectsCommandError('INVALID_RESPONSE', null, undefined, true);
        if (recoveryApi) return receiveRecovery({ kind: 'committed', request, outcome })!;
        unresolved = null;
        return settle({ kind: 'committed', outcome: structuredClone(outcome) });
      } catch (error) {
        const result = failure(error);
        if (recoveryApi) {
          // The host journal decides whether a rejected attempt is definitive or remains uncertain.
          try {
            const recovered = receiveRecovery(await recoveryApi.restore());
            if (recovered) return recovered;
          } catch (recoveryError) {
            return receiveRecovery({ kind: 'blocked', code: failure(recoveryError).code })!;
          }
          return settle(result);
        }
        // A denial of a replay does not prove the earlier, uncertain command failed to commit.
        if (recovering) result.outcomeUnknown = true;
        unresolved = result.outcomeUnknown ? structuredClone(request) : null;
        return settle(result);
      }
    });
    inFlight = pending;
    void pending.finally(() => { if (inFlight === pending) inFlight = null; });
    return pending;
  }
  return {
    availability,
    savedCodeEditable: () => options.policy?.savedCodeEditable !== false,
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restoreRecovery: () => readRecovery(false),
    retryRecovery: () => readRecovery(true),
    async confirmRecoveryRead(commandId: string) {
      if (state.recovery?.kind !== 'committed' || state.recovery.request.commandId !== commandId) return false;
      // The session may change while the canonical read is in flight. Revalidate
      // host authority before retaining a private receipt or enabling acknowledgment.
      await readRecovery(false);
      if (state.recovery?.kind !== 'committed' || state.recovery.request.commandId !== commandId) return false;
      state = { ...state, recoveryReadVerified: true, recoveryIssue: null }; publish(state.phase, state.result); return true;
    },
    async acknowledgeRecovery() {
      if (!recoveryApi || recoveryFlight || inFlight || state.recovery?.kind !== 'committed' || !state.recoveryReadVerified) return false;
      const committed = structuredClone(state.recovery);
      state = { ...state, recovery: { kind: 'acknowledging' } }; publish(state.phase, state.result);
      try {
        await recoveryApi.acknowledge(committed.request.commandId);
        receiveRecovery({ kind: 'empty' }); return true;
      } catch (error) {
        const issue = failure(error).code;
        if (['RECOVERY_ACTOR_MISMATCH', 'SESSION_EXPIRED', 'CONFIRMATION_REQUIRED',
          'RECOVERY_CONTEXT_UNAVAILABLE', 'RECOVERY_CONTEXT_CHANGED', 'STALE_DEMO_EPOCH'].includes(issue)) {
          // Acknowledgment can delete the journal before an authority change is detected.
          // An empty restore must not reopen the old actor's result or fresh-save controls.
          receiveRecovery({ kind: 'blocked', code: issue }); return false;
        }
        state = { ...state, recovery: { kind: 'loading' } }; publish(state.phase, state.result);
        try {
          receiveRecovery(await recoveryApi.restore());
          if (state.recovery?.kind === 'committed' && state.recovery.request.commandId === committed.request.commandId) {
            state = { ...state, recoveryReadVerified: true, recoveryIssue: issue }; publish(state.phase, state.result);
          }
        } catch (restoreError) { receiveRecovery({ kind: 'blocked', code: failure(restoreError).code }); }
        return false;
      }
    },
    /** Uncertain commands cannot be silently discarded or replaced with a fresh command ID. */
    reset() { if (inFlight || recoveryFlight || unresolved || recoveryBlocksSave()) return false; publish('idle', null); return true; },
    save(input: DefectsSaveInput): Promise<DefectsSaveResult> {
      if (inFlight) return inFlight;
      if (recoveryApi && !recoveryRestored) return readRecovery(false).then(() => this.save(input));
      if (recoveryBlocksSave()) return Promise.resolve({ kind: 'blocked', missing: [], reason: 'RECOVERY_REQUIRED' });
      if (unresolved) return execute(unresolved);
      const fieldErrors = validateDefectDraft(input.draft);
      if (Object.keys(fieldErrors).length) return Promise.resolve(settle({ kind: 'validation', fieldErrors }));
      const ready = availability(input.operation);
      if (ready.missing.length) return Promise.resolve(settle({ kind: 'blocked', missing: ready.missing, reason: 'POLICY_PENDING' }));
      if (!options.adapter) return Promise.resolve(settle({ kind: 'blocked', missing: [], reason: 'ADAPTER_UNAVAILABLE' }));
      if (!input.context || !uuid(input.context.epoch) || !positive(input.context.snapshotRevision) || !object(input.context.records)
        || input.operation === 'update' && (!input.target?.entityId || !positive(input.target.version)
          || !Object.values(input.context.records).some(target => target.entityId === input.target!.entityId && target.version === input.target!.version))) {
        return Promise.resolve(settle({ kind: 'blocked', missing: [], reason: 'COMMAND_CONTEXT_UNAVAILABLE' }));
      }
      let payload: unknown;
      try {
        const draft = Object.freeze(structuredClone(input.draft));
        payload = input.operation === 'create' ? options.policy!.p02!(draft)
          : options.policy!.p03!(draft, Object.freeze(structuredClone(input.original)));
        payload = structuredClone(payload);
      } catch (error) { return Promise.resolve(settle({ ...failure(error), outcomeUnknown: false })); }
      let commandId: string;
      try { commandId = (options.uuid ?? (() => crypto.randomUUID()))(); }
      catch { return Promise.resolve(settle({ kind: 'failed', code: 'INVALID_COMMAND_ID', status: 422, fieldErrors: {}, outcomeUnknown: false })); }
      if (!uuid(commandId)) return Promise.resolve(settle({ kind: 'failed', code: 'INVALID_COMMAND_ID', status: 422, fieldErrors: {}, outcomeUnknown: false }));
      return execute({ command: input.operation === 'create' ? 'defects.create' : 'defects.update', commandId,
        epoch: input.context.epoch, payload,
        ...(input.operation === 'update' ? { entityId: input.target!.entityId, expectedVersion: input.target!.version } : {}) });
    },
  };
}
export type DefectsCommandService = ReturnType<typeof createDefectsCommandService>;
