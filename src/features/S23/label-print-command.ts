import type { LabelReportRow, LabelReportSummary, LabelStatus } from '../../contracts/label-report';
import type { BusinessActor, BusinessCommand, BusinessHandler, BusinessReceipt, BusinessRecord } from '../../preview-mock/business-repository';
import { PreviewHttpError } from '../../preview-mock/errors';

export type LabelPrintCommand = 'labels.reprint' | 'labels.retry';
export interface LabelPrintData {
  period: { from: string; to: string };
  rows: LabelReportRow[];
  summary: LabelReportSummary;
}
export interface LabelPrintRequest extends BusinessCommand {
  command: LabelPrintCommand;
  entityId: string;
  expectedVersion: number;
  payload: { labelCode: string; expectedPrintCount: number; expectedStatus: LabelStatus };
}
export interface LabelPrintContext { epoch: string; entityId: string; version: number }
export interface LabelPrintOutcome {
  receipt: BusinessReceipt & { record: BusinessRecord & { data: LabelPrintData } };
  replayed: boolean;
}
export type LabelPrintRecoveryResult =
  | { kind: 'empty' }
  | { kind: 'pending'; request: LabelPrintRequest; code?: string }
  | { kind: 'committed'; request: LabelPrintRequest; outcome: LabelPrintOutcome }
  | { kind: 'blocked'; code: string };
