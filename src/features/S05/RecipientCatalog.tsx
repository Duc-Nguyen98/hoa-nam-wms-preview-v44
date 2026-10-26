import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RECIPIENT_MARKETS, RECIPIENT_TYPES, type CatalogCreateAdapter, type CatalogRecipient, type CatalogSnapshot } from '../../contracts/catalog-create';
import { Button, CatalogueListHeader, CatalogueToolbar, DataTable, FilterSelect, Pagination, StatusBadge, ordinalColumn, type TableColumn } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CatalogRecipientDetailDialog } from './CatalogRecipientDetailDialog';
import { RecipientCreateDialog } from './RecipientCreateDialog';
import { defaultRecipientCatalogQuery, queryRecipientCatalog, type RecipientCatalogQuery, type RecipientCatalogSort } from './recipient-catalog';
import { RECIPIENT_CATALOG_COPY } from './recipient-catalog-copy';

export function RecipientCatalog({ adapter, active, creating, onCloseCreate, onCreated, notify }: {
  adapter: CatalogCreateAdapter<'recipient'>;
  active: boolean;
  creating: boolean;
  onCloseCreate: () => void;
  onCreated: () => void;
  notify: (message: string) => void;
}) {
  const tx = useUiCopy(RECIPIENT_CATALOG_COPY);
  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [query, setQuery] = useState<RecipientCatalogQuery>(defaultRecipientCatalogQuery);
  const [loading, setLoading] = useState(false), [error, setError] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const sequence = useRef(0), mounted = useRef(false);
  const acceptedActivation = useRef(false);
  const panel = useRef<HTMLElement>(null), detailOrigin = useRef<HTMLElement | null>(null);
  const view = useMemo(() => queryRecipientCatalog(snapshot?.recipients ?? [], query), [snapshot, query]);
  const detail = snapshot?.recipients.find(row => row.id === detailId) ?? null;

  const read = useCallback(async (refresh = false) => {
    const token = ++sequence.current;
    setLoading(true);
    setError(false);
    try {
      const next = await adapter.readSnapshot();
      if (!mounted.current || token !== sequence.current) return;
      setSnapshot(next);
      if (refresh) notify('Đã cập nhật hồ sơ tạo mới.');
    } catch {
      if (!mounted.current || token !== sequence.current) return;
      setSnapshot(null);
      setDetailId(null);
      setError(true);
    } finally {
      if (mounted.current && token === sequence.current) setLoading(false);
    }
  }, [adapter, notify]);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; ++sequence.current; }; }, []);
  useEffect(() => {
    if (!active) return;
    if (acceptedActivation.current) acceptedActivation.current = false;
    else void read();
  }, [active, read]);
  function change(patch: Partial<RecipientCatalogQuery>) {
    setQuery(value => ({ ...value, ...patch, page: patch.page ?? 1 }));
  }
  function closeDetail() {
    setDetailId(null);
    const origin = detailOrigin.current;
    requestAnimationFrame(() => (origin?.isConnected ? origin : panel.current?.querySelector<HTMLElement>('thead button'))?.focus({ preventScroll: true }));
  }
  function accepted(next: CatalogSnapshot, row: CatalogRecipient) {
    // Invalidate an earlier in-flight list read before installing the receipt's snapshot.
    ++sequence.current;
    setLoading(false);
    setError(false);
    setSnapshot(next);
    setQuery(defaultRecipientCatalogQuery());
    acceptedActivation.current = !active;
    detailOrigin.current = null;
    setDetailId(row.id);
    onCreated();
  }
  const openDetail = (row: CatalogRecipient, origin: HTMLElement) => { detailOrigin.current = origin; setDetailId(row.id); };
  const columns: TableColumn<CatalogRecipient>[] = [
    ordinalColumn(view.page, query.pageSize),
    { id: 'recipient', heading: tx('Nơi nhận'), sortKey: 'name', sortLabel: tx('Tên nơi nhận'), render: row => <button type="button" className="recipient-identity recipient-detail-opener" data-catalog-recipient-id={row.id} data-recipient-code={row.code} aria-label={tx('Xem {code}', { code: row.code })} aria-haspopup="dialog" onClick={event => openDetail(row, event.currentTarget)}><span className="recipient-copy"><strong className="recipient-name">{row.name}</strong><span className="recipient-code">{row.code}</span></span></button> },
    { id: 'type', heading: tx('Loại nơi nhận'), sortKey: 'type', render: row => tx(row.type) },
    { id: 'market', heading: tx('Thị trường / Khu vực'), sortKey: 'market', render: row => <span className="recipient-stack"><span>{tx(row.market)}</span><span>{row.area}</span></span> },
    { id: 'contact', heading: tx('Liên hệ'), sortKey: 'contact', render: row => <span className="recipient-stack"><span>{row.contact || '—'}</span><span className="recipient-phone">{row.phone || '—'}</span></span> },
    { id: 'address', heading: tx('Địa chỉ'), sortKey: 'address', render: row => row.address },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng')}</StatusBadge> },
  ];
  const acceptedLabel = [query.search, query.type !== 'all' && tx(query.type), query.market !== 'all' && tx(query.market), query.status !== 'all' && tx(query.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng')].filter(Boolean).join(' · ') || tx('Tất cả');
  return <>
    <section ref={panel} hidden={!active} className="recipient-panel recipient-list recipient-catalog hn-premium-panel" data-recipient-cohort="new" aria-labelledby="recipient-catalog-title">
      <CatalogueListHeader id="recipient-catalog-title" title={tx('Hồ sơ tạo mới')}/>
      {error ? <div className="recipient-catalog-read-state" role="alert"><p>{tx('Chưa thể đọc hồ sơ tạo mới. Vui lòng thử lại.')}</p><Button variant="secondary" onClick={() => void read()} disabled={loading}>{tx('Thử lại')}</Button></div>
        : !snapshot ? <p className="recipient-catalog-read-state" role="status">{tx('Đang đọc thông tin…')}</p> : <>
          <p className="recipient-data-scope" role="status">{tx('Tổng hồ sơ mới: {total} · Đang lọc: {filtered}', { total: view.totalCreated, filtered: view.total })}</p>
          <CatalogueToolbar id="recipient-catalog" label={tx('Bộ lọc hồ sơ tạo mới')} searchLabel={tx('Tìm hồ sơ tạo mới')} searchHint={tx('Theo mã, tên, địa chỉ, thị trường, khu vực hoặc liên hệ')} searchValue={query.search} onSearchChange={search => change({ search })} acceptedLabel={acceptedLabel} onReset={() => setQuery(defaultRecipientCatalogQuery())} onRefresh={() => void read(true)} busy={loading}>
            <FilterSelect id="recipient-catalog-type" label={tx('Loại nơi nhận')} aria-label={tx('Loại nơi nhận')} value={query.type} onChange={event => change({ type: event.target.value })}><option value="all">{tx('Tất cả')}</option>{RECIPIENT_TYPES.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect id="recipient-catalog-market" label={tx('Thị trường')} aria-label={tx('Thị trường')} value={query.market} onChange={event => change({ market: event.target.value })}><option value="all">{tx('Tất cả')}</option>{RECIPIENT_MARKETS.map(value => <option key={value} value={value}>{tx(value)}</option>)}</FilterSelect>
            <FilterSelect id="recipient-catalog-status" label={tx('Trạng thái')} aria-label={tx('Trạng thái')} value={query.status} onChange={event => change({ status: event.target.value as RecipientCatalogQuery['status'] })}><option value="all">{tx('Tất cả')}</option><option value="active">{tx('Đang sử dụng')}</option><option value="inactive">{tx('Ngừng sử dụng')}</option></FilterSelect>
          </CatalogueToolbar>
          <div className="recipient-catalog-order"><Button variant="secondary" onClick={() => change({ sort: { key: 'createdAt', direction: 'desc' } })} aria-pressed={query.sort.key === 'createdAt'}>{tx('Mới nhất trước')}</Button></div>
          <div className="recipient-table recipient-catalog-table"><DataTable caption={tx('Hồ sơ tạo mới')} columns={columns} rows={view.rows} rowKey={row => row.id} sort={query.sort} onSort={key => change({ sort: { key: key as RecipientCatalogSort, direction: query.sort.key === key && query.sort.direction === 'asc' ? 'desc' : 'asc' } })} emptyContent={<p>{tx(view.totalCreated ? 'Không tìm thấy hồ sơ phù hợp.' : 'Chưa có hồ sơ tạo mới.')}</p>} busy={loading} scrollResetKey={JSON.stringify(query)} appearance="refined"/></div>
          <Pagination variant="products" preserveBoundaryFocus unit={tx('nơi nhận')} page={view.page} pageSize={query.pageSize} filteredTotal={view.total} displayedCount={view.rows.length} canGoPrevious={view.page > 1} canGoNext={view.page < view.pageCount} onPageChange={page => change({ page })} pageSizeOptions={[10, 20, 50, 100]} onPageSizeChange={pageSize => change({ pageSize })}/>
        </>}
    </section>
    {creating && <RecipientCreateDialog adapter={adapter} onClose={onCloseCreate} onAccepted={accepted}/>}
    {detail && !creating && <CatalogRecipientDetailDialog row={detail} onClose={closeDetail}/>}
  </>;
}
