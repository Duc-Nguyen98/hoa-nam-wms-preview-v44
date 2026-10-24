import { OPERATIONS_EN_COPY, renderOperationsText, operationsScopeLabel, uiText, type OperationsNotice, type OperationsText } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createReversalController } from '../../controllers/reversal-controller';
import { DEFAULT_REVERSAL_QUERY as defaults, REVERSAL_STATUS_LABELS, reversalDateLabel, type ReversalAdapter, type ReversalQuery, type ReversalRow, type ReversalSortKey, type ReversalStatus } from '../../contracts/reversal-slips';
import { InitialReadState, Button, CatalogueListHeader, CataloguePageHeader, CatalogueToolbar, DataTable, FilterSelect, GlobalShell, Icon, Notice, NoticeSlot, Pagination, StatusBadge, ordinalColumn, type NoticeFeedback, type TableColumn } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { recordReviewDiagnostic } from '../../app/review-diagnostics';
import { reversalFeedbackSlot, useReversalFocus, visibleReversalAction } from './reversal-focus';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { OperationalReversals, REVERSAL_OPERATIONAL_COPY } from './OperationalReversals';
import './reversal-slips.css';

type Operation = ReturnType<ReturnType<typeof createReversalController>['load']>;
const statusTone = (status: ReversalStatus) => status === 'POSTED' ? 'success' : status === 'DRAFT' ? 'warning' : 'neutral';

