import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { useShellPreferences, type ShellLanguage } from '../../shared/shell-preferences';
import type { S29Summary, UserQuery, UserRow } from '../../contracts/s29-users-rbac';
import { ROLE_STATUS_LABELS, scopeLabel, USER_STATUS_LABELS } from '../../contracts/s29-users-rbac';
import type { ListRuntimeSnapshot } from '../../shared/list-runtime';
import { GlobalModal } from '../../shared/GlobalModal';
import { Button } from '../../shared/primitives';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';

type UserSnapshot = ListRuntimeSnapshot<UserRow, UserQuery, S29Summary>;
export interface AcceptedUserSelection {
  readonly model: NonNullable<UserSnapshot['model']>;
  readonly row: UserRow;
  readonly userId: string;
  readonly sourceId: string;
  readonly requestId: number;
  readonly queryKey: string;
}

// Compare the declared query fields, independent of property insertion order.
const queryKey = (query: UserQuery | null) => query ? JSON.stringify([
  query.search, query.roleId, query.departmentId, query.status,
  query.sortKey, query.sortDirection, query.page, query.pageSize,
]) : null;
function settledUsers(state: UserSnapshot, tab: 'users' | 'roles') {
  return tab === 'users' && state.model && !state.loading && !state.debouncing
    && !state.pendingQuery && !state.error && !state.blocker
    && queryKey(state.acceptedQuery) === queryKey(state.model.query)
    && queryKey(state.intendedQuery) === queryKey(state.model.query);
}

/** OP-201: project only a unique row already accepted by this user list. */
export function selectAcceptedUser(state: UserSnapshot, row: UserRow, tab: 'users' | 'roles'): AcceptedUserSelection | null {
  if (!settledUsers(state, tab) || !state.model) return null;
  const matches = state.model.rows.filter(candidate => candidate.id === row.id);
  if (matches.length !== 1 || matches[0] !== row) return null;
  return { model: state.model, row, userId: row.id, sourceId: state.model.source.id,
    requestId: state.requestId, queryKey: queryKey(state.model.query)! };
}

export function resolveAcceptedUser(state: UserSnapshot, selection: AcceptedUserSelection | null, tab: 'users' | 'roles'): UserRow | null {
  if (!selection || !settledUsers(state, tab) || !state.model
    || state.model !== selection.model || state.model.source.id !== selection.sourceId
    || state.requestId !== selection.requestId || queryKey(state.model.query) !== selection.queryKey) return null;
  const matches = state.model.rows.filter(row => row.id === selection.userId);
  return matches.length === 1 && matches[0] === selection.row ? matches[0] : null;
}

export const ACCEPTED_USER_DETAIL_COPY = {
  ...ADMIN_EN_COPY,
  'Chi tiết người dùng': 'User details',
  'Thông tin từ dòng đang xem · Chỉ đọc': 'Information from the displayed row · Read only',
  'Đóng chi tiết người dùng': 'Close user details',
  'ID người dùng': 'User ID',
  'Tên hiển thị': 'Display name',
  'Tên đăng nhập': 'Username',
  'Email': 'Email',
  'Số điện thoại': 'Phone number',
  'ID phòng ban': 'Department ID',
  'Tên phòng ban': 'Department name',
  'ID vai trò': 'Role ID',
  'Mã vai trò': 'Role code',
  'Tên vai trò': 'Role name',
  'Trạng thái vai trò': 'Role status',
  'Tham chiếu phạm vi': 'Scope reference',
  'Phiên bản': 'Version',
  'Thông tin này chỉ phản ánh dòng trong danh sách, không xác nhận quyền hiệu lực.': 'This information reflects the listed row only; it does not establish effective permissions.',
  'Dấu “—” là thông tin chưa có nguồn; không suy ra phòng ban, kho hoặc quyền truy cập.': 'An em dash means information is not supplied; no department, warehouse or access rights are inferred.',
} as const;

type Copy = (value: string) => string;
const display = (value: string | number | null) => value === null || value === '' ? '—' : String(value);

/** Exactly the 16 existing UserRow fields; no catalogue join or extra read. */
export function acceptedUserFields(row: UserRow, tx: Copy, language: ShellLanguage = 'vi') {
  const fields: { key: keyof UserRow; label: string; value: string }[] = [
    { key: 'id', label: 'ID người dùng', value: display(row.id) },
    { key: 'displayName', label: 'Tên hiển thị', value: display(row.displayName) },
    { key: 'username', label: 'Tên đăng nhập', value: display(row.username) },
    { key: 'email', label: 'Email', value: display(row.email) },
    { key: 'phone', label: 'Số điện thoại', value: display(row.phone) },
    { key: 'departmentId', label: 'ID phòng ban', value: display(row.departmentId) },
    { key: 'departmentName', label: 'Tên phòng ban', value: display(row.departmentName) },
    { key: 'roleId', label: 'ID vai trò', value: display(row.roleId) },
    { key: 'roleCode', label: 'Mã vai trò', value: display(row.roleCode) },
    { key: 'roleName', label: 'Tên vai trò', value: display(row.roleName) },
    { key: 'roleStatus', label: 'Trạng thái vai trò', value: row.roleStatus === null ? '—' : tx(ROLE_STATUS_LABELS[row.roleStatus]) },
    { key: 'scope', label: 'Phạm vi', value: tx(scopeLabel(row.scope, row.scopeRef)) },
    { key: 'scopeRef', label: 'Tham chiếu phạm vi', value: display(row.scopeRef) },
    { key: 'status', label: 'Trạng thái', value: tx(USER_STATUS_LABELS[row.status]) },
    { key: 'lastLoginAt', label: 'Đăng nhập gần nhất', value: (row.lastLoginAt ? formatBusinessTimestamp(row.lastLoginAt, language) : '—') },
    { key: 'version', label: 'Phiên bản', value: display(row.version) },
  ];
  return fields.map(field => ({ ...field, label: tx(field.label) }));
}

// Stay mounted while closed so GlobalModal can complete native-close focus restoration.
export function AcceptedRowDetail({ row, onClose, resolveReturnFocus }: {
  row: UserRow | null; onClose: () => void; resolveReturnFocus: () => HTMLElement | null;
}) {
  const tx = useUiCopy(ACCEPTED_USER_DETAIL_COPY);
  const { language } = useShellPreferences();
  return <GlobalModal open={row !== null} title={tx('Chi tiết người dùng')}
    description={tx('Thông tin từ dòng đang xem · Chỉ đọc')} size="medium"
    data-s29-user-detail closeLabel={tx('Đóng chi tiết người dùng')}
    onClose={onClose} resolveReturnFocus={resolveReturnFocus}
    footer={<Button onClick={onClose}>{tx('Đóng')}</Button>}>
    {row && <>
      <dl className="hn-form-field" data-user-id={row.id}>
        {acceptedUserFields(row, tx, language).map(field => <div key={field.key} className="hn-form-field">
          <dt className="hn-form-field__label">{field.label}</dt>
          <dd data-detail-field={field.key}>{field.value}</dd>
        </div>)}
      </dl>
      <p>{tx('Thông tin này chỉ phản ánh dòng trong danh sách, không xác nhận quyền hiệu lực.')}</p>
      <p>{tx('Dấu “—” là thông tin chưa có nguồn; không suy ra phòng ban, kho hoặc quyền truy cập.')}</p>
    </>}
  </GlobalModal>;
}
