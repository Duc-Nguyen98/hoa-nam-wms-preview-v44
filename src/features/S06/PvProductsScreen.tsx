import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_PV_QUERY, PV_SORT_KEYS, updatePvQuery, type PvDataAdapter, type PvModel, type PvSortKey, type PvProduct, type PvQuery } from '../../contracts/pv-products';
import { createPvProductsController } from '../../controllers/pv-products-controller';
import { recordReviewDiagnostic, recordUnresolvedAction } from '../../app/review-diagnostics';
import { BasicSelect, Button, CatalogueListHeader, CatalogueSummary, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, InitialReadState, NoticeSlot, Pagination, StatusBadge, SummaryMetric, ordinalColumn, type TableColumn } from '../../shared';
import { Notice, type NoticeFeedback } from '../../shared/Notice';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { PvRowAction } from './PvRowAction';
import { PvProductDetail, PV_DETAIL_COPY } from './PvProductDetail';
import { resolvePvDetail } from './PvDetailSelection';
import { PvDemoCatalogue } from './PvDemoCatalogue';
import { PV_DEMO_COPY } from './pv-demo-copy';
import { revealControl } from '../../shared/focus';
import './pv-products.css';
import { useUiCopy } from '../../i18n/use-ui-copy';


const sortLabels: Record<PvSortKey, string> = { product: 'Tên sản phẩm', productCode: 'Mã sản phẩm', sku: 'SKU', group: 'Nhóm sản phẩm', visibility: 'Hiển thị', updated: 'Cập nhật' };
type ReadAction = 'initial' | 'filter' | 'reset' | 'sort' | 'page' | 'refresh';

