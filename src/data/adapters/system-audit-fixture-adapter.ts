import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { SYSTEM_AUDIT_PERIOD, SYSTEM_AUDIT_SORT_KEYS, type SystemAuditAdapter, type SystemAuditQuery, type SystemAuditRow, type SystemAuditSummary } from '../../contracts/system-audit';

/** Explicit injection only. No bundled candidate is activated by this adapter. */
export function createSystemAuditRowsAdapter(sourceRows: readonly SystemAuditRow[], sourceId: string, summary: SystemAuditSummary): SystemAuditAdapter {
  const eventTypes = new Set(sourceRows.map(row => row.eventType));
  const actorIds = new Set(sourceRows.map(row => row.actorId));
  return createListFixtureAdapter<SystemAuditRow, SystemAuditQuery, SystemAuditSummary>({
    sourceId,
    source: { rows: structuredClone([...sourceRows]), completeness: 'complete', scope: 'detail', total: sourceRows.length },
    summary,
    search: query => ({ value: query.search, fields: [row => row.id, row => row.documentId, row => row.movementId, row => row.actorName] }),
    filters: query => [
      row => !query.eventType || row.eventType === query.eventType,
      row => !query.module || row.module === query.module,
      row => !query.actorId || row.actorId === query.actorId,
    ],
    sort: query => query.sortKey === null ? undefined : ({
      type: query.sortKey === 'at' ? 'date' : query.sortKey === 'id' ? 'code' : 'text',
      direction: query.sortDirection,
      value: row => row[query.sortKey!],
    }),
    stableId: row => row.id,
    filterOptions: { eventType: row => row.eventType, actorId: row => row.actorId },
    optionCatalogue: { module: [] },
    validate: query => {
      if (typeof query.search !== 'string' || typeof query.eventType !== 'string' || query.module !== '' || typeof query.actorId !== 'string'
        || (query.eventType !== '' && !eventTypes.has(query.eventType)) || (query.actorId !== '' && !actorIds.has(query.actorId))
        || !Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.sortKey !== null && !SYSTEM_AUDIT_SORT_KEYS.includes(query.sortKey)) || !['asc', 'desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'S27 query has an invalid range, filter, sort or paging value.' };
      }
      if (query.period.from !== SYSTEM_AUDIT_PERIOD.from || query.period.to !== SYSTEM_AUDIT_PERIOD.to) {
        return { reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'Metadata 25/09–01/10/2026 does not confirm event coverage; no subperiod or new period is activated.' };
      }
      return null;
    },
  });
}
export function createSystemAuditFixtureAdapter(): SystemAuditAdapter {
  return { async read(query) { return { kind: 'blocked', query: structuredClone(query), reason: 'FIXTURE_NOT_SELECTED', detail: 'active_fixture=null. Owner selection of fixture, coverage and mappings is required before runtime activation.' }; } };
}
