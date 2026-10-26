import type { BusinessActor } from '../preview-mock/business-repository';
import { canonicalBusinessJson } from '../preview-mock/business-repository';
import type { BusinessPersistence } from '../preview-mock/business-persistence';
import { startReadDiagnostic, type ReadDiagnosticTrace } from './read-diagnostics';
import { startCommandDiagnostic, updateCommandDiagnostic, type CommandDiagnosticOptions, type CommandDiagnosticStage } from './command-diagnostics';

export interface RecoverableCommand { commandId: string; epoch: string }
export type CommandRecoveryResult<R, O> =
  | { kind: 'empty' }
  | { kind: 'pending'; request: R; code?: string }
  | { kind: 'committed'; request: R; outcome: O }
  | { kind: 'blocked'; code: string };
export class CommandRecoveryError extends Error {
  readonly status = null;
  readonly outcomeUnknown = true;
  constructor(readonly code: string) { super(code); this.name = 'CommandRecoveryError'; }
}
export interface CommandRecoveryOptions<R extends RecoverableCommand, O> {
  scope: string;
  persistence: BusinessPersistence;
  actor: () => Promise<BusinessActor | null>;
  epoch: () => Promise<string>;
  /** Internal synchronous session-generation fence for canonical reads. Never a grant. */
  captureReadFence?: () => () => void;
  send: (request: Readonly<R>) => Promise<O>;
  validateOutcome: (outcome: unknown, request: Readonly<R>, actorKey: string) => outcome is O;
  classifyFailure: (error: unknown) => { code: string; definitive: boolean };
  now?: () => number;
  uuid?: () => string;
  leaseMs?: number;
  /** Total deadline for read-only recovery/snapshot inspection, including authority storage reads. */
  readTimeoutMs?: number;
  /** Passive metadata only. Operational adapters opt in; other recovery users stay uninstrumented. */
  diagnostics?: CommandDiagnosticOptions;
}
interface Entry<R, O> {
  scope: string; actorKey: string; request: R; requestDigest: string;
  phase: 'pending' | 'committed'; outcome?: O; outcomeDigest?: string;
  code?: string; lease?: { owner: string; expiresAt: number };
}
interface Journal<R, O> { schemaVersion: 1; mode: 'MOCK'; entries: Entry<R, O>[] }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const digestPattern = /^[a-f0-9]{64}$/;
const fail = (code: string): never => { throw new CommandRecoveryError(code); };
const copy = <T,>(v: T): T => structuredClone(v);

/** Durable intent, not authorization. All commands still pass the repository's
 * independently supplied actor/capability/epoch/version validation. Browser
 * storage is local to this origin/profile/device, never a security boundary. */
