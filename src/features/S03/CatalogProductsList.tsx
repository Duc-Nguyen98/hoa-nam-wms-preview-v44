import { useEffect, useMemo, useState } from 'react';
import { PRODUCT_GROUPS, PRODUCT_UNITS, type CatalogProduct, type CatalogSnapshot } from '../../contracts/catalog-create';
import { updateProductsQuery, type ProductsQuery, type ProductSortKey } from '../../contracts/products';
import { Button, CatalogueListHeader, CatalogueToolbar, DataTable, FilterSelect, Icon, Pagination, StatusBadge, ordinalColumn, type TableColumn } from '../../shared';
import { PAGE_SIZE_OPTIONS } from '../../shared/table-query';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useShellPreferences } from '../../shared/shell-preferences';
import { PRODUCT_CATALOG_COPY } from './catalog-copy';
import { NEW_PRODUCTS_QUERY, queryCatalogProducts, formatCatalogTimestamp } from './catalog-products';

export function CatalogProductsList({ snapshot, busy, error, resetToken, onRefresh, onView, onReset }: {
  snapshot: CatalogSnapshot | null; busy: boolean; error: boolean; resetToken: number;
  onRefresh: () => void; onView: (id: string, origin: HTMLElement) => void; onReset: () => void;
}) {
  const tx = useUiCopy(PRODUCT_CATALOG_COPY);
  const { language } = useShellPreferences();
  const [query, setQuery] = useState<ProductsQuery>({ ...NEW_PRODUCTS_QUERY });
  useEffect(() => { setQuery({ ...NEW_PRODUCTS_QUERY }); }, [resetToken]);
  const model = useMemo(() => queryCatalogProducts(snapshot?.products ?? [], query), [snapshot, query]);
  function change(patch: Partial<ProductsQuery>) { setQuery(current => updateProductsQuery(current, patch)); }
  const columns: TableColumn<CatalogProduct>[] = [
    ordinalColumn(model.page, query.pageSize),
    { id: 'product', heading: tx('Sản phẩm'), sortKey: 'name', sortLabel: tx('Tên sản phẩm'), render: row => <span className="pr-product-copy"><strong className="pr-product-name">{row.name}</strong><span className="pr-product-code">{row.code}</span></span> },
    { id: 'group', heading: tx('Nhóm hàng'), sortKey: 'group', render: row => row.group },
    { id: 'sku', heading: tx('Số SKU'), sortKey: 'skuCount', sortType: 'number', align: 'end', render: row => row.skuCount },
    { id: 'unit', heading: tx('ĐVT'), sortKey: 'unit', render: row => row.unit },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.status === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng')}</StatusBadge> },
    { id: 'updated', heading: tx('Cập nhật'), sortKey: 'updatedAt', sortType: 'date', render: row => <span className="pr-updated">{formatCatalogTimestamp(row.updatedAt, language)}</span> },
    { id: 'action', kind: 'actions', heading: tx('Thao tác'), render: row => <Button variant="ghost" className="pr-view" aria-label={tx('Xem {code}', { code: row.code })} aria-haspopup="dialog" onClick={event => onView(row.id, event.currentTarget)}><Icon name="eye" width={18} height={18} />{tx('Xem')}</Button> },
  ];
  return <section className="pr-panel pr-list hn-premium-panel" aria-labelledby="pr-new-list-title" data-catalog-cohort="product">
    <CatalogueListHeader id="pr-new-list-title" title={tx('Hồ sơ tạo mới')} count={`${snapshot?.products.length ?? 0} ${tx('sản phẩm')}`} />
    <CatalogueToolbar id="pr-new" label={tx('Bộ lọc sản phẩm')} searchLabel={tx('Tìm mã hoặc tên sản phẩm')} searchHint={tx('Theo mã hoặc tên, không phân biệt dấu')} searchValue={query.search} onSearchChange={search => change({ search })}
      onReset={() => { setQuery({ ...NEW_PRODUCTS_QUERY }); onReset(); }} onRefresh={onRefresh} busy={busy} applyMode="immediate" acceptedLabel={`${model.total} / ${snapshot?.products.length ?? 0} ${tx('sản phẩm')}`}>
      <FilterSelect id="pr-new-group-filter" label={tx('Nhóm hàng')} value={query.group} onChange={event => change({ group: event.target.value })}><option value="all">{tx('Tất cả')}</option>{PRODUCT_GROUPS.map(value => <option key={value}>{value}</option>)}</FilterSelect>
      <FilterSelect id="pr-new-status-filter" label={tx('Trạng thái')} value={query.status} onChange={event => change({ status: event.target.value as ProductsQuery['status'] })}><option value="all">{tx('Tất cả')}</option><option value="active">{tx('Đang hoạt động')}</option><option value="inactive">{tx('Ngừng sử dụng')}</option></FilterSelect>
      <FilterSelect id="pr-new-unit-filter" label={tx('Đơn vị tính')} value={query.unit} onChange={event => change({ unit: event.target.value })}><option value="all">{tx('Tất cả')}</option>{PRODUCT_UNITS.map(value => <option key={value}>{value}</option>)}</FilterSelect>
    </CatalogueToolbar>
    {error ? <p role="alert">{tx('Chưa thể đọc hồ sơ tạo mới. Vui lòng thử lại.')} <Button variant="secondary" onClick={onRefresh} disabled={busy}>{tx('Thử lại')}</Button></p>
      : !snapshot ? <p role="status">{tx('Đang đọc hồ sơ…')}</p> : <>
        <div className="pr-table" aria-busy={busy}><DataTable appearance="refined" stickyHeader stickyEndColumnIds={['action']} caption={tx('Hồ sơ tạo mới')} rows={model.rows} columns={columns} rowKey={row => row.id}
          sort={query.sortKey && query.sort ? { key: query.sortKey, direction: query.sort } : null}
          onSort={key => change({ sortKey: key as ProductSortKey, sort: query.sortKey === key && query.sort === 'asc' ? 'desc' : 'asc' })}
          busy={busy} scrollResetKey={JSON.stringify(query)} emptyStateKind={snapshot.products.length ? "no-results" : "empty"} onResetFilters={snapshot.products.length ? ()=>{setQuery({...NEW_PRODUCTS_QUERY});onReset();} : undefined} emptyContent={<p role="status">{tx(snapshot.products.length ? 'Không tìm thấy sản phẩm phù hợp. Hãy đổi điều kiện hoặc đặt lại bộ lọc.' : 'Chưa có hồ sơ tạo mới.')}</p>} /></div>
        <Pagination variant="products" unit={tx('sản phẩm')} page={model.page} pageSize={query.pageSize} filteredTotal={model.total} displayedCount={model.rows.length} canGoPrevious={model.page > 1} canGoNext={model.page < model.pageCount} onPageChange={page => change({ page })} pageSizeOptions={PAGE_SIZE_OPTIONS} onPageSizeChange={pageSize => change({ pageSize })} />
      </>}
  </section>;
}
