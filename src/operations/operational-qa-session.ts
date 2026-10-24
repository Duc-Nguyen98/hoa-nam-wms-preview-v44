import type { AxiosInstance } from 'axios';
import type { OperationalCommand, OperationalOutcome, OperationalSnapshot, OperationalSurface } from '../contracts/operational-preview';
import { createPreviewBusinessReads, type PreviewBusinessCommandBinding } from '../preview-mock/business-reads';
import type { BusinessPersistence, BusinessTransaction } from '../preview-mock/business-persistence';
import { canonicalBusinessJson } from '../preview-mock/business-repository';
import { createPreviewCommandRecovery } from '../preview-mock/command-recovery-context';
import { hasOperationalCommitProof, isOperationalOutcome } from '../preview-mock/operational-outcome';
import { OPERATIONAL_ACTOR, OPERATIONAL_SURFACES } from '../preview-mock/operational-policy';
import { PreviewHttpError } from '../preview-mock/errors';

export type OperationalQaCheck = 'actor-denied' | 'stale-version' | 'replay' | 'storage-before' | 'storage-after' | 'scope-conflict' | 'owner-denied' | 'policy-result';
export interface OperationalQaObservation {
  check: OperationalQaCheck; request: OperationalCommand;
  before: OperationalSnapshot; after: OperationalSnapshot;
  outcome: OperationalOutcome | null; errorCode: string | null;
  snapshotUnchanged: boolean; faultTriggered: boolean;
  /** Technical observation, never a browser or E2E acceptance result. */
  status: 'OBSERVED_NOT_E2E_VERIFIED';
}
const fail = (code: string, status = 409): never => { throw new PreviewHttpError(status, code, 'Kiểm tra QA chưa khả dụng.'); };

/** Global-owned opt-in seam for future visible QA controls. Uses the existing
 * canonical persistence and durable recovery context, never a second dataset.
 * Fixed surface/authority are constructor bindings, not request payload fields.
 * This is not installed or exposed on Main by importing the module. */
