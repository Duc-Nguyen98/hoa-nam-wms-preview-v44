import { UI_FOUNDATION, UI_FOUNDATION_VERSION } from './foundation';
import { matchesSearchFields } from './search';

/** Shared frontend release, not an API/DTO version. */
export const SHARED_UI_VERSION = UI_FOUNDATION_VERSION;
export const DEFAULT_PAGE_SIZE = UI_FOUNDATION.defaultPageSize;
export const PAGE_SIZE_OPTIONS = UI_FOUNDATION.pageSizeOptions;

export interface TablePageQuery {
  page: number;
  pageSize: number;
}

/**
 * Completeness and total apply to the declared scope. An approved detail set may
 * be complete within scope='detail' while the catalogue remains incomplete.
 * A catalogue aggregate belongs in aggregateTotal, never in the detail count.
 */
export interface TableQuerySource<Row> {
  rows: readonly Row[];
  completeness: 'complete' | 'partial';
  total: number;
  scope?: 'catalogue' | 'detail';
  aggregateTotal?: number;
}

export type RowPredicate<Row> = (row: Row) => boolean;
export interface TableSearch<Row> {
  value: string;
  fields: readonly ((row: Row) => unknown)[];
}
export interface TableSortDefinition<Row> {
  type: 'text' | 'code' | 'number' | 'date';
  value: (row: Row) => unknown;
  direction?: 'asc' | 'desc';
}
export type TableStableId<Row> = (row: Row) => string | number | null | undefined;

export interface TableQueryOptions<Row> {
  pageSizeOptions?: readonly number[];
  source: TableQuerySource<Row>;
  query?: Partial<TablePageQuery>;
  /** Domain field scope and search matching remain the adapter's responsibility. */
  filter?: (row: Row) => boolean;
  /** Every supplied predicate and the optional search must match. */
  filters?: readonly RowPredicate<Row>[];
  search?: TableSearch<Row>;
  /** Compare typed values; do not compare localized number/date display labels. */
  compare?: (left: Row, right: Row) => number;
  direction?: 'asc' | 'desc';
  /** Preferred typed comparison. Takes precedence over the legacy compare callback. */
  sort?: TableSortDefinition<Row>;
  /** Ties use ascending stable IDs in either direction, then source order. */
  stableId?: TableStableId<Row>;
}

const textCollator = new Intl.Collator('vi', { usage: 'sort', sensitivity: 'accent', numeric: false });
const codeCollator = new Intl.Collator('vi', { usage: 'sort', sensitivity: 'accent', numeric: true });
export function compareText(left: string, right: string): number { return textCollator.compare(left.normalize('NFC'), right.normalize('NFC')); }
export function compareCode(left: string, right: string): number { return codeCollator.compare(left.normalize('NFC'), right.normalize('NFC')); }

/** Only typed numbers/Date objects or ISO dates are sortable; display labels are not parsed. */
function dateNumber(value: unknown): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/u.exec(value.trim());
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction, zone] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText ?? 0), minute = Number(minuteText ?? 0), second = Number(secondText ?? 0);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, Number((fraction ?? '').padEnd(3, '0')));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null;
  let offset = 0;
  if (zone && zone !== 'Z') {
    const hours = Number(zone.slice(1, 3)), minutes = Number(zone.slice(4, 6));
    if (hours > 23 || minutes > 59) return null;
    offset = (hours * 60 + minutes) * 60_000 * (zone[0] === '+' ? 1 : -1);
  }
  // Zone-less ISO source values retain their wall-clock order, without a browser timezone guess.
  return date.getTime() - offset;
}

type SortValue = string | number | null;
function sortValue(value: unknown, type: TableSortDefinition<unknown>['type']): SortValue {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value) ? value : null;
  if (type === 'date') return dateNumber(value);
  return typeof value === 'string' ? value.normalize('NFC').trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
}

