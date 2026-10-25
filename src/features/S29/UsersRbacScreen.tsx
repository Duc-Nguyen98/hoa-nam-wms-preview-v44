import { roleWindowDisplay } from '../report-date-display';
import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { useShellPreferences } from '../../shared/shell-preferences';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { createS29Controller } from '../../controllers/s29-users-rbac-controller';
import {
  DEFAULT_ROLE_QUERY, DEFAULT_USER_QUERY, ROLE_STATUS_LABELS, scopeLabel,
  type RoleAdapter, type RoleQuery, type RoleRow, type RoleSortKey, type UserAdapter, type UserQuery, type UserRow, USER_STATUS_LABELS,
} from '../../contracts/s29-users-rbac';
import {
  Button, CatalogueActiveFilters, CataloguePageHeader, CatalogueToolbar, DataTable, Feedback, FilterSelect, GlobalShell,
  Icon, Notice, Pagination, StatusBadge, ordinalColumn, type NoticeFeedback, type TableColumn,
} from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { AcceptedRowDetail, resolveAcceptedUser, selectAcceptedUser, type AcceptedUserSelection } from './AcceptedRowDetail';
import './users-rbac.css';

type Tab = 'users' | 'roles';
type LocalizedNotice = NoticeFeedback & { values?: Readonly<Record<string, string | number>> };
const statusTone = (status: UserRow['status'] | RoleRow['status']) =>
  status === 'ACTIVE' ? 'success' as const : status === 'LOCKED' ? 'warning' as const : 'neutral' as const;
const optionLabel = (options: readonly { value: string; label: string }[] | undefined, value: string) =>
  options?.find(option => option.value === value)?.label ?? value;

