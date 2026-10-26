import { validateBusinessDateRange } from '../../shared/date-policy';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalSnapshot } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { pinOperationalReports, exportOperationalReport, vietnamDate, type OperationalReports } from '../../operations/operational-reports';

export type RecipientOperationalReader = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export interface RecipientPeriod { from: string; to: string }
export interface FrozenRecipient { id: string; version: number; code: string; name: string; type: string; market: string }
export type RecipientExportRow = OperationalReports['recipients'][number]['eventLines'][number] & {
  outboundId: string; outboundCode: string; recipient: FrozenRecipient; snapshotKey: string;
  skuCode: string; productId: string; productName: string;
};
export type RecipientTotal = OperationalReports['recipientTotals'][number] & { key: string; skuCode: string };
export interface RecipientGroup { key: string; snapshotKey: string; recipient: FrozenRecipient; documentIds: string[]; totals: RecipientTotal[] }
export interface RecipientReadModel { report: OperationalReports; sourceRows: OperationalReports['recipients']; sourceTotals: OperationalReports['recipientTotals']; rows: RecipientExportRow[]; groups: RecipientGroup[]; hasScenario: boolean; documentCount: number; recipientCount: number }
const fail = (code: string, period?: RecipientPeriod): never => { throw Object.assign(new Error(code), { code, ...(period ? { period: { ...period } } : {}) }); };
/** Read only. The Shared pin/export own the complete population and immutable token. */
export function createOperationalRecipientBinding(adapter: RecipientOperationalReader, readCatalog: () => Promise<CatalogSnapshot>, now = () => new Date().toISOString()) {
  let state: { model: RecipientReadModel | null; period: RecipientPeriod | null; busy: boolean; error: string } = { model: null, period: null, busy: false, error: '' };
  const listeners = new Set<() => void>(); let active = true, serial = 0;
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (period: RecipientPeriod, asOf = now()) => {
    if (!validateBusinessDateRange(period, { now: new Date(asOf) }).valid) fail('INVALID_PERIOD', period);
  };
  async function read(period: RecipientPeriod | null): Promise<RecipientReadModel> {
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
    const rows: RecipientExportRow[] = [], groups = new Map<string, RecipientGroup>();
    for (const document of report.recipients) {
      const frozen = document.recipientSnapshot, outbound = report.outbounds.find(row => row.id === document.outboundId);
      if (!outbound || frozen.id !== document.recipientId || frozen.version !== outbound.data.recipientVersion || typeof frozen.code !== 'string') return fail('RECIPIENT_SNAPSHOT_UNAVAILABLE');
      const recipient = Object.freeze({ id: frozen.id, version: frozen.version, code: frozen.code, name: frozen.name, type: frozen.type, market: frozen.market });
      const groupKey = JSON.stringify([document.recipientId, document.snapshotKey]);
      const group: RecipientGroup = groups.get(groupKey) ?? { key: groupKey, snapshotKey: document.snapshotKey, recipient, documentIds: [], totals: [] };
      group.documentIds.push(document.outboundId); groups.set(groupKey, group);
      for (const line of document.eventLines) {
        const sku = catalog!.skus.find(row => row.id === line.skuId), product = catalog!.products.find(row => row.id === sku?.productId); if (!sku || !product) return fail('CATALOG_LINK_UNAVAILABLE');
        rows.push({ ...line, outboundId: document.outboundId, outboundCode: document.documentCode, recipient, snapshotKey: document.snapshotKey, skuCode: sku.code, productId: product.id, productName: product.name });
      }
    }
    // Display the Shared totals directly: grouping never recomputes quantities or merges snapshot variants.
    for (const total of report.recipientTotals) {
      const group = groups.get(JSON.stringify([total.recipientId, total.snapshotKey])), sku = catalog!.skus.find(row => row.id === total.skuId);
      if (!group || !sku) return fail('CATALOG_LINK_UNAVAILABLE');
      group.totals.push({ ...total, key: JSON.stringify([total.skuId, total.warehouseId, total.unit]), skuCode: sku.code });
    }
    return { report, sourceRows: report.recipients, sourceTotals: report.recipientTotals, rows, groups: [...groups.values()], hasScenario: snapshot.scenario !== null, documentCount: report.recipients.length, recipientCount: new Set(report.recipients.map(row => row.recipientId)).size };
  }
  async function load(period: RecipientPeriod | null = state.period) {
    if (!active) return; const operation = ++serial; publish({ busy: true, error: '', model: null, period: period ? { ...period } : null });
    try { const model = await read(period); if (active && operation === serial) publish({ model, period: { from: model.report.query.from, to: model.report.query.to } }); }
    catch (error) { if (active && operation === serial) {
      const failure = error as { code?: string; period?: RecipientPeriod };
      publish({ model: null, error: failure?.code ?? 'READ_FAILED', ...(failure?.period ? { period: { ...failure.period } } : {}) });
    } }
    finally { if (active && operation === serial) publish({ busy: false }); }
  }
  async function exportPinned() {
    const model = state.model, operation = serial; if (!active || state.busy || !model) return fail('REPORT_NOT_READY');
    validatePeriod(model.report.query);
    const bytes = await exportOperationalReport(model.report, 'recipients');
    if (!active || operation !== serial || state.model !== model) return fail('EXPORT_SUPERSEDED');
    validatePeriod(model.report.query);
    return { bytes, report: model.report, sourceRows: model.sourceRows, sourceTotals: model.sourceTotals };
  }
  return { exportPinned, getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resetPeriod: () => load(null), resume() { active = true; return load(); }, suspend() { active = false; ++serial; } };
}
