import type { CatalogCreateAdapter, CatalogSnapshot } from '../../contracts/catalog-create';

/** Read-only screen state. Each route/adapter lifecycle owns a separate reader. */
export function createSkuCatalogReader(adapter: Pick<CatalogCreateAdapter<'sku'>, 'readSnapshot'>) {
  let state: { snapshot: CatalogSnapshot | null; busy: boolean; error: boolean } = {
    snapshot: null, busy: true, error: false,
  };
  let generation = 0;
  const listeners = new Set<() => void>();
  function publish(next: typeof state) { state = next; listeners.forEach(listener => listener()); }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    invalidate() { ++generation; publish({ snapshot: null, busy: false, error: false }); },
    unavailable() { ++generation; publish({ snapshot: null, busy: false, error: true }); },
    accept(snapshot: CatalogSnapshot) { ++generation; publish({ snapshot, busy: false, error: false }); },
    async read() {
      const token = ++generation;
      // Never keep an old authorized Detail visible during revalidation.
      publish({ snapshot: null, busy: true, error: false });
      try {
        const snapshot = await adapter.readSnapshot();
        if (token !== generation) return false;
        publish({ snapshot, busy: false, error: false });
        return true;
      } catch {
        if (token === generation) publish({ snapshot: null, busy: false, error: true });
        return false;
      }
    },
  };
}
