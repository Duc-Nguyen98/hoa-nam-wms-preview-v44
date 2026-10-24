import fixtureSource from '../fixtures/DESIGN_FIXTURE_SNAPSHOT.json';
import contractSource from '../fixtures/SCREEN_CONTRACTS.seed.json';
import { queryDefectsRows } from './defects-query';
import {
  DEFAULT_DEFECTS_QUERY,
  DEFECTS_PAGE_SIZE_OPTIONS,
  type DefectRow, type DefectsBlocker, type DefectsDataAdapter, type DefectsPolicy,
  type DefectsQuery, type DefectsResult, type DefectsReviewScenario,
} from '../../contracts/defects';

interface DefectsSource {
  screen_id: 'S02';
  source_snapshot: string;
  provenance: 'SOURCE_FIXTURE';
  summary: { total: number; 'Đang sử dụng': number; 'Ngừng sử dụng': number; percentages_display: string[] };
  record_rows: Record<string, string>[];
  record_rows_included: number;
  aggregate_total: number;
  detail_completeness: string;
  is_live_data: false;
  production_match_99_percent_verified: false;
}

const fixture = fixtureSource.screens.find((screen) => screen.screen_id === 'S02') as unknown as DefectsSource | undefined;
const contract = contractSource.screens.find((screen) => screen.screen_id === 'S02');

function block(
  query: DefectsQuery,
  reason: DefectsBlocker,
  detail: string,
  status?: 401 | 403 | 404,
  resource?: 'route' | 'record',
): DefectsResult {
  return {
    kind: 'blocked', reason, detail, query: structuredClone(query),
    ...(status === undefined ? {} : { status }),
    ...(resource === undefined ? {} : { resource }),
  };
}

/** Accept short aliases in the review harness while keeping one canonical state id. */
function normalizeReviewScenario(scenario: string): DefectsReviewScenario | null {
  if (scenario === 'default' || scenario === 'empty-records' || scenario === 'load-error' ||
      scenario === 'unauthorized-401' || scenario === 'forbidden-403' || scenario === 'not-found-404') return scenario;
  if (scenario === '401' || scenario === 'unauthorized') return 'unauthorized-401';
  if (scenario === '403' || scenario === 'forbidden') return 'forbidden-403';
  if (scenario === '404' || scenario === 'not-found') return 'not-found-404';
  return null;
}

function sourceRows(): DefectRow[] {
  if (!fixture || !contract) throw new Error('S02 source fixture/contract is missing');
  if (fixture.record_rows_included !== fixture.record_rows.length || fixture.aggregate_total !== fixture.record_rows.length) throw new Error('S02 source is incomplete; no filtered total may be inferred');
  const rows = fixture.record_rows.map((row): DefectRow => {
    const fields = ['STT', 'Mã lỗi', 'Tên lỗi / bệnh', 'Mô tả', 'Trạng thái'];
    if (fields.some((field) => typeof row[field] !== 'string')) throw new Error('S02 source field is missing or is not a string');
    if (!['Đang sử dụng', 'Ngừng sử dụng'].includes(row['Trạng thái'])) throw new Error('S02 source status has no confirmed preview mapping');
    return {
      key: row['Mã lỗi'], ordinal: row['STT'], code: row['Mã lỗi'], name: row['Tên lỗi / bệnh'],
      description: row['Mô tả'], status: row['Trạng thái'] === 'Đang sử dụng' ? 'active' : 'inactive', statusLabel: row['Trạng thái'],
    };
  });
  if (new Set(rows.map((row) => row.key)).size !== rows.length ||
      fixture.summary.total !== rows.length ||
      fixture.summary['Đang sử dụng'] !== rows.filter((row) => row.status === 'active').length ||
      fixture.summary['Ngừng sử dụng'] !== rows.filter((row) => row.status === 'inactive').length) {
    throw new Error('S02 source record identity or catalogue summary mismatch');
  }
  return rows;
}

