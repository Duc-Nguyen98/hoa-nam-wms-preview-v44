import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { renderOperationsText, uiText, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DEFAULT_PARTS_QUERY, type PartsAdapter, type PartsQuery, type PartsRow } from '../../contracts/parts-slips';
import { createPartsController } from '../../controllers/parts-slips-controller';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { InitialReadState, Button, CatalogueActiveFilters, CatalogueListHeader, CatalogueSummary, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { componentLabelParts, shouldPinSlip, tableScrollStep, updatedLabelParts } from './parts-presentation';
import { PartsSlipDetail, PARTS_DETAIL_COPY } from './PartsSlipDetail';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalPartsIssues } from './OperationalPartsIssues';
import type { PartsReadAdapter } from './parts-operational-binding';
import './parts-slips.css';

type Operation = ReturnType<ReturnType<typeof createPartsController>['load']>;
const COPY = { ...PARTS_DETAIL_COPY, 'Phiên hiện tại': 'Current session', 'Danh sách trước đây': 'Previous list' };

export function PartsSlipsScreen({ adapter, operationalAdapter }: { adapter?: PartsAdapter; operationalAdapter?: PartsReadAdapter } = {}) {
  const tx = useUiCopy(COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S10' }), [operationalAdapter]);
  const [cohort, setCohort] = useState(operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createPartsController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? DEFAULT_PARTS_QUERY;
  const screen = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [pinSlip, setPinSlip] = useState(true);
  const [detailRow, setDetailRow] = useState<{ row: PartsRow; origin: HTMLElement | null } | null>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null) => {
    if (outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S10_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách phiếu. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S10:${outcome.result.reason}`, detail: outcome.result.detail });
      notify('Chưa có đủ dữ liệu cho lựa chọn này. Đang giữ danh sách và điều kiện trước đó.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    void controller.load({ ...DEFAULT_PARTS_QUERY }).then(result => { if (active) finish(result, null); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  useLayoutEffect(() => {
    const root = screen.current, region = root?.querySelector<HTMLElement>('.s10-table .hn-table-scroll');
    if (!root || !region) return;
    region.id = 's10-table-scroll';
    const measure = () => {
      setPinSlip(shouldPinSlip(region.clientWidth));
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s10-scroll-tools')) region.focus({ preventScroll: true });
      setScroll(current => current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root); observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    region.addEventListener('scroll', measure, { passive: true }); measure();
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [Boolean(model), cohort]);
  function run(operation: () => Operation) {
    setNotice(null);
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void operation().then(result => finish(result, origin));
  }
  function update(patch: Partial<PartsQuery>) { run(() => controller.update(patch)); }
  function removeCondition(key: 'search' | 'status') {
    // The chip disappears after applying. Keep keyboard focus on a stable control.
    screen.current?.querySelector<HTMLInputElement>('#s10-search')?.focus({ preventScroll: true });
    update({ [key]: key === 'search' ? '' : 'all' });
  }
  function refresh() {
    if (controller.getSnapshot().loading) return;
    setNotice(null);
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void controller.load({ ...(state.acceptedQuery ?? DEFAULT_PARTS_QUERY) }).then(outcome => {
      finish(outcome, origin);
      if (outcome.kind === 'applied' && outcome.result.kind === 'ready') {
        const snapshot = outcome.result.model.summary.snapshot.split('-').reverse().join('/');
        notify(uiText('Đã làm mới danh sách. Dữ liệu cập nhật đến {snapshot}.', { snapshot }), origin);
      }
    });
  }
  function scrollTable(direction: -1 | 1) {
    const region = screen.current?.querySelector<HTMLElement>('.s10-table .hn-table-scroll');
    if (!region) return;
    const pinned = [...region.querySelectorAll<HTMLElement>('thead [data-sticky-column="left"]')]
      .reduce((width, cell) => width + cell.getBoundingClientRect().width, 0);
    region.scrollBy({ left: direction * tableScrollStep(region.clientWidth, pinned), behavior: 'instant' });
  }
  function detail(row: PartsRow) {
    setDetailRow({ row: { ...row }, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  }
  function quantitySummary(label: string) {
    const match = /^(\d+) SKU · (\d+) linh kiện$/u.exec(label);
    if (!match) return label;
    return match[2] === '1'
      ? tx('{skuCount} SKU · 1 linh kiện', { skuCount: match[1] })
      : tx('{skuCount} SKU · {partCount} linh kiện', { skuCount: match[1], partCount: match[2] });
  }
  const columns: TableColumn<PartsRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'slip', heading: tx('Phiếu / Hồ sơ bảo hành'), render: r => <div className="s10-stack"><strong className="s10-code">{r.slipCode}</strong><span className="s10-secondary">{r.warrantyCaseCode}</span></div> },
    { id: 'component', heading: tx('Linh kiện tóm tắt'), render: r => { const label = componentLabelParts(r.componentSummary); return <div className="s10-stack"><span className="s10-component-name">{label.name}</span><span className="s10-secondary">{label.code && <><span className="s10-component-code">{label.code}</span> · </>}{quantitySummary(r.quantitySummary)} · {tx(r.trackingLabel)}</span></div>; } },
    { id: 'status', heading: tx('Trạng thái'), render: r => <StatusBadge tone={r.slipStatus === 'Đã xuất' ? 'success' : r.slipStatus === 'Nháp' ? 'warning' : 'neutral'}>{tx(r.slipStatus)}</StatusBadge> },
    { id: 'updated', heading: tx('Cập nhật'), sortKey: 'updated', sortType: 'date', sortLabel: tx('Cập nhật'), render: r => { const label = updatedLabelParts(r.updatedAtLabel); return <span className="s10-stack s10-date"><span>{label.date}</span>{label.time && <span className="s10-secondary"><span className="hn-sr-only"> · </span>{label.time}</span>}</span>; } },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: r => <Button variant="ghost" aria-describedby="s10-detail-limit" aria-label={tx('Chi tiết {code}', { code: r.slipCode })} onClick={() => detail(r)}><Icon name="eye" size={18} />{tx("Chi tiết")}</Button> },
  ];
  const activeFilters = model ? (['search', 'status'] as const).filter(key => key === 'search' ? model.query.search.trim() : model.query.status !== 'all').map(key => ({ key, label: `${tx(key === 'search' ? 'Tìm kiếm' : 'Trạng thái')}: ${key === 'search' ? model.query[key] : tx(model.query[key])}` })) : [];
  return <GlobalShell title={tx("Quản lý phiếu xuất linh kiện")} variant="wms" activeKey="S10" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div ref={screen} className="hn-catalogue-screen s10-screen" data-screen="S10" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <header className="hn-page-heading s10-page-header"><div><p className="hn-breadcrumb">{tx("Bảo hành sửa chữa")} <span>/</span> {tx("Phiếu xuất linh kiện")}</p><h1>{tx("Quản lý phiếu xuất linh kiện")}</h1><p className="hn-page-description">{tx("Tra cứu phiếu xuất linh kiện bảo hành theo dữ liệu đã ghi nhận.")}</p></div><div className="hn-page-actions"><span className="hn-page-warehouse"><Icon name="warehouse" size={18} />{tx("Kho Hoa Nam")}</span>{cohort === 'legacy' && <Button variant="secondary" loading={state.loading} onClick={refresh}><Icon name="refresh" />{tx("Cập nhật danh sách")}</Button>}</div><NoticeSlot name="heading" /></header>
      {operational.available && <div className="s10-cohort"><Button variant="secondary" aria-pressed={cohort === 'scenario'} onClick={() => setCohort('scenario')}>{tx('Phiên hiện tại')}</Button><Button variant="secondary" aria-pressed={cohort === 'legacy'} onClick={() => setCohort('legacy')}>{tx('Danh sách trước đây')}</Button></div>}
      {cohort === 'scenario' ? <OperationalPartsIssues adapter={operational} /> : <>
      {model && <>
        <section className="s10-overview"><CatalogueSummary label={tx("Tổng quan phiếu xuất linh kiện toàn danh mục")}><SummaryMetric label={tx("Đã xuất")} value={`${model.summary.exported} / ${model.summary.total}`} detail={tx('{percent}% tổng phiếu', { percent: model.summary.exportedPercent.toLocaleString(locale) })} icon="upload" /><SummaryMetric label={tx("Nháp")} value={model.summary.draft} icon="documents" /><SummaryMetric label={tx("Đang quét/nhập")} value={model.summary.scanning} icon="barcode" /><SummaryMetric label={tx("Đã hủy")} value={model.summary.cancelled} icon="close" /></CatalogueSummary><p className="s10-app-note"><Icon name="info" size={17} /><span>{tx("Xuất linh kiện thực hiện trên")} <strong>{tx("App Scanner")}</strong>{tx(". Web dùng để tra cứu và đối chiếu.")}</span></p></section>
        <section className="s10-list" aria-labelledby="s10-list-title"><div className="s10-list-heading"><CatalogueListHeader id="s10-list-title" title={tx("Danh sách phiếu")} count={tx('{count} phiếu', { count: model.pagination.total })} /><p className="s10-scope">{model.pagination.total} {tx("kết quả trong")} {model.source.detailTotal} {tx("phiếu hiện có · Tổng danh mục")} {model.summary.total} {tx("phiếu · Cập nhật")} {model.summary.snapshot.split('-').reverse().join('/')}</p></div>
          <CatalogueToolbar id="s10" label={tx("Bộ lọc phiếu xuất linh kiện")} searchLabel={tx("Tìm kiếm phiếu")} searchHint={tx('Tìm theo mã phiếu, mã hồ sơ, SKU hoặc tên linh kiện trong {count} phiếu hiện có.', { count: model.source.detailTotal })} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => run(() => controller.reset({ ...DEFAULT_PARTS_QUERY }))} onRefresh={refresh} applyMode="immediate" acceptedLabel={activeFilters.length ? activeFilters.map(item => item.label).join(' · ') : tx('Tất cả phiếu')}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={e => update({ status: e.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.status.map(v => <option key={v} value={v}>{tx(v)}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <CatalogueActiveFilters items={activeFilters} onRemove={removeCondition} />
          <p id="s10-detail-limit" className="hn-catalogue-detail-limit s10-preview-note"><Icon name="info" size={16} />{tx("Xem thông tin phiếu đã ghi nhận; dòng linh kiện và chứng từ liên quan chưa khả dụng.")}</p><NoticeSlot name="table" />
          <div className="s10-table"><DataTable appearance="refined" stickyHeader stickyColumnIds={pinSlip ? ['slip'] : []} busy={state.loading} captionVisibility="sr-only" caption={tx("Danh sách phiếu xuất linh kiện")} columns={columns} rows={model.rows} rowKey={r => r.slipCode} sort={{ key: 'updated', direction: model.query.sort }} onSort={() => update({ sort: model.query.sort === 'desc' ? 'asc' : 'desc' })} scrollResetKey={JSON.stringify(model.query)} emptyContent={tx('Không tìm thấy phiếu phù hợp trong {count} phiếu hiện có.', { count: model.source.detailTotal })} /></div>
          {scroll.overflow && <div className="s10-scroll-tools"><p>{tx("Cuộn ngang để xem đầy đủ thông tin và Chi tiết.")}</p><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s10-table-scroll" aria-disabled={scroll.start} onClick={() => { if (!scroll.start) scrollTable(-1); }}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s10-table-scroll" aria-disabled={scroll.end} onClick={() => { if (!scroll.end) scrollTable(1); }}><Icon name="chevron-right" /></Button></div></div>}
          <Pagination variant="products" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize })} /><NoticeSlot name="pagination" />
        </section>
      </>}
      {!model && <InitialReadState label={tx('danh sách phiếu xuất linh kiện')} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? DEFAULT_PARTS_QUERY) }))} />}
      {detailRow && <PartsSlipDetail row={detailRow.row} origin={detailRow.origin} onClose={() => setDetailRow(null)} />}
      </>}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} protectedContentSelector=".s10-overview, .s10-table, .s10-list-heading, .s10-scroll-tools, .s10-screen .hn-page-heading, #s10-detail-limit, .s10-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
