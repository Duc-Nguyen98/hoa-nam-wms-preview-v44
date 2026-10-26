import { getBusinessDateWindow, validateBusinessDateRange } from '../../shared/date-policy';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalSnapshot, WarrantyCaseData } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { exportOperationalReport, pinOperationalReports, vietnamDate, type OperationalReportQuery } from '../../operations/operational-reports';

export type WarrantyReportReadAdapter = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export type WarrantyReportPeriod = Pick<OperationalReportQuery, 'from' | 'to'>;
/** Derive the initial period from the same session as the case list, within the shared date policy. */
export function defaultWarrantyReportPeriod(snapshot: OperationalSnapshot, now: string): WarrantyReportPeriod {
  const window = getBusinessDateWindow({ now: new Date(now) });
  const start = snapshot.scenario ? vietnamDate(snapshot.scenario.data.startedAt) : window.today;
  return { from: window.minDate && start < window.minDate ? window.minDate : start, to: window.today };
}
const fail = (code: string): never => { throw Object.assign(new Error(code), { code }); };
function frozen<T>(value: T): T { if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(frozen); } return value; }
export function projectWarrantyReport(snapshot: OperationalSnapshot, catalog: CatalogSnapshot, query: OperationalReportQuery) {
  if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey) return fail('STALE_DEMO_EPOCH');
  if (catalog.snapshotRevision !== snapshot.snapshotRevision) return fail('STALE_SNAPSHOT');
  const report = pinOperationalReports(snapshot, query);
  const rows = report.cases.map(item => {
    const source = snapshot.warrantyCases.find(row => row.id === item.id), sku = catalog.skus.find(row => row.id === item.skuId), product = catalog.products.find(row => row.id === sku?.productId);
    if (!source || !sku || !product || source.data.scenarioId !== report.token.scenarioId || source.data.generation !== report.token.generation) return fail('INCOMPLETE_POPULATION');
    // Shared validates and pins intake labels; current catalog only checks FK/version coherence.
    const captured = item.productSnapshot;
    if (captured.skuId !== sku.id || captured.productId !== product.id || captured.skuVersion > sku.version || captured.productVersion > product.version) return fail('INCOMPLETE_POPULATION');
    const physical = item.physicalId === null ? null : snapshot.physical.find(row => row.id === item.physicalId);
    if (item.physicalId && (!physical || physical.data.skuId !== item.skuId)) return fail('INCOMPLETE_POPULATION');
    const timeline = item.timeline.map(event => {
      const d = event.data as { caseId: string; state: WarrantyCaseData['state']; timestamp: string; actor: string; expectedFinishDate: string | null; defectIds: string[] };
      if (d.caseId !== item.id || !Number.isFinite(Date.parse(d.timestamp)) || typeof d.actor !== 'string') return fail('INCOMPLETE_POPULATION');
      return { id: event.id, state: d.state, timestamp: d.timestamp, actor: d.actor, expectedFinishDate: d.expectedFinishDate, defectIds: [...d.defectIds] };
    });
    return { ...item, physicalCode: physical?.data.physicalCode ?? null,
      temporaryIdentity: source.data.temporaryIdentity, customerReportedIssue: source.data.customerReportedIssue, technicianDiagnosis: source.data.technicianDiagnosis,
      defectIds: [...source.data.defectIds], partIssueIds: report.partsIssues.filter(issue => issue.data.caseId === item.id).map(issue => issue.id), timeline };
  });
  if (new Set(rows.map(row => row.id)).size !== report.summary.total) return fail('INCOMPLETE_POPULATION');
  return frozen({ report, rows, active: snapshot.scenario !== null });
}
export type OperationalWarrantyReport = ReturnType<typeof projectWarrantyReport>;
export interface WarrantyCaseSelection { id: string; fence: Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'> }
export function findPinnedWarrantyCase(model: OperationalWarrantyReport | null, selection: WarrantyCaseSelection | null) {
  if (!model || !selection || model.report.token.epoch !== selection.fence.epoch || model.report.token.scenarioId !== selection.fence.scenarioId || model.report.token.generation !== selection.fence.generation) return null;
  return model.rows.find(row => row.id === selection.id) ?? null;
}
export function createWarrantyReportReader(adapter: WarrantyReportReadAdapter, readCatalog: () => Promise<CatalogSnapshot>,
  clock: () => string = () => new Date().toISOString(), exporter: typeof exportOperationalReport = exportOperationalReport) {
  let state: { model: OperationalWarrantyReport | null; loading: boolean; exporting: boolean; error: string; period: WarrantyReportPeriod | null } = { model: null, loading: false, exporting: false, error: '', period: null };
  let active = true, sequence = 0, period: WarrantyReportPeriod | null = null;
  const listeners = new Set<() => void>(), current = (token: number) => active && sequence === token;
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  const validatePeriod = (value: WarrantyReportPeriod) => {
    if (!validateBusinessDateRange(value, { now: new Date(clock()) }).valid) fail('INVALID_PERIOD');
  };
  async function load(next?: WarrantyReportPeriod, qaAsOf?: string) {
    if (!active) return; const token = ++sequence; publish({ model: null, loading: true, exporting: false, error: '' });
    try {
      if (!adapter.available) fail('COMMAND_UNAVAILABLE');
      if (next) period = { ...next };
      const requested = period;
      if (requested) { publish({ period: { ...requested } }); validatePeriod(requested); }
      for (let attempt = 0; attempt < 3; attempt++) {
        if (requested) validatePeriod(requested);
        const catalog = await readCatalog(); if (!current(token)) return;
        if (requested) validatePeriod(requested);
        const snapshot = await adapter.read(); if (!current(token)) return;
        if (catalog.epoch !== snapshot.epoch || catalog.actorKey !== snapshot.actorKey) fail('STALE_DEMO_EPOCH');
        if (catalog.snapshotRevision !== snapshot.snapshotRevision) continue;
        const effective = requested ?? defaultWarrantyReportPeriod(snapshot, clock());
        publish({ period: { ...effective } }); validatePeriod(effective);
        const model = projectWarrantyReport(snapshot, catalog, { ...effective, asOf: qaAsOf ?? clock() });
        publish({ model, error: '' }); return;
      }
      fail('STALE_SNAPSHOT');
    } catch (error) { if (current(token)) publish({ model: null, error: (error as { code?: string }).code ?? 'READ_FAILED' }); }
    finally { if (current(token)) publish({ loading: false }); }
  }
  async function exportXlsx() {
    const model = state.model, token = sequence; if (!active || !model || state.loading || state.exporting) return null;
    publish({ exporting: true, error: '' });
    try {
      validatePeriod(model.report.query);
      const bytes = await exporter(model.report, 'cases');
      if (!current(token) || state.model !== model) return null;
      validatePeriod(model.report.query);
      return { bytes, report: model.report };
    } catch (error) { if (current(token)) publish({ error: (error as { code?: string }).code ?? 'EXPORT_FAILED' }); return null; }
    finally { if (current(token)) publish({ exporting: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load, exportXlsx,
    resume() { active = true; return load(); }, suspend() { ++sequence; publish({ model: null, loading: false, exporting: false }); active = false; } };
}
