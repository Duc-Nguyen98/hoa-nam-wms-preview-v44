import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** Frontend Default snapshot contract, not a backend DTO or permission grant. */
export interface PutawayOrdersQuery { search: string; status: string; sourceReceipt: string; page: number; pageSize: number }
export const DEFAULT_PUTAWAY_ORDERS_QUERY: Readonly<PutawayOrdersQuery> = Object.freeze({ search: '', status: '', sourceReceipt: '', page: 1, pageSize: 10 });
export const PUTAWAY_ORDER_SEARCH_FIELDS = ['orderCode', 'boxCode', 'sku'] as const;
export interface PutawayOrderRow { orderCode: string; boxCode: string; sku: string; sourceReceipt: string; destinationTray: string; quantity: number; status: string; updatedAt: string; version: string; action: string }
export interface PutawayOrdersSummary { totalOrders: number; confirmedOrders: number; draftOrders: number; cancelledOrders: number; relatedQueueBadge: number }
export type PutawayOrdersModel = ListModel<PutawayOrderRow, PutawayOrdersQuery, PutawayOrdersSummary>;
export type PutawayOrdersAdapter = ListDataAdapter<PutawayOrderRow, PutawayOrdersQuery, PutawayOrdersSummary>;
