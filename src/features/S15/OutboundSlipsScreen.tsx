import { OUTBOUND_DESIGN_EN } from './outbound-design-copy';
import { OPERATIONS_EN_COPY, renderOperationsText, uiText, uiList, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createOutboundSlipsController } from '../../controllers/outbound-slips-controller';
import { DEFAULT_OUTBOUND_SLIPS_QUERY as defaults, type OutboundSlipsAdapter, type OutboundSlipsQuery, type OutboundSlipRow } from '../../contracts/outbound-slips';
import { InitialReadState, Button, CataloguePageHeader, CatalogueSummary, SummaryMetric, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge } from '../../shared';
import type { NoticeFeedback, TableColumn } from '../../shared';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import {OutboundSlipDetailDialog,OUTBOUND_DETAIL_COPY} from './OutboundSlipDetailDialog';
import {resolveOutboundDetail,type OutboundDetailTarget} from './outbound-detail-selection';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalOutbounds, OUTBOUND_OPERATIONAL_COPY } from './OperationalOutbounds';
import './outbound-slips.css';

type Operation = ReturnType<ReturnType<typeof createOutboundSlipsController>['load']>;
type QueryAction = 'initial' | 'search' | 'filter' | 'sort' | 'page' | 'pageSize' | 'reset';

const shortValue = (value: string) => {
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
};
const statusTone = (status: string): 'success' | 'warning' | 'neutral' => status === 'Đã xuất' ? 'success' : status === 'Đang quét xuất hàng' ? 'warning' : 'neutral';

