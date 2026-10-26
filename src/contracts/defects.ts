import { updateTableQuery } from '../shared/table-query';

/** S02 frontend preview contracts, not backend DTOs, identifiers, enums or permissions. */
export type DefectsSortKey = 'code' | 'name' | 'description' | 'status';
export interface DefectsQuery {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sort: 'asc' | 'desc' | null;
  sortKey: DefectsSortKey | null;
  page: number;
  pageSize: number;
}

/** Owner's S02 preview decision, 2026-10-10. Capacity never implies extra fixture rows. */
export const DEFECTS_PAGE_SIZE_OPTIONS: readonly number[] = Object.freeze([15]);

export const DEFAULT_DEFECTS_QUERY: DefectsQuery = Object.freeze({
  search: '', status: 'all', sort: null, sortKey: null, page: 1, pageSize: 15,
});

/**
 * Explicit review-only states. These names are consumed by the local review
 * harness and are never sent to a production API. Any other scenario remains
 * an unavailable fixture and is returned as STATE_NOT_SUPPLIED.
 */
export type DefectsReviewScenario =
  | 'default'
  | 'empty-records'
  | 'load-error'
  | 'unauthorized-401'
  | 'forbidden-403'
  | 'not-found-404'
  // Short aliases are retained for capture URLs and older review scripts.
  | '401' | '403' | '404' | 'unauthorized' | 'forbidden' | 'not-found';

export interface DefectsPolicy {
  /** Owner confirmed normalized code/name substring matching on 2026-10-10. */
  searchMatch?: 'folded-includes' | null;
}

export interface DefectRow {
  /** Stable render key from the source code, not a backend record ID. */
  key: string;
  ordinal: string;
  code: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  statusLabel: string;
}

export interface DefectsModel {
  query: DefectsQuery;
  rows: DefectRow[];
  /** Snapshot-owned command coordinates. Render keys never imply persisted IDs. */
  commandContext?: DefectsCommandContext;
  summary: {
    total: number;
    active: number;
    inactive: number;
    activePercentage: string;
    inactivePercentage: string;
    scope: 'catalogue';
  };
  pagination: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
    unfilteredTotal: number;
    start: number;
    end: number;
    pageSizeOptions: readonly number[];
  };
  emptyReason: 'no-records' | 'no-matches' | null;
  source: {
    contractId: string;
    fixtureVersion: string;
    referenceRevision: string;
    referenceSnapshot: string;
    provenance: 'SOURCE_FIXTURE' | 'QA_SYNTHETIC';
    evidence: 'INTERACTIVE_FIXTURE_VERIFIED';
    fixtureRecordCount: number;
    detailCompleteness: string;
    isLiveData: false;
    productionMatchVerified: false;
    searchMatch: 'folded-includes' | null;
    sortKey: DefectsSortKey | null;
    sortDirection: 'asc' | 'desc' | null;
    backendMapping: null;
    enumMapping: null;
    permissionKeys: null;
    endpoint: null;
  };
}

export type DefectsBlocker = 'STATE_NOT_SUPPLIED' | 'SEARCH_SEMANTICS_UNCONFIRMED'
  | 'SORT_UNCONFIRMED' | 'PAGE_SIZE_UNCONFIRMED' | 'PAGE_OUT_OF_RANGE' | 'INVALID_QUERY'
  | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'LOAD_ERROR';

export type DefectsResult =
  | { kind: 'ready'; model: DefectsModel }
  | { kind: 'blocked'; reason: DefectsBlocker; detail: string; query: DefectsQuery; status?: 401 | 403 | 404; resource?: 'route' | 'record' };

export interface DefectsDataAdapter {
  read(query?: DefectsQuery, scenario?: DefectsReviewScenario | string, context?: { signal?: AbortSignal }): Promise<DefectsResult>;
}

export type DefectDraft = Pick<DefectRow, 'code' | 'name' | 'description' | 'status'>;
export type DefectsFormErrors = Partial<Record<keyof DefectDraft, string>>;
export type DefectsCommandOperation = 'create' | 'update';
export type DefectsPolicyClause = 'P01' | 'P02' | 'P03';
export interface DefectsCommandTarget { entityId: string; version: number }
export interface DefectsCommandContext {
  epoch: string;
  snapshotRevision: number;
  records: Record<string, DefectsCommandTarget>;
}
/** Technical transport coordinates only; they confer no actor capability or domain policy. */
export interface DefectsCommandRequest {
  command: 'defects.create' | 'defects.update';
  commandId: string;
  epoch: string;
  entityId?: string;
  expectedVersion?: number;
  payload: unknown;
}
export interface DefectsCommandReceipt {
  mode: 'MOCK'; commandId: string; epoch: string; command: DefectsCommandRequest['command'];
  actorKey: string; entityId: string; previousVersion: number | null; version: number;
  changed: boolean; committedAt: string; snapshotRevision: number;
  record: { id: string; kind: 'defect'; version: number; data: DefectRow };
}
export interface DefectsCommandOutcome { receipt: DefectsCommandReceipt; replayed: boolean }
/** Host-owned journal: actor identity and request integrity are never supplied by the screen. */
export type DefectsCommandRecoveryResult =
  | { kind: 'empty' }
  | { kind: 'pending'; request: DefectsCommandRequest; code?: string }
  | { kind: 'committed'; request: DefectsCommandRequest; outcome: DefectsCommandOutcome }
  | { kind: 'blocked'; code: string };
export interface DefectsCommandRecovery {
  /** Restore never dispatches a mutation. */
  restore(): Promise<DefectsCommandRecoveryResult>;
  /** Retry only the immutable host-owned original request, with a freshly resolved actor. */
  retry(): Promise<DefectsCommandRecoveryResult>;
  /** Only after validated commit, successful canonical read and explicit continuation. */
  acknowledge(commandId: string): Promise<void>;
}
export interface DefectsCommandAdapter {
  execute(request: Readonly<DefectsCommandRequest>, context?: { signal?: AbortSignal }): Promise<DefectsCommandOutcome>;
  /** Optional for older isolated test adapters; Main supplies the durable host seam. */
  recovery?: DefectsCommandRecovery;
}

/** Local field rules already sourced by S02; validation never transforms accepted strings. */
export function validateDefectDraft(draft: DefectDraft): DefectsFormErrors {
  const errors: DefectsFormErrors = {};
  if (typeof draft.code !== 'string' || !draft.code.trim()) errors.code = 'Mã lỗi là bắt buộc.';
  if (typeof draft.name !== 'string' || !draft.name.trim()) errors.name = 'Tên lỗi / bệnh là bắt buộc.';
  if (typeof draft.description !== 'string') errors.description = 'Mô tả phải là chuỗi.';
  if (draft.status !== 'active' && draft.status !== 'inactive') errors.status = 'Trạng thái không hợp lệ.';
  return errors;
}

/** Immediate reads reset pagination on every filter, search, sort or capacity change. */
export function updateDefectsQuery(current: DefectsQuery, patch: Partial<DefectsQuery>): DefectsQuery {
  return updateTableQuery(current, patch, { filterKeys: ['status'], resetPageOnSort: true, sortKeys: ['sort', 'sortKey'] });
}

/** Resets the S02 table only; there are no global filters or business side effects. */
export function resetDefectsTableQuery(): DefectsQuery {
  return { ...DEFAULT_DEFECTS_QUERY };
}
