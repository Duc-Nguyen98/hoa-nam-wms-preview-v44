import sourceFixture from '../fixtures/DESIGN_FIXTURE_SNAPSHOT.json';
import sourceContracts from '../fixtures/SCREEN_CONTRACTS.seed.json';
import type {
  ApiBinding, JsonValue, PreviewDataAdapter, Provenance, QueryIntent,
  ScreenId, SetupHealth, SnapshotResult, SourceRow,
} from '../../contracts/preview';

interface SourceFixture {
  screen_id: ScreenId;
  source_snapshot: string;
  provenance: Provenance;
  summary: Record<string, JsonValue>;
  period?: { from: string; to: string };
  chart_rows_as_source?: SourceRow[];
  record_rows: SourceRow[];
  record_rows_included: number;
  aggregate_total?: number;
  aggregate_document_count?: number;
  detail_completeness: string;
}

export const UNCONFIGURED_API_BINDING: ApiBinding = Object.freeze({
  status: 'NOT_CONFIGURED', applicationRoute: null, endpoints: null,
  dtoMapping: null, enumMapping: null, permissionKeys: null,
});

// Raw source copies remain private to the adapter; every response is a detached copy.
const fixtures = sourceFixture.screens as unknown as SourceFixture[];
const fixtureVersion = 'HN_WMS_5_MAN_UI_TINH_r2_2026-10-08';

function findSources(screenId: ScreenId) {
  const fixture = fixtures.find((item) => item.screen_id === screenId);
  const contract = sourceContracts.screens.find((item) => item.screen_id === screenId);
  if (!fixture || !contract) throw new Error(`Unknown preview screen: ${screenId}`);
  if (fixture.record_rows_included !== fixture.record_rows.length) {
    throw new Error(`Source fixture row-count mismatch: ${screenId}`);
  }
  return { fixture, contract };
}

function missing(screenId: ScreenId, scenario: string, reason: 'SCENARIO_NOT_SUPPLIED' | 'PAGE_NOT_SUPPLIED' | 'QUERY_NOT_VERIFIED', detail: string): SnapshotResult {
  return { kind: 'missing-fixture', screenId, scenario, reason, evidence: 'BLOCKED_MISSING_FIXTURE', detail };
}

/** Async boundary, with no synthetic delay, write, network request, or storage side effect. */
export function createFixtureAdapter(): PreviewDataAdapter {
  async function readSnapshot(screenId: ScreenId, scenario = 'default'): Promise<SnapshotResult> {
    const { fixture, contract } = findSources(screenId);
    if (scenario !== 'default') {
      return missing(screenId, scenario, 'SCENARIO_NOT_SUPPLIED', 'No source fixture is supplied for this review scenario. This is not an empty result.');
    }
    return structuredClone({
      kind: 'snapshot',
      viewModel: {
        screenId,
        rows: fixture.record_rows,
        chartRows: fixture.chart_rows_as_source ?? [],
        summary: fixture.summary,
        period: fixture.period ?? null,
        counts: {
          designTotal: fixture.aggregate_total ?? fixture.aggregate_document_count ?? null,
          filteredTotal: null,
          includedRecordCount: fixture.record_rows_included,
          visibleRowCount: null,
        },
        pagination: {
          designPage: contract.query.pagination.page,
          designPageSize: contract.query.pagination.page_size,
          designPageCount: contract.query.pagination.page_count,
          loadedPage: null,
          pageSizeOptions: null,
        },
        source: {
          contractId: sourceContracts.package_id,
          fixtureVersion,
          referenceSnapshot: fixture.source_snapshot,
          referenceRevision: contract.visual.implementation_reference_revision,
          provenance: fixture.provenance,
          detailCompleteness: fixture.detail_completeness,
          evidence: 'VISUAL_SNAPSHOT_ONLY',
          productionMatchVerified: false,
        },
      },
    } satisfies SnapshotResult);
  }

  async function readQuery(screenId: ScreenId, query: QueryIntent, scenario = 'default'): Promise<SnapshotResult> {
    const { contract } = findSources(screenId);
    if (scenario !== 'default') return readSnapshot(screenId, scenario);
    if (query.page !== undefined && query.page !== contract.query.pagination.page) {
      return missing(screenId, scenario, 'PAGE_NOT_SUPPLIED', 'No verified page fixture is supplied; the adapter must not repeat the snapshot rows.');
    }
    if (query.search !== undefined || query.filters !== undefined || query.sort !== undefined ||
        (query.pageSize !== undefined && query.pageSize !== contract.query.pagination.page_size)) {
      return missing(screenId, scenario, 'QUERY_NOT_VERIFIED', 'Search, filter, sort, or page-size case needs a confirmed interpretation and a corresponding fixture.');
    }
    return readSnapshot(screenId, scenario);
  }

  return {
    kind: 'fixture',
    binding: UNCONFIGURED_API_BINDING,
    async setupHealth(): Promise<SetupHealth> {
      return {
        contractId: sourceContracts.package_id,
        mode: 'fixture',
        apiConfigured: false,
        screens: sourceContracts.screens.map((contract) => {
          const { fixture } = findSources(contract.screen_id as ScreenId);
          return {
            screenId: fixture.screen_id,
            title: contract.title,
            referenceRevision: contract.visual.implementation_reference_revision,
            recordCount: fixture.record_rows_included,
            designTotal: fixture.aggregate_total ?? fixture.aggregate_document_count ?? null,
            provenance: fixture.provenance,
            detailCompleteness: fixture.detail_completeness,
            implementationStatus: 'NOT_STARTED',
          };
        }),
      };
    },
    readSnapshot,
    readQuery,
  };
}
