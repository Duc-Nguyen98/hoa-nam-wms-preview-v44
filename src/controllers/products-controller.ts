import { DEFAULT_PRODUCTS_QUERY, type ProductRow, type ProductsDataAdapter, type ProductsModel, type ProductsQuery } from '../contracts/products';
import { createProductsFixtureAdapter } from '../data/adapters/products-fixture-adapter';
import { createListController, type ListControllerOptions, type ListRuntimeSnapshot } from '../shared/list-runtime';

type ProductsSnapshot = Omit<ListRuntimeSnapshot<ProductRow, ProductsQuery, ProductsModel['summary']>, 'model'> & { model: ProductsModel | null };

/** S03 keeps its adapter/model boundary while reusing shared intent fencing and debounce250ms. */
export function createProductsController(
  adapter: ProductsDataAdapter = createProductsFixtureAdapter(),
  options: Pick<ListControllerOptions<ProductsQuery>, 'scheduler'> = {},
) {
  const controller = createListController<ProductRow, ProductsQuery, ProductsModel['summary']>({
    async read(query) {
      const result = await adapter.read(query);
      return result.kind === 'missing-fixture'
        ? { kind: 'blocked' as const, reason: result.reason, detail: result.detail, query: result.query }
        : result;
    },
  }, {
    initialQuery: { ...DEFAULT_PRODUCTS_QUERY },
    queryOptions: { filterKeys: ['group', 'status', 'unit'], sortKeys: ['sortKey', 'sort'] },
    ...options,
  });
  return {
    ...controller,
    load: (query: ProductsQuery = DEFAULT_PRODUCTS_QUERY) => controller.load(query),
    // Shared preserves the exact model object returned by the S03 adapter, including provenance.
    getSnapshot: () => controller.getSnapshot() as ProductsSnapshot,
  };
}
