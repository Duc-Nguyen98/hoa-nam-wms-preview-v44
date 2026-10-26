import { DEFAULT_OVERVIEW_QUERY, type OverviewBlocker, type OverviewDataAdapter, type OverviewQuery, type OverviewResult, type OverviewRow } from '../contracts/overview';
import { createOverviewFixtureAdapter } from '../data/adapters/overview-fixture-adapter';
import { trackListRead } from '../data/read-diagnostics';
import { createListController, type ListControllerOptions, type ListDataAdapter, type ListLoadOutcome } from '../shared/list-runtime';
import { dateRangeBlocker } from '../shared/date-policy';

type ReadyOverview = Extract<OverviewResult, { kind: 'ready' }>;
type Outcome = ListLoadOutcome<OverviewRow, OverviewQuery, ReadyOverview>;

/** S01 keeps its atomic widget model while shared owns intent fencing and debounce. */
export function createOverviewController(
  adapter: OverviewDataAdapter = createOverviewFixtureAdapter(),
  options: Pick<ListControllerOptions<OverviewQuery>, 'scheduler'> = {},
) {
  const bridge: ListDataAdapter<OverviewRow, OverviewQuery, ReadyOverview> = {
    async read(query) {
      const result = await trackListRead('S01', () => adapter.read(query));
      if (result.kind === 'blocked') return result;
      const { model } = result;
      return { kind: 'ready', model: {
        query: model.query, rows: model.rows,
        pagination: { ...model.pagination, pageSizeOptions: model.pagination.pageSizeOptions },
        // Retain the original ready result; summary/chart/table commit together.
        summary: result, filterOptions: {},
        source: { id: model.source.snapshotId, scope: 'detail', completeness: 'complete', detailTotal: model.source.fixtureRecordCount },
      } };
    },
  };
  const runtime = createListController(bridge, {
    ...options, initialQuery: structuredClone(DEFAULT_OVERVIEW_QUERY),
    validate: query => dateRangeBlocker(query.period),
    queryOptions: { filterKeys: ['type', 'status', 'period'], sortKeys: ['sortKey', 'sort'], resetPageOnSort: true },
  });
  function unwrap(outcome: Outcome): OverviewResult | null {
    if (outcome.kind === 'superseded') return null;
    if (outcome.kind === 'error') throw outcome.error;
    return outcome.result.kind === 'ready' ? outcome.result.model.summary
      : { ...outcome.result, reason: outcome.result.reason as OverviewBlocker };
  }
  return {
    async load(query: OverviewQuery = DEFAULT_OVERVIEW_QUERY) { return unwrap(await runtime.load(query)); },
    async update(patch: Partial<OverviewQuery>) { return unwrap(await runtime.update(patch)); },
    async reset(query: OverviewQuery = DEFAULT_OVERVIEW_QUERY) { return unwrap(await runtime.reset(query)); },
    /** Compatibility for existing read-only harness consumers. */
    getSnapshot(): OverviewResult | null {
      const state = runtime.getSnapshot();
      return state.blocker ? { kind: 'blocked', ...state.blocker, reason: state.blocker.reason as OverviewBlocker }
        : state.model?.summary ?? null;
    },
    getState() {
      const state = runtime.getSnapshot();
      return { ...state, model: state.model?.summary.model ?? null };
    },
    subscribe: runtime.subscribe,
    cancel: runtime.cancel,
    clear: runtime.clear,
  };
}
