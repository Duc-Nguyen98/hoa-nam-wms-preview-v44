export type PutawayHistoryAction = '' | 'putaway.create' | 'putaway.confirm' | 'putaway.cancel';
export interface PutawayHistoryQuery { from: string; to: string; search: string; action: PutawayHistoryAction; page: number; pageSize: number }
export interface PutawayHistoryRow { id: string; timestamp: string; action: Exclude<PutawayHistoryAction, ''>; orderId: string; orderCode: string; boxId: string; boxCode: string; trayId: string | null; trayCode: string | null; actor: string; result: 'SUCCESS' }
export interface PutawayHistoryResult { rows: PutawayHistoryRow[]; total: number; scopeTotal: number; page: number; pageSize: number; query: PutawayHistoryQuery }
export const DEFAULT_PUTAWAY_HISTORY_QUERY: Readonly<PutawayHistoryQuery> = Object.freeze({ from: '', to: '', search: '', action: '', page: 1, pageSize: 9 });
