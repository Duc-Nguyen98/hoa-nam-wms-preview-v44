import { validateBusinessDateRange } from '../../shared/date-policy';
import type { OperationalSnapshot } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import type { CommitSnapshotData } from '../../preview-mock/business-atomic';
import { pinOperationalReports, vietnamDate, type OperationalReportQuery } from '../../operations/operational-reports';
import { queryTable } from '../../shared/table-query';

export type AuditReadAdapter = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export type AuditPeriod = Pick<OperationalReportQuery, 'from' | 'to'>;
export interface AuditRow {
  id: string; at: string; actorId: string; action: string; sourceSurface: string; entityId: string; commandId: string; commitSnapshotId: string;
  previousVersion: number | null; newVersion: number; relatedIds: string[]; eventIds: string[];
}
export interface AuditFilter { search: string; action: string; actorId: string; sortKey: 'at' | 'actorId' | 'id'; sortDirection: 'asc' | 'desc'; page: number; pageSize: number }
export const DEFAULT_AUDIT_FILTER: AuditFilter = { search: '', action: '', actorId: '', sortKey: 'at', sortDirection: 'desc', page: 1, pageSize: 10 };
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
function freeze<T>(value: T): T { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }
export function projectOperationalAudit(snapshot: OperationalSnapshot, query: OperationalReportQuery) {
  const report = pinOperationalReports(snapshot, query);
  const rows: AuditRow[] = report.audit.map(record => {
    const d = record.data as { actor: string; action: string; entityId: string; commandId: string; sourceSurface: string; timestamp: string; commitSnapshotId: string; scenarioId: string; generation: number; previousVersion: number | null; newVersion: number; FK: string[]; eventIds: string[] };
    const proof = snapshot.commitSnapshots.find(row => row.id === d.commitSnapshotId)?.data as CommitSnapshotData | undefined;
    const entity = proof?.changes.find(change => change.entityId === d.entityId);
    if (!proof || !entity || ['actor', 'action', 'entityId', 'commandId', 'sourceSurface', 'timestamp', 'commitSnapshotId'].some(key => typeof d[key as keyof typeof d] !== 'string' || !d[key as keyof typeof d])
      || d.actor !== proof.actorKey || d.commandId !== proof.commandId || d.timestamp !== proof.committedAt || !proof.auditIds.includes(record.id)
      || d.scenarioId !== report.token.scenarioId || d.generation !== report.token.generation || d.previousVersion !== entity.previousVersion || d.newVersion !== entity.version
      || !Array.isArray(d.FK) || d.FK.some(id => typeof id !== 'string' || !proof.changes.some(change => change.entityId === id))
      || !Array.isArray(d.eventIds) || d.eventIds.length !== proof.eventIds.length || d.eventIds.some((id, index) => id !== proof.eventIds[index])) return fail('INCOMPLETE_AUDIT_RELATIONSHIP');
    return { id: record.id, at: d.timestamp, actorId: d.actor, action: d.action, sourceSurface: d.sourceSurface, entityId: d.entityId, commandId: d.commandId,
      commitSnapshotId: d.commitSnapshotId, previousVersion: d.previousVersion, newVersion: d.newVersion, relatedIds: [...d.FK], eventIds: [...d.eventIds] };
  });
  if (new Set(rows.map(row => row.id)).size !== rows.length) return fail('INCOMPLETE_AUDIT_RELATIONSHIP');
  return freeze({ report, rows, active: snapshot.scenario !== null, actions: [...new Set(rows.map(row => row.action))].sort(), actors: [...new Set(rows.map(row => row.actorId))].sort() });
}
export type OperationalAuditModel = ReturnType<typeof projectOperationalAudit>;
export function queryOperationalAudit(model: OperationalAuditModel, query: AuditFilter) {
  return queryTable({ source: { rows: model.rows, total: model.rows.length, completeness: 'complete' }, query,
    search: { value: query.search, fields: [row => row.id, row => row.entityId, row => row.commandId, row => row.commitSnapshotId, row => row.actorId, row => row.action, row => row.sourceSurface, row => row.eventIds.join(' '), row => row.relatedIds.join(' ')] },
    filters: [row => !query.action || row.action === query.action, row => !query.actorId || row.actorId === query.actorId],
    sort: { type: query.sortKey === 'at' ? 'date' : query.sortKey === 'id' ? 'code' : 'text', value: row => row[query.sortKey], direction: query.sortDirection }, stableId: row => row.id });
}
export function createOperationalAuditReader(adapter: AuditReadAdapter, clock: () => string = () => new Date().toISOString()) {
  let state: { model: OperationalAuditModel | null; loading: boolean; error: string; period: AuditPeriod | null } = { model: null, loading: false, period: null, error: '' };
  let active = true, sequence = 0, period: AuditPeriod | null = null;
  const listeners = new Set<() => void>(), current = (token: number) => active && sequence === token;
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (value: AuditPeriod) => {
    if (!validateBusinessDateRange(value, { now: new Date(clock()) }).valid) fail('INVALID_PERIOD');
  };
  async function load(next?: AuditPeriod) {
    if (!active) return; const token = ++sequence; publish({ model: null, loading: true, error: '' });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE'); const today = vietnamDate(clock()), requested = next ?? period ?? { from: today, to: today };
      period = { ...requested }; publish({ period: { ...requested } }); validatePeriod(requested);
      const snapshot = await adapter.read(); if (!current(token)) return;
      validatePeriod(requested);
      const model = projectOperationalAudit(snapshot, { ...requested, asOf: clock() }); publish({ model });
    } catch (error) { if (current(token)) publish({ model: null, error: (error as { code?: string }).code ?? 'READ_FAILED' }); }
    finally { if (current(token)) publish({ loading: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume() { active = true; return load(); }, suspend() { ++sequence; publish({ model: null, loading: false }); active = false; } };
}
