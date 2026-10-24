import { validateBusinessDateRange } from '../../shared/date-policy';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { exportOperationalReport, pinOperationalReports, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type MovementLedgerReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export type LedgerPeriod = { from: string; to: string };
export interface MovementLedgerRow {
  event: OperationalReports['events'][number]; skuCode: string; productId: string; productName: string;
  documentCode: string; physicalCodes: string[]; boxCode: string | null; originalDocumentCode: string | null;
}
export interface MovementLedgerModel { report: OperationalReports; rows: MovementLedgerRow[]; hasScenario: boolean }
const fail = (code: string, period?: LedgerPeriod): never => { throw Object.assign(new Error(code), { code, ...(period ? { period: { ...period } } : {}) }); };

/** Only joins labels to Shared06's validated immutable ledger. No private event projection. */
export function createMovementLedgerBinding(adapter: MovementLedgerReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: MovementLedgerModel | null; busy: boolean; error: string; acceptedPeriod: LedgerPeriod | null; requestedPeriod: LedgerPeriod | null } = { model: null, busy: false, error: '', acceptedPeriod: null, requestedPeriod: null };
  let active = true, sequence = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (period: LedgerPeriod, asOf = now()) => {
    if (!validateBusinessDateRange(period, { now: new Date(asOf) }).valid) fail('INVALID_PERIOD', period);
  };
  async function read(period: LedgerPeriod | null): Promise<MovementLedgerModel> {
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
      const documents = [...report.receipts, ...report.outbounds, ...report.partsIssues, ...report.reversals];
      const rows = report.events.map(event => {
        const data = event.data, sku = catalog.skus.find(s => s.id === data.skuId), product = catalog.products.find(p => p.id === sku?.productId);
        if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
        const document = documents.find(d => d.id === data.documentId);
        const physicalCodes = data.physicalIds.map(id => snapshot.physical.find(p => p.id === id)?.data.physicalCode ?? fail('EVENT_LINK_UNAVAILABLE'));
        const boxCode = data.boxId ? snapshot.boxes.find(b => b.id === data.boxId)?.data.physicalCode ?? fail('EVENT_LINK_UNAVAILABLE') : null;
        const original = data.originalEventId ? snapshot.stockEvents.find(e => e.id === data.originalEventId) : null;
        const originalDocument = original ? documents.find(d => d.id === original.data.documentId) : null;
        if (!document || data.originalEventId && (!original || !originalDocument)) return fail('EVENT_LINK_UNAVAILABLE');
        return { event, skuCode: sku.code, productId: product.id, productName: product.name, documentCode: document.data.code, physicalCodes, boxCode, originalDocumentCode: originalDocument?.data.code ?? null };
      });
      return { report, rows, hasScenario: snapshot.scenario !== null };
    }
    return fail('SNAPSHOT_CHANGED');
  }
  async function load(period: LedgerPeriod | null = state.requestedPeriod ?? state.acceptedPeriod) {
    if (!active) return;
    const token = ++sequence;
    publish({ model: null, busy: true, error: '', requestedPeriod: period ? { ...period } : null });
    try {
      const model = await read(period);
      if (active && token === sequence) publish({ model, acceptedPeriod: { from: model.report.query.from, to: model.report.query.to }, requestedPeriod: { from: model.report.query.from, to: model.report.query.to } });
    } catch (error) {
      if (active && token === sequence) {
        const failure = error as { code?: string; period?: LedgerPeriod };
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
      const bytes = await exportOperationalReport(model.report, 'events');
      if (!active || token !== sequence || state.model !== model) return fail('SNAPSHOT_CHANGED');
      validatePeriod(model.report.query);
      return { bytes, query: model.report.query, token: model.report.token, sha256: model.report.sha256 };
    },
    resume() { active = true; return load(); }, suspend() { active = false; ++sequence; },
  };
}
