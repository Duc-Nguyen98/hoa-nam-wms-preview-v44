import type { ShellLanguage } from '../../shared/shell-preferences';
import { formatAuditTime } from './audit-time';
import type { ReactNode } from 'react';
import { Button } from '../../shared/primitives';
import { GlobalModal } from '../../shared/GlobalModal';
import type { AuditFilter, AuditPeriod, AuditRow, OperationalAuditModel, createOperationalAuditReader } from './audit-operational-binding';
import { queryOperationalAudit } from './audit-operational-binding';

export const S27_DETAIL_COPY = {
  'Chi tiết sự kiện': 'Event details', 'Xem chi tiết sự kiện {v0}': 'View event details {v0}',
  'Thông tin chỉ đọc của sự kiện đã chọn.': 'Read-only information for the selected event.',
  'Phiên bản trước': 'Previous version', 'Phiên bản mới': 'New version',
  'Không có mã liên quan': 'No related IDs',
  'Đọc lại dữ liệu': 'Refresh data',
};
type ReadState = { model: OperationalAuditModel | null; loading: boolean; error: string };
export interface AuditDetailSelection {
  readonly model: OperationalAuditModel;
  readonly id: string;
  readonly token: Readonly<OperationalAuditModel['report']['token']>;
  readonly query: AuditFilter;
  readonly from: string;
  readonly to: string;
}
/** UI-only pin: no adapter, recovery journal, relationship lookup or business command. */
export function selectAuditDetail(id: string, state: ReadState, query: AuditFilter, period: AuditPeriod): AuditDetailSelection | null {
  const model = state.model;
  if (!model || !model.active || state.loading || state.error) return null;
  const result = queryOperationalAudit(model, query);
  if (result.kind !== 'ready' || !result.rows.some(row => row.id === id)) return null;
  return Object.freeze({ model, id, token: Object.freeze({ ...model.report.token }), query, from: period.from, to: period.to });
}
export function resolveAuditDetail(selection: AuditDetailSelection | null, state: ReadState, query: AuditFilter, period: AuditPeriod): AuditRow | null {
  const model = state.model;
  if (!selection || !model || !model.active || state.loading || state.error || model !== selection.model
    || query !== selection.query || period.from !== selection.from || period.to !== selection.to) return null;
  const a = selection.token, b = model.report.token;
  if (a.epoch !== b.epoch || a.scenarioId !== b.scenarioId || a.generation !== b.generation || a.revision !== b.revision) return null;
  const result = queryOperationalAudit(model, query);
  return result.kind === 'ready' ? result.rows.find(row => row.id === selection.id) ?? null : null;
}
/** Only a currently eligible selection may initiate this explicit parent read. */
export function refreshAuditDetail(selection: AuditDetailSelection | null, controller: Pick<ReturnType<typeof createOperationalAuditReader>, 'getSnapshot' | 'load'>,
  query: AuditFilter, period: AuditPeriod, invalidate: () => void) {
  if (!resolveAuditDetail(selection, controller.getSnapshot(), query, period)) return;
  invalidate();
  return controller.load(period);
}
/** Preserve the accepted query for Detail refresh; only a now-invalid page falls back to page one. */
export function settleAuditDetailQuery(query: AuditFilter, model: OperationalAuditModel, retained: AuditFilter | null): AuditFilter {
  return query === retained && queryOperationalAudit(model, query).kind === 'ready' ? query : { ...query, page: 1 };
}
export function AuditDetail({ row, tx, onClose, onRefresh, resolveReturnFocus, language = 'vi' }: {
  row: AuditRow | null;
  language?: ShellLanguage;
  tx: (text: string) => string;
  onClose: () => void;
  onRefresh: () => void;
  resolveReturnFocus: () => HTMLElement | null;
}) {
  const codes = (values: string[], empty: string) => values.length
    ? <div className="s27-operational-codes">{values.map((value, index) => <code key={`${index}:${value}`} style={{ overflowWrap: 'anywhere' }}>{value}</code>)}</div>
    : tx(empty);
  const fields: [string, ReactNode][] = row ? [
    ['Mã sự kiện', <code>{row.id}</code>], ['Thời gian', <time dateTime={row.at}>{formatAuditTime(row.at, language)}</time>],
    ['Người thao tác', <code>{row.actorId}</code>], ['Hành động', <code>{row.action}</code>],
    ['Nguồn thực hiện', <code>{row.sourceSurface}</code>], ['Mã đối tượng', <code>{row.entityId}</code>],
    ['Phiên bản trước', row.previousVersion ?? '—'], ['Phiên bản mới', row.newVersion],
    ['Mã lệnh', <code>{row.commandId}</code>], ['Mã commit', <code>{row.commitSnapshotId}</code>],
    ['Biến động', codes(row.eventIds, 'Không có bút toán kho trong lệnh này')], ['Mã liên quan', codes(row.relatedIds, 'Không có mã liên quan')],
  ] : [];
  return <GlobalModal open={!!row} title={tx('Chi tiết sự kiện')} description={tx('Thông tin chỉ đọc của sự kiện đã chọn.')} onClose={onClose} resolveReturnFocus={resolveReturnFocus} size="large" className="s27-detail-modal" footer={<><Button variant="secondary" disabled={!row} onClick={onRefresh}>{tx('Đọc lại dữ liệu')}</Button><Button variant="secondary" onClick={onClose}>{tx('Đóng')}</Button></>}>
    {row && <dl data-audit-detail-id={row.id} className="s27-detail-grid">{fields.map(([label, value]) => <div key={label}><dt className="s27-muted">{tx(label)}</dt><dd>{value}</dd></div>)}</dl>}
  </GlobalModal>;
}