export function OutboundSlipsScreen({ adapter }: { adapter?: OutboundSlipsAdapter } = {}) {
  const tx = useUiCopy({ ...OUTBOUND_DETAIL_COPY, ...OUTBOUND_OPERATIONAL_COPY, ...OUTBOUND_DESIGN_EN });
  const operational = useMemo(() => createOperationalWebAdapter(undefined, { scope: 'S15' }), []);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createOutboundSlipsController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? defaults;
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [detailTarget,setDetailTarget]=useState<OutboundDetailTarget|null>(null);
  const detailRow=detailTarget?resolveOutboundDetail(model,detailTarget):null;
  const detailOrigin=useRef<HTMLElement|null>(null);
  const intent = useRef(0), sequence = useRef(0);
  const table = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body }), []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, action: QueryAction, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S15_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách phiếu xuất. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      const q = outcome.result.query;
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S15:${outcome.result.reason}`, detail: outcome.result.detail });
      const reason = action === 'page' ? uiText('Chưa thể tải danh sách phiếu xuất ở trang {page}.', { page: q.page })
        : action === 'pageSize' ? uiText('Chưa thể đổi số dòng mỗi trang thành {count}.', { count: q.pageSize })
        : action === 'search' ? uiText('Chưa thể tìm “{search}” lúc này.', { search: shortValue(q.search) })
        : uiText('Chưa thể lọc danh sách phiếu xuất lúc này. {filters}', { filters: uiList([q.status && uiText('Trạng thái: {value}', { value: uiText(q.status) }), q.recipient && uiText('Người nhận: {value}', { value: shortValue(q.recipient) })]) });
      notify(uiText('{reason} Đã giữ danh sách và điều kiện trước đó.', { reason }), origin);
    } else if (action === 'reset') {
      table.current?.querySelector('.hn-table-scroll')?.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      notify('Đã đặt lại điều kiện.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    void controller.load({ ...defaults }).then(result => { if (active) finish(result, null, 'initial', intent.current); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  const hasModel = model !== null;
  useLayoutEffect(() => {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    region.id = 's15-table-scroll';
    let frame: number | null = null;
    const revealTable = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && region.contains(focused) && focused.matches(':focus-visible') && !document.querySelector('dialog[open]')) {
          // Reveal the work area before the control so its column headings stay in view.
          revealControl(region); revealControl(focused);
        }
      });
    };
    const measure = () => {
      // Document coordinates keep the table stable while the user scrolls the page.
      const top = region.getBoundingClientRect().top + window.scrollY;
      const footer = region.closest('.s15-list')?.querySelector('.hn-pagination')?.getBoundingClientRect().height ?? 76;
      region.style.setProperty('--s15-table-available-height', `${Math.max(224, window.innerHeight - top - footer - 16)}px`);
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s15-scroll-tools')) region.focus({ preventScroll: true });
      setScroll(old => old.overflow === next.overflow && old.start === next.start && old.end === next.end ? old : next);
    };
    const observer = new ResizeObserver(() => { measure(); revealTable(); });
    observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    region.closest('.s15-screen')?.querySelectorAll('.hn-page-heading,.s15-summary,.s15-list-heading,.hn-catalogue-toolbar,.s15-source-limit,.s15-scroll-tools,.hn-pagination,.hn-notice-slot').forEach(element => observer.observe(element));
    region.addEventListener('focusin', revealTable);
    window.addEventListener('resize', measure);
    region.addEventListener('scroll', measure, { passive: true }); measure();
    return () => {
      observer.disconnect(); region.removeEventListener('scroll', measure); region.removeEventListener('focusin', revealTable); window.removeEventListener('resize', measure);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [hasModel, cohort]);
  function run(operation: () => Operation, action: QueryAction, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const token = ++intent.current;
    setNotice(null);
    void operation().then(result => finish(result, origin, action, token));
  }
  function update(patch: Partial<OutboundSlipsQuery>, action: QueryAction, origin?: HTMLElement | null) { run(() => controller.update(patch), action, origin); }
  function openDetail(issueCode:string,origin:HTMLElement){
    ++intent.current;controller.cancel();
    const accepted=controller.getSnapshot().model;
    detailOrigin.current=origin;setNotice(null);setDetailTarget({issueCode,sourceId:accepted?.source.id??''});
  }
  function closeDetail(){
    setDetailTarget(null);const opener=detailOrigin.current;detailOrigin.current=null;
    requestAnimationFrame(()=>{const active=document.activeElement;if(active instanceof HTMLElement&&active!==document.body&&active!==document.documentElement&&!active.closest('.s15-detail-dialog')&&active!==opener)return;(opener?.isConnected?opener:document.getElementById('s15-search'))?.focus({preventScroll:true});});
  }
  function scrollTable(direction: -1 | 1) {
    const region = table.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region) return;
    const pinnedWidth = [...region.querySelectorAll<HTMLElement>('thead [data-sticky-column="left"]')].reduce((width, cell) => width + cell.getBoundingClientRect().width, 0);
    // Keep a small overlap between successive views, excluding the pinned identity.
    region.scrollBy({ left: direction * Math.max(44, region.clientWidth - pinnedWidth - 32), behavior: 'instant' });
  }
  const columns: TableColumn<OutboundSlipRow>[] = [
    { id: 'issue', heading: tx('Phiếu xuất'), headingContent: <><span className="s15-wide">{tx("Phiếu xuất")}</span><span className="s15-compact">{tx("Phiếu / Toa")}</span></>, render: row => <div className="s15-stack"><strong className="s15-code">{row.issueCode}</strong><span className="s15-compact s15-meta">{row.requestCode}</span></div> },
    { id: 'request', heading: tx('Mã toa yêu cầu'), render: row => <span className="s15-code">{row.requestCode}</span> },
    { id: 'recipient', heading: tx('Người nhận'), headingContent: <><span className="s15-wide">{tx("Người nhận")}</span><span className="s15-compact">{tx("Người nhận / Ngày")}</span></>, render: row => <div className="s15-stack"><span className="s15-primary">{row.recipient}</span><span className="s15-compact s15-meta">{row.createdAt}</span><span className="s15-compact s15-meta">{row.note}</span></div> },
    { id: 'created', heading: tx('Ngày tạo'), render: row => <span className="s15-meta">{row.createdAt}</span> },
    { id: 'note', heading: tx('Ghi chú'), render: row => <span className="s15-note">{row.note}</span> },
    { id: 'reconciliation', heading: tx('Đối chiếu'), render: row => {
      const [value, max] = row.reconciliation.split('/').map(Number);
      return <div className="s15-reconciliation"><span className={row.reconciliation === '—' ? 's15-missing' : undefined}>{row.reconciliation}</span>{row.reconciliation !== '—' && <progress value={value} max={max} data-complete={value === max} aria-label={tx('Đối chiếu {code}: {value}', { code: row.issueCode, value: row.reconciliation })} />}</div>;
    } },
    { id: 'status', heading: tx('Trạng thái'), render: row => <StatusBadge tone={statusTone(row.status)}>{tx(row.status)}</StatusBadge> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', align: 'end', render: row => <div className="s15-row-actions"><Button variant="ghost" className="s15-detail-opener" aria-haspopup="dialog" aria-label={tx('Xem {code}',{code:row.issueCode})} onClick={event=>openDetail(row.issueCode,event.currentTarget)}><Icon name="eye" size={17}/>{tx('Xem')}</Button>{row.action!=='Xem'&&<Button variant="ghost" title={tx('Mở {code} ở chế độ chỉ đọc', { code: row.issueCode })} aria-haspopup="dialog" aria-describedby="s15-flow-limit" aria-label={`${tx(row.action)} ${row.issueCode}`} onClick={event => openDetail(row.issueCode, event.currentTarget)}><Icon name="chevron-right" size={17}/>{tx(row.action)}</Button>}</div> },
  ];
  return <GlobalShell title={tx("Phiếu xuất kho")} variant="wms" activeKey="S15" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div className="hn-catalogue-screen s15-screen" data-screen="S15" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <CataloguePageHeader title={tx("Phiếu xuất kho")} parentLabel={tx("Xuất kho")} breadcrumb={tx("Phiếu xuất kho")} description={tx("Theo dõi phiếu xuất được gửi từ App quét.")} actions={cohort==='scenario'?<span className="s15-session"><Icon name="layers"/>{tx("Phiên hiện tại")}<Icon name="info"/></span>:undefined} />
      {operational.available && <div className="s15-action-row"><Button variant={cohort === 'scenario' ? 'primary' : 'secondary'} aria-pressed={cohort === 'scenario'} onClick={() => setCohort('scenario')}>{tx('Phiếu xuất phiên hiện tại')}</Button><Button variant={cohort === 'legacy' ? 'primary' : 'secondary'} aria-pressed={cohort === 'legacy'} onClick={() => setCohort('legacy')}>{tx('Danh sách tham chiếu')}</Button></div>}
      {cohort === 'scenario' ? <OperationalOutbounds adapter={operational} notify={message => notify(message, document.activeElement instanceof HTMLElement ? document.activeElement : null, 'success')} /> : <>
      {model ? <>
        <section className="s15-summary" aria-labelledby="s15-summary-title">
          <h2 id="s15-summary-title" className="hn-sr-only">{tx("Tình trạng xử lý phiếu")}</h2>
          <div className="s15-summary-grid"><div className="s15-total"><strong>{model.summary.totalDocuments}</strong><span>{tx("Tổng phiếu xuất")}</span></div>
          <CatalogueSummary label={tx("Tình trạng xử lý phiếu")}>
            <SummaryMetric label={tx("Nháp")} value={model.summary.draftDocuments} />
            <SummaryMetric label={tx("Đang quét xuất hàng")} value={model.summary.scanningDocuments} />
            <SummaryMetric label={tx("Đã xuất")} value={model.summary.exportedDocuments} />
            <SummaryMetric label={tx("Đã hủy")} value={model.summary.cancelledDocuments} />
          </CatalogueSummary></div>
          <p className="s15-flow-note"><Icon name="info" size={16} />{tx("App quét và gửi phiếu → Chờ xử lý trên Web. Chỉ hiển thị Đã xuất khi có xác nhận thành công.")}</p>
        </section>
        <section className="s15-list hn-premium-panel" aria-labelledby="s15-list-title">
          <div className="s15-list-heading"><div className="s15-list-title"><h2 id="s15-list-title">{tx("Danh sách phiếu xuất")}</h2><span className="s15-count">{model.summary.totalDocuments} {tx("phiếu")}</span></div><FilterSelect label={tx("Sắp xếp")} value={query.sort ?? 'created-desc'} onChange={event => update({ sort: event.currentTarget.value as OutboundSlipsQuery['sort'] }, 'sort', event.currentTarget)}><option value="created-desc">{tx("Ngày tạo: mới nhất")}</option><option value="created-asc">{tx("Ngày tạo: cũ nhất")}</option></FilterSelect></div>
          <CatalogueToolbar id="s15" label={tx("Tìm kiếm và lọc phiếu xuất")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tìm theo mã phiếu hoặc ghi chú.")} searchHintMode="sr-only" searchPlaceholder={tx("Mã phiếu hoặc ghi chú…")} searchValue={query.search} onSearchChange={search => update({ search }, 'search', document.getElementById('s15-search'))} onReset={() => run(() => controller.reset({ ...defaults }), 'reset')} applyMode="immediate" busy={state.loading} queryContext={null}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.status.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Người nhận")} value={query.recipient} onChange={event => update({ recipient: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.recipient.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <p className="s15-source-limit"><Icon name="info" size={16} /><span id="s15-flow-limit">{tx("Mở/Xem phiếu ở chế độ chỉ đọc.")} {tx('Đang hiển thị {detail} phiếu chi tiết trên tổng số {aggregate} phiếu. Bộ lọc, sắp xếp và phân trang áp dụng cho tập dữ liệu chi tiết này.', { detail: model.source.detailTotal, aggregate: model.source.aggregateTotal ?? model.summary.totalDocuments })}</span></p>
          <NoticeSlot name="table" />
          <div className="s15-scroll-tools" hidden={!scroll.overflow}><span>{tx("Cuộn để xem đủ thông tin phiếu")}</span><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s15-table-scroll" aria-disabled={scroll.start} onClick={() => { if (!scroll.start) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s15-table-scroll" aria-disabled={scroll.end} onClick={() => { if (!scroll.end) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>
          <div ref={table} className="s15-table"><DataTable appearance="refined" density="compact" rowActionAppearance="quiet" caption={tx("Danh sách phiếu xuất")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.issueCode} stickyHeader stickyColumnIds={['issue']} scrollResetKey={JSON.stringify(model.query)} busy={state.loading} emptyStateKind="no-results" emptyContent={<p role="status">{tx("Không tìm thấy kết quả phù hợp. Hãy thử đổi từ khóa hoặc điều chỉnh bộ lọc.")}</p>} /></div>
          <Pagination variant="products" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize }, 'pageSize', document.querySelector<HTMLElement>('.s15-list .hn-page-size select'))} />
          <NoticeSlot name="pagination" />
        </section>
      </> : <InitialReadState label={tx("danh sách phiếu xuất")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? defaults) }), 'initial')} />}
      {detailTarget&&<OutboundSlipDetailDialog row={detailRow} issueCode={detailTarget.issueCode} onClose={closeDetail}/>}
      </>}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} protectedContentSelector=".s15-summary, .s15-list, .s15-screen .hn-page-heading, .s15-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
