import { PreviewHttpError } from './errors';
import type { BusinessPersistence } from './business-persistence';
import { createCommitSnapshot, planDependentRecords, validateCommitSnapshot, type DependentRecordWrite } from './business-atomic';

export interface BusinessRecord { id: string; kind: string; version: number; data: unknown }
export interface BusinessSeed { id: string; records: readonly Omit<BusinessRecord, 'version'>[] }
export interface BusinessActor { key: string; confirmed: boolean; expiresAt: number }
export interface BusinessCommand {
  commandId: string; epoch: string; command: string; entityId?: string; expectedVersion?: number; payload: unknown;
}
export interface BusinessReceipt {
  mode: 'MOCK'; commandId: string; epoch: string; command: string; actorKey: string; entityId: string;
  previousVersion: number | null; version: number; changed: boolean; committedAt: string; snapshotRevision: number; record: BusinessRecord;
  commitSnapshotId?: string;
}
export interface BusinessSnapshot {
  schemaVersion: 1; mode: 'MOCK'; epoch: string; snapshotRevision: number; seedId: string; seedDigest: string; records: BusinessRecord[];
}
interface StoredReceipt { meaning: string; receipt: BusinessReceipt }
interface BusinessState extends BusinessSnapshot { receipts: StoredReceipt[] }
export interface BusinessApplyContext {
  records: readonly BusinessRecord[]; entityId: string; committedAt: string; actorKey: string; commandId: string; epoch: string;
  /** Trusted synchronous policy lookup, scoped to the current actor and committing transaction. Never exported in public reads. */
  committedCommand(commandId: string): { request: BusinessCommand; receipt: BusinessReceipt } | undefined;
}
export interface BusinessHandler {
  operation: 'create' | 'update'; entityKind: string;
  /** Synthetic IDs only; existing stored IDs are never rewritten. */
  idPrefix?: string;
  /** Opt-in: dependent audit/proof writes occur only when primary data changes. */
  dependentWritesOnChangeOnly?: boolean;
  /** A separately approved domain policy validates fields and returns complete record data. */
  apply(payload: unknown, current: Readonly<BusinessRecord> | undefined,
    context?: BusinessApplyContext): unknown;
  /** Trusted service-bound policy only. No public arbitrary-record patch endpoint. */
  dependentWrites?: (primary: Readonly<BusinessRecord>, context: {
    records: readonly BusinessRecord[]; request: Readonly<BusinessCommand>; actorKey: string;
    committedAt: string; commitSnapshotId: string;
    /** Same actor-scoped transaction lookup used by apply; never a public read. */
    committedCommand?: BusinessApplyContext['committedCommand'];
  }) => readonly DependentRecordWrite[];
}
export interface BusinessRepositoryOptions {
  persistence: BusinessPersistence; seed: BusinessSeed;
  /** Explicit additive seed upgrades; existing records, versions, epoch and receipts survive. */
  previousSeeds?: readonly BusinessSeed[];
  /** Compatible additive domain records. Core seed identity stays readable by retained builds.
   * Existing extension identities must pass the domain validator; never replace collisions. */
  recordExtension?: {
    records: readonly Omit<BusinessRecord, 'version'>[];
    validateRecord: (record: Readonly<BusinessRecord>) => boolean;
  };
  actor?: () => Promise<BusinessActor | null>;
  authorize?: (actor: Readonly<BusinessActor>, command: Readonly<BusinessCommand>) => boolean;
  /** Synchronous session-generation fence checked inside the committing transaction. */
  captureAuthorityFence?: () => () => void;
  handlers?: Readonly<Record<string, BusinessHandler>>;
  /** Trusted additive-domain integrity checks, including reads; no receipt exposure to callers. */
  validateCanonicalState?: (snapshot: { readonly epoch: string; readonly records: readonly BusinessRecord[] }, committedCommand: (actorKey: string, commandId: string) => { request: BusinessCommand; receipt: BusinessReceipt } | undefined) => void;
  now?: () => number; uuid?: () => string;
}
const error = (status: number, code: string, details?: unknown) => new PreviewHttpError(status, code, 'Không thể hoàn tất thao tác dữ liệu xem trước.', details);
const invalidState = () => error(503, 'MOCK_STATE_INVALID');
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 1;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Stable request identity; does not normalize business codes or other field values. */
export function canonicalBusinessJson(value: unknown): string {
  const seen = new Set<object>();
  function visit(v: unknown, depth: number): string {
    if (depth > 64) throw error(422, 'VALIDATION_FAILED');
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return JSON.stringify(v);
    if (typeof v === 'number' && Number.isFinite(v)) return JSON.stringify(v);
    if (!v || typeof v !== 'object' || seen.has(v)) throw error(422, 'VALIDATION_FAILED');
    if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw error(422, 'VALIDATION_FAILED');
    if (Array.isArray(v)) for (let i = 0; i < v.length; i++) if (!Object.hasOwn(v, i)) throw error(422, 'VALIDATION_FAILED');
    seen.add(v);
    const result = Array.isArray(v) ? '[' + v.map(x => visit(x, depth + 1)).join(',') + ']'
      : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + visit((v as Record<string, unknown>)[k], depth + 1)).join(',') + '}';
    seen.delete(v); return result;
  }
  return visit(value, 0);
}

