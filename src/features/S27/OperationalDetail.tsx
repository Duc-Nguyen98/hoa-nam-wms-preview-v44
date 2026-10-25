import type { ShellLanguage } from '../../shared/shell-preferences';
import { formatAuditTime } from './audit-time';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../shared/primitives';
import { GlobalModal } from '../../shared/GlobalModal';
import { Icon } from '../../shared/Icon';
import { useGlobalToast } from '../../toast/GlobalToastProvider';
import { auditActionLabel } from './audit-copy';
import type { AuditFilter, AuditPeriod, AuditRow, OperationalAuditModel, createOperationalAuditReader } from './audit-operational-binding';
import { queryOperationalAudit } from './audit-operational-binding';

export const S27_DETAIL_COPY = {
  'Chi tiết sự kiện': 'Event details', 'Xem chi tiết sự kiện {v0}': 'View event details {v0}',
  'Thông tin chỉ đọc của sự kiện đã chọn.': 'Read-only information for the selected event.',
  'Phiên bản trước': 'Previous version', 'Phiên bản mới': 'New version',
  'Không có mã liên quan': 'No related IDs',
  'Đọc lại dữ liệu': 'Refresh data',
  'Nhận diện sự kiện': 'Event identity', 'Chỉ đọc': 'Read only',
  'Thông tin sự kiện': 'Event information', 'Biến động và liên quan': 'Stock movements and relationships',
  'Biến động kho': 'Stock movements', 'Mã truy vết': 'Trace identifiers',
  'Mã hành động': 'Action code', 'Giờ Việt Nam': 'Vietnam time',
  'Không có phiên bản trước': 'No previous version', 'Sao chép': 'Copy',
  'Đang đọc lại sự kiện đã chọn…': 'Reloading the selected event…',
  'Chưa tải được chi tiết sự kiện. Đọc lại dữ liệu để thử lại.': 'Event details could not be loaded. Refresh data to retry.',
  'Bạn không có quyền xem chi tiết sự kiện này trong phiên hiện tại.': 'You do not have access to this event in the current session.',
  'Sự kiện không còn khả dụng trong phạm vi hiện tại.': 'This event is no longer available in the current scope.',
  'Nguồn nhật ký hiện chưa khả dụng.': 'The audit source is currently unavailable.',
  'Chưa xác minh được tính đầy đủ của sự kiện và các mã liên quan. Đọc lại dữ liệu để thử lại.': 'The event and its relationships could not be verified as complete. Refresh data to retry.',
};
const DETAIL_ZH_COPY: Readonly<Record<string, string>> = {
  'Chi tiết sự kiện': '事件详情', 'Thông tin chỉ đọc của sự kiện đã chọn.': '所选事件的只读信息。',
  'Nhận diện sự kiện': '事件标识', 'Chỉ đọc': '只读', 'Thông tin sự kiện': '事件信息',
  'Biến động và liên quan': '库存变动与关联', 'Biến động kho': '库存变动', 'Mã truy vết': '追踪标识',
  'Mã hành động': '操作代码', 'Nguồn thực hiện': '执行来源', 'Thời gian': '时间', 'Giờ Việt Nam': '越南时间',
  'Người thao tác': '操作人', 'Phiên bản trước': '上一版本', 'Phiên bản mới': '新版本',
  'Không có phiên bản trước': '无上一版本', 'Mã liên quan': '关联 ID',
  'Không có bút toán kho trong lệnh này': '此命令没有库存分录', 'Không có mã liên quan': '无关联 ID',
  'Mã sự kiện': '事件 ID', 'Mã đối tượng': '对象 ID', 'Mã lệnh': '命令 ID', 'Mã commit': '提交 ID',
  'Sao chép': '复制', 'Đọc lại dữ liệu': '重新读取数据', 'Đóng': '关闭',
  'Đang đọc lại sự kiện đã chọn…': '正在重新读取所选事件…',
  'Chưa tải được chi tiết sự kiện. Đọc lại dữ liệu để thử lại.': '无法加载事件详情。请重新读取数据以重试。',
  'Bạn không có quyền xem chi tiết sự kiện này trong phiên hiện tại.': '您在当前会话中无权查看此事件详情。',
  'Sự kiện không còn khả dụng trong phạm vi hiện tại.': '此事件在当前范围内已不可用。',
  'Nguồn nhật ký hiện chưa khả dụng.': '日志来源当前不可用。',
  'Chưa xác minh được tính đầy đủ của sự kiện và các mã liên quan. Đọc lại dữ liệu để thử lại.': '无法验证事件及关联 ID 的完整性。请重新读取数据以重试。',
};
const COPY_FEEDBACK = {
  success: { vi: 'Đã sao chép giá trị gốc.', en: 'The original value was copied.', 'zh-CN': '已复制原始值。' },
  error: { vi: 'Không thể sao chép. Vui lòng chọn và sao chép mã bằng bàn phím.', en: 'Copy failed. Select the identifier and copy it using the keyboard.', 'zh-CN': '复制失败。请选择标识并使用键盘复制。' },
};
const forbiddenReadCodes = new Set(['FORBIDDEN', 'SESSION_EXPIRED', 'UNAUTHENTICATED', 'CONFIRMATION_REQUIRED', 'RECOVERY_ACTOR_MISMATCH', 'MOCK_COMMAND_FORBIDDEN']);
export function auditDetailReadMessage(error: string) {
  if (forbiddenReadCodes.has(error)) return 'Bạn không có quyền xem chi tiết sự kiện này trong phiên hiện tại.';
  if (error === 'COMMAND_UNAVAILABLE') return 'Nguồn nhật ký hiện chưa khả dụng.';
  if (['INCOMPLETE_AUDIT_RELATIONSHIP', 'INCOMPLETE_POPULATION', 'INVALID_RESPONSE', 'STALE_AUDIT_SNAPSHOT'].includes(error)) return 'Chưa xác minh được tính đầy đủ của sự kiện và các mã liên quan. Đọc lại dữ liệu để thử lại.';
  if (['NOT_FOUND', 'EVENT_UNAVAILABLE', 'STALE_SCENARIO', 'STALE_DEMO_EPOCH'].includes(error)) return 'Sự kiện không còn khả dụng trong phạm vi hiện tại.';
  return 'Chưa tải được chi tiết sự kiện. Đọc lại dữ liệu để thử lại.';
}
type ReadState = { model: OperationalAuditModel | null; loading: boolean; error: string };
export interface AuditDetailSelection {
  readonly model: OperationalAuditModel;
  readonly id: string;
  readonly token: Readonly<OperationalAuditModel['report']['token']>;
  readonly query: AuditFilter;
  readonly from: string;
  readonly to: string;
  readonly scopeRevoked?: boolean;
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
  // A refresh keeps the last accepted model mounted. Resolve the pinned row
  // while loading/error so the caller can keep the dialog open and render the
  // appropriate read state instead of silently dropping focus or selecting a
  // different event.
  if (!selection || selection.scopeRevoked || !model || !model.active
    || query.search !== selection.query.search || query.action !== selection.query.action || query.actorId !== selection.query.actorId
    || period.from !== selection.from || period.to !== selection.to) return null;
  const a = selection.token, b = model.report.token;
  if (a.epoch !== b.epoch || a.scenarioId !== b.scenarioId || a.generation !== b.generation || b.revision < a.revision) return null;
  // New records can move this event off the visible page. Its exact identity,
  // immutable content and scope, not its page position, own the open dialog.
  const row = model.rows.find(row => row.id === selection.id);
  const original = selection.model.rows.find(row => row.id === selection.id);
  return row && JSON.stringify(row) === JSON.stringify(original) ? row : null;
}
/** Only a currently eligible selection may initiate this explicit parent read. */
export function refreshAuditDetail(selection: AuditDetailSelection | null, controller: Pick<ReturnType<typeof createOperationalAuditReader>, 'getSnapshot' | 'load'>,
  query: AuditFilter, period: AuditPeriod, invalidate: () => void) {
  if (!selection || controller.getSnapshot().loading || period.from !== selection.from || period.to !== selection.to) return;
  invalidate();
  return controller.load(period);
}
/** Preserve the accepted query for Detail refresh; only a now-invalid page falls back to page one. */
export function settleAuditDetailQuery(query: AuditFilter, model: OperationalAuditModel, _retained?: AuditFilter | null): AuditFilter {
  if (queryOperationalAudit(model, query).kind === 'ready') return query;
  const first = queryOperationalAudit(model, { ...query, page: 1 });
  return first.kind === 'ready' ? { ...query, page: Math.max(1, first.pagination.pageCount) } : query;
}
export function AuditDetail({ row, tx, onClose, onRefresh, resolveReturnFocus, language = 'vi', open = !!row, loading = false, error = '' }: {
  row: AuditRow | null;
  language?: ShellLanguage;
  tx: (text: string) => string;
  onClose: () => void;
  onRefresh: () => void;
  resolveReturnFocus: () => HTMLElement | null;
  /** Selection owns the open state so an explicit read never closes the dialog. */
  open?: boolean;
  loading?: boolean;
  error?: string;
}) {
  const toast = useGlobalToast(), copyRequest = useRef(0);
  const copy = (text: string) => language === 'zh-CN' ? DETAIL_ZH_COPY[text] ?? tx(text) : tx(text);
  const eligibleRow = open && !loading && !error ? row : null;
  const copyIdentity = useRef(eligibleRow?.id ?? null);
  copyIdentity.current = eligibleRow?.id ?? null;
  useEffect(() => { ++copyRequest.current; return () => { ++copyRequest.current; }; }, [open, row?.id, loading, error]);
  const copyValue = async (value: string, origin: HTMLButtonElement) => {
    if (!value || !eligibleRow) return;
    const request = ++copyRequest.current, selectedId = eligibleRow.id;
    let success = false;
    try { await navigator.clipboard.writeText(value); success = true; } catch { /* Permission and unavailable API failures use shared feedback. */ }
    if (request !== copyRequest.current || copyIdentity.current !== selectedId) return;
    const tone = success ? 'success' : 'error';
    toast.notify({ tone, origin, dedupeKey: `s27-copy:${tone}`, message: locale => COPY_FEEDBACK[tone][locale] });
  };
  const traceValue = (label: string, value: string) => <div className="s27-detail-trace__value">
    <code data-audit-raw-value={label}>{value || '—'}</code>
    <Button variant="ghost" iconOnly className="s27-detail-copy" disabled={!value || !eligibleRow}
      aria-label={`${copy('Sao chép')} ${copy(label)}`} title={`${copy('Sao chép')} ${copy(label)}`}
      data-audit-copy={label} onClick={event => void copyValue(value, event.currentTarget)}>
      <Icon name="copy" size={18} />
    </Button>
  </div>;
  const codes = (values: string[], empty: string) => values.length
    ? <ul className="s27-operational-codes">{values.map((value, index) => <li key={`${index}:${value}`}><code>{value}</code></li>)}</ul>
    : <p className="s27-detail-empty">{copy(empty)}</p>;
  const fields: [string, ReactNode][] = eligibleRow ? [
    ['Thời gian', <><time dateTime={eligibleRow.at}>{formatAuditTime(eligibleRow.at, language)}</time><span className="s27-detail-timezone">{copy('Giờ Việt Nam')} · Asia/Ho_Chi_Minh</span></>],
    ['Người thao tác', <code>{eligibleRow.actorId || '—'}</code>],
    ['Phiên bản trước', eligibleRow.previousVersion === null ? <span title={copy('Không có phiên bản trước')} aria-label={copy('Không có phiên bản trước')}>—</span> : eligibleRow.previousVersion],
    ['Phiên bản mới', eligibleRow.newVersion],
  ] : [];
  const traceFields = eligibleRow ? [
    ['Mã sự kiện', eligibleRow.id], ['Mã đối tượng', eligibleRow.entityId],
    ['Mã lệnh', eligibleRow.commandId], ['Mã commit', eligibleRow.commitSnapshotId],
  ] : [];
  return <GlobalModal open={open} title={copy('Chi tiết sự kiện')} description={copy('Thông tin chỉ đọc của sự kiện đã chọn.')} onClose={onClose} resolveReturnFocus={resolveReturnFocus} size="large" className="s27-detail-modal"
    data-audit-detail-state={loading ? 'loading' : error ? 'error' : eligibleRow ? 'ready' : 'unavailable'}
    footer={<><Button variant="secondary" loading={loading} onClick={onRefresh} leadingIcon={<Icon name="refresh" size={18} />}>{copy('Đọc lại dữ liệu')}</Button><Button onClick={onClose}>{copy('Đóng')}</Button></>}>
    {loading ? <div className="s27-detail-read-state" role="status"><Icon name="refresh" size={24} /><p>{copy('Đang đọc lại sự kiện đã chọn…')}</p></div>
      : error ? <div className="s27-detail-read-state" role="alert"><Icon name="info" size={24} /><p>{copy(auditDetailReadMessage(error))}</p></div>
      : !eligibleRow ? <div className="s27-detail-read-state" role="status"><Icon name="info" size={24} /><p>{copy('Sự kiện không còn khả dụng trong phạm vi hiện tại.')}</p></div>
      : <div data-audit-detail-id={eligibleRow.id} className="s27-detail-content">
        <section className="s27-detail-identity" aria-label={copy('Nhận diện sự kiện')}>
          <span className="s27-detail-identity__icon"><Icon name="audit" size={28} /></span>
          <div className="s27-detail-identity__content"><h3>{auditActionLabel(eligibleRow.action, language)}</h3>
            <div className="s27-detail-identity__meta"><code aria-label={copy('Mã hành động')}>{eligibleRow.action}</code><span className="s27-source-badge" aria-label={copy('Nguồn thực hiện')}>{eligibleRow.sourceSurface}</span></div>
          </div>
          <span className="s27-detail-readonly"><Icon name="lock" size={15} />{copy('Chỉ đọc')}</span>
        </section>
        <section className="s27-detail-section" aria-labelledby="s27-detail-information-title"><h3 id="s27-detail-information-title">{copy('Thông tin sự kiện')}</h3>
          <dl className="s27-detail-info">{fields.map(([label, value]) => <div key={label}><dt>{copy(label)}</dt><dd>{value}</dd></div>)}</dl>
        </section>
        <section className="s27-detail-related" aria-label={copy('Biến động và liên quan')}>
          <div className="s27-detail-related__card"><Icon name="box" size={22} /><div><h3>{copy('Biến động kho')}</h3>{codes(eligibleRow.eventIds, 'Không có bút toán kho trong lệnh này')}</div></div>
          <div className="s27-detail-related__card"><Icon name="tag" size={22} /><div><h3>{copy('Mã liên quan')}</h3>{codes(eligibleRow.relatedIds, 'Không có mã liên quan')}</div></div>
        </section>
        <section className="s27-detail-section s27-detail-trace" aria-labelledby="s27-detail-trace-title"><h3 id="s27-detail-trace-title">{copy('Mã truy vết')}</h3>
          <dl>{traceFields.map(([label, value]) => <div key={label}><dt>{copy(label)}</dt><dd>{traceValue(label, value)}</dd></div>)}</dl>
        </section>
      </div>}
  </GlobalModal>;
}
