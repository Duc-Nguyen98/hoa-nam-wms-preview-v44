import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** Frontend-only S11 shape. Backend DTO, endpoint and permissions stay unresolved. */
export interface TraysQuery {
  search: string;
  page: number;
  pageSize: number;
}

export const DEFAULT_TRAYS_QUERY: Readonly<TraysQuery> = Object.freeze({
  search: '',
  page: 1,
  pageSize: 10,
});

export interface TrayRow {
  trayCode: string;
  boxCount: number;
  skuCount: number;
  latestPackingOrder: string | null;
  updatedAtLabel: string;
}

export interface TraysSummary {
  trayCount: number;
  boxCount: number;
}

export type TraysModel = ListModel<TrayRow, TraysQuery, TraysSummary>;
export type TraysAdapter = ListDataAdapter<TrayRow, TraysQuery, TraysSummary>;
