import { OPERATIONS_EN_COPY, renderOperationsText, uiText, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createInventoryController } from '../../controllers/inventory-controller';
import { DEFAULT_INVENTORY_QUERY as defaults, type InventoryAdapter, type InventoryQuery, type InventoryRow, type InventorySortKey } from '../../contracts/inventory-reconciliation';
import { InitialReadState, Button, CatalogueActiveFilters, CatalogueNavTabs, CataloguePageHeader, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge, ordinalColumn } from '../../shared';
import type { NoticeFeedback, TableColumn } from '../../shared';
import { inventoryFeedbackSlot, useInventoryFocus, visibleInventoryAction } from './inventory-focus';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import './inventory.css';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalInventory, INVENTORY_BINDING_COPY } from './OperationalInventory';
import type { InventoryOperationalReader } from './inventory-binding';

type Operation = ReturnType<ReturnType<typeof createInventoryController>['load']>;
type QueryAction = 'initial' | 'search' | 'filter' | 'sort' | 'page' | 'pageSize' | 'reset';

const statusTone = (value: InventoryRow['stockStatus']): 'success' | 'warning' | 'neutral' => value === 'Khả dụng' ? 'success' : value === 'Chờ kiểm tra' || value === 'Hàng lỗi' ? 'warning' : 'neutral';
const differenceText = (value: number | null, unit: InventoryRow['unit']) => value === null ? '—' : `${value < 0 ? '−' : ''}${Math.abs(value)} ${unit}`;
const quantityText = (value: number | null, unit: InventoryRow['unit']) => value === null ? '—' : `${value} ${unit}`;

