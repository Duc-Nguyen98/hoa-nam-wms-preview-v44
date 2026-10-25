import { useShellPreferences } from '../../shared/shell-preferences';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createInventoryReportController } from '../../controllers/inventory-report-controller';
import { DEFAULT_INVENTORY_REPORT_QUERY as defaults, inventoryDateLabel, type InventoryReportAdapter, type InventoryReportQuery, type InventoryReportRow, type InventoryReportSortKey } from '../../contracts/inventory-report';
import { Button, CatalogueActiveFilters, CatalogueListHeader, CataloguePageHeader, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, PageState, Pagination, ReportEmptyState, ReportScopeNote, getReportEmptyReason, StatusBadge, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { InventoryReportChart } from './InventoryReportChart';
import './inventory-report.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalStockReport, STOCK_REPORT_COPY } from './OperationalStockReport';
import type { StockReportReader } from './stock-report-binding';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

type Operation = ReturnType<ReturnType<typeof createInventoryReportController>['load']>;
const amountLabels = { opening: 'Tồn đầu', inbound: 'Nhập', outboundProducts: 'Xuất SP', outboundWarranty: 'Xuất BH', reversals: 'Hoàn tác', closing: 'Tồn cuối', actual: 'Thực tế', difference: 'Chênh lệch' };
const reconciliationAmounts = ['closing', 'actual', 'difference'] as const;
const movementAmounts = ['opening', 'inbound', 'outboundProducts', 'outboundWarranty', 'reversals'] as const;

export function InventoryReportScreen({ adapter, operationalAdapter }: { adapter?: InventoryReportAdapter; operationalAdapter?: StockReportReader } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const inventoryNumber = (value: number) => value.toLocaleString(tx('vi-VN')).replace('-', '−');
  const inventorySignedNumber = (value: number) => `${value > 0 ? '+' : ''}${inventoryNumber(value)}`;
  const operationalTx = useUiCopy(STOCK_REPORT_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S21' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => IS_BROWSER_PREVIEW ? 'legacy' : operational.available ? 'scenario' : 'legacy');
  const cohortControl = operational.available && <FilterSelect label={operationalTx('Nguồn dữ liệu')} aria-label={operationalTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{operationalTx('Phiên hiện tại')}</option><option value="legacy">{operationalTx('Dữ liệu đã duyệt')}</option></FilterSelect>;
  const controller = useMemo(() => createInventoryReportController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  const [wideTable, setWideTable] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });
  const intent = useRef(0), sequence = useRef(0), reviewFocus = useRef<{ model: typeof model; origin: HTMLElement | null; retry: boolean } | null>(null);
  const revealFocus = useKeyboardFocusReveal(), ready = Boolean(model);
  const pending = state.loading || state.debouncing;
  useEffect(() => {
    const cancelOnFocus = (event: FocusEvent) => {
      if (reviewFocus.current && event.target !== reviewFocus.current.origin && event.target !== document.body && event.target !== document.documentElement) reviewFocus.current = null;
    };
    const cancelOnPointer = (event: PointerEvent) => {
      if (reviewFocus.current && event.target instanceof Node && !reviewFocus.current.origin?.contains(event.target)) reviewFocus.current = null;
    };
    const cancelOnKey = (event: KeyboardEvent) => { if (event.key === 'Tab' || event.key === 'Escape') reviewFocus.current = null; };
    document.addEventListener('focusin', cancelOnFocus);
    document.addEventListener('pointerdown', cancelOnPointer, true);
    document.addEventListener('keydown', cancelOnKey, true);
    return () => { document.removeEventListener('focusin', cancelOnFocus); document.removeEventListener('pointerdown', cancelOnPointer, true); document.removeEventListener('keydown', cancelOnKey, true); };
  }, []);
  const overflows = edges.left || edges.right;
  useLayoutEffect(() => {
    const element = screen.current;
    if (!element) return;
    const measure = () => setWideTable(element.clientWidth >= 1000);
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, [cohort]);
  useLayoutEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const next = { left: region.scrollLeft > 1, right: region.scrollWidth - region.clientWidth - region.scrollLeft > 1 };
      if (!next.left && !next.right && document.activeElement?.closest('.s21-scroll-tools')) {
        region.focus({ preventScroll: true }); revealControl(region);
      }
      setEdges(old => old.left === next.left && old.right === next.right ? old : next);
    };
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [ready, cohort]);
  useLayoutEffect(() => {
    const request = reviewFocus.current;
    if (!request || !model || model === request.model || pending || !request.retry && model.query.status !== 'Cần kiểm tra') return;
    reviewFocus.current = null;
    if (document.querySelector('.hn-header-popup,dialog[open],.hn-date-picker__popup[data-open="true"]')) return;
    const active = document.activeElement;
    if (active !== request.origin && !(request.retry && (active === document.body || active === document.documentElement))) return;
    const heading = list.current?.querySelector<HTMLElement>('#s21-results-focus');
    if (heading) { heading.focus({ preventScroll: true }); revealControl(heading); }
  }, [model, pending]);
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      reviewFocus.current = null;
      if (controller.getSnapshot().model) notify('Chưa thể đọc báo cáo. Dữ liệu và điều kiện đã áp dụng được giữ nguyên.', origin, 'error');
      else setInitialReadFailed(true);
    }
    else if (outcome.result.kind === 'blocked') {
      reviewFocus.current = null;
      const period = controller.getSnapshot().acceptedQuery?.period ?? defaults.period;
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S21:${outcome.result.reason}`, detail: outcome.result.detail });
      if (!controller.getSnapshot().model) { setInitialReadFailed(true); return; }
      notify(outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${inventoryDateLabel(period.from)} – ${inventoryDateLabel(period.to)}.`
        : 'Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    if (cohort !== 'legacy') return;
    let active = true; const token = ++intent.current;
    void controller.load(structuredClone(defaults)).then(outcome => { if (active) finish(outcome, null, token); });
    return () => { active = false; ++intent.current; controller.clear(); };
  }, [controller, finish, cohort]);
  function run(operation: () => Operation, revealResults = false, retry = false) {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++intent.current; reviewFocus.current = revealResults ? { model, origin, retry } : null; setNotice(null);
    void operation().then(outcome => finish(outcome, origin, token));
  }
  function update(patch: Partial<InventoryReportQuery>, revealResults = false) { run(() => controller.update(patch), revealResults); }
  function reset() { run(() => controller.reset(structuredClone(defaults))); }
  function retryRead() { run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)), true, true); }
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    region?.scrollBy({ left: direction * Math.max(160, region.clientWidth * .65), behavior: 'instant' });
  }
  const amountColumn = (key: keyof typeof amountLabels): TableColumn<InventoryReportRow> => ({
    id: key, heading: tx(amountLabels[key]), sortKey: key, sortType: 'number', align: 'end',
    render: row => <span className={key === 'difference' && row[key] !== 0 ? 's21-difference' : 's21-number'}>{inventoryNumber(row[key])}</span>,
  });
  const columns: TableColumn<InventoryReportRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'sku', heading: tx('SKU'), sortKey: 'sku', render: row => <strong className="s21-sku">{row.sku}</strong> },
    { id: 'name', heading: tx('Tên sản phẩm'), sortKey: 'name', render: row => row.name },
    ...reconciliationAmounts.map(amountColumn),
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'Khớp' ? 'success' : 'warning'}>{tx(row.status)}</StatusBadge> },
    ...movementAmounts.map(amountColumn),
  ];
  const activeFilters = model ? ([
    { key: 'search', label: tx(model.query.search.trim() ? `Tìm: ${model.query.search.trim()}` : '') },
    { key: 'sku', label: model.query.sku }, { key: 'status', label: tx(model.query.status) },
  ] as const).filter(item => item.label) : [];
  const summary = model?.summary;
  const metrics = summary ? [
    { label: tx('Tồn đầu kỳ'), value: inventoryNumber(summary.opening) },
    { label: tx('Tổng nhập'), value: inventorySignedNumber(summary.inbound) },
    { label: tx('Xuất sản phẩm'), value: inventorySignedNumber(-summary.outboundProducts) },
    { label: tx('Xuất linh kiện BH'), value: inventorySignedNumber(-summary.outboundWarranty) },
    { label: tx('Hoàn tác'), value: inventorySignedNumber(summary.reversals) },
    { label: tx('Tồn cuối kỳ'), value: inventoryNumber(summary.closing) },
  ] : [];
  const statusFilters = model && <div className="s21-status-filters" role="group" aria-label={tx("Trạng thái đối soát")}><Button variant={query.status === '' ? 'secondary' : 'ghost'} aria-pressed={query.status === ''} onClick={() => update({ status: '' })}>{tx("Tất cả")}</Button>{model.filterOptions.status.map(status => <Button key={status} variant={query.status === status ? 'secondary' : 'ghost'} aria-pressed={query.status === status} onClick={() => update({ status: status as InventoryReportQuery['status'] })}>{tx(status)}</Button>)}</div>;
  const inlineSlot = (origin: HTMLElement | null) => screen.current?.querySelector<HTMLElement>(!model || origin?.closest('.hn-page-heading') ? '[data-s21-notice="heading"]' : '[data-s21-notice="filters"]') ?? null;
  if (cohort === 'scenario') return <GlobalShell title={tx('Báo cáo Tồn kho & Đối soát')} variant="wms" activeKey="S21" navigation={S00_SHELL_NAVIGATION}><div className="hn-catalogue-screen s21-screen" data-screen="S21" ref={screen} onFocusCapture={revealFocus}><CataloguePageHeader appearance="worklist" title={tx('Tồn kho & Đối soát')} parentLabel={tx('Báo cáo & Thống kê')} breadcrumb={tx('Tồn kho & Đối soát')} />{cohortControl}<OperationalStockReport adapter={operational} /></div></GlobalShell>;
  return <GlobalShell title={tx("Báo cáo Tồn kho & Đối soát")} variant="wms" activeKey="S21" navigation={S00_SHELL_NAVIGATION}>
    <div className="hn-catalogue-screen s21-screen" data-screen="S21" data-visual-variant="premium" data-design="reconciliation-first" ref={screen} onFocusCapture={revealFocus}>
      {cohortControl}
      <CataloguePageHeader appearance="worklist" title={tx("Tồn kho & Đối soát")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Tồn kho & Đối soát")} description={tx("Theo dõi biến động và kiểm tra chênh lệch tồn kho theo kỳ")} actions={<div className="s21-heading-actions">
        <div className="s21-period"><DateRangePicker id="s21-period" label={tx("Kỳ báo cáo")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></div>
        <div className="s21-export"><ReportExcelButton screen="S21" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div>
      </div>} />
      <div data-s21-notice="heading" hidden />
      {model && summary ? <>
        <section className="s21-panel hn-premium-panel s21-reconciliation" aria-labelledby="s21-reconciliation-title">
          <div className="s21-reconciliation-content">
            <div className="s21-reconciliation-heading"><h2 id="s21-reconciliation-title">{tx("Đối soát cuối kỳ")}</h2><p><Icon name="alert-triangle" size={17} /><strong>{summary.needsReview} {tx("SKU cần kiểm tra")}</strong><span>{tx("· Toàn kỳ")}</span></p></div>
            <dl className="s21-balance"><div><dt>{tx("Tồn hệ thống")}</dt><dd>{inventoryNumber(summary.closing)}</dd></div><div><dt>{tx("Tồn thực tế")}</dt><dd>{inventoryNumber(summary.actual)}</dd></div><div className="s21-balance-difference"><dt>{tx("Chênh lệch")}</dt><dd>{inventorySignedNumber(summary.difference)}</dd></div></dl>
          </div>
          <div className="s21-reconciliation-action"><Button trailingIcon={<Icon name="arrow-right" size={18} />} onClick={() => update({ status: 'Cần kiểm tra', page: 1 }, true)}>{tx("Xem SKU cần kiểm tra")}</Button><p>{tx("Thực tế − Hệ thống · Đơn vị tồn")}</p></div>
        </section>
        <section className="s21-panel hn-premium-panel s21-summary" aria-label={tx("Tổng hợp toàn kỳ, đơn vị tồn")}><ReportScopeNote summary={tx("Tổng hợp toàn kỳ")} detail={tx("Không thay đổi theo bộ lọc danh sách")} /><dl className="s21-kpis">{metrics.map(metric => <div key={metric.label}><dt>{tx(metric.label)}</dt><dd>{metric.value}</dd></div>)}</dl></section>
        <section className="s21-panel hn-premium-panel s21-list" ref={list} aria-labelledby="s21-list-title">
          <div className="s21-list-heading"><div className="s21-list-intro" id="s21-results-focus" tabIndex={-1} role="group" aria-labelledby="s21-list-title"><CatalogueListHeader id="s21-list-title" title={tx("Chi tiết tồn kho & đối soát")} count={tx(`${model.source.detailTotal} SKU có dữ liệu`)} density="compact" /><p>{tx("Tìm kiếm, SKU và trạng thái chỉ lọc bảng chi tiết.")}</p></div>{statusFilters}</div>
          <div className="s21-list-toolbar">
            <CatalogueToolbar id="s21" label={tx("Lọc chi tiết tồn kho và đối soát")} layout="worklist" filterSizing="compact" applyMode="immediate" searchLabel={tx("Tìm SKU, tên sản phẩm")} searchHint={tx("Tìm SKU hoặc tên sản phẩm; không phân biệt chữ hoa, dấu và khoảng trắng. Tự tìm sau 250 mili giây.")} searchHintMode="sr-only" searchPlaceholder={tx("Tìm SKU hoặc tên sản phẩm…")} searchValue={query.search} onSearchChange={search => update({ search })} onReset={reset} queryContext={null}>
              <FilterSelect id="s21-sku" label={tx("SKU")} value={query.sku} onChange={event => update({ sku: event.target.value })}><option value="">{tx("Tất cả SKU")}</option>{model.filterOptions.sku.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
            </CatalogueToolbar>
            <div data-s21-notice="filters" hidden />
          </div>
          <div className="s21-results-meta"><div className="s21-filter-summary"><p role="status" aria-atomic="true">{tx(pending ? 'Đang cập nhật kết quả… Các dòng hiện tại thuộc điều kiện đã áp dụng.' : `${model.pagination.total} kết quả trong ${model.source.detailTotal} SKU có dữ liệu chi tiết`)}</p><CatalogueActiveFilters items={activeFilters} onRemove={key => { screen.current?.querySelector<HTMLInputElement>('#s21-search')?.focus({ preventScroll: true }); update({ [key]: '' }); }} /></div>
          <div className="s21-scroll-tools" hidden={!overflows}><p>{tx("12 cột ·")} {tx(wideTable ? 'Ghim SKU và tên sản phẩm' : 'Ghim SKU')}</p><div role="group" aria-label={tx("Cuộn bảng tồn kho")}><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s21-table-region" aria-disabled={!edges.left} onClick={() => { if (edges.left) scrollTable(-1); }}><Icon name="chevron-left" size={18} /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s21-table-region" aria-disabled={!edges.right} onClick={() => { if (edges.right) scrollTable(1); }}><Icon name="chevron-right" size={18} /></Button></div></div></div>
          <NoticeSlot name="table" />
          <div id="s21-table-region"><DataTable caption={tx("Chi tiết tồn kho & đối soát")} captionVisibility="sr-only" appearance="refined" density="compact" sortIndicatorAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.renderKey} sort={{ key: model.query.sortKey, direction: model.query.sortDirection }} onSort={key => update({ sortKey: key as InventoryReportSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} scrollResetKey={JSON.stringify(model.query)} busy={pending} stickyHeader stickyColumnIds={overflows ? wideTable ? ['sku', 'name'] : ['sku'] : []} emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("SKU")} /> : null} /></div>
          <div className="s21-list-footer"><Pagination preserveBoundaryFocus variant="products" unit={tx("SKU")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} pageSizeOptions={model.pagination.pageSizeOptions} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} /><NoticeSlot name="pagination" /></div>
        </section>
        <div className="s21-analysis">
          <InventoryReportChart summary={summary} />
          <section className="s21-panel hn-premium-panel s21-movements" aria-labelledby="s21-movements-title"><div className="s21-panel-heading"><div><h2 id="s21-movements-title">{tx("Chi tiết biến động")}</h2><p>{tx("Tổng hợp toàn kỳ · Đơn vị tồn")}</p></div></div><dl className="s21-ledger">{metrics.map(metric => <div key={metric.label}><dt>{tx(metric.label)}</dt><dd>{metric.value}</dd></div>)}</dl></section>
        </div>
      </> : <section className="s21-panel hn-premium-panel s21-read-state" aria-label={tx("Báo cáo tồn kho và đối soát")}>
        <CatalogueListHeader id="s21-read-title" title={tx("Tồn kho & đối soát")} density="compact" />
        <PageState kind={pending || !state.error && !state.blocker ? 'loading' : state.error ? 'error' : 'stale'}
          title={tx(pending || !state.error && !state.blocker ? 'Đang đọc báo cáo tồn kho và đối soát…' : state.error ? 'Chưa thể đọc báo cáo' : 'Chưa có dữ liệu cho kỳ báo cáo đã chọn')}
          description={tx(pending ? 'Đang đọc số liệu tổng hợp và chi tiết tồn kho.' : state.error ? 'Chưa có dữ liệu để hiển thị. Bạn có thể thử đọc lại báo cáo.' : 'Kỳ báo cáo này chưa có số liệu được cung cấp.')}
          onRetry={initialReadFailed && !pending ? retryRead : undefined} />
      </section>}
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s21-search') ?? null} resolveInlineSlot={inlineSlot} revealInlineOnOpen protectedContentSelector=".s21-reconciliation,.s21-summary,.s21-analysis,.s21-list" />}
    </div>
  </GlobalShell>;
}

