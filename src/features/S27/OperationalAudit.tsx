import { useShellPreferences } from '../../shared/shell-preferences';
import { formatAuditTime } from './audit-time';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';
import { Button, CataloguePageHeader, CatalogueToolbar, DataTable, DateRangePicker, FilterSelect, Icon, Pagination, ordinalColumn, type TableColumn } from '../../shared';
import { vietnamDate } from '../../operations/operational-reports';
import { createOperationalAuditReader, DEFAULT_AUDIT_FILTER, queryOperationalAudit, type AuditFilter, type AuditPeriod, type AuditReadAdapter, type AuditRow } from './audit-operational-binding';

import { AuditDetail, auditDetailReadMessage, refreshAuditDetail, resolveAuditDetail, selectAuditDetail, settleAuditDetailQuery, S27_DETAIL_COPY, type AuditDetailSelection } from './OperationalDetail';
import { auditActionLabel, shortenAuditId } from './audit-copy';
import { useAuditCopy } from './audit-ui-copy';
import type { ReactNode } from 'react';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

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
  'Mã commit, bút toán và mã liên quan nằm trong chi tiết sự kiện.': 'Commit, stock-event and related IDs are available in event details.',
  'Chưa thể áp dụng bộ lọc. Đặt lại bộ lọc để tiếp tục.': 'The filters could not be applied. Reset filters to continue.',
  'Hoạt động': 'Activity', 'Đối tượng': 'Object', 'Xem chi tiết': 'View details',
  'Sắp xếp nhật ký': 'Sort audit', 'Thời gian · Mới nhất': 'Time · Newest first', 'Thời gian · Cũ nhất': 'Time · Oldest first',
  'Người thao tác · A–Z': 'Actor · A–Z', 'Người thao tác · Z–A': 'Actor · Z–A',
  'Mã sự kiện · Tăng dần': 'Event ID · Ascending', 'Mã sự kiện · Giảm dần': 'Event ID · Descending',
  'Chưa có sự kiện trong kỳ đã chọn.': 'No events in the selected period.',
};
export function OperationalAudit({ adapter, cohortControls }: { adapter: AuditReadAdapter; cohortControls?: ReactNode }) {
  const tx = useAuditCopy({ ...ADMIN_EN_COPY, ...S27_OPERATIONAL_COPY, ...S27_DETAIL_COPY });
  const { language } = useShellPreferences();
  const controller = useMemo(() => createOperationalAuditReader(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), model = state.model;
  const [period, setPeriod] = useState<AuditPeriod>(() => { const today = vietnamDate(IS_BROWSER_PREVIEW ? '2026-10-25T14:24:00+07:00' : new Date().toISOString()); return { from: today, to: today }; });
  const [query, setQuery] = useState<AuditFilter>({ ...DEFAULT_AUDIT_FILTER });
  const [selection, setSelection] = useState<AuditDetailSelection | null>(null);
  const root = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const returnEventId = useRef<string | null>(null);
  if (selection) returnEventId.current = selection.id;
  const reload = useCallback((next?: AuditPeriod) => controller.load(next), [controller]);
  const selectedRow = resolveAuditDetail(selection, state, query, period);
  useEffect(() => {
    if (!model || !selection || selection.scopeRevoked) return;
    const a = selection.token, b = model.report.token;
    if (a.epoch !== b.epoch || a.scenarioId !== b.scenarioId || a.generation !== b.generation)
      setSelection(previous => previous ? { ...previous, scopeRevoked: true } : null);
  }, [model, selection]);
  const returnFocus = () => {
    const opener = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[data-audit-detail-open]') ?? []).find(button => button.dataset.auditDetailOpen === returnEventId.current && button.getClientRects().length > 0);
    return opener ?? heading.current;
  };
  useEffect(() => {
    void controller.resume(); const refresh = () => { if (document.visibilityState === 'visible') void reload(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller.suspend(); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [controller, reload]);
  useEffect(() => { if (model) setQuery(previous => settleAuditDetailQuery(previous, model)); }, [model]);
  const update = (patch: Partial<AuditFilter>) => { setSelection(null); setQuery(previous => ({ ...previous, ...patch, page: patch.page ?? 1 })); };
  const result = model ? queryOperationalAudit(model, query) : null, table = result?.kind === 'ready' ? result : null;
  const emptyMessage = model?.rows.length ? 'Không có sự kiện phù hợp trong kỳ đã chọn.' : 'Chưa có sự kiện trong kỳ đã chọn.';
  const actions = [...new Set([...(model?.actions ?? []), ...(query.action ? [query.action] : [])])], actors = [...new Set([...(model?.actors ?? []), ...(query.actorId ? [query.actorId] : [])])];
  const detailButton = (row: AuditRow, mobile = false) => <Button variant="ghost" iconOnly={!mobile} className={mobile ? 's27-card-detail-button' : 's27-table-detail-button'} disabled={state.loading || !!state.error} data-audit-detail-open={row.id} aria-label={tx('Xem chi tiết sự kiện {v0}', { v0: row.id })} onClick={() => setSelection(selectAuditDetail(row.id, state, query, period))}>{mobile ? <><Icon name="eye" size={18} /><span>{tx('Xem chi tiết')}</span></> : <Icon name="chevron-right" size={20} />}</Button>;
  const activity = (row: AuditRow) => <div className="s27-action"><strong>{auditActionLabel(row.action, language)}</strong><code>{row.action}</code></div>;
  const columns: TableColumn<AuditRow>[] = [
    ordinalColumn(table?.pagination.page ?? 1, table?.pagination.pageSize ?? DEFAULT_AUDIT_FILTER.pageSize),
    { id: 'at', heading: tx('Thời gian'), sortKey: 'at', sortType: 'date', render: row => <time dateTime={row.at} className="s27-time">{formatAuditTime(row.at, language)}</time> },
    { id: 'action', heading: tx('Hoạt động'), render: activity },
    { id: 'actorId', heading: tx('Người thao tác'), sortKey: 'actorId', render: row => <code title={row.actorId}>{shortenAuditId(row.actorId)}</code> },
    { id: 'surface', heading: tx('Nguồn thực hiện'), render: row => <span className="s27-source-badge">{row.sourceSurface}</span> },
    { id: 'entity', heading: tx('Đối tượng'), render: row => <div className="s27-entity"><code title={row.entityId}>{shortenAuditId(row.entityId)}</code><p>{tx('Phiên bản')}: {row.previousVersion ?? '—'} → {row.newVersion}</p></div> },
    { id: 'detailAction', heading: tx('Xem chi tiết'), render: row => detailButton(row) },
  ];
  return <section ref={root} className="s27-operational" data-operational-audit aria-label={tx('Nhật ký phiên hiện tại')}>
    <CataloguePageHeader appearance="worklist" title={tx('Nhật ký hệ thống')} parentLabel={tx('Hệ thống')} breadcrumb={tx('Nhật ký hệ thống')} description={tx('Theo dõi thao tác và truy vết sự kiện. Dữ liệu trong phạm vi được cấp. Giờ Việt Nam.')}
      actions={<div className="s27-operational-period"><DateRangePicker id="s27-operational-period" label={tx('Phạm vi · Giờ Việt Nam')} value={period} clearable={false} onChange={next => { if (next) { setSelection(null); setQuery(previous => ({ ...previous, page: 1 })); setPeriod(next); void reload(next); } }} /><Button loading={state.loading} onClick={() => void reload(period)} leadingIcon={<Icon name="refresh" size={18} />}>{tx('Đọc lại nhật ký')}</Button></div>} />
    {cohortControls}
    {state.loading && <p className="s27-read-state" role="status">{tx(model ? 'Đang đọc lại nhật ký…' : 'Đang kiểm tra nguồn nhật ký…')}</p>}{state.error && <p className="s27-read-state" role="alert">{tx(state.error === 'INVALID_PERIOD' ? 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.' : auditDetailReadMessage(state.error))}</p>}
    {model && !model.active && <p role="status">{tx('Chưa có phiên làm việc.')}</p>}
    <section className="s27-list"><div className="s27-list-heading"><div><h2 ref={heading} tabIndex={-1}>{tx('Danh sách sự kiện')}{table && <span className="s27-result-count" role="status" aria-live="polite">{table.pagination.total}</span>}</h2></div></div>
      <CatalogueToolbar id="s27-operational-query" label={tx('Tìm và lọc nhật ký hệ thống')} layout="worklist" filterSizing="compact" searchLabel={tx('Tìm mã sự kiện, đối tượng, lệnh, commit, biến động hoặc người thao tác')} searchHint={tx('Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.')} searchPlaceholder={tx('Tìm trong nhật ký…')} searchValue={query.search} onSearchChange={search => update({ search })} onReset={() => { setSelection(null); setQuery({ ...DEFAULT_AUDIT_FILTER }); }} applyMode="immediate" searchHintMode="sr-only" queryContext={null} busy={state.loading}
        trailingControls={<><FilterSelect label={tx('Hành động')} value={query.action} onChange={event => update({ action: event.target.value })}><option value="">{tx('Tất cả hành động')}</option>{actions.map(action => <option key={action} value={action}>{auditActionLabel(action, language)}{auditActionLabel(action, language) !== action ? ` · ${action}` : ''}</option>)}</FilterSelect><FilterSelect label={tx('Phân hệ')} value="" disabled aria-describedby="s27-operational-module-help"><option value="">{tx('Tất cả phân hệ')}</option></FilterSelect><span id="s27-operational-module-help" className="hn-sr-only">{tx('Chưa có nguồn phân hệ để lọc; bộ lọc sẽ được mở khi mapping được xác nhận.')}</span><FilterSelect label={tx('Người thao tác')} value={query.actorId} onChange={event => update({ actorId: event.target.value })}><option value="">{tx('Tất cả người thao tác')}</option>{actors.map(actor => <option key={actor}>{actor}</option>)}</FilterSelect></>}>{null}</CatalogueToolbar>
      {result?.kind === 'blocked' && <p role="alert">{tx('Chưa thể áp dụng bộ lọc. Đặt lại bộ lọc để tiếp tục.')}</p>}
      {table && <><div className="s27-operational-table-view"><DataTable caption={tx('Danh sách nhật ký hệ thống')} captionVisibility="sr-only" columns={columns} rows={table.rows} rowKey={row => row.id} sort={{ key: query.sortKey, direction: query.sortDirection }} onSort={key => update({ sortKey: key as AuditFilter['sortKey'], sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} appearance="refined" density="compact" stickyHeader emptyContent={<p>{tx(emptyMessage)}</p>} /></div>
        <div className="s27-operational-card-view" aria-label={tx('Danh sách nhật ký hệ thống')}>
          {table.rows.length ? table.rows.map(row => <article className="s27-operational-card" key={row.id}>
            <div className="s27-operational-card__head"><span className="s27-card-icon"><Icon name={row.action === 'scenario.reset-own' ? 'refresh' : 'documents'} size={24} /></span><div className="s27-action"><h3>{auditActionLabel(row.action, language)}</h3><code>{row.action}</code></div><time dateTime={row.at}>{formatAuditTime(row.at, language)}</time></div>
            <dl><div><dt>{tx('Người thao tác')}</dt><dd><code title={row.actorId}>{shortenAuditId(row.actorId)}</code></dd></div><div><dt>{tx('Nguồn thực hiện')}</dt><dd><span className="s27-source-badge">{row.sourceSurface}</span></dd></div><div><dt>{tx('Đối tượng')}</dt><dd><code title={row.entityId}>{shortenAuditId(row.entityId)}</code></dd></div><div><dt>{tx('Mã lệnh')}</dt><dd><code title={row.commandId}>{shortenAuditId(row.commandId)}</code></dd></div><div><dt>{tx('Phiên bản')}</dt><dd>{row.previousVersion ?? '—'} → {row.newVersion}</dd></div></dl>
            <div className="s27-card-footer">{detailButton(row, true)}</div>
          </article>) : <div className="s27-no-result"><strong>{tx(emptyMessage)}</strong></div>}
        </div>
        <p className="s27-list-note">{tx('Mã commit, bút toán và mã liên quan nằm trong chi tiết sự kiện.')}</p><div className="s27-footer"><Pagination variant="products" unit={tx('sự kiện')} page={table.pagination.page} pageSize={table.pagination.pageSize} filteredTotal={table.pagination.total} displayedCount={table.rows.length} canGoPrevious={table.pagination.page > 1} canGoNext={table.pagination.page < table.pagination.pageCount} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} preserveBoundaryFocus /></div></>}
    </section>
    <p className="s27-scope"><Icon name="info" size={16} />{tx('Nhật ký các giao dịch đã ghi nhận trong phiên hiện tại; không bao gồm lịch sử phiên đã lưu trữ.')}</p>
    <AuditDetail open={!!selection} loading={state.loading} error={state.error} row={selectedRow} tx={tx} language={language} onClose={() => setSelection(null)} onRefresh={() => { void refreshAuditDetail(selection, controller, query, period, () => {}); }} resolveReturnFocus={returnFocus} />
  </section>;
}
