import seed from '../fixtures/S23.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { LABEL_SORT_KEYS, LABEL_STATUSES, type LabelReportAdapter, type LabelReportQuery, type LabelReportRow, type LabelReportSummary } from '../../contracts/label-report';

/** Injected rows are exclusively for a separate DEV QA scenario; summary stays independent. */
export function createLabelReportRowsAdapter(input: readonly LabelReportRow[], sourceId: string,
  summary: LabelReportSummary = seed.summary): LabelReportAdapter {
  return createListFixtureAdapter<LabelReportRow, LabelReportQuery, LabelReportSummary>({
    sourceId, source: { rows: structuredClone([...input]), completeness: 'complete', scope: 'detail', total: input.length, aggregateTotal: summary.uniqueLabels },
    summary: structuredClone(summary),
    optionCatalogue: { status: seed.statusOptions },
    search: query => ({ value: query.search, fields: [row => row.labelCode, row => row.documentCode, row => row.sku, row => row.productName] }),
    filters: query => [row => !query.status || row.status === query.status],
    sort: query => query.sortKey === null ? undefined : ({
      type: query.sortKey === 'printCount' ? 'number' : query.sortKey === 'printedAt' ? 'date' : query.sortKey === 'status' ? 'text' : 'code',
      direction: query.sortDirection, value: row => row[query.sortKey!],
    }),
    // Equal values retain source order in both directions.
    validate: query => {
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1
        || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.status !== '' && !LABEL_STATUSES.includes(query.status))
        || (query.sortKey !== null && !LABEL_SORT_KEYS.includes(query.sortKey)) || !['asc','desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'Điều kiện không thuộc lựa chọn hợp lệ của S23.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) return {
        reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'S23 chỉ có snapshot 04–10/09/2026; không suy số liệu kỳ khác từ năm nhãn hoặc tổng kỳ.',
      };
      return null;
    },
  });
}
export function createLabelReportFixtureAdapter(): LabelReportAdapter {
  return createLabelReportRowsAdapter(seed.rows as LabelReportRow[], 'S23_P05_R04_P01_r02_SELECTED5');
}
