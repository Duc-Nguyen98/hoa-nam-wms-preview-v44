import { validateBusinessDate, validateBusinessDateRange } from '../../../shared/date-policy';
import type { Box } from './adapter';

export type View = 'stock'|'sku'|'allocation'|'box'|'tray'|'movement'|'reconcile'|'difference'|'history'|'snapshot';
export const views: View[] = ['stock','sku','allocation','box','tray','movement','reconcile','difference','history','snapshot'];
export interface InventoryRoute {
  view: View; sku: string; box: string; tray: string; snapshot: string; source: string;
  warehouse: string; location: string; query: string; result: string; from: string; to: string;
  movementDate: string; movementType: string; movementBox: string; movementQuery: string;
  savedResult: string; page: number; sort: boolean;
}
export const hashParams = () => new URLSearchParams(window.location.hash.split('?')[1] || '');
export function readRoute(boxes: readonly Box[] = []): InventoryRoute {
  const p = hashParams();
  const view = p.get('view') as View;
  const boxId = p.get('box') ?? p.get('movementBox');
  const linkedBox = boxId ? boxes.find(box => box.id === boxId) : p.has('tray') ? boxes.find(box => box.tray === p.get('tray')) : undefined;
  const page = Number(p.get('page'));
  return {
    view: views.includes(view) ? view : 'stock',
    sku: p.get('sku') ?? linkedBox?.sku ?? 'HN-DRV-001',
    box: p.get('box') ?? linkedBox?.id ?? 'BOX-001',
    tray: p.get('tray') ?? '',
    snapshot: p.get('snapshot') ?? 'DS-20261028-01',
    source: p.get('source') ?? '',
    warehouse: p.get('warehouse') ?? (p.get('scenario') === 'empty' ? 'HN04' : ''),
    location: p.get('location') ?? '',
    query: p.get('q') ?? (p.get('scenario') === 'no-results' ? 'ZX-999' : ''),
    result: p.get('result') ?? '',
    from: p.get('from') ?? '', to: p.get('to') ?? '',
    movementDate: p.get('date') ?? '', movementType: p.get('movementType') ?? '',
    movementBox: p.get('movementBox') ?? '', movementQuery: p.get('movementQuery') ?? '',
    savedResult: p.get('savedResult') ?? (view === 'snapshot' ? p.get('result') ?? '' : ''),
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    sort: p.get('sort') === 'desc',
  };
}
export function writeRoute(route: InventoryRoute, push = false, state = window.history.state) {
  const p = new URLSearchParams({ v: '1', view: route.view, sku: route.sku, box: route.box, snapshot: route.snapshot });
  for (const [key, value] of Object.entries({ warehouse: route.warehouse, location: route.location, q: route.query, result: route.result, from: route.from, to: route.to, date: route.movementDate, movementType: route.movementType, movementBox: route.movementBox, movementQuery: route.movementQuery, savedResult: route.savedResult, source: route.source, tray: route.tray })) if (value) p.set(key, value);
  if (route.page > 1) p.set('page', String(route.page));
  if (route.sort) p.set('sort', 'desc');
  window.history[push ? 'pushState' : 'replaceState'](state, '', `${window.location.pathname}${window.location.search}#/preview/S16?${p}`);
}
export const validHistoryDates = (from: string, to: string) => !(from || to) || validateBusinessDateRange({ from, to }, { policy: 'rolling-90' }).valid;
export const validMovementDate = (date: string) => !date || validateBusinessDate(date, { policy: 'rolling-90' }).valid;
export interface ReturnContext { route: InventoryRoute; scroll: number }
export function returnContexts(): Partial<Record<View, ReturnContext>> {
  const saved = window.history.state?.inventoryDesign;
  return saved?.version === 1 ? saved.contexts ?? {} : {};
}
