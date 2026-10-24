import seed from '../fixtures/S20.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { MOVEMENT_SORT_KEYS, MOVEMENT_TYPES, type MovementAdapter, type MovementQuery, type MovementRow, type MovementSummary } from '../../contracts/movement-history';

/** Detail queries never recalculate the independently sourced full-period summary. */
export function createMovementRowsAdapter(input: readonly MovementRow[], sourceId: string): MovementAdapter {
  const rows = structuredClone([...input]);
  const performers = new Set(rows.map(row => row.performer));
  return createListFixtureAdapter<MovementRow, MovementQuery, MovementSummary>({
    sourceId,
    source: { rows, completeness: 'complete', scope: 'detail', total: rows.length, aggregateTotal: seed.summary.transactions },
    summary: seed.summary,
    optionCatalogue: { type: seed.typeOptions },
    filterOptions: { performer: row => row.performer },
    search: query => ({ value: query.search, fields: [row => row.code, row => row.subject] }),
    filters: query => [row => !query.type || row.type === query.type, row => !query.performer || row.performer === query.performer],
    sort: query => ({ type: query.sortKey === 'quantity' ? 'number' : query.sortKey === 'occurredAt' ? 'date' : query.sortKey === 'code' ? 'code' : 'text', direction: query.sortDirection, value: row => row[query.sortKey] }),
    // Shared fallback preserves source order for equal values.
    validate: query => {
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
        || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.type !== '' && !MOVEMENT_TYPES.includes(query.type))
        || (query.performer !== '' && !performers.has(query.performer))
        || !MOVEMENT_SORT_KEYS.includes(query.sortKey) || !['asc','desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn hợp lệ của S20.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) {
        return { reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'S20 chỉ có snapshot 04/09/2026–10/09/2026; chuỗi giao dịch mỗi ngày không cung cấp tổng sản phẩm cho kỳ khác.' };
      }
      return null;
    },
  });
}
export function createMovementFixtureAdapter(): MovementAdapter { return createMovementRowsAdapter(seed.rows as MovementRow[], 'S20_P04_W02_DETAIL5'); }
