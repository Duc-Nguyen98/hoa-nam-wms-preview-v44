import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CatalogCreateAdapter, CatalogSku, CatalogSnapshot } from '../../contracts/catalog-create';
import { Button, CatalogueListHeader, CatalogueToolbar, DataTable, FilterSelect, Icon, Pagination, StatusBadge, ordinalColumn, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useShellPreferences } from '../../shared/shell-preferences';
import { SKU_CATALOG_COPY } from './sku-catalog-copy';
import { DEFAULT_SKU_CATALOG_QUERY, formatSkuCatalogTime, queryCatalogSkus, resolveCatalogSku, type SkuCatalogQuery } from './sku-catalog';
import { SkuCreateDialog } from './SkuCreateDialog';
import { SkuCatalogDialog } from './SkuCatalogDialog';
import type { SkuFeedback } from './SkuNotice';
import { OperationalProfilePanel } from './OperationalProfilePanel';
import { createSkuSelectionReader } from './selection-lifecycle';

export function SkuCatalog({ adapter, selectedEntityId, visible, createOpen, origin, onCloseCreate, onShowCatalog, notify }: {
  adapter: CatalogCreateAdapter<'sku'>; visible: boolean; createOpen: boolean; origin: HTMLElement | null;
  selectedEntityId?: string | null;
  onCloseCreate: () => void; onShowCatalog: () => void; notify: (message: string, tone?: SkuFeedback['tone']) => void;
}) {
  const tx = useUiCopy(SKU_CATALOG_COPY);
  const { language } = useShellPreferences();
  // Route changes update selection without remounting Create or its recovery state.
  const reader = useMemo(() => createSkuSelectionReader(adapter), [adapter]);
  const selection = useSyncExternalStore(reader.subscribe, reader.getSnapshot);
  const route = selectedEntityId ?? null;
  const current = selection.route === route && visible && !createOpen;
  const snapshot = current ? selection.snapshot : null;
  const { busy, error } = selection;
  const [query, setQuery] = useState<SkuCatalogQuery>({ ...DEFAULT_SKU_CATALOG_QUERY });
  const [presentation, setPresentation] = useState<{ id: string; origin: HTMLElement | null; product: boolean } | null>(null);
  const detail = current && selection.detailId !== null
    ? { id: selection.detailId, origin: presentation?.id === selection.detailId ? presentation.origin : null,
      product: presentation?.id === selection.detailId && presentation.product }
    : null;
  const latestRead = useRef<(() => Promise<void>) | null>(null);
  async function read(showNotice = false) {
    if (await reader.refresh() && showNotice) notify('Đã cập nhật danh sách SKU.', 'success');
  }
  latestRead.current = () => read();
  useLayoutEffect(() => { reader.configure(route, visible, createOpen); }, [reader, route, visible, createOpen]);
  useEffect(() => () => reader.invalidate(), [reader]);
  useEffect(() => {
    if (!visible || createOpen) return;
    reader.resume();
    const refresh = () => { if (document.visibilityState === 'visible') void latestRead.current?.(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [reader, visible, createOpen]);
  function closeDetail() { reader.dismiss(); setPresentation(null); }
  const model = useMemo(() => queryCatalogSkus(snapshot?.skus ?? [], query), [snapshot, query]);
  const resolved = detail ? resolveCatalogSku(snapshot, detail.id) : { sku: null, product: null };
  function update(patch: Partial<SkuCatalogQuery>) { setQuery(previous => ({ ...previous, page: 1, ...patch })); }
  function unavailable() { reader.unavailable(); }
  function accepted(next: CatalogSnapshot, id: string) {
    reader.acceptCreated(next, id);
    setQuery({ ...DEFAULT_SKU_CATALOG_QUERY });
    onCloseCreate(); onShowCatalog();
    setPresentation({ id, origin, product: false });
    notify('Đã tạo SKU.', 'success');
  }
  const status = (value: 'active' | 'inactive') => <StatusBadge tone={value === 'active' ? 'success' : 'neutral'}>{tx(value === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng')}</StatusBadge>;
  const columns: TableColumn<CatalogSku>[] = [
    ordinalColumn(model.page, query.pageSize),
    { id: 'sku', heading: tx('SKU / Sản phẩm'), render: row => <span className="sku-product-copy"><strong className="sku-code">{row.code}</strong><span className="sku-name">{row.name}</span></span> },
    { id: 'group', heading: tx('Nhóm hàng'), render: row => row.group },
    { id: 'unit', heading: tx('ĐVT'), render: row => row.unit },
    { id: 'barcode', heading: tx('Mã vạch'), render: row => <span className="sku-barcode">{row.barcode ?? '—'}</span> },
    { id: 'status', heading: tx('Trạng thái'), render: row => status(row.status) },
    { id: 'updated', heading: tx('Ngày tạo'), render: row => formatSkuCatalogTime(row.createdAt, language) },
    { id: 'action', heading: tx('Thao tác'), kind: 'actions', render: row => <Button variant="secondary" className="sku-view" aria-haspopup="dialog" aria-label={tx('Xem {code}', { code: row.code })} onClick={event => { reader.open(row.id); setPresentation({ id: row.id, origin: event.currentTarget, product: false }); }}><Icon name="eye" width={18} height={18} />{tx('Xem')}</Button> },
  ];
  return <>
    <div hidden={!visible} data-catalog-scope="new">
      {!snapshot && <section className="sku-panel hn-premium-panel"><p role={error ? 'alert' : 'status'}>{tx(error ? 'Chưa thể đọc dữ liệu. Vui lòng thử lại.' : 'Đang đọc dữ liệu…')}</p><Button variant="secondary" disabled={busy} onClick={() => void read()}>{tx('Đọc lại dữ liệu')}</Button></section>}
      {snapshot && <section className="sku-panel sku-list hn-premium-panel" aria-labelledby="sku-catalog-list-title">
        <CatalogueListHeader id="sku-catalog-list-title" title={tx('Hồ sơ tạo mới')} count={tx('{total} hồ sơ mới · {filtered} đang lọc', { total: model.total, filtered: model.filteredTotal })} />
        <CatalogueToolbar id="sku-catalog" label={tx('Bộ lọc SKU')} searchLabel={tx('Tìm mã SKU hoặc tên sản phẩm')} searchHint={tx('Tìm theo chuỗi con, không phân biệt dấu hoặc hoa/thường')} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => setQuery({ ...DEFAULT_SKU_CATALOG_QUERY })} onRefresh={() => void read(true)} busy={busy} applyMode="immediate" acceptedLabel={[query.search, query.group !== 'all' && query.group, query.unit !== 'all' && query.unit, query.status !== 'all' && tx(query.status === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng')].filter(Boolean).join(' · ') || tx('Tất cả')}>
          <FilterSelect id="sku-catalog-group" label={tx('Nhóm hàng')} value={query.group} onChange={event => update({ group: event.target.value })}><option value="all">{tx('Tất cả')}</option>{model.groups.map(group => <option key={group}>{group}</option>)}</FilterSelect>
          <FilterSelect id="sku-catalog-status" label={tx('Trạng thái')} value={query.status} onChange={event => update({ status: event.target.value as SkuCatalogQuery['status'] })}><option value="all">{tx('Tất cả')}</option><option value="active">{tx('Đang hoạt động')}</option><option value="inactive">{tx('Ngừng sử dụng')}</option></FilterSelect>
          <FilterSelect id="sku-catalog-unit" label={tx('Đơn vị tính')} value={query.unit} onChange={event => update({ unit: event.target.value })}><option value="all">{tx('Tất cả')}</option>{model.units.map(unit => <option key={unit}>{unit}</option>)}</FilterSelect>
          <FilterSelect id="sku-catalog-order" label={tx('Sắp xếp')} value={query.order} onChange={event => update({ order: event.target.value as SkuCatalogQuery['order'] })}>{(['newest', 'oldest', 'codeAsc', 'codeDesc'] as const).map((order, i) => <option key={order} value={order}>{tx(['Mới nhất trước', 'Cũ nhất trước', 'Mã tăng dần', 'Mã giảm dần'][i])}</option>)}</FilterSelect>
        </CatalogueToolbar>
        <div className="sku-table" aria-busy={busy}><DataTable caption={tx('Hồ sơ tạo mới')} columns={columns} rows={model.rows} rowKey={row => row.id} appearance="refined" stickyEndColumnIds={['action']} scrollResetKey={JSON.stringify(query)} emptyContent={<p role="status">{tx(model.total ? 'Không tìm thấy SKU phù hợp. Thử thay đổi hoặc đặt lại bộ lọc.' : 'Chưa có SKU mới.')}</p>} /></div>
        <Pagination variant="products" unit="SKU" page={model.page} pageSize={query.pageSize} filteredTotal={model.filteredTotal} displayedCount={model.rows.length} canGoPrevious={model.page > 1} canGoNext={model.page < model.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} />
      </section>}
    </div>
    {createOpen && <SkuCreateDialog adapter={adapter} origin={origin} onClose={onCloseCreate} onAccepted={accepted} onUnavailable={unavailable} />}
    {detail && <SkuCatalogDialog title={detail.product ? 'Chi tiết sản phẩm' : 'Chi tiết SKU'} description={detail.product ? 'Thông tin sản phẩm · Chỉ xem' : 'Thông tin SKU và cấu hình theo dõi'} origin={detail.origin} onClose={closeDetail} footer={<>
      {detail.product && <Button variant="secondary" onClick={() => setPresentation({ ...detail, product: false })}>{tx('Quay lại SKU')}</Button>}
      <Button onClick={closeDetail}>{tx('Đóng')}</Button>
      {!resolved.sku && <Button variant="secondary" disabled={busy} onClick={() => void read()}>{tx('Đọc lại dữ liệu')}</Button>}
    </>}>
      {busy ? <p role="status">{tx('Đang đọc dữ liệu…')}</p> : error ? <p role="alert">{tx('Chưa thể đọc dữ liệu. Vui lòng thử lại.')}</p>
        : !resolved.sku ? <p role="alert">{tx('Hồ sơ không khả dụng. Đóng và đọc lại dữ liệu.')}</p>
        : detail.product ? !resolved.product ? <p role="alert">{tx('Sản phẩm liên kết không khả dụng. Đóng và đọc lại dữ liệu.')}</p>
          : <dl className="sku-detail__fields" data-linked-product-id={resolved.product.id}>
            {([['Mã sản phẩm', resolved.product.code], ['Tên sản phẩm', resolved.product.name], ['Nhóm hàng', resolved.product.group], ['Đơn vị tính', resolved.product.unit], ['ID', resolved.product.id], ['Phiên bản', resolved.product.version], ['Số SKU liên kết', snapshot!.skus.filter(row => row.productId === resolved.product!.id).length], ['Ngày tạo', formatSkuCatalogTime(resolved.product.createdAt, language)]] as const).map(([label, value]) => <div key={label}><dt>{tx(label)}</dt><dd>{value}</dd></div>)}
            <div><dt>{tx('Trạng thái')}</dt><dd>{status(resolved.product.status)}</dd></div>
          </dl>
        : <><dl className="sku-detail__fields" data-catalog-sku-id={resolved.sku.id}>
            {([['Mã SKU', resolved.sku.code], ['Mã sản phẩm', resolved.product?.code ?? '—'], ['Tên sản phẩm', resolved.product?.name ?? '—'], ['Nhóm hàng', resolved.product?.group ?? '—'], ['Đơn vị tính', resolved.product?.unit ?? '—'], ['Mã vạch', resolved.sku.barcode ?? '—'], ['ID', resolved.sku.id], ['Phiên bản', resolved.sku.version], ['Ngày tạo', formatSkuCatalogTime(resolved.sku.createdAt, language)]] as const).map(([label, value]) => <div key={label}><dt>{tx(label)}</dt><dd>{value}</dd></div>)}
            <div><dt>{tx('Trạng thái')}</dt><dd>{status(resolved.sku.status)}</dd></div>
          </dl>
          {resolved.product ? <Button className="sku-linked-product" variant="secondary" onClick={() => setPresentation({ ...detail, product: true })}>{tx('Xem sản phẩm')}</Button> : <p role="alert">{tx('Sản phẩm liên kết không khả dụng. Đóng và đọc lại dữ liệu.')}</p>}
          <OperationalProfilePanel key={resolved.sku.id} skuId={resolved.sku.id} catalogAdapter={adapter} onCatalogRead={next => reader.acceptProfile(next, resolved.sku!.id, snapshot)} notify={notify} />
        </>}
    </SkuCatalogDialog>}
  </>;
}
