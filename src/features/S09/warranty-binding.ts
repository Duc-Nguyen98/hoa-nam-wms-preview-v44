import { DEFAULT_DEFECTS_QUERY, type DefectsDataAdapter, type DefectRow } from '../../contracts/defects';
import type { OperationalCommand, OperationalOutcome, OperationalSnapshot, WarrantyCaseData, TypedOperationalRecord } from '../../contracts/operational-preview';
import type { CommandRecoveryResult } from '../../data/command-recovery';
import { hasOperationalCommitProof, isOperationalOutcome, type createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { validateCommitSnapshot } from '../../preview-mock/business-atomic';
import type { BusinessRecord } from '../../preview-mock/business-repository';
import { canEditWarrantyDiagnosis, type WarrantyDiagnosisDraft, type WarrantyDiagnosisSubmission } from './warranty-diagnosis-form';

export type WarrantyOperationalAdapter = ReturnType<typeof createOperationalWebAdapter>;
export type WarrantyCaseRecord = TypedOperationalRecord<WarrantyCaseData>;
export type WarrantyFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
type Recovery = CommandRecoveryResult<OperationalCommand, OperationalOutcome>;
export interface CanonicalDefect { id: string; version: number; row: DefectRow }
export interface WarrantyBindingState {
  snapshot: OperationalSnapshot | null; defects: CanonicalDefect[]; busy: boolean;
  recovery: Recovery; error: string;
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const code = (e: unknown) => (e as { code?: string })?.code ?? 'READ_FAILED';
export function warrantyLocalDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
export function sameWarrantyScope(snapshot: OperationalSnapshot, fence: WarrantyFence) {
  return !!snapshot.scenario && snapshot.epoch === fence.epoch && snapshot.token.scenarioId === fence.scenarioId && snapshot.token.generation === fence.generation;
}
export interface WarrantySelection { id: string; fence: WarrantyFence }
export function findSelectedWarrantyCase(snapshot: OperationalSnapshot | null, selection: WarrantySelection | null) {
  if (!snapshot || !selection || !sameWarrantyScope(snapshot, selection.fence)) return null;
  return snapshot.warrantyCases.find(row => row.id === selection.id) ?? null;
}
/** Read every page from the existing canonical S02 reader. Render keys are never persisted IDs. */
export async function readWarrantyDefects(adapter: DefectsDataAdapter) {
  const rows: CanonicalDefect[] = []; let epoch = '', revision = 0, total = 0, pages = 1;
  for (let page = 1; page <= pages; page++) {
    const result = await adapter.read({ ...DEFAULT_DEFECTS_QUERY, page });
    if (result.kind !== 'ready' || !result.model.commandContext) fail('DEFECT_READ_UNAVAILABLE');
    const { model } = result as Extract<typeof result, { kind: 'ready' }>;
    const ctx = model.commandContext!;
    if (page === 1) { epoch = ctx.epoch; revision = ctx.snapshotRevision; total = model.pagination.total; pages = model.pagination.pageCount; }
    if (ctx.epoch !== epoch || ctx.snapshotRevision !== revision || model.pagination.total !== total || model.pagination.page !== page) fail('READ_CONTEXT_CHANGED');
    for (const row of model.rows) {
      const target = ctx.records[row.key];
      if (!target || !target.entityId || !Number.isSafeInteger(target.version) || target.version < 1) fail('DEFECT_READ_UNAVAILABLE');
      rows.push({ id: target.entityId, version: target.version, row });
    }
  }
  if (rows.length !== total || new Set(rows.map(r => r.id)).size !== rows.length) fail('DEFECT_READ_INCOMPLETE');
  return { epoch, rows };
}
export function caseTimeline(snapshot: OperationalSnapshot, caseId: string) {
  return snapshot.caseEvents.filter(event => (event.data as { caseId?: string }).caseId === caseId)
    .sort((a, b) => {
      const revision = (event: BusinessRecord) => Number((snapshot.commitSnapshots.find(proof => proof.id === (event.data as { commitSnapshotId: string }).commitSnapshotId)?.data as { revision?: number })?.revision ?? 0);
      return revision(a) - revision(b);
    });
}
export function nextWarrantyState(state: WarrantyCaseData['state']) {
  return ({ CHECKING: 'REPAIRING', REPAIRING: 'REPAIRED', REPAIRED: 'RETURNED' } as const)[state as 'CHECKING' | 'REPAIRING' | 'REPAIRED'] ?? null;
}
export function assertWarrantyAccepted(snapshot: OperationalSnapshot, request: OperationalCommand, outcome: OperationalOutcome) {
  if (!['warranty.diagnose', 'warranty.transition'].includes(request.command) || !isOperationalOutcome(outcome, request, snapshot.actorKey)) fail('INVALID_RESPONSE');
  if (!sameWarrantyScope(snapshot, request)) fail('RECOVERY_ARCHIVED_SCENARIO');
  const row = snapshot.warrantyCases.find(r => r.id === outcome.receipt.entityId);
  if (!row || row.version < outcome.receipt.version || snapshot.snapshotRevision < outcome.receipt.snapshotRevision) fail('INVALID_RESPONSE');
  validateCommitSnapshot([...snapshot.warrantyCases, ...snapshot.caseEvents, ...snapshot.auditEvents, ...snapshot.commitSnapshots] as BusinessRecord[], outcome.receipt);
  const saved = outcome.receipt.record.data as WarrantyCaseData;
  const event = snapshot.caseEvents.find(r => r.id === 'case-event:' + request.commandId);
  const data = event?.data as { caseId?: string; commandId?: string; actor?: string; state?: string; commitSnapshotId?: string } | undefined;
  if (!data || data.caseId !== row!.id || data.commandId !== request.commandId || data.actor !== outcome.receipt.actorKey || data.state !== saved.state || data.commitSnapshotId !== outcome.receipt.commitSnapshotId) fail('INVALID_RESPONSE');
  if (request.command === 'warranty.diagnose') {
    const p = request.payload as OperationalCommand<'warranty.diagnose'>['payload'];
    if (saved.technicianDiagnosis !== p.technicianDiagnosis || saved.expectedFinishDate !== p.expectedFinishDate || JSON.stringify(saved.defectIds) !== JSON.stringify(p.defectIds)) fail('INVALID_RESPONSE');
  } else if (saved.state !== (request.payload as { state: string }).state) fail('INVALID_RESPONSE');
  return row;
}
export interface WarrantyEditor {
  caseId: string; version: number; fence: WarrantyFence; draft: WarrantyDiagnosisDraft;
}
/** Explicit reload rebases only this same case and scenario; dirty values are retained. */
export function refreshWarrantyEditor(editor: WarrantyEditor, snapshot: OperationalSnapshot): WarrantyEditor {
  if (!sameWarrantyScope(snapshot, editor.fence)) return fail('STALE_SCENARIO');
  const row = snapshot.warrantyCases.find(r => r.id === editor.caseId);
  if (!row) return fail('CASE_NOT_FOUND');
  return { ...editor, version: row.version, fence: snapshot.token };
}

/** Consumer orchestration only: the Shared adapter owns authorization, durable journal and repository. */
export function createWarrantyBinding(adapter: WarrantyOperationalAdapter, defectsAdapter: DefectsDataAdapter) {
  let state: WarrantyBindingState = { snapshot: null, defects: [], busy: false, recovery: { kind: 'blocked', code: 'READ_REQUIRED' }, error: '' };
  let active = true, serial = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<WarrantyBindingState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const current = (token: number) => active && serial === token;
  const restore = () => adapter.recovery.restore().catch(e => ({ kind: 'blocked' as const, code: code(e) }));
  async function read() {
    const defects = await readWarrantyDefects(defectsAdapter);
    // Operational read is last: its canonical session/generation fence covers resets during ancillary reads.
    const snapshot = await adapter.read();
    if (snapshot.epoch !== defects.epoch) fail('READ_CONTEXT_CHANGED');
    return { snapshot, defects: defects.rows };
  }
  async function run<T>(action: (token: number) => Promise<T>): Promise<T | undefined> {
    if (!active || state.busy) return;
    const token = ++serial; publish({ busy: true, error: '' });
    try { return await action(token); }
    catch (error) {
      if (current(token)) { const recovery = await restore(); if (current(token)) publish({ recovery, snapshot: null, defects: [], error: code(error) }); }
    } finally { if (current(token)) publish({ busy: false }); }
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, explicitRecovery = false) {
    const next = await read();
    if (!sameWarrantyScope(next.snapshot, request)) {
      if (!explicitRecovery) fail('RECOVERY_ARCHIVED_SCENARIO');
      if (!['warranty.diagnose', 'warranty.transition'].includes(request.command) || !hasOperationalCommitProof(next.snapshot, request, outcome)) fail('ARCHIVE_PROOF_REQUIRED');
      if (!current(token)) return;
      await adapter.recovery.acknowledge(request.commandId);
      if (!current(token)) return;
      publish({ ...next, recovery: { kind: 'empty' }, error: '' });
      return { caseId: null, commandId: request.commandId, archived: true as const };
    }
    assertWarrantyAccepted(next.snapshot, request, outcome);
    if (!current(token)) return;
    await adapter.recovery.acknowledge(request.commandId);
    if (!current(token)) return;
    publish({ ...next, recovery: { kind: 'empty' }, error: '' });
    return { caseId: outcome.receipt.entityId, commandId: request.commandId, archived: false as const };
  }
  const load = () => run(async token => {
    if (!adapter.available) fail('COMMAND_UNAVAILABLE');
    const recovery = await restore();
    if (recovery.kind === 'blocked') fail(recovery.code);
    const next = await read();
    if (current(token)) publish({ ...next, recovery, error: recovery.kind === 'empty' ? '' : 'OUTCOME_UNKNOWN' });
    // Ordinary navigation/focus reads never replay or acknowledge an unrelated tab's intent.
  });
  function execute(make: (snapshot: OperationalSnapshot) => OperationalCommand) {
    return run(async token => {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE');
      if (state.recovery.kind !== 'empty' || !state.snapshot) fail('RECOVERY_PENDING');
      const request = make(state.snapshot!), outcome = await adapter.execute(request);
      if (!current(token)) return;
      publish({ recovery: { kind: 'committed', request, outcome } });
      return accept(request, outcome, token);
    });
  }
  function target(snapshot: OperationalSnapshot, id: string, version: number, fence: WarrantyFence) {
    if (!sameWarrantyScope(snapshot, fence)) return fail('STALE_SCENARIO');
    const row = snapshot.warrantyCases.find(r => r.id === id);
    if (!row || row.version !== version) return fail('STALE_VERSION');
    return row;
  }
  function envelope(snapshot: OperationalSnapshot, id: string, version: number) {
    return { commandId: crypto.randomUUID(), epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation, entityId: id, expectedVersion: version };
  }
  return {
    getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume() { active = true; ++serial; publish({ busy: false }); return load(); }, suspend() { active = false; ++serial; },
    retry: () => run(async token => {
      let recovered = await restore();
      if (!current(token)) return;
      if (recovered.kind === 'pending' || recovered.kind === 'committed') {
        if (!['warranty.diagnose', 'warranty.transition'].includes(recovered.request.command)) fail('RECOVERY_COMMAND_MISMATCH');
        if (recovered.kind === 'pending') recovered = await adapter.recovery.retry();
        if (!current(token)) return;
        publish({ recovery: recovered });
        if (recovered.kind === 'committed') return accept(recovered.request, recovered.outcome, token, true);
      } else { const next = await read(); if (current(token)) publish({ ...next, recovery: recovered, error: recovered.kind === 'blocked' ? recovered.code : '' }); }
    }),
    diagnose(submission: WarrantyDiagnosisSubmission, version: number, fence: WarrantyFence) {
      return execute(snapshot => {
        const row = target(snapshot, submission.caseId, version, fence);
        if (!canEditWarrantyDiagnosis(row.data.state)) return fail('CASE_IMMUTABLE');
        return { ...envelope(snapshot, row.id, version), command: 'warranty.diagnose', payload: { defectIds: [...submission.defectIds], technicianDiagnosis: submission.technicianDiagnosis, expectedFinishDate: submission.expectedFinishDate } };
      });
    },
    transition(id: string, version: number, fence: WarrantyFence, next: 'REPAIRING' | 'REPAIRED' | 'RETURNED') {
      return execute(snapshot => {
        const row = target(snapshot, id, version, fence);
        if (nextWarrantyState(row.data.state) !== next) return fail('INVALID_CASE_TRANSITION');
        if (next === 'REPAIRING' && (!row.data.defectIds.length || !row.data.expectedFinishDate)) return fail('REPAIR_REQUIREMENTS');
        return { ...envelope(snapshot, id, version), command: 'warranty.transition', payload: { state: next } };
      });
    },
  };
}
