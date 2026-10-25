import { useShellPreferences } from '../../shared/shell-preferences';
import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createMovementController } from '../../controllers/movement-history-controller';
import { DEFAULT_MOVEMENT_QUERY as defaults, movementDateLabel, type MovementAdapter, type MovementQuery, type MovementRow, type MovementSortKey } from '../../contracts/movement-history';
import { Button, CatalogueActiveFilters, CatalogueListHeader, CataloguePageHeader, CatalogueSummary, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, ReportEmptyState, getReportEmptyReason, StatusBadge, SummaryMetric, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { MovementHistoryCharts } from './MovementHistoryCharts';
import { MovementCompactSort, MovementInitialFeedback, MovementResultStatus } from './MovementHistoryFeedback';
import { movementScrollEdges, movementFocusColumn, movementDisplaySubject, movementDisplayTime } from './movement-history-presentation';
import './movement-history.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalMovementLedger, MOVEMENT_LEDGER_COPY } from './OperationalMovementLedger';
import type { MovementLedgerReader } from './movement-ledger-binding';
import { useUiCopy } from '../../i18n/use-ui-copy';

type Operation = ReturnType<ReturnType<typeof createMovementController>['load']>;

export function MovementHistoryScreen({ adapter, operationalAdapter }: { adapter?: MovementAdapter; operationalAdapter?: MovementLedgerReader } = {}) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const operationalTx = useUiCopy(MOVEMENT_LEDGER_COPY);
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S20' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const cohortControl = operational.available && <FilterSelect label={operationalTx('Nguồn dữ liệu')} aria-label={operationalTx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{operationalTx('Phiên hiện tại')}</option><option value="legacy">{operationalTx('Dữ liệu đã duyệt')}</option></FilterSelect>;
  const controller = useMemo(() => createMovementController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const pending = state.loading || state.debouncing;
  const emptyReason = model ? getReportEmptyReason(model) : null;
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [chartsExpanded, setChartsExpanded] = useState(true);
  const [compact, setCompact] = useState(false), [overflows, setOverflows] = useState(false);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const screen = useRef<HTMLDivElement>(null), list = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null), intent = useRef(0), sequence = useRef(0);
  const revealFocus = useKeyboardFocusReveal(), ready = Boolean(model);
  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => setCompact(element.clientWidth < 960);
    const observer = new ResizeObserver(measure); observer.observe(element); measure();
    return () => observer.disconnect();
  }, [ready, cohort]);
  useEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const edges = movementScrollEdges(region.scrollLeft, region.clientWidth, region.scrollWidth);
      setOverflows(edges.left || edges.right);
      setScrollEdges(current => current.left === edges.left && current.right === edges.right ? current : edges);
    };
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [ready, compact, cohort]);
  useLayoutEffect(() => {
    const previous = lastFocused.current;
    if (previous && (!previous.isConnected || !previous.getClientRects().length)
      && (document.activeElement === document.body || document.activeElement === previous)
      && !document.querySelector('dialog[open],.hn-header-popup,.hn-date-picker__popup[data-open="true"]')) {
      const previousColumn = previous.id === 's20-sort' ? model?.query.sortKey : previous.closest<HTMLElement>('[data-column]')?.dataset.column;
      const column = compact ? movementFocusColumn(previousColumn) : previousColumn;
      const fallback = (previous.hasAttribute('data-s20-retry') ? screen.current?.querySelector<HTMLElement>('#s20-search') : null)
        ?? (compact && (previousColumn === 'code' || previousColumn === 'performer') ? list.current?.querySelector<HTMLElement>('#s20-sort') : null)
        ?? (column ? list.current?.querySelector<HTMLElement>(`th[data-column="${column}"] button`) : null)
        ?? list.current?.querySelector<HTMLElement>('.hn-table-scroll');
      fallback?.focus({ preventScroll: true }); if (fallback) revealControl(fallback);
    }
  }, [compact, model, overflows]);
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    if (region) region.scrollBy({ left: direction * Math.max(160, region.clientWidth * .65), behavior: 'instant' });
  }
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      if (controller.getSnapshot().model) notify('Chưa thể cập nhật danh sách. Dữ liệu và điều kiện đã áp dụng được giữ nguyên. Chọn “Cập nhật mới nhất” để tải lại hoặc thử lại điều kiện vừa chọn.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S20:${outcome.result.reason}`, detail: outcome.result.detail });
      if (!controller.getSnapshot().model) return;
      const period = controller.getSnapshot().acceptedQuery?.period ?? defaults.period;
      const message = outcome.result.reason === 'INVALID_PERIOD' ? outcome.result.detail : outcome.result.reason === 'MISSING_PERIOD_SNAPSHOT'
        ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${movementDateLabel(period.from)} – ${movementDateLabel(period.to)}.`
        : 'Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.';
      notify(message, origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    if (cohort !== 'legacy') return;
    let active = true; const token = ++intent.current;
    void controller.load(structuredClone(defaults)).then(outcome => { if (active) finish(outcome, null, token); });
    return () => { active = false; ++intent.current; controller.clear(); };
  }, [controller, finish, cohort]);
  function run(operation: () => Operation) {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++intent.current; setNotice(null); void operation().then(outcome => finish(outcome, origin, token));
  }
  function update(patch: Partial<MovementQuery>) { run(() => controller.update(patch)); }
  function refresh() { run(() => controller.load(structuredClone(controller.getSnapshot().acceptedQuery ?? defaults))); }
  function blockedAction(label: string, origin: HTMLElement) {
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S20:FLOW_NOT_SUPPLIED', detail: `${label}: no assigned detail/export flow.` });
    notify(`${label} hiện chưa khả dụng.`, origin);
  }
  const columns: TableColumn<MovementRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'occurredAt', heading: tx(compact ? 'Thời gian / Mã phiếu' : 'Thời gian'), headingContent: compact ? <span className="s20-column-label">{tx("Thời gian")}<small>{tx("Mã phiếu")}</small></span> : undefined, sortKey: 'occurredAt', sortType:'date', sortLabel: tx(compact ? 'Thời gian (cột Thời gian / Mã phiếu)' : 'Thời gian'), render: row => {
      const value = movementDisplayTime(row.occurredAt, language);
      return <div className="s20-cell">{compact && <strong className="s20-code">{row.code}</strong>}<time className="s20-time" dateTime={row.occurredAt}><b>{value.time}</b><span>{value.date}</span></time></div>;
    } },
    { id:'type', heading:tx('Loại'), sortKey:'type', render:row=><StatusBadge tone="neutral"><span className="s20-movement-type" data-direction={row.type === 'Nhập kho' ? 'in' : 'out'}><Icon name={row.type === 'Nhập kho' ? 'arrow-down' : 'arrow-up'} size={14} />{tx(row.type)}</span></StatusBadge> },
    ...(!compact ? [{ id:'code', heading:tx('Mã phiếu'), sortKey:'code', render:(row:MovementRow)=><strong className="s20-code">{row.code}</strong> }] : []),
    { id:'subject', heading:tx(compact ? 'Đối tượng / Người thực hiện' : 'Đối tượng'), headingContent:compact ? <span className="s20-column-label">{tx("Đối tượng")}<small>{tx("Người thực hiện")}</small></span> : undefined, sortKey:'subject', sortLabel:tx(compact ? 'Đối tượng (cột Đối tượng / Người thực hiện)' : 'Đối tượng'), render:row=>{
      const subject = movementDisplaySubject(row.subject);
      return <div className="s20-cell"><span className="s20-subject-primary">{subject.primary}</span>{subject.secondary && <small>{subject.secondary}</small>}{compact && <small className="s20-performer-line"><Icon name="user" size={14} />{row.performer}</small>}</div>;
    } },
    { id:'quantity', heading:tx('Số lượng'), sortKey:'quantity', sortType:'number', align:'end', render:row=><span className="s20-number">{row.quantity.toLocaleString(tx('vi-VN'))}</span> },
    ...(!compact ? [{ id:'performer', heading:tx('Người thực hiện'), sortKey:'performer', render:(row:MovementRow)=><span className="s20-performer">{row.performer}</span> }] : []),
    { id:'action', heading:tx('Xem'), kind:'actions', align:'end', render:row=><Button variant="ghost" iconOnly aria-disabled="true" aria-label={tx(`Xem ${row.code}`)} title={tx(`Xem ${row.code} · Chưa khả dụng`)} aria-describedby="s20-flow-limit" onClick={event=>blockedAction(`Xem ${row.code}`,event.currentTarget)}><Icon name="eye" size={18}/></Button> },
  ];
  const activeFilters = model ? ([
    { key: 'search', label: tx(model.query.search.trim() ? `Tìm: ${model.query.search.trim()}` : '') },
    { key: 'performer', label: model.query.performer }, { key: 'type', label: tx(model.query.type) },
  ] as const).filter(item => item.label) : [];
  const hiddenSortLabel = compact && model ? ({ code:'Mã phiếu', performer:'Người thực hiện' } as Partial<Record<MovementSortKey,string>>)[model.query.sortKey] : undefined;
  const sortOrder = model?.query.sortDirection === 'asc' ? 'A → Z' : 'Z → A';
  function removeFilter(key: 'search' | 'performer' | 'type') {
    screen.current?.querySelector<HTMLInputElement>('#s20-search')?.focus({ preventScroll: true });
    update({ [key]: '' });
  }
  const inlineSlot = (origin: HTMLElement | null) => screen.current?.querySelector<HTMLElement>(origin?.closest('.hn-page-heading') ? '[data-s20-notice="heading"]' : '[data-s20-notice="list"]') ?? null;
  if (cohort === 'scenario') return <GlobalShell title={tx('Lịch sử nhập - xuất - tồn kho')} variant="wms" activeKey="S20" navigation={S00_SHELL_NAVIGATION}><div className="hn-catalogue-screen s20-screen" data-screen="S20" ref={screen} onFocusCapture={revealFocus}><CataloguePageHeader appearance="compact" title={tx('Lịch sử nhập - xuất - tồn kho')} parentLabel={tx('Báo cáo & Thống kê')} breadcrumb={tx('Lịch sử nhập - xuất - tồn kho')} />{cohortControl}<OperationalMovementLedger adapter={operational} /></div></GlobalShell>;
  return <GlobalShell title={tx("Lịch sử nhập - xuất - tồn kho")} variant="wms" activeKey="S20" navigation={S00_SHELL_NAVIGATION}>
    <div className="hn-catalogue-screen s20-screen" data-screen="S20" data-visual-variant="premium" ref={screen} onFocusCapture={event => { lastFocused.current = event.target.closest('.hn-notice') ? null : event.target as HTMLElement; revealFocus(event); }}>
      {cohortControl}
      <div className="s20-header">
        <CataloguePageHeader appearance="compact" title={tx("Lịch sử nhập - xuất - tồn kho")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Lịch sử nhập - xuất - tồn kho")} description={tx("Theo dõi luân chuyển và tra cứu giao dịch trong kỳ.")} actions={<>
          <section className="s20-period" aria-label={tx("Kỳ báo cáo")}><DateRangePicker id="s20-period" label={tx("Kỳ báo cáo")} value={query.period} clearable={false} onChange={period => { if (period) update({ period }); }} /></section>
          <div className="s20-export"><ReportExcelButton screen="S20" query={model?.query ?? null} expectedTotal={model?.pagination.total} busy={state.loading || state.debouncing} onNotice={notify} /></div>
        </>} />
        <div data-s20-notice="heading" />
      </div>
      {model ? <>
        <section className="s20-overview" aria-labelledby="s20-overview-title">
          <div className="s20-overview-caption"><h2 id="s20-overview-title">{tx("Tổng hợp toàn kỳ")}</h2><p>{tx("Không thay đổi theo bộ lọc danh sách")}</p></div>
          <CatalogueSummary label={tx("Luân chuyển toàn kỳ")} columns={2} density="compact" appearance="cards">
            <SummaryMetric label={tx("Tổng giao dịch")} value={model.summary.transactions.toLocaleString(tx('vi-VN'))} detail={<span className="s20-summary-detail"><span>{tx("giao dịch")}</span><span><b>{model.summary.inbound.toLocaleString(tx('vi-VN'))}</b> {tx("nhập ·")} <b>{model.summary.outbound.toLocaleString(tx('vi-VN'))}</b> {tx("xuất")}</span></span>} icon="documents" />
            <SummaryMetric label={tx("Sản phẩm luân chuyển")} value={model.summary.products.toLocaleString(tx('vi-VN'))} detail={<span className="s20-summary-detail"><span>{tx("sản phẩm")}</span><span><b>{model.summary.inboundProducts.toLocaleString(tx('vi-VN'))}</b> {tx("nhập ·")} <b>{model.summary.outboundProducts.toLocaleString(tx('vi-VN'))}</b> {tx("xuất")}</span></span>} icon="box" />
          </CatalogueSummary>
        </section>
        <section className="hn-premium-panel s20-panel s20-analytics" aria-labelledby="s20-analytics-title">
          <div className="s20-analytics-heading"><h2 id="s20-analytics-title">{tx("Nhập - xuất theo ngày")}</h2><Button variant="ghost" aria-expanded={chartsExpanded} aria-controls="s20-analytics-content" onClick={() => setChartsExpanded(value => !value)} trailingIcon={<Icon name={chartsExpanded ? 'arrow-up' : 'chevron-down'} size={16} />}>{tx(chartsExpanded ? 'Thu gọn biểu đồ' : 'Mở biểu đồ')}</Button></div>
          <div id="s20-analytics-content" hidden={!chartsExpanded}><MovementHistoryCharts summary={tx(model.summary)} /></div>
        </section>
        <section className="hn-premium-panel s20-panel s20-list" ref={list} aria-labelledby="s20-list-title" data-compact={compact}>
          <div className="s20-list-heading"><CatalogueListHeader id="s20-list-title" title={tx("Lịch sử giao dịch")} count={tx(`${model.pagination.total} kết quả`)} density="compact" /><div className="s20-list-context"><span>{tx("Tra cứu trên")} {model.source.detailTotal} {tx("giao dịch có dữ liệu chi tiết")}</span>{hiddenSortLabel && <span>{tx("Sắp xếp:")} {tx(hiddenSortLabel)} {tx("·")} {tx(sortOrder)}</span>}</div></div>
          <div className="s20-toolbar-wrap">
            <CatalogueToolbar id="s20" label={tx("Tìm kiếm và lọc giao dịch")} layout="worklist" searchLabel={tx("Tìm kiếm giao dịch")} searchHint={tx("Tìm theo mã phiếu hoặc đối tượng; không phân biệt dấu, chữ hoa và khoảng trắng.")} searchHintMode="sr-only" searchPlaceholder={tx("Tìm mã phiếu hoặc đối tượng…")} searchValue={query.search} onSearchChange={search => update({ search })} applyMode="immediate" queryContext={null} onReset={() => run(() => controller.reset(structuredClone(defaults)))} onRefresh={refresh} busy={pending} trailingControls={<FilterSelect label={tx("Người thực hiện")} value={query.performer} onChange={event => update({ performer: event.target.value })}><option value="">{tx("Tất cả")}</option>{model.filterOptions.performer.map(value => <option key={value} value={value}>{value}</option>)}</FilterSelect>}>{null}</CatalogueToolbar>
            <div className="s20-type-row"><span id="s20-type-label" className="hn-sr-only">{tx("Loại giao dịch")}</span><div className="s20-type-group" role="group" aria-labelledby="s20-type-label">
              <Button variant={query.type === '' ? 'primary' : 'ghost'} aria-pressed={query.type === ''} onClick={() => update({ type: '' })}>{tx("Tất cả")}</Button>
              {model.filterOptions.type.map(value => <Button key={value} variant={query.type === value ? 'primary' : 'ghost'} aria-pressed={query.type === value} leadingIcon={<Icon name={value === 'Nhập kho' ? 'arrow-down' : 'arrow-up'} size={16} />} onClick={() => update({ type: value as MovementQuery['type'] })}>{tx(value)}</Button>)}
            </div>{compact && <MovementCompactSort query={query} onChange={update} />}<MovementResultStatus pending={pending} total={model.pagination.total} detailTotal={model.source.detailTotal} /></div>
            {activeFilters.length > 0 && <div className="s20-filter-summary"><p>{model.pagination.total} {tx("kết quả ·")} {activeFilters.length} {tx("điều kiện đang áp dụng")}</p><CatalogueActiveFilters items={activeFilters} onRemove={removeFilter} /></div>}
          </div>
          <div data-s20-notice="list" /><NoticeSlot name="table" />
          <div className="s20-scroll-tools" hidden={!overflows}>
            <p className="s20-scroll-hint">{tx("Cuộn ngang để xem đủ thông tin giao dịch.")}</p>
            <div role="group" aria-label={tx("Cuộn ngang lịch sử giao dịch")}>
              <Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s20-table-region" aria-disabled={!scrollEdges.left} onClick={() => { if (scrollEdges.left) scrollTable(-1); }}><Icon name="chevron-left" size={18} /></Button>
              <Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s20-table-region" aria-disabled={!scrollEdges.right} onClick={() => { if (scrollEdges.right) scrollTable(1); }}><Icon name="chevron-right" size={18} /></Button>
            </div>
          </div>
          <div id="s20-table-region">
          <DataTable caption={tx("Lịch sử giao dịch")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet" columns={columns} rows={model.rows} rowKey={row => row.renderKey} sort={{ key: model.query.sortKey, direction: model.query.sortDirection }} onSort={key => update({ sortKey: key as MovementSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} scrollResetKey={JSON.stringify(model.query)} busy={pending} stickyHeader stickyColumnIds={overflows ? compact ? ['occurredAt'] : ['code'] : []} stickyEndColumnIds={[]} emptyContent={emptyReason ? <ReportEmptyState reason={emptyReason} itemLabel={tx("giao dịch")} /> : null} />
          </div>
          <div className="s20-list-footer"><Pagination preserveBoundaryFocus variant="products" unit={tx("giao dịch")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} pageSizeOptions={model.pagination.pageSizeOptions} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} /><NoticeSlot name="pagination" /></div>
          <p className="s20-availability" id="s20-flow-limit"><Icon name="eye" size={16} />{tx("Xem chi tiết hiện chưa khả dụng.")}</p>
        </section>
      </> : <MovementInitialFeedback failed={Boolean(state.error)} blocked={Boolean(state.blocker)} pending={pending || !state.error && !state.blocker} onRetry={refresh} />}
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>('#s20-search') ?? null} resolveInlineSlot={inlineSlot} revealInlineOnOpen protectedContentSelector=".s20-list,.s20-charts,.s20-overview" />}
    </div>
  </GlobalShell>;
}
