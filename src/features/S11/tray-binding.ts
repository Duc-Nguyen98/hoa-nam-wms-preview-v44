import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { pinOperationalReports, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type TrayReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export interface TrayBoxRow { id: string; code: string; skuId: string; skuCode: string; productId: string; productName: string; receiptId: string; receiptCode: string; sourceLineId: string; quantity: number; unit: string; putawayId: string; confirmedAt: string }
export interface OperationalTrayRow { id: string; code: string; active: boolean; warehouseId: string; locationId: string; locationCode: string; locationActive: boolean; boxes: TrayBoxRow[]; boxCount: number; skuCount: number; lastConfirmedAt: string | null }
export interface TrayReadModel { report: OperationalReports; rows: OperationalTrayRow[]; hasScenario: boolean }
export interface TraySelection { id: string; epoch: string; scenarioId: string | null; generation: number }
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
export function resolveTraySelection(model: TrayReadModel | null, selection: TraySelection | null) {
  if (!model || !selection) return null;
  const token = model.report.token;
  if (token.epoch !== selection.epoch || token.scenarioId !== selection.scenarioId || token.generation !== selection.generation) return null;
  return model.rows.find(row => row.id === selection.id) ?? null;
}
/** Reads canonical setup and BOX mapping; there is no tray inventory or capacity store. */
export function createTrayBinding(adapter: TrayReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: TrayReadModel | null; busy: boolean; error: string } = { model: null, busy: false, error: '' };
  let active = true, sequence = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  async function read(): Promise<TrayReadModel> {
    if (!adapter.available) return fail('COMMAND_UNAVAILABLE');
    for (let attempt = 0; attempt < 3; attempt++) {
      const catalog = await readCatalog(), snapshot = await adapter.read();
      if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey || catalog.snapshotRevision !== snapshot.snapshotRevision) continue;
      const asOf = now(), to = vietnamDate(asOf), from = snapshot.scenario ? vietnamDate(snapshot.scenario.data.startedAt) : to;
      const report = pinOperationalReports(snapshot, { from, to, asOf });
      const rows = report.setupMasters.filter(r => r.kind === 'operational-setup-tray').map((tray): OperationalTrayRow => {
        const data = tray.data as { code?: string; active?: boolean; warehouseId?: string; locationId?: string };
        const location = report.setupMasters.find(r => r.id === data.locationId && r.kind === 'operational-setup-location')?.data as { code?: string; active?: boolean; warehouseId?: string } | undefined;
        if (!data.code || typeof data.active !== 'boolean' || !data.warehouseId || !data.locationId || !location?.code || typeof location.active !== 'boolean' || location.warehouseId !== data.warehouseId) return fail('TRAY_LINK_UNAVAILABLE');
        return { id: tray.id, code: data.code, active: data.active, warehouseId: data.warehouseId, locationId: data.locationId, locationCode: location.code, locationActive: location.active, boxes: [], boxCount: 0, skuCount: 0, lastConfirmedAt: null };
      });
      for (const trace of report.trace.filter(r => r.kind === 'box')) {
        if (!('trayId' in trace)) return fail('TRAY_LINK_UNAVAILABLE');
        if (trace.trayId === null) continue;
        const tray = rows.find(r => r.id === trace.trayId);
        if (!tray || tray.warehouseId !== trace.warehouseId) return fail('TRAY_LINK_UNAVAILABLE');
        const sku = catalog.skus.find(r => r.id === trace.skuId), product = catalog.products.find(r => r.id === sku?.productId);
        if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
        const receipt = report.receipts.find(r => r.id === trace.sourceReceiptId), line = snapshot.lines.find(r => r.id === trace.sourceLineId);
        const putaway = report.putaways.filter(r => r.data.boxId === trace.id && r.data.trayId === tray.id && r.data.status === 'CONFIRMED').sort((a, b) => b.data.updatedAt.localeCompare(a.data.updatedAt))[0];
        if (!receipt || !line || line.data.receiptId !== receipt.id || line.data.skuId !== sku.id || !putaway || putaway.data.receiptId !== receipt.id) return fail('TRAY_LINK_UNAVAILABLE');
        const quantity = trace.events.reduce((sum, event) => sum + event.data.signedQuantity, 0);
        if (!Number.isSafeInteger(quantity) || quantity < 0) return fail('INVALID_BALANCE');
        tray.boxes.push({ id: trace.id, code: trace.physicalCode, skuId: sku.id, skuCode: sku.code, productId: product.id, productName: product.name, receiptId: receipt.id, receiptCode: receipt.data.code, sourceLineId: trace.sourceLineId, quantity, unit: trace.unit, putawayId: putaway.id, confirmedAt: putaway.data.updatedAt });
      }
      for (const tray of rows) {
        tray.boxCount = tray.boxes.length; tray.skuCount = new Set(tray.boxes.map(box => box.skuId)).size;
        tray.lastConfirmedAt = tray.boxes.map(box => box.confirmedAt).sort().at(-1) ?? null;
      }
      return { report, rows, hasScenario: snapshot.scenario !== null };
    }
    return fail('SNAPSHOT_CHANGED');
  }
  async function load() {
    if (!active) return;
    const token = ++sequence; publish({ model: null, busy: true, error: '' });
    try { const model = await read(); if (active && token === sequence) publish({ model }); }
    catch (error) { if (active && token === sequence) publish({ model: null, error: (error as { code?: string })?.code ?? 'READ_FAILED' }); }
    finally { if (active && token === sequence) publish({ busy: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume() { active = true; return load(); }, suspend() { active = false; ++sequence; } };
}