export function createOperationalQaSession(client: AxiosInstance, options: {
  enabled: boolean; surface: OperationalSurface; persistence: BusinessPersistence;
  binding: PreviewBusinessCommandBinding;
}) {
  let busy = false, denyAuthority = false, denyOwner = false;
  let fault: { commandId: string; phase: 'before' | 'after'; used: boolean } | null = null;
  const persistence: BusinessPersistence = {
    async transact<T>(change: (raw: unknown | null) => BusinessTransaction<T>, signal?: AbortSignal): Promise<T> {
      let loseResponse = false;
      const result = await options.persistence.transact(raw => {
        const next = change(raw), value = next.value as Partial<OperationalOutcome> | null;
        // Only this explicit command's new atomic write can consume the fault.
        // Reads, seed upgrades, other commands and exact replay cannot consume it.
        if (fault && !fault.used && Object.hasOwn(next, 'write') && value?.replayed === false && value.receipt?.commandId === fault.commandId) {
          fault.used = true;
          if (fault.phase === 'before') return fail('QA_PRECOMMIT_STORAGE_ERROR', 503);
          loseResponse = true;
        }
        return next;
      }, signal);
      if (loseResponse) return fail('QA_POSTCOMMIT_RESPONSE_LOST', 503);
      return result;
    },
  };
  const binding: PreviewBusinessCommandBinding = {
    ...options.binding,
    actor: async () => {
      const actor = await options.binding.actor();
      // Restrict a private diagnostic binding; account/session and real grants
      // remain untouched. The actual repository must reject unconfirmed actors.
      return actor && denyAuthority ? { ...actor, confirmed: false } : actor && denyOwner ? { ...actor, key: 'preview:qa-denied-owner' } : actor;
    },
  };
  const service = createPreviewBusinessReads(persistence, binding).operational(options.surface);
  const journal = createPreviewCommandRecovery<OperationalCommand, OperationalOutcome>(client, {
    scope: 'operations-qa-v1:' + options.surface,
    send: request => service.execute(request), validateOutcome: isOperationalOutcome,
    classifyFailure(error) {
      const e = error as { code?: string; status?: number };
      return { code: e.code ?? 'QA_OPERATION_FAILED', definitive: !!e.status && e.status >= 400 && e.status < 500 && ![408, 429].includes(e.status) };
    },
  });
  function allowed() { if (!options.enabled || !options.binding.operationalEnabled) return fail('QA_DISABLED', 403); }
  async function exclusive<T>(action: () => Promise<T>): Promise<T> {
    allowed(); if (busy) return fail('QA_BUSY'); busy = true;
    try { return await action(); } finally { denyAuthority = false; denyOwner = false; fault = null; busy = false; }
  }
  function assertOwnScenario(snapshot: OperationalSnapshot) {
    if (!snapshot.scenario || snapshot.actorKey !== OPERATIONAL_ACTOR || snapshot.scenario.data.ownerActor !== snapshot.actorKey
      || snapshot.scenario.data.setupManifestId !== 'HN-SIX-FLOWS-v0.1') return fail('QA_OWN_SCENARIO_REQUIRED', 403);
  }
  function scopeMatches(snapshot: OperationalSnapshot, request: OperationalCommand) {
    return request.epoch === snapshot.epoch && request.scenarioId === snapshot.token.scenarioId && request.generation === snapshot.token.generation;
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome) {
    const snapshot = await service.read();
    if (!hasOperationalCommitProof(snapshot, request, outcome)) return fail('COMMIT_PROOF_REQUIRED');
    await journal.acknowledge(request.commandId);
    return snapshot;
  }
  return {
    surface: options.surface,
    read: async () => { allowed(); return service.read(); },
    restore: async () => { allowed(); return journal.restore(); },
    run: (check: OperationalQaCheck, original: OperationalCommand): Promise<OperationalQaObservation> => exclusive(async () => {
      if (!['actor-denied', 'stale-version', 'replay', 'storage-before', 'storage-after', 'scope-conflict', 'owner-denied'].includes(check)) return fail('QA_UNKNOWN_CHECK', 422);
      const request = structuredClone(original);
      if (OPERATIONAL_SURFACES[request.command] !== options.surface) return fail('WRONG_COMMAND_SURFACE', 403);
      if ((await journal.restore()).kind !== 'empty') return fail('QA_RECOVERY_REQUIRED');
      const before = await service.read(); assertOwnScenario(before);
      if (['scope-conflict', 'owner-denied'].includes(check) && (options.surface !== 'QA' || request.command !== 'scenario.reset-own')) return fail('QA_RESET_CHECK_REQUIRED');
      const committed = [...before.commitSnapshots, ...before.archivedCommitSnapshots].some(proof => (proof.data as { commandId: string }).commandId === request.commandId);
      if (check === 'replay') { if (!committed || request.epoch !== before.epoch) return fail('QA_COMMITTED_COMMAND_REQUIRED'); }
      else {
        if (check === 'scope-conflict') { if (scopeMatches(before, request)) return fail('QA_CONFLICTING_SCOPE_REQUIRED'); }
        else if (!scopeMatches(before, request)) return fail('STALE_SCENARIO');
        if (committed) return fail('QA_FRESH_COMMAND_REQUIRED');
      }
      if (check === 'stale-version') {
        const records = [...before.receipts, ...before.outbounds, ...before.putaways, ...before.warrantyCases, ...before.partsIssues, ...before.reversals];
        const entity = records.find(record => record.id === request.entityId);
        if (!entity || !Number.isSafeInteger(request.expectedVersion) || request.expectedVersion! < 1 || request.expectedVersion! >= entity.version) return fail('QA_STALE_REQUEST_REQUIRED');
      }
      denyAuthority = check === 'actor-denied';
      denyOwner = check === 'owner-denied';
      if (check === 'storage-before' || check === 'storage-after') fault = { commandId: request.commandId, phase: check === 'storage-before' ? 'before' : 'after', used: false };
      let outcome: OperationalOutcome | null = null, errorCode: string | null = null;
      try { outcome = await journal.execute(request); }
      catch (error) { errorCode = (error as { code?: string }).code ?? 'QA_OPERATION_FAILED'; }
      finally { denyAuthority = false; denyOwner = false; }
      const faultTriggered = fault?.used === true; fault = null;
      const after = outcome ? await accept(request, outcome) : await service.read();
      return { check, request, before, after, outcome, errorCode, faultTriggered,
        snapshotUnchanged: canonicalBusinessJson(before) === canonicalBusinessJson(after), status: 'OBSERVED_NOT_E2E_VERIFIED' };
    }),
    /** Explicit user retry only. Precommit retry may commit the original command;
     * postcommit retry recovers its original receipt. Never auto-retry on read. */
    reconcile: () => exclusive(async () => {
      const result = await journal.retry();
      if (result.kind !== 'committed') return { result, snapshot: null };
      return { result, snapshot: await accept(result.request, result.outcome) };
    }),
  };
}
