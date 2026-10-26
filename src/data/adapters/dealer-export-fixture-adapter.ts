import seed from '../fixtures/S25.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { DEALER_EXPORT_SORT_KEYS, type DealerExportAdapter, type DealerExportQuery, type DealerExportRow, type DealerExportSummary } from '../../contracts/dealer-export-report';

/** Scenario injection is for isolated DEV tests; never a UI product switch. */
export function createDealerExportRowsAdapter(input: readonly DealerExportRow[], sourceId: string): DealerExportAdapter {
  const dealers = new Set(input.map(row => row.dealer));
  return createListFixtureAdapter<DealerExportRow, DealerExportQuery, DealerExportSummary>({
    sourceId, source: { rows: [...input], completeness: 'complete', scope: 'detail', total: input.length, aggregateTotal: seed.summary.dealers },
    summary: seed.summary,
    filterOptions: { dealer: row => row.dealer },
    search: query => ({ value: query.search, fields: [row => row.dealer, row => row.recipient] }),
    filters: query => [row => !query.dealer || row.dealer === query.dealer],
    sort: query => ({ type: query.sortKey === 'lastExport' ? 'date' : 'number', value: row => row[query.sortKey], direction: query.sortDirection }),
    stableId: row => row.rowKey,
    validate: query => {
      if (typeof query.search !== 'string' || typeof query.dealer !== 'string' || (query.dealer !== '' && !dealers.has(query.dealer)) || query.status !== ''
        || !DEALER_EXPORT_SORT_KEYS.includes(query.sortKey) || !['asc', 'desc'].includes(query.sortDirection)
        || !Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to)
        return { reason: 'INVALID_QUERY', detail: 'S25 query lacks a sourced field/option/sort binding.' };
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to)
        return { reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'Only the complete 04–10/09/2026 snapshot is sourced, not subranges or other dates.' };
      return null;
    },
  });
}
export const createDealerExportFixtureAdapter = (): DealerExportAdapter => createDealerExportRowsAdapter(seed.rows, 'S25_P11_W09_SELECTED5_MD');
