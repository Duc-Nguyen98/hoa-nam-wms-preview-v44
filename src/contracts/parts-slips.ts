import type { ListDataAdapter, ListModel } from '../shared/list-runtime';
import { DEFAULT_PAGE_SIZE } from '../shared/table-query';

/** Frontend preview contract; labels/keys are not backend DTO or permission enums. */
export interface PartsQuery {
  search: string; status: string; sort: 'asc' | 'desc'; page: number; pageSize: number;
}
export const DEFAULT_PARTS_QUERY: Readonly<PartsQuery> = Object.freeze({
  search: '', status: 'all', sort: 'desc', page: 1, pageSize: DEFAULT_PAGE_SIZE,
});
export interface PartsRow {
  slipCode: string; warrantyCaseCode: string; componentSummary: string;
  quantitySummary: string; trackingLabel: string; slipStatus: string; updatedAtLabel: string;
}
export interface PartsSummary {
  snapshot: string; total: number; exported: number; draft: number;
  scanning: number; cancelled: number; exportedPercent: number;
}
export type PartsModel = ListModel<PartsRow, PartsQuery, PartsSummary>;
export type PartsAdapter = ListDataAdapter<PartsRow, PartsQuery, PartsSummary>;