export interface LabelPrintCommandAdapter {
  /** Host-resolved availability. Never inferred from a display role or confirmed session. */
  available: boolean;
  readContext(): Promise<LabelPrintContext>;
  /** Persist the original actor-bound intent before dispatch, using the recovery coordinator. */
  execute(request: Readonly<LabelPrintRequest>): Promise<LabelPrintOutcome>;
  recovery?: {
    restore(): Promise<LabelPrintRecoveryResult>;
    retry(): Promise<LabelPrintRecoveryResult>;
    acknowledge(commandId: string): Promise<void>;
  };
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const positive = (value: unknown): value is number => integer(value) && value > 0;
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const fail = (status: number, code: string) => new PreviewHttpError(status, code, 'Chưa thể hoàn tất tác vụ nhãn.');
export const labelPrintCommand = (row: Pick<LabelReportRow, 'status'>): LabelPrintCommand => row.status === 'Lỗi in' ? 'labels.retry' : 'labels.reprint';

export function isLabelPrintData(value: unknown): value is LabelPrintData {
  if (!object(value) || !object(value.period) || typeof value.period.from !== 'string' || typeof value.period.to !== 'string'
    || !Array.isArray(value.rows) || !object(value.summary)) return false;
  const s = value.summary;
  return ['uniqueLabels', 'successful', 'errors', 'reprints'].every(key => integer(s[key]))
    && Number(s.successful) + Number(s.errors) === s.uniqueLabels && typeof s.successRate === 'string'
    && value.rows.every(row => object(row) && ['labelCode', 'documentCode', 'sku', 'productName', 'printedAt'].every(key => typeof row[key] === 'string')
      && !!row.labelCode && ['In thành công', 'Lỗi in'].includes(String(row.status)) && integer(row.printCount))
    && new Set(value.rows.map(row => row.labelCode)).size === value.rows.length;
}
export function isLabelPrintRequest(value: unknown): value is LabelPrintRequest {
  return object(value) && uuid(value.commandId) && uuid(value.epoch) && ['labels.reprint', 'labels.retry'].includes(String(value.command))
    && typeof value.entityId === 'string' && !!value.entityId && positive(value.expectedVersion) && object(value.payload)
    && typeof value.payload.labelCode === 'string' && !!value.payload.labelCode && integer(value.payload.expectedPrintCount)
    && value.payload.expectedStatus === (value.command === 'labels.retry' ? 'Lỗi in' : 'In thành công');
}

/** Success requires the matching repository receipt; transport status alone cannot increment a count. */
export function isLabelPrintOutcome(value: unknown, request: Readonly<LabelPrintRequest>): value is LabelPrintOutcome {
  if (!object(value) || typeof value.replayed !== 'boolean' || !object(value.receipt)) return false;
  const r = value.receipt;
  if (r.mode !== 'MOCK' || r.command !== request.command || r.commandId !== request.commandId || r.epoch !== request.epoch
    || r.entityId !== request.entityId || typeof r.actorKey !== 'string' || !r.actorKey || r.previousVersion !== request.expectedVersion
    || r.version !== request.expectedVersion + 1 || r.changed !== true || !positive(r.snapshotRevision)
    || typeof r.committedAt !== 'string' || !Number.isFinite(Date.parse(r.committedAt))
    || !object(r.record) || r.record.id !== request.entityId || r.record.kind !== 'label-report' || r.record.version !== r.version
    || !isLabelPrintData(r.record.data)) return false;
  const row = r.record.data.rows.find(item => item.labelCode === request.payload.labelCode);
  return !!row && row.status === 'In thành công' && row.printCount === request.payload.expectedPrintCount + 1;
}

/**
 * S23 source, 12 October: exact label confirmation; successful reprint adds one
 * reprint; successful retry moves one error to success without a new label.
 * XN11 permits these Preview jobs. No printer, timestamp rewrite or permission
 * key is invented. Store the period as one record to keep row/summary atomic.
 */
export function createLabelPrintCommandSeam(authority?: (
  actor: Readonly<BusinessActor>, target: Readonly<{ command: LabelPrintCommand; entityId: string; labelCode: string }>,
) => boolean): { handlers: Readonly<Record<LabelPrintCommand, BusinessHandler>>; authorize(actor: Readonly<BusinessActor>, command: Readonly<BusinessCommand>): boolean } {
  const handler = (command: LabelPrintCommand): BusinessHandler => ({
    operation: 'update', entityKind: 'label-report',
    apply(payload, current) {
      if (!current || current.kind !== 'label-report') throw fail(404, 'NOT_FOUND');
      if (!isLabelPrintData(current.data)) throw fail(503, 'MOCK_STATE_INVALID');
      // Owner approval is limited to the source report period. The stable
      // record ID alone cannot authorize a corrupted or replaced period.
      if (current.data.period.from !== '2026-09-04' || current.data.period.to !== '2026-09-10')
        throw fail(403, 'MOCK_COMMAND_FORBIDDEN');
      if (!object(payload) || Reflect.ownKeys(payload).some(key => typeof key !== 'string' || !['labelCode', 'expectedPrintCount', 'expectedStatus'].includes(key))
        || typeof payload.labelCode !== 'string' || !integer(payload.expectedPrintCount)
        || payload.expectedStatus !== (command === 'labels.retry' ? 'Lỗi in' : 'In thành công')) throw fail(422, 'VALIDATION_FAILED');
      const data = structuredClone(current.data), row = data.rows.find(item => item.labelCode === payload.labelCode);
      if (!row) throw fail(404, 'LABEL_NOT_FOUND');
      if (row.status !== payload.expectedStatus || row.printCount !== payload.expectedPrintCount) throw fail(409, 'LABEL_STATE_CHANGED');
      if (row.printCount === Number.MAX_SAFE_INTEGER || command === 'labels.reprint' && data.summary.reprints === Number.MAX_SAFE_INTEGER
        || command === 'labels.retry' && (!data.summary.errors || data.summary.successful === Number.MAX_SAFE_INTEGER)) throw fail(503, 'MOCK_STATE_INVALID');
      row.printCount += 1;
      row.status = 'In thành công';
      if (command === 'labels.reprint') data.summary.reprints += 1;
      else {
        data.summary.errors -= 1;
        data.summary.successful += 1;
        data.summary.successRate = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
          .format(100 * data.summary.successful / data.summary.uniqueLabels) + '%';
      }
      return data;
    },
  });
  return {
    handlers: Object.freeze({ 'labels.reprint': handler('labels.reprint'), 'labels.retry': handler('labels.retry') }),
    authorize(actor, command) {
      if (!actor || actor.confirmed !== true || !actor.key || !isLabelPrintRequest(command) || !authority) return false;
      try { return authority(Object.freeze({ ...actor }), Object.freeze({ command: command.command, entityId: command.entityId, labelCode: command.payload.labelCode })) === true; }
      catch { return false; }
    },
  };
}

export interface LabelPrintState {
  phase: 'idle' | 'pending' | 'success' | 'failed' | 'blocked' | 'unknown';
  request: LabelPrintRequest | null;
  outcome: LabelPrintOutcome | null;
  code: string | null;
}
/** UI command lifecycle; the supplied adapter owns actor checks, persistence and reconciliation. */
export function createLabelPrintService(adapter?: LabelPrintCommandAdapter, makeId = () => globalThis.crypto.randomUUID()) {
  let state: LabelPrintState = { phase: 'idle', request: null, outcome: null, code: null };
  let flight: Promise<LabelPrintState> | null = null, dismissal: Promise<boolean> | null = null, restored = false, journalEmpty = false;
  const listeners = new Set<() => void>();
  const publish = (next: LabelPrintState) => { state = next; listeners.forEach(listener => listener()); return state; };
  function receive(value: LabelPrintRecoveryResult): LabelPrintState {
    restored = true; journalEmpty = value.kind === 'empty';
    if (value.kind === 'empty') return publish({ phase: 'idle', request: null, outcome: null, code: null });
    if (value.kind === 'blocked') return publish({ phase: 'blocked', request: null, outcome: null, code: value.code });
    if (!isLabelPrintRequest(value.request) || value.kind === 'committed' && !isLabelPrintOutcome(value.outcome, value.request))
      return publish({ phase: 'blocked', request: null, outcome: null, code: 'RECOVERY_STATE_INVALID' });
    return publish({ phase: value.kind === 'committed' ? 'success' : 'unknown', request: structuredClone(value.request),
      outcome: value.kind === 'committed' ? structuredClone(value.outcome) : null, code: value.kind === 'pending' ? value.code ?? 'OUTCOME_UNKNOWN' : null });
  }
  function run(operation: () => Promise<LabelPrintState>) {
    if (flight) return flight;
    const pending = Promise.resolve().then(operation); flight = pending;
    void pending.finally(() => { if (flight === pending) flight = null; });
    return pending;
  }
  const blocked = (code: string) => publish({ ...state, phase: 'blocked', code, outcome: null });
  function readRecovery(retry: boolean): Promise<LabelPrintState> {
    if (!adapter?.recovery) return Promise.resolve(state);
    return run(async () => {
      publish({ ...state, phase: 'pending', code: null });
      try { return receive(await (retry ? adapter.recovery!.retry() : adapter.recovery!.restore())); }
      catch { restored = false; return blocked('RECOVERY_UNAVAILABLE'); }
    });
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    available: () => adapter?.available === true && !!adapter.recovery && restored && journalEmpty && !['pending', 'unknown', 'success'].includes(state.phase)
      && !(state.phase === 'blocked' && state.code?.startsWith('RECOVERY_')),
    restore: () => readRecovery(false),
    reconcile: () => readRecovery(true),
    submit(row: Readonly<LabelReportRow>): Promise<LabelPrintState> {
      if (flight) return flight;
      if (adapter?.available !== true) return Promise.resolve(blocked('PRINT_ACTOR_SCOPE_UNCONFIRMED'));
      if (!adapter.recovery) return Promise.resolve(blocked('RECOVERY_UNAVAILABLE'));
      if (!restored || !journalEmpty || ['unknown', 'success'].includes(state.phase) || state.phase === 'blocked' && state.code?.startsWith('RECOVERY_')) return Promise.resolve(state);
      publish({ phase: 'pending', request: null, outcome: null, code: null });
      return run(async () => {
        let dispatched = false, request: LabelPrintRequest | null = null;
        try {
          const context = await adapter.readContext();
          request = { commandId: makeId(), epoch: context.epoch, command: labelPrintCommand(row), entityId: context.entityId,
            expectedVersion: context.version, payload: { labelCode: row.labelCode, expectedPrintCount: row.printCount, expectedStatus: row.status } };
          if (!isLabelPrintRequest(request)) throw fail(422, 'COMMAND_CONTEXT_UNAVAILABLE');
          publish({ ...state, request }); dispatched = true; journalEmpty = false;
          const outcome = await adapter.execute(structuredClone(request));
          if (!isLabelPrintOutcome(outcome, request)) throw new Error('INVALID_RESPONSE');
          return publish({ phase: 'success', request, outcome: structuredClone(outcome), code: null });
        } catch (error) {
          const value = error as { status?: number; code?: string };
          if (dispatched && adapter.recovery) {
            try {
              const recovered = await adapter.recovery.restore();
              if (recovered.kind !== 'empty') return receive(recovered);
              journalEmpty = true;
            } catch { return publish({ phase: 'unknown', request, outcome: null, code: 'RECOVERY_UNAVAILABLE' }); }
          }
          const definitive = !dispatched || !!value.status && value.status >= 400 && value.status < 500 && ![408, 429].includes(value.status)
            || ['MOCK_STORAGE_UNAVAILABLE', 'MOCK_STATE_INVALID'].includes(value.code ?? '');
          return publish({ phase: definitive ? 'failed' : 'unknown', request, outcome: null, code: value.code ?? (definitive ? 'PRINT_JOB_FAILED' : 'OUTCOME_UNKNOWN') });
        }
      });
    },
    dismiss(): Promise<boolean> {
      if (dismissal) return dismissal;
      if (flight || ['pending', 'unknown'].includes(state.phase)) return Promise.resolve(false);
      dismissal = Promise.resolve().then(async () => {
        if (state.phase === 'success' && state.request && adapter?.recovery) {
          try { await adapter.recovery.acknowledge(state.request.commandId); journalEmpty = true; }
          catch { blocked('RECOVERY_ACKNOWLEDGEMENT_FAILED'); return false; }
        }
        publish({ phase: 'idle', request: null, outcome: null, code: null }); return true;
      }).finally(() => { dismissal = null; });
      return dismissal;
    },
  };
}
