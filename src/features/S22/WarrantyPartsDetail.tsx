import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useReportCopy } from '../../i18n/reports-copy';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createWarrantyPartsDetailController } from '../../controllers/warranty-parts-detail-controller';
import { DEFAULT_WARRANTY_DETAIL_QUERY as defaults, type WarrantyDetailAdapter, type WarrantyDetailQuery, type WarrantyDetailRow, type WarrantyDetailSortKey } from '../../contracts/warranty-parts-detail';

import { Button, CatalogueActiveFilters, CatalogueListHeader, CatalogueToolbar, DataTable, FilterSelect, Icon, PageState, Pagination, ReportEmptyState, StatusBadge, getReportEmptyReason, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { revealControl } from '../../shared/focus';

type Props = {
  adapter?: WarrantyDetailAdapter;
  notify: (message: string, origin: HTMLElement | null, tone?: NoticeFeedback['tone']) => void;
  clearNotice: () => void;
};
export function WarrantyPartsDetail({ adapter, notify, clearNotice }: Props) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const controller = useMemo(() => createWarrantyPartsDetailController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults, pending = state.loading || state.debouncing;
  const list = useRef<HTMLElement>(null), intent = useRef(0);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    void controller.load(structuredClone(defaults));
    return () => { ++intent.current; controller.clear(); };
  }, [controller]);
  useLayoutEffect(() => {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => {
      const next = { left: region.scrollLeft > 1, right: region.scrollWidth - region.clientWidth - region.scrollLeft > 1 };
      if (!next.left && !next.right && document.activeElement?.closest('.s22-scroll-tools')) {
        region.focus({ preventScroll: true }); revealControl(region);
      }
      setEdges(old => old.left === next.left && old.right === next.right ? old : next);
    };
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    region.addEventListener('scroll', measure, { passive: true });
    return () => { observer.disconnect(); region.removeEventListener('scroll', measure); };
  }, [Boolean(model)]);
  function run(operation: () => ReturnType<typeof controller.load>) {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const token = ++intent.current; clearNotice();
    void operation().then(outcome => {
      if (token !== intent.current || outcome.kind === 'superseded') return;
      if (outcome.kind === 'error') notify('Chưa thể đọc bảng chi tiết. Dữ liệu và điều kiện đã áp dụng được giữ nguyên.', origin, 'error');
      else if (outcome.result.kind === 'blocked') notify('Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.', origin);
    });
  }
  const update = (patch: Partial<WarrantyDetailQuery>) => run(() => controller.update(patch));
  function scrollTable(direction: -1 | 1) {
    const region = list.current?.querySelector<HTMLElement>('.hn-table-scroll');
    region?.scrollBy({ left: direction * Math.max(160, region.clientWidth * .65), behavior: 'instant' });
  }
  const columns: TableColumn<WarrantyDetailRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'ticket', heading: tx('Mã phiếu / Serial'), render: row => <div className="s22-cell-pair"><strong>{row.ticketCode}</strong><span>{row.serial}</span></div> },
    { id: 'product', heading: tx('SKU / Sản phẩm'), render: row => <div className="s22-cell-pair"><strong>{row.sku}</strong><span>{row.productName}</span></div> },
    { id: 'component', heading: tx('Linh kiện'), sortKey: 'component', render: row => row.component },
    { id: 'receivedDate', heading: tx('Ngày tiếp nhận'), sortKey: 'receivedDate', sortType: 'date', render: row => formatBusinessDate(row.receivedDate, language) },
    { id: 'dueDate', heading: tx('Hạn xử lý'), sortKey: 'dueDate', sortType: 'date', render: row => formatBusinessDate(row.dueDate, language) },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'Hoàn tất' ? 'success' : row.status === 'Đang xử lý' ? 'warning' : 'neutral'}>{tx(row.status)}</StatusBadge> },
    { id: 'detail', heading: tx('Chi tiết'), kind: 'actions', render: row => <Button variant="ghost" aria-label={tx(`Xem phiếu ${row.ticketCode}`)} aria-disabled="true" aria-describedby="s22-detail-action-limit" onClick={event => notify(`Xem phiếu ${row.ticketCode} chưa khả dụng. Chưa có luồng chi tiết được xác nhận.`, event.currentTarget)}>{tx("Xem")}</Button> },
  ];
  const activeFilters = model ? [
    { key: 'search', label: tx(model.query.search.trim() ? `Tìm: ${model.query.search.trim()}` : '') },
    { key: 'status', label: tx(model.query.status) },
  ].filter(item => item.label) : [];
  return <section ref={list} className="s22-list hn-premium-panel" data-source-state="DESKTOP_SELECTED" aria-labelledby="s22-list-title">
    <div className="s22-list-intro"><CatalogueListHeader id="s22-list-title" title={tx("Chi tiết bảo hành linh kiện")} count={tx(model ? `${model.source.detailTotal} phiếu có dữ liệu` : undefined)} density="compact" />
      <p>{tx("Tìm kiếm và trạng thái chỉ lọc bảng chi tiết, không đổi số liệu tổng hợp toàn kỳ.")}</p>
    </div>
    {model ? <>
      <div className="s22-list-toolbar"><CatalogueToolbar id="s22-detail" label={tx("Lọc chi tiết bảo hành linh kiện")} layout="worklist" filterSizing="compact" applyMode="immediate"
        searchLabel={tx("Tìm mã phiếu, Serial, SKU, linh kiện")} searchHint={tx("Tìm chuỗi trong mã phiếu, Serial, SKU hoặc linh kiện; bỏ dấu, chữ hoa và khoảng trắng thừa. Tự tìm sau 250 mili giây.")}
        searchHintMode="sr-only" searchPlaceholder={tx("Mã phiếu, Serial, SKU, linh kiện…")} searchValue={query.search} onSearchChange={search => update({ search })}
        onReset={() => run(() => controller.reset(structuredClone(defaults)))} queryContext={null}>
        <FilterSelect id="s22-detail-status" label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value as WarrantyDetailQuery['status'] })}>
          <option value="">{tx("Tất cả trạng thái")}</option>{model.filterOptions.status.map(status => <option key={status} value={status}>{tx(status)}</option>)}
        </FilterSelect>
      </CatalogueToolbar><div data-s22-notice="detail" /></div>
      <div className="s22-results-meta"><div><p role="status" aria-atomic="true">{tx(pending ? 'Đang cập nhật kết quả… Các dòng hiện tại thuộc điều kiện đã áp dụng.' : `${model.pagination.total} kết quả trong ${model.source.detailTotal} phiếu có dữ liệu chi tiết`)}</p>
        <CatalogueActiveFilters items={activeFilters} onRemove={key => { list.current?.querySelector<HTMLInputElement>('#s22-detail-search')?.focus({ preventScroll: true }); update({ [key]: '' }); }} />
      </div><div className="s22-scroll-tools" hidden={!edges.left && !edges.right}><span>{tx("Cuộn ngang để xem đủ 8 cột")}</span><div role="group" aria-label={tx("Cuộn bảng bảo hành")}>
        <Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang trái")} aria-controls="s22-detail-table" aria-disabled={!edges.left} onClick={() => { if (edges.left) scrollTable(-1); }}><Icon name="chevron-left" size={18} /></Button>
        <Button variant="ghost" iconOnly aria-label={tx("Cuộn bảng sang phải")} aria-controls="s22-detail-table" aria-disabled={!edges.right} onClick={() => { if (edges.right) scrollTable(1); }}><Icon name="chevron-right" size={18} /></Button>
      </div></div></div>
      <div id="s22-detail-table"><DataTable caption={tx("Chi tiết bảo hành linh kiện")} captionVisibility="sr-only" appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet"
        columns={columns} rows={model.rows} rowKey={row => row.ticketCode} busy={pending} stickyHeader
        sort={model.query.sortKey ? { key: model.query.sortKey, direction: model.query.sortDirection } : null}
        onSort={key => update({ sortKey: key as WarrantyDetailSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })}
        scrollResetKey={JSON.stringify(model.query)} emptyContent={<ReportEmptyState reason={getReportEmptyReason(model) ?? 'no-matches'} itemLabel={tx("phiếu")} />} />
      </div>
      <div className="s22-list-footer"><Pagination preserveBoundaryFocus variant="products" unit={tx("phiếu")} page={model.pagination.page} pageSize={model.pagination.pageSize}
        filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount}
        pageSizeOptions={model.pagination.pageSizeOptions} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} />
        <p id="s22-detail-action-limit">{tx("Xem phiếu chưa khả dụng trong bản xem trước.")}</p>
      </div>
    </> : <div className="s22-detail-read"><PageState kind={state.loading || !state.error && !state.blocker ? 'loading' : state.error ? 'error' : 'stale'}
      title={tx(state.error ? 'Chưa thể đọc bảng chi tiết' : state.blocker ? 'Nguồn bảng chi tiết chưa khả dụng' : 'Đang đọc bảng chi tiết…')}
      description={tx(state.error ? 'Chưa có dữ liệu chi tiết để hiển thị. Hãy thử đọc lại.' : state.blocker ? 'Chưa có danh sách phù hợp với điều kiện này.' : 'Đang đọc danh sách phiếu bảo hành trong kỳ.')}
      onRetry={(state.error || state.blocker) && !pending ? () => run(() => controller.load(structuredClone(defaults))) : undefined} /><div data-s22-notice="detail" />
    </div>}
  </section>;
}