export function InventoryScreen({ adapter, operationalAdapter }: { adapter?: InventoryAdapter; operationalAdapter?: InventoryOperationalReader } = {}) {
  const tx = useUiCopy({ ...OPERATIONS_EN_COPY, ...INVENTORY_BINDING_COPY });
  const operational = useMemo(() => operationalAdapter ?? createOperationalWebAdapter(undefined, { scope: 'S16' }), [operationalAdapter]);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createInventoryController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? defaults;
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const sequence = useRef(0);
  const intent = useRef(0);
  const { screen, onFocusCapture } = useInventoryFocus(Boolean(model) && cohort === 'legacy');
  const tableView = useRef<HTMLDivElement>(null);
  const [tableOverflows, setTableOverflows] = useState(false);
  const hasModel = Boolean(model);
  useEffect(() => {
    const region = tableView.current?.querySelector<HTMLElement>('.hn-table-scroll');
    const table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => setTableOverflows(region.clientWidth > 0 && region.scrollWidth > region.clientWidth + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(region); observer.observe(table); measure();
    return () => observer.disconnect();
  }, [hasModel, cohort]);

  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, action: QueryAction, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S16_READ', detail: 'Fixture read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách tồn. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
      return;
    }
    if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S16:${outcome.result.reason}`, detail: outcome.result.detail });
      notify(uiText('Chưa thể áp dụng điều kiện S16: {detail} Đã giữ dữ liệu đã đọc.', { detail: uiText(outcome.result.detail) }), origin, 'info');
      return;
    }
    if (action === 'reset') notify('Đã đặt lại điều kiện tra cứu.', origin);
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    void controller.load({ ...defaults }).then(result => { if (active) finish(result, null, 'initial', intent.current); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);

  function run(operation: () => Operation, action: QueryAction, origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const token = ++intent.current;
    setNotice(null);
    void operation().then(result => finish(result, origin, action, token));
  }
  function update(patch: Partial<InventoryQuery>, action: QueryAction, origin?: HTMLElement | null) {
    run(() => controller.update(patch), action, origin);
  }
  function blockedAction(label: string, origin: HTMLElement, code?: string) {
    // Informational entrypoints do not own or cancel the latest list query.
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S16:FLOW_NOT_SUPPLIED', detail: `${label}${code ? ` ${code}` : ''}: no assigned source/flow; no mutation.` });
    notify(uiText('{action}{code} chưa khả dụng.', { action: uiText(label), code: code ? ` ${code}` : '' }), origin, 'info');
  }

  const onSort = (key: string, origin: HTMLElement) => {
    const sortKey = key as InventorySortKey;
    const sortDirection = query.sortKey === sortKey && query.sortDirection === 'asc' ? 'desc' : 'asc';
    update({ sortKey, sortDirection }, 'sort', origin);
  };
  const columns: TableColumn<InventoryRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? defaults.pageSize),
    { id: 'sku', heading: tx('SKU'), sortKey: 'sku', sortType: 'text', render: row => <strong className="s16-code">{row.sku}</strong> },
    { id: 'name', heading: tx('Tên hàng'), sortKey: 'name', sortType: 'text', render: row => <div className="s16-name"><strong>{row.name}</strong><span>{tx(row.itemType)}</span></div> },
    { id: 'stockStatus', heading: tx('Trạng thái tồn'), sortKey: 'stockStatus', sortType: 'text', render: row => <StatusBadge tone={statusTone(row.stockStatus)}>{tx(row.stockStatus)}</StatusBadge> },
    { id: 'available', heading: tx('Khả dụng'), sortKey: 'available', sortType: 'number', align: 'end', render: row => <span className="s16-number">{quantityText(row.available, row.unit)}</span> },
    { id: 'onHand', heading: tx('Tồn hiện có'), sortKey: 'onHand', sortType: 'number', align: 'end', render: row => <span className="s16-number">{quantityText(row.onHand, row.unit)}</span> },
    { id: 'ledger', heading: tx('Tồn theo sổ cái'), sortKey: 'ledger', sortType: 'number', align: 'end', render: row => <span className="s16-number">{quantityText(row.ledger, row.unit)}</span> },
    { id: 'difference', heading: tx('Chênh lệch'), sortKey: 'difference', sortType: 'number', align: 'end', render: row => <span className={row.difference === null || row.difference === 0 ? 's16-number' : 's16-number s16-number--warning'}>{differenceText(row.difference, row.unit)}</span> },
    { id: 'suggestedLocation', heading: tx('Vị trí gợi ý'), render: row => <span className="s16-location">{row.suggestedLocation}</span> },
    { id: 'reconciliation', heading: tx('Đối soát'), sortKey: 'reconciliation', sortType: 'text', render: row => <StatusBadge tone={row.reconciliation === 'Khớp' ? 'success' : 'warning'}>{tx(row.reconciliation)}</StatusBadge> },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', align: 'end', render: row => <Button variant="ghost" data-s16-action={row.renderKey} aria-label={tx('Mở {code}', { code: row.sku })} aria-describedby="s16-action-limit" onClick={event => blockedAction('Mở', event.currentTarget, row.sku)}><Icon name="eye" size={17} />{tx("Mở")}</Button> },
  ];

  const cardRows = model?.rows ?? [];
  const activeFilters = model ? [
    ...(model.query.search ? [{ key: 'search' as const, label: tx('Tìm: {value}', { value: model.query.search }) }] : []),
    ...(model.query.itemType ? [{ key: 'itemType' as const, label: tx('Loại: {value}', { value: tx(model.query.itemType) }) }] : []),
    ...(model.query.stockStatus ? [{ key: 'stockStatus' as const, label: tx('Trạng thái tồn: {value}', { value: tx(model.query.stockStatus) }) }] : []),
  ] : [];
  function removeFilter(key: 'search' | 'itemType' | 'stockStatus') {
    const search = document.getElementById('s16-search');
    search?.focus({ preventScroll: true });
    update({ [key]: '' }, 'filter', search);
  }
  return <GlobalShell title={tx("Tra cứu tồn & đối soát")} variant="wms" activeKey="S16" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div ref={screen} className="hn-catalogue-screen s16-screen" data-screen="S16" data-visual-variant="premium" onFocusCapture={onFocusCapture}>
      <CataloguePageHeader appearance="compact" title={tx("Tra cứu tồn & đối soát")} parentLabel={tx("Tồn kho & Đối soát")} breadcrumb={tx("Tra cứu tồn & đối soát")} actions={cohort === 'legacy' ? <Button variant="secondary" aria-describedby="s16-trace-limit" onClick={event => blockedAction('Truy vết mã', event.currentTarget)}><Icon name="barcode" size={18} />{tx("Truy vết mã")}</Button> : undefined} />
      <span id="s16-trace-limit" className="hn-sr-only">{tx("Truy vết mã hiện chưa khả dụng.")}</span>
      {operational.available && <FilterSelect label={tx('Nguồn dữ liệu')} aria-label={tx('Nguồn dữ liệu')} className="hn-source-select" value={cohort} onChange={event => setCohort(event.target.value as 'scenario' | 'legacy')}><option value="scenario">{tx('Phiên hiện tại')}</option><option value="legacy">{tx('Dữ liệu đã duyệt')}</option></FilterSelect>}
      {cohort === 'scenario' ? <OperationalInventory adapter={operational} /> : model ? <section className="s16-list hn-premium-panel" aria-labelledby="s16-list-title">
        <h2 id="s16-list-title" className="hn-sr-only">{tx("Danh sách tồn kho")}</h2>
        <div className="s16-workspace-top">
          <CatalogueNavTabs label={tx("Nguồn dữ liệu tồn kho")} items={[
            { key: 'current', label: tx('Tồn kho hiện tại'), icon: 'box', current: true },
            { key: 'history', label: tx('Lịch sử biến động'), icon: 'history', unavailable: true, unavailableDescription: tx('Lịch sử biến động hiện chưa khả dụng.'), onClick: event => blockedAction('Lịch sử biến động', event.currentTarget) },
          ]} />
          <Button variant="ghost" className="s16-help-toggle" aria-expanded={helpOpen} aria-controls="s16-help-panel" onClick={event => { helpButton.current = event.currentTarget; setHelpOpen(value => !value); }} onKeyDown={event => { if (event.key === 'Escape' && helpOpen && !event.nativeEvent.isComposing) { event.stopPropagation(); setHelpOpen(false); } }}>
            <Icon name="info" size={17} />{tx('Cách đọc số liệu')}
          </Button>
        </div>
        <div className="s16-help-panel" id="s16-help-panel" hidden={!helpOpen} role="region" aria-label={tx("Phạm vi và công thức đối soát")} onKeyDown={event => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); setHelpOpen(false); helpButton.current?.focus({ preventScroll: true }); }
        }}>
          <p><strong>{tx('Chênh lệch = Tồn hiện có − Tồn theo sổ cái.')}</strong> {tx("Số lượng khả dụng và tồn hiện có được hiển thị riêng.")}</p>
          <Button variant="ghost" iconOnly aria-label={tx("Đóng hướng dẫn số liệu")} onClick={() => { setHelpOpen(false); helpButton.current?.focus({ preventScroll: true }); }}><Icon name="close" size={18} /></Button>
        </div>
        <div className="s16-query-area">
          <CatalogueToolbar layout="worklist" id="s16" label={tx("Tìm kiếm và lọc tồn kho")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tìm theo SKU, tên hàng hoặc kho; kết quả áp dụng sau 250 ms.")} searchHintMode="sr-only" searchPlaceholder={tx("Tìm SKU, tên hàng hoặc kho...")} searchValue={query.search} onSearchChange={search => update({ search }, 'search', document.getElementById('s16-search'))} onReset={() => run(() => controller.reset({ ...defaults }), 'reset')} applyMode="immediate" busy={state.loading} queryContext={null}>
            <FilterSelect label={tx("Loại")} value={query.itemType} onChange={event => update({ itemType: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.itemType.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect label={tx("Trạng thái tồn")} value={query.stockStatus} onChange={event => update({ stockStatus: event.target.value }, 'filter', event.currentTarget)}><option value="">{tx("Tất cả")}</option>{model.filterOptions.stockStatus.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
          </CatalogueToolbar>
          {activeFilters.length > 0 && <div className="s16-filter-summary"><CatalogueActiveFilters items={activeFilters} onRemove={removeFilter} /></div>}
        </div>
        <NoticeSlot name="table" />
        <div className="s16-table-view" ref={tableView}>
          <p className="s16-scroll-hint" hidden={!tableOverflows}><span id="s16-scroll-guidance" className="s16-scroll-guidance"><Icon name="info" size={14} />{tx("Cuộn ngang để xem đầy đủ 11 cột.")}</span></p>
          <DataTable scrollFocusIndicatorId={tableOverflows ? 's16-scroll-guidance' : undefined} appearance="refined" density="compact" rowActionAppearance="quiet" caption={tx("Danh sách tồn kho")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.renderKey} sort={model.query.sortKey ? { key: model.query.sortKey, direction: model.query.sortDirection } : null} onSort={key => onSort(key, document.activeElement instanceof HTMLElement ? document.activeElement : document.body)} scrollResetKey={JSON.stringify(model.query)} emptyStateKind="no-results" emptyContent={<p>{tx("Không có dòng tồn phù hợp với điều kiện đã chọn.")}</p>} busy={state.loading} stickyHeader stickyColumnIds={['sku']} stickyEndColumnIds={['action']} />
          <div className="s16-feedback-host s16-feedback-host--table" data-s16-feedback />
        </div>
        <div className="s16-card-view" aria-label={tx("Danh sách tồn kho dạng thẻ")}>
          <div className="s16-card-sort">
            <FilterSelect id="s16-card-sort-key" label={tx('Sắp xếp theo')} value={query.sortKey} onChange={event => update({ sortKey: event.target.value as InventorySortKey | '', sortDirection: 'asc' }, 'sort', event.currentTarget)}>
              <option value="">{tx('Thứ tự nguồn')}</option>
              {columns.filter(column => column.sortKey).map(column => <option key={column.sortKey} value={column.sortKey}>{column.heading}</option>)}
            </FilterSelect>
            <FilterSelect id="s16-card-sort-direction" label={tx('Chiều sắp xếp')} value={query.sortDirection} disabled={!query.sortKey} onChange={event => update({ sortDirection: event.target.value as InventoryQuery['sortDirection'] }, 'sort', event.currentTarget)}>
              <option value="asc">{tx('Tăng dần')}</option><option value="desc">{tx('Giảm dần')}</option>
            </FilterSelect>
          </div>
          {cardRows.length ? cardRows.map((row, index) => <article className="s16-card" key={row.renderKey}>
            <div className="s16-card-head">
              <div className="s16-card-identity">
                <div className="s16-card-key"><span className="s16-ordinal">{(model.pagination.start || 1) + index}</span><strong className="s16-code">{row.sku}</strong><span className="s16-item-type">{tx(row.itemType)}</span></div>
                <h3>{row.name}</h3>
              </div>
              <StatusBadge tone={statusTone(row.stockStatus)}>{tx(row.stockStatus)}</StatusBadge>
            </div>
            <dl className="s16-card-grid">
              <div><dt>{tx("Khả dụng")}</dt><dd>{quantityText(row.available, row.unit)}</dd></div>
              <div><dt>{tx("Tồn hiện có")}</dt><dd>{quantityText(row.onHand, row.unit)}</dd></div>
              <div><dt>{tx("Tồn theo sổ cái")}</dt><dd>{quantityText(row.ledger, row.unit)}</dd></div>
              <div><dt>{tx("Chênh lệch")}</dt><dd className={row.difference !== null && row.difference !== 0 ? 's16-number--warning' : undefined}>{differenceText(row.difference, row.unit)}</dd></div>
            </dl>
            <div className="s16-card-foot">
              <p className="s16-card-location"><Icon name="box" size={16} />{row.suggestedLocation}</p>
              <div className="s16-card-actions">
                <StatusBadge tone={row.reconciliation === 'Khớp' ? 'success' : 'warning'}>{tx(row.reconciliation)}</StatusBadge>
                <Button variant="ghost" data-s16-action={row.renderKey} aria-label={tx('Mở {code}', { code: row.sku })} aria-describedby="s16-action-limit" onClick={event => blockedAction('Mở', event.currentTarget, row.sku)}><Icon name="eye" size={17} />{tx("Mở")}</Button>
              </div>
            </div>
            <div className="s16-feedback-host" data-s16-feedback />
          </article>) : <p className="s16-card-empty">{tx("Không có dòng tồn phù hợp với điều kiện đã chọn.")}</p>}
        </div>
        <div className="s16-list-footer">
          <Pagination preserveBoundaryFocus variant="products" unit={tx("dòng tồn")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => update({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => update({ pageSize }, 'pageSize', document.querySelector<HTMLElement>('.s16-list .hn-page-size select'))} />
          <NoticeSlot name="pagination" />
        </div>
      </section> : <InitialReadState label={tx("danh sách tồn")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? defaults) }), 'initial')} />}
      <span id="s16-action-limit" className="hn-sr-only">{tx("Mở chi tiết tồn hiện chưa khả dụng.")}</span>
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} resolveFocusFallback={visibleInventoryAction} resolveInlineSlot={inventoryFeedbackSlot} protectedContentSelector=".s16-help-panel, .s16-list, .s16-screen .hn-page-heading, .s16-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}





