import { PageState } from '../../shared/PageState';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createInboundReportController } from '../../controllers/inbound-report-controller';
import { DEFAULT_INBOUND_REPORT_QUERY as defaults, inboundReportDateLabel, type InboundReportAdapter, type InboundReportQuery, type InboundReportRow, type InboundReportSortKey, type InboundReportStatus } from '../../contracts/inbound-report';
import { Button, CatalogueActiveFilters, CatalogueListHeader, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, ReportEmptyState, ReportScopeNote, getReportEmptyReason, reportReadErrorMessage, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { ReportCompactSort, type ReportCompactSortOption } from '../../shared/report-compact-sort';
import { InboundReportCharts } from './InboundReportCharts';
import './inbound-report.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalInboundReport, INBOUND_BINDING_COPY } from './OperationalInboundReport';
import { useUiCopy } from '../../i18n/use-ui-copy';
import type { InboundOperationalReader } from './inbound-binding';

type Operation = ReturnType<ReturnType<typeof createInboundReportController>['load']>;
const statusTone = (status: InboundReportStatus) => status === 'Hoàn tất' ? 'success' : status === 'Chờ duyệt' ? 'warning' : 'neutral';
const compactSortOptions = [
  { key: 'code', label: 'Mã phiếu', orders: ['A → Z', 'Z → A'] },
  { key: 'receivedDate', label: 'Ngày nhập', orders: ['Cũ nhất', 'Mới nhất'] },
  { key: 'supplier', label: 'Nhà cung cấp', orders: ['A → Z', 'Z → A'] },
  { key: 'receivedQuantity', label: 'SL thực nhập', orders: ['Tăng dần', 'Giảm dần'] },
  { key: 'status', label: 'Trạng thái', orders: ['A → Z', 'Z → A'] },
  { key: 'creator', label: 'Người tạo', orders: ['A → Z', 'Z → A'] },
] as const satisfies readonly ReportCompactSortOption<InboundReportSortKey>[];

export function InboundReportScreen({ adapter, operationalAdapter }: { adapter?: InboundReportAdapter; operationalAdapter?: InboundOperationalReader } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const bindingTx = useUiCopy(INBOUND_BINDING_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S18' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createInboundReportController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  const [compact, setCompact] = useState(false), [overflows, setOverflows] = useState(false);
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null), intent = useRef(0), sequence = useRef(0);
  const revealFocus = useKeyboardFocusReveal();
  const ready = Boolean(model);
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const touch = matchMedia('(pointer: coarse)');
    const measure = () => setCompact(element.clientWidth < 1120 || touch.matches);
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    touch.addEventListener('change', measure);
    return () => { observer.disconnect(); touch.removeEventListener('change', measure); };
  }, [ready, cohort]);
  useEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => setOverflows(region.scrollWidth > region.clientWidth + 1);
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    return () => observer.disconnect();
  }, [ready, compact, cohort]);
  useLayoutEffect(() => {
    const previous = lastFocused.current;
    // Filtered-out rows may lose their focused DOM node.
    // Never reclaim focus from a newer control, Notice, Drawer or other modal.
    if (previous && (!previous.isConnected || !previous.getClientRects().length)
      && (document.activeElement === document.body || document.activeElement === previous)
      && !document.querySelector('dialog[open],.hn-header-popup,.hn-date-picker__popup[data-open="true"]')) {
      const fallback = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
      fallback?.focus({ preventScroll: true }); if (fallback) revealControl(fallback);
    }
  }, [compact, model]);
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      if (controller.getSnapshot().model) notify(reportReadErrorMessage(true), origin, 'error');
      else setInitialReadFailed(true);
    } else if (outcome.result.kind === 'blocked') {
      const period = controller.getSnapshot().acceptedQuery?.period ?? defaults.period;
      const message = outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${inboundReportDateLabel(period.from)} – ${inboundReportDateLabel(period.to)}.`
        : 'Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.';
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S18:${outcome.result.reason}`, detail: outcome.result.detail });
      if (controller.getSnapshot().model) notify(message, origin);
      else setInitialReadFailed(true);
    } else {
      setInitialReadFailed(false);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true; const token = ++intent.current;
    void controller.load(structuredClone(defaults)).then(outcome => { if (active) finish(outcome, null, token); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  function run(operation: () => Operation) {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++intent.current; setNotice(null); void operation().then(outcome => finish(outcome, origin, token));
  }
  function update(patch: Partial<InboundReportQuery>) { run(() => controller.update(patch)); }
  function retryRead() {
    run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)));
  }
  function blockedAction(label: string, origin: HTMLElement) {
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S18:FLOW_NOT_SUPPLIED', detail: `${label}: no assigned detail/export flow.` });
    notify(`${label} chưa khả dụng.`, origin);
  }
  const columns: TableColumn<InboundReportRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'code', heading: tx('Mã phiếu'), sortKey: 'code', render: row => <div className="s18-cell"><strong>{row.code}</strong></div> },
    { id: 'receivedDate', heading: tx('Ngày nhập'), sortKey: 'receivedDate', sortType: 'date', render: row => formatBusinessDate(row.receivedDate, language) },
    { id: 'supplier', heading: tx('Nhà cung cấp'), sortKey: 'supplier', render: row => <div className="s18-cell"><span>{row.supplier}</span></div> },
    { id: 'receivedQuantity', heading: tx('SL thực nhập'), sortKey: 'receivedQuantity', sortType: 'number', align: 'end', render: row => <span className="s18-number">{tx(row.receivedQuantity?.toLocaleString(tx('vi-VN')) ?? '—')}</span> },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={statusTone(row.status)}>{tx(row.status)}</StatusBadge> },
    { id: 'creator', heading: tx('Người tạo'), sortKey: 'creator', render: row => row.creator },
    { id: 'action', heading: tx('Xem'), kind: 'actions', align: 'end', render: row => <Button variant="ghost" className="s18-view" aria-disabled="true" aria-label={tx(`Xem ${row.code}`)} aria-describedby="s18-flow-limit" onClick={event => blockedAction(`Xem ${row.code}`, event.currentTarget)}><Icon name="eye" size={18} /><span>{tx("Xem")}</span></Button> },
  ];
  const activeFilters = model ? ([
    { key: 'search', label: tx(model.query.search.trim() ? `Tìm: ${model.query.search.trim()}` : '') },
    { key: 'supplier', label: model.query.supplier },
    { key: 'status', label: tx(model.query.status) },
  ] as const).filter(item => item.label) : [];
  const hiddenSortLabels: Partial<Record<InboundReportSortKey, string>> = { code: 'Mã phiếu', receivedDate: 'Ngày nhập', supplier: 'Nhà cung cấp', creator: 'Người tạo' };
  const hiddenSortLabel = compact && model ? hiddenSortLabels[model.query.sortKey] : undefined;
  const sortOrder = model?.query.sortKey === 'receivedDate'
    ? model.query.sortDirection === 'asc' ? 'cũ đến mới' : 'mới đến cũ'
    : model?.query.sortKey === 'receivedQuantity'
      ? model.query.sortDirection === 'asc' ? 'tăng dần' : 'giảm dần'
      : model?.query.sortDirection === 'asc' ? 'A → Z' : 'Z → A';
  function removeFilter(key: 'search' | 'supplier' | 'status') {
    // The removed chip must not leave keyboard focus on the document.
    screen.current?.querySelector<HTMLInputElement>('#s18-search')?.focus({ preventScroll: true });
    update({ [key]: '' });
  }
  const inlineSlot = (origin: HTMLElement | null) => screen.current?.querySelector<HTMLElement>(origin?.closest('.s18-period') ? '[data-s18-notice="period"]' : origin?.closest('.hn-page-heading') ? '[data-s18-notice="heading"]' : '[data-s18-notice="list"]') ?? null;
  return <GlobalShell title={tx("Báo cáo nhập kho")} variant="wms" activeKey="S18" navigation={S00_SHELL_NAVIGATION}>
    <div className="hn-catalogue-screen s18-screen" data-screen="S18" data-visual-variant="premium" ref={screen} onFocusCapture={event => { lastFocused.current = event.target.closest('.hn-notice') ? null : event.target as HTMLElement; revealFocus(event); }}>
      <div className="s18-header">
      <CataloguePageHeader appearance="compact" title={tx("Báo cáo nhập kho")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Nhập kho")} actions={cohort === 'legacy' ? <>
        <section className="s18-period" aria-label={tx("Kỳ báo cáo")}><DateRangePicker id="s18-period" label={tx("Kỳ báo cáo")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></section>
        <div className="s18-export"><ReportExcelButton screen="S18" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div>
      </> : undefined} />
      <div data-s18-notice="heading" />
      <div data-s18-notice="period" />
      </div>
      {cohort === 'legacy' && <span className="hn-sr-only" id="s18-flow-limit">{tx("Xem chi tiết hiện chưa khả dụng.")}</span>}
      {operational.available && <FilterSelect label={bindingTx('Nguồn dữ liệu')} aria-label={bindingTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{bindingTx('Phiên hiện tại')}</option><option value="legacy">{bindingTx('Dữ liệu đã duyệt')}</option></FilterSelect>}
      {cohort === 'scenario' ? <OperationalInboundReport adapter={operational} /> : model ? <>
        <ReportScopeNote summary={tx("Tổng hợp toàn kỳ")} detail={tx("Không thay đổi theo bộ lọc danh sách")} />
        <CatalogueSummary label={tx("Tổng hợp nhập kho toàn kỳ")} columns={4} density="compact">
          <SummaryMetric label={tx("Sản phẩm thực nhập")} value={<span className="s18-kpi-value">{model.summary.products.toLocaleString(tx('vi-VN'))}</span>} detail={tx("toàn kỳ")} icon="box" />
          <SummaryMetric label={tx("Phiếu hoàn tất")} value={<span className="s18-kpi-value">{model.summary.completed}{tx("/")}{model.summary.receipts}</span>} detail={<span className="s18-completion">{formatDeclaredPercentage(model.summary.completedPercentage, language)}</span>} icon="documents" />
          <SummaryMetric label={tx("Nhà cung cấp")} value={<span className="s18-kpi-value">{model.summary.suppliers}</span>} detail={tx("trong kỳ")} icon="building" />
          <SummaryMetric label={tx("Phiếu cần xử lý")} value={<span className="s18-kpi-value s18-kpi-attention">{model.summary.needsAttention}</span>} detail={tx("phiếu trong kỳ")} icon="history" />
        </CatalogueSummary>
        <InboundReportCharts summary={tx(model.summary)} />
        <section className="hn-premium-panel s18-panel s18-list" ref={list} aria-labelledby="s18-list-title" data-compact={compact}>
          <div className="s18-list-heading"><CatalogueListHeader id="s18-list-title" title={tx("Danh sách phiếu nhập")} count={tx(`${model.pagination.total} phiếu`)} density="compact" /><div className="s18-list-context"><span>{model.source.detailTotal} {tx("phiếu có dữ liệu chi tiết")}</span><span>{tx("Xem chi tiết chưa khả dụng")}</span>{hiddenSortLabel && <span className="s18-sort-context">{tx("Sắp xếp:")} {tx(hiddenSortLabel)} {tx("·")} {tx(sortOrder)}</span>}</div></div>
          <div className="s18-toolbar-wrap">
          <CatalogueToolbar id="s18" label={tx("Tìm kiếm và lọc phiếu nhập")} layout="worklist" searchLabel={tx("Tìm kiếm phiếu nhập")} searchHint={tx("Tìm theo mã phiếu hoặc nhà cung cấp; không phân biệt dấu, chữ hoa và khoảng trắng.")} searchHintMode="sr-only" searchPlaceholder={tx("Mã phiếu hoặc nhà cung cấp…")} searchValue={query.search} onSearchChange={search => update({ search })} applyMode="immediate" queryContext={null} onReset={() => run(() => controller.reset(structuredClone(defaults)))} busy={state.loading}>
            <FilterSelect label={tx("Nhà cung cấp")} value={query.supplier} onChange={event => update({ supplier: event.target.value })}><option value="">{tx("Tất cả")}</option>{model.filterOptions.supplier.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value as InboundReportQuery['status'] })}><option value="">{tx("Tất cả")}</option>{model.filterOptions.status.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
          </CatalogueToolbar>
          {compact && <ReportCompactSort id="s18-sort" value={{ sortKey: query.sortKey, sortDirection: query.sortDirection }} options={compactSortOptions.map(option => ({ ...option, label: tx(option.label), orders: [tx(option.orders[0]), tx(option.orders[1])] as const }))} onChange={(sortKey, sortDirection) => update({ sortKey, sortDirection })} />}
          {activeFilters.length > 0 && <div className="s18-filter-summary"><p role="status">{activeFilters.length} {tx("điều kiện đang áp dụng")}</p><CatalogueActiveFilters items={activeFilters} onRemove={removeFilter} /></div>}
          </div>
          <div data-s18-notice="list" />
          <NoticeSlot name="table" />
          <p className="s18-scroll-hint" hidden={!overflows}>{tx("Cuộn ngang trong bảng để xem đầy đủ thông tin.")}</p>
          <DataTable caption={tx("Danh sách phiếu nhập")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.renderKey} sort={{ key: model.query.sortKey, direction: model.query.sortDirection }} onSort={key => update({ sortKey: key as InboundReportSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} scrollResetKey={JSON.stringify(model.query)} busy={state.loading} stickyHeader stickyColumnIds={['code']} stickyEndColumnIds={['action']} emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("phiếu nhập")} /> : null} />
          <div className="s18-list-footer"><Pagination preserveBoundaryFocus variant="products" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} pageSizeOptions={model.pagination.pageSizeOptions} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} /><NoticeSlot name="pagination" /></div>
        </section>
      </> : <section className="hn-report-read-state" aria-busy={state.loading}>
        <PageState kind={state.loading?'loading':state.error?'error':'stale'} description={tx(state.loading ? 'Đang đọc báo cáo nhập kho…' : state.error ? reportReadErrorMessage(false) : state.blocker ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn.' : 'Chưa thể tải báo cáo.')} action={(initialReadFailed || Boolean(state.blocker)) && <Button variant="secondary" loading={state.loading} onClick={retryRead}>{tx("Thử lại")}</Button>}/>
      </section>}
      {cohort === 'legacy' && notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s18-search') ?? null} resolveInlineSlot={inlineSlot} revealInlineOnOpen protectedContentSelector=".s18-list,.s18-charts,.s18-screen .hn-catalogue-summary" />}
      </div>
  </GlobalShell>;
}
