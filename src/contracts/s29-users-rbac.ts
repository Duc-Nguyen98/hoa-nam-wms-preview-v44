import type { ListDataAdapter } from '../shared/list-runtime';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type RoleStatus = 'ACTIVE' | 'INACTIVE';
export type ScopeCode = 'SYSTEM' | 'WAREHOUSE' | 'FUNCTION';

export interface UserRow {
  id: string;
  displayName: string;
  username: string;
  email: string;
  phone: string;
  departmentId: string | null;
  departmentName: string | null;
  roleId: string | null;
  roleCode: string | null;
  roleName: string | null;
  roleStatus: RoleStatus | null;
  scope: ScopeCode | null;
  scopeRef: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  version: number | null;
}

export interface RoleRow {
  id: string;
  code: string;
  name: string;
  status: RoleStatus;
  scope: ScopeCode;
  scopeRef: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface S29Option { value: string; label: string }
export interface S29Summary {
  userOptions: { roles: S29Option[]; departments: S29Option[]; statuses: S29Option[] };
  roleOptions: { statuses: S29Option[]; scopes: S29Option[] };
  permissionsAvailable: false;
}

export type UserSortKey = 'displayName' | 'departmentName' | 'roleName' | 'scope' | 'status' | 'lastLoginAt';
export type RoleSortKey = 'name' | 'scope' | 'status';

export interface UserQuery {
  search: string;
  roleId: string;
  departmentId: string;
  status: '' | UserStatus;
  sortKey: UserSortKey;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface RoleQuery {
  search: string;
  status: '' | RoleStatus;
  scope: '' | ScopeCode;
  sortKey: RoleSortKey;
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export type UserAdapter = ListDataAdapter<UserRow, UserQuery, S29Summary>;
export type RoleAdapter = ListDataAdapter<RoleRow, RoleQuery, S29Summary>;

export const DEFAULT_USER_QUERY: Readonly<UserQuery> = Object.freeze({
  search: '', roleId: '', departmentId: '', status: '', sortKey: 'displayName', sortDirection: 'asc', page: 1, pageSize: 10,
});
export const DEFAULT_ROLE_QUERY: Readonly<RoleQuery> = Object.freeze({
  search: '', status: '', scope: '', sortKey: 'name', sortDirection: 'asc', page: 1, pageSize: 10,
});

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa',
};
export const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động',
};
export const SCOPE_LABELS: Record<ScopeCode, string> = {
  SYSTEM: 'Toàn hệ thống', WAREHOUSE: 'Tất cả kho', FUNCTION: 'Theo chức năng',
};

export function scopeLabel(scope: ScopeCode | null, scopeRef: string | null) {
  if (!scope) return '—';
  // The source explicitly defines WAREHOUSE + null as all warehouses. It does
  // not authorize assigning wh-1 or inventing a warehouse relationship.
  return SCOPE_LABELS[scope] ?? '—';
}

export function effectiveWindowLabel(from: string | null, to: string | null) {
  if (!from && !to) return 'Không giới hạn';
  return `${from ? formatDate(from) : '—'} – ${to ? formatDate(to) : '—'}`;
}

export function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : '—';
}

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (key: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === key)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} · ${part('hour')}:${part('minute')}`;
}
