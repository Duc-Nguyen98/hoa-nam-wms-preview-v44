import { renderOperationsText, uiText, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DEFAULT_TRAYS_QUERY, type TrayRow, type TraysAdapter } from '../../contracts/trays';
import { createTraysController } from '../../controllers/trays-controller';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { InitialReadState, Button, FilterSelect, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, GlobalShell, Icon, Notice, NoticeSlot, Pagination, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import './trays.css';
import { TrayDetail, TRAY_DETAIL_COPY } from './TrayDetail';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalTrays, OPERATIONAL_TRAYS_COPY } from './OperationalTrays';
import type { TrayReader } from './tray-binding';

type Operation = ReturnType<ReturnType<typeof createTraysController>['load']>;
type QueryAction = 'initial' | 'search' | 'page' | 'pageSize' | 'reset';

export function TraysScreen({ adapter, operationalAdapter }: { adapter?: TraysAdapter; operationalAdapter?: TrayReader } = {}) {
  const tx = useUiCopy(TRAY_DETAIL_COPY);
  const operationalTx = useUiCopy(OPERATIONAL_TRAYS_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S11' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const cohortControl = operational.available && <FilterSelect label={operationalTx('Nguồn dữ liệu')} aria-label={operationalTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{operationalTx('Phiên hiện tại')}</option><option value="legacy">{operationalTx('Dữ liệu đã duyệt')}</option></FilterSelect>;
  const controller = useMemo(() => createTraysController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const [draftSearch, setDraftSearch] = useState('');
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const [pinTray, setPinTray] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{ row: TrayRow; origin: HTMLElement } | null>(null);
  const table = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const feedbackIntent = useRef(0);
  const revealFocus = useKeyboardFocusReveal();
  const hasModel = model !== null;
  useLayoutEffect(() => {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    region.id = 's11-table-scroll';
    const measure = () => {
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s11-scroll-tools')) region.focus({ preventScroll: true });
      setScroll(current => current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next);
      setPinTray(region.clientWidth >= 560);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    region.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [hasModel, cohort]);

  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, action: QueryAction, intent: number) => {
    if (outcome.kind === 'superseded') return;
    // Controller fencing protects data; a separate UI intent protects newer feedback.
    const isCurrentFeedback = intent === feedbackIntent.current;
    if (outcome.kind === 'error') {
      setDraftSearch(controller.getSnapshot().acceptedQuery?.search ?? '');
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S11_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model && isCurrentFeedback) notify('Chưa thể đọc danh sách khay. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
      return;
    }
    if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S11:${outcome.result.reason}`, detail: outcome.result.detail });
      setDraftSearch(controller.getSnapshot().acceptedQuery?.search ?? '');
      const query = outcome.result.query;
      const reason = action === 'page' ? uiText('Chưa thể tải danh sách khay ở trang {page}.', { page: query.page })
        : uiText(action === 'pageSize' ? 'Chưa thể đổi số dòng mỗi trang.' : 'Chưa thể tìm kiếm danh sách khay lúc này.');
      if (isCurrentFeedback) notify(uiText('{reason} Đã giữ danh sách và điều kiện trước đó.', { reason }), origin);
    } else if (action === 'reset' && isCurrentFeedback) {
      table.current?.querySelector<HTMLElement>('.hn-table-scroll')?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      notify('Đã đặt lại điều kiện và vị trí bảng.', origin);
    }
  }, [controller, notify]);

  useEffect(() => {
    if (cohort !== 'legacy') return;
    let active = true;
    void controller.load({ ...DEFAULT_TRAYS_QUERY }).then(result => {
      if (active) {
        setDraftSearch('');
        finish(result, null, 'initial', 0);
      }
    });
    return () => { active = false; controller.clear(); };
  }, [controller, finish, cohort]);

  function run(operation: () => Operation, action: QueryAction) {
    const intent = ++feedbackIntent.current;
    setNotice(null);
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void operation().then(result => finish(result, origin, action, intent));
  }
  function changeSearch(search: string) {
    setDraftSearch(search);
    run(() => controller.update({ search }), 'search');
  }
  function reset() {
    setDraftSearch('');
    run(() => controller.reset({ ...DEFAULT_TRAYS_QUERY }), 'reset');
  }
  function goToPage(page: number) {
    run(() => controller.update({ page }), 'page');
  }
  function scrollTable(direction: -1 | 1) {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    const pinned = [...region.querySelectorAll<HTMLElement>('thead [data-sticky-column="left"]')]
      .reduce((width, cell) => width + cell.getBoundingClientRect().width, 0);
    region.scrollBy({ left: direction * Math.max(44, region.clientWidth - pinned - 32), behavior: 'instant' });
  }
  function detail(row: TrayRow, origin: HTMLElement) {
    feedbackIntent.current += 1;
    controller.cancel();
    setDraftSearch(controller.getSnapshot().acceptedQuery?.search ?? '');
    setSelectedDetail({ row, origin });
  }

  const columns: TableColumn<TrayRow>[] = [
    ordinalColumn<TrayRow>(model?.pagination.page, model?.pagination.pageSize),
    { id: 'tray', heading: tx('Mã khay'), render: row => <strong className="s11-code">{row.trayCode}</strong> },
    { id: 'box', heading: tx('Số BOX'), align: 'end', render: row => <span className="s11-number">{row.boxCount}</span> },
    { id: 'sku', heading: tx('Số SKU'), align: 'end', render: row => <span className="s11-number">{row.skuCount}</span> },
    { id: 'packing-order', heading: tx('Lệnh xếp khay gần nhất'), headingContent: <>{tx("Lệnh xếp khay gần nhất")}<span className="s11-compact-update"> {tx("/ Cập nhật")}</span></>, render: row => <div className="s11-order-stack"><span className={row.latestPackingOrder ? 's11-order' : 's11-muted'}>{row.latestPackingOrder ?? '—'}</span><span className="s11-compact-update s11-secondary">{tx("Cập nhật:")} {row.updatedAtLabel}</span></div> },
    { id: 'updated', heading: tx('Cập nhật'), render: row => <span className="s11-muted">{row.updatedAtLabel}</span> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: row => <Button variant="ghost" aria-label={tx('Chi tiết {code}', { code: row.trayCode })} onClick={event => detail(row, event.currentTarget)}><Icon name="eye" size={18} />{tx("Chi tiết")}</Button> },
  ];

  if (cohort === 'scenario') return <GlobalShell title={tx('Danh sách khay')} variant="wms" activeKey="S11" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}><div className="hn-catalogue-screen s11-screen" data-screen="S11" onFocusCapture={revealFocus}><CataloguePageHeader appearance="compact" title={tx('Danh sách khay')} breadcrumb={tx('Danh sách khay')} parentLabel={tx('Nhập kho')} />{cohortControl}<OperationalTrays adapter={operational} /></div></GlobalShell>;
  return <GlobalShell title={tx("Danh sách khay")} variant="wms" activeKey="S11" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div className="hn-catalogue-screen s11-screen" data-screen="S11" data-visual-variant="premium" onFocusCapture={revealFocus}>
      {cohortControl}
      <CataloguePageHeader appearance="compact" title={tx("Danh sách khay")} breadcrumb={tx("Danh sách khay")} parentLabel={tx("Nhập kho")} description={tx("Tra cứu khay và đối chiếu BOX đã xác nhận xếp khay")} />
      {model ? <>
        <section className="s11-summary" aria-label={tx("Tổng quan danh sách khay")}>
          <CatalogueSummary columns={2} appearance="inline" density="compact" label={tx("Tổng quan khay đã xếp")}><SummaryMetric label={tx("Khay đã xếp")} value={model.summary.trayCount} detail={tx("khay")} icon="tray" /><SummaryMetric label={tx("BOX đã xếp")} value={model.summary.boxCount} detail={tx("BOX")} icon="box" /></CatalogueSummary>
          <p className="s11-summary-note"><Icon name="info" size={16} />{tx("Chỉ hiển thị khay có BOX đã được xác nhận xếp khay.")}</p>
        </section>
        <section className="s11-list hn-premium-panel" aria-labelledby="s11-list-title">
          <h2 id="s11-list-title" className="hn-sr-only">{tx("Danh sách khay")}</h2>
          <div className="s11-list-top">
            <CatalogueToolbar layout="lookup" id="s11" label={tx("Tìm kiếm danh sách khay")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tìm theo mã khay.")} searchHintMode="sr-only" searchPlaceholder={tx("Tìm theo mã khay…")} searchValue={draftSearch} onSearchChange={changeSearch} onReset={reset} applyMode="immediate" busy={state.loading} queryContext={null}>{null}</CatalogueToolbar>
            <p className="s11-list-scope">{tx("Chỉ tính lệnh xếp khay đã xác nhận")}</p>
          </div>
          <p id="s11-detail-limit" className="hn-catalogue-detail-limit"><Icon name="info" size={16} />{tx("Danh sách BOX và thông tin liên quan chưa khả dụng.")}</p>
          <NoticeSlot name="table" />
          <div ref={table} className="s11-table"><DataTable appearance="refined" density="compact" rowActionAppearance="quiet" stickyColumnIds={pinTray ? ['tray'] : []} stickyHeader captionVisibility="sr-only" caption={tx("Danh sách khay")} columns={columns} rows={model.rows} rowKey={row => row.trayCode} sort={null} busy={state.loading} scrollResetKey={JSON.stringify(model.query)} emptyContent={<p role="status">{tx("Không có khay phù hợp.")}</p>} /></div>
          {scroll.overflow && <div className="s11-scroll-tools"><p className="s11-scroll-hint">{tx("Cột ngoài khung nhìn")}</p><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} title={tx("Cuộn bảng sang trái")} aria-controls="s11-table-scroll" aria-disabled={scroll.start} onClick={() => { if (!scroll.start) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} title={tx("Cuộn bảng sang phải")} aria-controls="s11-table-scroll" aria-disabled={scroll.end} onClick={() => { if (!scroll.end) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>}
          <Pagination variant="products" unit={tx("khay")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={goToPage} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => run(() => controller.update({ pageSize }), 'pageSize')} />
          <NoticeSlot name="pagination" />
        </section>
      </> : <InitialReadState label={tx("danh sách khay")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? DEFAULT_TRAYS_QUERY) }), 'initial')} />}
      {selectedDetail && <TrayDetail row={selectedDetail.row} origin={selectedDetail.origin} onClose={() => setSelectedDetail(null)} />}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} protectedContentSelector=".s11-summary, .s11-list, .s11-screen .hn-page-heading, .s11-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
