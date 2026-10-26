import { dateRangeBlocker } from '../shared/date-policy';
import { DEFAULT_WARRANTY_REPORT_PERIOD, type WarrantyReportAdapter, type WarrantyReportModel, type WarrantyReportPeriod, type WarrantyReportReadResult } from '../contracts/warranty-parts-report';
import { warrantyPartsReportFixtureAdapter } from '../data/adapters/warranty-parts-report-fixture-adapter';

export type WarrantyReportOutcome = WarrantyReportReadResult | { kind: 'blocked'; reason: 'INVALID_PERIOD'; detail: string } | { kind: 'superseded' } | { kind: 'error' };
interface Snapshot { model: WarrantyReportModel | null; loading: boolean }

export function createWarrantyPartsReportController(adapter: WarrantyReportAdapter = warrantyPartsReportFixtureAdapter) {
  let snapshot: Snapshot = { model: null, loading: false };
  let epoch = 0;
  let request: AbortController | null = null;
  const listeners = new Set<() => void>();
  function emit(next: Snapshot) { snapshot = next; listeners.forEach(listener => listener()); }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async load(period: WarrantyReportPeriod = DEFAULT_WARRANTY_REPORT_PERIOD): Promise<WarrantyReportOutcome> {
      const token = ++epoch;
      request?.abort();
      const blocker = dateRangeBlocker(period);
      if (blocker) {
        request = null;
        emit({ ...snapshot, loading: false });
        return { kind: 'blocked', ...blocker };
      }
      const current = new AbortController(); request = current;
      emit({ ...snapshot, loading: true });
      try {
        const result = await adapter.readSummary({ ...period }, { signal: current.signal });
        if (token !== epoch) return { kind: 'superseded' };
        // The control and all numbers remain bound to the accepted snapshot.
        emit({ model: result.kind === 'available' ? result.model : snapshot.model, loading: false });
        return result;
      } catch {
        if (token !== epoch) return { kind: 'superseded' };
        emit({ ...snapshot, loading: false });
        return { kind: 'error' };
      } finally { if (token === epoch) request = null; }
    },
    clear() { ++epoch; request?.abort(); request = null; emit({ model: null, loading: false }); },
  };
}
