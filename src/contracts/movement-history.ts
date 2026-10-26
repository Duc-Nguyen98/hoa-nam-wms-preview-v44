import type { ListDataAdapter } from '../shared/list-runtime';

/** Frontend view-model keys only. Backend fields, enums and permission remain unconfirmed. */
export const MOVEMENT_TYPES = ['Nhập kho', 'Xuất kho'] as const;
export type MovementType = typeof MOVEMENT_TYPES[number];
export interface MovementRow {
  renderKey: string;
  occurredAt: string;
  type: MovementType;
  code: string;
  subject: string;
  quantity: number;
  performer: string;
}
export const MOVEMENT_SORT_KEYS = ['occurredAt', 'type', 'code', 'subject', 'quantity', 'performer'] as const;
export type MovementSortKey = typeof MOVEMENT_SORT_KEYS[number];
export interface MovementQuery {
  period: { from: string; to: string };
  search: string;
  type: MovementType | '';
  performer: string;
  sortKey: MovementSortKey;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
export const DEFAULT_MOVEMENT_QUERY: Readonly<MovementQuery> = Object.freeze({
  period: Object.freeze({ from: '2026-09-04', to: '2026-09-10' }), search: '', type: '', performer: '',
  sortKey: 'occurredAt', sortDirection: 'desc', page: 1, pageSize: 10,
});
export interface MovementSummary {
  transactions: number;
  inbound: number;
  outbound: number;
  products: number;
  inboundProducts: number;
  outboundProducts: number;
  inboundPercent: number;
  outboundPercent: number;
  daily: { date: string; inbound: number; outbound: number }[];
  peak: { date: string; total: number; inbound: number; outbound: number };
}
export type MovementAdapter = ListDataAdapter<MovementRow, MovementQuery, MovementSummary>;
export function movementDateLabel(date: string) { return date.split('-').reverse().join('/'); }
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
export function movementTimeLabel(instant: string) {
  const parts = Object.fromEntries(timeFormatter.formatToParts(new Date(instant)).map(p => [p.type,p.value]));
  return `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute}`;
}
