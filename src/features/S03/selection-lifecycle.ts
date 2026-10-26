import type { CatalogCreateAdapter, CatalogSnapshot } from '../../contracts/catalog-create';

export type RouteSelection = string | null;
type State = { snapshot: CatalogSnapshot | null; busy: boolean; error: boolean; unavailable: boolean; detailId: string | null; route: RouteSelection };
/** One screen-local reader for list, route and visibility. No commands or recovery writes. */
export function createProductSelectionReader(adapter: Pick<CatalogCreateAdapter<'product'>, 'readSnapshot'>) {
  let state: State = { snapshot: null, busy: false, error: false, unavailable: false, detailId: null, route: null };
  let generation = 0, visible = false, creating = false, pendingRoute = false, savedHold = false, initialized = false;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  async function read() {
    if (!visible || creating) return false;
    const token = ++generation;
    const applyingRoute = pendingRoute && !savedHold;
    const target = applyingRoute ? state.route : state.detailId;
    publish({ snapshot: null, busy: true, error: false, unavailable: false });
    try {
      const next = await adapter.readSnapshot();
      if (token !== generation || creating) return false;
      const exact = target !== null && next.products.some(row => row.id === target);
      const missing = (applyingRoute || target !== null) && !exact;
      if (applyingRoute && exact) pendingRoute = false;
      publish({ snapshot: next, busy: false, error: false, unavailable: missing, detailId: exact ? target : null });
      return true;
    } catch {
      if (token === generation) publish({ snapshot: null, busy: false, error: true });
      return false;
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    configure(route: RouteSelection, nextVisible: boolean, nextCreating: boolean) {
      const routeChanged = !initialized || route !== state.route;
      const shouldRead = routeChanged || visible !== nextVisible || creating !== nextCreating;
      initialized = true; visible = nextVisible; creating = nextCreating;
      if (routeChanged) {
        ++generation; pendingRoute = route !== null; savedHold = false;
        publish({ route, snapshot: null, busy: false, detailId: null, unavailable: false, error: false });
      }
      if (creating || !visible) {
        ++generation;
        publish({ snapshot: null, busy: false, detailId: null });
        return;
      }
      if (savedHold) return;
      if (shouldRead) void read();
    },
    refresh: read,
    resume() { if (!state.snapshot && !state.busy) void read(); },
    open(id: string) {
      if (creating || state.busy || !state.snapshot?.products.some(row => row.id === id)) return;
      pendingRoute = false; savedHold = false;
      publish({ detailId: id, unavailable: false });
    },
    dismiss() {
      const applyDeferred = savedHold && pendingRoute;
      const reading = state.busy;
      ++generation; savedHold = false;
      if (!applyDeferred) pendingRoute = false;
      publish({ detailId: null, busy: false });
      if (applyDeferred || reading) void read();
    },
    acceptCreated(snapshot: CatalogSnapshot, id: string) {
      ++generation; creating = false; visible = true; savedHold = true;
      publish({ snapshot, busy: false, error: false, unavailable: false, detailId: snapshot.products.some(row => row.id === id) ? id : null });
    },
    invalidate() { ++generation; publish({ snapshot: null, busy: false }); },
  };
}