function compareIdentity(left: string | number | null | undefined, right: string | number | null | undefined): number {
  const a = left === null || left === undefined || String(left).trim() === '' || (typeof left === 'number' && !Number.isFinite(left)) ? null : String(left);
  const b = right === null || right === undefined || String(right).trim() === '' || (typeof right === 'number' && !Number.isFinite(right)) ? null : String(right);
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return compareCode(a, b) || (a < b ? -1 : a > b ? 1 : typeof left < typeof right ? -1 : typeof left > typeof right ? 1 : 0);
}

/** Typed stable ordering, including missing-last and direction-independent tie breaking. */
export function sortTableRows<Row>(rows: readonly Row[], sort: TableSortDefinition<Row>, stableId?: TableStableId<Row>): Row[] {
  const sign = sort.direction === 'desc' ? -1 : 1;
  return rows.map((row, index) => ({ row, index, value: sortValue(sort.value(row), sort.type), id: stableId?.(row) }))
    .sort((a, b) => {
      let primary = 0;
      if (a.value === null || b.value === null) primary = a.value === b.value ? 0 : a.value === null ? 1 : -1;
      else {
        const comparison = typeof a.value === 'number' && typeof b.value === 'number' ? a.value - b.value
          : sort.type === 'code' ? compareCode(String(a.value), String(b.value)) : compareText(String(a.value), String(b.value));
        primary = sign * comparison;
      }
      return primary || (stableId ? compareIdentity(a.id, b.id) : 0) || a.index - b.index;
    }).map(item => item.row);
}

export interface TableQueryPagination extends TablePageQuery {
  pageCount: number;
  total: number;
  unfilteredTotal: number;
  start: number;
  end: number;
  pageSizeOptions: readonly number[];
}

export type TableQueryResult<Row> =
  | { kind: 'ready'; rows: Row[]; pagination: TableQueryPagination }
  | { kind: 'blocked'; reason: 'INCOMPLETE_SOURCE' | 'INVALID_QUERY' | 'PAGE_OUT_OF_RANGE'; detail: string };

/**
 * Pure adapter helper: verify declared source scope -> filter/search -> stable sort -> page.
 * It never imports fixtures, changes records, invents totals, or picks search rules.
 */
export function queryTable<Row>({ source, query = {}, filter, filters = [], search, compare, sort, stableId, direction = 'asc', pageSizeOptions = PAGE_SIZE_OPTIONS }: TableQueryOptions<Row>): TableQueryResult<Row> {
  if (source.completeness !== 'complete' || !Number.isSafeInteger(source.total) || source.total < 0 || source.total !== source.rows.length ||
    (source.scope !== undefined && !['catalogue', 'detail'].includes(source.scope)) ||
    (source.aggregateTotal !== undefined && (!Number.isSafeInteger(source.aggregateTotal) || source.aggregateTotal < 0 || (source.scope !== 'detail' && source.aggregateTotal !== source.total)))) {
    return { kind: 'blocked', reason: 'INCOMPLETE_SOURCE', detail: 'The declared source scope must be complete and its total must match its rows; catalogue aggregates remain separate.' };
  }
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortDirection = sort?.direction ?? direction;
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || !pageSizeOptions.some(size => size === pageSize) || !['asc', 'desc'].includes(direction) || !['asc', 'desc'].includes(sortDirection) ||
    (sort && !['text', 'code', 'number', 'date'].includes(sort.type))) {
    return { kind: 'blocked', reason: 'INVALID_QUERY', detail: 'Page size must be permitted by this table and sort direction must be asc or desc.' };
  }
  if (!Number.isSafeInteger(page) || page < 1) {
    return { kind: 'blocked', reason: 'PAGE_OUT_OF_RANGE', detail: 'Page must be a positive integer in the filtered result.' };
  }
  const filtered = source.rows.filter(row => (!filter || filter(row)) && filters.every(predicate => predicate(row)) && (!search || matchesSearchFields(row, search.value, search.fields)));
  const sign = direction === 'desc' ? -1 : 1;
  const ordered = sort ? sortTableRows(filtered, { ...sort, direction: sortDirection }, stableId)
    : compare ? filtered.map((row, index) => ({ row, index, id: stableId?.(row) }))
      .sort((a, b) => sign * compare(a.row, b.row) || (stableId ? compareIdentity(a.id, b.id) : 0) || a.index - b.index).map(item => item.row)
      : filtered;
  const total = filtered.length;
  const pageCount = Math.ceil(total / pageSize);
  if (page > Math.max(1, pageCount)) {
    return { kind: 'blocked', reason: 'PAGE_OUT_OF_RANGE', detail: 'The requested page is outside the complete filtered result.' };
  }
  const offset = (page - 1) * pageSize;
  const rows = ordered.slice(offset, offset + pageSize);
  return {
    kind: 'ready', rows,
    pagination: {
      page, pageSize, pageCount, total, unfilteredTotal: source.total,
      start: rows.length ? offset + 1 : 0,
      end: rows.length ? offset + rows.length : 0,
      pageSizeOptions,
    },
  };
}

