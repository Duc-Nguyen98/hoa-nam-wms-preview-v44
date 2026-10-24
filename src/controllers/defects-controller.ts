import { DEFAULT_DEFECTS_QUERY, type DefectsDataAdapter, type DefectsQuery, type DefectsResult } from '../contracts/defects';
import { createDefectsFixtureAdapter } from '../data/adapters/defects-fixture-adapter';
import { trackListRead } from '../data/read-diagnostics';

/** Atomically commits source-backed summary/table results and ignores late older responses. */
export function createDefectsController(adapter: DefectsDataAdapter = createDefectsFixtureAdapter()) {
  let sequence = 0;
  let snapshot: DefectsResult | null = null;
  const listeners = new Set<() => void>();
  return {
    async load(query: DefectsQuery = DEFAULT_DEFECTS_QUERY, scenario?: string) {
      const request = ++sequence;
      const result = await trackListRead('S02', () => adapter.read(structuredClone(query), scenario));
      if (request === sequence) {
        snapshot = result;
        listeners.forEach((listener) => listener());
      }
      return result;
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    clear() {
      ++sequence;
      snapshot = null;
      listeners.forEach((listener) => listener());
    },
  };
}
