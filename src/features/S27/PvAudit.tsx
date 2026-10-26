import { useShellPreferences } from '../../shared/shell-preferences';
import { formatAuditTime } from './audit-time';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { PvAudit as PvAuditRecord } from '../../contracts/pv-demo';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';
import { Button } from '../../shared/primitives';
import { CatalogueToolbar } from '../../shared/Catalogue';
import { DataTable, ordinalColumn, type TableColumn } from '../../shared/DataTable';
import { FilterSelect } from '../../shared/controls';
import { GlobalModal } from '../../shared/GlobalModal';
import { Pagination } from '../../shared/Pagination';
import { createPvAuditReader, queryPvAudits, resolvePvAuditDetail, type PvAuditReadAdapter, type PvAuditState, type PvAuditQuery } from './pv-audit-binding';

export const S27_PV_COPY = {
  'Nhật ký hồ sơ PV': 'PV profile audit', 'Nhật ký PV đã lưu': 'Saved PV audit',
  'Nguồn riêng: lịch sử hồ sơ PV đã lưu; không gộp với nhật ký phiên hoặc nhật ký tham chiếu.': 'Separate source: saved PV profile history; not combined with session or reference audit.',
  'Đọc lại nhật ký PV': 'Reload PV audit', 'Đang đọc nhật ký PV…': 'Loading PV audit…',
  'Chưa đọc được nhật ký PV. Dữ liệu cũ đã được ẩn; hãy kiểm tra phiên và đọc lại.': 'PV audit could not be read. Previous data is hidden; check your session and reload.',
  'Phiên hiện tại không được phép đọc nhật ký PV.': 'The current session is not authorized to read PV audit.',
  'Nguồn nhật ký PV chưa khả dụng.': 'The PV audit source is unavailable.',
  'Chưa có sự kiện PV đã lưu trong nguồn được cấp.': 'No saved PV events exist in the supplied source.',
  'Không có sự kiện PV phù hợp bộ lọc.': 'No PV events match the filters.',
  'Tìm và lọc nhật ký PV': 'Search and filter PV audit',
  'Tìm mã sự kiện, mã lệnh, mã hồ sơ, người thao tác, hành động hoặc tên PV trước/sau': 'Search event ID, command ID, profile ID, actor, action or before/after PV name',
  'Đang lọc nhật ký PV…': 'Filtering PV audit…',
  'Chưa thể áp dụng bộ lọc PV. Đặt lại bộ lọc để tiếp tục.': 'PV filters could not be applied. Reset filters to continue.',
  'Mã lệnh': 'Command ID', 'Mã hồ sơ PV': 'PV profile ID', 'Mã người thao tác': 'Actor key',
  'Chi tiết sự kiện PV': 'PV event details', 'Xem chi tiết PV {v0}': 'View PV event details {v0}',
  'Chỉ đọc sự kiện đã chọn và giá trị trước/sau do nguồn PV cung cấp.': 'Read-only selected event and before/after values supplied by the PV source.',
  'Trường PV': 'PV field', 'Trước': 'Before', 'Sau': 'After',
  'Không có bản ghi trước (null)': 'No previous record (null)', 'Không có giá trị (null)': 'No value (null)',
  'Phiên bản': 'Version', 'Mã sản phẩm': 'Product ID', 'Mã SKU': 'SKU ID',
  'Tên hiển thị': 'Display name', 'Mã tài nguyên ảnh': 'Image asset ID', 'Trạng thái hiển thị': 'Visibility',
  'Nguồn gốc': 'Provenance', 'Thời điểm tạo': 'Created at', 'Thời điểm cập nhật': 'Updated at',
  'Người tạo': 'Created by', 'Người cập nhật': 'Updated by',
};
const PV_COPY = { ...ADMIN_EN_COPY, ...S27_PV_COPY };
const profileFields: readonly [keyof PvAuditRecord['after'], string][] = [
  ['id', 'Mã hồ sơ PV'], ['version', 'Phiên bản'], ['productId', 'Mã sản phẩm'], ['skuId', 'Mã SKU'],
  ['displayName', 'Tên hiển thị'], ['imageAssetId', 'Mã tài nguyên ảnh'], ['visibility', 'Trạng thái hiển thị'],
  ['provenance', 'Nguồn gốc'], ['createdAt', 'Thời điểm tạo'], ['updatedAt', 'Thời điểm cập nhật'], ['createdBy', 'Người tạo'], ['updatedBy', 'Người cập nhật'],
];
export function PvAuditDetail({ row, tx, onClose, resolveReturnFocus }: {
  row: PvAuditRecord | null; tx: (text: string) => string; onClose: () => void; resolveReturnFocus: () => HTMLElement | null;
}) {
  const { language } = useShellPreferences();
  const value = (input: string | number | null) => input === null ? <span>{tx('Không có giá trị (null)')}</span> : <code>{input}</code>;
  return <GlobalModal open={!!row} title={tx('Chi tiết sự kiện PV')} description={tx('Chỉ đọc sự kiện đã chọn và giá trị trước/sau do nguồn PV cung cấp.')} onClose={onClose} resolveReturnFocus={resolveReturnFocus} size="large" footer={<Button variant="secondary" onClick={onClose}>{tx('Đóng')}</Button>}>
    {row && <div className="s27-pv-detail" data-pv-audit-detail-id={row.id}>
      <dl>{([
        ['Mã sự kiện', row.id], ['Mã lệnh', row.commandId], ['Mã hồ sơ PV', row.entityId], ['Mã người thao tác', row.actorKey], ['Thời gian', row.committedAt], ['Hành động', row.command],
      ] as const).map(([label, field]) => <div key={label}><dt className="s27-muted">{tx(label)}</dt><dd>{label === 'Thời gian' ? <time dateTime={row.committedAt}>{formatAuditTime(row.committedAt, language)}</time> : value(field)}</dd></div>)}</dl>
      {row.before === null && <p>{tx('Không có bản ghi trước (null)')}</p>}
      <div className="s27-pv-comparison" role="region" aria-label={tx('Trường PV')} tabIndex={0}>
        <table><caption className="hn-sr-only">{tx('Chi tiết sự kiện PV')}</caption><thead><tr><th scope="col">{tx('Trường PV')}</th><th scope="col">{tx('Trước')}</th><th scope="col">{tx('Sau')}</th></tr></thead><tbody>
          {profileFields.map(([key, label]) => <tr key={key}><th scope="row">{tx(label)}</th><td>{row.before === null ? tx('Không có bản ghi trước (null)') : value(row.before[key])}</td><td>{value(row.after[key])}</td></tr>)}
        </tbody></table>
      </div>
    </div>}
  </GlobalModal>;
}

