import type { CatalogProduct, CatalogSku, CatalogSnapshot } from '../../contracts/catalog-create';
import type { BoxData, OperationalSnapshot, PartsIssueData, PartsLine, PhysicalData, ReversalData, StockEventData, TypedOperationalRecord, WarrantyCaseData } from '../../contracts/operational-preview';
import type { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';

/** S10 has no command, recovery or acknowledgement surface. */
export type PartsReadAdapter = Pick<ReturnType<typeof createOperationalWebAdapter>, 'available' | 'read'>;
export type PartsReadFence = Pick<OperationalSnapshot['token'], 'epoch' | 'scenarioId' | 'generation'>;
type Event = TypedOperationalRecord<StockEventData>;
export interface OperationalPartsLine {
  line: PartsLine; sku: CatalogSku; product: CatalogProduct;
  identities: TypedOperationalRecord<PhysicalData | BoxData>[];
}
export interface OperationalPartsReversal { record: TypedOperationalRecord<ReversalData>; events: Event[] }
export interface OperationalPartsIssue {
  record: TypedOperationalRecord<PartsIssueData>; warrantyCase: TypedOperationalRecord<WarrantyCaseData>;
  lines: OperationalPartsLine[]; events: Event[]; reversals: OperationalPartsReversal[];
}
export interface OperationalPartsModel { token: OperationalSnapshot['token']; snapshotRevision: number; active: boolean; issues: OperationalPartsIssue[] }
const fail = (): never => { throw Object.assign(new Error('INCOMPLETE_PARTS_RELATIONSHIP'), { code: 'INCOMPLETE_PARTS_RELATIONSHIP' }); };
const sameIds = (a: string[], b: string[]) => a.length === b.length && new Set(a).size === a.length && [...a].sort().every((id, i) => id === [...b].sort()[i]);
export function projectOperationalParts(snapshot: OperationalSnapshot, catalog: CatalogSnapshot): OperationalPartsModel {
  if (!snapshot.complete || snapshot.epoch !== catalog.epoch || snapshot.actorKey !== catalog.actorKey || snapshot.snapshotRevision !== catalog.snapshotRevision) return fail();
  const scoped = (data: { scenarioId: string; generation: number }) => data.scenarioId === snapshot.token.scenarioId && data.generation === snapshot.token.generation;
  if (!snapshot.scenario && snapshot.partsIssues.length) return fail();
  const issues = snapshot.partsIssues.map(record => {
    const data = record.data, warrantyCase = snapshot.warrantyCases.find(row => row.id === data.caseId && scoped(row.data));
    if (!scoped(data) || !warrantyCase || data.purpose !== 'WARRANTY') return fail();
    const lines = data.lines.map(line => {
      const sku = catalog.skus.find(row => row.id === line.skuId), product = catalog.products.find(row => row.id === sku?.productId);
      if (!sku || !product || !Number.isSafeInteger(line.quantity) || line.quantity <= 0) return fail();
      const identities: TypedOperationalRecord<PhysicalData | BoxData>[] = line.tracking === 'SERIAL'
        ? line.physicalIds.map(id => snapshot.physical.find(row => row.id === id && scoped(row.data)) ?? fail())
        : [snapshot.boxes.find(row => row.id === line.boxId && scoped(row.data)) ?? fail()];
      if (identities.some(row => row.data.skuId !== line.skuId || row.data.unit !== line.unit)
        || (line.tracking === 'SERIAL' && (line.boxId !== null || line.physicalIds.length !== line.quantity))
        || (line.tracking === 'BOX_QUANTITY' && line.physicalIds.length !== 0)) return fail();
      return { line, sku, product, identities };
    });
    const events = data.postedEventIds.map(id => snapshot.stockEvents.find(row => row.id === id && scoped(row.data)) ?? fail());
    if (data.status === 'POSTED') {
      if (!lines.length || events.length !== lines.length || new Set(data.postedEventIds).size !== events.length) return fail();
      for (const { line } of lines) {
        const matching = events.filter(row => row.data.sourceLineId === line.id);
        if (matching.length !== 1) return fail();
        const event = matching[0].data;
        if (event.eventType !== 'PARTS_ISSUE_POST' || event.documentId !== record.id || event.skuId !== line.skuId || event.unit !== line.unit
          || event.signedQuantity !== -line.quantity || event.boxId !== line.boxId || !sameIds(event.physicalIds, line.physicalIds) || event.originalEventId !== null) return fail();
      }
    } else if (events.length) return fail();
    const reversals = snapshot.reversals.filter(row => row.data.originalIssueId === record.id).map(reversal => {
      const r = reversal.data;
      if (!scoped(r) || data.status !== 'POSTED' || !sameIds(r.originalEventIds, data.postedEventIds) || !sameIds(r.originalLineIds, data.lines.map(line => line.id))) return fail();
      const compensation = r.postedCompensationEventIds.map(id => snapshot.stockEvents.find(row => row.id === id && scoped(row.data)) ?? fail());
      if (r.status === 'POSTED') {
        if (compensation.length !== events.length || new Set(r.postedCompensationEventIds).size !== compensation.length) return fail();
        for (const original of events) {
          const matches = compensation.filter(row => row.data.originalEventId === original.id);
          if (matches.length !== 1) return fail();
          const event = matches[0].data, source = original.data;
          if (event.eventType !== 'REVERSAL_POST' || event.documentId !== reversal.id || event.signedQuantity !== -source.signedQuantity
            || event.sourceLineId !== source.sourceLineId || event.skuId !== source.skuId || event.unit !== source.unit || event.boxId !== source.boxId || !sameIds(event.physicalIds, source.physicalIds)) return fail();
        }
      } else if (compensation.length) return fail();
      return { record: reversal, events: compensation };
    });
    return { record, warrantyCase, lines, events, reversals };
  });
  return { token: { ...snapshot.token }, snapshotRevision: snapshot.snapshotRevision, active: snapshot.scenario !== null, issues };
}
export function findOperationalPartsIssue(model: OperationalPartsModel | null, id: string, fence: PartsReadFence): OperationalPartsIssue | null {
  if (!model || model.token.epoch !== fence.epoch || model.token.scenarioId !== fence.scenarioId || model.token.generation !== fence.generation) return null;
  return model.issues.find(row => row.record.id === id) ?? null;
}
export function createOperationalPartsReader(adapter: PartsReadAdapter, readCatalog: () => Promise<CatalogSnapshot>) {
  let state: { model: OperationalPartsModel | null; busy: boolean; error: string } = { model: null, busy: false, error: '' };
  let active = true, serial = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { if (active) { state = { ...state, ...patch }; listeners.forEach(fn => fn()); } };
  async function load() {
    if (!active || state.busy) return;
    const token = ++serial; publish({ busy: true, error: '' });
    try {
      if (!adapter.available) throw Object.assign(new Error('COMMAND_UNAVAILABLE'), { code: 'COMMAND_UNAVAILABLE' });
      // A concurrent command can advance either catalog labels or their related records.
      // Retry fresh pairs; operations remain last so reset/detail fences use the current generation.
      for (let attempt = 0; attempt < 3; attempt++) {
        const catalog = await readCatalog(); if (!active || serial !== token) return;
        const snapshot = await adapter.read(); if (!active || serial !== token) return;
        if (snapshot.epoch === catalog.epoch && snapshot.actorKey === catalog.actorKey && snapshot.snapshotRevision !== catalog.snapshotRevision) continue;
        const model = projectOperationalParts(snapshot, catalog);
        publish({ model, error: '' }); return;
      }
      fail();
    } catch (error) { if (active && serial === token) publish({ model: null, error: (error as { code?: string })?.code ?? 'READ_FAILED' }); }
    finally { if (active && serial === token) publish({ busy: false }); }
  }
  return { getSnapshot: () => state, subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); }, load,
    resume() { active = true; ++serial; publish({ busy: false }); return load(); }, suspend() { active = false; ++serial; } };
}
