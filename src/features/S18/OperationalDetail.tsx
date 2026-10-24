import { createOperationalInboundBinding, type InboundReadModel, type OperationalInboundRow } from './inbound-binding';
import { selectOperationalEventCohort, type OperationalReports } from '../../operations/operational-reports';

export interface InboundDetailSelection {
  model: InboundReadModel;
  fence: number;
  row: Readonly<OperationalInboundRow>;
  event: OperationalReports['events'][number];
  receipt: OperationalReports['receipts'][number];
}

/** UI selection only. The existing report binding owns every read and export. */
export function createOperationalInboundDetailBinding(...args: Parameters<typeof createOperationalInboundBinding>) {
  const binding = createOperationalInboundBinding(...args);
  let state = { ...binding.getSnapshot(), detail: null as InboundDetailSelection | null };
  let active = true, fence = 0;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  binding.subscribe(() => {
    if (!active) return;
    const next = binding.getSnapshot();
    // Even a refresh of the same IDs is a new pin and must require a new selection.
    if (next.model !== state.model || next.busy || next.error) {
      ++fence;
      publish({ ...next, detail: null });
    } else publish(next);
  });
  function openDetail(eventId: string, expectedModel: InboundReadModel) {
    const model = state.model;
    if (!active || state.busy || state.error || !model || model !== expectedModel) return false;
    try {
      const canonical = selectOperationalEventCohort(model.report, 'inbound').rows.find(row => row.eventId === eventId);
      const row = model.rows.find(row => row.eventId === eventId);
      const event = model.report.events.find(item => item.id === eventId);
      const receipt = model.report.receipts.find(item => item.id === canonical?.documentId);
      if (!canonical || !row || !event || !receipt || row.receiptId !== canonical.documentId
        || row.quantity !== canonical.quantity || row.skuId !== canonical.skuId || row.sourceLineId !== canonical.sourceLineId) {
        publish({ detail: null }); return false;
      }
      const pinnedRow = structuredClone(row); Object.freeze(pinnedRow.physicalIds); Object.freeze(pinnedRow);
      publish({ detail: { model, fence, row: pinnedRow, event, receipt } });
      return true;
    } catch { publish({ detail: null }); return false; }
  }
  return {
    ...binding, openDetail, closeDetail: () => publish({ detail: null }), getSnapshot: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); },
    suspend() { active = false; ++fence; binding.suspend(); publish({ model: null, detail: null, busy: false }); },
    resume() { active = true; return binding.resume(); },
  };
}
