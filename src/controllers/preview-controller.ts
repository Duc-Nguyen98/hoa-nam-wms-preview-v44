import type { PreviewDataAdapter, QueryIntent, ScreenId, SnapshotResult } from '../contracts/preview';
import { createFixtureAdapter } from '../data/adapters/fixture-adapter';

/** Components depend on this boundary, never on a fixture file or an API URL. */
export function createPreviewController(adapter: PreviewDataAdapter = createFixtureAdapter()) {
  let requestSequence = 0;
  let snapshot: SnapshotResult | null = null;
  const listeners = new Set<() => void>();

  async function commitLatest(read: () => Promise<SnapshotResult>): Promise<SnapshotResult> {
    const sequence = ++requestSequence;
    const result = await read();
    if (sequence === requestSequence) {
      snapshot = result;
      listeners.forEach((listener) => listener());
    }
    // Return is for diagnostics. A future screen subscribes/getSnapshot for committed state.
    return result;
  }

  return {
    loadSetup: () => adapter.setupHealth(),
    readSnapshot: (screenId: ScreenId, scenario?: string) => commitLatest(() => adapter.readSnapshot(screenId, scenario)),
    readQuery: (screenId: ScreenId, query: QueryIntent, scenario?: string) => commitLatest(() => adapter.readQuery(screenId, query, scenario)),
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    clear() {
      ++requestSequence;
      snapshot = null;
      listeners.forEach((listener) => listener());
    },
  };
}
