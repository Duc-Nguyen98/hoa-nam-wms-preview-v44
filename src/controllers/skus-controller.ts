import { DEFAULT_SKUS_QUERY, type SkuRow, type SkusDataAdapter, type SkusModel, type SkusQuery } from '../contracts/skus';
import { createSkusFixtureAdapter } from '../data/adapters/skus-fixture-adapter';
import { createListController, type ListControllerOptions, type ListRuntimeSnapshot } from '../shared/list-runtime';

type SkusSnapshot = Omit<ListRuntimeSnapshot<SkuRow, SkusQuery, SkusModel['summary']>, 'model'> & { model: SkusModel | null };

/** S04 delegates debounce, intent fencing and accepted-state recovery to the released S00 controller. */
export function createSkusController(adapter: SkusDataAdapter = createSkusFixtureAdapter(), options: Pick<ListControllerOptions<SkusQuery>, 'scheduler'> = {}) {
  const runtime = createListController<SkuRow, SkusQuery, SkusModel['summary']>({
    async read(query) {
      const result = await adapter.read(query);
      return result.kind === 'missing-fixture' ? { kind: 'blocked', query: result.query, reason: result.reason, detail: result.detail } : result;
    },
  }, { initialQuery: DEFAULT_SKUS_QUERY, queryOptions: { filterKeys: ['group', 'status', 'unit'], sortKeys: ['sortKey', 'sort'], resetPageOnSort: true }, ...options });
  return { ...runtime,
    load: (query: SkusQuery = DEFAULT_SKUS_QUERY) => runtime.load(query),
    // The adapter always supplies a full SkusModel; shared stores that same model without stripping screen metadata.
    getSnapshot: () => runtime.getSnapshot() as SkusSnapshot,
  };
}
