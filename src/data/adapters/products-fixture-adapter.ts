import fixtureSource from '../fixtures/DESIGN_FIXTURE_SNAPSHOT.json';
import contractSource from '../fixtures/SCREEN_CONTRACTS.seed.json';
import { queryTable, PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { SCREEN_FOUNDATION, screenSearch, screenSort } from '../../shared/screen-foundation';
import { productsUpdatedValue, PRODUCTS_RUNTIME_POLICY } from '../../controllers/products-policy';
import {
  DEFAULT_PRODUCTS_QUERY,
  type ProductRow,
  type ProductsBlocker,
  type ProductsDataAdapter,
  type ProductsMissingFixtureReason,
  type ProductsModel,
  type ProductsQuery,
  type ProductsResult,
} from '../../contracts/products';

interface ProductsSource {
  screen_id: 'S03';
  source_snapshot: string;
  provenance: 'SOURCE_FIXTURE';
  summary: { products_total: number; linked_skus: number; 'Đang hoạt động': number; 'Ngừng sử dụng': number; percentages_display: string[] };
  record_rows: Record<string, string>[];
  record_rows_included: number;
  aggregate_total: number;
  detail_completeness: 'PARTIAL_ROWS_ONLY';
  is_live_data: false;
  production_match_99_percent_verified: false;
}

const fixture = fixtureSource.screens.find(screen => screen.screen_id === 'S03') as unknown as ProductsSource | undefined;
const contract = contractSource.screens.find(screen => screen.screen_id === 'S03');
function block(query: ProductsQuery, reason: ProductsBlocker, detail: string): ProductsResult {
  return { kind: 'blocked', reason, detail, query: structuredClone(query) };
}

function missing(query: ProductsQuery, reason: ProductsMissingFixtureReason, detail: string): ProductsResult {
  return { kind: 'missing-fixture', reason, evidence: 'BLOCKED_MISSING_FIXTURE', detail, query: structuredClone(query) };
}

function sourceRows(): ProductRow[] {
  if (!fixture || !contract) throw new Error('S03 source fixture/contract is missing');
  if (fixture.record_rows_included !== fixture.record_rows.length || fixture.aggregate_total !== 326) throw new Error('S03 source completeness changed');
  const rows = fixture.record_rows.map((row): ProductRow => {
    const required = ['Mã sản phẩm', 'Tên sản phẩm', 'Nhóm hàng', 'Số SKU', 'ĐVT', 'Trạng thái', 'Cập nhật'];
    if (required.some(field => typeof row[field] !== 'string')) throw new Error('S03 source field is missing or is not a string');
    if (!['Đang hoạt động', 'Ngừng sử dụng'].includes(row['Trạng thái'])) throw new Error('S03 status mapping is not source-backed');
    const skuCount = Number(row['Số SKU']);
    if (!Number.isSafeInteger(skuCount) || skuCount < 0) throw new Error('S03 SKU count is not numeric source data');
    return {
      key: row['Mã sản phẩm'], code: row['Mã sản phẩm'], name: row['Tên sản phẩm'], group: row['Nhóm hàng'],
      skuCount, unit: row['ĐVT'], status: row['Trạng thái'] === 'Đang hoạt động' ? 'active' : 'inactive',
      statusLabel: row['Trạng thái'], updatedAt: row['Cập nhật'],
    };
  });
  if (rows.length !== 7 || new Set(rows.map(row => row.key)).size !== rows.length) throw new Error('S03 fixture row identity is incomplete or duplicated');
  return rows;
}

function sourceSummary(): ProductsModel['summary'] {
  if (!fixture || !contract) throw new Error('S03 source fixture/contract is missing');
  const summary = fixture.summary;
  if (summary['Đang hoạt động'] + summary['Ngừng sử dụng'] !== summary.products_total || summary.products_total !== fixture.aggregate_total) {
    throw new Error('S03 source summary totals do not reconcile');
  }
  return {
    productsTotal: summary.products_total,
    linkedSkus: summary.linked_skus,
    active: summary['Đang hoạt động'], inactive: summary['Ngừng sử dụng'],
    activePercentage: summary.percentages_display[0], inactivePercentage: summary.percentages_display[1], scope: 'catalogue',
  };
}

export interface ProductsQaScenario {
  id: 'S03_QA_60_2026-10-10';
  rows: readonly ProductRow[];
}

function validateQa(scenario: ProductsQaScenario, reference: ProductRow[]): ProductRow[] {
  const rows = structuredClone([...scenario.rows]);
  const groups = new Set(reference.map(row => row.group)), units = new Set(reference.map(row => row.unit));
  if (scenario.id !== 'S03_QA_60_2026-10-10' || rows.length !== 60 || new Set(rows.map(row => row.key)).size !== 60
    || new Set(rows.map(row => row.code)).size !== 60) throw new Error('S03 QA scenario requires 60 unique records');
  for (const row of rows) {
    if (!row.key || !row.code || !row.name || !groups.has(row.group) || !units.has(row.unit)
      || !Number.isSafeInteger(row.skuCount) || row.skuCount < 0 || !['active', 'inactive'].includes(row.status)
      || row.statusLabel !== (row.status === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng')) {
      throw new Error('S03 QA scenario is outside the current schema or enum');
    }
    productsUpdatedValue(row.updatedAt);
  }
  return rows;
}

function readyModel(query: ProductsQuery, allRows: ProductRow[], qa: boolean): ProductsResult {
  if (!fixture || !contract) throw new Error('S03 source fixture/contract is missing');
  const groups = [...new Set(allRows.map(row => row.group))];
  const units = [...new Set(allRows.map(row => row.unit))];
  if ((query.group !== 'all' && !groups.includes(query.group)) || (query.unit !== 'all' && !units.includes(query.unit))) {
    return block(query, 'INVALID_QUERY', 'S03 filter option is outside the confirmed detail scope');
  }
  const result = queryTable({
    // Complete only within the explicitly confirmed seven-row/QA60 scope, never all 326 products.
    source: { rows: allRows, completeness: 'complete', scope: 'detail', total: allRows.length, aggregateTotal: fixture.aggregate_total }, query,
    filter: row => (query.group === 'all' || row.group === query.group)
      && (query.unit === 'all' || row.unit === query.unit) && (query.status === 'all' || row.status === query.status),
    search: screenSearch(SCREEN_FOUNDATION.S03, query.search),
    sort: screenSort(SCREEN_FOUNDATION.S03, query.sortKey, query.sort),
    stableId: row => row.key,
  });
  if (result.kind !== 'ready') return block(query, result.reason === 'PAGE_OUT_OF_RANGE' ? result.reason : 'INVALID_QUERY', result.detail);
  return {
    kind: 'ready',
    model: {
      query, rows: result.rows, summary: sourceSummary(), pagination: { ...result.pagination, pageSizeOptions: PAGE_SIZE_OPTIONS },
      filterOptions: { groups, units }, detailCompleteness: fixture.detail_completeness,
      interactionScope: { kind: qa ? 'qa60' : 'source-detail', recordCount: allRows.length, completeness: 'COMPLETE_WITHIN_CONFIRMED_SCOPE' },
      source: {
        id: qa ? 'S03_QA_60_2026-10-10' : 'S03-source-detail', scope: 'detail', completeness: 'complete', detailTotal: allRows.length,
        contractId: contractSource.package_id, fixtureVersion: qa ? 'S03_QA_60_2026-10-10' : 'HN_WMS_5_MAN_UI_TINH_r2_2026-10-08',
        referenceRevision: contract.visual.implementation_reference_revision, referenceSnapshot: fixture.source_snapshot,
        provenance: qa ? 'QA_SYNTHETIC' : 'SOURCE_FIXTURE', evidence: qa ? 'QA_SCENARIO' : 'SOURCE_FIXTURE', fixtureRecordCount: allRows.length,
        aggregateTotal: fixture.aggregate_total, isLiveData: false, productionMatchVerified: false,
        backendMapping: null, enumMapping: null, permissionKeys: null, endpoint: null,
        skuRelationBinding: null, searchMatch: 'folded-includes', sortKey: query.sortKey, sortDirection: query.sort, filterOptionsComplete: false,
        filterOptionsScope: 'ALL_DETAIL_ROWS',
      },
    },
  };
}

/** Runtime defaults to the exact seven source rows. QA injection is used only by a separate DEV harness. */
export function createProductsFixtureAdapter(qaScenario?: ProductsQaScenario): ProductsDataAdapter {
  const qaRows = qaScenario ? validateQa(qaScenario, sourceRows()) : null;
  return {
    async read(input = DEFAULT_PRODUCTS_QUERY, scenario = 'default'): Promise<ProductsResult> {
      const query = structuredClone(input);
      if (scenario !== 'default') return missing(query, 'STATE_NOT_SUPPLIED', 'Only S03 Default is supplied; another state requires its approved source.');
      if (typeof query.search !== 'string' || typeof query.group !== 'string' || typeof query.unit !== 'string' || !['all', 'active', 'inactive'].includes(query.status)) {
        return block(query, 'INVALID_QUERY', 'The query is outside the source-backed S03 frontend values.');
      }
      if ((query.sortKey !== null && !PRODUCTS_RUNTIME_POLICY.sortKeys.includes(query.sortKey))
        || ![null, 'asc', 'desc'].includes(query.sort) || (query.sortKey === null) !== (query.sort === null)) {
        return block(query, 'INVALID_QUERY', 'S03 sort must include a supported field and direction, or both null');
      }
      return readyModel(query, qaRows ? structuredClone(qaRows) : sourceRows(), Boolean(qaRows));
    },
  };
}
