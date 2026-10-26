import { createListFixtureAdapter } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import type { RoleAdapter, RoleQuery, RoleRow, S29Option, S29Summary, UserAdapter, UserQuery, UserRow } from '../../contracts/s29-users-rbac';
import { ROLE_STATUS_LABELS, SCOPE_LABELS, USER_STATUS_LABELS, scopeLabel } from '../../contracts/s29-users-rbac';

const userSearch = [(row: UserRow) => row.displayName, (row: UserRow) => row.username, (row: UserRow) => row.email, (row: UserRow) => row.phone];
const roleSearch = [(row: RoleRow) => row.code, (row: RoleRow) => row.name];
const options = (values: readonly S29Option[]) => values.map(value => ({ ...value }));
const uniqueOptions = (values: readonly (S29Option | null)[]) => {
  const seen = new Set<string>();
  return values.flatMap(value => {
    if (!value || !value.value || seen.has(value.value)) return [];
    seen.add(value.value);
    return [{ ...value }];
  });
};

export const S29_SAMPLE_USER: UserRow = {
  id: 'user-1', displayName: 'Nguyễn Văn Kho', username: 'nvkho01', email: 'nvkho01@gmail.com', phone: '0901234567',
  departmentId: null, departmentName: null, roleId: 'role-warehouse', roleCode: 'WAREHOUSE_STAFF', roleName: 'Nhân viên kho', roleStatus: 'ACTIVE',
  scope: 'WAREHOUSE', scopeRef: null, status: 'ACTIVE', lastLoginAt: '2026-08-10T08:14:00+07:00', version: 2,
};
export const S29_SAMPLE_ROLE: RoleRow = {
  id: 'role-warehouse', code: 'WAREHOUSE_STAFF', name: 'Nhân viên kho', status: 'ACTIVE', scope: 'WAREHOUSE', scopeRef: null, effectiveFrom: null, effectiveTo: null,
};

export function createS29Summary(users: readonly UserRow[] = [S29_SAMPLE_USER]): S29Summary {
  // Filter options describe the complete source cohort, not the current page
  // or a hardcoded sample. This keeps the catalogue aligned with the rows
  // returned by the selected fixture (including multiple roles/departments).
  const roleOptions = uniqueOptions(users.map(row => row.roleId ? {
    value: row.roleId,
    label: [row.roleName, row.roleCode].filter(Boolean).join(' · ') || row.roleId,
  } : null));
  const departmentOptions = uniqueOptions(users.map(row => row.departmentId ? {
    value: row.departmentId,
    label: row.departmentName || row.departmentId,
  } : null));
  return {
    userOptions: {
      roles: roleOptions,
      departments: departmentOptions,
      statuses: options(Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({ value, label }))),
    },
    roleOptions: {
      statuses: options(Object.entries(ROLE_STATUS_LABELS).map(([value, label]) => ({ value, label }))),
      scopes: options(Object.entries(SCOPE_LABELS).map(([value, label]) => ({ value, label }))),
    },
    permissionsAvailable: false,
  };
}

function validateUserQuery(query: UserQuery, rows: readonly UserRow[]) {
  const roleIds = new Set(rows.map(row => row.roleId).filter((value): value is string => Boolean(value)));
  const departmentIds = new Set(rows.map(row => row.departmentId).filter((value): value is string => Boolean(value)));
  if (!Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.includes(query.pageSize as typeof PAGE_SIZE_OPTIONS[number])
    || !['', 'ACTIVE', 'INACTIVE', 'LOCKED'].includes(query.status) || (query.roleId !== '' && !roleIds.has(query.roleId))
    || (query.departmentId !== '' && !departmentIds.has(query.departmentId))
    || !['displayName', 'departmentName', 'roleName', 'scope', 'status', 'lastLoginAt'].includes(query.sortKey)
    || !['asc', 'desc'].includes(query.sortDirection)) return { reason: 'INVALID_QUERY', detail: 'S29 truy vấn người dùng không hợp lệ.' };
  return null;
}
function validateRoleQuery(query: RoleQuery, rows: readonly RoleRow[]) {
  // The filter catalogue is an enum contract, not a projection of the
  // currently visible rows. A complete fixture with one ACTIVE/WAREHOUSE
  // role must still accept INACTIVE, SYSTEM and FUNCTION and return a real
  // empty result for those valid combinations.
  const statuses = new Set(Object.keys(ROLE_STATUS_LABELS));
  const scopes = new Set(Object.keys(SCOPE_LABELS));
  if (!Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.includes(query.pageSize as typeof PAGE_SIZE_OPTIONS[number])
    || (query.status !== '' && !statuses.has(query.status)) || (query.scope !== '' && !scopes.has(query.scope))
    || !['name', 'scope', 'status'].includes(query.sortKey) || !['asc', 'desc'].includes(query.sortDirection)) return { reason: 'INVALID_QUERY', detail: 'S29 truy vấn vai trò không hợp lệ.' };
  return null;
}