export function PvProductsScreen({ adapter }: { adapter?: PvDataAdapter } = {}) {
  const tx = useUiCopy({ ...PV_DETAIL_COPY, ...PV_DEMO_COPY });
  const [catalogueMode, setCatalogueMode] = useState<'source' | 'demo'>('source');
  const [demoBlocked, setDemoBlocked] = useState(false);
  const controller = useMemo(() => createPvProductsController(adapter), [adapter]);
  const [model, setModel] = useState<PvModel | null>(null);
  const [controls, setControls] = useState({ ...DEFAULT_PV_QUERY });
  const queryRef = useRef({ ...DEFAULT_PV_QUERY });
  const accepted = useRef<PvModel | null>(null);
  const [request, setRequest] = useState({ query: { ...DEFAULT_PV_QUERY }, action: 'initial' as ReadAction, sequence: 0, origin: null as HTMLElement | null });
  const requestSequence = useRef(0);
  const [busy, setBusy] = useState(true);
  const [initialIssue, setInitialIssue] = useState<{ error?: unknown; blocked?: boolean }>({});
  const [feedback, setFeedback] = useState<NoticeFeedback | null>(null);
  const localizedFeedback = useMemo(() => feedback && { ...feedback, message: tx(feedback.message) }, [feedback, tx]);
  const feedbackSequence = useRef(0);
  const screenRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<{ key: string; origin: HTMLElement } | null>(null);
  const [tableScroll, setTableScroll] = useState({ overflow: false, start: true, end: true });
  const showFeedback = useCallback((message: string, tone: NoticeFeedback['tone'] = 'info', origin = document.activeElement instanceof HTMLElement ? document.activeElement : null) => {
    setFeedback({ message, tone, sequence: ++feedbackSequence.current, container: document.body, origin });
  }, []);
  const demoFeedback = useCallback((message: string) => showFeedback(message, 'success'), [showFeedback]);

  useEffect(() => () => controller.clear(), [controller]);

  useEffect(() => {
    let cancelled = false;
    const current = () => !cancelled && request.sequence === requestSequence.current;
    setBusy(true);
    void controller.load(request.query).then(result => {
      if (!current() || controller.getSnapshot() !== result) return;
      if (result.kind === 'ready') {
        accepted.current = result.model;
        setModel(result.model);
        setInitialIssue({});
        if (request.action === 'reset') showFeedback('Đã đặt lại bộ lọc sản phẩm PV.', 'success', request.origin);
        if (request.action === 'refresh') showFeedback('Đã làm mới danh sách sản phẩm PV.', 'success', request.origin);
      } else {
        if (accepted.current) { queryRef.current = accepted.current.query; setControls(accepted.current.query); }
        else setInitialIssue({ blocked: true });
        recordReviewDiagnostic({ kind: 'blocked-query', key: `S06:${result.reason}`, detail: result.detail });
        if (accepted.current) showFeedback('Lựa chọn này chưa khả dụng trong bản xem trước. Danh sách đang hiển thị được giữ nguyên.', 'info', request.origin);
      }
    }).catch(error => {
      if (!current()) return;
      if (accepted.current) { queryRef.current = accepted.current.query; setControls(accepted.current.query); }
      else setInitialIssue({ error });
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S06_READ', detail: String(error) });
      if (accepted.current) showFeedback('Chưa thể đọc danh sách. Vui lòng thử lại.', 'error', request.origin);
    }).finally(() => {
      if (current()) setBusy(false);
    });
    return () => { cancelled = true; };
  }, [controller, request, showFeedback]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const measure = () => {
      const region = screen.querySelector<HTMLElement>('.hn-table-scroll');
      const extent = region ? region.scrollWidth - region.clientWidth : 0;
      const next = { overflow: extent > 1, start: !region || region.scrollLeft <= 1, end: !region || region.scrollLeft >= extent - 1 };
      if (!next.overflow && document.activeElement?.closest('.pv-table-navigation')) (region?.querySelector<HTMLElement>('thead button') ?? region)?.focus({ preventScroll: true });
      setTableScroll(current => current.overflow === next.overflow && current.start === next.start && current.end === next.end ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    const table = screen.querySelector('table');
    if (table) observer.observe(table);
    const region = screen.querySelector('.hn-table-scroll');
    if (region) { observer.observe(region); region.addEventListener('scroll', measure, { passive: true }); }
    measure();
    return () => { observer.disconnect(); region?.removeEventListener('scroll', measure); };
  }, [model]);

  useLayoutEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    let frame: number | null = null;
    const reveal = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const active = document.activeElement;
        // DataTable owns focus inside its scrollport; preserve focus for the
        // surrounding controls when the toolbar wraps or the viewport shrinks.
        if (active instanceof HTMLElement && screen.contains(active) &&
          !active.closest('.hn-table-scroll') && !document.querySelector('dialog[open],.hn-header-popup')) revealControl(active);
      });
    };
    const observer = new ResizeObserver(reveal);
    observer.observe(screen);
    screen.addEventListener('focusin', reveal);
    window.addEventListener('resize', reveal);
    return () => {
      observer.disconnect();
      screen.removeEventListener('focusin', reveal);
      window.removeEventListener('resize', reveal);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  function read(query: PvQuery, action: ReadAction) {
    const sequence = ++requestSequence.current;
    setBusy(true);
    setInitialIssue({});
    setFeedback(null);
    queryRef.current = query;
    setControls(query);
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRequest({ query, action, sequence, origin });
  }
  function patch(change: Partial<PvQuery>, action: ReadAction = 'filter') { read(updatePvQuery(queryRef.current, change), action); }
  function unavailable(key: string, message: string) { recordUnresolvedAction(`S06:${key}`); showFeedback(message); }
  function openDetail(row: PvProduct) {
    const origin = document.activeElement;
    if (!(origin instanceof HTMLElement)) return;
    if (!resolvePvDetail(model, row.key)) {
      showFeedback('Không có thông tin sản phẩm trong danh sách hiện tại.');
      return;
    }
    setFeedback(null);
    setDetail({ key: row.key, origin });
  }
  function reset() { read({ ...DEFAULT_PV_QUERY }, 'reset'); }
  const tableSort = { key: model?.query.sortKey ?? 'updated', direction: model?.query.sort ?? 'desc' };
  function chooseSort(value: string) {
    const [sortKey, direction] = value.split('-');
    patch({ sortKey: sortKey as PvSortKey, sort: direction as PvQuery['sort'] }, 'sort');
  }
  function sort(key: string) {
    const direction = tableSort.key === key && tableSort.direction === 'asc' ? 'desc' : 'asc';
    patch({ sortKey: key as PvSortKey, sort: direction }, 'sort');
  }
  function scrollTable(direction: -1 | 1) {
    const region = screenRef.current?.querySelector('.hn-table-scroll');
    if (region) region.scrollBy({ left: direction * Math.max(160, region.clientWidth * .75), behavior: 'instant' });
  }
  const acceptedLabel = model ? [model.query.search && `“${model.query.search}”`, model.query.group !== 'all' && model.query.group, model.query.visibility !== 'all' && tx(model.query.visibility)].filter(Boolean).join(' · ') || tx('Tất cả sản phẩm') : '';
  const codeSortKey: PvSortKey = tableSort.key === 'sku' ? 'sku' : 'productCode';
  const columns: TableColumn<PvProduct>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'product', heading: tx('Sản phẩm'), sortKey: 'product', sortLabel: tx(sortLabels.product), render: row => <div className="pv-product"><span className="pv-thumbnail" role="img" aria-label={tx('Ảnh {name} chưa được cung cấp', { name: row.productName })}><Icon name="image" size={26} /></span><div><strong>{row.productName}</strong>{row.missingImage && <span className="pv-missing-image"><Icon name="info" size={14} />{tx("Chưa có ảnh")}</span>}</div></div> },
    { id: 'codes', heading: tx("Mã sản phẩm / SKU"), sortKey: codeSortKey, sortLabel: tx(sortLabels[codeSortKey]), render: row => <span className="pv-codes"><strong>{row.productCode}</strong><span>{row.sku}</span></span> },
    { id: 'group', heading: tx("Nhóm sản phẩm"), sortKey: 'group', render: row => row.productGroup },
    { id: 'visibility', heading: tx('Hiển thị trên App PV'), sortKey: 'visibility', render: row => row.visibilityLabel === '—' ? <span aria-label={tx("Trạng thái hiển thị chưa xác định")}>—</span> : <StatusBadge tone={row.visibilityLabel === 'Đang hiển thị' ? 'success' : 'neutral'}>{tx(row.visibilityLabel)}</StatusBadge> },
    { id: 'updated', heading: tx("Cập nhật"), sortKey: 'updated', sortType: 'date', render: row => <span className="pv-updated">{row.updatedAtLabel.split(' ').map(part => <span key={part}>{part}</span>)}</span> },
    { id: 'action', heading: tx("Thao tác"), kind: 'actions', render: row => <div className="pv-row-actions"><PvRowAction label={tx("Chi tiết sản phẩm PV")} productCode={row.productCode} icon="eye" onClick={() => openDetail(row)} /><PvRowAction label={tx("Chỉnh sửa")} productCode={row.productCode} icon="edit" onClick={() => unavailable(`edit:${row.key}`, 'Chỉnh sửa sản phẩm PV chưa khả dụng trong bản xem trước.')} /><PvRowAction label={tx("Thao tác khác")} productCode={row.productCode} icon="more" onClick={() => unavailable(`menu:${row.key}`, 'Menu thao tác sản phẩm PV chưa khả dụng trong bản xem trước.')} /></div> },
  ];

  return <GlobalShell title={tx("Quản lý sản phẩm PV")} variant="wms" activeKey="S06" navigation={S00_SHELL_NAVIGATION} profile={model?.profile}>
    <div ref={screenRef} className="pv-screen hn-catalogue-screen" data-screen="S06" data-visual-variant="premium">
      <div className="pv-demo-mode" role="group" aria-label={tx('Catalog PV Demo')}>
        <label><input type="radio" name="pv-catalogue-mode" checked={catalogueMode === 'source'} disabled={demoBlocked}
          onChange={() => setCatalogueMode('source')} />{tx('Danh mục nguồn')}</label>
        <label><input type="radio" name="pv-catalogue-mode" checked={catalogueMode === 'demo'} disabled={!!detail}
          onChange={() => setCatalogueMode('demo')} />{tx('Catalog PV Demo')}</label>
      </div>
      {catalogueMode === 'demo' && <PvDemoCatalogue onBlockedChange={setDemoBlocked} onFeedback={demoFeedback} />}
      <div className="pv-source-catalogue" hidden={catalogueMode !== 'source'}>
      <header className="hn-page-heading">
        <div><p className="hn-breadcrumb">{tx("Quản lý mã SKU")}{' '}<span>/</span>{' '}{tx("Sản phẩm trên App PV")}</p><div className="pv-title-line"><h1>{tx("Quản lý sản phẩm PV")}</h1><span className="hn-page-warehouse"><Icon name="warehouse" size={16} />{tx("Kho Hoa Nam")}</span></div></div>
        <div className="hn-page-actions"><Button variant="ghost" onClick={() => unavailable('preview-app', 'Xem trước App PV chưa khả dụng trong bản xem trước.')}><Icon name="eye" />{tx("Xem trước App PV")}</Button><Button onClick={() => unavailable('add', 'Thêm sản phẩm PV chưa khả dụng trong bản xem trước.')}><Icon name="plus" />{tx("Thêm sản phẩm")}</Button></div>
        <NoticeSlot name="heading" />
      </header>
      {!model && <InitialReadState label={tx("Quản lý sản phẩm PV")} loading={busy} error={initialIssue.error} blocked={initialIssue.blocked} onRetry={() => read(accepted.current?.query ?? queryRef.current, 'initial')} />}
      {model && <>
        <section className="pv-overview" aria-labelledby="pv-overview-title">
          <h2 id="pv-overview-title" className="hn-sr-only">{tx("Tổng quan danh mục")}</h2>
          <CatalogueSummary label={tx("Thống kê toàn danh mục sản phẩm PV")}><SummaryMetric label={tx("Tổng sản phẩm")} value={model.summary.total} icon="box" /><SummaryMetric label={tx("Đang hiển thị")} value={model.summary.visible} icon="eye" /><SummaryMetric label={tx("Đang ẩn")} value={model.summary.hidden} icon="eye-off" /><SummaryMetric label={tx("Chưa có ảnh")} value={model.summary.missingImage} icon="image" /></CatalogueSummary>
          <p className="pv-stock-note"><Icon name="info" />{tx("Trạng thái hiển thị trên App PV không làm thay đổi số lượng tồn kho.")}</p>
        </section>
        <section className="pv-list" aria-labelledby="pv-list-title">
          <div className="pv-list-heading"><CatalogueListHeader id="pv-list-title" title={tx("Danh sách sản phẩm")} count={`${model.pagination.total} ${tx('sản phẩm')}`} /><label className="pv-page-sort"><span>{tx("Sắp xếp")}</span><BasicSelect aria-label={tx("Sắp xếp kết quả")} value={`${model.query.sortKey}-${model.query.sort}`} onChange={event => chooseSort(event.target.value)}>{PV_SORT_KEYS.map(key => ['asc', 'desc'].map(direction => <option key={`${key}-${direction}`} value={`${key}-${direction}`}>{tx(sortLabels[key])}: {tx(key === 'updated' ? direction === 'asc' ? 'Cũ → mới' : 'Mới → cũ' : direction === 'asc' ? 'A → Z' : 'Z → A')}</option>))}</BasicSelect></label></div>
          <p className="pv-source-scope">{tx(model.scope.kind === 'qa-synthetic' ? 'Phạm vi kiểm thử: {count} hồ sơ tổng hợp.' : 'Phạm vi danh sách: {count} hồ sơ có nguồn.', { count: model.scope.total })}{' '}{tx('Thống kê phía trên là toàn danh mục.')}</p>
          <CatalogueToolbar id="pv" label={tx("Bộ lọc sản phẩm PV")} searchLabel={tx("Tìm kiếm")} searchHint={tx("Tên sản phẩm, mã sản phẩm hoặc SKU")} searchValue={controls.search} onSearchChange={search => patch({ search })} onReset={reset} onRefresh={() => read(model.query, 'refresh')} applyMode="immediate" acceptedLabel={acceptedLabel} busy={busy}>
            <FilterSelect label={tx("Nhóm sản phẩm")} aria-label={tx("Nhóm sản phẩm")} value={controls.group} onChange={event => patch({ group: event.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.groups.map(group => <option key={group} value={group}>{group}</option>)}</FilterSelect>
            <FilterSelect label={tx("Trạng thái hiển thị")} aria-label={tx("Trạng thái hiển thị")} value={controls.visibility} onChange={event => patch({ visibility: event.target.value })}><option value="all">{tx("Tất cả")}</option>{model.filterOptions.visibility.map(value => <option key={value} value={value}>{tx(value === '—' ? 'Chưa xác định (—)' : value)}</option>)}</FilterSelect>
          </CatalogueToolbar>
          <NoticeSlot name="table" />
          {tableScroll.overflow && <div className="pv-table-navigation"><p className="hn-scroll-hint">{tx("Cuộn ngang để xem đầy đủ các cột.")}</p><div><Button variant="ghost" title={tx("Cuộn bảng sang trái")} aria-label={tx("Cuộn bảng sang trái")} aria-controls="pv-table-region" aria-disabled={tableScroll.start} onClick={() => scrollTable(-1)}><Icon name="chevron-left" /></Button><Button variant="ghost" title={tx("Cuộn bảng sang phải")} aria-label={tx("Cuộn bảng sang phải")} aria-controls="pv-table-region" aria-disabled={tableScroll.end} onClick={() => scrollTable(1)}><Icon name="chevron-right" /></Button></div></div>}
          <div className="pv-table" id="pv-table-region"><DataTable appearance="refined" stickyHeader captionVisibility="sr-only" caption={tx("Danh sách sản phẩm PV")} columns={columns} rows={model.rows} rowKey={row => row.key} sort={tableSort} onSort={sort} busy={busy} scrollResetKey={JSON.stringify(model.query)} emptyStateKind="no-results" onResetFilters={reset} emptyContent={<p role="status">{tx("Không có sản phẩm phù hợp.")}</p>} /></div>
          <Pagination variant="products" unit={tx("sản phẩm")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => patch({ page }, 'page')} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => patch({ pageSize }, 'page')} />
          <NoticeSlot name="pagination" />
        </section>
      </>}
      {detail && <PvProductDetail row={resolvePvDetail(model, detail.key)} origin={detail.origin} onClose={() => setDetail(null)} />}
      </div>
      {localizedFeedback && <Notice feedback={localizedFeedback} onClose={() => setFeedback(null)} protectedContentSelector=".pv-overview, .pv-table, .pv-list-heading, .pv-source-scope, .pv-screen .hn-query-context, .pv-table-navigation, .pv-screen .hn-page-heading, .pv-screen .hn-pagination__range" />}
    </div>
  </GlobalShell>;
}
