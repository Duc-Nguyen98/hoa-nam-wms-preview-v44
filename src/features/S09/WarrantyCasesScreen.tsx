import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { OperationalWarranty } from './OperationalWarranty';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import type { WarrantyOperationalAdapter } from './warranty-binding';
import { renderOperationsText, uiText, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { DEFAULT_WARRANTY_QUERY, type WarrantyAdapter, type WarrantyQuery, type WarrantyRow } from '../../contracts/warranty-cases';
import { createWarrantyController } from '../../controllers/warranty-cases-controller';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { InitialReadState, Button, CatalogueActiveFilters, CatalogueListHeading, CataloguePageHeader, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { WARRANTY_TABLE_WIDTHS, warrantyScrollTarget } from './warranty-layout';
import { WARRANTY_DETAIL_COPY, WarrantyDetailDialog } from './WarrantyDetailDialog';
import './warranty-cases.css';

type Operation = ReturnType<ReturnType<typeof createWarrantyController>['load']>;

export function WarrantyCasesScreen({ adapter, operationalAdapter }: { adapter?: WarrantyAdapter; operationalAdapter?: WarrantyOperationalAdapter } = {}) {
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S09' }), [operationalAdapter]);
  const [cohort, setCohort] = useState(operational.available ? 'scenario' : 'legacy');
  const cohortTx = useUiCopy({ 'Phiên hiện tại': 'Current session', 'Danh sách trước đây': 'Historical list' });
  const tx = useUiCopy(WARRANTY_DETAIL_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const controller = useMemo(() => createWarrantyController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? DEFAULT_WARRANTY_QUERY;
  const busy = state.loading || state.debouncing;
  const screen = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [detailRow, setDetailRow] = useState<WarrantyRow | null>(null);
  const detailOrigin = useRef<HTMLElement | null>(null);
  const [scroll, setScroll] = useState({ overflow: false, start: true, end: true });
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null) => {
    if (outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S09_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc hồ sơ. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      // Do not log search text, serials, customer information or unmasked PII.
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S09:${outcome.result.reason}`, detail: outcome.result.detail });
      notify('Chưa có đủ dữ liệu cho lựa chọn này. Đang giữ danh sách và điều kiện trước đó.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    void controller.load({ ...DEFAULT_WARRANTY_QUERY }).then(result => { if (active) finish(result, null); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  useLayoutEffect(() => {
    const root = screen.current;
    const region = root?.querySelector<HTMLElement>('.s09-table .hn-table-scroll');
    if (!root || !region) return;
    region.id = 's09-table-scroll';
    const measure = () => {
      const max = region.scrollWidth - region.clientWidth;
      const next = { overflow: max > 1, start: region.scrollLeft < 1, end: region.scrollLeft >= max - 1 };
      if (!next.overflow && document.activeElement?.closest('.s09-scroll-tools')) region.focus({ preventScroll: true });
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
  function update(patch: Partial<WarrantyQuery>) { run(() => controller.update(patch)); }
  function reset() {
    run(() => controller.reset({ ...DEFAULT_WARRANTY_QUERY }));
  }
  function scrollTable(direction: -1 | 1) {
    const region = screen.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (!region || (direction < 0 ? scroll.start : scroll.end)) return;
    const pinnedWidth = [...region.querySelectorAll<HTMLElement>('thead [data-sticky-column="left"]')]
      .reduce((width, cell) => width + cell.getBoundingClientRect().width, 0);
    const tableLeft = region.querySelector('table')!.getBoundingClientRect().left;
    const starts = [...region.querySelectorAll<HTMLElement>('thead th:not([data-sticky-column])')]
      .map(cell => cell.getBoundingClientRect().left - tableLeft - pinnedWidth);
    region.scrollTo({ left: warrantyScrollTarget(region.scrollLeft, region.scrollWidth - region.clientWidth, starts, direction), behavior: 'instant' });
  }
  function removeCondition(key: 'search' | 'status' | 'identity' | 'due') {
    // The accepted chip will disappear. Move focus to a stable shared control.
    screen.current?.querySelector<HTMLInputElement>('#s09-search')?.focus({ preventScroll: true });
    update({ [key]: key === 'search' ? '' : 'all' });
  }
  function detail(row: WarrantyRow, origin: HTMLElement) {
    detailOrigin.current = origin;
    setDetailRow(row);
  }
  function closeDetail() {
    setDetailRow(null);
    const opener = detailOrigin.current;
    detailOrigin.current = null;
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.isConnected && active !== document.body &&
          active !== document.documentElement && active !== opener && !active.closest('.s09-detail-dialog')) return;
      const target = opener?.isConnected ? opener : screen.current?.querySelector<HTMLElement>('#s09-search');
      target?.focus({ preventScroll: true });
    });
  }
  const activeFilters = model ? (['search', 'status', 'identity', 'due'] as const)
    .filter(key => key === 'search' ? model.query[key].trim() : model.query[key] !== 'all')
    .map(key => {
      const label = { search: 'Tìm kiếm', status: 'Trạng thái', identity: 'Nhận dạng', due: 'Tình trạng hạn' }[key];
      return { key, label: `${tx(label)}: ${key === 'search' ? model.query[key] : tx(model.query[key])}` };
    }) : [];
  const product = (row: WarrantyRow) => <div className="s09-stack s09-product">
    {row.product.includes(' · ') ? <><span className="s09-product-name">{row.product.split(' · ').slice(1).join(' · ')}</span><span className="s09-secondary">{row.product.split(' · ')[0]}</span></> : <span className="s09-product-name">{row.product}</span>}
  </div>;
  const statusColumn: TableColumn<WarrantyRow> = { id: 'status', heading: tx('Trạng thái'), render: row => <div className="s09-stack s09-status"><span><StatusBadge tone={['Hoàn tất sửa chữa', 'Đã trả khách'].includes(row.statusLabel) ? 'success' : row.statusLabel.startsWith('Đang sửa chữa') ? 'warning' : 'neutral'}>{tx(row.statusLabel.split(' · ')[0])}</StatusBadge></span>{row.statusLabel.includes(' · ') && <span className="s09-overdue"><Icon name="info" size={14} />{tx(row.statusLabel.split(' · ')[1])}</span>}</div> };
  const columns: TableColumn<WarrantyRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'case', heading: tx('Hồ sơ'), render: row => <div className="s09-stack"><strong className="s09-code">{row.caseCode}</strong>{row.identity === 'TEMP_ONLY' ? <span><StatusBadge>{row.identity}</StatusBadge></span> : <span className="s09-secondary">{tx("SN:")} {row.identity}</span>}</div> },
    { id: 'product', heading: tx('Thiết bị / Sản phẩm'), render: product },
    { id: 'customer', heading: tx('Khách hàng'), render: row => <span className="s09-customer">{row.maskedCustomer}</span> },
    statusColumn,
    { id: 'received', heading: tx('Tiếp nhận / Hạn'), sortKey: 'receipt', sortType: 'date', sortLabel: tx('Tiếp nhận'), render: row => <div className="s09-stack s09-dates"><span>{row.receiptAndDueDate.split(' · ')[0]}</span><span className="s09-secondary"><span>{tx("Hạn:")} </span>{row.receiptAndDueDate.split(' · ')[1]}</span></div> },
    { id: 'age', heading: tx('Tuổi hồ sơ'), render: row => <span className="s09-muted">{tx(row.ageAtSnapshot)}</span> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: row => <Button variant="ghost" className="s09-view" aria-haspopup="dialog" aria-describedby="s09-detail-limit" aria-label={tx('Chi tiết {code}', { code: row.caseCode })} onClick={event => detail(row, event.currentTarget)}><Icon name="eye" size={18} />{tx(row.reviewAction)}</Button> },
  ];
  return <GlobalShell title={tx("Quản lý hồ sơ bảo hành")} variant="wms" activeKey="S09" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div ref={screen} className="hn-catalogue-screen s09-screen" data-screen="S09" data-visual-variant="premium" style={{ '--s09-wide-min': `${WARRANTY_TABLE_WIDTHS.wide}px` } as CSSProperties} onFocusCapture={revealFocus}>
      <CataloguePageHeader title={tx("Quản lý hồ sơ bảo hành")} breadcrumb={tx("Quản lý hồ sơ bảo hành")} parentLabel={tx("Bảo hành sửa chữa")} description={tx("Tra cứu và theo dõi quá trình xử lý hồ sơ bảo hành")} />
      {operational.available && <div className="s09-action-row"><Button variant="secondary" aria-pressed={cohort === 'scenario'} onClick={() => setCohort('scenario')}>{cohortTx('Phiên hiện tại')}</Button><Button variant="secondary" aria-pressed={cohort === 'legacy'} onClick={() => setCohort('legacy')}>{cohortTx('Danh sách trước đây')}</Button></div>}
      {cohort === 'scenario' ? <OperationalWarranty adapter={operational} notify={message => notify(uiText(message), null, 'success')} /> : <>
      {model && <>
        <section className="s09-summary" aria-label={tx("Tổng quan xử lý hồ sơ")}>
          <div className="s09-metric"><span>{tx("Tổng hồ sơ")}</span><strong>{model.summary.total}</strong><small>{tx("Toàn danh mục")}</small></div>
          <div className="s09-metric s09-progress"><span>{tx("Đã hoàn tất")}</span><div className="s09-completion"><strong>{model.summary.completed}</strong><span>{model.summary.progressPercent.toLocaleString(locale)}%</span></div><progress max={model.summary.total} value={model.summary.completed} aria-label={tx("Tỷ lệ hồ sơ đã hoàn tất")} aria-valuetext={tx('{completed} / {total} hồ sơ, {percent}%', { completed: model.summary.completed, total: model.summary.total, percent: model.summary.progressPercent.toLocaleString(locale) })} /></div>
          <div className="s09-metric"><span>{tx("Chưa hoàn tất")}</span><strong>{model.summary.incomplete}</strong><small>{tx("trong")} {model.summary.total} {tx("hồ sơ")}</small></div>
          <div className="s09-metric"><span>{tx("Quá hạn")}</span><strong className="s09-overdue">{model.summary.overdueWithinIncomplete}</strong><small>{tx("trong")} {model.summary.incomplete} {tx("hồ sơ chưa hoàn tất")}</small></div>
        </section>
        <section className="s09-list" aria-labelledby="s09-list-title">
          <CatalogueListHeading className="s09-list-heading" id="s09-list-title" title={tx("Danh sách hồ sơ")} count={tx('{count} hồ sơ', { count: model.pagination.total })} snapshot={model.summary.snapshot.split('-').reverse().join('/')} scope={tx('{count} kết quả trong {detail} hồ sơ hiện có · Tổng danh mục {total} hồ sơ', { count: model.pagination.total, detail: model.source.detailTotal, total: model.summary.total })} />
          <CatalogueToolbar id="s09" label={tx("Bộ lọc hồ sơ bảo hành")} searchLabel={tx("Tìm kiếm hồ sơ")} searchHint={tx("Tìm theo mã hồ sơ hoặc serial.")} searchPlaceholder={tx("Mã hồ sơ hoặc serial…")} searchHintMode="sr-only" searchValue={query.search} onSearchChange={search => update({ search })} onReset={reset} applyMode="immediate" busy={busy} queryContext={activeFilters.length ? <CatalogueActiveFilters className="s09-filter-chips" items={activeFilters} onRemove={removeCondition} /> : null}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={e => update({ status: e.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.status.map(v => <option key={v} value={v}>{tx(v)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Nhận dạng")} value={query.identity} onChange={e => update({ identity: e.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.identity.map(v => <option key={v} value={v}>{tx(v)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Tình trạng hạn")} value={query.due} onChange={e => update({ due: e.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.due.map(v => <option key={v} value={v}>{tx(v)}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <p id="s09-detail-limit" className="hn-catalogue-detail-limit s09-preview-note"><Icon name="info" size={16} />{tx('Chi tiết hiển thị thông tin hồ sơ hiện có. Lịch sử xử lý và chứng từ liên quan chưa có dữ liệu.')}</p>
          <NoticeSlot name="table" />
          <div className="s09-table"><DataTable busy={busy} appearance="refined" stickyEndColumnIds={['action']} stickyHeader captionVisibility="sr-only" caption={tx("Danh sách hồ sơ bảo hành")} columns={columns} rows={model.rows} rowKey={row => row.caseCode} sort={{ key: 'receipt', direction: model.query.sort }} onSort={() => update({ sort: model.query.sort === 'desc' ? 'asc' : 'desc' })} scrollResetKey={JSON.stringify(model.query)} emptyStateKind="no-results" emptyContent={tx('Không tìm thấy hồ sơ phù hợp trong {count} hồ sơ hiện có.', { count: model.source.detailTotal })} /></div>
          {scroll.overflow && <div className="s09-scroll-tools"><p>{tx("Cuộn ngang để xem đầy đủ hồ sơ và thao tác.")}</p><div><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s09-table-scroll" aria-disabled={scroll.start} onClick={() => scrollTable(-1)}><Icon name="chevron-left" /></Button><Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s09-table-scroll" aria-disabled={scroll.end} onClick={() => scrollTable(1)}><Icon name="chevron-right" /></Button></div></div>}
          <Pagination variant="products" unit={tx("hồ sơ")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page })} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize })} />
          <NoticeSlot name="pagination" />
        </section>
      </>}
      {!model && <InitialReadState label={tx("danh sách hồ sơ bảo hành")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? DEFAULT_WARRANTY_QUERY) }))} />}
      <WarrantyDetailDialog row={detailRow} snapshot={model?.summary.snapshot ?? ''} onClose={closeDetail} />
      </>}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} protectedContentSelector=".s09-summary, .s09-table, .s09-list-heading, .s09-scroll-tools, .s09-preview-note, .s09-screen .hn-page-heading, .s09-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
