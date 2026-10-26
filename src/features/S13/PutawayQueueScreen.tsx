import { OPERATIONS_EN_COPY, renderOperationsText, uiText, uiList, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPutawayQueueController } from '../../controllers/putaway-queue-controller';
import { DEFAULT_PUTAWAY_QUEUE_QUERY as defaults, type PutawayQueueAdapter, type PutawayQueueQuery, type PutawayQueueRow } from '../../contracts/putaway-queue';
import { InitialReadState, Button, CataloguePageHeader, CatalogueNavTabs, CatalogueSummary, SummaryMetric, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge } from '../../shared';
import type { NoticeFeedback, TableColumn } from '../../shared';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { screenRegistry } from '../../app/registry';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalPutawayQueue } from './OperationalPutawayQueue';
import type { PutawayCreateAdapter } from './putaway-create-binding';
import './putaway-queue.css';

type Operation = ReturnType<ReturnType<typeof createPutawayQueueController>['load']>;
type QueryAction = 'initial' | 'search' | 'filter' | 'page' | 'pageSize' | 'reset';
const shortValue = (value: string) => { const text = value.trim().replace(/\s+/g, ' '); return text.length > 80 ? `${text.slice(0, 80)}…` : text; };
const COPY = { ...OPERATIONS_EN_COPY, 'Phiên hiện tại': 'Current session', 'Danh sách trước đây': 'Previous list' };

