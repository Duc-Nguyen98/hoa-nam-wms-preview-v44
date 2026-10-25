import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { OperationalReceipts } from './OperationalReceipts';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import type { ReceiptAdapter } from './receipt-binding';
import { OPERATIONS_EN_COPY, renderOperationsText, uiText, uiList, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createReceiptsController } from '../../controllers/receipts-controller';
import { DEFAULT_RECEIPTS_QUERY, type ReceiptRow, type ReceiptsAdapter, type ReceiptsQuery } from '../../contracts/receipts';
import { InitialReadState, Button, CataloguePageHeader, CatalogueSummary, SummaryMetric, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge, ordinalColumn } from '../../shared';
import { useKeyboardFocusReveal } from '../../shared/focus';
import type { NoticeFeedback, TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import './receipts.css';
import { ReceiptDetail } from './ReceiptDetail';
import { resolveReceiptDetailRow, type ReceiptDetailTarget } from './receipt-detail';

const RECEIPTS_COPY = { ...OPERATIONS_EN_COPY, 'Tạo và sửa chưa khả dụng.': 'These historical receipts are read only.', 'Phiên hiện tại': 'Current session', 'Danh sách trước đây': 'Historical list', 'Danh sách trước đây chỉ xem.': 'Historical receipts are read only.', 'Theo dõi phiếu nhập · Chỉ xem': 'Track receipt · Read only', 'Xem': 'View' };

type Operation = ReturnType<ReturnType<typeof createReceiptsController>['load']>;
type QueryAction = 'initial' | 'search' | 'filter' | 'sort' | 'page' | 'pageSize' | 'reset';

// Feedback survives rollback: identify the attempted condition without allowing
// a long pasted query to occupy the whole viewport. This is not query matching.
function feedbackValue(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 80 ? `${normalized.slice(0, 80)}…` : normalized;
}

export function ReceiptsScreen({ adapter, operationalAdapter }: { adapter?: ReceiptsAdapter; operationalAdapter?: ReceiptAdapter } = {}) {
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S12' }), [operationalAdapter]);
  const [cohort, setCohort] = useState(operational.available ? 'scenario' : 'legacy');
  const tx = useUiCopy(RECEIPTS_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const controller = useMemo(() => createReceiptsController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? DEFAULT_RECEIPTS_QUERY;
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [detail, setDetail] = useState<(ReceiptDetailTarget & { origin: HTMLElement }) | null>(null);
  const feedbackIntent = useRef(0), sequence = useRef(0);
  const table = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const hasModel = model !== null;
  useLayoutEffect(() => {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    region.id = 's12-table-scroll';
    const measure = () => {
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s12-scroll-tools')) region.focus({ preventScroll: true });
      setScroll(current => current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    region.addEventListener('scroll', measure, { passive: true }); measure();
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [hasModel, cohort]);
  const revealFocus = useKeyboardFocusReveal();
  const resolveFocusFallback = useCallback((origin: HTMLElement | null) =>
    origin?.closest('th[data-column="updated"]') ? document.getElementById('s12-sort') : null, []);
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, action: QueryAction, intent: number) => {
    if (outcome.kind === 'superseded' || intent !== feedbackIntent.current) return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S12_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách phiếu nhập. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S12:${outcome.result.reason}`, detail: outcome.result.detail });
      const reason = action === 'page' ? uiText('Chưa thể tải danh sách phiếu nhập ở trang {page}.', { page: outcome.result.query.page })
        : action === 'pageSize' ? uiText('Chưa thể đổi số dòng mỗi trang thành {count}.', { count: outcome.result.query.pageSize })
        : action === 'sort' ? uiText('Chưa thể đổi thứ tự cập nhật của danh sách.')
        : action === 'search' ? uiText('Chưa thể tìm “{search}” lúc này.', { search: feedbackValue(outcome.result.query.search) })
        : uiText('Chưa thể lọc danh sách phiếu nhập lúc này. {filters}.', { filters: uiList([
          outcome.result.query.search && uiText('Tìm kiếm: {value}', { value: feedbackValue(outcome.result.query.search) }),
          outcome.result.query.status && uiText('Trạng thái: {value}', { value: uiText(feedbackValue(outcome.result.query.status)) }),
          outcome.result.query.source && uiText('Nguồn nhập: {value}', { value: feedbackValue(outcome.result.query.source) }),
        ]) });
      notify(uiText('{reason} Đã giữ danh sách và điều kiện trước đó.', { reason }), origin);
    } else if (action === 'reset') {
      table.current?.querySelector('.hn-table-scroll')?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      notify('Đã đặt lại điều kiện và vị trí bảng.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    void controller.load({ ...DEFAULT_RECEIPTS_QUERY }).then(result => { if (active) finish(result, null, 'initial', 0); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  function run(operation: () => Operation, action: QueryAction, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const intent = ++feedbackIntent.current;
    setNotice(null);
    void operation().then(result => finish(result, origin, action, intent));
  }
  function update(patch: Partial<ReceiptsQuery>, action: QueryAction, origin?: HTMLElement | null) { run(() => controller.update(patch), action, origin); }
  function scrollTable(direction: -1 | 1) {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll');
    region?.scrollBy({ left: direction * Math.max(44, region.clientWidth - 32), behavior: 'instant' });
  }
  function entryPoint(action: string, origin: HTMLElement, receipt?: string) {
    ++feedbackIntent.current;
    // The new action supersedes pending query intent as well as its feedback.
    // Restore accepted controls now, not later when an obsolete timer resolves.
    controller.cancel();
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S12:FLOW_NOT_SUPPLIED', detail: `${action}: no assigned form/detail/write flow; no mutation.` });
    notify(uiText('{action}{code} chưa khả dụng.', { action: uiText(action), code: receipt ? ` ${receipt}` : '' }), origin);
  }
  function openDetail(row: ReceiptRow, origin: HTMLElement) {
    ++feedbackIntent.current;
    controller.cancel();
    setNotice(null);
    setDetail({ receipt: row.receipt, sourceId: controller.getSnapshot().model?.source.id ?? '', origin });
  }
  const columns: TableColumn<ReceiptRow>[] = [
    ordinalColumn<ReceiptRow>(model?.pagination.page, model?.pagination.pageSize),
    { id: 'receipt', heading: tx('Phiếu'), render: row => <div className="s12-stack"><strong className="s12-code">{row.receipt}</strong><span className="s12-merged-creator s12-meta"><span className="hn-sr-only">{tx("Người tạo:")} </span>{row.creator}</span><span className="s12-compact s12-meta"><span className="hn-sr-only">{tx("Cập nhật:")} </span>{row.updatedAt}</span></div> },
    { id: 'source', heading: tx('Nguồn / Tham chiếu'), headingContent: <><span className="s12-wide">{tx("Nguồn / Tham chiếu")}</span><span className="s12-compact">{tx("Nguồn & tiến độ")}</span></>, render: row => <div className="s12-stack"><span className="s12-primary">{row.source}</span><span className="s12-meta">{row.reference}</span><span className="s12-compact s12-meta">{row.skuCount} {tx("SKU ·")} {row.codeCount} {tx("mã")}</span></div> },
    { id: 'progress', heading: tx('Tiến độ ghi nhận'), render: row => <span className="s12-number">{row.skuCount} {tx("SKU ·")} {row.codeCount} {tx("mã")}</span> },
    { id: 'creator', heading: tx('Người tạo'), render: row => <span className="s12-primary">{row.creator}</span> },
    { id: 'status', heading: tx('Trạng thái'), render: row => <StatusBadge tone={row.status === 'Đã nhập kho' ? 'success' : row.status === 'Đang ghi nhận' ? 'warning' : 'neutral'}>{tx(row.status)}</StatusBadge> },
    { id: 'updated', heading: tx('Cập nhật'), sortKey: 'updatedAt', sortType: 'date', render: row => <span className="s12-stack s12-meta"><span>{row.updatedAt.split(' ')[0]}</span><span>{row.updatedAt.split(' ')[1]}</span></span> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: row => ['Chi tiết', 'Xem'].includes(row.action)
      ? <Button variant="ghost" className="s12-view" aria-label={`${tx(row.action)} ${row.receipt}`} onClick={event => openDetail(row, event.currentTarget)}><Icon name="eye" size={18} />{tx(row.action)}</Button>
      : <span className="s12-row-actions"><Button variant="ghost"
        className={row.action === 'Theo dõi' ? 's12-track' : 's12-guarded-action'}
        aria-describedby={row.action === 'Theo dõi' ? undefined : 's12-flow-limit'}
        aria-haspopup={row.action === 'Theo dõi' ? 'dialog' : undefined}
        title={row.action === 'Theo dõi' ? tx('Theo dõi phiếu nhập · Chỉ xem') : undefined}
        aria-label={`${tx(row.action)} ${row.receipt}`}
        onClick={event => row.action === 'Theo dõi' ? openDetail(row, event.currentTarget) : entryPoint(row.action, event.currentTarget, row.receipt)}
      ><Icon name={row.action === 'Chỉnh sửa' ? 'edit' : 'eye'} size={18} />{tx(row.action)}</Button><Button variant="ghost" iconOnly className="s12-view" aria-label={`${tx('Xem')} ${row.receipt}`} onClick={event => openDetail(row, event.currentTarget)}><Icon name="eye" size={18} /></Button></span> },
  ];
  return <GlobalShell title={tx("Danh sách phiếu nhập")} variant="wms" activeKey="S12" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div className="hn-catalogue-screen s12-screen" data-screen="S12" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <CataloguePageHeader appearance="compact" title={tx("Danh sách phiếu nhập")} description={tx("Theo dõi phiếu nhập trong phiên hiện tại.")} breadcrumb={tx("Danh sách phiếu nhập")} parentLabel={tx("Nhập kho")} actions={cohort === 'legacy' ? <Button aria-describedby="s12-flow-limit" onClick={event => entryPoint('Tạo phiếu nhập', event.currentTarget)}><Icon name="plus" />{tx("Tạo phiếu nhập")}</Button> : undefined} />
      {operational.available && <div className="s12-action-row"><Button variant="secondary" onClick={() => setCohort('scenario')} aria-pressed={cohort === 'scenario'}>{tx('Phiên hiện tại')}</Button><Button variant="secondary" onClick={() => setCohort('legacy')} aria-pressed={cohort === 'legacy'}>{tx('Danh sách trước đây')}</Button></div>}
      {cohort === 'scenario' ? <OperationalReceipts adapter={operational} notify={message => notify(uiText(message), null, 'success')} /> : <>
      {model ? <>
        <section className="s12-summary" aria-labelledby="s12-summary-title">
          <h2 id="s12-summary-title" className="hn-sr-only">{tx("Theo dõi nhập kho")}</h2>
          <div className="s12-summary-grid">
            <div className="s12-received"><div className="s12-received-heading"><span>{tx("Đã nhập kho")}</span><strong>{model.summary.received} <span>/ {model.summary.totalReceipts}</span></strong><span className="s12-rate">{formatDeclaredPercentage(model.summary.percentage, language)}</span></div><progress max={model.summary.totalReceipts} value={model.summary.received} aria-label={tx("Tỷ lệ phiếu đã nhập kho")} /></div>
            <CatalogueSummary label={tx("Số liệu tổng hợp nhập kho")} columns={3} appearance="inline" density="compact"><SummaryMetric label={tx("Nháp")} value={model.summary.draft} /><SummaryMetric label={tx("Đang ghi nhận")} value={model.summary.recording} /><SummaryMetric label={tx("Mã đã quét")} value={model.summary.scannedCodeAggregate.toLocaleString(locale)} /></CatalogueSummary>
          </div>
          <p className="s12-note"><Icon name="info" size={16} />{tx("Chỉ phiếu đã nhập kho được xác nhận mới làm tăng tồn kho.")}</p>
        </section>
        <section className="s12-list hn-premium-panel" aria-labelledby="s12-list-title">
          <h2 id="s12-list-title" className="hn-sr-only">{tx("Hồ sơ phiếu nhập")}</h2>
          <CatalogueToolbar id="s12" layout="worklist" label={tx("Tìm kiếm và lọc phiếu nhập")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tìm theo mã phiếu, nguồn hoặc tham chiếu.")} searchHintMode="sr-only" searchPlaceholder={tx("Phiếu, nguồn, tham chiếu…")} searchValue={query.search} onSearchChange={search => update({ search }, 'search', document.getElementById('s12-search'))} onReset={() => run(() => controller.reset({ ...DEFAULT_RECEIPTS_QUERY }), 'reset')} applyMode="immediate" busy={state.loading} queryContext={null} trailingControls={<FilterSelect id="s12-sort" label={tx("Sắp xếp")} aria-label={tx("Sắp xếp cập nhật")} value={query.sort} onChange={event => update({ sort: event.target.value as ReceiptsQuery['sort'] }, 'sort', event.currentTarget)}><option value="updated-desc">{tx("Cập nhật mới nhất")}</option><option value="updated-asc">{tx("Cập nhật cũ nhất")}</option></FilterSelect>}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.status.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Nguồn nhập")} value={query.source} onChange={event => update({ source: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.source.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <p className="s12-source-limit"><Icon name="info" size={16} /><span id="s12-flow-limit">{tx('Danh sách trước đây chỉ xem.')}</span></p>
          <NoticeSlot name="table" />
          <div ref={table} className="s12-table"><DataTable caption={tx("Danh sách phiếu nhập")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.receipt} stickyHeader sort={{ key: 'updatedAt', direction: model.query.sort === 'updated-desc' ? 'desc' : 'asc' }} onSort={() => update({ sort: model.query.sort === 'updated-desc' ? 'updated-asc' : 'updated-desc' }, 'sort', document.querySelector<HTMLElement>('.s12-table th[data-column="updated"] button'))} scrollResetKey={JSON.stringify(model.query)} busy={state.loading} emptyContent={<p role="status">{tx("Không tìm thấy kết quả phù hợp. Hãy thử đổi từ khóa hoặc điều chỉnh bộ lọc.")}</p>} /></div>
          {scroll.overflow && <div className="s12-scroll-tools"><span>{tx("Cột ngoài khung nhìn")}</span><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s12-table-scroll" aria-disabled={scroll.start} onClick={() => { if (!scroll.start) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s12-table-scroll" aria-disabled={scroll.end} onClick={() => { if (!scroll.end) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>}
          <Pagination variant="products" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize }, 'pageSize', document.querySelector<HTMLElement>('.s12-list .hn-page-size select'))} />
          <NoticeSlot name="pagination" />
        </section>
      </> : <InitialReadState label={tx("danh sách phiếu nhập")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? DEFAULT_RECEIPTS_QUERY) }), 'initial')} />}
      {detail && <ReceiptDetail row={resolveReceiptDetailRow(model, detail)} origin={detail.origin} onClose={() => setDetail(null)} />}
      </>}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} resolveFocusFallback={resolveFocusFallback} protectedContentSelector=".s12-summary, .s12-list, .s12-screen .hn-page-heading, .s12-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
