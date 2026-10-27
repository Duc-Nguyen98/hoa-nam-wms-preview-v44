import { validateBusinessDateRange } from '../../shared/date-policy';
import type { OperationalSnapshot } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import type { CommitSnapshotData } from '../../preview-mock/business-atomic';
import type { BusinessRecord } from '../../preview-mock/business-repository';
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
export function currentAuditPeriod(now = new Date().toISOString()): AuditPeriod {
  const today = vietnamDate(now);
  return { from: today, to: today };
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
function freeze<T>(value: T): T { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); } return value; }
function proofStockEvents(proof: CommitSnapshotData) {
  const records = proof.changes.map(change => JSON.parse(change.canonicalRecord) as BusinessRecord);
  const events = records.filter(record => record.kind === 'stock-event');
  const audits = records.filter(record => record.kind === 'audit-event');
  if (new Set(proof.changes.map(change => change.entityId)).size !== proof.changes.length
    || !Array.isArray(proof.eventIds) || events.length !== proof.eventIds.length || events.some((event, index) => event.id !== proof.eventIds[index])
    || !Array.isArray(proof.auditIds) || audits.length !== proof.auditIds.length || audits.some((audit, index) => audit.id !== proof.auditIds[index])) return fail('INCOMPLETE_AUDIT_RELATIONSHIP');
  return events;
}
export function projectOperationalAudit(snapshot: OperationalSnapshot, query: OperationalReportQuery) {
  const report = pinOperationalReports(snapshot, query);
  const rows: AuditRow[] = report.audit.map(record => {
    const d = record.data as { actor: string; action: string; entityId: string; commandId: string; sourceSurface: string; timestamp: string; commitSnapshotId: string; scenarioId: string; generation: number; previousVersion: number | null; newVersion: number; FK: string[]; eventIds: string[] };
    const proof = snapshot.commitSnapshots.find(row => row.id === d.commitSnapshotId)?.data as CommitSnapshotData | undefined;
    const entity = proof?.changes.find(change => change.entityId === d.entityId);
    if (!proof || !entity || proof.id !== d.commitSnapshotId || proof.epoch !== report.token.epoch || ['actor', 'action', 'entityId', 'commandId', 'sourceSurface', 'timestamp', 'commitSnapshotId'].some(key => typeof d[key as keyof typeof d] !== 'string' || !d[key as keyof typeof d])
      || d.actor !== proof.actorKey || d.commandId !== proof.commandId || d.timestamp !== proof.committedAt || !proof.auditIds.includes(record.id)
      || d.scenarioId !== report.token.scenarioId || d.generation !== report.token.generation || d.previousVersion !== entity.previousVersion || d.newVersion !== entity.version
      || !Array.isArray(d.FK) || d.FK.some(id => typeof id !== 'string' || !proof.changes.some(change => change.entityId === id))
      || !Array.isArray(d.eventIds) || new Set(d.eventIds).size !== d.eventIds.length) return fail('INCOMPLETE_AUDIT_RELATIONSHIP');
    // A batch proof may contain several entity audits. The canonical audit's
    // FK and primary document identify its complete stock-event subset.
    const events = proofStockEvents(proof);
    const relatedEvents = events.filter(event => d.FK.includes(event.id) || (event.data as { documentId?: string }).documentId === d.entityId);
    if (d.eventIds.length !== relatedEvents.length || d.eventIds.some(id => typeof id !== 'string' || !id || !relatedEvents.some(event => event.id === id))
      || relatedEvents.some(event => {
        const data = event.data as { actor: string; commandId: string; committedAt: string; commitSnapshotId: string; scenarioId: string; generation: number };
        return data.actor !== proof.actorKey || data.commandId !== proof.commandId || data.committedAt !== proof.committedAt || data.commitSnapshotId !== proof.id
          || data.scenarioId !== report.token.scenarioId || data.generation !== report.token.generation;
      })) return fail('INCOMPLETE_AUDIT_RELATIONSHIP');
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
  let acceptedToken: OperationalSnapshot['token'] | null = null;
  const listeners = new Set<() => void>(), current = (token: number) => active && sequence === token;
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (value: AuditPeriod) => {
    if (!validateBusinessDateRange(value, { now: new Date(clock()) }).valid) fail('INVALID_PERIOD');
  };
  async function load(next?: AuditPeriod) {
    if (!active) return;
    const token = ++sequence;
    // Keep the last accepted projection visible while a refresh is in flight.
    // The UI can therefore keep the selected event pinned and show a loading
    // state without replacing it with a different row or closing its dialog.
    publish({ loading: true, error: '' });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE'); const requested = next ?? period ?? currentAuditPeriod(clock());
      period = { ...requested }; publish({ period: { ...requested } }); validatePeriod(requested);
      const snapshot = await adapter.read(); if (!current(token)) return;
      validatePeriod(requested);
      const previous = acceptedToken, nextToken = snapshot.token;
      if (previous && previous.epoch === nextToken.epoch && previous.scenarioId === nextToken.scenarioId
        && previous.generation === nextToken.generation && nextToken.revision < previous.revision) fail('STALE_AUDIT_SNAPSHOT');
      const model = projectOperationalAudit(snapshot, { ...requested, asOf: clock() });
      acceptedToken = { ...nextToken }; publish({ model });
    } catch (error) { if (current(token)) publish({ model: null, error: (error as { code?: string }).code ?? 'READ_FAILED' }); }
    finally { if (current(token)) publish({ loading: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume(next?: AuditPeriod) { active = true; return load(next); }, suspend() { ++sequence; publish({ model: null, loading: false }); active = false; } };
}
