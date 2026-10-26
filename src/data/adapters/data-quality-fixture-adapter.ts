import seed from '../fixtures/S24.seed.json';
import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { parseIsoDate } from '../../shared/date-picker-calendar';
import { DATA_QUALITY_RESULTS, DATA_QUALITY_SORT_KEYS, type DataQualityAdapter, type DataQualityQuery, type DataQualityRow, type DataQualitySummary } from '../../contracts/data-quality-report';

/** Separate scenario injection for DEV only. The approved whole-period summary never derives from rows. */
export function createDataQualityRowsAdapter(input: readonly DataQualityRow[], sourceId: string): DataQualityAdapter {
  return createListFixtureAdapter<DataQualityRow, DataQualityQuery, DataQualitySummary>({
    sourceId, source: { rows: structuredClone([...input]), completeness: 'complete', scope: 'detail', total: input.length, aggregateTotal: seed.summary.total },
    summary: seed.summary,
    filterOptions: { result: row => row.result },
    search: query => ({ value: query.search, fields: [row => row.referenceCode, row => row.object] }),
    filters: query => [row => !query.result || row.result === query.result, row => !query.needsReview || row.result === 'Chênh lệch' || row.result === 'Lỗi dữ liệu'],
    sort: query => query.sortKey === null ? undefined : ({
      // The two comparison fields contain heterogeneous strings, NOT homogeneous quantities.
      type: query.sortKey === 'updatedAt' ? 'date' : query.sortKey === 'referenceCode' ? 'code' : 'text',
      direction: query.sortDirection, value: row => row[query.sortKey!],
    }),
    validate: query => {
      if (typeof query.search !== 'string' || query.dataType !== '' || typeof query.needsReview !== 'boolean'
        || !Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.some(size => size === query.pageSize)
        || (query.result !== '' && !DATA_QUALITY_RESULTS.includes(query.result))
        || (query.sortKey !== null && !DATA_QUALITY_SORT_KEYS.includes(query.sortKey)) || !['asc', 'desc'].includes(query.sortDirection)
        || !query.period || !parseIsoDate(query.period.from) || !parseIsoDate(query.period.to) || query.period.from > query.period.to) {
        return { reason: 'INVALID_QUERY', detail: 'Điều kiện chưa có lựa chọn hoặc binding hợp lệ trong S24.' };
      }
      if (query.period.from !== seed.period.from || query.period.to !== seed.period.to) return {
        reason: 'MISSING_PERIOD_SNAPSHOT', detail: 'S24 chỉ có snapshot 04–10/09/2026; không suy khoảng con từ chart hoặc năm dòng chi tiết.',
      };
      return null;
    },
  });
}
export function createDataQualityFixtureAdapter(): DataQualityAdapter {
  return createDataQualityRowsAdapter(seed.rows as DataQualityRow[], 'S24_P07_W05_P01_r01_SELECTED5');
}