export function PutawayQueueScreen({ adapter, operationalAdapter }: { adapter?: PutawayQueueAdapter; operationalAdapter?: PutawayCreateAdapter } = {}) {
  const tx = useUiCopy(COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S13' }), [operationalAdapter]);
  const [cohort, setCohort] = useState(operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createPutawayQueueController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const intent = useRef(0), sequence = useRef(0), table = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body }), []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, action: QueryAction, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S13_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách BOX. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      const q = outcome.result.query;
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S13:${outcome.result.reason}`, detail: outcome.result.detail });
      const reason = action === 'page' ? uiText('Chưa thể tải danh sách BOX ở trang {page}.', { page: q.page })
        : action === 'pageSize' ? uiText('Chưa thể đổi số dòng mỗi trang thành {count}.', { count: q.pageSize })
        : action === 'search' ? uiText('Chưa thể tìm “{search}” lúc này.', { search: shortValue(q.search) })
        : uiText('Chưa thể lọc danh sách BOX lúc này. {filters}.', { filters: uiList([q.search && uiText('Tìm kiếm: {value}', { value: shortValue(q.search) }), q.receiptCode && uiText('Phiếu nhập nguồn: {value}', { value: q.receiptCode })]) });
      notify(uiText('{reason} Đã giữ danh sách và điều kiện trước đó.', { reason }), origin);
    } else if (action === 'reset') {
      table.current?.querySelector('.hn-table-scroll')?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      notify('Đã đặt lại điều kiện và vị trí bảng. Lựa chọn BOX được giữ nguyên.', origin);
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
    region.id = 's13-table-scroll';
    const measure = () => {
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s13-scroll-tools')) region.focus({ preventScroll: true });
      setScroll(old => old.overflow === next.overflow && old.start === next.start && old.end === next.end ? old : next);
    };
    const observer = new ResizeObserver(measure); observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    region.addEventListener('scroll', measure, { passive: true }); measure();
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [hasModel, cohort]);
  function run(operation: () => Operation, action: QueryAction, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const token = ++intent.current; setNotice(null);
    void operation().then(result => finish(result, origin, action, token));
  }
  function update(patch: Partial<PutawayQueueQuery>, action: QueryAction, origin?: HTMLElement | null) { run(() => controller.update(patch), action, origin); }
  function cancelPending() { ++intent.current; controller.cancel(); setNotice(null); }
  function blockedAction(action: string, origin: HTMLElement, box?: string) {
    cancelPending();
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S13:MISSING_FLOW', detail: `${action}${box ? ` ${box}` : ''}: no assigned flow; no write.` });
    notify(action === 'Chọn tất cả BOX' ? 'Chưa có quy tắc chọn tất cả hoặc chọn nhiều trang. Vui lòng chọn từng BOX đang hiển thị; chưa có thao tác hàng loạt.' : box ? uiText('{action} cho {code} chưa khả dụng.', { action: uiText(action), code: box }) : uiText('{action}{code} chưa khả dụng.', { action: uiText(action), code: '' }), origin);
  }
  function toggleRow(code: string, checked: boolean) {
    cancelPending();
    setSelected(current => { const next = new Set(current); if (checked) next.add(code); else next.delete(code); return next; });
  }
  function scrollTable(direction: -1 | 1) { const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll'); region?.scrollBy({ left: direction * Math.max(44, region.clientWidth - 32), behavior: 'instant' }); }
  const trayRoute = screenRegistry.find(screen => screen.key === 'S11')?.href;
  const orderRoute = screenRegistry.find(screen => screen.key === 'S14')?.href;
  const columns: TableColumn<PutawayQueueRow>[] = [
    { id: 'selection', heading: tx('Chọn BOX'), kind: 'selection', headingContent: <label className="s13-check" title={tx("Chưa hỗ trợ chọn tất cả BOX. Hãy chọn từng BOX.")}><input type="checkbox" aria-label={tx("Chọn tất cả BOX")} aria-disabled="true" aria-describedby="s13-select-all-limit" checked={false} onChange={event => blockedAction('Chọn tất cả BOX', event.currentTarget)} /></label>, render: row => <label className="s13-check"><input type="checkbox" aria-label={tx('Chọn {code}', { code: row.boxCode })} aria-describedby="s13-selection-limit" checked={selected.has(row.boxCode)} onChange={event => toggleRow(row.boxCode, event.currentTarget.checked)} /></label> },
    { id: 'box', heading: tx('Mã BOX'), headingContent: <><span className="s13-wide">{tx("Mã BOX")}</span><span className="s13-compact">{tx("BOX / Linh kiện")}</span></>, render: row => <div className="s13-stack"><strong className="s13-code">{row.boxCode}</strong><span className="s13-compact">{row.componentName}</span><span className="s13-compact s13-meta">{tx("SKU:")} {row.sku}</span><span className="s13-compact s13-meta">{tx("Cập nhật:")} {row.updatedAt}</span></div> },
    { id: 'sku', heading: tx('SKU'), render: row => <span className="s13-code">{row.sku}</span> },
    { id: 'name', heading: tx('Tên linh kiện'), render: row => row.componentName },
    { id: 'receipt', heading: tx('Phiếu nhập nguồn'), headingContent: <><span className="s13-wide">{tx("Phiếu nhập nguồn")}</span><span className="s13-compact">{tx("Phiếu / SL / Trạng thái")}</span></>, render: row => <div className="s13-stack"><span className="s13-code">{row.receiptCode}</span><span className="s13-compact">{tx("Số lượng:")} <strong className="s13-number">{row.quantity}</strong></span><span className="s13-compact"><StatusBadge tone="warning">{tx(row.status)}</StatusBadge></span></div> },
    { id: 'quantity', heading: tx('Số lượng'), align: 'end', render: row => <span className="s13-number">{row.quantity}</span> },
    { id: 'status', heading: tx('Trạng thái'), render: row => <StatusBadge tone="warning">{tx(row.status)}</StatusBadge> },
    { id: 'updated', heading: tx('Cập nhật'), render: row => <span className="s13-meta">{row.updatedAt}</span> },
    { id: 'action', heading: tx('Thao tác'), headingContent: <span className="s13-stack"><span>{tx("Thao tác")}</span><span className="s13-meta">{tx("Chưa khả dụng")}</span></span>, kind: 'actions', render: row => <Button variant="ghost" aria-label={tx('Tạo lệnh {code}', { code: row.boxCode })} aria-disabled="true" aria-describedby="s13-action-limit" onClick={event => blockedAction('Tạo lệnh', event.currentTarget, row.boxCode)}><Icon name="lock" size={16} />{tx(row.action)}</Button> },
  ];
  return <GlobalShell title={tx("Hàng chờ xếp khay")} variant="wms" activeKey="S13" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div className="hn-catalogue-screen s13-screen" data-screen="S13" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <div className="s13-overview" data-has-summary={cohort === 'legacy' && !!model}>
        <CataloguePageHeader appearance="worklist" title={tx("Hàng chờ xếp khay")} parentLabel={tx("Xếp khay")} breadcrumb={tx("Hàng chờ xếp khay")} description={tx("BOX đã nhập kho, chờ tạo lệnh xếp khay")} />
        {cohort === 'legacy' && model && <section className="s13-summary" aria-label={tx("Theo bộ lọc đã áp dụng")}>
          <p className="s13-summary-caption">{tx("Theo bộ lọc đã áp dụng")}</p>
          <CatalogueSummary label={tx("Số liệu hàng chờ")} columns={3} density="compact"><SummaryMetric label={tx("BOX chờ xếp khay")} value={model.summary.boxCount} /><SummaryMetric label={tx("SKU linh kiện")} value={model.summary.skuCount} /><SummaryMetric label={tx("Tổng số lượng")} value={model.summary.quantityAggregate} /></CatalogueSummary>
        </section>}
      </div>
      <CatalogueNavTabs className="s13-tabs" label={tx("Tra cứu xếp khay")} items={[
        { key: 'queue', label: tx('Hàng chờ'), icon: 'box', current: true, onClick: cancelPending },
        { key: 'orders', label: tx('Lệnh xếp khay'), icon: 'documents', href: orderRoute, unavailable: !orderRoute, onClick: event => orderRoute ? cancelPending() : blockedAction('Lệnh xếp khay', event.currentTarget) },
        ...(trayRoute ? [{ key: 'trays', label: tx('Danh sách khay'), icon: 'tray' as const, href: trayRoute, onClick: cancelPending }] : []),
        { key: 'history', label: tx('Lịch sử'), icon: 'audit', unavailable: true, onClick: event => blockedAction('Lịch sử', event.currentTarget) },
      ]} />
      {operational.available && <div className="s13-cohort"><Button variant="secondary" onClick={() => setCohort('scenario')} aria-pressed={cohort === 'scenario'}>{tx('Phiên hiện tại')}</Button><Button variant="secondary" onClick={() => setCohort('legacy')} aria-pressed={cohort === 'legacy'}>{tx('Danh sách trước đây')}</Button></div>}
      {cohort === 'scenario' ? <OperationalPutawayQueue adapter={operational} orderRoute={orderRoute} notify={message => notify(uiText(message), null, 'success')} /> : <>{model ? <>
        <section className="s13-list hn-premium-panel" aria-labelledby="s13-list-title">
          <h2 id="s13-list-title" className="hn-sr-only">{tx("Danh sách BOX chờ")}</h2>
          <div className="s13-filters" aria-label={tx("Điều kiện hàng chờ")}>
          <CatalogueToolbar id="s13" layout="worklist" label={tx("Tìm kiếm và lọc BOX")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tìm theo mã BOX, SKU hoặc phiếu nhập nguồn.")} searchHintMode="sr-only" searchPlaceholder={tx("Mã BOX, mã linh kiện/SKU, phiếu nhập nguồn…")} searchValue={query.search} onSearchChange={search => update({ search }, 'search', document.getElementById('s13-search'))} onReset={() => run(() => controller.reset({ ...defaults }), 'reset')} applyMode="immediate" busy={state.loading} queryContext={null}>
            <FilterSelect label={tx("Trạng thái BOX")} value={query.status} onChange={event => update({ status: event.target.value }, 'filter', event.currentTarget)}>{model.filterOptions.status.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Phiếu nhập nguồn")} value={query.receiptCode} onChange={event => update({ receiptCode: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.receiptCode.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
          </CatalogueToolbar>
          </div>
          <div className="s13-list-context">
            <div className="s13-selection" data-active={selected.size > 0}>
              <span className="s13-selection-count" role="status" aria-live="polite" aria-atomic="true">{tx("Đã chọn")} <strong>{selected.size}</strong> {tx("BOX")}</span>
              <span id="s13-selection-limit" className="s13-selection-hint">{tx('Chỉ đánh dấu; chưa có thao tác hàng loạt.')}</span>
              <span id="s13-select-all-limit" className="hn-sr-only">{tx("Chưa hỗ trợ chọn tất cả BOX. Hãy chọn từng BOX đang hiển thị.")}</span>
            </div>
          </div>
          <NoticeSlot name="table" />
          <div ref={table} className="s13-table"><DataTable caption={tx("Danh sách BOX chờ")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.boxCode} isRowSelected={row => selected.has(row.boxCode)} stickyHeader scrollResetKey={JSON.stringify(model.query)} busy={state.loading} emptyContent={<p role="status">{tx("Không tìm thấy kết quả phù hợp. Hãy thử đổi từ khóa hoặc điều chỉnh bộ lọc.")}</p>} /></div>
          {scroll.overflow && <div className="s13-scroll-tools"><span>{tx("Cuộn để xem đủ thông tin BOX")}</span><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s13-table-scroll" aria-disabled={scroll.start} onClick={() => { if (!scroll.start) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s13-table-scroll" aria-disabled={scroll.end} onClick={() => { if (!scroll.end) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>}
          <Pagination variant="products" unit={tx("BOX")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize }, 'pageSize', document.querySelector<HTMLElement>('.s13-list .hn-page-size select'))} />
          <NoticeSlot name="pagination" />
        </section>
        <div className="s13-footnotes">
          <p>{tx("BOX đã nhập kho và chưa có lệnh xếp khay đang hoạt động.")}</p>
          <p id="s13-action-limit">{tx("Tạo lệnh chưa khả dụng. Tạo lệnh không làm thay đổi tồn kho.")}</p>
        </div>
      </> : <InitialReadState label={tx("danh sách BOX")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? defaults) }), 'initial')} />}</>}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} protectedContentSelector=".s13-summary, .s13-list, .s13-screen .hn-page-heading, .s13-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
