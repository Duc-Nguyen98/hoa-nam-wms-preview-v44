import test from 'node:test';
import assert from 'node:assert/strict';
import { createS29FixtureAdapters } from '../src/data/adapters/s29-users-rbac-fixture-adapter';
import type { RoleRow, UserRow, UserQuery } from '../src/contracts/s29-users-rbac';

const users: UserRow[] = [
  { id: 'u-manager', displayName: 'Quản lý', username: 'manager', email: '', phone: '', departmentId: 'dept-warehouse', departmentName: 'Kho vận', roleId: 'role-manager', roleCode: 'WAREHOUSE_MANAGER', roleName: 'Quản lý kho', roleStatus: 'ACTIVE', scope: 'WAREHOUSE', scopeRef: null, status: 'ACTIVE', lastLoginAt: null, version: 1 },
  { id: 'u-staff-1', displayName: 'Nhân viên 1', username: 'staff1', email: '', phone: '', departmentId: 'dept-warehouse', departmentName: 'Kho vận', roleId: 'role-staff', roleCode: 'WAREHOUSE_STAFF', roleName: 'Nhân viên kho', roleStatus: 'ACTIVE', scope: 'WAREHOUSE', scopeRef: null, status: 'ACTIVE', lastLoginAt: null, version: 1 },
  { id: 'u-staff-2', displayName: 'Nhân viên 2', username: 'staff2', email: '', phone: '', departmentId: 'dept-warehouse', departmentName: 'Kho vận', roleId: 'role-staff', roleCode: 'WAREHOUSE_STAFF', roleName: 'Nhân viên kho', roleStatus: 'ACTIVE', scope: 'WAREHOUSE', scopeRef: null, status: 'ACTIVE', lastLoginAt: null, version: 1 },
];

const roles: RoleRow[] = [
  { id: 'role-manager', code: 'WAREHOUSE_MANAGER', name: 'Quản lý kho', status: 'ACTIVE', scope: 'WAREHOUSE', scopeRef: null, effectiveFrom: null, effectiveTo: null },
  { id: 'role-staff', code: 'WAREHOUSE_STAFF', name: 'Nhân viên kho', status: 'ACTIVE', scope: 'WAREHOUSE', scopeRef: null, effectiveFrom: null, effectiveTo: null },
];

const query = (patch: Partial<UserQuery> = {}): UserQuery => ({
  search: '', roleId: '', departmentId: '', status: '', sortKey: 'displayName', sortDirection: 'asc', page: 1, pageSize: 10, ...patch,
});

test('S29 builds role and department filters from the complete source cohort', async () => {
  const { users: adapter } = createS29FixtureAdapters(users, roles);
  const result = await adapter.read(query());
  assert.equal(result.kind, 'ready');
  if (result.kind !== 'ready') return;
  assert.deepEqual(result.model.summary.userOptions.roles.map(option => option.value), ['role-manager', 'role-staff']);
  assert.deepEqual(result.model.summary.userOptions.departments.map(option => option.value), ['dept-warehouse']);
});

test('S29 accepts a source-backed role and department filter and returns matching rows', async () => {
  const { users: adapter } = createS29FixtureAdapters(users, roles);
  const result = await adapter.read(query({ roleId: 'role-staff', departmentId: 'dept-warehouse' }));
  assert.equal(result.kind, 'ready');
  if (result.kind !== 'ready') return;
  assert.equal(result.model.pagination.total, 2);
  assert.deepEqual(result.model.rows.map(row => row.id), ['u-staff-1', 'u-staff-2']);
});
