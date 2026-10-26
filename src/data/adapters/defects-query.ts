import type { DefectRow, DefectsPolicy, DefectsQuery } from '../../contracts/defects';
import { compareText, PAGE_SIZE_OPTIONS, queryTable } from '../../shared/table-query';

/** Confirmed preview matching: case/diacritic insensitive, đ→d, trimmed/collapsed whitespace. */
export const normalizeDefectsSearch = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

/** Both approved-fixture reads and isolated QA use this exact query pipeline. */
export function queryDefectsRows(
  rows: readonly DefectRow[],
  query: DefectsQuery,
  policy: DefectsPolicy = { searchMatch: 'folded-includes' },
  pageSizeOptions: readonly number[] = PAGE_SIZE_OPTIONS,
) {
  if (typeof query.search !== 'string' || !['all', 'active', 'inactive'].includes(query.status) ||
    (query.sort === null) !== (query.sortKey === null) ||
    (query.sort !== null && (!['asc', 'desc'].includes(query.sort) || !['code', 'name', 'description', 'status'].includes(query.sortKey!)))) {
    return { kind: 'blocked' as const, reason: 'INVALID_QUERY' as const, detail: 'Invalid S02 filter or sort key/direction.' };
  }
  const needle = normalizeDefectsSearch(query.search);
  if (needle && policy.searchMatch === null) return {
    kind: 'blocked' as const, reason: 'SEARCH_SEMANTICS_UNCONFIRMED' as const, detail: 'This adapter explicitly disabled search.',
  };
  if (!Number.isSafeInteger(query.pageSize) || query.pageSize < 1) return {
    kind: 'blocked' as const, reason: 'INVALID_QUERY' as const,
    detail: 'Page size must be a positive integer.',
  };
  if (!pageSizeOptions.includes(query.pageSize)) {
    const isSharedOption = PAGE_SIZE_OPTIONS.some(size => size === query.pageSize);
    return {
      kind: 'blocked' as const, reason: isSharedOption ? 'PAGE_SIZE_UNCONFIRMED' as const : 'INVALID_QUERY' as const,
      detail: `Page size must be one of ${pageSizeOptions.join(', ')} for this S02 fixture.`,
    };
  }
  const key = query.sortKey;
  const result = queryTable({
    source: { rows, total: rows.length, completeness: 'complete' }, query,
    filter: row => (query.status === 'all' || row.status === query.status) &&
      (!needle || [row.code, row.name].some(value => normalizeDefectsSearch(value).includes(needle))),
    compare: key ? (a, b) => compareText(key === 'status' ? a.statusLabel : a[key], key === 'status' ? b.statusLabel : b[key]) : undefined,
    direction: query.sort ?? 'asc',
  });
  if (result.kind === 'blocked') return result;
  return {
    ...result,
    pagination: { ...result.pagination, pageSizeOptions },
  };
}
