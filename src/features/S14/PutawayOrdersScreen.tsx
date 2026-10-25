import { renderOperationsText, uiText, uiList, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPutawayOrdersController } from '../../controllers/putaway-orders-controller';
import { DEFAULT_PUTAWAY_ORDERS_QUERY as defaults, type PutawayOrdersAdapter, type PutawayOrdersQuery, type PutawayOrderRow } from '../../contracts/putaway-orders';
import { InitialReadState, Button, CataloguePageHeader, CatalogueNavTabs, CatalogueSummary, SummaryMetric, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge } from '../../shared';
import type { NoticeFeedback, TableColumn } from '../../shared';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { screenRegistry } from '../../app/registry';
import './putaway-orders.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalPutawayOrders, PUTAWAY_BINDING_COPY } from './OperationalPutawayOrders';
import type { PutawayAdapter } from './putaway-binding';
import { PutawayOrderDetail, PUTAWAY_DETAIL_COPY } from './PutawayOrderDetail';
import { resolvePutawayDetail } from './PutawayDetailSelection';

type Operation = ReturnType<ReturnType<typeof createPutawayOrdersController>['load']>;
type QueryAction = 'initial' | 'search' | 'filter' | 'page' | 'pageSize' | 'reset';
const shortValue = (value: string) => { const text = value.trim().replace(/\s+/g, ' '); return text.length > 80 ? `${text.slice(0, 80)}…` : text; };
const tone = (row: PutawayOrderRow) => row.status === 'Đã xác nhận' ? 'success' : 'neutral';

