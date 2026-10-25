import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createDealerExportController } from '../../controllers/dealer-export-controller';
import { DEFAULT_DEALER_EXPORT_QUERY as defaults, dealerExportPeriod, type DealerExportAdapter, type DealerExportQuery, type DealerExportRow, type DealerExportSortKey } from '../../contracts/dealer-export-report';
import { Button, CatalogueActiveFilters, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, Pagination, ReportEmptyState, getReportEmptyReason, reportReadErrorMessage, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { DealerExportCharts } from './DealerExportCharts';
import { dealerExportTableLayout } from './dealer-export-layout';
import './dealer-export.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalRecipientReport, RECIPIENT_BINDING_COPY } from './OperationalRecipientReport';
import { useUiCopy } from '../../i18n/use-ui-copy';
import type { RecipientOperationalReader } from './recipient-binding';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

type Operation = ReturnType<ReturnType<typeof createDealerExportController>['load']>;
export function DealerExportScreen({ adapter, operationalAdapter }: { adapter?: DealerExportAdapter; operationalAdapter?: RecipientOperationalReader } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const bindingTx = useUiCopy(RECIPIENT_BINDING_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S25' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => IS_BROWSER_PREVIEW ? 'legacy' : operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createDealerExportController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const root = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  // Initial presentation only: give short laptop/tablet screens room for rows.
  // Resizing never overrides the user's subsequent disclosure choice.
  const [chartsExpanded, setChartsExpanded] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-height: 900px)').matches);
  const [tableLayout, setTableLayout] = useState({ overflows: false, pinIdentity: false });
  const sequence = useRef(0), intent = useRef(0);
  const reveal = useKeyboardFocusReveal();
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body }), []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      if (controller.getSnapshot().model) notify(reportReadErrorMessage(true), origin, 'error');
      else setInitialReadFailed(true);
    } else if (outcome.result.kind === 'blocked') {
      const message = outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${dealerExportPeriod(controller.getSnapshot().acceptedQuery?.period ?? defaults.period)}.`
        : 'Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.';
      if (controller.getSnapshot().model) notify(message, origin);
      else setInitialReadFailed(true);
    } else {
      setInitialReadFailed(false);
    }
  }, [controller, notify]);
  useEffect(() => {
    let mounted = true; const token = ++intent.current;
    void controller.load(structuredClone(defaults)).then(result => { if (mounted) finish(result, null, token); });
    return () => { mounted = false; ++intent.current; controller.clear(); };
  }, [controller, finish]);
  function run(operation: () => Operation) {
    const token = ++intent.current;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice(null); void operation().then(result => finish(result, origin, token));
  }
  const update = (patch: Partial<DealerExportQuery>) => run(() => controller.update(patch));
  function retryRead() {
    run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)));
  }
  const acceptedFilters: { key: 'search' | 'dealer'; label: string }[] = [];
  if (model?.query.search.trim()) acceptedFilters.push({ key: 'search', label: tx(`Tìm: ${model.query.search.trim()}`) });
  if (model?.query.dealer) acceptedFilters.push({ key: 'dealer', label: model.query.dealer });
  function removeFilter(key: 'search' | 'dealer') {
    // Restore focus before the accepted chip disappears.
    root.current?.querySelector<HTMLElement>(key === 'search' ? '#s25-query-search' : '#s25-dealer')?.focus();
    update({ [key]: '' });
  }
  const hasModel = Boolean(model);
  useEffect(() => {
    if (cohort !== 'legacy') return;
    const region = root.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    const measure = () => {
      const identity = [...region.querySelectorAll<HTMLElement>('th[data-column="ordinal"],th[data-column="dealerRecipient"]')]
        .reduce((width, cell) => width + cell.getBoundingClientRect().width, 0);
      const control = Math.max(44, ...[...region.querySelectorAll<HTMLElement>('thead button')].map(button => button.getBoundingClientRect().width));
      const next = dealerExportTableLayout(region.clientWidth, region.scrollWidth, identity, control);
      setTableLayout(current => current.overflows === next.overflows && current.pinIdentity === next.pinIdentity ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    region.querySelectorAll('thead th').forEach(cell => observer.observe(cell));
    measure();
    return () => observer.disconnect();
  }, [hasModel, cohort]);
  const sort = (key: string) => update({ sortKey: key as DealerExportSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' });
  function guard(row: DealerExportRow, origin: HTMLElement) {
    recordReviewDiagnostic({ kind: 'blocked-action', key: `S25:${row.rowKey}`, detail: 'No assigned detail workflow or backend mapping.' });
    notify(`Chi tiết ${row.dealer} hiện chưa khả dụng trong báo cáo này. Không có yêu cầu đọc chi tiết nào được gửi.`, origin);
  }
  const columns: TableColumn<DealerExportRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'dealerRecipient', heading: tx('Đại lý/Người nhận'), render: row => <div className="s25-identity"><strong>{row.dealer}</strong><span>{row.recipient}</span></div> },
    { id: 'documents', heading: tx('Số phiếu'), sortKey: 'documents', sortType: 'number', align: 'end', render: row => <strong className="s25-number s25-documents">{row.documents.toLocaleString(tx('vi-VN'))}</strong> },
    { id: 'products', heading: tx('Số sản phẩm'), sortKey: 'products', sortType: 'number', align: 'end', render: row => <span className="s25-number">{row.products.toLocaleString(tx('vi-VN'))}</span> },
    { id: 'progress', heading: tx('Tiến độ'), render: row => <div className="s25-progress"><span><strong>{row.completed}{tx("/")}{row.documents}</strong> {tx("hoàn tất")}</span><progress max={row.documents} value={row.completed} aria-label={tx(`Hoàn tất ${row.dealer}: ${row.completed}/${row.documents} phiếu`)} /><span>{row.incomplete} {tx("chưa hoàn tất")}</span></div> },
    { id: 'lastExport', heading: tx('Phiếu xuất gần nhất'), sortKey: 'lastExport', sortType: 'date', render: row => <time dateTime={row.lastExport}>{formatBusinessDate(row.lastExport, language)}</time> },
    { id: 'actions', heading: tx('Chi tiết'), kind: 'actions', render: row => <Button variant="ghost" iconOnly aria-label={tx(`Xem ${row.dealer}`)} aria-disabled="true" aria-describedby="s25-action-limit" onClick={event => guard(row, event.currentTarget)}><Icon name="eye" /></Button> },
  ];
  const busy = state.loading || state.debouncing;
  const title = cohort === 'scenario' ? bindingTx('Xuất theo người nhận') : tx('Xuất theo người nhận đại lý');
  return <GlobalShell title={title} variant="wms" activeKey="S25" navigation={S00_SHELL_NAVIGATION}>
    <div ref={root} className="hn-catalogue-screen s25-screen" data-screen="S25" data-visual-variant="premium" data-revision="premium-wave5-2026-10-18" onFocusCapture={reveal}>
      <CataloguePageHeader title={title} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={title} appearance="worklist"
        actions={cohort === 'legacy' ? <div className="s25-export"><ReportExcelButton screen="S25" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div> : undefined} />
      {operational.available && <FilterSelect label={bindingTx('Nguồn dữ liệu')} aria-label={bindingTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{bindingTx('Phiên hiện tại')}</option><option value="legacy">{bindingTx('Dữ liệu đã duyệt')}</option></FilterSelect>}
      {cohort === 'scenario' ? <OperationalRecipientReport adapter={operational} /> : model ? <>
        <section className="s25-panel s25-overview hn-premium-panel" aria-labelledby="s25-overview-title">
          <div className="s25-overview-heading">
            <div className="s25-overview-label"><span className="s25-section-icon"><Icon name="chart" size={22} /></span><div><h2 id="s25-overview-title">{tx("Tổng hợp toàn kỳ")}</h2><p>{tx("Không thay đổi theo bộ lọc danh sách")}</p></div></div>
            <div className="s25-overview-controls"><div className="s25-period"><DateRangePicker id="s25-period" label={tx("Kỳ báo cáo · Giờ Việt Nam")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></div><Button variant="ghost" aria-expanded={chartsExpanded} aria-controls="s25-chart-region" leadingIcon={<Icon name={chartsExpanded ? 'eye-off' : 'chart'} />} onClick={() => setChartsExpanded(value => !value)}>{tx(chartsExpanded ? 'Thu gọn biểu đồ' : 'Hiện biểu đồ')}</Button></div>
          </div>
          <div data-s25-notice="period" />
          <p className="s25-footnote">{tx("Không tính phiếu hủy. Số sản phẩm chỉ tính phiếu đã xuất.")}</p>
          <div className="s25-metrics"><CatalogueSummary label={tx('Tổng hợp toàn kỳ {period}', { period: formatBusinessPeriod(model.query.period, language) })} columns={4} appearance="inline" alignRows>
            <SummaryMetric label={tx("Tổng phiếu xuất")} value={<span className="s25-key-number">{model.summary.documents}</span>} />
            <SummaryMetric label={tx("Hoàn tất")} value={model.summary.completed} />
            <SummaryMetric label={tx("Chưa hoàn tất")} value={model.summary.incomplete} />
            <SummaryMetric label={tx("Đại lý")} value={model.summary.dealers} />
          </CatalogueSummary></div>
          <div id="s25-chart-region" hidden={!chartsExpanded}><DealerExportCharts summary={tx(model.summary)} /></div>
        </section>
        <section className="s25-panel s25-list hn-premium-panel" aria-labelledby="s25-list-title">
          <div className="s25-panel-title"><div className="s25-list-heading"><h2 id="s25-list-title">{tx("Chi tiết theo đại lý")}</h2><span className="s25-source-count">{model.source.detailTotal} {tx("đại lý trong kỳ")}</span></div><span className="s25-availability" id="s25-action-limit"><Icon name="info" size={16} />{tx("Xem chi tiết chưa khả dụng")}</span></div>
          <div className="s25-query-region"><CatalogueToolbar id="s25-query" label={tx("Tìm và lọc đại lý")} layout="worklist" filterSizing="compact" filterDisclosure="always" searchLabel={tx("Tìm tên đại lý hoặc người nhận")} searchHint={tx("Tìm chuỗi con, không phân biệt hoa thường hoặc dấu; không tìm mã phiếu.")} searchPlaceholder={tx("Tìm đại lý hoặc người nhận…")} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => run(() => controller.resetDefault())} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={busy}
            trailingControls={<FilterSelect id="s25-dealer" label={tx("Đại lý")} value={query.dealer} onChange={event => update({ dealer: event.currentTarget.value })}><option value="">{tx("Tất cả đại lý")}</option>{model.filterOptions.dealer.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} aria-describedby="s25-status-limit" onChange={() => update({ status: '' })}><option value="">{tx("Tất cả")}</option></FilterSelect>
            <p className="s25-filter-note" id="s25-status-limit">{tx("Hiện chỉ có lựa chọn “Tất cả”. Chưa hỗ trợ lọc trạng thái cho dòng tổng hợp.")}</p>
          </CatalogueToolbar></div>
          <div className="s25-applied-filters" hidden={!acceptedFilters.length}><CatalogueActiveFilters items={acceptedFilters} onRemove={removeFilter} /></div>
          <div className="s25-result-line"><p className="s25-list-context" role="status" aria-live="polite" aria-atomic="true"><strong>{model.pagination.total}</strong> {tx("/")} {model.source.detailTotal} {tx("đại lý phù hợp")}</p>{tableLayout.overflows && <p className="s25-scroll-hint"><Icon name="arrows-horizontal" size={16} />{tx("Cuộn ngang để xem đủ thông tin")}</p>}</div>
          <DataTable caption={tx("Báo cáo xuất theo người nhận đại lý")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.rowKey} sort={{ key: model.query.sortKey, direction: model.query.sortDirection }} onSort={sort} stickyHeader stickyColumnIds={tableLayout.pinIdentity ? ['ordinal', 'dealerRecipient'] : []} appearance="refined" density="compact" sortIndicatorAppearance="quiet" rowActionAppearance="quiet" busy={busy} scrollResetKey={JSON.stringify(model.query)}
            emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("đại lý")} /> : null} />
          <div data-s25-notice="table" />
          <Pagination variant="products" unit={tx("đại lý")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus />
        </section>
      </> : <section className="hn-report-read-state" aria-busy={state.loading}>
        <div className="s25-period"><DateRangePicker id="s25-period" label={tx("Kỳ báo cáo · Giờ Việt Nam")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></div>
        <p role={state.error && !state.loading ? 'alert' : 'status'}>{tx(state.loading ? 'Đang đọc báo cáo…' : state.error ? reportReadErrorMessage(false) : state.blocker ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn.' : 'Chưa thể tải báo cáo.')}</p>
        {(initialReadFailed || Boolean(state.blocker)) && <Button variant="secondary" loading={state.loading} onClick={retryRead}>{tx("Thử lại")}</Button>}
      </section>}
      {cohort === 'legacy' && notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} protectedContentSelector=".s25-overview,.hn-catalogue-toolbar" resolveInlineSlot={origin => root.current?.querySelector<HTMLElement>(origin?.closest('.s25-period') ? '[data-s25-notice="period"]' : origin?.closest('.hn-page-heading') ? '[data-feedback-slot="heading"]' : origin?.closest('.hn-table') ? '[data-s25-notice="table"]' : '[data-feedback-slot="query"]') ?? null} resolveFocusFallback={() => root.current?.querySelector<HTMLElement>('#s25-period') ?? null} revealInlineOnOpen />}
    </div>
  </GlobalShell>;
}
