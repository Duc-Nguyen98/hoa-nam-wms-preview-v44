import type { AxiosInstance } from 'axios';
import type { BusinessCommand, BusinessSnapshot, BusinessReceipt } from '../preview-mock/business-repository';
import { canonicalBusinessJson } from '../preview-mock/business-repository';
import { createPreviewBusinessReads, type PreviewBusinessCommandBinding } from '../preview-mock/business-reads';
import type { BusinessPersistence } from '../preview-mock/business-persistence';
import { createPreviewCommandRecovery } from '../preview-mock/command-recovery-context';
import { PreviewHttpError } from '../preview-mock/errors';
import { isCatalogCreateOutcome } from '../preview-mock/catalog-policy';
import { CATALOG_KINDS, type CatalogCreateRequest } from '../contracts/catalog-create';
import { isDefectsCommandOutcome } from '../features/S02/defects-command-service';
import type { DefectsCommandRequest } from '../contracts/defects';
import type { OperationalScope } from '../contracts/operational-preview';
import type { OperationalQaCheck } from './operational-qa-session';
import { isPvDemoOutcome, normalizePvPayload } from '../preview-mock/pv-demo-policy';
import type { PvDemoRequest } from '../contracts/pv-demo';
import { INACTIVE_MASTER_SCOPE } from '../preview-mock/inactive-master-allowlist';

export type CatalogQaRequest = BusinessCommand & OperationalScope;
type Outcome = { receipt: BusinessReceipt; replayed: boolean };
const commands = ['products.create', 'skus.create', 'recipients.create', 'defects.create', 'defects.update', 'pv-products.create', 'pv-products.update'];
const isPv = (name: string) => name === 'pv-products.create' || name === 'pv-products.update';
const fail = (code: string, status = 409): never => { throw new PreviewHttpError(status, code, 'Catalogue QA unavailable.'); };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function command(request: CatalogQaRequest): BusinessCommand {
  if (!object(request) || !commands.includes(request.command) || Object.keys(request).some(k => !['commandId', 'epoch', 'command', 'payload', 'entityId', 'expectedVersion', 'scenarioId', 'generation'].includes(k))) return fail('QA_CATALOG_COMMAND_REQUIRED', 403);
  const { scenarioId: _scenarioId, generation: _generation, ...value } = request;
  if (isPv(value.command)) {
    if (value.epoch !== INACTIVE_MASTER_SCOPE.epoch) return fail('QA_PV_ISOLATED_DATASET_REQUIRED', 403);
    return { ...value, payload: normalizePvPayload(value.command as PvDemoRequest['command'], value.payload) };
  }
  return value;
}
function validOutcome(value: unknown, request: CatalogQaRequest, actorKey: string): value is Outcome {
  const input = command(request);
  if (!object(value) || !object(value.receipt) || value.receipt.actorKey !== actorKey || actorKey !== 'preview:ducquang') return false;
  if (isPv(input.command)) return isPvDemoOutcome(value, input as PvDemoRequest, actorKey);
  return input.command.startsWith('defects.') ? isDefectsCommandOutcome(value, input as DefectsCommandRequest)
    : isCatalogCreateOutcome(value, input as CatalogCreateRequest, actorKey);
}
/** Diagnostics for approved catalogue and bounded isolated PV commands. The request fence
 * belongs to QA only; normal catalogue DTO/schema/authority remain unchanged. */