export function ReversalSlipsScreen({ adapter }: { adapter?: ReversalAdapter } = {}) {
  const tx = useUiCopy({ ...OPERATIONS_EN_COPY, ...REVERSAL_OPERATIONAL_COPY });
  const operational = useMemo(() => createOperationalWebAdapter(undefined, { scope: 'S17' }), []);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => operational.available ? 'scenario' : 'legacy');
  const controller = useMemo(() => createReversalController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const model = state.model, query = state.intendedQuery ?? defaults;
  const [notice, setNotice] = useState<OperationsNotice | null>(null);
  const sequence = useRef(0), intent = useRef(0);
  const { screen, onFocusCapture } = useReversalFocus(Boolean(model) && cohort === 'legacy');
  const tableView = useRef<HTMLDivElement>(null);
  const cardView = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const ready = Boolean(model);
  const acceptedQueryKey = JSON.stringify(model?.query);
  // Match the table's accepted-query reset without moving focus away from paging.
  // Failed/pending reads do not reset the currently accepted cards.
  useLayoutEffect(() => { if (cardView.current) cardView.current.scrollTop = 0; }, [acceptedQueryKey]);
  useEffect(() => {
    const region = tableView.current?.querySelector<HTMLElement>('.hn-table-scroll'), table = region?.querySelector('table');
    if (!region || !table) return;
    const measure = () => setOverflows(region.clientWidth > 0 && region.scrollWidth > region.clientWidth + 1);
    const observer = new ResizeObserver(measure); observer.observe(region); observer.observe(table); measure();
    return () => observer.disconnect();
  }, [ready, cohort]);
  const notify = useCallback((message: OperationsText, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finish = useCallback((outcome: Awaited<Operation>, origin: HTMLElement | null, token: number) => {
    if (token !== intent.current || outcome.kind === 'superseded') return;
    if (outcome.kind === 'error') {
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S17_READ', detail: 'Read failed.' });
      if (controller.getSnapshot().model) notify('Chưa thể đọc danh sách phiếu đảo. Dữ liệu và điều kiện trước đó được giữ nguyên.', origin, 'error');
    } else if (outcome.result.kind === 'blocked') {
      recordReviewDiagnostic({ kind: 'blocked-query', key: `S17:${outcome.result.reason}`, detail: outcome.result.detail });
      notify('Chưa thể áp dụng điều kiện vừa chọn. Đã giữ dữ liệu và điều kiện trước đó.', origin);
    }
  }, [controller, notify]);
  useEffect(() => {
    let active = true;
    const token = ++intent.current;
    void controller.load({ ...defaults }).then(outcome => { if (active) finish(outcome, null, token); });
    return () => { active = false; controller.clear(); };
  }, [controller, finish]);
  function run(operation: () => Operation, origin: HTMLElement | null = document.activeElement instanceof HTMLElement ? document.activeElement : null) {
    const token = ++intent.current; setNotice(null);
    void operation().then(outcome => finish(outcome, origin, token));
  }
  function update(patch: Partial<ReversalQuery>) { run(() => controller.update(patch)); }
  function blockedAction(label: string, origin: HTMLElement, code?: string) {
    recordReviewDiagnostic({ kind: 'blocked-action', key: 'S17:FLOW_NOT_SUPPLIED', detail: `${label}${code ? ` ${code}` : ''}: no assigned flow/mapping; no stock or document mutation.` });
    notify(uiText('{action}{code} chưa khả dụng.', { action: uiText(label), code: code ? ` ${code}` : '' }), origin);
  }
  function openButton(row: ReversalRow) {
    return <Button variant="ghost" data-s17-action={row.renderKey} aria-label={tx('Mở {code}', { code: row.code })} aria-describedby="s17-flow-limit" onClick={event => blockedAction('Mở', event.currentTarget, row.code)}><Icon name="eye" size={17} />{tx("Mở")}</Button>;
  }
  const columns: TableColumn<ReversalRow>[] = [
    ordinalColumn(model?.pagination.page ?? 1, model?.pagination.pageSize ?? 10),
    { id: 'code', heading: tx('Mã điều chỉnh'), sortKey: 'code', sortType: 'text', render: row => <strong className="s17-code">{row.code}</strong> },
    { id: 'originalDocument', heading: tx('Chứng từ gốc'), sortKey: 'originalDocument', sortType: 'text', render: row => <span className="s17-document">{row.originalDocument}</span> },
    { id: 'totalQuantity', heading: tx('Tổng số lượng'), sortKey: 'totalQuantity', sortType: 'number', align: 'end', render: row => <span className="s17-number">{row.totalQuantity ?? '—'}</span> },
    { id: 'status', heading: tx('Trạng thái'), sortKey: 'status', sortType: 'text', render: row => <StatusBadge tone={statusTone(row.status)}>{tx(REVERSAL_STATUS_LABELS[row.status])}</StatusBadge> },
    { id: 'reason', heading: tx('Lý do điều chỉnh'), sortKey: 'reason', sortType: 'text', render: row => <div className="s17-reason"><span>{row.reason}</span><small>{row.reasonDetail}</small></div> },
    { id: 'createdAt', heading: tx('Ngày tạo'), sortKey: 'createdAt', sortType: 'date', render: row => <span className="s17-date">{reversalDateLabel(row.createdAt)}</span> },
    { id: 'createdBy', heading: tx('Người tạo'), sortKey: 'createdBy', sortType: 'text', render: row => <span className={row.createdBy ? undefined : 's17-missing'}>{row.createdBy ?? '—'}</span> },
    { id: 'action', heading: tx('Thao tác'), headingContent: <span className="s17-action-heading">{tx("Thao tác")}<small>{tx("Chưa khả dụng")}</small></span>, kind: 'actions', align: 'end', render: openButton },
  ];
  return <GlobalShell title={tx("Phiếu đảo tồn kho")} variant="wms" activeKey="S17" navigation={S00_SHELL_NAVIGATION} profile={{ displayName: 'Đức Quang', initials: 'DQ' }}>
    <div className="hn-catalogue-screen s17-screen" data-screen="S17" data-visual-variant="premium" ref={screen} onFocusCapture={onFocusCapture}>
      <CataloguePageHeader appearance="worklist" title={tx("Phiếu đảo tồn kho")} breadcrumb={tx("Phiếu đảo tồn kho")} parentLabel={tx("Tồn kho & Đối soát")} description={tx("Quản lý phiếu điều chỉnh tồn kho và chứng từ gốc.")} actions={cohort === 'legacy' ? <div className="s17-create-group"><Button variant="secondary" aria-describedby="s17-flow-limit s17-create-limit" onClick={event => blockedAction('Tạo phiếu điều chỉnh', event.currentTarget)}><Icon name="plus" size={18} />{tx("Tạo phiếu điều chỉnh")}</Button><span id="s17-create-limit" className="s17-action-limit">{tx("Chưa khả dụng")}</span></div> : undefined} />
      {operational.available && <div className="s17-action-row"><Button variant="secondary" aria-pressed={cohort === 'scenario'} onClick={() => setCohort('scenario')}>{tx('Phiếu hoàn phiên hiện tại')}</Button><Button variant="secondary" aria-pressed={cohort === 'legacy'} onClick={() => setCohort('legacy')}>{tx('Danh sách tham chiếu')}</Button></div>}
      {cohort === 'scenario' ? <OperationalReversals adapter={operational} notify={message => notify(uiText(message), null, 'success')} /> : <>
      <span className="hn-sr-only" id="s17-flow-limit">{tx("Tạo và mở phiếu hiện chưa khả dụng.")}</span>
      {model ? <section className="s17-list hn-premium-panel" aria-labelledby="s17-list-title">
        <div className="s17-list-heading"><CatalogueListHeader density="compact" id="s17-list-title" title={tx("Hồ sơ phiếu đảo")} count={tx('{count} phiếu điều chỉnh', { count: model.pagination.total })} /></div>
        <div className="s17-query">
          <CatalogueToolbar layout="worklist" filterSizing="compact" id="s17" label={tx("Tìm kiếm và lọc phiếu đảo")} searchLabel={tx("Tìm kiếm phiếu đảo")} searchHint={tx("Tìm theo mã điều chỉnh, chứng từ gốc hoặc lý do, gồm dòng phụ.")} searchHintMode="sr-only" searchPlaceholder={tx("Mã điều chỉnh, chứng từ gốc, lý do...")} searchValue={query.search} onSearchChange={search => update({ search })} applyMode="immediate" queryContext={model.query.status ? <span className="s17-applied-status" role="status" aria-atomic="true">{tx("Trạng thái đang lọc:")} <strong>{tx(REVERSAL_STATUS_LABELS[model.query.status])}</strong></span> : null} onReset={() => run(() => controller.reset({ ...defaults }))} busy={state.loading}>
            <FilterSelect label={tx("Trạng thái")} value={query.status} onChange={event => update({ status: event.target.value as ReversalQuery['status'] })}>
              <option value="">{tx("Tất cả")}</option>
              {model.filterOptions.status.map(value => <option key={value} value={value}>{tx(REVERSAL_STATUS_LABELS[value as ReversalStatus])}</option>)}
            </FilterSelect>
          </CatalogueToolbar>
        </div>
          <NoticeSlot name="table" />
          <div className="s17-table-view" ref={tableView}>
            <p className="s17-scroll-hint" hidden={!overflows}>{tx("Cuộn ngang để xem đầy đủ 9 cột.")}</p>
            <DataTable appearance="refined" density="compact" rowActionAppearance="quiet" sortIndicatorAppearance="quiet" caption={tx("Hồ sơ phiếu đảo")} captionVisibility="sr-only" columns={columns} rows={model.rows} rowKey={row => row.renderKey} sort={model.query.sortKey ? { key: model.query.sortKey, direction: model.query.sortDirection } : null} onSort={key => update({ sortKey: key as ReversalSortKey, sortDirection: query.sortKey === key && query.sortDirection === 'asc' ? 'desc' : 'asc' })} scrollResetKey={JSON.stringify(model.query)} busy={state.loading} stickyHeader stickyColumnIds={['code']} stickyEndColumnIds={['action']} emptyContent={<p>{tx("Không có phiếu phù hợp với điều kiện đã chọn.")}</p>} />
            <div className="s17-feedback-host s17-feedback-host--table" data-s17-feedback />
          </div>
          <div className="s17-card-view" ref={cardView} role="region" aria-label={tx("Hồ sơ phiếu đảo dạng thẻ")}>
            {model.rows.length ? model.rows.map((row, index) => <article className="s17-card" key={row.renderKey}>
              <div className="s17-card-head"><div className="s17-card-identity"><span className="s17-ordinal">{tx("STT")} {model.pagination.start + index}</span><h3 className="s17-code">{row.code}</h3></div><StatusBadge tone={statusTone(row.status)}>{tx(REVERSAL_STATUS_LABELS[row.status])}</StatusBadge></div>
              <dl className="s17-card-fields">
                <div><dt>{tx("Chứng từ gốc")}</dt><dd className="s17-document">{row.originalDocument}</dd></div>
                <div><dt>{tx("Tổng số lượng")}</dt><dd className="s17-number">{row.totalQuantity ?? '—'}</dd></div>
                <div className="s17-card-reason"><dt>{tx("Lý do điều chỉnh")}</dt><dd className="s17-reason"><span>{row.reason}</span><small>{row.reasonDetail}</small></dd></div>
                <div><dt>{tx("Ngày tạo")}</dt><dd>{reversalDateLabel(row.createdAt)}</dd></div>
                <div><dt>{tx("Người tạo")}</dt><dd>{row.createdBy ?? '—'}</dd></div>
              </dl>
              <div className="s17-card-actions"><span className="s17-action-limit">{tx("Mở phiếu chưa khả dụng")}</span>{openButton(row)}</div>
              <div className="s17-feedback-host" data-s17-feedback />
            </article>) : <p className="s17-empty">{tx("Không có phiếu phù hợp với điều kiện đã chọn.")}</p>}
          </div>
          <div className="s17-list-footer">
            <Pagination preserveBoundaryFocus variant="products" unit={tx("phiếu điều chỉnh")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} displayedCount={model.rows.length} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} pageSizeOptions={model.pagination.pageSizeOptions} onPageChange={page => update({ page })} onPageSizeChange={pageSize => update({ pageSize })} />
            <div className="s17-list-notes"><p className="s17-source-limit"><Icon name="info" size={14} /><span>{operationsScopeLabel(model.summary.scopeLabel, tx)}</span></p><p className="s17-helper">{tx('Phiếu đảo tạo giao dịch đối ứng; giao dịch gốc luôn được giữ nguyên.')}</p></div><NoticeSlot name="pagination" />
          </div>
        </section>
      : <InitialReadState label={tx("danh sách phiếu đảo")} loading={state.loading} error={state.error} blocked={!!state.blocker} onRetry={() => run(() => controller.load({ ...(state.intendedQuery ?? defaults) }))} />}
      </>}
      {notice && <Notice feedback={{ ...notice, message: renderOperationsText(notice.message, tx) }} onClose={() => setNotice(null)} resolveFocusFallback={visibleReversalAction} resolveInlineSlot={reversalFeedbackSlot} revealInlineOnOpen protectedContentSelector=".s17-list, .s17-screen .hn-page-heading, .s17-query" />}
    </div>
  </GlobalShell>;
}




