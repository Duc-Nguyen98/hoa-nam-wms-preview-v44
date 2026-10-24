import { useShellPreferences } from '../../shared/shell-preferences';
import { formatAuditTime } from './audit-time';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { Button, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, Pagination, ordinalColumn, type TableColumn } from '../../shared';
import { vietnamDate } from '../../operations/operational-reports';
import { createOperationalAuditReader, DEFAULT_AUDIT_FILTER, queryOperationalAudit, type AuditFilter, type AuditPeriod, type AuditReadAdapter, type AuditRow } from './audit-operational-binding';

import { AuditDetail, refreshAuditDetail, resolveAuditDetail, selectAuditDetail, settleAuditDetailQuery, S27_DETAIL_COPY, type AuditDetailSelection } from './OperationalDetail';

export const S27_OPERATIONAL_COPY = {
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': 'Select a period within the last 90 days, ending no later than today.',
  'Nhật ký phiên hiện tại': 'Current session audit', 'Nhật ký tham chiếu': 'Reference audit', 'Đọc lại nhật ký': 'Reload audit',
  'Nhật ký các giao dịch đã ghi nhận trong phiên hiện tại; không bao gồm lịch sử phiên đã lưu trữ.': 'Committed transactions in the current session; archived session history is excluded.',
  'Chưa đọc được nhật ký đầy đủ. Kiểm tra phiên làm việc và thử lại.': 'The complete audit could not be read. Check your session and retry.',
  'Khoảng ngày không hợp lệ.': 'Invalid date range.', 'Chưa có phiên làm việc.': 'No active session.',
  'Mã lệnh': 'Command ID', 'Mã commit': 'Commit ID', 'Mã đối tượng': 'Entity ID', 'Nguồn thực hiện': 'Source surface', 'Mã liên quan': 'Related IDs',
  'Phiên bản': 'Version', 'Không có bút toán kho trong lệnh này': 'No stock event in this command',
  'Tìm mã sự kiện, đối tượng, lệnh, commit, biến động hoặc người thao tác': 'Search audit, entity, command, commit, stock event or actor',
  'Mốc dữ liệu': 'As of', 'Không có sự kiện phù hợp trong kỳ đã chọn.': 'No matching events in the selected period.',
  'Chưa thể áp dụng bộ lọc. Đặt lại bộ lọc để tiếp tục.': 'The filters could not be applied. Reset filters to continue.',
};
export function OperationalAudit({ adapter }: { adapter: AuditReadAdapter }) {
  const tx = useUiCopy({ ...ADMIN_EN_COPY, ...S27_OPERATIONAL_COPY, ...S27_DETAIL_COPY });
  const { language } = useShellPreferences();
  const controller = useMemo(() => createOperationalAuditReader(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), model = state.model;
  const [period, setPeriod] = useState<AuditPeriod>(() => { const today = vietnamDate(new Date().toISOString()); return { from: today, to: today }; });
  const [query, setQuery] = useState<AuditFilter>({ ...DEFAULT_AUDIT_FILTER });
  const [selection, setSelection] = useState<AuditDetailSelection | null>(null);
  const root = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const retainedDetailQuery = useRef<AuditFilter | null>(null);
  const reload = useCallback((next?: AuditPeriod) => { retainedDetailQuery.current = null; return controller.load(next); }, [controller]);
  const selectedRow = resolveAuditDetail(selection, state, query, period);
  useEffect(() => { if (selection && !selectedRow) setSelection(null); }, [selection, selectedRow]);
  const returnFocus = () => {
    const opener = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[data-audit-detail-open]') ?? []).find(button => button.dataset.auditDetailOpen === selection?.id);
    return opener ?? heading.current;
  };
  useEffect(() => {
    void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void reload(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { retainedDetailQuery.current = null; controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller, reload]);
  useEffect(() => { if (model) { const retained = retainedDetailQuery.current; retainedDetailQuery.current = null; setQuery(previous => settleAuditDetailQuery(previous, model, retained)); } }, [model]);
  const update = (patch: Partial<AuditFilter>) => { retainedDetailQuery.current = null; setSelection(null); setQuery(previous => ({ ...previous, ...patch, page: patch.page ?? 1 })); };
  const result = model ? queryOperationalAudit(model, query) : null, table = result?.kind === 'ready' ? result : null;
  const actions = [...new Set([...(model?.actions ?? []), ...(query.action ? [query.action] : [])])], actors = [...new Set([...(model?.actors ?? []), ...(query.actorId ? [query.actorId] : [])])];
  const codes = (values: string[]) => <div className="s27-operational-codes">{values.map(value => <code key={value}>{value}</code>)}</div>;
  const columns: TableColumn<AuditRow>[] = [
    ordinalColumn(table?.pagination.page ?? 1, table?.pagination.pageSize ?? 10),
    { id: 'detailAction', heading: tx('Chi tiết'), render: row => <Button variant="ghost" disabled={state.loading || !!state.error} data-audit-detail-open={row.id} aria-label={tx('Xem chi tiết sự kiện {v0}', { v0: row.id })} onClick={() => setSelection(selectAuditDetail(row.id, state, query, period))}>{tx('Chi tiết')}</Button> },
    { id: 'at', heading: tx('Thời gian'), sortKey: 'at', sortType: 'date', render: row => <time dateTime={row.at} className="s27-time">{formatAuditTime(row.at, language)}</time> },
    { id: 'actorId', heading: tx('Người thao tác'), sortKey: 'actorId', render: row => <code>{row.actorId}</code> },
    { id: 'action', heading: tx('Hành động'), render: row => <code>{row.action}</code> },
    { id: 'surface', heading: tx('Nguồn thực hiện'), render: row => <code>{row.sourceSurface}</code> },
    { id: 'id', heading: tx('Mã sự kiện'), sortKey: 'id', render: row => <code>{row.id}</code> },
    { id: 'entity', heading: tx('Mã đối tượng'), render: row => <div><code>{row.entityId}</code><p>{tx('Phiên bản')}: {row.previousVersion ?? '—'} → {row.newVersion}</p></div> },
    { id: 'command', heading: tx('Mã lệnh'), render: row => <code>{row.commandId}</code> },
    { id: 'commit', heading: tx('Mã commit'), render: row => <code>{row.commitSnapshotId}</code> },
    { id: 'events', heading: tx('Biến động'), render: row => row.eventIds.length ? codes(row.eventIds) : <span>{tx('Không có bút toán kho trong lệnh này')}</span> },
    { id: 'related', heading: tx('Mã liên quan'), render: row => codes(row.relatedIds) },
  ];
  return <section ref={root} className="s27-operational" data-operational-audit aria-label={tx('Nhật ký phiên hiện tại')}>
    <div className="s27-operational-period"><DateRangePicker id="s27-operational-period" label={tx('Phạm vi · Giờ Việt Nam')} value={period} clearable={false} onChange={next => { if (next) { setSelection(null); setPeriod(next); void reload(next); } }} /><Button disabled={state.loading} onClick={() => void reload(period)}>{tx('Đọc lại nhật ký')}</Button></div>
    <p className="s27-scope">{tx('Nhật ký các giao dịch đã ghi nhận trong phiên hiện tại; không bao gồm lịch sử phiên đã lưu trữ.')}</p>
    {model && <p className="s27-scope">{model.rows.length} {tx('sự kiện được cung cấp · Mốc dữ liệu')} {formatAuditTime(model.report.query.asOf, language)}</p>}
    {state.loading && <p role="status">{tx('Đang kiểm tra nguồn nhật ký…')}</p>}{state.error && <p role="alert">{tx(state.error === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.' : 'Chưa đọc được nhật ký đầy đủ. Kiểm tra phiên làm việc và thử lại.')}</p>}
    {model && !model.active && <p role="status">{tx('Chưa có phiên làm việc.')}</p>}
    <section className="s27-list"><div className="s27-list-heading"><h2 ref={heading} tabIndex={-1}>{tx('Danh sách sự kiện')}</h2>{table && <strong role="status">{table.pagination.total} {tx('kết quả')}</strong>}</div>
      <CatalogueToolbar id="s27-operational-query" label={tx('Tìm và lọc nhật ký hệ thống')} layout="worklist" filterSizing="compact" searchLabel={tx('Tìm mã sự kiện, đối tượng, lệnh, commit, biến động hoặc người thao tác')} searchHint={tx('Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.')} searchPlaceholder={tx('Tìm trong nhật ký…')} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => { setSelection(null); setQuery({ ...DEFAULT_AUDIT_FILTER }); }} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={state.loading}
        trailingControls={<><FilterSelect label={tx('Hành động')} value={query.action} onChange={event => update({ action: event.target.value })}><option value="">{tx('Tất cả hành động')}</option>{actions.map(action => <option key={action}>{action}</option>)}</FilterSelect><FilterSelect label={tx('Phân hệ')} value="" disabled aria-describedby="s27-operational-module-help"><option value="">{tx('Tất cả phân hệ')}</option></FilterSelect><span id="s27-operational-module-help" className="hn-sr-only">{tx('Chưa có nguồn phân hệ để lọc; bộ lọc sẽ được mở khi mapping được xác nhận.')}</span><FilterSelect label={tx('Người thao tác')} value={query.actorId} onChange={event => update({ actorId: event.target.value })}><option value="">{tx('Tất cả người thao tác')}</option>{actors.map(actor => <option key={actor}>{actor}</option>)}</FilterSelect></>}>{null}</CatalogueToolbar>
      {result?.kind === 'blocked' && <p role="alert">{tx('Chưa thể áp dụng bộ lọc. Đặt lại bộ lọc để tiếp tục.')}</p>}
      {table && <><DataTable caption={tx('Danh sách nhật ký hệ thống')} columns={columns} rows={table.rows} rowKey={row => row.id} sort={{ key: query.sortKey, direction: query.sortDirection }} onSort={key => update({ sortKey: key as AuditFilter['sortKey'], sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} appearance="refined" density="compact" stickyHeader emptyContent={<p>{tx('Không có sự kiện phù hợp trong kỳ đã chọn.')}</p>} />
        <div className="s27-footer"><Pagination variant="products" unit={tx('sự kiện')} page={table.pagination.page} pageSize={table.pagination.pageSize} filteredTotal={table.pagination.total} displayedCount={table.rows.length} canGoPrevious={table.pagination.page > 1} canGoNext={table.pagination.page < table.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus /></div></>}
    </section>
    <AuditDetail row={selectedRow} tx={tx} language={language} onClose={() => setSelection(null)} onRefresh={() => { void refreshAuditDetail(selection, controller, query, period, () => { retainedDetailQuery.current = query; setSelection(null); }); }} resolveReturnFocus={returnFocus} />
  </section>;
}