export interface TableQueryUpdateOptions<Query extends TablePageQuery> {
  /** Explicit domain filter keys, e.g. ['status', 'type', 'period']. */
  filterKeys?: readonly (keyof Query)[];
  /** Defaults to search when the query has that field. */
  searchKey?: keyof Query;
  /** Defaults to true for v1.0. Explicit false is retained for legacy consumers. */
  resetPageOnSort?: boolean;
  sortKeys?: readonly (keyof Query)[];
  /** Supply value equality when a filter is an object or array. */
  equal?: (left: unknown, right: unknown, key: keyof Query) => boolean;
}

/** Value comparison for the serializable query shapes used by static adapters. */
export function equalQueryValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return Object.is(left.getTime(), right.getTime());
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left) && Array.isArray(right) && left.length !== right.length) return false;
  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;
  if (!Array.isArray(left) && Object.getPrototypeOf(left) !== Object.prototype && Object.getPrototypeOf(left) !== null) return false;
  const leftKeys = Object.keys(left), rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every(key => Object.prototype.hasOwnProperty.call(right, key) && equalQueryValue((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]));
}

/** Changed filters/search/sort/page size reset page one; a page-only patch does not. */
export function updateTableQuery<Query extends TablePageQuery>(current: Query, patch: Partial<Query>, options: TableQueryUpdateOptions<Query> = {}): Query {
  const next = { ...current, ...patch };
  const sortKeys = options.sortKeys ?? ['sort', 'sortKey', 'sortDirection'] as (keyof Query)[];
  const searchKey = options.searchKey ?? ('search' in current ? 'search' as keyof Query : undefined);
  const inferredFilters = [...new Set([...Object.keys(current), ...Object.keys(patch)])].filter(key => key !== 'page' && key !== 'pageSize' && key !== searchKey && !sortKeys.includes(key as keyof Query)) as (keyof Query)[];
  const keys = new Set<keyof Query>(['pageSize', ...(options.filterKeys ?? inferredFilters)]);
  if (searchKey !== undefined) keys.add(searchKey);
  if (options.resetPageOnSort !== false) {
    for (const key of sortKeys) keys.add(key);
  }
  const equal = options.equal ?? equalQueryValue;
  if ([...keys].some(key => Object.prototype.hasOwnProperty.call(patch, key) && !equal(current[key], patch[key], key))) next.page = 1;
  return next;
}

export type PaginationWindowItem = number | 'ellipsis-start' | 'ellipsis-end';

/** A bounded page window that always includes the current page and both ends. */
export function paginationWindow(page: number, pageCount: number): PaginationWindowItem[] {
  if (!Number.isSafeInteger(pageCount) || pageCount < 0 || !Number.isSafeInteger(page) || page < 1 || page > Math.max(1, pageCount)) return [];
  if (pageCount === 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', pageCount];
  if (page >= pageCount - 3) return [1, 'ellipsis-start', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, 'ellipsis-start', page - 1, page, page + 1, 'ellipsis-end', pageCount];
}
