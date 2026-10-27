import { DEFAULT_OVERVIEW_QUERY, type OverviewDataAdapter, type OverviewQuery, type OverviewRow } from '../../src/contracts/overview';
import { createOverviewController } from '../../src/controllers/overview-controller';
import { OVERVIEW_RUNTIME_POLICY } from '../../src/controllers/overview-runtime';
import { createOverviewFixtureAdapter } from '../../src/data/adapters/overview-fixture-adapter';
import { queryOverviewRows } from '../../src/data/adapters/overview-table-query';

/** Test-entry only: the real source adapter keeps snapshot identity and CTA authority. */
export const REFERENCE_OVERVIEW_QUERY: OverviewQuery = {
  ...DEFAULT_OVERVIEW_QUERY, page: 1, pageSize: 4,
  period: { ...DEFAULT_OVERVIEW_QUERY.period },
};
export const REFERENCE_OVERVIEW_POLICY = {
  ...OVERVIEW_RUNTIME_POLICY, pageSizeOptions: [4, ...OVERVIEW_RUNTIME_POLICY.pageSizeOptions],
};

function referenceController(adapter: OverviewDataAdapter) {
  const controller = createOverviewController(adapter);
  return {
    ...controller,
    load: (query: OverviewQuery = structuredClone(REFERENCE_OVERVIEW_QUERY)) => controller.load(query),
    reset: (query: OverviewQuery = structuredClone(REFERENCE_OVERVIEW_QUERY)) => controller.reset(query),
  };
}

export function createReferenceOverviewController() {
  return referenceController(createOverviewFixtureAdapter(REFERENCE_OVERVIEW_POLICY));
}

/** Explicit test-only artwork projection. This is not original source custody. */
export const REFERENCE_PENDING3_SCENARIO = {
  snapshotId: 'isolated-s01-reference-pending3-v1',
  preservedWaitingIds: ['p12-stock-PX-0010', 'p12-stock-PN-0009', 'p12-stock-PX-0007'],
  mutations: [
    { id: 'p12-stock-PN-0006', from: 'waiting', to: 'posted' },
    { id: 'fixture-inbound-0005', from: 'waiting', to: 'posted' },
  ],
} as const;

export function createReferencePending3Adapter(): OverviewDataAdapter {
  const fixture = createOverviewFixtureAdapter(REFERENCE_OVERVIEW_POLICY);
  return { async read(query = structuredClone(REFERENCE_OVERVIEW_QUERY), scenario, context) {
    if (!REFERENCE_OVERVIEW_POLICY.pageSizeOptions.includes(query.pageSize)) {
      return { kind: 'blocked', reason: 'PAGE_SIZE_UNCONFIRMED', detail: 'Unsupported isolated scenario page size.', query };
    }
    // Read the complete16-row source before deriving any synthetic count or page.
    const result = await fixture.read({ ...REFERENCE_OVERVIEW_QUERY, period: query.period, pageSize: 25 }, scenario, context);
    if (result.kind !== 'ready') return result;
    const original = result.model;
    const rows: OverviewRow[] = original.rows.map(row => {
      const mutation = REFERENCE_PENDING3_SCENARIO.mutations.find(change => change.id === row.id);
      if (!mutation) return { ...row };
      if (row.status !== mutation.from) throw new Error(`Pending3 source status changed: ${row.id}`);
      return { ...row, status: mutation.to, statusLabel: 'Đã ghi sổ' };
    });
    const table = queryOverviewRows(rows, query);
    if (table.kind !== 'ready') return { kind: 'blocked', reason: table.reason === 'PAGE_OUT_OF_RANGE' ? 'PAGE_OUT_OF_RANGE' : 'INVALID_QUERY', detail: table.detail, query };
    const attention = rows.filter(row => row.status === 'waiting');
    const chart = original.chart.map((bucket, index) => {
      const inBucket = rows.filter(row => Math.min(3, Math.floor((Number(row.day.slice(-2)) - 1) / 7)) === index);
      return { ...bucket, inbound: inBucket.filter(row => row.type === 'inbound').length,
        outbound: inBucket.filter(row => row.type === 'outbound').length };
    });
    return { kind: 'ready', model: {
      ...original, query: structuredClone(query), rows: table.rows, attention, chart,
      pagination: { ...table.pagination, pageSizeOptions: [...REFERENCE_OVERVIEW_POLICY.pageSizeOptions] },
      summary: { ...original.summary, inbound: rows.filter(row => row.type === 'inbound').length,
        outbound: rows.filter(row => row.type === 'outbound').length, waiting: attention.length,
        posted: rows.filter(row => row.status === 'posted').length },
      source: { ...original.source, provenance: 'QA_SYNTHETIC', snapshotId: REFERENCE_PENDING3_SCENARIO.snapshotId,
        fixtureRecordCount: rows.length },
      emptyReason: rows.length === 0 ? 'no-documents' : table.rows.length === 0 ? 'no-matches' : null,
    } };
  } };
}

export function createReferencePending3Controller() {
  return referenceController(createReferencePending3Adapter());
}