export function createBusinessRepository(options: BusinessRepositoryOptions) {
  const now = options.now ?? Date.now, uuid = options.uuid ?? (() => globalThis.crypto.randomUUID());
  const seed = structuredClone(options.seed), handlers = options.handlers ?? {};
  if (!seed.id || !Array.isArray(seed.records) || new Set(seed.records.map(r => r.id)).size !== seed.records.length) throw invalidState();
  for (const r of seed.records) { if (typeof r.id !== 'string' || !r.id || typeof r.kind !== 'string' || !r.kind) throw invalidState(); canonicalBusinessJson(r.data); }
  const seedBytes = new TextEncoder().encode(canonicalBusinessJson(seed));
  const digest = globalThis.crypto.subtle.digest('SHA-256', seedBytes).then(b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join(''));
  function fresh(seedDigest: string): BusinessState {
    const epoch = uuid(); if (!uuidPattern.test(epoch)) throw invalidState();
    return { schemaVersion: 1, mode: 'MOCK', epoch, snapshotRevision: 1, seedId: seed.id, seedDigest, records: seed.records.map(r => ({ ...structuredClone(r), version: 1 })), receipts: [] };
  }
  const previousSeeds = structuredClone(options.previousSeeds ?? []);
  const extension = structuredClone(options.recordExtension?.records ?? []);
  if (new Set(extension.map(r => r.id)).size !== extension.length
    || extension.some(r => !r.id || !r.kind || seed.records.some(core => core.id === r.id)
      || !options.recordExtension?.validateRecord({ ...r, version: 1 }))) throw invalidState();
  extension.forEach(record => canonicalBusinessJson(record.data));
  const previousDigests = Promise.all(previousSeeds.map(async previous => {
    if (!previous.id || new Set(previous.records.map(r => r.id)).size !== previous.records.length
      || previous.records.some(r => !seed.records.some(next => canonicalBusinessJson(next) === canonicalBusinessJson(r)))) throw invalidState();
    const bytes = new TextEncoder().encode(canonicalBusinessJson(previous));
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return { seed: previous, digest: Array.from(new Uint8Array(hash), x => x.toString(16).padStart(2, '0')).join('') };
  }));
  function validate(raw: unknown, seedDigest: string, seedId = seed.id): BusinessState {
    if (!isObject(raw) || raw.schemaVersion !== 1 || raw.mode !== 'MOCK' || typeof raw.epoch !== 'string' || !uuidPattern.test(raw.epoch) || !positive(raw.snapshotRevision) || raw.seedId !== seedId || raw.seedDigest !== seedDigest || !Array.isArray(raw.records) || !Array.isArray(raw.receipts)) throw invalidState();
    const ids = new Set<string>(), receipts = new Set<string>();
    try {
      for (const r of raw.records) {
        if (!isObject(r) || typeof r.id !== 'string' || !r.id || ids.has(r.id) || typeof r.kind !== 'string' || !r.kind || !positive(r.version)) throw invalidState();
        ids.add(r.id); canonicalBusinessJson(r.data);
      }
      for (const entry of raw.receipts) {
        if (!isObject(entry) || typeof entry.meaning !== 'string' || !isObject(entry.receipt)) throw invalidState();
        const r = entry.receipt, key = JSON.stringify([r.actorKey, r.commandId]);
        if (r.mode !== 'MOCK' || r.epoch !== raw.epoch || typeof r.actorKey !== 'string' || !r.actorKey || typeof r.commandId !== 'string' || !uuidPattern.test(r.commandId) || receipts.has(key) || typeof r.command !== 'string' || !r.command || typeof r.entityId !== 'string' || !positive(r.version) || !positive(r.snapshotRevision) || r.snapshotRevision > raw.snapshotRevision || typeof r.changed !== 'boolean' || typeof r.committedAt !== 'string' || !Number.isFinite(Date.parse(r.committedAt)) || !(r.previousVersion === null || positive(r.previousVersion)) || !isObject(r.record) || r.record.id !== r.entityId || r.record.version !== r.version || typeof r.record.kind !== 'string') throw invalidState();
        // Retained receipts must describe the exact canonical request that committed.
        // Do not consult today's handlers/grants: valid historical receipts survive upgrades.
        const request: unknown = JSON.parse(entry.meaning);
        if (!isObject(request) || canonicalBusinessJson(request) !== entry.meaning
          || Object.keys(request).some(k => !['commandId', 'epoch', 'command', 'entityId', 'expectedVersion', 'payload'].includes(k))
          || request.commandId !== r.commandId || request.epoch !== r.epoch || request.command !== r.command
          || (r.previousVersion === null
            ? Object.hasOwn(request, 'entityId') || Object.hasOwn(request, 'expectedVersion')
            : request.entityId !== r.entityId || request.expectedVersion !== r.previousVersion)) throw invalidState();
        const current = raw.records.find(record => record.id === r.entityId);
        if (!current || current.kind !== r.record.kind || current.version < r.version ||
          (r.previousVersion === null ? !r.changed || r.version !== 1 : r.version !== Number(r.previousVersion) + Number(r.changed)) ||
          (current.version === r.version && canonicalBusinessJson(current.data) !== canonicalBusinessJson(r.record.data))) throw invalidState();
        canonicalBusinessJson(r.record.data);
        if (r.commitSnapshotId !== undefined) validateCommitSnapshot(raw.records as unknown as BusinessRecord[], r as unknown as BusinessReceipt);
        receipts.add(key);
      }
    } catch { throw invalidState(); }
    return structuredClone(raw) as unknown as BusinessState;
  }
  const snapshot = (state: BusinessState): BusinessSnapshot => {
    const { receipts: _receipts, ...read } = state; return structuredClone(read);
  };
  function extend(state: BusinessState): BusinessState {
    const additions: BusinessRecord[] = [];
    for (const record of extension) {
      const existing = state.records.find(stored => stored.id === record.id);
      if (existing) {
        if (!options.recordExtension?.validateRecord(structuredClone(existing))) throw invalidState();
      } else additions.push({ ...structuredClone(record), version: 1 });
    }
    if (additions.length) {
      if (state.snapshotRevision >= Number.MAX_SAFE_INTEGER) throw invalidState();
      state.records.push(...additions);state.snapshotRevision++;
    }
    return state;
  }
  function loadUnchecked(raw: unknown, seedDigest: string, previous: Awaited<typeof previousDigests>): BusinessState {
    if (raw === null) return extend(fresh(seedDigest));
    const migration = isObject(raw) && previous.find(p => p.seed.id === raw.seedId && p.digest === raw.seedDigest);
    if (!migration) return extend(validate(raw, seedDigest));
    const state = validate(raw, migration.digest, migration.seed.id);
    const additions = seed.records.filter(r => !migration.seed.records.some(old => old.id === r.id));
    if (additions.some(r => state.records.some(stored => stored.id === r.id)) || state.snapshotRevision >= Number.MAX_SAFE_INTEGER) throw invalidState();
    state.records.push(...additions.map(r => ({ ...structuredClone(r), version: 1 })));
    state.seedId = seed.id; state.seedDigest = seedDigest; state.snapshotRevision++;
    return extend(state);
  }
  function load(raw: unknown, seedDigest: string, previous: Awaited<typeof previousDigests>): BusinessState {
    const state = loadUnchecked(raw, seedDigest, previous);
    // Read-only trusted policy over the already validated transaction copy. Avoid another full
    // canonical snapshot clone on every ordinary read; receipts remain inaccessible as a collection.
    if (options.validateCanonicalState) options.validateCanonicalState({ epoch: state.epoch, records: state.records }, (actorKey, commandId) => {
      const found = state.receipts.find(entry => entry.receipt.actorKey === actorKey && entry.receipt.commandId === commandId);
      return found ? { request: JSON.parse(found.meaning) as BusinessCommand, receipt: structuredClone(found.receipt) } : undefined;
    });
    return state;
  }
  return {
    async read(signal?: AbortSignal): Promise<BusinessSnapshot> {
      const [seedDigest, previous] = await Promise.all([digest, previousDigests]); signal?.throwIfAborted();
      return options.persistence.transact(raw => {
        const state = load(raw, seedDigest, previous);
        return { value: snapshot(state), ...(raw === null || isObject(raw) && (raw.seedDigest !== state.seedDigest || raw.snapshotRevision !== state.snapshotRevision) ? { write: state } : {}) };
      }, signal);
    },
    async execute(input: BusinessCommand, signal?: AbortSignal): Promise<{ receipt: BusinessReceipt; replayed: boolean }> {
      signal?.throwIfAborted();
      const assertAuthority = options.captureAuthorityFence?.();
      const request = structuredClone(input), actor = await (options.actor?.() ?? Promise.resolve(null));
      if (!actor || typeof actor.key !== 'string' || !actor.key || !Number.isFinite(actor.expiresAt) || actor.expiresAt <= now()) throw error(401, 'SESSION_EXPIRED');
      if (!actor.confirmed) throw error(403, 'CONFIRMATION_REQUIRED');
      const [seedDigest, previousSeeds] = await Promise.all([digest, previousDigests]);
      return options.persistence.transact<{ receipt: BusinessReceipt; replayed: boolean }>(raw => {
        assertAuthority?.();
        if (actor.expiresAt <= now()) throw error(401, 'SESSION_EXPIRED');
        if (!options.authorize || !options.authorize(structuredClone(actor), structuredClone(request))) throw error(403, 'MOCK_COMMAND_FORBIDDEN');
        if (!isObject(request) || !uuidPattern.test(request.commandId ?? '') || !uuidPattern.test(request.epoch ?? '') || typeof request.command !== 'string' || !Object.hasOwn(handlers, request.command)) throw error(422, 'VALIDATION_FAILED');
        if (Object.keys(request).some(k => !['commandId', 'epoch', 'command', 'entityId', 'expectedVersion', 'payload'].includes(k))) throw error(422, 'VALIDATION_FAILED');
        const state = load(raw, seedDigest, previousSeeds);
        if (request.epoch !== state.epoch) throw error(409, 'STALE_DEMO_EPOCH');
        const meaning = canonicalBusinessJson(request);
        const previous = state.receipts.find(r => r.receipt.actorKey === actor.key && r.receipt.commandId === request.commandId);
        if (previous) {
          if (previous.meaning !== meaning) throw error(409, 'COMMAND_ID_REUSED');
          return { value: { receipt: structuredClone(previous.receipt), replayed: true }, ...(isObject(raw) && (raw.seedDigest !== state.seedDigest || raw.snapshotRevision !== state.snapshotRevision) ? { write: state } : {}) };
        }
        const handler = handlers[request.command], creating = handler.operation === 'create';
        const current = creating ? undefined : state.records.find(r => r.id === request.entityId && r.kind === handler.entityKind);
        if (creating && (request.entityId !== undefined || request.expectedVersion !== undefined)) throw error(422, 'VALIDATION_FAILED');
        if (!creating) {
          if (typeof request.entityId !== 'string' || !positive(request.expectedVersion)) throw error(422, 'VALIDATION_FAILED');
          if (!current) throw error(404, 'NOT_FOUND');
          if (request.expectedVersion !== current.version) throw error(409, 'STALE_VERSION', { currentVersion: current.version, record: structuredClone(current) });
        }
        const entityId = current?.id ?? `${handler.idPrefix ?? ''}${uuid()}`;
        const committedAt = new Date(now()).toISOString();
        const committedCommand: BusinessApplyContext['committedCommand'] = commandId => {
          const found = state.receipts.find(entry => entry.receipt.actorKey === actor.key && entry.receipt.commandId === commandId);
          return found ? { request: JSON.parse(found.meaning) as BusinessCommand, receipt: structuredClone(found.receipt) } : undefined;
        };
        let data: unknown;
        try { data = handler.apply(structuredClone(request.payload), current ? structuredClone(current) : undefined,
          { records: structuredClone(state.records), entityId, committedAt, actorKey: actor.key, commandId: request.commandId, epoch: state.epoch,
            committedCommand }); }
        catch (failure) { if (failure instanceof PreviewHttpError) throw failure; throw error(500, 'MOCK_COMMAND_FAILED'); }
        assertAuthority?.();
        const after = canonicalBusinessJson(data);
        const primaryChanged = !current || after !== canonicalBusinessJson(current.data);
        const writeDependents = !!handler.dependentWrites && (!handler.dependentWritesOnChangeOnly || primaryChanged);
        const commitSnapshotId = writeDependents ? `commit-snapshot:${uuid()}` : undefined;
        if (commitSnapshotId && !uuidPattern.test(commitSnapshotId.slice('commit-snapshot:'.length))) throw invalidState();
        const draft: BusinessRecord = { id: entityId, kind: handler.entityKind, version: current ? current.version + 1 : 1, data: structuredClone(data) };
        const dependents = writeDependents ? planDependentRecords(state.records, entityId,
          handler.dependentWrites!(structuredClone(draft), { records: structuredClone(state.records), request: structuredClone(request),
            actorKey: actor.key, committedAt, commitSnapshotId: commitSnapshotId!, committedCommand })) : [];
        const changed = writeDependents || primaryChanged;
        // A commit must never create state that the next read rejects as unsafe.
        // At the limit a no-op/replay remains valid because neither counter advances.
        if (changed && (state.snapshotRevision >= Number.MAX_SAFE_INTEGER || current && current.version >= Number.MAX_SAFE_INTEGER)) throw invalidState();
        const record: BusinessRecord = { id: entityId, kind: handler.entityKind, version: current ? current.version + Number(changed) : 1, data: structuredClone(data) };
        if (!record.id || (creating && state.records.some(r => r.id === record.id))) throw error(500, 'MOCK_COMMAND_FAILED');
        if (current && ['stock-event', 'audit-event', 'commit-snapshot', 'physical-registry', 'app-submission', 'scan-observation', 'case-event', 'evidence-attachment'].includes(current.kind)) throw error(409, 'IMMUTABLE_EVENT');
        const commit = commitSnapshotId ? createCommitSnapshot({ id: commitSnapshotId, epoch: state.epoch, revision: state.snapshotRevision + 1,
          commandId: request.commandId, actorKey: actor.key, committedAt }, state.records, [record, ...dependents]) : undefined;
        assertAuthority?.();
        if (actor.expiresAt <= now()) throw error(401, 'SESSION_EXPIRED');
        if (changed) { if (current) state.records[state.records.indexOf(current)] = record; else state.records.push(record); state.snapshotRevision++; }
        for (const dependent of dependents) {
          const index = state.records.findIndex(old => old.id === dependent.id);
          if (index < 0) state.records.push(dependent); else state.records[index] = dependent;
        }
        if (commit) state.records.push(commit);
        const receipt: BusinessReceipt = { mode: 'MOCK', commandId: request.commandId, epoch: state.epoch, command: request.command, actorKey: actor.key, entityId: record.id, previousVersion: current?.version ?? null, version: record.version, changed, committedAt, snapshotRevision: state.snapshotRevision, record };
        if (commitSnapshotId) receipt.commitSnapshotId = commitSnapshotId;
        if (commitSnapshotId) validateCommitSnapshot(state.records, receipt);
        state.receipts.push({ meaning, receipt });
        return { value: { receipt: structuredClone(receipt), replayed: false }, write: state };
      }, signal);
    },
    async reset(input: { expectedEpoch: string; confirmed: true }, signal?: AbortSignal): Promise<BusinessSnapshot> {
      if (input.confirmed !== true) throw error(422, 'RESET_CONFIRMATION_REQUIRED');
      const [seedDigest, previous] = await Promise.all([digest, previousDigests]);
      return options.persistence.transact(raw => {
        const current = raw === null ? null : load(raw, seedDigest, previous);
        if (!current || current.epoch !== input.expectedEpoch) throw error(409, 'STALE_DEMO_EPOCH');
        // Operational generations and the permanent physical registry must be archived, not erased.
        if (current.records.some(r => r.kind === 'operational-scenario')) throw error(409, 'SCENARIO_RESET_REQUIRED');
        const next = extend(fresh(seedDigest));
        if (next.epoch === current.epoch) throw error(500, 'MOCK_COMMAND_FAILED');
        return { value: snapshot(next), write: next };
      }, signal);
    },
  };
}
export type BusinessRepository = ReturnType<typeof createBusinessRepository>;
