import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createTraceController } from '../../controllers/goods-trace-controller';
import { DEFAULT_TRACE_QUERY as defaults, tracePeriod, type TraceAdapter, type TraceQuery, type TraceRow, type TraceSortKey } from '../../contracts/goods-trace-report';
import { Button, CatalogueActiveFilters, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, Pagination, ReportEmptyState, getReportEmptyReason, reportReadErrorMessage, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { TraceCharts } from './TraceCharts';
import './goods-trace.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalTrace, OPERATIONAL_TRACE_COPY } from './OperationalTrace';
import type { TraceReader } from './trace-binding';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

type Operation = ReturnType<ReturnType<typeof createTraceController>['load']>;
type FilterKey = 'search' | 'status' | 'needsReview';
export function GoodsTraceScreen({ adapter, operationalAdapter }: { adapter?: TraceAdapter; operationalAdapter?: TraceReader } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const operationalTx = useUiCopy(OPERATIONAL_TRACE_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S26' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => IS_BROWSER_PREVIEW ? 'legacy' : operational.available ? 'scenario' : 'legacy');
  const cohortControl = operational.available && <FilterSelect label={operationalTx('Nguồn dữ liệu')} aria-label={operationalTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{operationalTx('Phiên hiện tại')}</option><option value="legacy">{operationalTx('Dữ liệu đã duyệt')}</option></FilterSelect>;
  const controller = useMemo(() => createTraceController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [wideTable, setWideTable] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const sequence = useRef(0), intent = useRef(0);
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body }), []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      if (controller.getSnapshot().model) notify(reportReadErrorMessage(true), origin, 'error');
      else setInitialReadFailed(true);
    } else if (outcome.result.kind === 'blocked') {
      const message = outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${tracePeriod(controller.getSnapshot().acceptedQuery?.period ?? defaults.period)}.`
        : 'Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.';
      if (controller.getSnapshot().model) notify(message, origin);
      else setInitialReadFailed(true);
    } else {
      setInitialReadFailed(false);
    }
  }, [controller, notify]);
  useEffect(() => {
    if (cohort !== 'legacy') return;
    let mounted = true; const token = ++intent.current;
    void controller.load(structuredClone(defaults)).then(result => { if (mounted) finish(result, null, token); });
    return () => { mounted = false; ++intent.current; controller.clear(); };
  }, [controller, finish, cohort]);
  const ready = Boolean(model);
  useLayoutEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    let frame: number | null = null;
    const measure = () => {
      setWideTable(region.clientWidth >= 720);
      const next = { left: region.scrollLeft > 1, right: region.scrollWidth - region.clientWidth - region.scrollLeft > 1 };
      if (!next.left && !next.right && document.activeElement?.closest('.s26-scroll-tools')) region.focus({ preventScroll: true });
      setEdges(old => old.left === next.left && old.right === next.right ? old : next);
    };
    const resize = () => {
      measure(); if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && screen.current?.contains(active) && active.matches(':focus-visible')
          && !document.querySelector('dialog[open], .hn-header-popup, .hn-date-picker__popup[data-open="true"]')) revealControl(active);
      });
    };
    const observer = new ResizeObserver(resize); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); if (frame !== null) cancelAnimationFrame(frame); };
  }, [ready, cohort]);
  function run(operation: () => Operation) {
    const token = ++intent.current, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice(null); void operation().then(result => finish(result, origin, token));
  }
  const update = (patch: Partial<TraceQuery>) => run(() => controller.update(patch));
  function retryRead() {
    run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)));
  }
  function guard(row: TraceRow, origin: HTMLElement) {
    recordReviewDiagnostic({ kind: 'blocked-action', key: `S26:${row.sku}`, detail: 'Journey route and event/actor relationships are unconfirmed.' });
    notify(`Xem hành trình ${row.sku} hiện chưa khả dụng.`, origin);
  }
  const columns: TableColumn<TraceRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'sku', heading: tx('SKU'), sortKey: 'sku', render: row => <strong className="s26-code">{row.sku}</strong> },
    { id: 'name', heading: tx('Tên hàng hóa'), sortKey: 'name', render: row => <span className="s26-name">{row.name}</span> },
    { id: 'serial', heading: tx('Serial'), sortKey: 'serial', render: row => <span className="s26-code">{tx(row.serial || '—')}</span> },
    { id: 'lot', heading: tx('Lô'), sortKey: 'lot', render: row => <span className="s26-code">{tx(row.lot || '—')}</span> },
    { id: 'pallet', heading: tx('Pallet'), sortKey: 'pallet', render: row => <span className="s26-code">{tx(row.pallet || '—')}</span> },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'Cần kiểm tra' ? 'warning' : row.status === 'Đang tồn kho' ? 'success' : 'neutral'}>{tx(row.status)}</StatusBadge> },
    { id: 'location', heading: tx('Vị trí'), sortKey: 'location', render: row => row.location ?? <span aria-label={tx("Chưa có vị trí")}>{tx("—")}</span> },
    { id: 'lastEvent', heading: tx('Sự kiện gần nhất'), sortKey: 'lastEvent', render: row => tx(row.lastEvent) },
    { id: 'updatedAt', heading: tx('Cập nhật'), sortKey: 'updatedAt', sortType: 'date', render: row => <time dateTime={row.updatedAt} className="s26-time"><span>{tx(formatBusinessTimestamp(row.updatedAt, language).split(' · ')[0])}</span><span>{tx(formatBusinessTimestamp(row.updatedAt, language).split(' · ')[1])}</span></time> },
    { id: 'completeness', heading: tx('Độ đầy đủ'), sortKey: 'completeness', sortType: 'number', align: 'end', render: row => <span className="s26-completeness" data-review={row.status === 'Cần kiểm tra'}>{row.completeness}{tx("%")}</span> },
    { id: 'actions', heading: tx('Xem'), kind: 'actions', render: row => <Button variant="ghost" iconOnly aria-label={tx(`Xem hành trình ${row.sku}`)} aria-disabled="true" aria-describedby="s26-action-limit" onClick={event => guard(row, event.currentTarget)}><Icon name="eye" /></Button> },
  ];
  const activeFilters: { key: FilterKey; label: string }[] = [];
  if (model?.query.search.trim()) activeFilters.push({ key: 'search', label: tx(`Tìm: ${model.query.search.trim()}`) });
  if (model?.query.status) activeFilters.push({ key: 'status', label: `${tx('Trạng thái')}: ${tx(model.query.status)}` });
  if (model?.query.needsReview) activeFilters.push({ key: 'needsReview', label: tx('Cần kiểm tra trong danh sách') });
  function focusSearch() {
    const target = screen.current?.querySelector<HTMLInputElement>('#s26-query-search');
    target?.focus({ preventScroll: true }); if (target) revealControl(target);
  }
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    region?.scrollBy({ left: direction * Math.max(160, region.clientWidth * .7), behavior: 'instant' });
  }
  if (cohort === 'scenario') return <GlobalShell title={tx('Truy vết hàng hóa')} variant="wms" activeKey="S26" navigation={S00_SHELL_NAVIGATION}><div className="hn-catalogue-screen s26-screen" data-screen="S26" ref={screen} onFocusCapture={revealFocus}><CataloguePageHeader appearance="worklist" title={tx('Truy vết hàng hóa')} parentLabel={tx('Báo cáo & Thống kê')} breadcrumb={tx('Truy vết hàng hóa')} />{cohortControl}<OperationalTrace adapter={operational} /></div></GlobalShell>;
  return <GlobalShell title={tx("Truy vết hàng hóa")} variant="wms" activeKey="S26" navigation={S00_SHELL_NAVIGATION}>
    <div ref={screen} className="hn-catalogue-screen s26-screen" data-screen="S26" data-visual-variant="premium" data-presentation="premium" onFocusCapture={revealFocus}>
      {cohortControl}
      <CataloguePageHeader appearance="worklist" title={tx("Truy vết hàng hóa")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Truy vết hàng hóa")}
        actions={<div className="s26-period"><DateRangePicker id="s26-period" label={tx("Kỳ báo cáo · Giờ Việt Nam")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></div>} />
      <div className="s26-period-notice" data-s26-notice="period" />
      {model && <>
        <section className="s26-overview" aria-label={tx('Tổng hợp toàn kỳ {period}', { period: formatBusinessPeriod(model.query.period, language) })}>
          <CatalogueSummary label={tx("Tổng hợp truy vết toàn kỳ")} columns={4} density="compact">
            <SummaryMetric label={tx("Hàng hóa truy vết")} value={model.summary.total} detail={tx("toàn kỳ")} icon="box" />
            <SummaryMetric label={tx("Sự kiện ghi nhận")} value={model.summary.events} detail={tx("sự kiện")} icon="documents" />
            <SummaryMetric label={tx("Cần kiểm tra")} value={<span className="s26-warning-number">{model.summary.needsReview}</span>} detail={tx("toàn kỳ")} icon="alert-triangle" />
            <SummaryMetric label={tx("Đủ lịch sử")} value={formatDeclaredPercentage(model.summary.qualityRate, language)} detail={tx("tỷ lệ toàn kỳ")} icon="circle-check" />
          </CatalogueSummary>
          <p className="s26-summary-scope"><Icon name="info" size={14} />{tx("Số liệu toàn kỳ · Không thay đổi theo bộ lọc danh sách")}</p>
        </section>
        <section ref={list} className="s26-list hn-premium-panel" aria-labelledby="s26-list-title">
          <div className="s26-list-heading"><div className="s26-list-title"><span className="s26-section-icon" aria-hidden="true"><Icon name="search" /></span><h2 id="s26-list-title">{tx("Tra cứu hàng hóa")}</h2></div><p className="s26-result-count" role="status" aria-live="polite" aria-atomic="true"><b>{model.pagination.total}</b> {tx("/")} {model.source.detailTotal} {tx("hàng hóa trong tập chi tiết")}</p></div>
          <div className="s26-filters"><CatalogueToolbar id="s26-query" label={tx("Tìm và lọc hàng hóa")} layout="worklist" filterSizing="compact" searchLabel={tx("Tìm SKU, tên, Serial, Lô hoặc Pallet")} searchHint={tx("Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.")} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => run(() => controller.reset(structuredClone(defaults)))} searchPlaceholder={tx("Tìm SKU, tên, Serial, Lô hoặc Pallet…")} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={state.loading || state.debouncing}
            trailingControls={<FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.currentTarget.value as TraceQuery['status'] })}><option value="">{tx("Tất cả trạng thái")}</option>{model.filterOptions.status.map(status => <option key={status} value={status}>{tx(status)}</option>)}</FilterSelect>}>
            {null}
          </CatalogueToolbar><CatalogueActiveFilters items={activeFilters} onRemove={key => { focusSearch(); update(key === 'needsReview' ? { needsReview: false } : { [key]: '' }); }} /></div>
          <div className="s26-table-context"><div className="s26-context-start"><Button variant={query.needsReview ? 'primary' : 'secondary'} aria-pressed={query.needsReview} leadingIcon={<Icon name="filter" />} onClick={() => update({ needsReview: !query.needsReview })}>{tx("Cần kiểm tra trong danh sách")}</Button><span className="s26-code-type">{tx("Loại mã:")} <strong>{tx("Tất cả")}</strong></span></div>{(edges.left || edges.right) && <div className="s26-scroll-tools"><span>{tx("Cuộn xem thêm cột")}</span><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-disabled={!edges.left} onClick={() => { if (edges.left) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-disabled={!edges.right} onClick={() => { if (edges.right) scrollTable(1); }}><Icon name="chevron-right" /></Button></div>}</div>
          <DataTable caption={tx("Danh sách truy vết hàng hóa")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.sku}
            sort={model.query.sortKey ? { key: model.query.sortKey, direction: model.query.sortDirection } : null} onSort={key => update({ sortKey: key as TraceSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })}
            appearance="refined" density="compact" sortIndicatorAppearance="quiet" rowActionAppearance="quiet" stickyHeader stickyColumnIds={wideTable ? ['ordinal', 'sku', 'name'] : ['sku']} scrollResetKey={JSON.stringify(model.query)} busy={state.loading || state.debouncing}
            emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("hàng hóa")} /> : null} />
          <div data-s26-notice="table" />
          <div className="s26-pagination"><Pagination variant="products" unit={tx("hàng hóa")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus /></div>
          <div className="s26-list-footer"><p className="s26-action-limit" id="s26-action-limit"><Icon name="info" size={16} />{tx("Xem hành trình hiện chưa khả dụng.")}</p><ReportExcelButton screen="S26" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div>
          <div data-s26-notice="export" />
        </section>
        <section className="s26-analytics" aria-labelledby="s26-analytics-title">
          <div className="s26-analytics-heading"><div><h2 id="s26-analytics-title">{tx("Tổng quan kỳ báo cáo")}</h2><p>{formatBusinessPeriod(model.query.period, language)} {tx("·")} {model.summary.needsReview} {tx("cần kiểm tra toàn kỳ:")} {model.summary.missingEvents} {tx("thiếu sự kiện,")} {model.summary.statusMismatch} {tx("lệch trạng thái")}</p></div><Button variant="ghost" aria-expanded={analyticsOpen} aria-controls="s26-analytics-body" trailingIcon={<Icon name={analyticsOpen ? 'arrow-up' : 'arrow-down'} />} onClick={() => setAnalyticsOpen(open => !open)}>{tx(analyticsOpen ? 'Thu gọn thống kê' : 'Xem thống kê')}</Button></div>
          <div id="s26-analytics-body" className="s26-analytics-body" hidden={!analyticsOpen}><TraceCharts summary={tx(model.summary)} /></div>
        </section>
      </>}
      {!model && <section className="hn-report-read-state" aria-busy={state.loading}>
        <p role={state.error && !state.loading ? 'alert' : 'status'}>{tx(state.loading ? 'Đang đọc báo cáo…' : state.error ? reportReadErrorMessage(false) : state.blocker ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn.' : 'Chưa thể tải báo cáo.')}</p>
        {(initialReadFailed || Boolean(state.blocker)) && <Button variant="secondary" loading={state.loading} onClick={retryRead}>{tx("Thử lại")}</Button>}
      </section>}
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} protectedContentSelector=".s26-overview,.s26-filters" resolveInlineSlot={origin => screen.current?.querySelector<HTMLElement>(origin?.closest('.s26-period') ? '[data-s26-notice="period"]' : origin?.closest('.s26-list-footer') ? '[data-s26-notice="export"]' : origin?.closest('.hn-table') ? '[data-s26-notice="table"]' : '[data-feedback-slot="query"]') ?? null} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s26-period') ?? null} revealInlineOnOpen />}
    </div>
  </GlobalShell>;
}
