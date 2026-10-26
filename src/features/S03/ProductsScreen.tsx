import { formatDeclaredDateText } from '../../i18n/format-business-date';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DEFAULT_PRODUCTS_QUERY, resetProductsTableQuery } from '../../contracts/products';
import type { ProductRow, ProductSortKey, ProductsQuery } from '../../contracts/products';
import { createProductsRuntimeController } from '../../controllers/products-runtime';
import { getProductsPresentation } from '../../controllers/products-presentation';
import { recordReviewDiagnostic, recordUnresolvedAction } from '../../app/review-diagnostics';
import { CatalogueHeader, CatalogueSummary, SummaryMetric, SummaryDistribution, CatalogueListHeader, CatalogueToolbar, NoticeSlot, ordinalColumn, Button, DataTable, FilterSelect, GlobalShell, Icon, InitialReadState, Pagination, S03_SHELL_NAVIGATION, StatusBadge } from '../../shared';
import type { TableColumn } from '../../shared';
import { ProductNotice } from './ProductNotice';
import type { ProductFeedback } from './ProductNotice';
import { revealProductControl } from './product-focus';
import { ProductDetail } from './ProductDetail';
import './products.css';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { PRODUCT_CATALOG_COPY } from './catalog-copy';
import type { CatalogCreateAdapter } from '../../contracts/catalog-create';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { ProductCreateDialog } from './ProductCreateDialog';
import { CatalogProductsList } from './CatalogProductsList';
import { CatalogProductDetail } from './CatalogProductDetail';
import { createProductSelectionReader } from './selection-lifecycle';

type ReadAction = 'initial' | 'query' | 'reset' | 'refresh' | 'page';
type ReadOutcome = Awaited<ReturnType<ReturnType<typeof createProductsRuntimeController>['load']>>;