function emptyReviewModel(query: DefectsQuery, searchMatch: 'folded-includes' | null): DefectsResult {
  if (!fixture || !contract) throw new Error('S02 source fixture/contract is missing');
  const checked = queryDefectsRows([], query, { searchMatch }, DEFECTS_PAGE_SIZE_OPTIONS);
  if (checked.kind === 'blocked') {
    if (checked.reason === 'INCOMPLETE_SOURCE') throw new Error(checked.detail);
    return block(query, checked.reason, checked.detail);
  }
  return {
    kind: 'ready',
    model: {
      query: structuredClone(query),
      rows: [],
      summary: { total: 0, active: 0, inactive: 0, activePercentage: '0%', inactivePercentage: '0%', scope: 'catalogue' },
      pagination: { ...checked.pagination, pageSizeOptions: [...DEFECTS_PAGE_SIZE_OPTIONS] },
      emptyReason: 'no-records',
      source: {
        contractId: contractSource.package_id,
        fixtureVersion: 'S02_REVIEW_EMPTY_RECORDS_2026-10-17',
        referenceRevision: contract.visual.implementation_reference_revision,
        referenceSnapshot: fixture.source_snapshot,
        provenance: 'QA_SYNTHETIC', evidence: 'INTERACTIVE_FIXTURE_VERIFIED',
        fixtureRecordCount: 0, detailCompleteness: 'EXPLICIT_REVIEW_EMPTY_RECORDS',
        isLiveData: false, productionMatchVerified: false, searchMatch,
        sortKey: query.sortKey, sortDirection: query.sort,
        backendMapping: null, enumMapping: null, permissionKeys: null, endpoint: null,
      },
    },
  };
}

/** Reads only the existing exact source fixture; no API, storage, writes or artificial delay. */
export function createDefectsFixtureAdapter(policy: DefectsPolicy = {}): DefectsDataAdapter {
  const searchMatch = policy.searchMatch === undefined ? 'folded-includes' : policy.searchMatch;
  return {
    async read(input = DEFAULT_DEFECTS_QUERY, scenario = 'default'): Promise<DefectsResult> {
      const query = structuredClone(input);
      const reviewScenario = normalizeReviewScenario(scenario);
      if (reviewScenario === 'empty-records') return emptyReviewModel(query, searchMatch);
      if (reviewScenario === 'load-error') return block(query, 'LOAD_ERROR', 'S02 review fixture: deterministic read failure. Retry is expected to remain available.');
      if (reviewScenario === 'unauthorized-401') return block(query, 'UNAUTHORIZED', 'S02 review fixture: authentication is required (HTTP 401).', 401, 'route');
      if (reviewScenario === 'forbidden-403') return block(query, 'FORBIDDEN', 'S02 review fixture: the current user is not allowed to access this resource (HTTP 403).', 403, 'route');
      if (reviewScenario === 'not-found-404') return block(query, 'NOT_FOUND', 'S02 review fixture: the requested resource was not found (HTTP 404).', 404, 'route');
      if (reviewScenario !== 'default') return block(query, 'STATE_NOT_SUPPLIED', 'Only S02 Default is supplied; another state requires its approved source.');
      const allRows = sourceRows();
      if (!fixture || !contract) throw new Error('S02 source fixture/contract is missing');
      const result = queryDefectsRows(allRows, query, { searchMatch }, DEFECTS_PAGE_SIZE_OPTIONS);
      if (result.kind === 'blocked') {
        if (result.reason === 'INCOMPLETE_SOURCE') throw new Error(result.detail);
        return block(query, result.reason, result.detail);
      }
      const { rows, pagination } = result;
      return {
        kind: 'ready',
        model: {
          query, rows,
          summary: {
            total: fixture.summary.total, active: fixture.summary['Đang sử dụng'], inactive: fixture.summary['Ngừng sử dụng'],
            activePercentage: fixture.summary.percentages_display[0], inactivePercentage: fixture.summary.percentages_display[1], scope: 'catalogue',
          },
          pagination: { ...pagination, pageSizeOptions: [...pagination.pageSizeOptions] },
          emptyReason: allRows.length === 0 ? 'no-records' : rows.length === 0 ? 'no-matches' : null,
          source: {
            contractId: contractSource.package_id, fixtureVersion: 'HN_WMS_5_MAN_UI_TINH_r2_2026-10-08',
            referenceRevision: contract.visual.implementation_reference_revision,
            referenceSnapshot: fixture.source_snapshot, provenance: 'SOURCE_FIXTURE', evidence: 'INTERACTIVE_FIXTURE_VERIFIED',
            fixtureRecordCount: fixture.record_rows_included, detailCompleteness: fixture.detail_completeness,
            isLiveData: false, productionMatchVerified: false, searchMatch,
            sortKey: query.sortKey, sortDirection: query.sort, backendMapping: null, enumMapping: null, permissionKeys: null, endpoint: null,
          },
        },
      };
    },
  };
}
