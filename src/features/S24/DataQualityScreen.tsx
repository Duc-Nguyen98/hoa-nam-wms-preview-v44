import { PageState } from '../../shared/PageState';
import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { useShellPreferences } from '../../shared/shell-preferences';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createDataQualityController } from '../../controllers/data-quality-controller';
import { DEFAULT_DATA_QUALITY_QUERY as defaults, qualityPeriod, type DataQualityAdapter, type DataQualityQuery, type DataQualityRow, type DataQualitySortKey } from '../../contracts/data-quality-report';
import { Button, CatalogueActiveFilters, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, Pagination, ReportEmptyState, getReportEmptyReason, reportReadErrorMessage, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { AcceptedRowDetail, QUALITY_DETAIL_COPY, resolveAcceptedQualityRow, selectAcceptedQualityRow, type AcceptedQualitySelection } from './AcceptedRowDetail';
import { DataQualityCharts, DataQualityRing } from './DataQualityCharts';
import { dataQualityVisibleSorts } from './data-quality-presentation';
import './data-quality.css';

type Operation = ReturnType<ReturnType<typeof createDataQualityController>['load']>;
type FilterKey = 'search' | 'result' | 'needsReview';
export function DataQualityScreen({ adapter }: { adapter?: DataQualityAdapter } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const detailTx = useUiCopy(QUALITY_DETAIL_COPY);
  const controller = useMemo(() => createDataQualityController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [selection, setSelection] = useState<AcceptedQualitySelection | null>(null);
  const detailRow = resolveAcceptedQualityRow(state, selection);
  useEffect(() => { if (selection && !detailRow) setSelection(null); }, [selection, detailRow]);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [compact, setCompact] = useState(false);
  const [chartsExpanded, setChartsExpanded] = useState(true);
  const pendingFocusColumn = useRef<string | null>(null);
  const sequence = useRef(0), intent = useRef(0);
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      if (controller.getSnapshot().model) notify(reportReadErrorMessage(true), origin, 'error');
      else setInitialReadFailed(true);
    }
    else if (outcome.result.kind === 'blocked') {
      const accepted = controller.getSnapshot().acceptedQuery ?? defaults;
      const message = outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${qualityPeriod(accepted.period)}.`
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
  const ready = Boolean(model);
  useLayoutEffect(() => {
    const container = screen.current;
    if (!container) return;
    let frame: number | null = null;
    const revealAfterLayout = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const focused = document.activeElement;
        // Reflow can move a still-mounted chart/action control outside the view.
        // Reuse S00 reveal, never steal focus from a popup or pointer interaction.
        if (focused instanceof HTMLElement && container.contains(focused) && focused.matches(':focus-visible')
          && !document.querySelector('dialog[open], .hn-header-popup, .hn-date-picker__popup[data-open="true"]')) revealControl(focused);
      });
    };
    const measure = () => {
      const next = container.getBoundingClientRect().width < 900;
      if (next) {
        const id = document.activeElement?.closest<HTMLElement>('th[data-column]')?.dataset.column;
        if (id === 'object') pendingFocusColumn.current = 'referenceCode';
        if (id === 'detail') pendingFocusColumn.current = 'result';
      }
      setCompact(next);
      revealAfterLayout();
    };
    const observer = new ResizeObserver(measure); observer.observe(container); measure();
    window.addEventListener('resize', revealAfterLayout);
    return () => { observer.disconnect(); window.removeEventListener('resize', revealAfterLayout); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  useLayoutEffect(() => {
    if (!pendingFocusColumn.current) return;
    const target = list.current?.querySelector<HTMLButtonElement>(`th[data-column="${pendingFocusColumn.current}"] button`);
    if (target) { target.focus({ preventScroll: true }); revealControl(target); }
    pendingFocusColumn.current = null;
  }, [compact]);
  useLayoutEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const next = { left: region.scrollLeft > 1, right: region.scrollWidth - region.clientWidth - region.scrollLeft > 1 };
      if (!next.left && !next.right && document.activeElement?.closest('.s24-scroll-tools')) { region.focus({ preventScroll: true }); revealControl(region); }
      setEdges(old => old.left === next.left && old.right === next.right ? old : next);
    };
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [ready]);
  function run(operation: () => Operation) {
    setSelection(null);
    const token = ++intent.current;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setNotice(null); void operation().then(result => finish(result, origin, token));
  }
  const update = (patch: Partial<DataQualityQuery>) => run(() => controller.update(patch));
  function retryRead() {
    run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)));
  }
  const sort = (key: string) => update({ sortKey: key as DataQualitySortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' });
  function openDetail(row: DataQualityRow) {
    setNotice(null);
    setSelection(selectAcceptedQualityRow(controller.getSnapshot(), row));
  }
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    region?.scrollBy({ left: direction * Math.max(160, region.clientWidth * .7), behavior: 'instant' });
  }
  function reviewRecords() {
    update({ needsReview: !query.needsReview });
    const target = screen.current?.querySelector<HTMLInputElement>('#s24-query-search');
    target?.focus({ preventScroll: true });
    if (target) revealControl(target);
  }
  const visibleSorts = dataQualityVisibleSorts(compact, model?.query.sortKey ?? null);
  const mergedSortLabel = compact && model?.query.sortKey === 'object' ? 'Đối tượng'
    : compact && model?.query.sortKey === 'detail' ? 'Chi tiết' : null;
  const columns: TableColumn<DataQualityRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'referenceCode', heading: tx(compact ? 'Mã/Đối tượng' : 'Mã tham chiếu'), sortKey: visibleSorts.reference, sortLabel: tx(visibleSorts.reference === 'object' ? 'Đối tượng' : 'mã tham chiếu'), render: row => <div className="s24-record" data-quality={row.result}><i className="s24-record-marker" aria-hidden="true" /><div className="s24-cell-stack"><strong className="s24-code">{row.referenceCode}</strong>{compact && <span>{tx(row.object)}</span>}</div></div> },
    ...(!compact ? [{ id: 'object', heading: tx('Đối tượng'), sortKey: 'object', render: (row: DataQualityRow) => row.object }] : []),
    { id: 'systemValue', heading: tx('Hệ thống'), sortKey: 'systemValue', render: row => <span className="s24-value" data-difference={row.result !== 'Khớp'} data-missing={row.systemValue === null}>{row.systemValue !== null ? tx(row.systemValue) : <span aria-label={tx("Chưa có giá trị hệ thống")}>{tx("—")}</span>}</span> },
    { id: 'comparisonValue', heading: tx('Đối chiếu'), sortKey: 'comparisonValue', render: row => <span className="s24-value" data-difference={row.result !== 'Khớp'}>{tx(row.comparisonValue ?? '—')}</span> },
    { id: 'result', heading: tx(compact ? 'Kết quả/Chi tiết' : 'Kết quả'), sortKey: visibleSorts.result, sortLabel: tx(visibleSorts.result === 'detail' ? 'Chi tiết' : 'kết quả'), render: row => <div className="s24-cell-stack"><StatusBadge tone={row.result === 'Khớp' ? 'success' : 'warning'}>{tx(row.result)}</StatusBadge>{compact && <span>{tx(row.detail)}</span>}</div> },
    ...(!compact ? [{ id: 'detail', heading: tx('Chi tiết'), sortKey: 'detail', render: (row: DataQualityRow) => tx(row.detail) }] : []),
    { id: 'updatedAt', heading: tx('Cập nhật'), sortKey: 'updatedAt', sortType: 'date', render: row => <time className="s24-time" dateTime={row.updatedAt}>{formatBusinessTimestamp(row.updatedAt, language)}</time> },
    { id: 'actions', heading: tx('Xem'), kind: 'actions', render: row => <Button key={`${state.requestId}:${model?.rows.indexOf(row)}`} variant="ghost" iconOnly aria-label={tx(`Xem bản ghi ${row.referenceCode}`)} aria-disabled={state.loading || state.debouncing || !!state.error || !!state.blocker} aria-describedby="s24-action-limit" onClick={() => openDetail(row)}><Icon name="eye" /></Button> },
  ];
  const summary = model?.summary, period = model?.query.period ?? defaults.period;
  // Only derive a detail-scope count when every source row is present. In QA60
  // or filtered/paged results, use the explicit detail total, never the page count.
  const detailReviewCount = model && model.rows.length === model.source.detailTotal
    ? model.rows.filter(row => row.result !== 'Khớp').length : null;
  const activeFilters: { key: FilterKey; label: string }[] = [];
  if (model?.query.search.trim()) activeFilters.push({ key: 'search', label: tx(`Tìm: ${model.query.search.trim()}`) });
  if (model?.query.result) activeFilters.push({ key: 'result', label: tx(model.query.result) });
  if (model?.query.needsReview) activeFilters.push({ key: 'needsReview', label: tx('Cần kiểm tra') });
  function removeFilter(key: FilterKey) {
    const target = screen.current?.querySelector<HTMLInputElement>('#s24-query-search');
    target?.focus({ preventScroll: true }); if (target) revealControl(target);
    update(key === 'needsReview' ? { needsReview: false } : { [key]: '' });
  }
  return <GlobalShell title={tx("Nhập liệu, đối chiếu & lỗi dữ liệu")} variant="wms" activeKey="S24" navigation={S00_SHELL_NAVIGATION}>
    <div ref={screen} className="hn-catalogue-screen s24-screen" data-screen="S24" data-visual-variant="premium" data-compact={compact} onFocusCapture={revealFocus}>
      <CataloguePageHeader appearance="worklist" title={tx("Báo cáo Nhập liệu, đối chiếu & lỗi dữ liệu")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Nhập liệu, đối chiếu & lỗi dữ liệu")}
        actions={<ReportExcelButton screen="S24" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} />} />
      {summary && <section className="s24-overview" aria-label={tx('Tổng hợp toàn kỳ {period}', { period: formatBusinessPeriod(period, language) })}>
        <div className="s24-period-context"><div className="s24-report-context"><div className="s24-period-block"><DateRangePicker id="s24-period" label={tx("Kỳ báo cáo · Giờ Việt Nam")} value={query.period} clearable={false} onChange={next => { if (next) update({ period: next }); }} /></div><div className="s24-overview-caption"><span>{tx("Tổng hợp toàn kỳ")}</span><p>{tx("KPI và biểu đồ không đổi theo bộ lọc chi tiết.")}</p></div><Button variant="ghost" leadingIcon={<Icon name={chartsExpanded ? 'arrow-up' : 'arrow-down'} />} aria-expanded={chartsExpanded} aria-controls="s24-analysis" onClick={() => setChartsExpanded(value => !value)}>{tx(chartsExpanded ? 'Ẩn biểu đồ' : 'Hiện biểu đồ')}</Button></div>
        <div data-s24-notice="period" /></div>
        <CatalogueSummary label={tx("Tổng hợp đối chiếu toàn kỳ")} columns={4} density="compact" appearance="inline" alignRows>
          <SummaryMetric label={tx("Tổng bản ghi")} value={summary.total.toLocaleString(tx('vi-VN'))} detail={tx("bản ghi")} icon="documents" />
          <SummaryMetric label={tx("Khớp")} value={summary.matched.toLocaleString(tx('vi-VN'))} detail={tx("bản ghi")} icon="circle-check" />
          <SummaryMetric label={tx("Chênh lệch")} value={summary.different} detail={tx("bản ghi")} icon="arrows-horizontal" />
          <SummaryMetric label={tx("Lỗi dữ liệu")} value={summary.errors} detail={tx("bản ghi")} icon="alert-circle" />
        </CatalogueSummary>
        <div className="s24-review-bar"><div className="s24-review-symbol"><Icon name="alert-triangle" size={22} /></div><div className="s24-review-message"><strong>{summary.needsReview} {tx("bản ghi cần kiểm tra")} <span>{tx("toàn kỳ")}</span></strong><p>{summary.different} {tx("chênh lệch ·")} {summary.errors} {tx("lỗi dữ liệu")}<span className="s24-review-scope">{tx(detailReviewCount !== null ? `${detailReviewCount} trong tập chi tiết hiện có` : `Tập chi tiết hiện có: ${model?.source.detailTotal} bản ghi`)}</span></p></div><Button variant={query.needsReview ? 'secondary' : 'primary'} leadingIcon={<Icon name={query.needsReview ? 'circle-check' : 'filter'} />} aria-pressed={query.needsReview} onClick={reviewRecords}>{tx("Xem bản ghi cần kiểm tra")}</Button></div>
        <div id="s24-analysis" className="s24-analysis" hidden={!chartsExpanded}><DataQualityCharts summary={summary} /><section className="s24-quality hn-premium-panel" aria-labelledby="s24-quality-title">
          <h2 id="s24-quality-title">{tx("Chất lượng dữ liệu")}</h2><DataQualityRing summary={summary} />
          <p className="s24-quality-note">{tx("Tỷ lệ khớp trên")} {summary.total.toLocaleString(tx('vi-VN'))} {tx("bản ghi toàn kỳ")}</p>
        </section></div>
      </section>}
      {model ? <section ref={list} className="s24-list hn-premium-panel" aria-labelledby="s24-list-title">
        <div className="s24-list-heading"><div><h2 id="s24-list-title" tabIndex={-1}>{tx("Chi tiết đối chiếu")}</h2><p>{tx("Đối chiếu giá trị hệ thống với dữ liệu ghi nhận")}</p></div><p className="s24-result-count" role="status" aria-live="polite" aria-atomic="true"><b>{model.pagination.total}</b> {tx("/")} {model.source.detailTotal} {tx("bản ghi trong tập chi tiết")}</p></div>
        <div className="s24-filter-card"><CatalogueToolbar id="s24-query" label={tx("Tìm và lọc bản ghi")} layout="worklist" filterSizing="compact" searchLabel={tx("Tìm mã tham chiếu hoặc đối tượng")} searchHint={tx("Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.")} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => run(() => controller.reset(structuredClone(defaults)))} searchPlaceholder={tx("Tìm mã tham chiếu hoặc đối tượng…")} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={state.loading || state.debouncing}
          trailingControls={<FilterSelect label={tx("Kết quả")} value={query.result} onChange={event => update({ result: event.currentTarget.value as DataQualityQuery['result'] })}><option value="">{tx("Tất cả kết quả")}</option>{model.filterOptions.result.map(result => <option key={result} value={result}>{tx(result)}</option>)}</FilterSelect>}>
          <FilterSelect label={tx("Loại dữ liệu")} value={query.dataType} onChange={() => update({ dataType: '' })}><option value="">{tx("Tất cả")}</option></FilterSelect>
        </CatalogueToolbar><CatalogueActiveFilters items={activeFilters} onRemove={removeFilter} /></div>
        {(edges.left || edges.right) && <div className="s24-table-context"><span>{tx(mergedSortLabel ? `Đang xếp theo ${mergedSortLabel} (${model.query.sortDirection === 'asc' ? 'A–Z' : 'Z–A'}). Cuộn ngang để xem đủ thông tin.` : 'Giữ đủ thông tin đối chiếu khi cuộn ngang')}</span><div className="s24-scroll-tools"><span><Icon name="arrows-horizontal" size={16} />{tx("Cuộn xem thêm")}</span><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-disabled={!edges.left} onClick={() => { if (edges.left) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-disabled={!edges.right} onClick={() => { if (edges.right) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>}
        <DataTable caption={tx("Danh sách nhập liệu, đối chiếu và lỗi dữ liệu")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.referenceCode}
          sort={model.query.sortKey ? { key: model.query.sortKey, direction: model.query.sortDirection } : null} onSort={sort} appearance="refined" density="compact" sortIndicatorAppearance="quiet" rowActionAppearance="quiet" stickyHeader scrollResetKey={JSON.stringify(model.query)} busy={state.loading || state.debouncing}
          emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("bản ghi")} /> : null} />
        <div data-s24-notice="table" />
        <div className="s24-pagination"><Pagination variant="products" unit={tx("bản ghi")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus /></div>
        <p className="s24-action-limit" id="s24-action-limit"><Icon name="info" size={15} />{detailTx('Chỉ hiển thị thông tin trong dòng đã đọc.')}</p>
      </section> : <section className="hn-report-read-state" aria-busy={state.loading}>
        <div className="s24-period"><DateRangePicker id="s24-period" label={tx("Kỳ báo cáo · Giờ Việt Nam")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></div>
        <PageState kind={state.loading?'loading':state.error?'error':'stale'} description={tx(state.loading ? 'Đang đọc báo cáo…' : state.error ? reportReadErrorMessage(false) : state.blocker ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn.' : 'Báo cáo hiện chưa khả dụng.')} action={(initialReadFailed || Boolean(state.blocker)) && <Button variant="secondary" loading={state.loading} onClick={retryRead}>{tx("Thử lại")}</Button>}/>
      </section>}
      <AcceptedRowDetail row={detailRow} onClose={() => setSelection(null)} resolveReturnFocus={() => screen.current?.querySelector<HTMLElement>('#s24-list-title') ?? null} />
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} protectedContentSelector=".s24-overview,.s24-filter-card" resolveInlineSlot={origin => screen.current?.querySelector<HTMLElement>(origin?.closest('.s24-period-block') ? '[data-s24-notice="period"]' : origin?.closest('.hn-page-heading') ? '[data-feedback-slot="heading"]' : origin?.closest('.hn-table') ? '[data-s24-notice="table"]' : '[data-feedback-slot="query"]') ?? null} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s24-period') ?? null} revealInlineOnOpen />}
    </div>
  </GlobalShell>;
}