export function PvAudit({ adapter }: { adapter: PvAuditReadAdapter }) {
  const reader = useMemo(() => createPvAuditReader(adapter), [adapter]);
  const state = useSyncExternalStore(reader.subscribe, reader.getSnapshot, reader.getSnapshot);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void reader.resume(); else reader.suspend(); };
    refresh(); window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { reader.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [reader]);
  return <PvAuditPanel state={state} reader={reader} />;
}
/** Also rendered in node tests; this is not browser/visual acceptance evidence. */
export function PvAuditPanel({ state, reader }: { state: PvAuditState; reader: ReturnType<typeof createPvAuditReader> }) {
  const tx = useUiCopy(PV_COPY), root = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const { language } = useShellPreferences();
  const { model, query } = state, busy = state.status === 'loading';
  const result = state.status === 'ready' && model ? queryPvAudits(model, query) : null;
  const table = result?.kind === 'ready' ? result : null;
  const selected = resolvePvAuditDetail(state);
  const returnFocus = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[data-pv-audit-open]') ?? []).find(button => button.dataset.pvAuditOpen === state.selection?.id) ?? heading.current;
  const columns: TableColumn<PvAuditRecord>[] = [
    ordinalColumn(table?.pagination.page ?? 1, table?.pagination.pageSize ?? 10),
    { id: 'pvDetail', heading: tx('Chi tiết'), render: row => <Button variant="ghost" disabled={state.debouncing} data-pv-audit-open={row.id} aria-label={tx('Xem chi tiết PV {v0}', { v0: row.id })} onClick={() => reader.openDetail(row.id)}>{tx('Chi tiết')}</Button> },
    { id: 'committedAt', heading: tx('Thời gian'), sortKey: 'committedAt', sortType: 'date', render: row => <time dateTime={row.committedAt} className="s27-time">{formatAuditTime(row.committedAt, language)}</time> },
    { id: 'id', heading: tx('Mã sự kiện'), sortKey: 'id', render: row => <code>{row.id}</code> },
    { id: 'command', heading: tx('Hành động'), render: row => <code>{row.command}</code> },
    { id: 'actorKey', heading: tx('Mã người thao tác'), sortKey: 'actorKey', render: row => <code>{row.actorKey}</code> },
    { id: 'commandId', heading: tx('Mã lệnh'), render: row => <code>{row.commandId}</code> },
    { id: 'entityId', heading: tx('Mã hồ sơ PV'), render: row => <code>{row.entityId}</code> },
  ];
  const commands = [...new Set([...(model?.rows.map(row => row.command) ?? []), ...(query.command ? [query.command] : [])])].sort();
  const actors = [...new Set([...(model?.rows.map(row => row.actorKey) ?? []), ...(query.actorKey ? [query.actorKey] : [])])].sort();
  return <section ref={root} className="s27-pv" data-pv-audit aria-label={tx('Nhật ký hồ sơ PV')}>
    <p className="s27-scope">{tx('Nguồn riêng: lịch sử hồ sơ PV đã lưu; không gộp với nhật ký phiên hoặc nhật ký tham chiếu.')}</p>
    <div><Button variant="secondary" loading={busy} onClick={() => void reader.load()}>{tx('Đọc lại nhật ký PV')}</Button></div>
    {(state.status === 'idle' || busy) && <p role="status">{tx('Đang đọc nhật ký PV…')}</p>}
    {state.status === 'error' && <p role="alert">{tx('Chưa đọc được nhật ký PV. Dữ liệu cũ đã được ẩn; hãy kiểm tra phiên và đọc lại.')}</p>}
    {state.status === 'forbidden' && <p role="alert">{tx('Phiên hiện tại không được phép đọc nhật ký PV.')}</p>}
    {state.status === 'unavailable' && <p role="status">{tx('Nguồn nhật ký PV chưa khả dụng.')}</p>}
    <section className="s27-list"><div className="s27-list-heading"><h2 ref={heading} tabIndex={-1}>{tx('Nhật ký PV đã lưu')}</h2>{table && <strong role="status">{table.pagination.total} {tx('kết quả')}</strong>}</div>
      <CatalogueToolbar id="s27-pv-query" label={tx('Tìm và lọc nhật ký PV')} layout="worklist" searchLabel={tx('Tìm mã sự kiện, mã lệnh, mã hồ sơ, người thao tác, hành động hoặc tên PV trước/sau')} searchHint={tx('Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.')} searchPlaceholder={tx('Tìm trong nhật ký…')} searchValue={state.searchValue} onSearchChange={reader.setSearch} onReset={reader.resetQuery} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={busy || state.debouncing}
        trailingControls={<><FilterSelect label={tx('Hành động')} value={query.command} onChange={event => reader.updateQuery({ command: event.target.value })}><option value="">{tx('Tất cả hành động')}</option>{commands.map(command => <option key={command}>{command}</option>)}</FilterSelect><FilterSelect label={tx('Mã người thao tác')} value={query.actorKey} onChange={event => reader.updateQuery({ actorKey: event.target.value })}><option value="">{tx('Tất cả người thao tác')}</option>{actors.map(actor => <option key={actor}>{actor}</option>)}</FilterSelect></>}>{null}</CatalogueToolbar>
      {state.debouncing && <p role="status">{tx('Đang lọc nhật ký PV…')}</p>}
      {result?.kind === 'blocked' && <p role="alert">{tx('Chưa thể áp dụng bộ lọc PV. Đặt lại bộ lọc để tiếp tục.')}</p>}
      {table && <><DataTable caption={tx('Nhật ký PV đã lưu')} columns={columns} rows={table.rows} rowKey={row => row.id} sort={{ key: query.sortKey, direction: query.sortDirection }} onSort={key => reader.updateQuery({ sortKey: key as PvAuditQuery['sortKey'], sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} appearance="refined" density="compact" stickyHeader scrollResetKey={JSON.stringify(query)} busy={state.debouncing} emptyStateKind={model?.rows.length ? "no-results" : "empty"} onResetFilters={model?.rows.length ? reader.resetQuery : undefined} emptyContent={<p>{tx(model?.rows.length === 0 ? 'Chưa có sự kiện PV đã lưu trong nguồn được cấp.' : 'Không có sự kiện PV phù hợp bộ lọc.')}</p>} />
        <div className="s27-footer"><Pagination variant="products" unit={tx('sự kiện')} page={table.pagination.page} pageSize={table.pagination.pageSize} filteredTotal={table.pagination.total} displayedCount={table.rows.length} canGoPrevious={table.pagination.page > 1} canGoNext={table.pagination.page < table.pagination.pageCount} onPageChange={page => reader.updateQuery({ page })} onPageSizeChange={pageSize => reader.updateQuery({ pageSize })} preserveBoundaryFocus /></div></>}
    </section>
    <PvAuditDetail row={selected} tx={tx} onClose={reader.closeDetail} resolveReturnFocus={returnFocus} />
  </section>;
}
