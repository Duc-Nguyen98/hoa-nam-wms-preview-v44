/** Frontend preview contracts. These are not backend DTOs, enums, or permissions. */
export const SCREEN_IDS = ['S01', 'S02', 'S03', 'S04', 'S05'] as const;
export type ScreenId = (typeof SCREEN_IDS)[number];
export type Provenance = 'CONFIRMED_DECISION' | 'OBSERVED_PREVIEW' | 'SOURCE_FIXTURE' | 'PROPOSED_FIXTURE' | 'UNKNOWN' | 'CONFLICT';
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type SourceRow = Readonly<Record<string, string>>;

export interface ApiBinding {
  readonly status: 'NOT_CONFIGURED';
  readonly applicationRoute: null;
  readonly endpoints: null;
  readonly dtoMapping: null;
  readonly enumMapping: null;
  readonly permissionKeys: null;
}

export interface ScreenHealth {
  readonly screenId: ScreenId;
  readonly title: string;
  readonly referenceRevision: string;
  readonly recordCount: number;
  readonly designTotal: number | null;
  readonly provenance: Provenance;
  readonly detailCompleteness: string;
  readonly implementationStatus: 'NOT_STARTED';
}

export interface SetupHealth {
  readonly contractId: string;
  readonly mode: 'fixture';
  readonly apiConfigured: false;
  readonly screens: readonly ScreenHealth[];
}

export interface SnapshotViewModel {
  readonly screenId: ScreenId;
  readonly rows: readonly SourceRow[];
  readonly chartRows: readonly SourceRow[];
  readonly summary: Readonly<Record<string, JsonValue>>;
  readonly period: { readonly from: string; readonly to: string } | null;
  readonly counts: {
    readonly designTotal: number | null;
    readonly filteredTotal: null;
    readonly includedRecordCount: number;
    readonly visibleRowCount: null;
  };
  /** Observed design metadata, not a verified loaded page or API pagination. */
  readonly pagination: {
    readonly designPage: number;
    readonly designPageSize: number;
    readonly designPageCount: number;
    readonly loadedPage: null;
    readonly pageSizeOptions: null;
  };
  readonly source: {
    readonly contractId: string;
    readonly fixtureVersion: string;
    readonly referenceSnapshot: string;
    readonly referenceRevision: string;
    readonly provenance: Provenance;
    readonly detailCompleteness: string;
    readonly evidence: 'VISUAL_SNAPSHOT_ONLY';
    readonly productionMatchVerified: false;
  };
}

export type MissingFixtureReason = 'SCENARIO_NOT_SUPPLIED' | 'PAGE_NOT_SUPPLIED' | 'QUERY_NOT_VERIFIED';
export type SnapshotResult =
  | { readonly kind: 'snapshot'; readonly viewModel: SnapshotViewModel }
  // Reserved for a future source-verified zero-result case; the current fixture never emits it.
  | {
      readonly kind: 'empty';
      readonly screenId: ScreenId;
      readonly scope: 'dataset' | 'query';
      readonly confirmedCount: 0;
      readonly sourceReference: string;
      readonly provenance: Provenance;
    }
  | {
      readonly kind: 'missing-fixture';
      readonly screenId: ScreenId;
      readonly scenario: string;
      readonly reason: MissingFixtureReason;
      readonly evidence: 'BLOCKED_MISSING_FIXTURE';
      readonly detail: string;
    }
  | {
      readonly kind: 'not-configured';
      readonly screenId: ScreenId;
      readonly binding: ApiBinding;
    };

/** A query intent reserves the adapter boundary without choosing search/sort semantics. */
export interface QueryIntent {
  readonly search?: string;
  readonly filters?: Readonly<Record<string, string>>;
  readonly sort?: { readonly field: string; readonly direction: 'ascending' | 'descending' };
  readonly page?: number;
  readonly pageSize?: number;
}

export interface PreviewDataAdapter {
  readonly kind: 'fixture' | 'api-unconfigured';
  readonly binding: ApiBinding;
  setupHealth(): Promise<SetupHealth>;
  readSnapshot(screenId: ScreenId, scenario?: string): Promise<SnapshotResult>;
  readQuery(screenId: ScreenId, query: QueryIntent, scenario?: string): Promise<SnapshotResult>;
}
