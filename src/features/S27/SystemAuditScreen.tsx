import { useShellPreferences } from '../../shared/shell-preferences';
import { formatAuditTime } from './audit-time';
import { useAuditCopy as useUiCopy } from './audit-ui-copy';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createSystemAuditController } from '../../controllers/system-audit-controller';
import { DEFAULT_SYSTEM_AUDIT_QUERY, auditPeriod, type SystemAuditAdapter, type SystemAuditQuery, type SystemAuditRow, type SystemAuditSortKey } from '../../contracts/system-audit';
import { Button, CatalogueActiveFilters, CataloguePageHeader, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, Pagination, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalAudit, S27_OPERATIONAL_COPY } from './OperationalAudit';
import { createPvDemoAdapter } from '../../data/http/pv-demo-adapter';
import { PvAudit, S27_PV_COPY } from './PvAudit';
import './system-audit.css';

type Operation = ReturnType<ReturnType<typeof createSystemAuditController>['load']>;
type FilterKey = 'search' | 'eventType' | 'actorId';
type LocalizedNotice = NoticeFeedback & { values?: Readonly<Record<string, string | number>> };

export function SystemAuditScreen({ adapter }: { adapter?: SystemAuditAdapter } = {}) {
  const tx = useUiCopy({ ...ADMIN_EN_COPY, ...S27_OPERATIONAL_COPY, ...S27_PV_COPY });
  const operational = useMemo(() => createOperationalWebAdapter(undefined, { scope: 'S27' }), []);
  const pv = useMemo(() => createPvDemoAdapter(), []);
  const [cohort, setCohort] = useState<'scenario' | 'legacy' | 'pv'>(() => operational.available ? 'scenario' : 'legacy');
  const controls = operational.available || pv.available ? <div className="s27-cohorts">{operational.available && <Button variant="secondary" aria-pressed={cohort === 'scenario'} onClick={() => setCohort('scenario')}>{tx('Nhật ký phiên hiện tại')}</Button>}<Button variant="secondary" aria-pressed={cohort === 'legacy'} onClick={() => setCohort('legacy')}>{tx('Nhật ký tham chiếu')}</Button>{pv.available && <Button variant="secondary" aria-pressed={cohort === 'pv'} onClick={() => setCohort('pv')}>{tx('Nhật ký hồ sơ PV')}</Button>}</div> : null;
  if (cohort === 'legacy') return <LegacySystemAuditScreen adapter={adapter} cohortControls={controls} />;
  return <GlobalShell title={tx('Nhật ký hệ thống')} variant="wms" sidebarTone="navy" contentWidth="wide" activeKey="S27" navigation={S00_SHELL_NAVIGATION}>
    <div className="hn-catalogue-screen s27-screen" data-screen="S27" data-visual-variant="premium" data-presentation="default">{cohort === 'pv' ? <><CataloguePageHeader appearance="worklist" title={tx('Nhật ký hệ thống')} parentLabel={tx('Hệ thống')} breadcrumb={tx('Nhật ký hệ thống')} description={tx('Theo dõi các sự kiện đã ghi nhận trong phạm vi snapshot được cấp.')} />{controls}<PvAudit adapter={pv} /></> : <OperationalAudit adapter={operational} cohortControls={controls} />}</div>
  </GlobalShell>;
}

