import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** S17/REV-00 frontend view model. No backend ID, DTO or write permission is implied. */
export const REVERSAL_STATUS_LABELS = {
  DRAFT: 'Nháp', POSTED: 'Đã ghi sổ phiếu đảo', CANCELLED: 'Đã hủy',
} as const;
export type ReversalStatus = keyof typeof REVERSAL_STATUS_LABELS;
export interface ReversalRow {
  /** Internal render identity, not a backend/business ID. */
  renderKey: string;
  code: string;
  originalDocument: string;
  totalQuantity: number | null;
  status: ReversalStatus;
  reason: string;
  reasonDetail: string;
  /** Source wall-clock text, NOT an offset-qualified API timestamp. */
  createdAt: string | null;
  createdBy: string | null;
}
export const REVERSAL_SORT_KEYS = ['code', 'originalDocument', 'totalQuantity', 'status', 'reason', 'createdAt', 'createdBy'] as const;
export type ReversalSortKey = typeof REVERSAL_SORT_KEYS[number];
export interface ReversalQuery {
  search: string;
  status: ReversalStatus | '';
  page: number;
  pageSize: number;
  sortKey: ReversalSortKey | '';
  sortDirection: 'asc' | 'desc';
}
export const DEFAULT_REVERSAL_QUERY: Readonly<ReversalQuery> = Object.freeze({
  search: '', status: '', page: 1, pageSize: 10, sortKey: '', sortDirection: 'asc',
});
export interface ReversalScope { detailRows: number; scopeLabel: string }
export type ReversalModel = ListModel<ReversalRow, ReversalQuery, ReversalScope>;
export type ReversalAdapter = ListDataAdapter<ReversalRow, ReversalQuery, ReversalScope>;
export function reversalDateLabel(value: string | null): string {
  return value ? value.replace(/^(\d{2})-(\d{2})-(\d{4})/, '$1/$2/$3') : '—';
}
/** Ordering projection only; preserves 07:00 and does not assign a backend offset. */
export function reversalDateSortValue(value: string | null): string | null {
  const match = value?.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}` : null;
}