export function UsersRbacScreen({ userAdapter, roleAdapter, developmentNote }: {
  userAdapter: UserAdapter; roleAdapter: RoleAdapter; developmentNote?: string;
}) {
  const tx = useUiCopy(ADMIN_EN_COPY);
  const { language } = useShellPreferences();
  const controller = useMemo(() => createS29Controller(userAdapter, roleAdapter), [userAdapter, roleAdapter]);
  const users = useSyncExternalStore(controller.users.subscribe, controller.users.getSnapshot, controller.users.getSnapshot);
  const roles = useSyncExternalStore(controller.roles.subscribe, controller.roles.getSnapshot, controller.roles.getSnapshot);
  const [tab, setTab] = useState<Tab>('users');
  const [notice, setNotice] = useState<LocalizedNotice | null>(null);
  const [detailSelection, setDetailSelection] = useState<AcceptedUserSelection | null>(null);
  const detailReturnTarget = useRef<{ userId: string; sourceId: string } | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const noticeSlot = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const revealFocus = useKeyboardFocusReveal();
  const [tableOverflow, setTableOverflow] = useState({ users: false, roles: false });
  const userModel = users.model, roleModel = roles.model;
  const userQuery = users.intendedQuery ?? DEFAULT_USER_QUERY, roleQuery = roles.intendedQuery ?? DEFAULT_ROLE_QUERY;
  const detailRow = resolveAcceptedUser(users, detailSelection, tab);

  useLayoutEffect(() => {
    if (detailSelection && !detailRow) setDetailSelection(null);
  }, [detailSelection, detailRow]);

  const openUserDetail = (event: MouseEvent<HTMLElement>, row: UserRow) => {
    event.preventDefault();
    const selection = selectAcceptedUser(controller.users.getSnapshot(), row, tab);
    if (!selection) return;
    setNotice(null);
    detailReturnTarget.current = { userId: row.id, sourceId: selection.sourceId };
    event.currentTarget.focus({ preventScroll: true });
    setDetailSelection(selection);
  };
  const resolveDetailReturnFocus = () => {
    const root = screen.current;
    if (!root) return null;
    const target = detailReturnTarget.current;
    const action = userModel?.source.id === target?.sourceId
      ? [...root.querySelectorAll<HTMLButtonElement>('[data-s29-user-detail-opener]')]
      .find(element => element.dataset.s29UserDetailOpener === target?.userId
        && !element.disabled && element.getClientRects().length > 0)
      : null;
    if (action) return action;
    const heading = root.querySelector<HTMLElement>('h1');
    if (heading) heading.tabIndex = -1;
    return heading;
  };

  useEffect(() => {
    void controller.users.load(structuredClone(DEFAULT_USER_QUERY));
    void controller.roles.load(structuredClone(DEFAULT_ROLE_QUERY));
    return () => { controller.users.clear(); controller.roles.clear(); };
  }, [controller]);

  useLayoutEffect(() => {
    const root = screen.current;
    if (!root) return;
    const measure = () => {
      const read = (id: string) => {
        const region = root.querySelector<HTMLElement>(`#${id} .hn-table-scroll`);
        return Boolean(region && region.scrollWidth > region.clientWidth + 1);
      };
      const next = { users: read('s29-users-panel'), roles: read('s29-roles-panel') };
      setTableOverflow(current => current.users === next.users && current.roles === next.roles ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    root.querySelectorAll<HTMLElement>('.s29-panel, .hn-table-scroll, .hn-table').forEach(element => observer.observe(element));
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [tab, userModel?.rows.length, roleModel?.rows.length, userQuery.pageSize, roleQuery.pageSize]);

  const showNotice = useCallback((message: string, origin: HTMLElement | null, values?: LocalizedNotice['values']) => {
    // Keep source copy and arguments so an open notice follows language changes.
    setNotice({ message, values, tone: 'info', sequence: ++sequence.current, container: document.body, origin });
  }, []);
  const announceResult = useCallback((result: { kind: string; result?: { kind: string; reason?: string; detail?: string } }) => {
    if (result.kind === 'error') {
      showNotice('Chưa thể cập nhật danh sách. Kết quả trước đó được giữ nguyên.', document.activeElement instanceof HTMLElement ? document.activeElement : null);
      return;
    }
    if (result.kind !== 'applied' || result.result?.kind !== 'blocked' || result.result.reason === 'FIXTURE_NOT_SELECTED') return;
    showNotice(result.result.detail ?? "Chưa thể áp dụng điều kiện vừa chọn. Đã giữ kết quả trước đó.",
      document.activeElement instanceof HTMLElement ? document.activeElement : null);
  }, [showNotice]);
  const updateUsers = (patch: Partial<UserQuery>) => { setDetailSelection(null); setNotice(null); void controller.users.update(patch).then(announceResult); };
  const updateRoles = (patch: Partial<RoleQuery>) => { setNotice(null); void controller.roles.update(patch).then(announceResult); };
  const resetUsers = () => { setDetailSelection(null); setNotice(null); void controller.users.reset(structuredClone(DEFAULT_USER_QUERY)).then(announceResult); };
  const resetRoles = () => { setNotice(null); void controller.roles.reset(structuredClone(DEFAULT_ROLE_QUERY)).then(announceResult); };
  const blockedAction = (event: MouseEvent<HTMLElement>, message: string, values?: LocalizedNotice['values']) => {
    event.preventDefault(); showNotice(message, event.currentTarget, values);
  };
  const switchTab = (next: Tab) => { setDetailSelection(null); setNotice(null); setTab(next); };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'users' : event.key === 'End' ? 'roles' : tab === 'users' ? 'roles' : 'users';
    switchTab(next);
    screen.current?.querySelector<HTMLButtonElement>(`#s29-${next}-tab`)?.focus();
  };
  const restoreSearch = () => {
    const search = screen.current?.querySelector<HTMLInputElement>('input[type="search"]');
    search?.focus({ preventScroll: true });
    if (search) revealControl(search);
  };

  // Chips reflect the applied query, never a rejected option.
  const appliedUser = userModel?.query ?? DEFAULT_USER_QUERY, appliedRole = roleModel?.query ?? DEFAULT_ROLE_QUERY;
  const userChips: { key: 'roleId' | 'departmentId' | 'status'; label: string }[] = [];
  if (appliedUser.roleId) userChips.push({ key: 'roleId', label: tx("Vai trò: {v0}", { v0: optionLabel(userModel?.summary.userOptions.roles, appliedUser.roleId) }) });
  if (appliedUser.departmentId) userChips.push({ key: 'departmentId', label: tx("Phòng ban: {v0}", { v0: optionLabel(userModel?.summary.userOptions.departments, appliedUser.departmentId) }) });
  if (appliedUser.status) userChips.push({ key: 'status', label: tx("Trạng thái: {v0}", { v0: tx(USER_STATUS_LABELS[appliedUser.status]) }) });
  const roleChips: { key: 'status' | 'scope'; label: string }[] = [];
  if (appliedRole.status) roleChips.push({ key: 'status', label: tx("Trạng thái: {v0}", { v0: tx(ROLE_STATUS_LABELS[appliedRole.status]) }) });
  if (appliedRole.scope) roleChips.push({ key: 'scope', label: tx("Phạm vi: {v0}", { v0: tx(scopeLabel(appliedRole.scope, null)) }) });

  const userColumns: TableColumn<UserRow>[] = [
    ordinalColumn(userModel?.pagination.page ?? 1, userModel?.pagination.pageSize ?? 10),
    { id: 'user', heading: tx("Người dùng"), sortKey: 'displayName', render: row =>
      <div className="s29-identity"><span className="s29-avatar" aria-hidden="true"><Icon name="user" size={19} /></span><div className="s29-user-cell"><strong>{row.displayName}</strong><span>{row.username}</span></div></div> },
    { id: 'department', heading: tx("Phòng ban"), sortKey: 'departmentName', render: row => row.departmentName ?? '—' },
    { id: 'role', heading: tx("Vai trò"), sortKey: 'roleName', render: row =>
      <div className="s29-role-cell"><strong>{row.roleName ?? '—'}</strong><span>{row.roleCode ?? '—'}</span></div> },
    { id: 'scope', heading: tx("Phạm vi"), sortKey: 'scope', render: row => tx(scopeLabel(row.scope, row.scopeRef)) },
    { id: 'status', heading: tx("Trạng thái"), sortKey: 'status', render: row =>
      <StatusBadge tone={statusTone(row.status)}>{tx(USER_STATUS_LABELS[row.status])}</StatusBadge> },
    { id: 'lastLoginAt', heading: tx("Đăng nhập gần nhất"), sortKey: 'lastLoginAt', sortType: 'date', render: row =>
      <time dateTime={row.lastLoginAt ?? undefined}>{(row.lastLoginAt ? formatBusinessTimestamp(row.lastLoginAt, language) : '—')}</time> },
    { id: 'actions', heading: tx("Thao tác"), kind: 'actions', render: row =>
      <Button key={userModel?.source.id} variant="ghost" aria-label={tx("Xem người dùng {v0}", { v0: row.username })} leadingIcon={<Icon name="eye" size={17} />}
        data-s29-user-detail-opener={row.id} disabled={Boolean(users.loading || users.debouncing || users.error || users.blocker)}
        onClick={event => openUserDetail(event, row)}>{tx("Xem")}</Button> },
  ];
  const roleColumns: TableColumn<RoleRow>[] = [
    ordinalColumn(roleModel?.pagination.page ?? 1, roleModel?.pagination.pageSize ?? 10),
    { id: 'role', heading: tx("Vai trò"), sortKey: 'name', render: row =>
      <div className="s29-identity"><span className="s29-avatar" aria-hidden="true"><Icon name="shield" size={19} /></span><div className="s29-role-cell"><strong>{row.name}</strong><span>{row.code}</span></div></div> },
    { id: 'scope', heading: tx("Phạm vi"), sortKey: 'scope', render: row =>
      <div>{tx(scopeLabel(row.scope, row.scopeRef))}<small className="s29-muted">{tx(roleWindowDisplay(row.effectiveFrom, row.effectiveTo, language))}</small></div> },
    { id: 'status', heading: tx("Trạng thái"), sortKey: 'status', render: row =>
      <StatusBadge tone={statusTone(row.status)}>{tx(ROLE_STATUS_LABELS[row.status])}</StatusBadge> },
    { id: 'permissions', heading: tx("Quyền hiệu lực"), render: () => <span className="s29-permissions-missing">{tx("Chưa có nguồn")}</span> },
    { id: 'actions', heading: tx("Thao tác"), kind: 'actions', render: row =>
      <Button variant="ghost" aria-label={tx("Xem quyền {v0}", { v0: row.code })} leadingIcon={<Icon name="shield" size={17} />}
        onClick={event => blockedAction(event, "Ma trận quyền của {v0} đang chờ RBAC-DATA-01; chưa thể xem hoặc chỉnh quyền.", { v0: row.code })}>{tx("Xem quyền")}</Button> },
  ];
  const usersBusy = users.loading || users.debouncing;
  const rolesBusy = roles.loading || roles.debouncing;
  const loading = tab === 'users' ? usersBusy : rolesBusy;
  const currentModel = tab === 'users' ? userModel : roleModel;

  return <GlobalShell title={tx("Người dùng & RBAC")} variant="wms" sidebarTone="navy" contentWidth="wide" activeKey="S29" navigation={S00_SHELL_NAVIGATION}>
    <div ref={screen} className="hn-catalogue-screen s29-screen" data-screen="S29" data-visual-variant="premium" data-source-mode="host-adapter" onFocusCapture={revealFocus}>
      <CataloguePageHeader title={tx("Người dùng & RBAC")} appearance="worklist" parentLabel={tx("Hệ thống")} breadcrumb={tx("Người dùng & RBAC")}
        description={tx("Tra cứu người dùng, vai trò và phạm vi truy cập.")} />
      {developmentNote && <DevSourceStrip note={developmentNote} />}
      <div className="s29-workspace">
        <div className="s29-workspace-top">
          <div className="s29-tabs" role="tablist" aria-label={tx("Nội dung Người dùng & RBAC")}>
            <button type="button" role="tab" tabIndex={tab === 'users' ? 0 : -1} onKeyDown={onTabKey} aria-selected={tab === 'users'}
              aria-controls="s29-users-panel" id="s29-users-tab" onClick={() => switchTab('users')}><Icon name="users" size={18} />{tx("Người dùng")}</button>
            <button type="button" role="tab" tabIndex={tab === 'roles' ? 0 : -1} onKeyDown={onTabKey} aria-selected={tab === 'roles'}
              aria-controls="s29-roles-panel" id="s29-roles-tab" onClick={() => switchTab('roles')}><Icon name="shield" size={18} />{tx("Vai trò & phân quyền")}</button>
          </div>
          <span className="s29-result-count" role="status" aria-live="polite">
            {loading ? tx("Đang cập nhật…") : currentModel ? tx("{v0} kết quả trên nguồn đang xem", { v0: currentModel.pagination.total }) : tx("Chưa chọn nguồn dữ liệu")}
          </span>
        </div>
        <div ref={noticeSlot} className="s29-notice-slot" />
        <>
        <section key="users" id="s29-users-panel" role="tabpanel" aria-labelledby="s29-users-tab" hidden={tab !== 'users'} className="s29-panel">
          <div className="s29-query">
            <CatalogueToolbar id="s29-users-query" label={tx("Tìm và lọc người dùng")} layout="worklist" filterDisclosure="responsive"
              searchLabel={tx("Tìm người dùng")} searchHint={tx("Tìm tên, tài khoản, email hoặc số điện thoại. Không phân biệt hoa thường hoặc dấu.")}
              searchPlaceholder={tx("Tìm tên, tài khoản, email, số điện thoại…")} searchValue={userQuery.search}
              onSearchChange={search => updateUsers({ search })} onReset={resetUsers} applyMode="immediate" queryContext={null} searchHintMode="sr-only" busy={usersBusy}>
              <FilterSelect label={tx("Vai trò")} value={userQuery.roleId} onChange={event => updateUsers({ roleId: event.currentTarget.value })}>
                <option value="">{tx("Tất cả vai trò")}</option>{userModel?.summary.userOptions.roles.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </FilterSelect>
              <FilterSelect label={tx("Phòng ban")} value={userQuery.departmentId} onChange={event => updateUsers({ departmentId: event.currentTarget.value })}>
                <option value="">{tx("Tất cả phòng ban")}</option>{userModel?.summary.userOptions.departments.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </FilterSelect>
              <FilterSelect label={tx("Trạng thái")} value={userQuery.status} onChange={event => updateUsers({ status: event.currentTarget.value as UserQuery['status'] })}>
                <option value="">{tx("Tất cả trạng thái")}</option>{userModel?.summary.userOptions.statuses.map(option => <option key={option.value} value={option.value}>{tx(option.label)}</option>)}
              </FilterSelect>
            </CatalogueToolbar>
            <CatalogueActiveFilters className="s29-active-filters" items={userChips} onRemove={key => { updateUsers({ [key]: '' }); restoreSearch(); }} />
          </div>
          {!userModel ? <SourcePending loading={users.loading || users.debouncing} error={Boolean(users.error)} onRetry={() => void controller.users.load(userQuery)} /> : <>
            <div className="s29-table-wrap">
              <DataTable caption={tx("Danh sách người dùng")} captionVisibility="sr-only" columns={userColumns} rows={userModel.rows}
                rowKey={row => row.id} sort={{ key: userQuery.sortKey, direction: userQuery.sortDirection }}
                onSort={key => updateUsers({ sortKey: key as UserQuery['sortKey'], sortDirection: userQuery.sortKey === key && userQuery.sortDirection === 'asc' ? 'desc' : 'asc' })}
                appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet"
                stickyColumnIds={['ordinal', 'user']} stickyEndColumnIds={['actions']} stickyHeader
                scrollResetKey={JSON.stringify(userModel.query)} busy={usersBusy} emptyContent={<NoResults />} />
            </div>
            <p className="s29-table-hint" role="note" hidden={!tableOverflow.users}><Icon name="arrows-horizontal" size={15} />{tx("Cuộn ngang để xem các cột còn lại")}</p>
            <div className="s29-table-footer"><Pagination variant="products" unit={tx("người dùng")}
              page={userModel.pagination.page} pageSize={userModel.pagination.pageSize} filteredTotal={userModel.pagination.total} displayedCount={userModel.rows.length}
              canGoPrevious={userModel.pagination.page > 1} canGoNext={userModel.pagination.page < userModel.pagination.pageCount}
              onPageChange={page => updateUsers({ page })} onPageSizeChange={pageSize => updateUsers({ pageSize })} preserveBoundaryFocus /></div>
          </>}
        </section>
        <section key="roles" id="s29-roles-panel" role="tabpanel" aria-labelledby="s29-roles-tab" hidden={tab !== 'roles'} className="s29-panel">
          <div className="s29-query">
            <CatalogueToolbar id="s29-roles-query" label={tx("Tìm và lọc vai trò")} layout="worklist" filterDisclosure="responsive"
              searchLabel={tx("Tìm vai trò")} searchHint={tx("Tìm chuỗi con theo mã hoặc tên vai trò.")} searchPlaceholder={tx("Tìm mã hoặc tên vai trò…")}
              searchValue={roleQuery.search} onSearchChange={search => updateRoles({ search })} onReset={resetRoles}
              applyMode="immediate" queryContext={null} searchHintMode="sr-only" busy={rolesBusy}>
              <FilterSelect label={tx("Trạng thái")} value={roleQuery.status} onChange={event => updateRoles({ status: event.currentTarget.value as RoleQuery['status'] })}>
                <option value="">{tx("Tất cả trạng thái")}</option>{roleModel?.summary.roleOptions.statuses.map(option => <option key={option.value} value={option.value}>{tx(option.label)}</option>)}
              </FilterSelect>
              <FilterSelect label={tx("Phạm vi")} value={roleQuery.scope} onChange={event => updateRoles({ scope: event.currentTarget.value as RoleQuery['scope'] })}>
                <option value="">{tx("Tất cả phạm vi")}</option>{roleModel?.summary.roleOptions.scopes.map(option => <option key={option.value} value={option.value}>{tx(option.label)}</option>)}
              </FilterSelect>
            </CatalogueToolbar>
            <CatalogueActiveFilters className="s29-active-filters" items={roleChips} onRemove={key => { updateRoles({ [key]: '' }); restoreSearch(); }} />
          </div>
          {!roleModel ? <SourcePending loading={roles.loading || roles.debouncing} error={Boolean(roles.error)} onRetry={() => void controller.roles.load(roleQuery)} /> : <>
            <div className="s29-permission-note" role="note"><Icon name="shield" size={18} /><div><strong>{tx("Catalogue quyền chưa có nguồn")}</strong><p>{tx("Danh sách vai trò vẫn tra cứu được. Ma trận quyền chờ catalogue và mapping RBAC-DATA-01.")}</p></div></div>
            <div className="s29-table-wrap s29-table-wrap--roles">
              <DataTable caption={tx("Danh sách vai trò")} captionVisibility="sr-only" columns={roleColumns} rows={roleModel.rows}
                rowKey={row => row.id} sort={{ key: roleQuery.sortKey, direction: roleQuery.sortDirection }}
                onSort={key => updateRoles({ sortKey: key as RoleSortKey, sortDirection: roleQuery.sortKey === key && roleQuery.sortDirection === 'asc' ? 'desc' : 'asc' })}
                appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet"
                stickyColumnIds={['ordinal', 'role']} stickyEndColumnIds={['actions']} stickyHeader
                scrollResetKey={JSON.stringify(roleModel.query)} busy={rolesBusy} emptyContent={<NoResults />} />
            </div>
            <p className="s29-table-hint" role="note" hidden={!tableOverflow.roles}><Icon name="arrows-horizontal" size={15} />{tx("Cuộn ngang để xem các cột còn lại")}</p>
            <div className="s29-table-footer"><Pagination variant="products" unit={tx("vai trò")}
              page={roleModel.pagination.page} pageSize={roleModel.pagination.pageSize} filteredTotal={roleModel.pagination.total} displayedCount={roleModel.rows.length}
              canGoPrevious={roleModel.pagination.page > 1} canGoNext={roleModel.pagination.page < roleModel.pagination.pageCount}
              onPageChange={page => updateRoles({ page })} onPageSizeChange={pageSize => updateRoles({ pageSize })} preserveBoundaryFocus /></div>
          </>}
        </section>
        </>
      </div>
      <p className="s29-footer-note"><Icon name="info" size={15} />{tab === 'users' ? tx("Phòng ban “—”: chưa có quan hệ nguồn. Tổng chỉ tính trên nguồn đang xem.") : tx("Quyền hiệu lực chưa xác định, không phải 0 quyền. Chưa mở cấp hoặc thu hồi quyền.")}</p>
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message, notice.values) }} onClose={() => setNotice(null)} resolveInlineSlot={() => noticeSlot.current} revealInlineOnOpen />}
      <AcceptedRowDetail row={detailRow} onClose={() => setDetailSelection(null)} resolveReturnFocus={resolveDetailReturnFocus} />
    </div>
  </GlobalShell>;
}

