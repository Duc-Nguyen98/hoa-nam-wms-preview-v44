import type { ListDataAdapter, ListModel } from '../shared/list-runtime';
import { DEFAULT_PAGE_SIZE } from '../shared/table-query';

/** Frontend-only shape. No backend enum, ID, permission or DTO is implied. */
export interface WarrantyQuery {
  search: string;
  status: string;
  identity: string;
  due: string;
  sort: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
// Latest Owner/Foundation defaults supersede the older first-page PNG metadata.
export const DEFAULT_WARRANTY_QUERY: Readonly<WarrantyQuery> = Object.freeze({
  search: '', status: 'all', identity: 'all', due: 'all', sort: 'desc', page: 1, pageSize: DEFAULT_PAGE_SIZE,
});
export interface WarrantyRow {
  caseCode: string;
  identity: string;
  product: string;
  maskedCustomer: string;
  receiptAndDueDate: string;
  statusLabel: string;
  ageAtSnapshot: string;
  reviewAction: string;
}
export interface WarrantySummary {
  snapshot: string; total: number; completed: number; incomplete: number;
  overdueWithinIncomplete: number; progressPercent: number;
}
export type WarrantyModel = ListModel<WarrantyRow, WarrantyQuery, WarrantySummary>;
export type WarrantyAdapter = ListDataAdapter<WarrantyRow, WarrantyQuery, WarrantySummary>;
export const WARRANTY_BLOCKERS = {
  source: 'BLOCKED_MISSING_FIXTURE',
  options: 'REQUIRES_OWNER_CONFIRMATION',
  detail: 'DETAIL_FLOW_NOT_SUPPLIED',
} as const;
