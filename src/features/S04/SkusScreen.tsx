import { formatDeclaredDateText } from '../../i18n/format-business-date';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { DEFAULT_SKUS_QUERY, resetSkusTableQuery } from '../../contracts/skus';
import type { SkuRow, SkusDataAdapter, SkusQuery, SkusSortKey } from '../../contracts/skus';
import { createSkusRuntimeController } from '../../controllers/skus-runtime';
import { getSkusPresentation } from '../../controllers/skus-presentation';
import { recordReviewDiagnostic, recordUnresolvedAction } from '../../app/review-diagnostics';
import { CatalogueHeader, CatalogueSummary, SummaryMetric, CatalogueListHeader, CatalogueToolbar, NoticeSlot, ordinalColumn, Button, DataTable, FilterSelect, GlobalShell, Icon, InitialReadState, Pagination, StatusBadge } from '../../shared';
import type { TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { SkuNotice } from './SkuNotice';
import type { SkuFeedback } from './SkuNotice';
import { revealSkuControl } from './sku-focus';
import './skus.css';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { SkuDetail } from './SkuDetail';
import { resolveSkuDetailRow, type SkuDetailTarget } from './sku-detail';
import type { CatalogCreateAdapter } from '../../contracts/catalog-create';
import { createCatalogCreateAdapter } from '../../data/http/catalog-create-adapter';
import { SkuCatalog } from './SkuCatalog';
import { SKU_CATALOG_COPY } from './sku-catalog-copy';

type ReadAction = 'query' | 'reset' | 'refresh' | 'page';

export function SkusScreen({ adapter, catalogCreateAdapter, selectedEntityId }: { adapter?: SkusDataAdapter; catalogCreateAdapter?: CatalogCreateAdapter<'sku'>; selectedEntityId?: string | null } = {}) {
  const tx = useUiCopy(SKU_CATALOG_COPY);
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const catalogAdapter = useMemo(() => catalogCreateAdapter ?? createCatalogCreateAdapter('sku'), [catalogCreateAdapter]);
  const [scope, setScope] = useState<'source' | 'new'>(selectedEntityId != null ? 'new' : 'source');
  const [createOrigin, setCreateOrigin] = useState<HTMLElement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const controller = useMemo(() => createSkusRuntimeController(adapter), [adapter]);
  const presentation = useMemo(getSkusPresentation, []);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const model = snapshot.model;
  const controls = snapshot.intendedQuery ?? DEFAULT_SKUS_QUERY;
  const refreshing = snapshot.loading || snapshot.debouncing;
  const [feedback, setFeedback] = useState<SkuFeedback | null>(null);
  const [detail, setDetail] = useState<(SkuDetailTarget & { origin: HTMLElement }) | null>(null);
  useLayoutEffect(() => {
    setDetail(null);
    if (selectedEntityId != null) setScope('new');
  }, [selectedEntityId]);
  const localizedFeedback = useMemo(() => feedback && { ...feedback, message: tx(feedback.message) }, [feedback, tx]);
  const [tableOverflows, setTableOverflows] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const focusFrame = useRef<number | null>(null);
  const feedbackSequence = useRef(0);
  useEffect(() => { void controller.load(); return () => controller.clear(); }, [controller]);
  useLayoutEffect(() => {
    const region = tableRef.current?.querySelector<HTMLElement>('.hn-table-scroll');
    const table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const overflow = region.scrollWidth > region.clientWidth + 1;
      setTableOverflows(overflow);
      if (overflow) region.setAttribute('aria-describedby', 'sku-table-scroll-hint');
      else region.removeAttribute('aria-describedby');
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region); observer.observe(table);
    return () => { observer.disconnect(); region.removeAttribute('aria-describedby'); };
  }, [model]);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  function revealTableFocus(target: EventTarget) {
    if (!(target instanceof HTMLElement) || !target.closest('tbody')) return;
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      if (document.activeElement === target && target.isConnected) revealSkuControl(target);
    });
  }
  function changeQuery(patch: Partial<SkusQuery>, action: ReadAction = 'query') {
    read(() => controller.update(patch), action);
  }
  const showFeedback = useCallback((message: string, tone: SkuFeedback['tone'] = 'info', origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) => {
    setFeedback({ message, tone, sequence: ++feedbackSequence.current,
      container: document.querySelector<HTMLDialogElement>('dialog[open]') ?? document.body, origin });
  }, []);

  useEffect(() => {
    if (snapshot.blocker) {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S04:${snapshot.blocker.reason}`, detail: snapshot.blocker.detail });
      if (snapshot.model) showFeedback('Lựa chọn này chưa khả dụng trong bản xem trước. Danh sách đang hiển thị được giữ nguyên.');
    } else if (snapshot.error) {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S04_READ', detail: String(snapshot.error) });
      if (snapshot.model) showFeedback('Chưa thể cập nhật danh sách. Vui lòng thử lại.', 'error');
    }
  }, [snapshot.blocker, snapshot.error, snapshot.model, showFeedback]);

  function read(operation: () => ReturnType<typeof controller.load>, action: ReadAction) {
    setFeedback(null);
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const pending = operation();
    const requestId = controller.getSnapshot().requestId;
    void pending.then(outcome => {
      if (controller.getSnapshot().requestId !== requestId || outcome.kind !== 'applied' || outcome.result.kind !== 'ready') return;
      if (action === 'reset') showFeedback('Đã đặt lại bộ lọc SKU.', 'success', origin);
      if (action === 'refresh') showFeedback('Đã cập nhật danh sách SKU.', 'success', origin);
    });
  }
  function unavailable(key: string, message = 'Chức năng này chưa khả dụng trong bản xem trước.') {
    recordUnresolvedAction(key);
    showFeedback(message);
  }
  function retryInitialRead() { read(() => controller.load(snapshot.acceptedQuery ?? snapshot.intendedQuery ?? DEFAULT_SKUS_QUERY), 'query'); }
  function reset() { read(() => controller.reset(resetSkusTableQuery()), 'reset'); }
  function refresh() { read(() => controller.load(model?.query ?? DEFAULT_SKUS_QUERY), 'refresh'); }
  const acceptedLabel = model ? [
    model.query.search.trim() && `“${model.query.search.replace(/\s+/g, ' ').trim()}”`,
    model.query.group !== 'all' && model.query.group,
    model.query.status !== 'all' && tx(model.query.status === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng'),
    model.query.unit !== 'all' && model.query.unit,
  ].filter(Boolean).join(' · ') || tx('Tất cả') : tx('Tất cả');
  const columns: TableColumn<SkuRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'sku', heading: tx("SKU / Sản phẩm"), sortKey: 'code', sortLabel: tx("SKU / Sản phẩm (mã SKU)"), render: row => <span className="sku-product-cell"><span className="sku-product-copy"><strong className="sku-code">{row.code}</strong><span className="sku-name">{row.name}</span></span></span> },
    { id: 'group', heading: tx("Nhóm hàng"), sortKey: 'group', sortLabel: tx("Nhóm hàng"), render: row => <span className="sku-group-cell">{row.group}</span> },
    { id: 'unit', heading: tx("ĐVT"), sortKey: 'unit', render: row => row.unit },
    { id: 'barcode', heading: tx("Mã vạch"), sortKey: 'barcode', render: row => <span className="sku-barcode">{row.barcode}</span> },
    { id: 'status', heading: tx("Trạng thái"), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.statusLabel)}</StatusBadge> },
    { id: 'updated', heading: tx("Cập nhật"), sortKey: 'updatedAt', sortType: 'date', render: row => <span className="sku-updated">{row.updatedAt.split(' · ').map((part, index) => <span key={part}>{index === 0 ? formatDeclaredDateText(part, language) : part}</span>)}</span> },
    { id: 'action', heading: tx("Thao tác"), kind: 'actions', render: row => <Button variant="secondary" className="sku-view" aria-haspopup="dialog" aria-label={tx('Xem {code}', { code: row.code })} onClick={event => { setFeedback(null); setDetail({ key: row.key, sourceId: model!.source.id, origin: event.currentTarget }); }}><Icon name="eye" width={18} height={18} />{tx("Xem")}</Button> },
  ];

  return <GlobalShell title={tx("Danh mục SKU")} variant="wms" activeKey="S04" navigation={S00_SHELL_NAVIGATION} profile={presentation.profile} onUnresolvedAction={key => unavailable(`S04:${key}`)}>
    <div className="sku-screen hn-catalogue-screen" data-screen="S04" data-visual-variant="premium" ref={screenRef}>
      <CatalogueHeader title={tx("Danh mục SKU")} breadcrumb="SKU" description={tx("Quản lý thông tin định danh và trạng thái sử dụng của sản phẩm")} action={tx("Thêm SKU")} onAction={() => { setCreateOrigin(document.activeElement instanceof HTMLElement ? document.activeElement : null); setCreateOpen(true); }} />
      <div className="sku-catalog-scope"><FilterSelect id="sku-catalog-scope" label={tx('Tập dữ liệu')} value={scope} onChange={event => setScope(event.target.value as 'source' | 'new')}><option value="source">{tx('Dữ liệu hiện có')}</option><option value="new">{tx('Hồ sơ tạo mới')}</option></FilterSelect></div>
      {!model && scope === 'source' && <InitialReadState label={tx("Danh mục SKU")} loading={refreshing} error={snapshot.error} blocked={Boolean(snapshot.blocker)} onRetry={retryInitialRead} />}
      {model && <>
        <p className="sku-data-scope">{tx('Số liệu nguồn')}</p>
        <CatalogueSummary label={tx('Số liệu nguồn')}><SummaryMetric label={tx("Tổng số SKU")} value={model.summary.skusTotal.toLocaleString(locale)} detail="SKU" icon="tag"/><SummaryMetric label={tx("Đang hoạt động")} value={model.summary.active.toLocaleString(locale)} detail={formatDeclaredPercentage(model.summary.activePercentage, language)}/><SummaryMetric label={tx("Ngừng sử dụng")} value={model.summary.inactive.toLocaleString(locale)} detail={formatDeclaredPercentage(model.summary.inactivePercentage, language)}/></CatalogueSummary>
        <div hidden={scope !== 'source'} data-catalog-scope="source"><section className="sku-panel sku-list hn-premium-panel" aria-labelledby="sku-list-title">
          <CatalogueListHeader id="sku-list-title" title={tx("Danh sách SKU")} count={`${model.pagination.total?.toLocaleString(locale)} SKU`} />
          <p className="sku-data-scope">{tx(model.source.provenance === 'QA_SYNTHETIC' ? 'Danh sách gồm {count} SKU kiểm thử; thống kê phía trên thuộc toàn danh mục.' : 'Danh sách gồm {count} SKU nguồn; thống kê phía trên thuộc toàn danh mục.', { count: model.pagination.unfilteredTotal })}</p>
          <CatalogueToolbar id="sku" label={tx("Bộ lọc SKU")} searchLabel={tx("Tìm mã SKU hoặc tên sản phẩm")} searchHint={tx("Tìm theo chuỗi con, không phân biệt dấu hoặc hoa/thường")} searchValue={controls.search} onSearchChange={search => changeQuery({search})} onReset={reset} onRefresh={refresh} busy={refreshing} applyMode="immediate" acceptedLabel={acceptedLabel}>
            <FilterSelect id="sku-group-filter" label={tx("Nhóm hàng")} aria-label={tx("Nhóm hàng")} value={controls.group} onChange={event => changeQuery({ group: event.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.groups.map(group => <option key={group} value={group}>{group}</option>)}</FilterSelect>
            <FilterSelect id="sku-status-filter" label={tx("Trạng thái")} aria-label={tx("Trạng thái")} value={controls.status} onChange={event => changeQuery({ status: event.target.value as SkusQuery['status'] })}><option value="all">{tx("Tất cả")}</option><option value="active">{tx("Đang hoạt động")}</option><option value="inactive">{tx("Ngừng sử dụng")}</option></FilterSelect>
            <FilterSelect id="sku-unit-filter" label={tx("Đơn vị tính")} aria-label={tx("Đơn vị tính")} value={controls.unit} onChange={event => changeQuery({ unit: event.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.units.map(unit => <option key={unit} value={unit}>{unit}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <NoticeSlot name="table" />
          <div className="sku-table" ref={tableRef} aria-busy={refreshing} onFocusCapture={event => revealTableFocus(event.target)}>
            <p id="sku-table-scroll-hint" className="sku-scroll-hint" hidden={!tableOverflows}><span aria-hidden="true">↔</span>{tx("Cuộn ngang để xem đầy đủ các cột")}</p>
            <DataTable caption={tx("Danh sách SKU")} columns={columns} rows={model.rows} rowKey={row => row.key} sort={model.query.sort ? { key: model.query.sortKey, direction: model.query.sort } : null} onSort={key => changeQuery({ sortKey: key as SkusSortKey, sort: controls.sortKey === key && controls.sort === 'asc' ? 'desc' : 'asc' })} busy={refreshing} scrollResetKey={JSON.stringify(model.query)} appearance="refined" stickyEndColumnIds={['action']} emptyStateKind="no-results" emptyContent={<p role="status">{tx("Không tìm thấy SKU phù hợp. Thử thay đổi hoặc đặt lại bộ lọc.")}</p>} />
          </div>
          <Pagination variant="products" unit="SKU" page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => changeQuery({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => changeQuery({ pageSize })} />
          <NoticeSlot name="pagination" />
        </section>
        </div>
      </>}
      <SkuCatalog adapter={catalogAdapter} selectedEntityId={selectedEntityId} visible={scope === 'new'} createOpen={createOpen} origin={createOrigin} onCloseCreate={() => setCreateOpen(false)} onShowCatalog={() => setScope('new')} notify={showFeedback} />
      {detail && <SkuDetail row={resolveSkuDetailRow(model, detail)} origin={detail.origin} onClose={() => setDetail(null)} />}
      {localizedFeedback && <SkuNotice feedback={localizedFeedback} onClose={() => setFeedback(null)} />}
    </div>
  </GlobalShell>;
}
