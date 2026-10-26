import seed from '../fixtures/S10.seed.json';
import type { PartsAdapter, PartsQuery, PartsRow, PartsSummary } from '../../contracts/parts-slips';
import { createListFixtureAdapter } from '../../shared/list-runtime';

/** Compare sourced wall-clock labels only. No timestamp or date inferred from opaque codes. */
export function partsUpdatedSortValue(label: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) · (\d{2}):(\d{2})$/u.exec(label);
  return match ? `${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}` : null;
}

export function createPartsFixtureAdapter(): PartsAdapter {
  const f = structuredClone(seed.fixture);
  if (f.visibleRows.length !== 7 || new Set(f.visibleRows.map(r => r.slipCode)).size !== 7 ||
      f.total !== 84 || f.exported + f.draft + f.scanning + f.cancelled !== f.total ||
      f.exportedPercent !== 76.2 || f.snapshot !== '2026-09-10') throw Error('S10 source integrity mismatch');
  // Explicit allowlist prevents historicalCaseStatus and provenance leaking into the view model.
  const rows: PartsRow[] = f.visibleRows.map(r => ({
    slipCode: r.slipCode, warrantyCaseCode: r.warrantyCaseCode, componentSummary: r.componentSummary,
    quantitySummary: r.quantitySummary, trackingLabel: r.trackingLabel,
    slipStatus: r.slipStatus, updatedAtLabel: r.updatedAtLabel,
  }));
  const statuses = [...new Set(rows.map(r => r.slipStatus))];
  return createListFixtureAdapter<PartsRow, PartsQuery, PartsSummary>({
    sourceId: 'S10-P01-r02-detail',
    source: { rows, scope: 'detail', completeness: 'complete', total: rows.length, aggregateTotal: f.total },
    summary: { snapshot: f.snapshot, total: f.total, exported: f.exported, draft: f.draft,
      scanning: f.scanning, cancelled: f.cancelled, exportedPercent: f.exportedPercent },
    search: query => ({ value: query.search, fields: [r => r.slipCode, r => r.warrantyCaseCode, r => r.componentSummary] }),
    filters: query => [r => query.status === 'all' || r.slipStatus === query.status],
    sort: query => ({ type: 'date', value: r => partsUpdatedSortValue(r.updatedAtLabel), direction: query.sort }),
    stableId: r => r.slipCode,
    optionCatalogue: { status: statuses },
    validate: query => typeof query.search !== 'string' || !['asc', 'desc'].includes(query.sort)
      ? { reason: 'INVALID_QUERY', detail: 'Unsupported S10 query shape.' }
      : query.status !== 'all' && !statuses.includes(query.status)
        ? { reason: 'REQUIRES_OWNER_CONFIRMATION', detail: 'Full API status enum is not supplied.' } : null,
  });
}
