import type { ListDataAdapter } from '../shared/list-runtime';

export interface SystemAuditActor { id: string; name: string }
export interface SystemAuditRow {
  id: string;
  at: string;
  actorId: string;
  actorName: string | null;
  eventType: string;
  documentId: string;
  movementId: string;
  module: string | null;
}

export const SYSTEM_AUDIT_SORT_KEYS = ['at', 'actorName', 'id'] as const;
export type SystemAuditSortKey = typeof SYSTEM_AUDIT_SORT_KEYS[number];
export interface SystemAuditQuery {
  period: { from: string; to: string };
  search: string;
  eventType: string;
  module: '';
  actorId: string;
  sortKey: SystemAuditSortKey | null;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
/** Source metadata, never a KPI or production DTO. */
export interface SystemAuditSummary { total: number; snapshotAt: string; period: { from: string; to: string }; actors: SystemAuditActor[] }
export type SystemAuditAdapter = ListDataAdapter<SystemAuditRow, SystemAuditQuery, SystemAuditSummary>;

export const SYSTEM_AUDIT_PERIOD = Object.freeze({ from: '2026-09-25', to: '2026-10-01' });
export const DEFAULT_SYSTEM_AUDIT_QUERY: Readonly<SystemAuditQuery> = Object.freeze({
  period: SYSTEM_AUDIT_PERIOD, search: '', eventType: '', module: '', actorId: '',
  sortKey: null, sortDirection: 'asc', page: 1, pageSize: 10,
});

export function auditDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
export function auditPeriod(period: SystemAuditQuery['period']) { return `${auditDate(period.from)} – ${auditDate(period.to)}`; }
export function auditTime(value: string) {
  const parts = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const part = (key: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === key)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} · ${part('hour')}:${part('minute')}`;
}
