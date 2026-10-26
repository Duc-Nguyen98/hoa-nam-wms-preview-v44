import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useReportCopy } from '../../i18n/reports-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createLabelReportController } from '../../controllers/label-report-controller';
import { DEFAULT_LABEL_REPORT_QUERY as defaults, labelAction, labelPeriod, type LabelReportAdapter, type LabelReportQuery, type LabelReportRow, type LabelSortKey } from '../../contracts/label-report';
import { Button, CatalogueActiveFilters, CatalogueListHeader, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalModal, GlobalShell, Icon, Notice, PageState, Pagination, ReportEmptyState, getReportEmptyReason, reportReadErrorMessage, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { labelTableScrollStep } from './label-report-scroll';
import { createLabelPrintService, type LabelPrintCommandAdapter } from './label-print-command';
import { LABEL_PRINT_EN_COPY } from './label-print-copy';
import './label-report.css';

type Operation = ReturnType<ReturnType<typeof createLabelReportController>['load']>;
export function LabelReportScreen({ adapter, printAdapter }: { adapter?: LabelReportAdapter; printAdapter?: LabelPrintCommandAdapter } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const printTx = useUiCopy(LABEL_PRINT_EN_COPY);
  const controller = useMemo(() => createLabelReportController(adapter), [adapter]);
  const printService = useMemo(() => createLabelPrintService(printAdapter), [printAdapter]);
  const printState = useSyncExternalStore(printService.subscribe, printService.getSnapshot, printService.getSnapshot);
  const [printTarget, setPrintTarget] = useState<LabelReportRow | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const printRefresh = useRef<string | null>(null);
  const printOpener = useRef<HTMLElement | null>(null);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [initialReadFailed, setInitialReadFailed] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });
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
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${labelPeriod(accepted.period)}.`
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
  useEffect(() => {
    let mounted = true;
    void printService.restore().then(result => {
      if (!mounted || !result.request) return;
      const row = result.outcome?.receipt.record.data.rows.find(item => item.labelCode === result.request?.payload.labelCode);
      if (row) setPrintTarget(row);
      setPrintOpen(true);
    });
    return () => { mounted = false; };
  }, [printService]);
  useEffect(() => {
    const request = printState.request;
    if (printState.phase !== 'success' || !request || printRefresh.current === request.commandId) return;
    printRefresh.current = request.commandId;
    const token = ++intent.current;
    void controller.load(controller.getSnapshot().intendedQuery ?? controller.getSnapshot().acceptedQuery ?? structuredClone(defaults))
      .then(result => finish(result, printOpener.current, token));
  }, [controller, finish, printState]);
  const ready = Boolean(model);
  useLayoutEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const next = { left: region.scrollLeft > 1, right: region.scrollWidth - region.clientWidth - region.scrollLeft > 1 };
      if (!next.left && !next.right && document.activeElement?.closest('.s23-scroll-tools')) { region.focus({ preventScroll: true }); revealControl(region); }
      setEdges(old => old.left === next.left && old.right === next.right ? old : next);
    };
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [ready]);
  function run(operation: () => Operation, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const token = ++intent.current;
    setNotice(null); void operation().then(result => finish(result, origin, token));
  }
  const update = (patch: Partial<LabelReportQuery>, origin?: HTMLElement | null) => run(() => controller.update(patch), origin);
  function retryRead() {
    run(() => controller.load(controller.getSnapshot().acceptedQuery ?? structuredClone(defaults)));
  }
  const sort = (key: string) => update({ sortKey: key as LabelSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' });
  async function openPrint(row: LabelReportRow, origin: HTMLElement) {
    const action = labelAction(row);
    if (!printService.available()) {
      recordReviewDiagnostic({ kind: 'blocked-action', key: `S23:${row.labelCode}:${action}`, detail: printState.code ?? 'PRINT_ACTOR_SCOPE_UNCONFIRMED' });
      notify(printTx('In lại và thử lại chưa được cấp quyền cho phiên hiện tại.'), origin);
      return;
    }
    if (!await printService.dismiss()) return;
    printOpener.current = origin;
    setPrintTarget(structuredClone(row)); setPrintOpen(true);
  }
  async function closePrint() {
    if (!await printService.dismiss()) return;
    setPrintOpen(false); setPrintTarget(null);
  }
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    // Account for the area covered by pins. Consecutive views must overlap,
    // including narrow/reflow layouts, so the arrows never skip middle content.
    const pinnedWidth = [...region.querySelectorAll<HTMLElement>('thead [data-sticky-column]')]
      .reduce((width, cell) => width + cell.getBoundingClientRect().width, 0);
    region.scrollBy({ left: direction * labelTableScrollStep(region.clientWidth, pinnedWidth), behavior: 'instant' });
  }
  const columns: TableColumn<LabelReportRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'labelCode', heading: tx('Mã nhãn'), sortKey: 'labelCode', render: row => <strong className="s23-code">{row.labelCode}</strong> },
    { id: 'documentCode', heading: tx('Mã phiếu'), sortKey: 'documentCode', render: row => row.documentCode },
    { id: 'product', heading: tx('SKU/Sản phẩm'), render: row => <div className="s23-product"><strong>{row.productName}</strong><span>{row.sku}</span></div> },
    { id: 'printedAt', heading: tx('Thời gian in'), sortKey: 'printedAt', sortType: 'date', render: row => <time className="s23-time" dateTime={row.printedAt}>{formatBusinessTimestamp(row.printedAt, language)}</time> },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'Lỗi in' ? 'warning' : 'success'}>{tx(row.status)}</StatusBadge> },
    { id: 'printCount', heading: tx('Số lần in'), sortKey: 'printCount', sortType: 'number', align: 'end', render: row => row.printCount },
    { id: 'actions', heading: tx('Thao tác'), kind: 'actions', render: row => <Button variant="ghost" aria-label={tx(`${labelAction(row)} nhãn ${row.labelCode}`)} aria-disabled={!printService.available() || state.loading || state.debouncing} aria-describedby="s23-action-limit" onClick={event => { if (!state.loading && !state.debouncing) void openPrint(row, event.currentTarget); }}>{tx(labelAction(row))}</Button> },
  ];
  const printBusy = printState.phase === 'pending';
  const printUncertain = printState.phase === 'unknown';
  const printLabel = printState.request?.payload.labelCode ?? printTarget?.labelCode ?? '';
  const printResultRow = printState.outcome?.receipt.record.data.rows.find(row => row.labelCode === printLabel);
  const confirmation = printState.phase === 'idle';
  const retryPrint = printState.request?.command === 'labels.retry' || !printState.request && printTarget?.status === 'Lỗi in';
  const printMessage = printState.phase === 'success' ? printTx('Tác vụ đã hoàn tất trong bản xem trước. Số lần in: {count}.', { count: printResultRow?.printCount ?? 0 })
    : printBusy ? printTx('Đang xử lý tác vụ của nhãn {labelCode}. Chưa tăng số lần in.', { labelCode: printLabel })
    : printUncertain ? printTx('Chưa xác định được kết quả tác vụ. Không gửi tác vụ mới cho đến khi kiểm tra xong.')
    : ['LABEL_STATE_CHANGED', 'STALE_VERSION', 'STALE_DEMO_EPOCH'].includes(printState.code ?? '') ? printTx('Dữ liệu nhãn đã thay đổi. Đóng hộp thoại và tải lại danh sách trước khi thử lại.')
    : ['MOCK_COMMAND_FORBIDDEN', 'SESSION_EXPIRED', 'CONFIRMATION_REQUIRED', 'PRINT_ACTOR_SCOPE_UNCONFIRMED'].includes(printState.code ?? '') ? printTx('Phiên hiện tại chưa được cấp quyền chạy tác vụ nhãn. Số lần in không thay đổi.')
    : printState.code?.startsWith('RECOVERY_') ? printTx('Chưa thể đối chiếu tác vụ. Giữ nguyên yêu cầu để kiểm tra lại.')
    : printTx('Tác vụ chưa hoàn tất. Số lần in không thay đổi.');
  const summary = model?.summary, period = model?.query.period ?? defaults.period;
  const activeFilters: { key: 'search' | 'status'; label: string }[] = [];
  if (model?.query.search.trim()) activeFilters.push({ key: 'search', label: tx(`Tìm: ${model.query.search.trim()}`) });
  if (model?.query.status) activeFilters.push({ key: 'status', label: tx(model.query.status) });
  function removeFilter(key: 'search' | 'status') {
    // The chip disappears after a read; preserve focus on a stable shared control.
    const target = screen.current?.querySelector<HTMLInputElement>('#s23-query-search');
    target?.focus({ preventScroll: true }); if (target) revealControl(target);
    update({ [key]: '' });
  }
  return <GlobalShell title={tx("Nhãn, đóng gói & in lại")} variant="wms" activeKey="S23" navigation={S00_SHELL_NAVIGATION}>
    <div ref={screen} className="hn-catalogue-screen s23-screen" data-screen="S23" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <CataloguePageHeader appearance="worklist" title={tx("Nhãn, đóng gói & in lại")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Nhãn, đóng gói & in lại")}
        actions={<div className="s23-report-controls"><div className="s23-period-field"><DateRangePicker id="s23-period" label={tx("Kỳ báo cáo · Giờ Việt Nam")} value={query.period} clearable={false} onChange={next => {
          // The selected calendar day unmounts when Range closes. Keep the
          // stable trigger as feedback origin, not that disappearing day button.
          if (next) update({ period: next }, screen.current?.querySelector<HTMLElement>('#s23-period') ?? null);
        }} /></div><div className="s23-export"><ReportExcelButton screen="S23" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div></div>} />
      {notice?.origin?.closest('.hn-page-heading') && <div data-s23-notice="heading" />}
      {summary && <section className="s23-overview" aria-label={tx('Tổng hợp toàn kỳ {period}', { period: formatBusinessPeriod(period, language) })}>
        <CatalogueSummary label={tx("Tổng hợp in nhãn toàn kỳ")} columns={4} density="compact">
          <SummaryMetric label={tx("Nhãn duy nhất")} value={summary.uniqueLabels.toLocaleString(tx('vi-VN'))} detail={tx("nhãn")} icon="tag" />
          <SummaryMetric label={tx("In thành công")} value={summary.successful.toLocaleString(tx('vi-VN'))} detail={<StatusBadge tone="success">{formatDeclaredPercentage(summary.successRate, language)}</StatusBadge>} icon="circle-check" />
          <SummaryMetric label={tx("Lỗi in")} value={<span className="s23-error-value">{summary.errors.toLocaleString(tx('vi-VN'))}</span>} detail={tx("nhãn")} icon="alert-circle" />
          <SummaryMetric label={tx("Lượt in lại")} value={summary.reprints.toLocaleString(tx('vi-VN'))} detail={tx("lượt · tính riêng")} icon="history" />
        </CatalogueSummary>
        <p className="s23-summary-note"><span><Icon name="calendar" size={16} />{tx("Số liệu toàn kỳ · Không đổi theo bộ lọc chi tiết")}</span><span>{tx("Lượt in lại không cộng vào nhãn duy nhất.")}</span></p>
      </section>}
      {model ? <section ref={list} className="s23-list hn-card hn-premium-panel" aria-labelledby="s23-list-title">
        <div className="s23-list-heading"><CatalogueListHeader density="compact" id="s23-list-title" title={tx("Chi tiết nhãn")} /><p className="s23-result-count" role="status" aria-live="polite" aria-atomic="true"><b>{model.pagination.total}</b> {tx("/")} {model.source.detailTotal} {tx("nhãn trong tập chi tiết")}</p></div>
        <div className="s23-toolbar"><CatalogueToolbar id="s23-query" label={tx("Tìm và lọc nhãn")} searchLabel={tx("Tìm mã nhãn, phiếu, SKU hoặc tên sản phẩm")} searchHint={tx("Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.")} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => run(() => controller.reset(structuredClone(defaults)))} searchPlaceholder={tx("Tìm mã nhãn, phiếu, SKU, tên sản phẩm…")} applyMode="immediate" layout="worklist" filterSizing="compact" searchHintMode="sr-only" queryContext={null} busy={state.loading || state.debouncing}>
          <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.currentTarget.value as LabelReportQuery['status'] })}><option value="">{tx("Tất cả trạng thái")}</option>{model.filterOptions.status.map(status => <option key={status} value={status}>{tx(status)}</option>)}</FilterSelect>
        </CatalogueToolbar></div>
        <div className="s23-filter-context"><CatalogueActiveFilters items={activeFilters} onRemove={removeFilter} /></div>
        <div className="s23-table-context"><p id="s23-action-limit" className="s23-action-limit">{printTx(printAdapter?.available ? 'Số lần in thay đổi sau khi tác vụ hoàn tất.' : 'In lại và thử lại chưa được cấp quyền cho phiên hiện tại.')}</p>{(edges.left || edges.right) && <div className="s23-scroll-tools"><span><Icon name="arrows-horizontal" size={16} />{tx("Cuộn xem thêm")}</span><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-disabled={!edges.left} onClick={() => { if (edges.left) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-disabled={!edges.right} onClick={() => { if (edges.right) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>}</div>
        <DataTable caption={tx("Danh sách nhãn trong kỳ báo cáo")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.labelCode} sort={model.query.sortKey ? { key: model.query.sortKey, direction: model.query.sortDirection } : null} onSort={sort} appearance="refined" density="compact" sortIndicatorAppearance="quiet" rowActionAppearance="quiet" stickyColumnIds={edges.left || edges.right ? ['labelCode'] : []} stickyEndColumnIds={edges.left || edges.right ? ['actions'] : []} stickyHeader scrollResetKey={JSON.stringify(model.query)} busy={state.loading || state.debouncing} emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("nhãn")} /> : null} />
        <div data-s23-notice="table" />
        <div className="s23-pagination"><Pagination variant="products" unit={tx("nhãn")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus /></div>
      </section> : <section className="s23-read-state hn-card hn-premium-panel" aria-label={tx("Báo cáo nhãn")}>
        <CatalogueListHeader id="s23-read-title" title={tx("Chi tiết nhãn")} density="compact" />
        <PageState kind={state.loading || !initialReadFailed && !state.blocker ? 'loading' : state.error ? 'error' : 'stale'}
          title={tx(state.loading ? 'Đang đọc báo cáo…' : state.error ? 'Chưa thể đọc báo cáo' : state.blocker ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn' : 'Báo cáo hiện chưa khả dụng')}
          description={tx(state.loading ? 'Đang đọc số liệu in nhãn của kỳ báo cáo.' : state.error ? reportReadErrorMessage(false) : 'Chưa có số liệu cho kỳ báo cáo này.')}
          onRetry={(initialReadFailed || Boolean(state.blocker)) && !state.loading ? retryRead : undefined} />
      </section>}
      <GlobalModal open={printOpen} className="s23-print-dialog" size="small"
        resolveReturnFocus={() => screen.current?.querySelector<HTMLElement>('#s23-query-search') ?? null}
        title={printTx(confirmation ? retryPrint ? 'Xác nhận thử lại nhãn {labelCode}' : 'Xác nhận in lại nhãn {labelCode}' : 'Tác vụ nhãn {labelCode}', { labelCode: printLabel })}
        description={printTx('Tác vụ chạy trong bản xem trước; không gửi lệnh đến máy in.')}
        onClose={() => { if (!printBusy && !printUncertain) void closePrint(); }} aria-busy={printBusy}
        footer={<div className="s23-print-actions">
          <Button variant="secondary" disabled={printBusy || printUncertain} onClick={() => void closePrint()}>{printTx(confirmation ? 'Hủy' : 'Đóng')}</Button>
          {confirmation && printTarget && <Button variant="primary" onClick={() => void printService.submit(printTarget)}>{printTx(retryPrint ? 'Xác nhận thử lại' : 'Xác nhận in lại')}</Button>}
          {printUncertain && printAdapter?.recovery && <Button variant="primary" onClick={() => void printService.reconcile()}>{printTx('Kiểm tra kết quả')}</Button>}
          {printState.phase === 'blocked' && printState.code?.startsWith('RECOVERY_') && printAdapter?.recovery && <Button variant="primary" onClick={() => void printService.restore()}>{printTx('Kiểm tra kết quả')}</Button>}
        </div>}>
        {printTarget && <dl className="s23-print-details"><div><dt>{printTx('Mã nhãn')}</dt><dd>{printLabel}</dd></div><div><dt>{printTx('Mã phiếu')}</dt><dd>{printTarget.documentCode}</dd></div><div><dt>{printTx('SKU/Sản phẩm')}</dt><dd>{printTarget.productName}<span>{printTarget.sku}</span></dd></div><div><dt>{printTx('Số lần in')}</dt><dd>{printResultRow?.printCount ?? printTarget.printCount}</dd></div></dl>}
        {confirmation ? <p className="s23-print-confirm">{printTx('Kiểm tra đúng nhãn trước khi xác nhận.')} {printTx('Số lần in chỉ tăng khi tác vụ hoàn tất thành công.')}</p>
          : <p className="s23-print-outcome" data-print-phase={printState.phase} role={['failed', 'blocked', 'unknown'].includes(printState.phase) ? 'alert' : 'status'}>{printMessage}</p>}
      </GlobalModal>
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} protectedContentSelector=".s23-overview,.s23-toolbar" resolveInlineSlot={origin => screen.current?.querySelector<HTMLElement>(origin?.closest('.hn-page-heading') ? '[data-s23-notice="heading"]' : origin?.closest('.hn-table') ? '[data-s23-notice="table"]' : '[data-feedback-slot="query"]') ?? null} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s23-period') ?? null} revealInlineOnOpen />}
    </div>
  </GlobalShell>;
}

