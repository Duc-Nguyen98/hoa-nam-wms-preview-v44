import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** S13 preview contract only; endpoint/DTO/permissions remain unconfirmed. */
export interface PutawayQueueQuery { search: string; status: string; receiptCode: string; page: number; pageSize: number }
export const DEFAULT_PUTAWAY_QUEUE_QUERY: Readonly<PutawayQueueQuery> = Object.freeze({ search: '', status: 'Chờ xếp khay', receiptCode: '', page: 1, pageSize: 10 });
export const PUTAWAY_SEARCH_FIELDS = ['boxCode', 'sku', 'receiptCode'] as const;
export interface PutawayQueueRow { boxCode: string; sku: string; componentName: string; receiptCode: string; quantity: number; status: string; updatedAt: string; action: string }
export interface PutawayQueueSummary { boxCount: number; skuCount: number; quantityAggregate: number }
export type PutawayQueueModel = ListModel<PutawayQueueRow, PutawayQueueQuery, PutawayQueueSummary>;
export type PutawayQueueAdapter = ListDataAdapter<PutawayQueueRow, PutawayQueueQuery, PutawayQueueSummary>;
