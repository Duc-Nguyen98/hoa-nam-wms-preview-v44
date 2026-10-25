import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createOutboundReportController } from '../../controllers/outbound-report-controller';
import { DEFAULT_OUTBOUND_REPORT_QUERY as defaults, outboundReportDateLabel, type OutboundReportAdapter, type OutboundReportQuery, type OutboundReportRow, type OutboundReportSortKey, type OutboundReportStatus } from '../../contracts/outbound-report';
import { Button, CatalogueActiveFilters, CatalogueListHeader, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, ReportEmptyState, getReportEmptyReason, reportReadErrorMessage, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { ReportCompactSort, type ReportCompactSortOption } from '../../shared/report-compact-sort';
import { OutboundReportCharts } from './OutboundReportCharts';
import { outboundScrollEdges } from './outbound-report-presentation';
import './outbound-report.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalOutboundReport, OUTBOUND_BINDING_COPY } from './OperationalOutboundReport';
import { useUiCopy } from '../../i18n/use-ui-copy';
import type { OutboundOperationalReader } from './outbound-binding';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

type Operation = ReturnType<ReturnType<typeof createOutboundReportController>['load']>;
const statusTone = (status: OutboundReportStatus) => status === 'Đã xuất' ? 'success' : status === 'Chờ xử lý trên Web' ? 'warning' : 'neutral';
const compactSortOptions = [
  { key: 'code', label: 'Mã phiếu', orders: ['A → Z', 'Z → A'] },
  { key: 'shippedDate', label: 'Ngày xuất', orders: ['Cũ nhất', 'Mới nhất'] },
  { key: 'customer', label: 'Khách hàng', orders: ['A → Z', 'Z → A'] },
  { key: 'shippedQuantity', label: 'SL thực xuất', orders: ['Tăng dần', 'Giảm dần'] },
  { key: 'status', label: 'Trạng thái', orders: ['A → Z', 'Z → A'] },
  { key: 'creator', label: 'Người tạo', orders: ['A → Z', 'Z → A'] },
] as const satisfies readonly ReportCompactSortOption<OutboundReportSortKey>[];

export function OutboundReportScreen({ adapter, operationalAdapter }: { adapter?: OutboundReportAdapter; operationalAdapter?: OutboundOperationalReader } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const bindingTx = useUiCopy(OUTBOUND_BINDING_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S19' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => IS_BROWSER_PREVIEW ? 'legacy' : operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createOutboundReportController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  const [compact, setCompact] = useState(false), [overflows, setOverflows] = useState(false);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null), intent = useRef(0), sequence = useRef(0);
  const revealFocus = useKeyboardFocusReveal(), ready = Boolean(model);
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
    const measure = () => {
      const edges = outboundScrollEdges(region.scrollLeft, region.clientWidth, region.scrollWidth);
      setOverflows(edges.left || edges.right);
      setScrollEdges(current => current.left === edges.left && current.right === edges.right ? current : edges);
    };
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [ready, compact, cohort]);
  useLayoutEffect(() => {
    const previous = lastFocused.current;
    if (previous && (!previous.isConnected || !previous.getClientRects().length)
      && (document.activeElement === document.body || document.activeElement === previous)
      && !document.querySelector('dialog[open],.hn-header-popup,.hn-date-picker__popup[data-open="true"]')) {
      const column = previous.closest<HTMLElement>('[data-column]')?.dataset.column;
      const fallback = (column ? list.current?.querySelector<HTMLElement>(`th[data-column="${column}"] button`) : null)
        ?? list.current?.querySelector<HTMLElement>('.hn-table-scroll');
      fallback?.focus({ preventScroll: true }); if (fallback) revealControl(fallback);
    }
  }, [compact, model, overflows]);
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (region) region.scrollBy({ left: direction * Math.max(160, region.clientWidth * .65), behavior: 'instant' });
  }
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
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${outboundReportDateLabel(period.from)} – ${outboundReportDateLabel(period.to)}.`
        : 'Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.';
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S19:${outcome.result.reason}`, detail: outcome.result.detail });
      if (controller.getSnapshot().model) notify(message, origin);
      else setInitialReadFailed(true);
    } else {
      setInitialReadFailed(false);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true; const token = ++intent.current;
    void controller.load(structuredClone(defaults)).then(outcome => { if (active) finish(outcome, null, token); });
    return () => { active = false; ++intent.current; controller.clear(); };
  }, [controller, finish]);
  function run(operation: () => Operation) {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++intent.current; setNotice(null); void operation().then(outcome => finish(outcome, origin, token));
  }
  function update(patch: Partial<OutboundReportQuery>) { run(() => controller.update(patch)); }
  function retryRead() {
    run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)));
  }
  function blockedAction(label: string, origin: HTMLElement) {
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S19:FLOW_NOT_SUPPLIED', detail: `${label}: no assigned detail/export flow.` });
    notify(`${label} hiện chưa khả dụng.`, origin);
  }
  const columns: TableColumn<OutboundReportRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'code', heading: tx('Mã phiếu'), sortKey: 'code', sortLabel: tx('Mã phiếu'), render: row => <div className="s19-cell"><strong>{row.code}</strong></div> },
    { id: 'shippedDate', heading: tx('Ngày xuất'), sortKey: 'shippedDate', sortType: 'date', render: row => formatBusinessDate(row.shippedDate, language) },
    { id: 'customer', heading: tx('Khách hàng'), sortKey: 'customer', sortLabel: tx('Khách hàng'), render: row => <div className="s19-cell"><span className="s19-customer">{row.customer}</span></div> },
    { id: 'shippedQuantity', heading: tx('SL thực xuất'), sortKey: 'shippedQuantity', sortType: 'number', align: 'end', render: row => row.shippedQuantity === null ? <span className="s19-unconfirmed">{tx("Chưa xác nhận")}</span> : <span className="s19-number">{row.shippedQuantity.toLocaleString(tx('vi-VN'))}</span> },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={statusTone(row.status)}>{tx(row.status)}</StatusBadge> },
    { id: 'creator', heading: tx('Người tạo'), sortKey: 'creator', render: row => <span className="s19-creator">{row.creator}</span> },
    { id: 'action', heading: tx('Xem'), kind: 'actions', align: 'end', render: row => <Button variant="ghost" leadingIcon={<Icon name="eye" size={18} />} aria-disabled="true" aria-label={tx(`Xem ${row.code}`)} aria-describedby="s19-flow-limit" onClick={event => blockedAction(`Xem ${row.code}`, event.currentTarget)}>{tx("Xem")}</Button> },
  ];
  const activeFilters = model ? ([
    { key: 'search', label: tx(model.query.search.trim() ? `Tìm: ${model.query.search.trim()}` : '') },
    { key: 'customer', label: model.query.customer }, { key: 'status', label: tx(model.query.status) },
  ] as const).filter(item => item.label) : [];
  const compactSortLabel = compact && model ? ({ shippedDate: 'Ngày xuất', creator: 'Người tạo' } as Partial<Record<OutboundReportSortKey, string>>)[model.query.sortKey] : undefined;
  const sortOrder = model?.query.sortKey === 'shippedDate'
    ? model.query.sortDirection === 'asc' ? 'cũ đến mới' : 'mới đến cũ'
    : model?.query.sortKey === 'shippedQuantity'
      ? model.query.sortDirection === 'asc' ? 'tăng dần' : 'giảm dần'
      : model?.query.sortDirection === 'asc' ? 'A → Z' : 'Z → A';
  function removeFilter(key: 'search' | 'customer' | 'status') {
    screen.current?.querySelector<HTMLInputElement>('#s19-search')?.focus({ preventScroll: true });
    update({ [key]: '' });
  }
  const inlineSlot = (origin: HTMLElement | null) => screen.current?.querySelector<HTMLElement>(origin?.closest('.hn-page-heading') ? '[data-s19-notice="heading"]' : '[data-s19-notice="list"]') ?? null;
  return <GlobalShell title={tx("Báo cáo xuất kho")} variant="wms" activeKey="S19" navigation={S00_SHELL_NAVIGATION}>
    <div className="hn-catalogue-screen s19-screen" data-screen="S19" data-visual-variant="premium" ref={screen} onFocusCapture={event => { lastFocused.current = event.target.closest('.hn-notice') ? null : event.target as HTMLElement; revealFocus(event); }}>
      <div className="s19-header">
        <CataloguePageHeader appearance="compact" title={tx("Báo cáo xuất kho")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Xuất kho")} actions={cohort === 'legacy' ? <>
          <section className="s19-period" aria-label={tx("Kỳ báo cáo")}><DateRangePicker id="s19-period" label={tx("Kỳ báo cáo")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></section>
          <div className="s19-export"><ReportExcelButton screen="S19" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div>
        </> : undefined} />
        <div data-s19-notice="heading" />
      </div>
      {operational.available && <FilterSelect label={bindingTx('Nguồn dữ liệu')} aria-label={bindingTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{bindingTx('Phiên hiện tại')}</option><option value="legacy">{bindingTx('Dữ liệu đã duyệt')}</option></FilterSelect>}
      {cohort === 'scenario' ? <OperationalOutboundReport adapter={operational} /> : model ? <>
        <section className="s19-overview" aria-labelledby="s19-overview-title">
          <div className="s19-overview-caption"><h2 id="s19-overview-title">{tx("Tổng hợp toàn kỳ")}</h2><p>{tx("Không thay đổi theo bộ lọc danh sách")}</p></div>
          <div className="s19-metrics-layout">
            <CatalogueSummary label={tx("Kết quả xuất kho toàn kỳ")} columns={2}>
              <SummaryMetric label={tx("Sản phẩm thực xuất")} value={model.summary.products.toLocaleString(tx('vi-VN'))} detail={tx("sản phẩm")} icon="box" />
              <SummaryMetric label={tx("Phiếu đã xuất")} value={<>{model.summary.shipped}<span className="s19-metric-denominator">{tx("/")}{model.summary.receipts}</span></>} detail={tx("phiếu trong kỳ")} icon="documents" />
            </CatalogueSummary>
            <div className="s19-pipeline">
              <CatalogueSummary label={tx("Phiếu đang xử lý trong kỳ")} columns={2} density="compact">
                <SummaryMetric label={tx("Đang đóng hàng")} value={model.summary.packing} detail={tx("phiếu")} />
                <SummaryMetric label={tx("Chờ xử lý trên Web")} value={model.summary.waiting} detail={tx("phiếu")} />
              </CatalogueSummary>
            </div>
          </div>
        </section>
        <OutboundReportCharts summary={tx(model.summary)} />
        <section className="hn-premium-panel s19-panel s19-list" ref={list} aria-labelledby="s19-list-title" data-compact={compact}>
          <div className="s19-list-heading"><CatalogueListHeader id="s19-list-title" title={tx("Danh sách phiếu xuất")} count={tx(`${model.pagination.total} kết quả`)} density="compact" /><div className="s19-list-context"><span>{tx("Tra cứu trên")} {model.source.detailTotal} {tx("phiếu có dữ liệu chi tiết")}</span>{compactSortLabel && <span>{tx("Sắp xếp:")} {tx(compactSortLabel)} {tx("·")} {tx(sortOrder)}</span>}</div></div>
          <div className="s19-toolbar-wrap">
            <CatalogueToolbar id="s19" label={tx("Tìm kiếm và lọc phiếu xuất")} layout="worklist" searchLabel={tx("Tìm kiếm phiếu xuất")} searchHint={tx("Tìm theo mã phiếu hoặc khách hàng; không phân biệt dấu, chữ hoa và khoảng trắng.")} searchHintMode="sr-only" searchPlaceholder={tx("Tìm mã phiếu hoặc khách hàng…")} searchValue={query.search} onSearchChange={search => update({ search })} applyMode="immediate" queryContext={null} onReset={() => run(() => controller.reset(structuredClone(defaults)))} busy={state.loading}>
              <FilterSelect label={tx("Khách hàng")} value={query.customer} onChange={event => update({ customer: event.target.value })}><option value="">{tx("Tất cả")}</option>{model.filterOptions.customer.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
              <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value as OutboundReportQuery['status'] })}><option value="">{tx("Tất cả")}</option>{model.filterOptions.status.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            </CatalogueToolbar>
            {compact && <ReportCompactSort id="s19-sort" value={{ sortKey: query.sortKey, sortDirection: query.sortDirection }} options={compactSortOptions.map(option => ({ ...option, label: tx(option.label), orders: [tx(option.orders[0]), tx(option.orders[1])] as const }))} onChange={(sortKey, sortDirection) => update({ sortKey, sortDirection })} />}
            {activeFilters.length > 0 && <div className="s19-filter-summary"><p role="status">{model.pagination.total} {tx("kết quả ·")} {activeFilters.length} {tx("điều kiện đang áp dụng")}</p><CatalogueActiveFilters items={activeFilters} onRemove={removeFilter} /></div>}
          </div>
          <div data-s19-notice="list" /><NoticeSlot name="table" />
          <div className="s19-scroll-tools" hidden={!overflows}>
            <p className="s19-scroll-hint">{tx("Cuộn ngang để xem đủ thông tin. Mã phiếu được giữ cố định.")}</p>
            <div role="group" aria-label={tx("Cuộn ngang danh sách phiếu xuất")}>
              <Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s19-table-region" aria-disabled={!scrollEdges.left} onClick={() => { if (scrollEdges.left) scrollTable(-1); }}><Icon name="chevron-left" size={18} /></Button>
              <Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s19-table-region" aria-disabled={!scrollEdges.right} onClick={() => { if (scrollEdges.right) scrollTable(1); }}><Icon name="chevron-right" size={18} /></Button>
            </div>
          </div>
          <div id="s19-table-region">
          <DataTable caption={tx("Danh sách phiếu xuất")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.renderKey} sort={{ key: model.query.sortKey, direction: model.query.sortDirection }} onSort={key => update({ sortKey: key as OutboundReportSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} scrollResetKey={JSON.stringify(model.query)} busy={state.loading} stickyHeader stickyColumnIds={overflows ? ['code'] : []} stickyEndColumnIds={overflows && !compact ? ['action'] : []} emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("phiếu xuất")} /> : null} />
          </div>
          <div className="s19-list-footer"><Pagination preserveBoundaryFocus variant="products" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} pageSizeOptions={model.pagination.pageSizeOptions} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} /><NoticeSlot name="pagination" /></div>
          <p className="s19-availability" id="s19-flow-limit"><Icon name="eye" size={16} />{tx("Xem chi tiết hiện chưa khả dụng.")}</p>
        </section>
      </> : <section className="hn-report-read-state" aria-busy={state.loading}>
        <p role={state.error && !state.loading ? 'alert' : 'status'}>{tx(state.loading ? 'Đang đọc báo cáo xuất kho…' : state.error ? reportReadErrorMessage(false) : state.blocker ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn.' : 'Chưa thể tải báo cáo.')}</p>
        {(initialReadFailed || Boolean(state.blocker)) && <Button variant="secondary" loading={state.loading} onClick={retryRead}>{tx("Thử lại")}</Button>}
      </section>}
      {cohort === 'legacy' && notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s19-search') ?? null} resolveInlineSlot={inlineSlot} revealInlineOnOpen protectedContentSelector=".s19-list,.s19-charts,.s19-overview" />}
    </div>
  </GlobalShell>;
}
