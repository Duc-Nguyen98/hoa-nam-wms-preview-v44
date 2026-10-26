import { SEARCH_DEBOUNCE_MS } from './foundation';
import {
  equalQueryValue, queryTable, updateTableQuery,
  type RowPredicate, type TablePageQuery, type TableQueryPagination, type TableQuerySource,
  type TableQueryUpdateOptions, type TableSearch, type TableSortDefinition, type TableStableId,
} from './table-query';

export type ListOptionValue = string | number;
export type ListFilterOptions = Record<string, readonly ListOptionValue[]>;
export interface ListBlocker { reason: string; detail: string }
export interface ListSourceInfo {
  id: string;
  scope: 'catalogue' | 'detail';
  completeness: 'complete' | 'partial';
  detailTotal: number;
  aggregateTotal?: number;
}
export interface ListModel<Row, Query extends TablePageQuery, Summary> {
  query: Query;
  rows: Row[];
  pagination: TableQueryPagination;
  summary: Summary;
  filterOptions: ListFilterOptions;
  source: ListSourceInfo;
}
export type ListReadResult<Row, Query extends TablePageQuery, Summary> =
  | { kind: 'ready'; model: ListModel<Row, Query, Summary> }
  | ({ kind: 'blocked'; query: Query } & ListBlocker);
export interface ListReadContext { signal?: AbortSignal }
export interface ListDataAdapter<Row, Query extends TablePageQuery, Summary> {
  read(query: Query, context?: ListReadContext): Promise<ListReadResult<Row, Query, Summary>>;
}
export interface ListFixtureAdapterOptions<Row, Query extends TablePageQuery, Summary> {
  sourceId: string;
  source: TableQuerySource<Row>;
  summary: Summary;
  search?: (query: Query) => TableSearch<Row> | undefined;
  filters?: (query: Query) => readonly RowPredicate<Row>[];
  sort?: (query: Query) => TableSortDefinition<Row> | undefined;
  stableId?: TableStableId<Row>;
  filterOptions?: Record<string, (row: Row) => ListOptionValue | null | undefined>;
  /** Source-supplied catalogue wins per key; only absent keys derive from all scenario rows. */
  optionCatalogue?: ListFilterOptions;
  validate?: (query: Query) => ListBlocker | null;
}

/** Values remain source identities; uniqueness is exact and order is first appearance. */
export function collectFilterOptions<Row>(rows: readonly Row[], fields: Record<string, (row: Row) => ListOptionValue | null | undefined>): ListFilterOptions {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, [...new Set(rows.map(value).filter((item): item is ListOptionValue =>
    typeof item === 'string' ? Boolean(item.trim()) : typeof item === 'number' && Number.isFinite(item)))]]));
}

/** Same adapter contract for approved detail sets and explicitly separate QA scenarios. */
export function createListFixtureAdapter<Row, Query extends TablePageQuery, Summary>(options: ListFixtureAdapterOptions<Row, Query, Summary>): ListDataAdapter<Row, Query, Summary> {
  const source = structuredClone(options.source);
  const summary = structuredClone(options.summary);
  // Derive once from the entire scenario, never from a page or a filtered result.
  const filterOptions = {
    ...collectFilterOptions(source.rows, options.filterOptions ?? {}),
    ...Object.fromEntries(Object.entries(options.optionCatalogue ?? {}).map(([key, values]) => [key, [...new Set(values)]])),
  };
  return {
    async read(input, context) {
      if (context?.signal?.aborted) throw new DOMException('The list request was cancelled.', 'AbortError');
      const query = structuredClone(input);
      const blocker = options.validate?.(query);
      if (blocker) return { kind: 'blocked', query, ...blocker };
      const result = queryTable({
        source, query, search: options.search?.(query), filters: options.filters?.(query),
        sort: options.sort?.(query), stableId: options.stableId,
      });
      if (result.kind === 'blocked') return { ...result, query };
      return { kind: 'ready', model: {
        query: { ...query, page: result.pagination.page, pageSize: result.pagination.pageSize }, rows: structuredClone(result.rows), pagination: result.pagination,
        summary: structuredClone(summary), filterOptions: structuredClone(filterOptions),
        source: {
          id: options.sourceId, scope: source.scope ?? 'catalogue', completeness: source.completeness,
          detailTotal: source.rows.length,
          ...(source.aggregateTotal === undefined ? {} : { aggregateTotal: source.aggregateTotal }),
        },
      } };
    },
  };
}