export function createS29FixtureAdapters(users: readonly UserRow[] = [S29_SAMPLE_USER], roles: readonly RoleRow[] = [S29_SAMPLE_ROLE]): { users: UserAdapter; roles: RoleAdapter } {
  const summary = createS29Summary(users);
  const userAdapter: UserAdapter = createListFixtureAdapter<UserRow, UserQuery, S29Summary>({
    sourceId: 'S29_DEV_SOURCE_SAMPLE_USER_1', source: { rows: users, completeness: 'complete', scope: 'detail', total: users.length }, summary,
    search: query => ({ value: query.search, fields: userSearch }),
    filters: query => [
      row => !query.roleId || row.roleId === query.roleId,
      row => !query.departmentId || row.departmentId === query.departmentId,
      row => !query.status || row.status === query.status,
    ],
    sort: query => ({ type: query.sortKey === 'lastLoginAt' ? 'date' : 'text', direction: query.sortDirection, value: row => {
      if (query.sortKey === 'departmentName') return row.departmentName;
      if (query.sortKey === 'roleName') return row.roleName;
      if (query.sortKey === 'scope') return scopeLabel(row.scope, row.scopeRef);
      if (query.sortKey === 'status') return USER_STATUS_LABELS[row.status];
      if (query.sortKey === 'lastLoginAt') return row.lastLoginAt;
      return row.displayName;
    } }),
    stableId: row => row.id,
    filterOptions: { roleId: row => row.roleId, departmentId: row => row.departmentId, status: row => row.status },
    optionCatalogue: { roleId: summary.userOptions.roles.map(item => item.value), departmentId: summary.userOptions.departments.map(item => item.value) },
    validate: query => validateUserQuery(query, users),
  });
  const roleAdapter: RoleAdapter = createListFixtureAdapter<RoleRow, RoleQuery, S29Summary>({
    sourceId: 'S29_DEV_SOURCE_SAMPLE_ROLE_1', source: { rows: roles, completeness: 'complete', scope: 'detail', total: roles.length }, summary,
    search: query => ({ value: query.search, fields: roleSearch }),
    filters: query => [row => !query.status || row.status === query.status, row => !query.scope || row.scope === query.scope],
    sort: query => ({ type: 'text', direction: query.sortDirection, value: row => query.sortKey === 'scope' ? scopeLabel(row.scope, row.scopeRef) : query.sortKey === 'status' ? ROLE_STATUS_LABELS[row.status] : row.name }),
    stableId: row => row.id,
    filterOptions: { status: row => row.status, scope: row => row.scope },
    optionCatalogue: { status: summary.roleOptions.statuses.map(item => item.value), scope: summary.roleOptions.scopes.map(item => item.value) },
    validate: query => validateRoleQuery(query, roles),
  });
  return { users: userAdapter, roles: roleAdapter };
}

/** Product Default deliberately has no selected runtime fixture. */
export function createUnselectedS29Adapters(): { users: UserAdapter; roles: RoleAdapter } {
  const blockedUser = (query: UserQuery) => ({ kind: 'blocked' as const, query: structuredClone(query), reason: 'FIXTURE_NOT_SELECTED', detail: 'Chưa có fixture runtime S29 được Owner chọn; chưa hiển thị kết quả hoặc phân trang.' });
  const blockedRole = (query: RoleQuery) => ({ kind: 'blocked' as const, query: structuredClone(query), reason: 'FIXTURE_NOT_SELECTED', detail: 'Chưa có fixture runtime S29 được Owner chọn; chưa hiển thị kết quả hoặc phân trang.' });
  return {
    users: { async read(query) { return blockedUser(query); } },
    roles: { async read(query) { return blockedRole(query); } },
  };
}

export const userStatusLabel = (status: UserRow['status']) => USER_STATUS_LABELS[status];
export const roleStatusLabel = (status: RoleRow['status']) => ROLE_STATUS_LABELS[status];