export function createCommandRecovery<R extends RecoverableCommand, O>(options: CommandRecoveryOptions<R, O>) {
  const now = options.now ?? Date.now, uuid = options.uuid ?? (() => crypto.randomUUID());
  const leaseMs = options.leaseMs ?? 15_000;
  const readTimeoutMs = options.readTimeoutMs ?? 10_000;
  if (!options.scope || options.scope.length > 128 || !Number.isFinite(leaseMs) || leaseMs <= 0) throw new Error('Invalid recovery scope/lease');
  if (!Number.isFinite(readTimeoutMs) || readTimeoutMs <= 0) throw new Error('Invalid recovery read deadline');
  async function readWithinDeadline<T>(operation: 'restore' | 'snapshot', read: (trace: ReadDiagnosticTrace) => Promise<T>): Promise<T> {
    const trace = startReadDiagnostic(options.scope, operation);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        trace.finish('timeout', 'RECOVERY_READ_TIMEOUT');
        reject(new CommandRecoveryError('RECOVERY_READ_TIMEOUT'));
      }, readTimeoutMs);
    });
    // Authority and IndexedDB reads occur outside the HTTP adapter's timeout.
    // Only bound read-only work: a late result is discarded, never ACKed/retried.
    // Command execution and its unknown-outcome journal retain their own protocol.
    try { const value = await Promise.race([read(trace), deadline]); trace.finish('success'); return value; }
    catch (error) { trace.finish('failure', code(error)); throw error; }
    finally { if (timer !== undefined) clearTimeout(timer); }
  }
  const requestKey = (entry: Entry<R, O>) => canonicalBusinessJson({ scope: entry.scope, actorKey: entry.actorKey, request: entry.request });
  async function digest(value: unknown) {
    const bytes = new TextEncoder().encode(canonicalBusinessJson(value));
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  }
  function journal(raw: unknown): Journal<R, O> {
    if (raw === null) return { schemaVersion: 1, mode: 'MOCK', entries: [] };
    if (!object(raw) || raw.schemaVersion !== 1 || raw.mode !== 'MOCK' || !Array.isArray(raw.entries)) return fail('RECOVERY_STATE_INVALID');
    const scopes = new Set<string>();
    for (const entry of raw.entries) {
      if (!object(entry) || typeof entry.scope !== 'string' || !entry.scope || scopes.has(entry.scope)
        || typeof entry.actorKey !== 'string' || !entry.actorKey || !object(entry.request)
        || !isUuid(entry.request.commandId) || !isUuid(entry.request.epoch)
        || typeof entry.requestDigest !== 'string' || !digestPattern.test(entry.requestDigest)
        || !['pending', 'committed'].includes(String(entry.phase))
        || (entry.code !== undefined && typeof entry.code !== 'string')
        || (entry.lease !== undefined && (!object(entry.lease) || !isUuid(entry.lease.owner) || !Number.isFinite(entry.lease.expiresAt)))
        || (entry.phase === 'committed' && (!Object.hasOwn(entry, 'outcome') || typeof entry.outcomeDigest !== 'string' || !digestPattern.test(entry.outcomeDigest)))
        || (entry.phase === 'pending' && (Object.hasOwn(entry, 'outcome') || Object.hasOwn(entry, 'outcomeDigest')))) return fail('RECOVERY_STATE_INVALID');
      scopes.add(entry.scope);
      try { canonicalBusinessJson(entry.request); if (entry.phase === 'committed') canonicalBusinessJson(entry.outcome); }
      catch { return fail('RECOVERY_STATE_INVALID'); }
    }
    return copy(raw) as unknown as Journal<R, O>;
  }
  async function authority(trace?: ReadDiagnosticTrace, prefix = 'authority') {
    trace?.phase(`${prefix}.actor-initial`);
    const actor = await options.actor();
    if (!actor || !actor.key || !Number.isFinite(actor.expiresAt) || actor.expiresAt <= now()) return fail('SESSION_EXPIRED');
    if (!actor.confirmed) return fail('CONFIRMATION_REQUIRED');
    trace?.phase(`${prefix}.epoch`);
    const epoch = await options.epoch();
    if (!isUuid(epoch)) return fail('RECOVERY_CONTEXT_UNAVAILABLE');
    trace?.phase(`${prefix}.actor-final`);
    const finalActor = await options.actor();
    if (!finalActor || !Number.isFinite(finalActor.expiresAt) || finalActor.expiresAt <= now()) return fail('SESSION_EXPIRED');
    if (!finalActor.confirmed) return fail('CONFIRMATION_REQUIRED');
    if (finalActor.key !== actor.key) return fail('RECOVERY_ACTOR_MISMATCH');
    return { actor: copy(finalActor), epoch };
  }
  function sameAuthority(entry: Entry<R, O>, ctx: Awaited<ReturnType<typeof authority>>) {
    if (entry.actorKey !== ctx.actor.key) return fail('RECOVERY_ACTOR_MISMATCH');
    if (entry.request.epoch !== ctx.epoch) return fail('STALE_DEMO_EPOCH');
  }
  async function verify(entry: Entry<R, O>) {
    if (entry.requestDigest !== await digest({ scope: entry.scope, actorKey: entry.actorKey, request: entry.request })) return fail('RECOVERY_STATE_INVALID');
    if (entry.phase === 'committed' && (entry.outcomeDigest !== await digest(entry.outcome)
      || !options.validateOutcome(entry.outcome, entry.request, entry.actorKey))) return fail('RECOVERY_STATE_INVALID');
  }
  async function selected() {
    return options.persistence.transact(raw => ({ value: journal(raw).entries.find(e => e.scope === options.scope) ?? null }));
  }
  // Bound only read helpers. A late helper cannot continue execute/acknowledge
  // after its awaited promise rejects. Never race send or journal mutations:
  // their eventual durable outcome still belongs to the original command.
  const boundedAuthority = () => readWithinDeadline('restore', trace => authority(trace, 'command'));
  const boundedSelected = () => readWithinDeadline('restore', async trace => { trace.phase('journal.read'); return selected(); });
  function code(error: unknown) {
    if (object(error) && typeof error.code === 'string') return error.code;
    return 'RECOVERY_STORAGE_UNAVAILABLE';
  }
  async function inspectRead(trace: ReadDiagnosticTrace): Promise<CommandRecoveryResult<R, O>> {
    try {
      const ctx = await authority(trace, 'before');
      trace.phase('journal.read');
      const entry = await selected();
      if (!entry) {
        // Even an empty journal read crosses an asynchronous storage boundary.
        // Do not unlock a cached screen under a replacement session or epoch.
        const current = await authority(trace, 'after');
        if (current.actor.key !== ctx.actor.key) return fail('RECOVERY_ACTOR_MISMATCH');
        if (current.epoch !== ctx.epoch) return fail('STALE_DEMO_EPOCH');
        return { kind: 'empty' };
      }
      sameAuthority(entry, ctx); trace.phase('journal.verify'); await verify(entry);
      sameAuthority(entry, await authority(trace, 'after'));
      return entry.phase === 'committed'
        ? { kind: 'committed', request: copy(entry.request), outcome: copy(entry.outcome!) }
        : { kind: 'pending', request: copy(entry.request), ...(entry.code ? { code: entry.code } : {}) };
    } catch (error) { trace.finish('failure', code(error)); return { kind: 'blocked', code: code(error) }; }
  }
  async function inspect(): Promise<CommandRecoveryResult<R, O>> {
    try { return await readWithinDeadline('restore', inspectRead); }
    catch (error) { return { kind: 'blocked', code: code(error) }; }
  }
  async function execute(input: Readonly<R>): Promise<O> {
    const diagnostic = startCommandDiagnostic(options.diagnostics ?? { enabled: false, surface: 'WEB', scope: options.scope }, input as unknown as import('./command-diagnostics').CommandDiagnosticRequest);
    let stage: CommandDiagnosticStage = 'entered';
    const observe: typeof diagnostic.phase = (next, journalState, error) => { stage = next; diagnostic.phase(next, journalState, error); };
    try {
      const request = copy(input), ctx = await boundedAuthority();
      if (!isUuid(request.commandId) || !isUuid(request.epoch) || request.epoch !== ctx.epoch) return fail('STALE_DEMO_EPOCH');
      const expected = await boundedSelected();
      if (expected) {
        sameAuthority(expected, ctx); await verify(expected);
        if (canonicalBusinessJson(expected.request) !== canonicalBusinessJson(request)) return fail(expected.phase === 'committed' ? 'RECOVERY_ACK_REQUIRED' : 'RECOVERY_PENDING');
        if (expected.phase === 'committed') { observe('committed', 'committed'); sameAuthority(expected, await boundedAuthority()); return copy(expected.outcome!); }
      }
      const owner = uuid(); if (!isUuid(owner)) return fail('RECOVERY_CONTEXT_UNAVAILABLE');
      const candidate: Entry<R, O> = { scope: options.scope, actorKey: ctx.actor.key, request,
        requestDigest: await digest({ scope: options.scope, actorKey: ctx.actor.key, request }), phase: 'pending',
        lease: { owner, expiresAt: now() + leaseMs } };
      // Compare-and-swap is atomic across tabs. Expired leases permit only replay
      // of this immutable command; the repository remains the exactly-once guard.
      try { await options.persistence.transact(raw => {
        const state = journal(raw), entry = state.entries.find(e => e.scope === options.scope);
        if (entry) {
          sameAuthority(entry, ctx);
          if (!expected || requestKey(entry) !== requestKey(expected) || entry.requestDigest !== expected.requestDigest
            || entry.phase !== expected.phase) return fail('RECOVERY_PENDING');
          if (entry.lease && entry.lease.expiresAt > now()) return fail('RECOVERY_BUSY');
          entry.lease = candidate.lease;
        } else {
          if (expected) return fail('RECOVERY_CONTEXT_CHANGED');
          state.entries.push(candidate);
        }
        return { value: undefined, write: state };
      }); } catch (error) { observe('blocked', 'unverified', code(error)); throw error; }
      observe('prepared', 'pending');
      const mutateLease = async (change: (state: Journal<R, O>, entry: Entry<R, O>) => void) => options.persistence.transact(raw => {
        const state = journal(raw), entry = state.entries.find(e => e.scope === options.scope);
        if (!entry || requestKey(entry) !== requestKey(candidate) || entry.requestDigest !== candidate.requestDigest
          || entry.phase !== 'pending' || entry.lease?.owner !== owner) return fail('RECOVERY_CONTEXT_CHANGED');
        change(state, entry); return { value: undefined, write: state };
      });
      let outcome: O;
      try {
        // Resolve session again after durable preparation; never replay another
        // actor's intent under a replacement session.
        const current = await boundedAuthority(); sameAuthority(candidate, current);
        observe('dispatched', 'pending');
        outcome = await options.send(copy(request));
        if (!options.validateOutcome(outcome, request, candidate.actorKey)) return fail('INVALID_RESPONSE');
        observe('response-validated', 'pending');
        // A session can change while the request is in flight. Preserve its intent
        // without returning the old actor's private receipt to the replacement UI.
        sameAuthority(candidate, await boundedAuthority());
      } catch (error) {
        const failure = error instanceof CommandRecoveryError ? { code: error.code, definitive: false } : options.classifyFailure(error);
        try {
          await mutateLease((state, entry) => {
            if (!expected && failure.definitive) state.entries = state.entries.filter(e => e !== entry);
            else { delete entry.lease; entry.code = failure.code; }
          });
        } catch (storageError) { observe('unknown', 'unverified', code(storageError)); return fail('RECOVERY_STORAGE_UNAVAILABLE'); }
        observe(expected || !failure.definitive ? 'unknown' : 'rejected', expected || !failure.definitive ? 'pending' : 'empty', failure.code);
        // An earlier uncertain dispatch cannot become a failed command merely
        // because its replay was denied, cancelled or rejected after a reset.
        if (expected || !failure.definitive) return fail(failure.code);
        throw error;
      }
      // A failed marker write must not turn a known committed result into a new
      // command. Keep its original intent for durable receipt reconciliation.
      const outcomeDigest = await digest(outcome);
      try {
        await mutateLease((_state, entry) => {
          entry.phase = 'committed'; entry.outcome = copy(outcome); entry.outcomeDigest = outcomeDigest;
          delete entry.lease; delete entry.code;
        });
      } catch (error) { observe('unknown', 'unverified', code(error)); return fail('RECOVERY_STORAGE_UNAVAILABLE'); }
      observe('committed', 'committed');
      sameAuthority(candidate, await boundedAuthority());
      return copy(outcome);
    } catch (error) {
      // Only observe existing boundaries: never read storage again to infer a result.
      // A committed marker survives a later authority failure without implying UI acceptance.
      switch (stage as CommandDiagnosticStage) {
        case 'entered': observe('blocked', 'unverified', code(error)); break;
        case 'prepared': case 'dispatched': case 'response-validated': observe('unknown', 'pending', code(error)); break;
        case 'committed': observe('committed', 'committed', code(error)); break;
      }
      throw error;
    }
  }
  return {
    execute,
    restore: inspect,
    async readCurrent<T>(read: () => Promise<T>): Promise<T> {
      return readWithinDeadline('snapshot', async trace => {
        trace.phase('capture-fence');
        if (!options.captureReadFence) return fail('RECOVERY_CONTEXT_UNAVAILABLE');
        const assertCurrent = options.captureReadFence();
        const before = await authority(trace, 'before');
        trace.phase('snapshot.payload');
        const value = await read();
        const after = await authority(trace, 'after');
        if (after.actor.key !== before.actor.key) return fail('RECOVERY_ACTOR_MISMATCH');
        if (after.epoch !== before.epoch) return fail('STALE_DEMO_EPOCH');
        // The final actor lookup also awaits storage. Fence resets after it, then
        // check the session synchronously so this extra await cannot hide a switch.
        trace.phase('final.epoch');
        if (await options.epoch() !== before.epoch) return fail('STALE_DEMO_EPOCH');
        trace.phase('final.fence');
        assertCurrent();
        if (after.actor.expiresAt <= now()) return fail('SESSION_EXPIRED');
        return value;
      });
    },
    async retry(): Promise<CommandRecoveryResult<R, O>> {
      const before = await inspect();
      if (before.kind !== 'pending') return before;
      try { const outcome = await execute(before.request); return { kind: 'committed', request: before.request, outcome }; }
      catch (error) {
        const after = await inspect();
        return after.kind === 'pending' ? { ...after, code: code(error) } : after;
      }
    },
    async acknowledge(commandId: string) {
      let removed = false;
      try {
        const ctx = await boundedAuthority(), expected = await boundedSelected();
        if (!expected) return;
        sameAuthority(expected, ctx); await verify(expected);
        sameAuthority(expected, await boundedAuthority());
        if (expected.request.commandId !== commandId || expected.phase !== 'committed') return fail('RECOVERY_ACK_REQUIRED');
        await options.persistence.transact(raw => {
          const state = journal(raw), entry = state.entries.find(e => e.scope === options.scope);
          if (!entry || canonicalBusinessJson(entry) !== canonicalBusinessJson(expected)) return fail('RECOVERY_CONTEXT_CHANGED');
          state.entries = state.entries.filter(e => e !== entry);
          return { value: undefined, write: state };
        });
        removed = true;
        // Deletion may complete after a session switch. Reject completion so the
        // caller clears its old private snapshot instead of unlocking cached data.
        sameAuthority(expected, await boundedAuthority());
        if (options.diagnostics?.enabled) updateCommandDiagnostic(commandId, options.diagnostics.scope, options.diagnostics.surface, 'acknowledged', 'empty');
      } catch (error) {
        if (options.diagnostics?.enabled) updateCommandDiagnostic(commandId, options.diagnostics.scope, options.diagnostics.surface, 'committed', removed ? 'empty' : 'unverified', code(error));
        throw error;
      }
    },
  };
}