function SourcePending({ loading, error, onRetry }: { loading: boolean; error: boolean; onRetry: () => void }) {
  const tx = useUiCopy(ADMIN_EN_COPY);
  return <div className="s29-source-pending"><Feedback title={loading ? tx("Đang tải dữ liệu…") : tx("Dữ liệu chưa sẵn sàng")} tone="warning">
    {loading ? tx("Vui lòng chờ trong giây lát.") : tx("Chưa thể hiển thị danh sách. Vui lòng quay lại sau.")}
  </Feedback>{error && !loading && <Button onClick={onRetry}>{tx('Thử lại')}</Button>}</div>;
}

function DevSourceStrip({ note }: { note: string }) {
  const tx = useUiCopy(ADMIN_EN_COPY);
  return <details className="s29-source-strip" onKeyDown={event => {
    if (event.key !== 'Escape') return;
    event.currentTarget.open = false;
    event.currentTarget.querySelector('summary')?.focus();
  }}>
    <summary><Icon name="info" size={16} /><strong>DEV candidate</strong><span>{tx("Chưa kích hoạt fixture chính thức")}</span><Icon name="chevron-down" size={16} /></summary>
    <div className="s29-source-details">{note}</div>
  </details>;
}

function NoResults() {
  const tx = useUiCopy(ADMIN_EN_COPY);
  return <div className="s29-no-results"><Icon name="search" size={26} /><strong>{tx("Không tìm thấy bản ghi phù hợp")}</strong><span>{tx("Thử từ khóa khác hoặc bỏ bớt điều kiện lọc.")}</span></div>;
}
