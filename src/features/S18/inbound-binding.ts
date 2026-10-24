import { validateBusinessDateRange } from '../../shared/date-policy';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalSnapshot } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { pinOperationalReports, selectOperationalEventCohort, exportOperationalReport, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type InboundOperationalReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export interface InboundPeriod { from: string; to: string }
export interface OperationalInboundRow {
  eventId: string; receiptId: string; receiptCode: string; sourceText: string; referenceText: string;
  skuId: string; skuCode: string; productId: string; productName: string; warehouseId: string;
  unit: string; quantity: number; committedAt: string; sourceLineId: string; physicalIds: string[]; boxId: string | null;
}
export interface InboundReadModel {
  report: OperationalReports; cohort: ReturnType<typeof selectOperationalEventCohort>; rows: OperationalInboundRow[]; hasScenario: boolean; receiptCount: number;
  totals: { key: string; skuId: string; skuCode: string; warehouseId: string; unit: string; quantity: number }[];
}
const fail = (code: string, period?: InboundPeriod): never => { throw Object.assign(new Error(code), { code, ...(period ? { period: { ...period } } : {}) }); };
/** Screen-only projection of the complete canonical pin; never a business command or independent store. */
export function createOperationalInboundBinding(adapter: InboundOperationalReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: InboundReadModel | null; period: InboundPeriod | null; busy: boolean; error: string } = { model: null, period: null, busy: false, error: '' };
  const listeners = new Set<() => void>(); let active = true, serial = 0;
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (period: InboundPeriod, asOf = now()) => {
    if (!validateBusinessDateRange(period, { now: new Date(asOf) }).valid) fail('INVALID_PERIOD', period);
  };
  async function read(period: InboundPeriod | null): Promise<InboundReadModel> {
    if (!adapter.available) fail('COMMAND_UNAVAILABLE');

    let catalog: CatalogSnapshot | undefined, snapshot: OperationalSnapshot | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (period) validatePeriod(period);
      const labels = await readCatalog();
      if (period) validatePeriod(period);
      const operations = await adapter.read();
      if (labels.epoch === operations.epoch && labels.actorKey === operations.actorKey && labels.snapshotRevision === operations.snapshotRevision) { catalog = labels; snapshot = operations; break; }
    }
    if (!catalog || !snapshot) return fail('SNAPSHOT_CHANGED');
    const asOf = now(), to = vietnamDate(asOf), query = period ?? { from: snapshot.scenario ? vietnamDate(snapshot.scenario.data.startedAt) : to, to };
    validatePeriod(query, asOf);
    const report = pinOperationalReports(snapshot, { ...query, asOf });
    const cohort = selectOperationalEventCohort(report, 'inbound');
    const rows = cohort.rows.map(event => {
      const receipt = report.receipts.find(row => row.id === event.documentId)!;
      const sku = catalog!.skus.find(row => row.id === event.skuId), product = catalog!.products.find(row => row.id === sku?.productId);
      if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
      return { ...event, receiptId: event.documentId, receiptCode: event.documentCode, sourceText: receipt.data.sourceText, referenceText: receipt.data.referenceText,
        skuCode: sku.code, productId: product.id, productName: product.name };
    });
    const totals = cohort.totals.map(total => {
      const sku = catalog!.skus.find(row => row.id === total.skuId); if (!sku) return fail('CATALOG_LINK_UNAVAILABLE');
      return { ...total, key: JSON.stringify([total.skuId, total.warehouseId, total.unit]), skuCode: sku.code };
    });
    return { report, cohort, rows, totals, receiptCount: new Set(rows.map(row => row.receiptId)).size, hasScenario: snapshot.scenario !== null };
  }
  async function load(period: InboundPeriod | null = state.period) {
    if (!active) return;
    const operation = ++serial; publish({ busy: true, error: '', model: null, period: period ? { ...period } : null });
    try { const model = await read(period); if (active && operation === serial) publish({ model, period: { from: model.report.query.from, to: model.report.query.to } }); }
    catch (error) { if (active && operation === serial) {
      const failure = error as { code?: string; period?: InboundPeriod };
      publish({ model: null, error: failure?.code ?? 'READ_FAILED', ...(failure?.period ? { period: { ...failure.period } } : {}) });
    } }
    finally { if (active && operation === serial) publish({ busy: false }); }
  }
  async function exportPinned() {
    const model = state.model, operation = serial;
    if (!active || state.busy || !model) return fail('REPORT_NOT_READY');
    validatePeriod(model.report.query);
    const bytes = await exportOperationalReport(model.report, 'inbound');
    if (!active || operation !== serial || state.model !== model) return fail('EXPORT_SUPERSEDED');
    validatePeriod(model.report.query);
    return { bytes, report: model.report, cohort: model.cohort };
  }
  return { exportPinned, getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resetPeriod: () => load(null), resume() { active = true; return load(); }, suspend() { active = false; ++serial; } };
}
