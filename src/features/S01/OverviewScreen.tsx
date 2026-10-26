import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessPeriod, formatDeclaredDateText } from '../../i18n/format-business-date';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { DEFAULT_OVERVIEW_QUERY, resetOverviewTableQuery } from '../../contracts/overview';
import type { OverviewQuery, OverviewRow, OverviewSortKey } from '../../contracts/overview';
import { createOverviewRuntimeController } from '../../controllers/overview-runtime';
import { getOverviewPresentation } from '../../controllers/overview-presentation';
import { recordReviewDiagnostic, recordUnresolvedAction } from '../../app/review-diagnostics';
import { ordinalColumn, Button, DataTable, DateRangePicker, FilterInput, FilterSelect, GlobalShell, Icon, PageState, InitialReadState, Pagination, S01_SHELL_NAVIGATION, StatusBadge } from '../../shared';
import type { IconName, TableColumn } from '../../shared';
import { AcceptedRowDetail, acceptedOverviewValue, acceptedOverviewDateDisplay, selectAcceptedOverviewRow, resolveAcceptedOverviewRow, type AcceptedRowSelection } from './AcceptedRowDetail';
import { Notice, type NoticeFeedback } from '../../shared/Notice';
import { NoticeSlot } from '../../shared/Catalogue';
import './overview.css';
import { useOverviewCopy } from './overview-copy';
import { catalogueNoticeCopy } from '../../i18n/catalogue-copy';
import { useReportCopy } from '../../i18n/reports-copy';
import { getShellDestinations, S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';

function Metric({ title, value, unit, help, scope, icon }: {
  title: string; value: number | string; unit?: string; help: string; scope: string; icon: IconName;
}) {
  return <section className="ov-metric hn-premium-panel" aria-label={title} data-unknown={value === '—'}>
    <div className="ov-metric__top"><h2>{title}</h2><span className="ov-icon-tile"><Icon name={icon} width={21} height={21} /></span></div>
    <div className="ov-metric__value"><strong>{value}</strong>{unit && <span>{unit}</span>}</div>
    <div className="ov-metric__foot"><span>{help}</span><span className="ov-metric__scope">{scope}</span></div>
  </section>;
}

function formatPeriod(query: OverviewQuery) {
  const format = (day: string) => day.split('-').reverse().join('/');
  return `${format(query.period.from)} – ${format(query.period.to)}`;
}

/** App composition injects the HTTP controller; isolated harnesses can supply a deterministic adapter. */
export function OverviewScreen({ createController = createOverviewRuntimeController }: { createController?: typeof createOverviewRuntimeController } = {}) {
  const tx = useOverviewCopy();
  const { language } = useShellPreferences();
  const reportTx = useReportCopy();
  const controller = useMemo(() => createController(), [createController]);
  const presentation = useMemo(getOverviewPresentation, []);
  const permittedPreviewDestinations = useMemo(() => new Set(getShellDestinations(S00_SHELL_NAVIGATION).map(item => item.href)), []);
  const [runtime, setRuntime] = useState(() => controller.getState());
  const query = runtime.intendedQuery ?? DEFAULT_OVERVIEW_QUERY;
  const model = runtime.model;
  const acceptedQuery = runtime.acceptedQuery ?? DEFAULT_OVERVIEW_QUERY;
  const [searchDraft, setSearchDraft] = useState('');
  const composingSearch = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const busy = refreshing || runtime.loading || runtime.debouncing;
  const [detailSelection, setDetailSelection] = useState<AcceptedRowSelection | null>(null);
  const detailRow = refreshing ? null : resolveAcceptedOverviewRow(detailSelection, runtime);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const detailOpenerRef = useRef<HTMLButtonElement | null>(null);
  const detailRowIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (detailSelection && !detailRow) setDetailSelection(null);
  }, [detailSelection, detailRow]);
  function openDetail(row: OverviewRow, opener: HTMLButtonElement) {
    if (refreshing) return;
    const selection = selectAcceptedOverviewRow(controller.getState(), row.id);
    if (!selection || selection.model !== model || selection.row !== row) return;
    detailOpenerRef.current = opener;
    detailRowIdRef.current = row.id;
    setDetailSelection(selection);
  }
  function resolveDetailReturnFocus() {
    const opener = detailOpenerRef.current;
    if (opener?.isConnected && !opener.disabled) return opener;
    const rowButton = Array.from(activityRef.current?.querySelectorAll<HTMLButtonElement>('[data-overview-detail-opener]') ?? [])
      .find(button => button.dataset.overviewDetailOpener === detailRowIdRef.current && !button.disabled);
    return rowButton ?? detailHeadingRef.current;
  }

  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const localizedNotice = useMemo(() => notice && { ...notice, message: reportTx(catalogueNoticeCopy(tx, notice.message)) }, [notice, tx, reportTx]);
  const noticeSequence = useRef(0);
  function notify(message: string, tone: NoticeFeedback['tone'] = 'info', origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    setNotice({message,tone,origin,sequence:++noticeSequence.current,container:document.body});
  }
  function unavailable(key: string) { recordUnresolvedAction(key); notify('Chức năng này chưa khả dụng trong bản xem trước.'); }
  const refreshRequest = useRef(0);
  const refreshFocusTarget = useRef<HTMLButtonElement | null>(null);
  const activityRef = useRef<HTMLElement>(null);
  const pendingPageFocus = useRef<number | null>(null);
  const [tableOverflows, setTableOverflows] = useState(false);
  const hasModel = model !== null;
  useLayoutEffect(() => {
    const region = activityRef.current?.querySelector<HTMLElement>('.hn-table-scroll');
    const table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => setTableOverflows(region.scrollWidth > region.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    observer.observe(table);
    return () => observer.disconnect();
  }, [hasModel]);
  useLayoutEffect(() => {
    if (!model || pendingPageFocus.current !== model.pagination.page) return;
    pendingPageFocus.current = null;
    const tableRegion = activityRef.current?.querySelector<HTMLElement>('.hn-table-scroll');
    const region = tableRegion?.getClientRects().length ? tableRegion : activityRef.current?.querySelector<HTMLElement>('.ov-mobile-list');
    if (!region) return;
    // Paging can disable its own Next/Previous button. Keep keyboard focus on
    // the new results, and reveal their heading when paging from the footer.
    region.focus({ preventScroll: true });
    const heading = region.querySelector('thead, .ov-mobile-row')?.getBoundingClientRect();
    const firstRow = region.querySelector('tbody tr, .ov-mobile-row')?.getBoundingClientRect();
    if (heading && (heading.top < 0 || (firstRow?.bottom ?? heading.bottom) > window.innerHeight)) {
      region.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    }
  }, [model]);
  useEffect(() => {
    const unsubscribe = controller.subscribe(() => {
      const state = controller.getState();
      setRuntime(state);
      if (!composingSearch.current) setSearchDraft(state.intendedQuery?.search ?? '');
      if (state.blocker) {
        recordReviewDiagnostic({ kind: 'blocked-query', key: state.blocker.reason, detail: state.blocker.detail });
        if (state.model) notify(state.blocker.reason === 'INVALID_PERIOD' ? state.blocker.detail : state.blocker.reason === 'PERIOD_OUTSIDE_SNAPSHOT'
          ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${formatPeriod(state.acceptedQuery ?? DEFAULT_OVERVIEW_QUERY)}.`
          : 'Chưa thể áp dụng lựa chọn này. Kỳ và kết quả đang hiển thị được giữ nguyên.');
      } else if (state.error) {
        recordReviewDiagnostic({ kind: 'runtime-error', key: 'S01_READ', detail: String(state.error) });
        if (state.model) notify('Chưa thể cập nhật dữ liệu. Vui lòng thử lại.', 'error');
      }
    });
    // The subscription reports failures while retaining the last accepted model.
    void controller.load().catch(() => undefined);
    return () => { unsubscribe(); refreshRequest.current += 1; controller.clear(); };
  }, [controller]);
  useEffect(() => {
    if (refreshing || !refreshFocusTarget.current) return;
    const target = refreshFocusTarget.current;
    refreshFocusTarget.current = null;
    const frame = window.requestAnimationFrame(() => {
      const focusLostToDocument = document.activeElement === document.body || document.activeElement === document.documentElement || !document.activeElement;
      if (!target.disabled && focusLostToDocument) target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [refreshing]);
  async function refresh(returnFocusTo?: HTMLButtonElement) {
    setNotice(null);
    const request = ++refreshRequest.current;
    setRefreshing(true);
    try {
      const result = await controller.load(acceptedQuery);
      if (request === refreshRequest.current && result?.kind === 'ready' && controller.getSnapshot() === result) notify('Đã làm mới dữ liệu.', 'success', returnFocusTo ?? null);
    } catch {
      // The controller subscription owns error feedback, including initial load.
    } finally {
      if (request === refreshRequest.current) {
        refreshFocusTarget.current = returnFocusTo ?? null;
        setRefreshing(false);
      }
    }
  }
  const patchQuery = (patch: Partial<OverviewQuery>) => {
    setNotice(null);
    pendingPageFocus.current = null;
    refreshRequest.current += 1;
    refreshFocusTarget.current = null;
    setRefreshing(false);
    void controller.update(patch).catch(() => undefined);
  };
  function changePage(page: number) {
    if (page === acceptedQuery.page) return;
    setNotice(null);
    pendingPageFocus.current = page;
    void controller.update({ page }).catch(() => undefined);
  }
  function resetTable() {
    setNotice(null);
    pendingPageFocus.current = null;
    refreshRequest.current += 1;
    refreshFocusTarget.current = null;
    setRefreshing(false);
    setSearchDraft('');
    void controller.reset(resetOverviewTableQuery(acceptedQuery)).catch(() => undefined);
  }
  function requestSearch(value: string) {
    setSearchDraft(value);
    patchQuery({ search: value });
  }
  const columns: TableColumn<OverviewRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'number', heading: tx("Mã phiếu"), sortKey: 'number', render: row => <button type="button" className="ov-document-link" data-overview-detail-opener={row.id} disabled={busy || !!runtime.error || !!runtime.blocker} onClick={event => openDetail(row, event.currentTarget)}>{row.number}</button> },
    { id: 'type', heading: tx("Loại phiếu"), sortKey: 'type', render: row => <span className="ov-document-type" data-type={row.type}><Icon name={row.type === 'inbound' ? 'download' : 'upload'} width={16} height={16} />{tx(row.typeLabel)}</span> },
    { id: 'time', heading: tx("Thời gian"), sortKey: 'time', sortType: 'date', render: row => <span className="ov-document-time">{acceptedOverviewDateDisplay('timeLabel', acceptedOverviewValue(row.timeLabel), language)}</span> },
    { id: 'actor', heading: tx("Người thực hiện"), sortKey: 'actor', render: row => acceptedOverviewValue(row.actor) },
    { id: 'quantity', heading: tx("Số lượng"), sortKey: 'quantity', sortType: 'number', align: 'end', render: row => acceptedOverviewValue(row.quantity) },
    { id: 'status', heading: tx("Trạng thái"), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'posted' ? 'success' : 'warning'}>{tx(row.status === 'waiting' ? 'Chờ xử lý' : row.statusLabel)}</StatusBadge> },
    { id: 'action', heading: tx("Thao tác"), kind: 'actions', headingContent: <span className="hn-sr-only">{tx("Thao tác")}</span>, render: row => <button type="button" className="ov-row-action" aria-label={tx('Xem phiếu {number}', { number: row.number })} data-overview-detail-opener={row.id} disabled={busy || !!runtime.error || !!runtime.blocker} onClick={event => openDetail(row, event.currentTarget)}><Icon name="chevron-right" width={17} height={17} /></button> },
  ];
  const attentionRows = model?.attention?.slice(0, 3) ?? [];
  const openAttention = (row: OverviewRow, opener: HTMLButtonElement) => openDetail(row, opener);
  function submitSearch(event: FormEvent) { event.preventDefault(); if (!composingSearch.current) requestSearch(searchDraft); }

  return <GlobalShell title={tx("Tổng quan vận hành")} variant="wms" navigation={S01_SHELL_NAVIGATION} activeKey="S01" profile={presentation.profile} onUnresolvedAction={unavailable}>
    <div className="ov-screen" data-screen="S01" data-visual-variant="premium">
      <div className="ov-page-heading">
        <div className="ov-page-intro"><div className="ov-eyebrow"><Icon name="warehouse" size={16} />{model?.warehouseLabel ?? tx("Kho")}</div><h1 ref={detailHeadingRef} tabIndex={-1}>{tx("Tổng quan vận hành")}</h1><p>{tx("Theo dõi kho và công việc cần xử lý.")}</p></div>
        <div className="ov-period">
          <div className="ov-period__controls">
            <FilterSelect id="ov-warehouse-filter" label={tx("Kho")} value={model?.warehouseLabel ?? ''} disabled={!model?.warehouseLabel} onChange={() => undefined}>
              <option value={model?.warehouseLabel ?? ''}>{model?.warehouseLabel ?? '—'}</option>
            </FilterSelect>
            <DateRangePicker displayValue={query.period.from.endsWith("-01") && query.period.to === new Date(Date.UTC(Number(query.period.from.slice(0,4)), Number(query.period.from.slice(5,7)), 0)).toISOString().slice(0,10) ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : language === "zh-CN" ? "zh-CN" : "en-US", {month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(query.period.from+"T00:00:00Z")) : undefined} id="ov-period-picker" label={tx("Kỳ thời gian")} value={query.period} clearable={false} onChange={period => { if (period) patchQuery({ period }); }} />
          </div>
          <p>{formatBusinessPeriod(acceptedQuery.period, language)}</p>
        </div>
      </div>
      {!model && <InitialReadState label={tx("Tổng quan vận hành")} loading={busy} error={runtime.error} blocked={Boolean(runtime.blocker)} onRetry={() => { setNotice(null); void controller.load(query).catch(() => undefined); }} />}
      {model && <>
        <div className="ov-metrics">
          <Metric title={tx("Tồn kho hiện tại")} value={model.summary.stockDisplay} help={tx(model.summary.stockHelp)} scope={tx("Hiện tại")} icon="box" />
          <Metric title={tx("Phiếu nhập")} value={model.summary.inbound} unit={tx("phiếu")} help={tx("Tất cả trạng thái")} scope={tx("Trong kỳ")} icon="documents" />
          <Metric title={tx("Phiếu xuất")} value={model.summary.outbound} unit={tx("phiếu")} help={tx("Tất cả trạng thái")} scope={tx("Trong kỳ")} icon="documents" />
          <Metric title={tx("Bảo hành đang mở")} value={model.summary.openWarranties} unit={tx("hồ sơ")} help={tx("Không áp dụng kỳ chứng từ")} scope={tx("Hiện tại")} icon="shield" />
        </div>
        <div className="ov-middle">
          <section className="ov-panel ov-attention hn-premium-panel" aria-labelledby="ov-attention-title">
            <div className="ov-attention__heading"><div className="ov-attention__title"><span className="ov-attention__icon"><Icon name="alert-circle" size={21} /></span><div><h2 id="ov-attention-title">{tx("Cần xử lý")} <span className="ov-attention__count">{model.summary.waiting}</span></h2><p>{tx("Các phiếu đang chờ xử lý, cần theo dõi và hoàn tất.")}</p></div></div><button type="button" className="ov-view-all" onClick={() => { patchQuery({ search: '', type: 'all', status: 'waiting' }); activityRef.current?.scrollIntoView({ block: 'start' }); }}>{tx("Xem danh sách")}<Icon name="chevron-right" width={16} height={16} /></button></div>
            <div className="ov-attention__list">
              {attentionRows.length ? attentionRows.map(row => <div className="ov-attention__row" key={row.id}><span className="ov-attention__row-icon"><Icon name="documents" size={18} /></span><button type="button" className="ov-document-link" data-overview-detail-opener={row.id} disabled={busy || !!runtime.error || !!runtime.blocker} onClick={event => openAttention(row, event.currentTarget)}>{row.number}</button><span className="ov-attention__label">{tx(row.type === 'inbound' ? 'Phiếu nhập chờ xử lý' : 'Phiếu xuất chờ xử lý')}</span><button type="button" className="ov-row-action" aria-label={tx('Xem phiếu {number}', { number: row.number })} data-overview-detail-opener={row.id} disabled={busy || !!runtime.error || !!runtime.blocker} onClick={event => openAttention(row, event.currentTarget)}><span className="ov-attention__view-label">{tx("Xem phiếu")}</span><Icon name="chevron-right" size={17} /></button></div>) : <p className="ov-attention__empty">{tx(model.attention ? 'Không có phiếu cần xử lý trong kỳ.' : 'Chưa có thông tin phiếu cần xử lý.')}</p>}
            </div>
          </section>
          <section className="ov-panel ov-quick hn-premium-panel" aria-labelledby="ov-quick-title"><h2 id="ov-quick-title"><span className="ov-icon-tile"><Icon name="bolt" size={28} /></span>{tx("Truy cập nhanh")}</h2>
            <div className="ov-quick__grid">{presentation.quickAccess.slice(0, 3).map(item => <button key={item.key} type="button" className="ov-quick__link" onClick={() => { if (item.route && permittedPreviewDestinations.has(item.route)) window.location.hash = item.route; else unavailable(item.key); }}>
              <span className="ov-icon-tile"><Icon name={item.icon as IconName} width={21} height={21} /></span><span>{tx(item.label)}</span><Icon name="chevron-right" width={16} height={16} />
            </button>)}</div>
          </section>
        </div>
        <section ref={activityRef} className="ov-panel ov-activity hn-premium-panel" aria-labelledby="ov-activity-title" aria-busy={busy} data-table-overflow={tableOverflows}>
          <div className="ov-activity__heading"><div className="ov-activity-title"><span className="ov-icon-tile"><Icon name="documents" size={30}/></span><div><h2 id="ov-activity-title">{tx("Hoạt động nhập – xuất")}</h2><p>{tx("Danh sách phiếu nhập và xuất trong kỳ.")}</p></div></div><div className="ov-activity-actions"><span className="ov-result-count">{tx(model.query.search.trim() || model.query.type !== 'all' || model.query.status !== 'all' ? '{count} phiếu phù hợp' : '{count} phiếu trong kỳ', { count: model.pagination.total })}</span><button type="button" className="ov-view-all" onClick={resetTable}>{tx("Xem tất cả")}<Icon name="chevron-right" width={16} height={16} /></button></div></div>
          <p className="ov-scope-description hn-sr-only">{tx('Kho và kỳ áp dụng cho chỉ số chứng từ, công việc cần xử lý và biểu đồ. Tìm kiếm và bộ lọc bên dưới chỉ áp dụng cho danh sách.')}</p>
          <div className="ov-filters">
            <form role="search" aria-label={tx("Tìm phiếu nhập và xuất")} onSubmit={submitSearch} className="ov-search"><label className="ov-search-label" htmlFor="ov-search-input">{tx("Tìm mã phiếu, người thực hiện")}</label><FilterInput id="ov-search-input" type="search" aria-label={tx("Tìm mã phiếu, người thực hiện")} label={tx("Tìm mã phiếu, người thực hiện")} placeholder={tx("Tìm mã phiếu, người thực hiện")} value={searchDraft}
              onCompositionStart={() => { composingSearch.current = true; }}
              onCompositionEnd={event => { composingSearch.current = false; requestSearch(event.currentTarget.value); }}
              onBlur={event => { if (composingSearch.current) { composingSearch.current = false; requestSearch(event.currentTarget.value); } }}
              onKeyDown={event => { if (event.key === 'Enter' && (composingSearch.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault(); }}
              onChange={event => { if (composingSearch.current) setSearchDraft(event.target.value); else requestSearch(event.target.value); }} /></form>
            <FilterSelect id="ov-type-filter" label={tx("Loại phiếu")} aria-label={tx("Loại phiếu")} className="ov-select" value={query.type} onChange={event => patchQuery({ type: event.target.value as OverviewQuery['type'] })}><option value="all">{tx("Tất cả")}</option><option value="inbound">{tx("Nhập kho")}</option><option value="outbound">{tx("Xuất kho")}</option></FilterSelect>
            <FilterSelect id="ov-status-filter" label={tx("Trạng thái")} aria-label={tx("Trạng thái")} className="ov-select" value={query.status} onChange={event => patchQuery({ status: event.target.value as OverviewQuery['status'] })}><option value="all">{tx("Tất cả")}</option><option value="posted">{tx("Đã ghi sổ")}</option><option value="waiting">{tx("Chờ xử lý trên Web")}</option></FilterSelect>
            <Button variant="secondary" className="ov-reset" hidden={!query.search && query.type === 'all' && query.status === 'all'} onClick={resetTable}>{tx("Đặt lại")}</Button>
          </div>
          {(acceptedQuery.type !== 'all' || acceptedQuery.status !== 'all') && <div className="ov-active-filters" aria-label={tx("Bộ lọc đang áp dụng")}>
            <span>{tx("Đang lọc")}</span>
            {acceptedQuery.type !== 'all' && <button type="button" aria-label={tx("Bỏ lọc loại phiếu")} onClick={() => { patchQuery({ type: 'all' }); document.getElementById('ov-type-filter')?.focus({ preventScroll: true }); }}>{tx(acceptedQuery.type === 'inbound' ? 'Nhập kho' : 'Xuất kho')}<Icon name="close" width={14} height={14} /></button>}
            {acceptedQuery.status !== 'all' && <button type="button" aria-label={tx("Bỏ lọc trạng thái")} onClick={() => { patchQuery({ status: 'all' }); document.getElementById('ov-status-filter')?.focus({ preventScroll: true }); }}>{tx(acceptedQuery.status === 'posted' ? 'Đã ghi sổ' : 'Chờ xử lý trên Web')}<Icon name="close" width={14} height={14} /></button>}
          </div>}
          <p className="ov-scroll-hint">{tx("Cuộn ngang để xem thêm cột")}{' '}<span aria-hidden="true">→</span></p>
          <NoticeSlot name="table" />
          <div className="ov-table-desktop"><DataTable appearance="refined" density="compact" caption={tx("Danh sách phiếu nhập và xuất")} columns={columns} rows={model.rows} rowKey={row => row.id} sort={{ key: model.query.sortKey, direction: model.query.sort }} onSort={key => patchQuery({ sortKey:key as OverviewSortKey, sort:model.query.sortKey===key && model.query.sort==='asc'?'desc':'asc' })} scrollResetKey={JSON.stringify(model.query)} emptyContent={model.emptyReason ? <PageState kind={model.emptyReason === 'no-documents' ? 'empty' : 'no-results'} description={tx(model.emptyReason === 'no-documents' ? 'Không có phiếu trong kỳ đã chọn.' : 'Không có phiếu phù hợp.')} action={model.emptyReason !== 'no-documents' ? <Button onClick={resetTable}>{tx('Đặt lại')}</Button> : undefined}/> : undefined} busy={busy} /></div>
          <div className="ov-mobile-list" tabIndex={-1} aria-label={tx("Danh sách phiếu nhập và xuất")}>{model.rows.length ? model.rows.map(row => <article className="ov-mobile-row" key={row.id}>
            <span className={`ov-mobile-row__icon ov-mobile-row__icon--${row.type}`} aria-hidden="true"><Icon name="documents" size={30}/></span><div className="ov-mobile-row__heading"><button type="button" className="ov-document-link" data-overview-detail-opener={row.id} disabled={busy || !!runtime.error || !!runtime.blocker} onClick={event => openDetail(row, event.currentTarget)}>{row.number}</button><StatusBadge tone={row.status === 'posted' ? 'success' : 'warning'}>{tx(row.status === 'waiting' ? 'Chờ xử lý' : row.statusLabel)}</StatusBadge></div>
            <div className="ov-mobile-row__meta"><span className="ov-document-type" data-type={row.type}><Icon name={row.type === 'inbound' ? 'download' : 'upload'} size={16} />{tx(row.typeLabel)}</span><span><Icon name="calendar" size={15} />{acceptedOverviewDateDisplay('timeLabel', acceptedOverviewValue(row.timeLabel), language)}</span><span><Icon name="user" size={15} />{acceptedOverviewValue(row.actor)}</span><span><Icon name="box" size={15} />{acceptedOverviewValue(row.quantity)}</span></div>
            <button type="button" className="ov-mobile-row__action" data-overview-detail-opener={row.id} disabled={busy || !!runtime.error || !!runtime.blocker} aria-label={tx('Xem phiếu {number}', { number: row.number })} onClick={event => openDetail(row, event.currentTarget)}><Icon name="chevron-right" size={18} /></button>
          </article>) : <PageState kind={model.emptyReason === 'no-documents' ? 'empty' : 'no-results'} description={tx(model.emptyReason === 'no-documents' ? 'Không có phiếu trong kỳ đã chọn.' : 'Không có phiếu phù hợp.')} action={model.emptyReason !== 'no-documents' ? <Button onClick={resetTable}>{tx('Đặt lại')}</Button> : undefined}/>}</div>
          <Pagination variant="overview" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={changePage} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => patchQuery({ pageSize })} />
        </section>
      </>}
      <AcceptedRowDetail row={detailRow} source={detailRow ? model?.source ?? null : null} onClose={() => setDetailSelection(null)} resolveReturnFocus={resolveDetailReturnFocus} />
      {localizedNotice && <Notice feedback={localizedNotice} onClose={() => setNotice(null)} />}
    </div>
  </GlobalShell>;
}
