import fixture from '../fixtures/S22.summary.json';
import detailFixture from '../fixtures/S22.desktop.json';
import type { WarrantyReportAdapter, WarrantyReportModel } from '../../contracts/warranty-parts-report';

export const warrantyPartsReportFixtureAdapter: WarrantyReportAdapter = {
  async readSummary(period, { signal }) {
    signal.throwIfAborted();
    // A period snapshot is not a promise of row-level coverage or date semantics.
    if (period.from !== fixture.period.from || period.to !== fixture.period.to) {
      return { kind: 'blocked', reason: 'MISSING_PERIOD_SNAPSHOT' };
    }
    const model: WarrantyReportModel = {
      period: { ...fixture.period },
      summary: { ...fixture.summary },
      details: { availability: 'AVAILABLE', selectedFixture: 'DESKTOP', total: detailFixture.rows.length },
    };
    return { kind: 'available', model };
  },
};
