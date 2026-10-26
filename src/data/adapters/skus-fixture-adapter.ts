import fixtureSource from '../fixtures/DESIGN_FIXTURE_SNAPSHOT.json';
import contractSource from '../fixtures/SCREEN_CONTRACTS.seed.json';
import { queryTable } from '../../shared/table-query';
import { SCREEN_FOUNDATION, screenSearch, screenSort } from '../../shared/screen-foundation';
import { SKUS_RUNTIME_POLICY } from '../../controllers/skus-policy';
import {
  DEFAULT_SKUS_QUERY,
  type SkuRow,
  type SkusBlocker,
  type SkusDataAdapter,
  type SkusMissingFixtureReason,
  type SkusModel,
  type SkusQuery,
  type SkusResult,
} from '../../contracts/skus';

interface SkusSource {
  screen_id: 'S04';
  source_snapshot: string;
  provenance: 'SOURCE_FIXTURE';
  summary: { skus_total: number; 'Đang hoạt động': number; 'Ngừng sử dụng': number; percentages_display: string[] };
  record_rows: Record<string, string>[];
  record_rows_included: number;
  aggregate_total: number;
  detail_completeness: 'PARTIAL_ROWS_ONLY';
  is_live_data: false;
  production_match_99_percent_verified: false;
}

const fixture = fixtureSource.screens.find(screen => screen.screen_id === 'S04') as unknown as SkusSource | undefined;
const contract = contractSource.screens.find(screen => screen.screen_id === 'S04');
function block(query: SkusQuery, reason: SkusBlocker, detail: string): SkusResult {
  return { kind: 'blocked', reason, detail, query: structuredClone(query) };
}

function missing(query: SkusQuery, reason: SkusMissingFixtureReason, detail: string): SkusResult {
  return { kind: 'missing-fixture', reason, evidence: 'BLOCKED_MISSING_FIXTURE', detail, query: structuredClone(query) };
}

function sourceRows(): SkuRow[] {
  if (!fixture || !contract) throw new Error('S04 source fixture/contract is missing');
  if (fixture.record_rows_included !== fixture.record_rows.length || fixture.aggregate_total !== 1284) throw new Error('S04 source completeness changed');
  const rows = fixture.record_rows.map((row): SkuRow => {
    const required = ['Mã SKU', 'Tên sản phẩm', 'Nhóm hàng', 'ĐVT', 'Mã vạch', 'Trạng thái', 'Cập nhật'];
    if (required.some(field => typeof row[field] !== 'string')) throw new Error('S04 source field is missing or is not a string');
    if (!['Đang hoạt động', 'Ngừng sử dụng'].includes(row['Trạng thái'])) throw new Error('S04 status mapping is not source-backed');
    return {
      key: row['Mã SKU'], code: row['Mã SKU'], name: row['Tên sản phẩm'], group: row['Nhóm hàng'],
      unit: row['ĐVT'], barcode: row['Mã vạch'], status: row['Trạng thái'] === 'Đang hoạt động' ? 'active' : 'inactive',
      statusLabel: row['Trạng thái'], updatedAt: row['Cập nhật'],
    };
  });
  if (rows.length !== 7 || new Set(rows.map(row => row.key)).size !== rows.length) throw new Error('S04 fixture row identity is incomplete or duplicated');
  return rows;
}

function sourceSummary(): SkusModel['summary'] {
  if (!fixture || !contract) throw new Error('S04 source fixture/contract is missing');
  const summary = fixture.summary;
  if (summary['Đang hoạt động'] + summary['Ngừng sử dụng'] !== summary.skus_total || summary.skus_total !== fixture.aggregate_total) {
    throw new Error('S04 source summary totals do not reconcile');
  }
  return {
    skusTotal: summary.skus_total,
    active: summary['Đang hoạt động'], inactive: summary['Ngừng sử dụng'],
    activePercentage: summary.percentages_display[0], inactivePercentage: summary.percentages_display[1], scope: 'catalogue',
  };
}

/** Only the DEV harness supplies this dataset; the normal app never imports QA records. */
export interface SkusQaDataset { provenance: 'QA_SYNTHETIC'; rows: readonly SkuRow[] }

