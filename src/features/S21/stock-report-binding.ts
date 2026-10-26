import { validateBusinessDateRange } from '../../shared/date-policy';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { exportOperationalReport, pinOperationalReports, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type StockReportReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export type StockPeriod = { from: string; to: string };
export type StockReportRow = OperationalReports['stock'][number] & { key: string; skuCode: string; productId: string; productName: string };
export interface StockReportModel { report: OperationalReports; rows: StockReportRow[]; hasScenario: boolean }
const fail = (code: string, period?: StockPeriod): never => { throw Object.assign(new Error(code), { code, ...(period ? { period: { ...period } } : {}) }); };

/** Screen binding only. Shared06 owns population validation, period accounting and XLSX. */
export function createStockReportBinding(adapter: StockReportReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: StockReportModel | null; busy: boolean; error: string; acceptedPeriod: StockPeriod | null; requestedPeriod: StockPeriod | null } = { model: null, busy: false, error: '', acceptedPeriod: null, requestedPeriod: null };
  let active = true, sequence = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (period: StockPeriod, asOf = now()) => {
    if (!validateBusinessDateRange(period, { now: new Date(asOf) }).valid) fail('INVALID_PERIOD', period);
  };
  async function read(period: StockPeriod | null): Promise<StockReportModel> {
    if (!adapter.available) return fail('COMMAND_UNAVAILABLE');

    for (let attempt = 0; attempt < 3; attempt++) {
      if (period) validatePeriod(period);
      const catalog = await readCatalog();
      if (period) validatePeriod(period);
      const snapshot = await adapter.read();
      if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey || catalog.snapshotRevision !== snapshot.snapshotRevision) continue;
      const asOf = now(), to = vietnamDate(asOf);
      const query = period ?? { from: snapshot.scenario ? vietnamDate(snapshot.scenario.data.startedAt) : to, to };
      validatePeriod(query, asOf);
      const report = pinOperationalReports(snapshot, { ...query, asOf });
      const rows = report.stock.map(row => {
        const sku = catalog.skus.find(s => s.id === row.skuId), product = catalog.products.find(p => p.id === sku?.productId);
        if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
        return { ...row, key: JSON.stringify([row.skuId, row.warehouseId, row.unit]), skuCode: sku.code, productId: product.id, productName: product.name };
      });
      return { report, rows, hasScenario: snapshot.scenario !== null };
    }
    return fail('SNAPSHOT_CHANGED');
  }
  async function load(period: StockPeriod | null = state.requestedPeriod ?? state.acceptedPeriod) {
    if (!active) return;
    const token = ++sequence;
    // Clear visible/exportable data before reading, including when reset or authority changes.
    publish({ model: null, busy: true, error: '', requestedPeriod: period ? { ...period } : null });
    try {
      const model = await read(period);
      if (active && token === sequence) publish({ model, acceptedPeriod: { from: model.report.query.from, to: model.report.query.to }, requestedPeriod: { from: model.report.query.from, to: model.report.query.to } });
    } catch (error) {
      if (active && token === sequence) {
        const failure = error as { code?: string; period?: StockPeriod };
        publish({ model: null, error: failure?.code ?? 'READ_FAILED', ...(failure?.period ? { requestedPeriod: { ...failure.period } } : {}) });
      }
    } finally { if (active && token === sequence) publish({ busy: false }); }
  }
  return {
    getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    async exportXlsx() {
      const model = state.model, token = sequence;
      if (!active || state.busy || !model) return fail('REPORT_UNAVAILABLE');
      validatePeriod(model.report.query);
      const bytes = await exportOperationalReport(model.report, 'stock');
      if (!active || token !== sequence || state.model !== model) return fail('SNAPSHOT_CHANGED');
      validatePeriod(model.report.query);
      return { bytes, query: model.report.query, token: model.report.token, sha256: model.report.sha256 };
    },
    resume() { active = true; return load(); }, suspend() { active = false; ++sequence; },
  };
}