export function createCatalogQaSession(client: AxiosInstance, options: {
  enabled: boolean; persistence: BusinessPersistence; binding: PreviewBusinessCommandBinding;
}) {
  let busy = false, deny = false;
  let sending: CatalogQaRequest | null = null;
  let fault: { id: string; phase: 'before' | 'after'; used: boolean } | null = null;
  function allowed() { if (!options.enabled || !options.binding.operationalEnabled) return fail('QA_DISABLED', 403); }
  function scope(raw: unknown, request: CatalogQaRequest) {
    const records = object(raw) && Array.isArray(raw.records) ? raw.records : [];
    const scenario = records.find(r => object(r) && r.kind === 'operational-scenario' && object(r.data) && r.data.status === 'ACTIVE' && r.data.ownerActor === 'preview:ducquang');
    if (!object(raw) || !object(scenario) || !object(scenario.data) || raw.epoch !== request.epoch || scenario.id !== request.scenarioId || scenario.data.generation !== request.generation || scenario.data.setupManifestId !== 'HN-SIX-FLOWS-v0.1') return fail('STALE_SCENARIO');
  }
  const persistence: BusinessPersistence = {
    async transact(change, signal) {
      let responseLost = false;
      const result = await options.persistence.transact(raw => {
        const next = change(raw), value = next.value as Partial<Outcome> | null;
        if (sending && Object.hasOwn(next, 'write') && value?.replayed === false && value.receipt?.commandId === sending.commandId) {
          // Recheck at the actual atomic write, including an explicit retry.
          // A committed replay may return the archived original without writes.
          scope(raw, sending);
          if (fault && !fault.used && fault.id === sending.commandId) {
            fault.used = true;
            if (fault.phase === 'before') return fail('QA_PRECOMMIT_STORAGE_ERROR', 503);
            responseLost = true;
          }
        }
        return next;
      }, signal);
      if (responseLost) return fail('QA_POSTCOMMIT_RESPONSE_LOST', 503);
      return result;
    },
  };
  const binding = { ...options.binding, actor: async () => { const actor = await options.binding.actor(); return actor && deny ? { ...actor, confirmed: false } : actor; } };
  const service = createPreviewBusinessReads(persistence, binding);
  async function read() {
    allowed();
    for (let attempt = 0; attempt < 3; attempt++) {
      const assertCurrent = options.binding.captureReadFence?.();
      if (!assertCurrent) return fail('QA_AUTHORITY_REQUIRED', 403);
      const operational = await service.operational('WEB').read(), snapshot = await service.readSnapshot();
      const actor = await options.binding.actor(); assertCurrent();
      if (!actor || actor.key !== operational.actorKey || !actor.confirmed || actor.expiresAt <= Date.now()) return fail('MOCK_COMMAND_FORBIDDEN', 403);
      if (operational.epoch === snapshot.epoch && operational.snapshotRevision === snapshot.snapshotRevision) {
        if (!operational.scenario || operational.scenario.data.ownerActor !== operational.actorKey) return fail('QA_OWN_SCENARIO_REQUIRED', 403);
        scope(snapshot, { commandId: '', command: '', payload: null, epoch: operational.epoch, scenarioId: operational.token.scenarioId, generation: operational.token.generation });
        return snapshot;
      }
    }
    return fail('SNAPSHOT_CHANGED');
  }
  async function stored(request: CatalogQaRequest) {
    // Validated repository read first; only canonical business receipts are read.
    await read();
    const assertCurrent = options.binding.captureReadFence?.();
    if (!assertCurrent) return fail('QA_AUTHORITY_REQUIRED', 403);
    const actor = await options.binding.actor();
    if (!actor || !actor.confirmed || actor.key !== 'preview:ducquang' || actor.expiresAt <= Date.now()) return fail('MOCK_COMMAND_FORBIDDEN', 403);
    return options.persistence.transact(raw => {
      assertCurrent(); if (actor.expiresAt <= Date.now()) return fail('SESSION_EXPIRED', 401);
      if (!object(raw) || raw.epoch !== request.epoch || !Array.isArray(raw.receipts)) return fail('STALE_DEMO_EPOCH');
      const entry = raw.receipts.find(r => object(r) && object(r.receipt) && r.receipt.actorKey === actor.key && r.receipt.commandId === request.commandId);
      return { value: entry ? structuredClone(entry) as { meaning: string; receipt: BusinessReceipt } : null };
    });
  }
  async function lookupReceipts(entityId: string) {
    // A diagnostic read of already committed catalogue receipts. It never sends,
    // retries or acknowledges a command, including when a journal is pending.
    if (typeof entityId !== 'string' || !entityId || entityId.length > 200 || entityId !== entityId.trim()) return fail('QA_CATALOG_ENTITY_REQUIRED', 422);
    const snapshot = await read();
    const assertCurrent = options.binding.captureReadFence?.();
    if (!assertCurrent) return fail('QA_AUTHORITY_REQUIRED', 403);
    const actor = await options.binding.actor();
    if (!actor || !actor.confirmed || actor.key !== 'preview:ducquang' || actor.expiresAt <= Date.now()) return fail('MOCK_COMMAND_FORBIDDEN', 403);
    const result = await options.persistence.transact(raw => {
      assertCurrent(); if (actor.expiresAt <= Date.now()) return fail('SESSION_EXPIRED', 401);
      if (!object(raw) || raw.epoch !== snapshot.epoch || raw.snapshotRevision !== snapshot.snapshotRevision || !Array.isArray(raw.receipts)) return fail('SNAPSHOT_CHANGED');
      const scenario = snapshot.records.find(r => r.kind === 'operational-scenario' && object(r.data) && r.data.status === 'ACTIVE' && r.data.ownerActor === actor.key);
      if (!scenario || !object(scenario.data)) return fail('QA_OWN_SCENARIO_REQUIRED', 403);
      const record = snapshot.records.find(r => r.id === entityId);
      if (record && ![...Object.values(CATALOG_KINDS), 'defect', 'pv-profile-v1'].includes(record.kind)) return fail('QA_CATALOG_ENTITY_REQUIRED', 422);
      if (record?.kind === 'pv-profile-v1' && snapshot.epoch !== INACTIVE_MASTER_SCOPE.epoch) return fail('QA_PV_ISOLATED_DATASET_REQUIRED', 403);
      const matches = raw.receipts.flatMap(entry => {
        if (!object(entry) || !object(entry.receipt) || entry.receipt.actorKey !== actor.key || entry.receipt.epoch !== snapshot.epoch || entry.receipt.entityId !== entityId || !commands.includes(String(entry.receipt.command))) return [];
        if (!record || typeof entry.meaning !== 'string') return fail('COMMIT_PROOF_REQUIRED');
        // read() validated the repository and each stored canonical meaning.
        return [{ request: JSON.parse(entry.meaning) as BusinessCommand, receipt: structuredClone(entry.receipt) as unknown as BusinessReceipt }];
      });
      return { value: {
        status: 'OBSERVED_RECEIPT_CORRELATION_NOT_E2E_ACCEPTANCE' as const,
        entityId, recordFound: !!record,
        token: { epoch: snapshot.epoch, revision: snapshot.snapshotRevision, scenarioId: scenario.id, generation: scenario.data.generation },
        matches,
      } };
    });
    assertCurrent(); if (actor.expiresAt <= Date.now()) return fail('SESSION_EXPIRED', 401);
    return result;
  }
  const journal = createPreviewCommandRecovery<CatalogQaRequest, Outcome>(client, {
    scope: 'catalog-qa-v1',
    send: async request => { sending = structuredClone(request); try { return await service.executeCommand(command(request)); } finally { sending = null; } },
    validateOutcome: validOutcome,
    classifyFailure(error) { const e = error as { code?: string; status?: number }; return { code: e.code ?? 'QA_OPERATION_FAILED', definitive: !!e.status && e.status >= 400 && e.status < 500 && ![408, 429].includes(e.status) }; },
  });
  async function accept(request: CatalogQaRequest, outcome: Outcome) {
    const proof = await stored(request);
    if (!proof || proof.meaning !== canonicalBusinessJson(command(request)) || canonicalBusinessJson(proof.receipt) !== canonicalBusinessJson(outcome.receipt)) return fail('COMMIT_PROOF_REQUIRED');
    const snapshot = await read(), current = snapshot.records.find(r => r.id === outcome.receipt.entityId);
    if (!current || current.version < outcome.receipt.version || (current.version === outcome.receipt.version && canonicalBusinessJson(current) !== canonicalBusinessJson(outcome.receipt.record))) return fail('COMMIT_PROOF_REQUIRED');
    await journal.acknowledge(request.commandId); return snapshot;
  }
  async function exclusive<T>(action: () => Promise<T>) {
    allowed(); if (busy) return fail('QA_BUSY'); busy = true;
    try { return await action(); } finally { busy = false; deny = false; fault = null; sending = null; }
  }
  return {
    surface: 'CATALOG' as const, read, lookupReceipts, restore: async () => { allowed(); return journal.restore(); },
    run: (check: OperationalQaCheck, original: CatalogQaRequest) => exclusive(async () => {
      if (!['actor-denied', 'stale-version', 'replay', 'storage-before', 'storage-after', 'policy-result'].includes(check)) return fail('QA_UNKNOWN_CHECK', 422);
      const request = structuredClone(original); command(request);
      if (check === 'policy-result' && !isPv(request.command)) return fail('QA_PV_COMMAND_REQUIRED', 403);
      if ((await journal.restore()).kind !== 'empty') return fail('QA_RECOVERY_REQUIRED');
      const before = await read(), prior = await stored(request);
      if (check === 'replay') { if (!prior) return fail('QA_COMMITTED_COMMAND_REQUIRED'); }
      else { scope(before, request); if (prior) return fail('QA_FRESH_COMMAND_REQUIRED'); }
      if (check === 'stale-version') {
        const kind = request.command === 'pv-products.update' ? 'pv-profile-v1' : 'defect';
        const current = before.records.find(r => r.id === request.entityId && r.kind === kind);
        if (!['defects.update', 'pv-products.update'].includes(request.command) || !current || !Number.isSafeInteger(request.expectedVersion) || request.expectedVersion! < 1 || request.expectedVersion! >= current.version) return fail('QA_STALE_REQUEST_REQUIRED');
      }
      deny = check === 'actor-denied';
      if (check === 'storage-before' || check === 'storage-after') fault = { id: request.commandId, phase: check === 'storage-before' ? 'before' : 'after', used: false };
      let outcome: Outcome | null = null, errorCode: string | null = null;
      try { outcome = await journal.execute(request); } catch (e) { errorCode = (e as { code?: string }).code ?? 'QA_OPERATION_FAILED'; } finally { deny = false; }
      const faultTriggered = fault?.used === true; fault = null;
      const after = outcome ? await accept(request, outcome) : await read();
      return { status: 'OBSERVED_NOT_E2E_VERIFIED' as const, check, request, before, after, outcome, errorCode, faultTriggered, snapshotUnchanged: canonicalBusinessJson(before) === canonicalBusinessJson(after) };
    }),
    reconcile: () => exclusive(async () => { const result = await journal.retry(); return { result, snapshot: result.kind === 'committed' ? await accept(result.request, result.outcome) : null }; }),
  };
}
