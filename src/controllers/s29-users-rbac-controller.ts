import { createListController } from '../shared/list-runtime';
import { DEFAULT_ROLE_QUERY, DEFAULT_USER_QUERY, type RoleAdapter, type UserAdapter } from '../contracts/s29-users-rbac';
import { trackListRead } from '../data/read-diagnostics';

export function createS29Controller(userAdapter: UserAdapter, roleAdapter: RoleAdapter) {
  const diagnosedUserAdapter: UserAdapter = {
    read(query, context) { return trackListRead('S29.users', () => userAdapter.read(query, context)); },
  };
  const diagnosedRoleAdapter: RoleAdapter = {
    read(query, context) { return trackListRead('S29.roles', () => roleAdapter.read(query, context)); },
  };
  const users = createListController(diagnosedUserAdapter, {
    initialQuery: structuredClone(DEFAULT_USER_QUERY),
    queryOptions: { searchKey: 'search', filterKeys: ['roleId', 'departmentId', 'status'], sortKeys: ['sortKey', 'sortDirection'] },
  });
  const roles = createListController(diagnosedRoleAdapter, {
    initialQuery: structuredClone(DEFAULT_ROLE_QUERY),
    queryOptions: { searchKey: 'search', filterKeys: ['status', 'scope'], sortKeys: ['sortKey', 'sortDirection'] },
  });
  return { users, roles };
}