export function PutawayOrdersScreen({ adapter, operationalAdapter }: { adapter?: PutawayOrdersAdapter; operationalAdapter?: PutawayAdapter } = {}) {
  const tx = useUiCopy({ ...PUTAWAY_DETAIL_COPY, ...PUTAWAY_BINDING_COPY });
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S14' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createPutawayOrdersController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [detail, setDetail] = useState<{ key: string; origin: HTMLElement } | null>(null);
  const intent = useRef(0), sequence = useRef(0), table = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, noticeTone: NoticeFeedback['tone'] = 'info') => setNotice({ message, origin, tone: noticeTone, sequence: ++sequence.current, container: document.body }), []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, action: QueryAction, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S14_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách lệnh. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      const q = outcome.result.query;
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S14:${outcome.result.reason}`, detail: outcome.result.detail });
      const reason = action === 'page' ? uiText('Chưa thể tải danh sách lệnh ở trang {page}.', { page: q.page })
        : action === 'pageSize' ? uiText('Chưa thể đổi số dòng mỗi trang thành {count}.', { count: q.pageSize })
        : action === 'search' ? uiText('Chưa thể tìm “{search}” lúc này.', { search: shortValue(q.search) })
        : uiText('Chưa thể lọc danh sách lệnh lúc này. {filters}.', { filters: uiList([q.search && uiText('Tìm kiếm: {value}', { value: shortValue(q.search) }), q.status && uiText('Trạng thái: {value}', { value: uiText(q.status) }), q.sourceReceipt && uiText('Phiếu nhập nguồn: {value}', { value: q.sourceReceipt })]) });
      notify(uiText('{reason} Đã giữ danh sách và điều kiện trước đó.', { reason }), origin);
    } else if (action === 'reset') {
      table.current?.querySelector('.hn-table-scroll')?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      notify('Đã đặt lại điều kiện và vị trí bảng.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    void controller.load({ ...defaults }).then(result => { if (active) finish(result, null, 'initial', intent.current); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  const hasModel = model !== null;
  useLayoutEffect(() => {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll'); if (!region) return;
    region.id = 's14-table-scroll';
    let frame: number | null = null;
    const revealTable = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && region.contains(focused) && focused.matches(':focus-visible') && !document.querySelector('dialog[open]')) {
          // Reveal the bounded work area before the individual control. The
          // shared helper retains the existing ring and sticky-header clearance.
          revealControl(region); revealControl(focused);
        }
      });
    };
    const measure = () => {
      // Use document position, not current scroll position: reading/scrolling
      // must not resize the table. Keep a usable area at high browser zoom.
      const top = region.getBoundingClientRect().top + window.scrollY;
      const footer = region.closest('.s14-list')?.querySelector('.hn-pagination')?.getBoundingClientRect().height ?? 76;
      const height = Math.max(224, window.innerHeight - top - footer - 16);
      region.style.setProperty('--s14-table-available-height', `${height}px`);
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s14-scroll-tools')) region.focus({ preventScroll: true });
      setScroll(old => old.overflow === next.overflow && old.start === next.start && old.end === next.end ? old : next);
    };
    const observer = new ResizeObserver(() => { measure(); revealTable(); }); observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    const screen = region.closest('.s14-screen');
    screen?.querySelectorAll('.s14-overview,.hn-catalogue-nav,.s14-filters,.s14-scroll-tools,.hn-pagination,.hn-notice-slot').forEach(element => observer.observe(element));
    region.addEventListener('focusin', revealTable);
    window.addEventListener('resize', measure);
    region.addEventListener('scroll', measure, { passive: true }); measure();
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); region.removeEventListener('focusin', revealTable); window.removeEventListener('resize', measure); if (frame !== null) cancelAnimationFrame(frame); };
  }, [hasModel, cohort]);
  function run(operation: () => Operation, action: QueryAction, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const token = ++intent.current; setNotice(null);
    void operation().then(result => finish(result, origin, action, token));
  }
  function update(patch: Partial<PutawayOrdersQuery>, action: QueryAction, origin?: HTMLElement | null) { run(() => controller.update(patch), action, origin); }
  function cancelPending() { ++intent.current; controller.cancel(); setNotice(null); }
  function blockedAction(action: string, origin: HTMLElement, order?: string) {
    cancelPending();
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S14:MISSING_FLOW', detail: `${action}${order ? ` ${order}` : ''}: no assigned flow; no write.` });
    notify(order ? uiText('{action} cho {code} chưa khả dụng.', { action: uiText(action), code: order }) : uiText('{action}{code} chưa khả dụng.', { action: uiText(action), code: '' }), origin);
  }
  function openDetail(orderCode: string, origin: HTMLElement) {
    cancelPending();
    setDetail({ key: orderCode, origin });
  }
  function scrollTable(direction: -1 | 1) { const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll'); region?.scrollBy({ left: direction * Math.max(44, region.clientWidth - 32), behavior: 'instant' }); }
  const route = (key: string) => screenRegistry.find(screen => screen.key === key)?.href;
  const columns: TableColumn<PutawayOrderRow>[] = [
    { id: 'order', heading: tx('Mã lệnh'), headingContent: <><span className="s14-wide">{tx("Mã lệnh")}</span><span className="s14-compact">{tx("Lệnh / BOX / SKU")}</span></>, render: row => <div className="s14-stack"><strong className="s14-code">{row.orderCode}</strong><span className="s14-compact s14-code">{row.boxCode}</span><span className="s14-compact s14-meta">{row.sku}</span></div> },
    { id: 'box', heading: tx('BOX / SKU'), render: row => <div className="s14-stack"><span className="s14-code">{row.boxCode}</span><span className="s14-meta">{row.sku}</span></div> },
    { id: 'receipt', heading: tx('Phiếu nhập nguồn'), headingContent: <><span className="s14-wide">{tx("Phiếu nhập nguồn")}</span><span className="s14-compact">{tx("Phiếu / Khay")}</span></>, render: row => <div className="s14-stack"><span className="s14-code">{row.sourceReceipt}</span><span className="s14-compact s14-meta">{tx("Khay:")} {row.destinationTray === 'Chưa chọn khay' ? tx('Chưa chọn khay') : row.destinationTray}</span></div> },
    { id: 'tray', heading: tx('Khay đích'), render: row => <span className={row.destinationTray === 'Chưa chọn khay' || row.destinationTray === '—' ? 's14-meta' : 's14-code'}>{row.destinationTray === 'Chưa chọn khay' ? tx('Chưa chọn khay') : row.destinationTray}</span> },
    { id: 'quantity', heading: tx('Số lượng'), align: 'end', headingContent: <><span className="s14-wide">{tx("Số lượng")}</span><span className="s14-compact">{tx("Số lượng / Trạng thái")}</span></>, render: row => <div className="s14-stack"><strong className="s14-number">{row.quantity}</strong><span className="s14-compact"><StatusBadge tone={tone(row)}>{tx(row.status)}</StatusBadge></span><span className="s14-compact s14-meta">{tx("Cập nhật:")} {row.updatedAt} · <span aria-label={tx('Phiên bản {version}', { version: row.version })}>{row.version}</span></span></div> },
    { id: 'status', heading: tx('Trạng thái'), render: row => <StatusBadge tone={tone(row)}>{tx(row.status)}</StatusBadge> },
    { id: 'updated', heading: tx('Cập nhật / Phiên bản'), render: row => <span className="s14-meta">{row.updatedAt} · {row.version}</span> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: row => <div className="s14-row-actions"><Button variant="ghost" className="s14-detail-opener" aria-label={`${tx('Chi tiết')} ${row.orderCode}`} onClick={event => openDetail(row.orderCode, event.currentTarget)}><Icon name="eye" size={16} />{tx('Chi tiết')}</Button>{row.action === 'Tiếp tục' && <Button variant="ghost" className="s14-continue-guard" aria-label={`${tx(row.action)} ${row.orderCode}`} aria-disabled="true" aria-describedby="s14-action-limit" onClick={event => blockedAction(row.action, event.currentTarget, row.orderCode)}><Icon name="lock" size={16} />{tx(row.action)}</Button>}</div> },
  ];
  return <GlobalShell title={tx("Lệnh xếp khay")} variant="wms" activeKey="S14" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div className="hn-catalogue-screen s14-screen" data-screen="S14" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <div className="s14-overview" data-has-summary={cohort === 'legacy' && !!model}>
        <CataloguePageHeader appearance="worklist" title={tx("Lệnh xếp khay")} parentLabel={tx("Nhập kho")} breadcrumb={tx("Lệnh xếp khay")} />
        {cohort === 'legacy' && model && <div className="s14-summary"><CatalogueSummary label={tx("Số liệu lệnh xếp khay")} columns={4} density="compact" appearance="inline" alignRows><SummaryMetric label={tx("Tổng lệnh")} value={model.summary.totalOrders} /><SummaryMetric label={tx("Đã xác nhận")} value={model.summary.confirmedOrders} /><SummaryMetric label={tx("Nháp")} value={model.summary.draftOrders} /><SummaryMetric label={tx("Đã hủy")} value={model.summary.cancelledOrders} /></CatalogueSummary></div>}
      </div>
      <CatalogueNavTabs label={tx("Tra cứu xếp khay")} items={[
        { key: 'queue', label: tx('Hàng chờ'), count: cohort === 'legacy' ? model?.summary.relatedQueueBadge : undefined, icon: 'box', href: route('S13'), onClick: cancelPending },
        { key: 'orders', label: tx('Lệnh xếp khay'), count: cohort === 'legacy' ? model?.summary.totalOrders : undefined, icon: 'documents', current: true, onClick: cancelPending },
        { key: 'trays', label: tx('Danh sách khay'), icon: 'tray', href: route('S11'), onClick: cancelPending },
        { key: 'history', label: tx('Lịch sử'), icon: 'audit', unavailable: true, onClick: event => blockedAction('Lịch sử', event.currentTarget) },
      ]} />
      {operational.available && <FilterSelect label={tx('Nguồn dữ liệu')} aria-label={tx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => { setDetail(null); setCohort(event.target.value as 'scenario' | 'legacy'); }}><option value="scenario">{tx('Phiên hiện tại')}</option><option value="legacy">{tx('Dữ liệu đã duyệt')}</option></FilterSelect>}
      {cohort === 'scenario' ? <OperationalPutawayOrders adapter={operational} notify={message => notify(message, document.activeElement instanceof HTMLElement ? document.activeElement : null, 'success')} /> : model ? <>
        <section className="s14-list hn-premium-panel" aria-labelledby="s14-list-title">
          <h2 id="s14-list-title" className="hn-sr-only">{tx("Danh sách lệnh xếp khay")}</h2>
          <div className="s14-filters" aria-label={tx("Điều kiện lệnh xếp khay")}>
          <CatalogueToolbar id="s14" layout="worklist" filterDisclosure="always" label={tx("Tìm kiếm và lọc lệnh")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tìm theo mã lệnh, mã BOX hoặc SKU.")} searchHintMode="sr-only" searchPlaceholder={tx("Mã lệnh, mã BOX hoặc SKU…")} searchValue={query.search} onSearchChange={search => update({ search }, 'search', document.getElementById('s14-search'))} onReset={() => run(() => controller.reset({ ...defaults }), 'reset')} applyMode="immediate" busy={state.loading} queryContext={null}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.status.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Phiếu nhập nguồn")} value={query.sourceReceipt} onChange={event => update({ sourceReceipt: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.sourceReceipt.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
          </CatalogueToolbar>
          </div>
          <p className="s14-scope-note">{tx('Chi tiết {detail} lệnh trong tổng hợp {aggregate} lệnh.', { detail: model.source.detailTotal, aggregate: model.source.aggregateTotal ?? model.summary.totalOrders })}</p>
          <NoticeSlot name="table" />
          <div className="s14-scroll-tools" hidden={!scroll.overflow}><span>{tx("Cuộn để xem đủ thông tin lệnh")}</span><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s14-table-scroll" aria-disabled={scroll.start} onClick={() => { if (!scroll.start) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s14-table-scroll" aria-disabled={scroll.end} onClick={() => { if (!scroll.end) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>
          <div ref={table} className="s14-table"><DataTable caption={tx("Danh sách lệnh xếp khay")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.orderCode} stickyHeader scrollResetKey={JSON.stringify(model.query)} busy={state.loading} emptyContent={<p role="status">{tx("Không tìm thấy kết quả phù hợp. Hãy thử đổi từ khóa hoặc điều chỉnh bộ lọc.")}</p>} /></div>
          <Pagination variant="products" unit={tx("lệnh")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize }, 'pageSize', document.querySelector<HTMLElement>('.s14-list .hn-page-size select'))} />
          <NoticeSlot name="pagination" />
        </section>
        <section className="s14-guidance" aria-label={tx("Lưu ý và giới hạn thao tác")}>
          <Button variant="ghost" aria-expanded={guidanceOpen} aria-controls="s14-guidance-content" onClick={() => setGuidanceOpen(open => !open)}><Icon name="info" size={16} /><span className="s14-guidance-label">{tx("Lưu ý xếp khay và giới hạn thao tác")}</span><span className="s14-guidance-chevron" data-open={guidanceOpen}><Icon name="chevron-down" size={16} /></span></Button>
          <div id="s14-guidance-content" className="s14-guidance-content" hidden={!guidanceOpen}>
            <p>{tx("Theo dõi và xử lý lệnh xếp khay đã tạo từ Hàng chờ. Xếp khay chỉ cập nhật BOX → khay/vị trí, không làm thay đổi tổng tồn kho.")}</p>
            <p>{tx("Chỉ xác nhận hoặc hủy các lệnh nháp hợp lệ.")}</p>
            <p id="s14-action-limit">{tx("Tiếp tục chưa khả dụng.")}</p>
          </div>
        </section>
      </> : <InitialReadState label={tx("danh sách lệnh xếp khay")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? defaults) }), 'initial')} />}
      {detail && <PutawayOrderDetail row={resolvePutawayDetail(model, detail.key)} origin={detail.origin} onClose={() => setDetail(null)} />}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} protectedContentSelector=".s14-summary, .s14-list, .s14-screen .hn-page-heading, .s14-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
