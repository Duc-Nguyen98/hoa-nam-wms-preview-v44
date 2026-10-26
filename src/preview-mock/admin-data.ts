import { createS29FixtureAdapters } from '../data/adapters/s29-users-rbac-fixture-adapter';
import { createSystemAuditRowsAdapter } from '../data/adapters/system-audit-fixture-adapter';
import { DEFAULT_ROLE_QUERY, DEFAULT_USER_QUERY, type RoleQuery, type UserQuery } from '../contracts/s29-users-rbac';
import { SYSTEM_AUDIT_PERIOD, DEFAULT_SYSTEM_AUDIT_QUERY, type SystemAuditQuery } from '../contracts/system-audit';
import type { WarehouseRead } from '../contracts/warehouse-config';

/** Local admin read model. It is intentionally separate from backend DTOs. */
const auditRows = [
  ['audit-pn-001', '2026-09-25T09:00:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PN-20260901-001', 'mv-PN-20260901-001'],
  ['audit-pn-002', '2026-09-25T09:12:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PN-20260901-002', 'mv-PN-20260901-002'],
  ['audit-px-001', '2026-09-26T10:00:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PX-20260902-001', 'mv-PX-20260902-001'],
  ['audit-px-002', '2026-09-27T14:00:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PX-20260903-002', 'mv-PX-20260903-002'],
  ['audit-bh-001', '2026-09-29T08:30:00+07:00', 'actor-technician', 'MOVEMENT_POSTED', 'PX-LK-20260905-001', 'mv-PX-LK-20260905-001'],
  ['audit-bh-002', '2026-09-29T09:05:00+07:00', 'actor-technician', 'MOVEMENT_POSTED', 'PX-LK-20260905-002', 'mv-PX-LK-20260905-002'],
  ['audit-reversal-001', '2026-09-30T11:10:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PD-20260910-001', 'mv-PD-20260910-001'],
  ['audit-reversal-002', '2026-09-30T11:20:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PD-20260910-002', 'mv-PD-20260910-002'],
  ['audit-reversal-003', '2026-10-01T10:00:00+07:00', 'actor-manager', 'MOVEMENT_POSTED', 'PD-20260910-003', 'mv-PD-20260910-003'],
].map(([id, at, actorId, eventType, documentId, movementId]) => ({
  id, at, actorId, actorName: actorId === 'actor-manager' ? 'Đức Quang' : 'Lê Hoàng Nam', eventType, documentId, movementId, module: null,
}));

const auditSummary = {
  total: auditRows.length,
  snapshotAt: '2026-10-01T10:00:00+07:00',
  period: SYSTEM_AUDIT_PERIOD,
  actors: [{ id: 'actor-manager', name: 'Đức Quang' }, { id: 'actor-technician', name: 'Lê Hoàng Nam' }],
};

export const localSystemAuditAdapter = createSystemAuditRowsAdapter(auditRows, 'LOCAL_SCENARIO_SYSTEM_AUDIT_2026-10-01', auditSummary);

export const localWarehouseRead: WarehouseRead = {
  kind: 'available',
  snapshot: {
    id: 'warehouse-hn-01', code: 'HN-01', name: 'Kho Hoa Nam', address: 'Khu công nghiệp Hà Nội',
    contact_person: 'Đức Quang', phone: '0901234567', status: 'ACTIVE',
  },
  access: { permissionCodes: ['warehouse.view', 'warehouse.manage'], isSuperAdmin: false },
  provenance: 'OWNER_SELECTED_FIXTURE',
};

const users = Array.from({ length: 6 }, (_, index) => ({
  id: `user-local-${index + 1}`, displayName: ['Đức Quang', 'Lê Hoàng Nam', 'Trần Quốc Bảo', 'Phạm Thu Hà', 'Nguyễn Minh', 'Hoàng An'][index],
  username: ['ducquang', 'lehoangnam', 'tranquocbao', 'phamthuha', 'nguyenminh', 'hoangan'][index],
  email: '', phone: '', departmentId: 'dept-warehouse', departmentName: 'Kho vận', roleId: index === 0 ? 'role-manager' : 'role-staff',
  roleCode: index === 0 ? 'WAREHOUSE_MANAGER' : 'WAREHOUSE_STAFF', roleName: index === 0 ? 'Quản lý kho' : 'Nhân viên kho',
  roleStatus: 'ACTIVE' as const, scope: 'WAREHOUSE' as const, scopeRef: null, status: index === 5 ? 'INACTIVE' as const : 'ACTIVE' as const,
  lastLoginAt: `2026-10-${String(1 + index).padStart(2, '0')}T08:00:00+07:00`, version: 1,
}));
const roles = [
  { id: 'role-manager', code: 'WAREHOUSE_MANAGER', name: 'Quản lý kho', status: 'ACTIVE' as const, scope: 'WAREHOUSE' as const, scopeRef: null, effectiveFrom: null, effectiveTo: null },
  { id: 'role-staff', code: 'WAREHOUSE_STAFF', name: 'Nhân viên kho', status: 'ACTIVE' as const, scope: 'WAREHOUSE' as const, scopeRef: null, effectiveFrom: null, effectiveTo: null },
];
const localS29 = createS29FixtureAdapters(users, roles);
export const localUsersAdapter = localS29.users;
export const localRolesAdapter = localS29.roles;

export const adminDefaults = {
  audit: structuredClone(DEFAULT_SYSTEM_AUDIT_QUERY),
  users: structuredClone(DEFAULT_USER_QUERY),
  roles: structuredClone(DEFAULT_ROLE_QUERY),
};
export type AdminQuery = SystemAuditQuery | UserQuery | RoleQuery;
