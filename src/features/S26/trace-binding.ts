import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { exportOperationalReport, pinOperationalReports, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type TraceReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
type TraceRecord = OperationalReports['trace'][number];
export interface TraceEventRow { event: TraceRecord['events'][number]; documentCode: string; originalDocumentCode: string | null }
export interface OperationalTraceRow {
  trace: TraceRecord; kind: 'SERIAL' | 'BOX'; skuCode: string; productId: string; productName: string;
  receiptCode: string; issuedDocumentCode: string | null; boxQuantity: number | null;
  trayId: string | null; trayCode: string | null; locationId: string | null; locationCode: string | null;
  events: TraceEventRow[];
}
export interface TraceReadModel { report: OperationalReports; rows: OperationalTraceRow[]; hasScenario: boolean }
export interface TraceSelection { id: string; epoch: string; scenarioId: string | null; generation: number }
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
export function resolveTraceSelection(model: TraceReadModel | null, selection: TraceSelection | null) {
  if (!model || !selection) return null;
  const token = model.report.token;
  if (token.epoch !== selection.epoch || token.scenarioId !== selection.scenarioId || token.generation !== selection.generation) return null;
  return model.rows.find(row => row.trace.id === selection.id) ?? null;
}
/** Exact lookup selects a chain. The displayed/exported cohort remains the complete pin. */
export function findTraceSelection(model: TraceReadModel | null, codeOrId: string): TraceSelection | null {
  if (!model) return null;
  const value = codeOrId.trim(), matches = model.rows.filter(row => row.trace.id === value || row.trace.physicalCode === value);
  return matches.length === 1 ? { id: matches[0].trace.id, ...model.report.token } : null;
}
/** Shared trace owns immutable population/history. This binding joins current labels and mapping. */
export function createTraceBinding(adapter: TraceReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: TraceReadModel | null; busy: boolean; error: string } = { model: null, busy: false, error: '' };
  let active = true, sequence = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  async function read(): Promise<TraceReadModel> {
    if (!adapter.available) return fail('COMMAND_UNAVAILABLE');
    for (let attempt = 0; attempt < 3; attempt++) {
      const catalog = await readCatalog(), snapshot = await adapter.read();
      if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey || catalog.snapshotRevision !== snapshot.snapshotRevision) continue;
      const asOf = now(), to = vietnamDate(asOf), from = snapshot.scenario ? vietnamDate(snapshot.scenario.data.startedAt) : to;
      const report = pinOperationalReports(snapshot, { from, to, asOf });
      const documents = [...report.receipts, ...report.outbounds, ...report.partsIssues, ...report.reversals];
      const rows = report.trace.map((trace): OperationalTraceRow => {
        const sku = catalog.skus.find(s => s.id === trace.skuId), product = catalog.products.find(p => p.id === sku?.productId);
        if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
        const receipt = report.receipts.find(r => r.id === trace.sourceReceiptId), line = snapshot.lines.find(l => l.id === trace.sourceLineId);
        if (!receipt || !line || line.data.receiptId !== receipt.id || line.data.skuId !== trace.skuId) return fail('TRACE_LINK_UNAVAILABLE');
        const kind = trace.kind === 'box' ? 'BOX' : trace.kind === 'physical' ? 'SERIAL' : fail('TRACE_LINK_UNAVAILABLE');
        let trayId: string | null = null, trayCode: string | null = null, locationId: string | null = null, locationCode: string | null = null;
        if (kind === 'BOX') {
          if (!('trayId' in trace) || trace.trayId !== null && typeof trace.trayId !== 'string') return fail('TRACE_LINK_UNAVAILABLE');
          trayId = trace.trayId;
          if (trayId) {
            const tray = report.setupMasters.find(m => m.id === trayId && m.kind === 'operational-setup-tray')?.data as { code?: string; locationId?: string; warehouseId?: string } | undefined;
            const location = report.setupMasters.find(m => m.id === tray?.locationId && m.kind === 'operational-setup-location')?.data as { code?: string; warehouseId?: string } | undefined;
            if (!tray?.code || !tray.locationId || !location?.code || tray.warehouseId !== trace.warehouseId || location.warehouseId !== trace.warehouseId) return fail('TRACE_LINK_UNAVAILABLE');
            trayCode = tray.code; locationId = tray.locationId; locationCode = location.code;
          }
        }
        // BOX events carry that BOX's quantity; a serial may share a multi-item event,
        // so its quantity must never be inferred by summing the document quantity.
        const boxQuantity = kind === 'BOX' ? trace.events.reduce((sum, event) => sum + event.data.signedQuantity, 0) : null;
        if (boxQuantity !== null && (!Number.isSafeInteger(boxQuantity) || boxQuantity < 0)) return fail('INVALID_BALANCE');
        const issuedDocument = trace.issuedDocumentId ? documents.find(d => d.id === trace.issuedDocumentId) : null;
        if (trace.issuedDocumentId && !issuedDocument) return fail('TRACE_LINK_UNAVAILABLE');
        const events = trace.events.map(event => {
          const document = documents.find(d => d.id === event.data.documentId);
          const original = event.data.originalEventId ? snapshot.stockEvents.find(e => e.id === event.data.originalEventId) : null;
          const originalDocument = original ? documents.find(d => d.id === original.data.documentId) : null;
          if (!document || event.data.originalEventId && !originalDocument) return fail('TRACE_LINK_UNAVAILABLE');
          return { event, documentCode: document.data.code, originalDocumentCode: originalDocument?.data.code ?? null };
        });
        return { trace, kind, skuCode: sku.code, productId: product.id, productName: product.name, receiptCode: receipt.data.code, issuedDocumentCode: issuedDocument?.data.code ?? null, boxQuantity, trayId, trayCode, locationId, locationCode, events };
      });
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
  return {
    getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    async exportXlsx() {
      const model = state.model, token = sequence;
      if (!active || state.busy || !model) return fail('REPORT_UNAVAILABLE');
      const bytes = await exportOperationalReport(model.report, 'trace');
      if (!active || token !== sequence || state.model !== model) return fail('SNAPSHOT_CHANGED');
      return { bytes, query: model.report.query, token: model.report.token, sha256: model.report.sha256 };
    },
    resume() { active = true; return load(); }, suspend() { active = false; ++sequence; },
  };
}