export interface ListRuntimeSnapshot<Row, Query extends TablePageQuery, Summary> {
  model: ListModel<Row, Query, Summary> | null;
  acceptedQuery: Query | null;
  /** Latest input intent, including a search whose debounce timer has not fired. */
  intendedQuery: Query | null;
  pendingQuery: Query | null;
  loading: boolean;
  debouncing: boolean;
  blocker: (ListBlocker & { query: Query }) | null;
  error: Error | null;
  requestId: number;
}
export type ListLoadOutcome<Row, Query extends TablePageQuery, Summary> =
  | { kind: 'applied'; result: ListReadResult<Row, Query, Summary> }
  | { kind: 'superseded' }
  | { kind: 'error'; error: Error };
export interface ListScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}
export interface ListControllerOptions<Query extends TablePageQuery> {
  /** Pre-request validation. Rejected intent remains visible; no adapter I/O. */
  validate?: (query: Query) => ListBlocker | null;
  initialQuery?: Query;
  queryOptions?: TableQueryUpdateOptions<Query>;
  debounceMs?: number;
  scheduler?: ListScheduler;
}
export interface ListUpdateOptions<Query extends TablePageQuery> extends TableQueryUpdateOptions<Query> {
  debounceMs?: number;
}
export interface ListController<Row, Query extends TablePageQuery, Summary> {
  getSnapshot(): ListRuntimeSnapshot<Row, Query, Summary>;
  subscribe(listener: () => void): () => void;
  /** Immediate explicit read/reload. Also cancels any pending search timer. */
  load(query: Query): Promise<ListLoadOutcome<Row, Query, Summary>>;
  /** Debounced intent by default; pass zero for an immediate request. */
  request(query: Query, options?: { debounceMs?: number }): Promise<ListLoadOutcome<Row, Query, Summary>>;
  /** Merge against the latest intent. Search-only changes debounce; other changes read now. */
  update(patch: Partial<Query>, options?: ListUpdateOptions<Query>): Promise<ListLoadOutcome<Row, Query, Summary>>;
  reset(query: Query): Promise<ListLoadOutcome<Row, Query, Summary>>;
  /** Invalidate timer/read and restore intended controls to the accepted query. */
  cancel(): void;
  /** Invalidate work and clear accepted state; suitable for unmount cleanup. */
  clear(): void;
}

const browserScheduler: ListScheduler = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Intent-time request fencing is independent of AbortSignal support. A pending
 * new search already makes the older in-flight result obsolete before debounce.
 */