function LegacySystemAuditScreen({ adapter, cohortControls }: { adapter?: SystemAuditAdapter; cohortControls?: ReactNode }) {
  const tx = useUiCopy({ ...ADMIN_EN_COPY, ...S27_OPERATIONAL_COPY });
  const { language } = useShellPreferences();
  const controller = useMemo(() => createSystemAuditController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? DEFAULT_SYSTEM_AUDIT_QUERY;
  const accepted = model?.query ?? DEFAULT_SYSTEM_AUDIT_QUERY;
  const actorLabel = (id: string) => model?.summary.actors.find(actor => actor.id === id)?.name ?? id;
  const revealFocus = useKeyboardFocusReveal();
  const root = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<LocalizedNotice | null>(null);
  const sequence = useRef(0);
  const intent = useRef(0);
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info', values?: LocalizedNotice['values']) => {
    // Keep source copy and arguments so an open notice follows language changes.
    setNotice({ message, values, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null) => {
    if (outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') notify(controller.getSnapshot().model ? "Chưa thể đọc nhật ký. Kết quả và điều kiện đã áp dụng được giữ nguyên." : "Chưa thể đọc nhật ký. Vui lòng thử lại.", origin, 'error');
    else if (outcome.result.kind === 'blocked' && outcome.result.reason !== 'FIXTURE_NOT_SELECTED') notify(outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
      ? "Chưa có nguồn cho kỳ vừa chọn. Đang giữ kỳ {v0}."
      : "Chưa thể áp dụng điều kiện vừa chọn. Đã giữ kết quả và điều kiện trước đó.", origin, 'info',
      { v0: auditPeriod(controller.getSnapshot().acceptedQuery?.period ?? DEFAULT_SYSTEM_AUDIT_QUERY.period) });
  }, [controller, notify]);
  useEffect(() => {
    let mounted = true;
    const token = ++intent.current;
    void controller.load(structuredClone(DEFAULT_SYSTEM_AUDIT_QUERY)).then(result => { if (mounted && token === intent.current) finish(result, null); });
    return () => { mounted = false; ++intent.current; controller.clear(); };
  }, [controller, finish]);
  const run = (operation: () => Operation) => {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++intent.current;
    setNotice(null);
    void operation().then(result => { if (token === intent.current) finish(result, origin); });
  };
  const update = (patch: Partial<SystemAuditQuery>) => run(() => controller.update(patch));
  const reset = () => run(() => controller.reset(structuredClone(DEFAULT_SYSTEM_AUDIT_QUERY)));
  const columns: TableColumn<SystemAuditRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'at', heading: tx("Thời gian"), sortKey: 'at', sortType: 'date', render: row => <time dateTime={row.at} className="s27-time">{formatAuditTime(row.at, language)}</time> },
    { id: 'actorName', heading: tx("Người thao tác"), sortKey: 'actorName', render: row => row.actorName ?? '—' },
    { id: 'eventType', heading: tx("Hành động"), render: row => <code className="s27-code">{row.eventType}</code> },
    { id: 'module', heading: tx("Phân hệ"), render: row => <span className="s27-muted" aria-label={tx("Chưa có nguồn phân hệ")}>{row.module ?? '—'}</span> },
    { id: 'id', heading: tx("Mã sự kiện"), sortKey: 'id', render: row => <code className="s27-code">{row.id}</code> },
    { id: 'detail', heading: tx("Chi tiết"), render: row => <div className="s27-detail"><span><b>{tx("Chứng từ")}</b><code>{row.documentId}</code></span><span><b>{tx("Biến động")}</b><code>{row.movementId}</code></span></div> },
  ];
  const activeFilters: { key: FilterKey; label: string }[] = [];
  if (accepted.search.trim()) activeFilters.push({ key: 'search', label: tx("Tìm: {v0}", { v0: accepted.search.trim() }) });
  if (accepted.eventType) activeFilters.push({ key: 'eventType', label: accepted.eventType });
  if (accepted.actorId) activeFilters.push({ key: 'actorId', label: actorLabel(accepted.actorId) });
  const sort = accepted.sortKey ? { key: accepted.sortKey, direction: accepted.sortDirection } : null;
  const toggleSort = (key: string) => {
    const sortKey = key as SystemAuditSortKey;
    update({ sortKey, sortDirection: query.sortKey === sortKey && query.sortDirection === 'asc' ? 'desc' : 'asc' });
  };
  return <GlobalShell title={tx("Nhật ký hệ thống")} variant="wms" sidebarTone="navy" contentWidth="wide" activeKey="S27" navigation={S00_SHELL_NAVIGATION}>
    <div ref={root} className="hn-catalogue-screen s27-screen" data-screen="S27" data-visual-variant="premium" data-presentation="default" onFocusCapture={revealFocus}>
      <CataloguePageHeader appearance="worklist" title={tx("Nhật ký hệ thống")} parentLabel={tx("Hệ thống")} breadcrumb={tx("Nhật ký hệ thống")}
        description={tx("Theo dõi các sự kiện đã ghi nhận trong phạm vi snapshot được cấp.")}
        actions={<DateRangePicker id="s27-period" label={tx("Phạm vi · Giờ Việt Nam")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} />} />
      <div className="s27-notice-slot" />
      {cohortControls}
      {model && <div className="s27-scope"><Icon name="info" size={15} />{model.source.detailTotal}{' '}{tx("sự kiện được cung cấp · Mốc dữ liệu")}{' '}{formatAuditTime(model.summary.snapshotAt, language)}{' '}{tx("· Không đại diện toàn bộ lịch sử hệ thống.")}</div>}
      {!model && <p className="s27-source-pending" role="status">{state.loading ? tx("Đang kiểm tra nguồn nhật ký…") : state.blocker?.reason === 'FIXTURE_NOT_SELECTED' ? tx("Chưa có nguồn nhật ký được chọn. Chưa hiển thị số kết quả hoặc phân trang; cần xác nhận tập dữ liệu và phạm vi trước khi sử dụng.") : tx("Chưa thể đọc nguồn nhật ký.")}</p>}
      {!model && state.error && !state.loading && <div><Button onClick={() => run(() => controller.load(query))}>{tx('Thử lại')}</Button></div>}
      <section className="s27-list" aria-labelledby="s27-list-title">
        <div className="s27-list-heading"><div><h2 id="s27-list-title">{tx("Danh sách sự kiện")}</h2><p>{tx("Nhật ký chỉ đọc · Phân hệ và nhãn hành động chưa có mapping xác nhận.")}</p></div>{model && <strong role="status" aria-live="polite">{model.pagination.total}{' '}{tx("kết quả")}</strong>}</div>
        <CatalogueToolbar id="s27-query" label={tx("Tìm và lọc nhật ký hệ thống")} layout="worklist" filterSizing="compact" searchLabel={tx("Tìm mã sự kiện, chứng từ, biến động hoặc người thao tác")} searchHint={tx("Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.")} searchPlaceholder={tx("Tìm trong nhật ký…")} searchValue={query.search} onSearchChange={search => update({ search })} onReset={reset} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={state.loading || state.debouncing}
          trailingControls={<><FilterSelect label={tx("Hành động")} value={query.eventType} onChange={event => update({ eventType: event.currentTarget.value })}><option value="">{tx("Tất cả hành động")}</option>{(model?.filterOptions.eventType ?? []).map(value => <option key={String(value)} value={String(value)}>{String(value)}</option>)}</FilterSelect><FilterSelect label={tx("Phân hệ")} value={query.module} disabled aria-describedby="s27-module-filter-help"><option value="">{tx("Tất cả phân hệ")}</option></FilterSelect><span id="s27-module-filter-help" className="hn-sr-only">{tx("Chưa có nguồn phân hệ để lọc; bộ lọc sẽ được mở khi mapping được xác nhận.")}</span><FilterSelect label={tx("Người thao tác")} value={query.actorId} onChange={event => update({ actorId: event.currentTarget.value })}><option value="">{tx("Tất cả người thao tác")}</option>{(model?.filterOptions.actorId ?? []).map(value => <option key={String(value)} value={String(value)}>{actorLabel(String(value))}</option>)}</FilterSelect></>}>
          {null}
        </CatalogueToolbar>
        <CatalogueActiveFilters items={activeFilters} onRemove={key => { const search = root.current?.querySelector<HTMLElement>('#s27-query-search'); search?.focus({ preventScroll: true }); if (search) revealControl(search); update({ [key]: '' }); }} />
        <p className="s27-scroll-hint">{tx("Bảng giữ đủ 7 cột; cuộn ngang trong bảng để xem các mã và chi tiết.")}</p>
        <DataTable caption={tx("Danh sách nhật ký hệ thống")} captionVisibility="sr-only" columns={columns} rows={model?.rows ?? []} rowKey={row => row.id} sort={sort} onSort={model ? toggleSort : undefined} appearance="refined" density="compact" sortIndicatorAppearance="quiet" stickyHeader scrollResetKey={JSON.stringify(model?.query)}
          emptyContent={model ? <div className="s27-no-result"><Icon name="search" size={26} /><strong>{tx("Không tìm thấy sự kiện phù hợp")}</strong><span>{tx("Thử từ khóa khác hoặc bỏ bớt điều kiện lọc.")}</span></div> : undefined} busy={state.loading || state.debouncing} />
        <div className="s27-footer">{model && <Pagination variant="products" unit={tx("sự kiện")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus />}<p><Icon name="info" size={15} />{tx("Chi tiết chỉ hiển thị các mã có nguồn; Mở nguồn chưa có đích hoặc quyền xác nhận.")}</p></div>
      </section>
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message, notice.values) }} onClose={() => setNotice(null)} protectedContentSelector=".s27-list,.s27-scope" resolveInlineSlot={origin => root.current?.querySelector<HTMLElement>(origin?.closest('.hn-catalogue-toolbar') ? '[data-feedback-slot="query"]' : '.s27-notice-slot') ?? null} resolveFocusFallback={() => root.current?.querySelector<HTMLInputElement>('#s27-query-search') ?? null} revealInlineOnOpen />}
    </div>
  </GlobalShell>;
}
