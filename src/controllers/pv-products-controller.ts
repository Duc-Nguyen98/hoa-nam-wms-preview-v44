import { DEFAULT_PV_QUERY, type PvDataAdapter, type PvQuery, type PvResult } from '../contracts/pv-products';
import { createPvFixtureAdapter } from '../data/adapters/pv-products-fixture-adapter';

/** Replace the adapter here after endpoint/DTO/query/permission contracts are confirmed. */
export function createPvProductsController(adapter: PvDataAdapter = createPvFixtureAdapter()) {
  let sequence = 0;
  let snapshot: PvResult | null = null;
  return {
    async load(query: PvQuery = { ...DEFAULT_PV_QUERY }, scenario?: string) {
      const request = ++sequence;
      const result = await adapter.read(structuredClone(query), scenario);
      if (request === sequence) snapshot = result;
      return result;
    },
    getSnapshot: () => snapshot,
    clear() { ++sequence; snapshot = null; },
  };
}
