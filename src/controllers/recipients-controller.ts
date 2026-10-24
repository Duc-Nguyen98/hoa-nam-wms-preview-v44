import { DEFAULT_RECIPIENTS_QUERY } from '../contracts/recipients';
import type { RecipientRow, RecipientsDataAdapter, RecipientsModel, RecipientsQuery } from '../contracts/recipients';
import { createListController } from '../shared/list-runtime';
import type { ListControllerOptions, ListRuntimeSnapshot } from '../shared/list-runtime';

type RecipientsSnapshot = Omit<ListRuntimeSnapshot<RecipientRow, RecipientsQuery, RecipientsModel['summary']>, 'model'> & { model: RecipientsModel | null };

/** Shared intent fencing/debounce; the S05 adapter retains its sourced model and metadata. */
export function createRecipientsController(
  adapter: RecipientsDataAdapter,
  options: Pick<ListControllerOptions<RecipientsQuery>, 'scheduler' | 'debounceMs'> = {},
) {
  const controller = createListController<RecipientRow, RecipientsQuery, RecipientsModel['summary']>({
    async read(query) {
      const result = await adapter.read(query);
      return result.kind === 'missing-fixture'
        ? { kind: 'blocked', query: result.query, reason: result.reason, detail: result.detail }
        : result;
    },
  }, {
    ...options,
    initialQuery: { ...DEFAULT_RECIPIENTS_QUERY },
    queryOptions: { filterKeys: ['type', 'status'], sortKeys: ['sort'], resetPageOnSort: true },
  });
  return {
    ...controller,
    // The shared controller preserves ready models verbatim; every ready model comes from this S05 adapter.
    getSnapshot: () => controller.getSnapshot() as RecipientsSnapshot,
    getAcceptedModel: () => controller.getSnapshot().model as RecipientsModel | null,
    load: (query: RecipientsQuery = DEFAULT_RECIPIENTS_QUERY) => controller.load(query),
  };
}