function readyModel(query: SkusQuery, allRows: readonly SkuRow[], qa: boolean): SkusResult {
  if (!fixture || !contract) throw new Error('S04 source fixture/contract is missing');
  // Owner explicitly scoped preview queries to all supplied detail rows on 10/10/2026.
  // The catalogue remains PARTIAL_ROWS_ONLY; only this selected query dataset is complete.
  const result = queryTable({
    source: { rows: allRows, scope: 'detail', completeness: 'complete', total: allRows.length, aggregateTotal: fixture.aggregate_total }, query,
    search: screenSearch(SCREEN_FOUNDATION.S04, query.search),
    filter: row => (query.group === 'all' || row.group === query.group) && (query.unit === 'all' || row.unit === query.unit) &&
      (query.status === 'all' || row.status === query.status),
    sort: screenSort(SCREEN_FOUNDATION.S04, query.sortKey, query.sort),
    stableId: row => row.key,
  });
  if (result.kind !== 'ready') return block(query, result.reason === 'PAGE_OUT_OF_RANGE' ? result.reason : 'INVALID_QUERY', result.detail);
  return {
    kind: 'ready',
    model: {
      query, rows: result.rows, summary: sourceSummary(), pagination: result.pagination,
      filterOptions: { groups: [...new Set(allRows.map(row => row.group))], units: [...new Set(allRows.map(row => row.unit))] },
      detailCompleteness: qa ? 'QA_SYNTHETIC_RECORDS' : fixture.detail_completeness,
      source: {
        id: qa ? 'S04-qa60' : 'S04-source-detail', scope: 'detail', completeness: 'complete', detailTotal: allRows.length,
        contractId: contractSource.package_id, fixtureVersion: 'HN_WMS_5_MAN_UI_TINH_r2_2026-10-08',
        referenceRevision: contract.visual.implementation_reference_revision, referenceSnapshot: fixture.source_snapshot,
        provenance: qa ? 'QA_SYNTHETIC' : 'SOURCE_FIXTURE', evidence: 'INTERACTIVE_FIXTURE_VERIFIED', fixtureRecordCount: allRows.length,
        aggregateTotal: fixture.aggregate_total, isLiveData: false, productionMatchVerified: false,
        backendMapping: null, enumMapping: null, permissionKeys: null, endpoint: null,
        relationBinding: null, searchMatch: SKUS_RUNTIME_POLICY.searchMatch, sortKey: query.sort ? query.sortKey : null,
        sortDirection: query.sort, filterOptionsComplete: false,
        queryScope: qa ? 'qa-rows' : 'provided-source-rows', filterOptionsScope: 'whole-query-dataset',
      },
    },
  };
}

/** Normal reads use exactly seven source rows; QA input is explicit and never selected by an app query. */
export function createSkusFixtureAdapter(qaDataset?: SkusQaDataset): SkusDataAdapter {
  const qaRows = qaDataset ? structuredClone(qaDataset.rows) : null;
  if (qaDataset && (qaDataset.provenance !== 'QA_SYNTHETIC' || qaRows?.length !== 60 || new Set(qaRows.map(row => row.key)).size !== 60)) {
    throw new Error('The isolated S04 QA dataset must contain 60 unique rows');
  }
  return {
    async read(input = DEFAULT_SKUS_QUERY, scenario = 'default'): Promise<SkusResult> {
      const query = structuredClone(input);
      if (scenario !== 'default') return missing(query, 'STATE_NOT_SUPPLIED', 'Only S04 Default is supplied; another state requires its approved source.');
      if (typeof query.search !== 'string' || typeof query.group !== 'string' || typeof query.unit !== 'string' || !['all', 'active', 'inactive'].includes(query.status)) {
        return block(query, 'INVALID_QUERY', 'The query is outside the source-backed S04 frontend values.');
      }
      if (!SKUS_RUNTIME_POLICY.sortKeys.includes(query.sortKey) || ![null, 'asc', 'desc'].includes(query.sort)) return block(query, 'INVALID_QUERY', 'Unsupported S04 sort key or direction.');
      const allRows = qaRows ? structuredClone(qaRows) : sourceRows();
      if ((query.group !== 'all' && !allRows.some(row => row.group === query.group)) || (query.unit !== 'all' && !allRows.some(row => row.unit === query.unit))) {
        return block(query, 'INVALID_QUERY', 'Filter value is outside the complete supplied detail dataset.');
      }
      return readyModel(query, allRows, Boolean(qaRows));
    },
  };
}
