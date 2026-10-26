import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalSnapshot } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { pinOperationalReports, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type InventoryOperationalReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export interface OperationalInventoryRow {
  key: string; skuId: string; skuCode: string; productId: string; productName: string;
  warehouseId: string; unit: string; quantity: number; actual: null; difference: null;
}
export interface InventoryReadModel { report: OperationalReports; rows: OperationalInventoryRow[]; hasScenario: boolean }
export interface InventorySelection { key: string; epoch: string; scenarioId: string | null; generation: number }
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
export function resolveInventorySelection(model: InventoryReadModel | null, selection: InventorySelection | null) {
  if (!model || !selection) return null;
  const token = model.report.token;
  if (selection.epoch !== token.epoch || selection.scenarioId !== token.scenarioId || selection.generation !== token.generation) return null;
  return model.rows.find(row => row.key === selection.key) ?? null;
}
/** A screen read only: canonical pinning owns projection and completeness validation. */
export function createOperationalInventoryBinding(adapter: InventoryOperationalReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: InventoryReadModel | null; busy: boolean; error: string } = { model: null, busy: false, error: '' };
  const listeners = new Set<() => void>(); let active = true, serial = 0;
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  async function read(): Promise<InventoryReadModel> {
    if (!adapter.available) fail('COMMAND_UNAVAILABLE');
    let catalog: CatalogSnapshot | undefined, snapshot: OperationalSnapshot | undefined;
    // A concurrent command between the two canonical reads requires a fresh pair,
    // never a join of labels from one revision and quantities from another.
    for (let attempt = 0; attempt < 3; attempt++) {
      const labels = await readCatalog(), operations = await adapter.read();
      if (labels.epoch === operations.epoch && labels.actorKey === operations.actorKey && labels.snapshotRevision === operations.snapshotRevision) { catalog = labels; snapshot = operations; break; }
    }
    if (!catalog || !snapshot) return fail('SNAPSHOT_CHANGED');
    const asOf = now(), to = vietnamDate(asOf), from = snapshot.scenario ? vietnamDate(snapshot.scenario.data.startedAt) : to;
    const report = pinOperationalReports(snapshot, { from, to, asOf });
    const keys = new Set<string>();
    const rows = report.inventory.map(row => {
      const sku = catalog!.skus.find(s => s.id === row.skuId), product = catalog!.products.find(p => p.id === sku?.productId);
      if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
      const key = JSON.stringify([row.skuId, row.warehouseId, row.unit]);
      const balance = report.stock.find(s => s.skuId === row.skuId && s.warehouseId === row.warehouseId && s.unit === row.unit);
      if (keys.has(key) || !balance || balance.closing !== row.quantity || !Number.isSafeInteger(row.quantity) || row.quantity < 0 || row.actual !== null || row.difference !== null) return fail('INCOMPLETE_POPULATION');
      keys.add(key);
      return { key, skuId: row.skuId, skuCode: sku.code, productId: product.id, productName: product.name, warehouseId: row.warehouseId, unit: row.unit, quantity: row.quantity, actual: null, difference: null };
    });
    if (rows.length !== report.stock.length) return fail('INCOMPLETE_POPULATION');
    return { report, rows, hasScenario: snapshot.scenario !== null };
  }
  async function load() {
    if (!active) return;
    const token = ++serial; publish({ busy: true, error: '', model: null });
    try { const model = await read(); if (active && token === serial) publish({ model }); }
    catch (error) { if (active && token === serial) publish({ model: null, error: (error as { code?: string })?.code ?? 'READ_FAILED' }); }
    finally { if (active && token === serial) publish({ busy: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume() { active = true; return load(); }, suspend() { active = false; ++serial; } };
}
