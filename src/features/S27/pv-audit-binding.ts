import type { PvAudit, PvDemoAdapter, PvDemoSnapshot } from '../../contracts/pv-demo';
import { SEARCH_DEBOUNCE_MS } from '../../shared/foundation';
import { queryTable, updateTableQuery } from '../../shared/table-query';

export type PvAuditReadAdapter = Pick<PvDemoAdapter, 'available' | 'readSnapshot'>;
export interface PvAuditQuery {
  search: string; command: string; actorKey: string;
  sortKey: 'committedAt' | 'id' | 'actorKey'; sortDirection: 'asc' | 'desc'; page: number; pageSize: number;
}
export const DEFAULT_PV_AUDIT_QUERY: PvAuditQuery = { search: '', command: '', actorKey: '', sortKey: 'committedAt', sortDirection: 'desc', page: 1, pageSize: 10 };
type AuditSource = Pick<PvDemoSnapshot, 'actorKey' | 'epoch' | 'snapshotRevision' | 'audits'>;
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
/** The Shared adapter validates the DTO and authority. Never join profile/master/scenario data here. */
export function projectPvAudits(snapshot: AuditSource) {
  const rows = structuredClone(snapshot.audits);
  return freeze({ identity: { actorKey: snapshot.actorKey, epoch: snapshot.epoch, revision: snapshot.snapshotRevision }, rows });
}
export type PvAuditModel = ReturnType<typeof projectPvAudits>;
export function queryPvAudits(model: PvAuditModel, query: PvAuditQuery) {
  return queryTable({ source: { rows: model.rows, total: model.rows.length, completeness: 'complete' }, query,
    search: { value: query.search, fields: [row => row.id, row => row.commandId, row => row.entityId, row => row.actorKey, row => row.command, row => row.before?.displayName, row => row.after.displayName] },
    filters: [row => !query.command || row.command === query.command, row => !query.actorKey || row.actorKey === query.actorKey],
    sort: { type: query.sortKey === 'committedAt' ? 'date' : query.sortKey === 'id' ? 'code' : 'text', value: row => row[query.sortKey], direction: query.sortDirection }, stableId: row => row.id });
}
export type PvAuditStatus = 'idle' | 'loading' | 'ready' | 'error' | 'forbidden' | 'unavailable';
export interface PvAuditSelection { readonly model: PvAuditModel; readonly query: PvAuditQuery; readonly id: string }
export interface PvAuditState {
  model: PvAuditModel | null; status: PvAuditStatus; query: PvAuditQuery; searchValue: string;
  debouncing: boolean; selection: PvAuditSelection | null;
}
export function resolvePvAuditDetail(state: PvAuditState): PvAudit | null {
  const { model, selection, query } = state;
  if (state.status !== 'ready' || state.debouncing || !model || !selection || selection.model !== model || selection.query !== query) return null;
  const result = queryPvAudits(model, query);
  return result.kind === 'ready' ? result.rows.find(row => row.id === selection.id) ?? null : null;
}
const forbiddenCodes = new Set(['SESSION_EXPIRED', 'CONFIRMATION_REQUIRED', 'FORBIDDEN', 'RECOVERY_ACTOR_MISMATCH', 'UNAUTHENTICATED']);
/** Screen-owned read-only lifecycle. The command and recovery interfaces are deliberately excluded. */
export function createPvAuditReader(adapter: PvAuditReadAdapter) {
  let state: PvAuditState = { model: null, status: 'idle', query: { ...DEFAULT_PV_AUDIT_QUERY }, searchValue: '', debouncing: false, selection: null };
  let active = true, sequence = 0, searchTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<PvAuditState>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const cancelSearch = () => { clearTimeout(searchTimer); searchTimer = undefined; };
  const updateQuery = (patch: Partial<PvAuditQuery>) => publish({ query: updateTableQuery(state.query, patch), selection: null });
  async function load() {
    if (!active) return;
    const request = ++sequence;
    cancelSearch();
    publish({ model: null, status: 'loading', selection: null, debouncing: false, query: { ...state.query, search: state.searchValue, page: 1 } });
    if (!adapter.available) { publish({ status: 'unavailable' }); return; }
    try {
      const snapshot = await adapter.readSnapshot();
      if (active && request === sequence) publish({ model: projectPvAudits(snapshot), status: 'ready' });
    } catch (error) {
      if (!active || request !== sequence) return;
      const failure = error as { code?: string; status?: number } | null;
      const status = failure?.code === 'COMMAND_UNAVAILABLE' ? 'unavailable'
        : failure?.status === 401 || failure?.status === 403 || forbiddenCodes.has(failure?.code ?? '') ? 'forbidden' : 'error';
      publish({ model: null, selection: null, status });
    }
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load, updateQuery,
    setSearch(value: string) {
      if (!active) return;
      cancelSearch(); publish({ searchValue: value, debouncing: value !== state.query.search, selection: null });
      if (value === state.query.search) return;
      searchTimer = setTimeout(() => { searchTimer = undefined; updateQuery({ search: value }); publish({ debouncing: false }); }, SEARCH_DEBOUNCE_MS);
    },
    resetQuery() { cancelSearch(); publish({ query: { ...DEFAULT_PV_AUDIT_QUERY }, searchValue: '', debouncing: false, selection: null }); },
    openDetail(id: string) {
      if (!state.model || state.status !== 'ready' || state.debouncing) return;
      const selection = { model: state.model, query: state.query, id };
      publish({ selection: resolvePvAuditDetail({ ...state, selection }) ? selection : null });
    },
    closeDetail() { publish({ selection: null }); },
    resume() { active = true; return load(); },
    suspend() { ++sequence; cancelSearch(); publish({ model: null, status: 'idle', selection: null, debouncing: false }); active = false; },
  };
}