export function ProductsScreen({ createController = createProductsRuntimeController, catalogCreateAdapter, selectedEntityId = null }: { createController?: typeof createProductsRuntimeController; catalogCreateAdapter?: CatalogCreateAdapter<'product'>; selectedEntityId?: string | null }) {
  const tx = useUiCopy(PRODUCT_CATALOG_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const catalogAdapter = useMemo(() => catalogCreateAdapter ?? createCatalogCreateAdapter('product'), [catalogCreateAdapter]);
  const controller = useMemo(createController, [createController]);
  const presentation = useMemo(getProductsPresentation, []);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const model = state.model;
  const query = state.intendedQuery ?? DEFAULT_PRODUCTS_QUERY;
  const busy = state.loading || state.debouncing;
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<ProductFeedback | null>(null);
  const [detail, setDetail] = useState<{ row: ProductRow; origin: HTMLElement } | null>(null);
  const [scope, setScope] = useState<'source' | 'new'>(selectedEntityId !== null ? 'new' : 'source');
  const reader = useMemo(() => createProductSelectionReader(catalogAdapter), [catalogAdapter]);
  const catalogState = useSyncExternalStore(reader.subscribe, reader.getSnapshot, reader.getSnapshot);
  // Route changes are fenced during render; effects cannot expose a previous ID's fields.
  const sameRoute = catalogState.route === selectedEntityId;
  const catalog = sameRoute ? catalogState.snapshot : null;
  const catalogBusy = !sameRoute || catalogState.busy;
  const catalogError = catalogState.error;
  const [catalogReset, setCatalogReset] = useState(0);
  const [createOrigin, setCreateOrigin] = useState<HTMLElement | null>(null);
  const catalogOrigin = useRef<HTMLElement | null>(null);
  const catalogDetail = catalogState.detailId;
  const localizedFeedback = useMemo(() => feedback && { ...feedback, message: tx(feedback.message) }, [feedback, tx]);
  const focusFrame = useRef<number | null>(null);
  const feedbackSequence = useRef(0);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  function revealTableFocus(target: EventTarget) {
    if (!(target instanceof HTMLElement) || !target.closest('tbody')) return;
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      if (target.isConnected && document.activeElement === target && !document.querySelector('dialog[open]')) revealProductControl(target);
    });
  }
  const showFeedback = useCallback((message: string, tone: ProductFeedback['tone'] = 'info', origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) => {
    setFeedback({ message, tone, sequence: ++feedbackSequence.current,
      container: document.querySelector<HTMLDialogElement>('dialog[open]') ?? document.body,
      origin });
  }, []);

  const loadCatalog = useCallback(async (announce = false) => {
    if (await reader.refresh() && announce) showFeedback('Đã cập nhật hồ sơ tạo mới.', 'success');
  }, [reader, showFeedback]);
  useLayoutEffect(() => {
    setDetail(null);
    catalogOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : document.body;
    if (selectedEntityId !== null && !createOrigin) setScope('new');
  }, [selectedEntityId, createOrigin]);
  useLayoutEffect(() => {
    reader.configure(selectedEntityId, scope === 'new', !!createOrigin);
  }, [reader, selectedEntityId, scope, createOrigin]);
  useEffect(() => {
    reader.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void reader.refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      reader.invalidate();
    };
  }, [reader]);

  const finishRead = useCallback((outcome: ReadOutcome, action: ReadAction, origin: HTMLElement | null) => {
    if (outcome.kind === 'superseded') return;
    setRefreshing(false);
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S03_READ', detail: String(outcome.error) });
      if (controller.getSnapshot().model) showFeedback('Chưa thể cập nhật danh sách. Vui lòng thử lại.', 'error', origin);
    } else if (outcome.result.kind === 'ready') {
      if (action === 'reset') showFeedback('Đã đặt lại bộ lọc sản phẩm.', 'success', origin);
      if (action === 'refresh') showFeedback('Đã cập nhật danh sách sản phẩm.', 'success', origin);
    } else {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S03:${outcome.result.reason}`, detail: outcome.result.detail });
      if (controller.getSnapshot().model) showFeedback('Lựa chọn này chưa khả dụng trong bản xem trước. Danh sách đang hiển thị được giữ nguyên.', 'info', origin);
    }
  }, [controller, showFeedback]);

  useEffect(() => {
    let cancelled = false;
    void controller.load(DEFAULT_PRODUCTS_QUERY).then(outcome => { if (!cancelled) finishRead(outcome, 'initial', null); });
    return () => { cancelled = true; controller.clear(); };
  }, [controller, finishRead]);

  function read(query: ProductsQuery, action: ReadAction) {
    setFeedback(null);
    setRefreshing(action === 'refresh');
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void controller.load(query).then(outcome => finishRead(outcome, action, origin));
  }
  function unavailable(key: string, message = 'Chức năng này chưa khả dụng trong bản xem trước.') {
    recordUnresolvedAction(key);
    showFeedback(message);
  }
  function change(patch: Partial<ProductsQuery>, action: ReadAction = 'query') {
    setFeedback(null);
    setRefreshing(false);
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void controller.update(patch).then(outcome => finishRead(outcome, action, origin));
  }
  function sort(key: string) {
    const current = controller.getSnapshot().intendedQuery ?? DEFAULT_PRODUCTS_QUERY;
    change({ sortKey: key as ProductSortKey, sort: current.sortKey === key && current.sort === 'asc' ? 'desc' : 'asc' });
  }
  function retryInitialRead() { read({ ...(state.acceptedQuery ?? state.intendedQuery ?? DEFAULT_PRODUCTS_QUERY) }, 'initial'); }
  function reset() { read(resetProductsTableQuery(), 'reset'); }
  function refresh() { read({ ...(model?.query ?? DEFAULT_PRODUCTS_QUERY) }, 'refresh'); }
  const columns: TableColumn<ProductRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'product', heading: tx("Sản phẩm"), sortKey: 'name', sortLabel: tx("Tên sản phẩm"), render: row => <span className="pr-product-cell"><span className="pr-product-copy"><strong className="pr-product-name">{row.name}</strong><span className="pr-product-code">{row.code}</span></span></span> },
    { id: 'group', heading: tx("Nhóm hàng"), sortKey: 'group', sortLabel: tx("Nhóm hàng"), render: row => <span className="pr-group-cell">{row.group}</span> },
    { id: 'sku', heading: tx("Số SKU"), sortKey: 'skuCount', sortType: 'number', align: 'end', render: row => <span className="pr-number">{row.skuCount}</span> },
    { id: 'unit', heading: tx("ĐVT"), sortKey: 'unit', render: row => row.unit },
    { id: 'status', heading: tx("Trạng thái"), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.statusLabel)}</StatusBadge> },
    { id: 'updated', heading: tx("Cập nhật"), sortKey: 'updatedAt', sortType: 'date', render: row => <span className="pr-updated">{row.updatedAt.split(' · ').map((part, index) => <span key={part}>{index === 0 ? formatDeclaredDateText(part, language) : part}</span>)}</span> },
    { id: 'action', kind: 'actions', heading: tx("Thao tác"), render: row => <Button variant="ghost" className="pr-view" aria-label={tx('Xem {code}', { code: row.code })} aria-haspopup="dialog" onClick={event => { setFeedback(null); setDetail({ row, origin: event.currentTarget }); }}><Icon name="eye" width={18} height={18} />{tx("Xem")}</Button> },
  ];

  return <GlobalShell title={tx("Danh mục sản phẩm")} variant="wms" activeKey="S03" navigation={S03_SHELL_NAVIGATION} profile={presentation.profile} onUnresolvedAction={key => unavailable(`S03:${key}`)}>
    <div className="pr-screen hn-catalogue-screen" data-screen="S03" data-design="premium" data-visual-variant="premium">
      <CatalogueHeader title={tx("Danh mục sản phẩm")} breadcrumb={tx("Sản phẩm")} description={tx("Quản lý sản phẩm gốc và các SKU liên kết")} action={tx("Thêm sản phẩm")} onAction={() => {
        setFeedback(null);
        reader.configure(selectedEntityId, scope === 'new', true);
        setDetail(null);
        setCreateOrigin(document.activeElement instanceof HTMLElement ? document.activeElement : document.body);
      }} />
      <div className="pr-catalog-scope"><FilterSelect id="pr-data-scope" label={tx('Tập dữ liệu')} value={scope} onChange={event => setScope(event.target.value as 'source' | 'new')}><option value="source">{tx('Dữ liệu hiện có')}</option><option value="new">{tx('Hồ sơ tạo mới')}</option></FilterSelect></div>
      {!model && <InitialReadState label={tx("Danh mục sản phẩm")} loading={busy} error={state.error} blocked={Boolean(state.blocker)} onRetry={retryInitialRead} />}
      {model && <>
        <p className="pr-source-label">{tx('Số liệu nguồn')}</p>
        <CatalogueSummary label={tx("Số liệu nguồn")}><SummaryMetric label={tx("Sản phẩm gốc")} value={model.summary.productsTotal.toLocaleString(locale)} detail={tx("sản phẩm")} icon="box"/><SummaryMetric label={tx("SKU liên kết")} value={model.summary.linkedSkus.toLocaleString(locale)} detail="SKU" icon="tag"/><SummaryDistribution title={tx("Trạng thái danh mục")} active={model.summary.active} inactive={model.summary.inactive} activePercentage={model.summary.activePercentage} inactivePercentage={model.summary.inactivePercentage}/></CatalogueSummary>
        <section hidden={scope !== 'source'} className="pr-panel pr-list hn-premium-panel" aria-labelledby="pr-list-title">
          <CatalogueListHeader id="pr-list-title" title={tx("Danh sách sản phẩm")} count={`${model.pagination.total} ${tx('sản phẩm')}`} />
          <p className="pr-scope-note">{tx(model.interactionScope.kind === 'qa60' ? 'QA riêng: 60 hồ sơ tổng hợp.' : 'Danh sách gồm 7 sản phẩm có dữ liệu chi tiết.')}{' '}{tx('Thống kê phía trên là toàn danh mục.')}</p>
          <CatalogueToolbar id="pr" label={tx("Bộ lọc sản phẩm")} searchLabel={tx("Tìm mã hoặc tên sản phẩm")} searchHint={tx("Theo mã hoặc tên, không phân biệt dấu")} searchValue={query.search} onSearchChange={search => change({ search })} onReset={reset} onRefresh={refresh} busy={refreshing} applyMode="immediate" acceptedLabel={`${model.pagination.total} / ${model.interactionScope.recordCount} ${tx('sản phẩm')}`}>
            <FilterSelect id="pr-group-filter" label={tx("Nhóm hàng")} aria-label={tx("Nhóm hàng")} value={query.group} onChange={event => change({ group: event.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.groups.map(group => <option key={group} value={group}>{group}</option>)}</FilterSelect>
            <FilterSelect id="pr-status-filter" label={tx("Trạng thái")} aria-label={tx("Trạng thái")} value={query.status} onChange={event => change({ status: event.target.value as ProductsQuery['status'] })}><option value="all">{tx("Tất cả")}</option><option value="active">{tx("Đang hoạt động")}</option><option value="inactive">{tx("Ngừng sử dụng")}</option></FilterSelect>
            <FilterSelect id="pr-unit-filter" label={tx("Đơn vị tính")} aria-label={tx("Đơn vị tính")} value={query.unit} onChange={event => change({ unit: event.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.units.map(unit => <option key={unit} value={unit}>{unit}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <NoticeSlot name="table" />
          <div className="pr-table" aria-busy={busy} onFocusCapture={event => revealTableFocus(event.target)}><DataTable appearance="refined" stickyHeader stickyEndColumnIds={['action']} caption={tx("Danh sách sản phẩm")} columns={columns} rows={model.rows} rowKey={row => row.key} sort={model.query.sortKey && model.query.sort ? { key: model.query.sortKey, direction: model.query.sort } : null} onSort={sort} busy={busy} scrollResetKey={JSON.stringify(model.query)} emptyStateKind="no-results" onResetFilters={reset} emptyContent={<p role="status">{tx("Không tìm thấy sản phẩm phù hợp. Hãy đổi điều kiện hoặc đặt lại bộ lọc.")}</p>} /></div>
          <Pagination variant="products" unit={tx("sản phẩm")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => change({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => change({ pageSize })} />
          <NoticeSlot name="pagination" />
        </section>
      </>}
      <div className="pr-catalog-cohort" hidden={scope !== 'new'}><CatalogProductsList snapshot={catalog} busy={catalogBusy} error={catalogError} resetToken={catalogReset} onRefresh={() => void loadCatalog(true)} onReset={() => showFeedback('Đã đặt lại bộ lọc hồ sơ tạo mới.', 'success')} onView={(id, origin) => { setFeedback(null); catalogOrigin.current = origin; reader.open(id); }} /></div>
      {catalogState.unavailable && !createOrigin && <p role="alert">{tx('Hồ sơ sản phẩm được chọn không tồn tại trong dữ liệu hiện tại.')}</p>}
      {detail && !createOrigin && selectedEntityId === null && <ProductDetail row={detail.row} origin={detail.origin} onClose={() => setDetail(null)} />}
      {createOrigin && <ProductCreateDialog adapter={catalogAdapter} origin={createOrigin} onClose={() => setCreateOrigin(null)} onSaved={(snapshot, id) => {
        catalogOrigin.current = createOrigin;
        reader.acceptCreated(snapshot, id);
        setScope('new'); setCatalogReset(value => value + 1); setCreateOrigin(null);
        showFeedback('Đã tạo sản phẩm.', 'success', createOrigin);
      }} />}
      {!createOrigin && catalogDetail && catalog && <CatalogProductDetail snapshot={catalog} id={catalogDetail} origin={catalogOrigin.current ?? document.body} onClose={() => reader.dismiss()} />}
      {localizedFeedback && <ProductNotice feedback={localizedFeedback} onClose={() => setFeedback(null)} />}
    </div>
  </GlobalShell>;
}