export function createListController<Row, Query extends TablePageQuery, Summary>(adapter: ListDataAdapter<Row, Query, Summary>, options: ListControllerOptions<Query> = {}): ListController<Row, Query, Summary> {
  type Snapshot = ListRuntimeSnapshot<Row, Query, Summary>;
  type Outcome = ListLoadOutcome<Row, Query, Summary>;
  type Task = { id: number; query: Query; timer: unknown | null; abort: AbortController; resolve: (outcome: Outcome) => void };
  const scheduler = options.scheduler ?? browserScheduler;
  const defaultDelay = options.debounceMs ?? SEARCH_DEBOUNCE_MS;
  const initialQuery = options.initialQuery ? structuredClone(options.initialQuery) : null;
  const listeners = new Set<() => void>();
  let sequence = 0;
  let task: Task | null = null;
  let snapshot: Snapshot = {
    model: null, acceptedQuery: null, intendedQuery: initialQuery, pendingQuery: null,
    loading: false, debouncing: false, blocker: null, error: null, requestId: 0,
  };
  const publish = (next: Snapshot) => { snapshot = next; for (const listener of listeners) listener(); };
  const restoredQuery = () => snapshot.acceptedQuery ? structuredClone(snapshot.acceptedQuery) : initialQuery ? structuredClone(initialQuery) : null;
  const reserveGeneration = () => {
    const id = ++sequence;
    const previous = task;
    task = null;
    if (previous) {
      if (previous.timer !== null) scheduler.clearTimeout(previous.timer);
      previous.resolve({ kind: 'superseded' });
    }
    // Abort dispatches synchronous callbacks. The caller must install/publish
    // its new intent first, so a callback's newer request can supersede it.
    return { id, previous };
  };
  const read = async (current: Task) => {
    if (task !== current) return;
    current.timer = null;
    publish({ ...snapshot, loading: true, debouncing: false });
    // A subscriber may submit newer intent while reacting to the loading state.
    if (task !== current) return;
    try {
      const blocker = options.validate?.(structuredClone(current.query));
      const result = blocker ? { kind: 'blocked' as const, query: structuredClone(current.query), ...blocker } : await adapter.read(structuredClone(current.query), { signal: current.abort.signal });
      if (task !== current || current.id !== sequence) return;
      task = null;
      if (result.kind === 'ready') {
        const model = result.model;
        publish({
          ...snapshot, model, acceptedQuery: structuredClone(model.query), intendedQuery: structuredClone(model.query),
          pendingQuery: null, loading: false, debouncing: false, blocker: null, error: null,
        });
      } else {
        publish({
          ...snapshot, intendedQuery: blocker ? structuredClone(current.query) : restoredQuery(), pendingQuery: null, loading: false, debouncing: false,
          blocker: { reason: result.reason, detail: result.detail, query: structuredClone(result.query) }, error: null,
        });
      }
      current.resolve({ kind: 'applied', result });
    } catch (failure) {
      if (task !== current || current.id !== sequence) return;
      task = null;
      const error = failure instanceof Error ? failure : new Error(String(failure));
      publish({ ...snapshot, intendedQuery: restoredQuery(), pendingQuery: null, loading: false, debouncing: false, blocker: null, error });
      current.resolve({ kind: 'error', error });
    }
  };
  const request = (input: Query, requestOptions: { debounceMs?: number } = {}): Promise<Outcome> => {
    const delay = requestOptions.debounceMs ?? defaultDelay;
    if (!Number.isFinite(delay) || delay < 0) throw new RangeError('List debounce must be a non-negative finite number.');
    const query = structuredClone(input);
    const { id, previous } = reserveGeneration();
    let resolve!: (outcome: Outcome) => void;
    const result = new Promise<Outcome>(done => { resolve = done; });
    const current: Task = { id, query, timer: null, abort: new AbortController(), resolve };
    task = current;
    publish({
      ...snapshot, intendedQuery: structuredClone(query), pendingQuery: structuredClone(query),
      loading: false, debouncing: delay > 0, blocker: null, error: null, requestId: id,
    });
    previous?.abort.abort();
    if (task !== current || id !== sequence) return result;
    if (delay > 0) current.timer = scheduler.setTimeout(() => { void read(current); }, delay);
    else void read(current);
    return result;
  };
  const load = (query: Query) => request(query, { debounceMs: 0 });
  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    load, request, reset: load,
    update(patch, updateOptions = {}) {
      const current = snapshot.intendedQuery ?? snapshot.acceptedQuery ?? initialQuery;
      if (!current) throw new Error('Load a query or supply initialQuery before applying a partial update.');
      const queryOptions = { ...options.queryOptions, ...updateOptions };
      const next = updateTableQuery(current, patch, queryOptions);
      const searchKey = queryOptions.searchKey ?? ('search' in current ? 'search' as keyof Query : undefined);
      const equal = queryOptions.equal ?? equalQueryValue;
      const changed = (Object.keys(patch) as (keyof Query)[]).filter(key => !equal(current[key], patch[key], key));
      const searchOnly = searchKey !== undefined && changed.length > 0 && changed.every(key => key === searchKey);
      return request(next, { debounceMs: updateOptions.debounceMs ?? (searchOnly ? defaultDelay : 0) });
    },
    cancel() {
      const { id, previous } = reserveGeneration();
      publish({ ...snapshot, intendedQuery: restoredQuery(), pendingQuery: null, loading: false, debouncing: false, blocker: null, error: null, requestId: id });
      // Nothing may overwrite state after a reentrant abort callback submits newer intent.
      previous?.abort.abort();
    },
    clear() {
      const { id, previous } = reserveGeneration();
      publish({ model: null, acceptedQuery: null, intendedQuery: initialQuery ? structuredClone(initialQuery) : null, pendingQuery: null, loading: false, debouncing: false, blocker: null, error: null, requestId: id });
      previous?.abort.abort();
    },
  };
}
