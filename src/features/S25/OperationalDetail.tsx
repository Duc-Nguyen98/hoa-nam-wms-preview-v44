import { Button } from '../../shared/primitives';
import { DataTable, type TableColumn } from '../../shared/DataTable';
import { GlobalModal } from '../../shared/GlobalModal';
import { useUiCopy } from '../../i18n/use-ui-copy';
import type { RecipientExportRow, RecipientGroup, RecipientPeriod, RecipientReadModel } from './recipient-binding';

export const RECIPIENT_DETAIL_COPY = {
  'Chi tiết người nhận trên phiếu': 'Recipient details on documents', 'Xem chi tiết': 'View details', 'Đóng': 'Close',
  'Đọc lại dữ liệu': 'Refresh data',
  'Mã người nhận': 'Recipient code', 'Tên người nhận': 'Recipient name', 'Loại người nhận': 'Recipient type', 'Thị trường': 'Market',
  'Phiên bản trên phiếu': 'Version on document', 'Chứng từ trong nhóm': 'Documents in this group',
  'Các lần xuất trong nhóm': 'Outbound events in this group', 'Tổng thực xuất theo SKU, kho và đơn vị': 'Shipped totals by SKU, warehouse and unit',
  'Chưa có lần xuất đã ghi sổ trong kỳ.': 'No posted outbounds in this period.',
  'Thông tin giữ theo phiếu đã gửi trong kỳ báo cáo đang hiển thị.': 'Details are retained from submitted documents in the displayed report period.',
};
type ReportState = { model: RecipientReadModel | null; busy: boolean; error: string; period: RecipientPeriod | null };
export interface RecipientDetailSelection {
  model: RecipientReadModel; key: string; snapshotKey: string;
  token: RecipientReadModel['report']['token']; from: string; to: string;
}
export function selectRecipientDetail(model: RecipientReadModel, group: RecipientGroup): RecipientDetailSelection | null {
  if (!model.groups.includes(group)) return null;
  return { model, key: group.key, snapshotKey: group.snapshotKey, token: { ...model.report.token }, from: model.report.query.from, to: model.report.query.to };
}
/** UI-only projection: no reader, command, join, or quantity aggregation. */
export function resolveRecipientDetail(selected: RecipientDetailSelection | null, state: ReportState) {
  const model = state.model;
  if (!selected || !model || model !== selected.model || state.busy || state.error) return null;
  const token = model.report.token;
  if (token.epoch !== selected.token.epoch || token.scenarioId !== selected.token.scenarioId || token.generation !== selected.token.generation || token.revision !== selected.token.revision
    || model.report.query.from !== selected.from || model.report.query.to !== selected.to || state.period?.from !== selected.from || state.period.to !== selected.to) return null;
  const group = model.groups.find(row => row.key === selected.key && row.snapshotKey === selected.snapshotKey);
  if (!group) return null;
  return { group, rows: model.rows.filter(row => row.recipient.id === group.recipient.id && row.snapshotKey === group.snapshotKey && group.documentIds.includes(row.outboundId)) };
}
export type RecipientDetail = NonNullable<ReturnType<typeof resolveRecipientDetail>>;
export function OperationalRecipientDetail({ detail, columns, onClose, onRefresh, resolveReturnFocus }: {
  detail: RecipientDetail | null; columns: TableColumn<RecipientExportRow>[]; onClose: () => void; onRefresh: () => void; resolveReturnFocus: () => HTMLElement | null;
}) {
  const tx = useUiCopy(RECIPIENT_DETAIL_COPY);
  return <GlobalModal open={!!detail} title={tx('Chi tiết người nhận trên phiếu')} description={tx('Thông tin giữ theo phiếu đã gửi trong kỳ báo cáo đang hiển thị.')} size="large" onClose={onClose} closeLabel={tx('Đóng')} resolveReturnFocus={resolveReturnFocus} footer={<><Button variant="secondary" disabled={!detail} onClick={onRefresh}>{tx('Đọc lại dữ liệu')}</Button><Button onClick={onClose}>{tx('Đóng')}</Button></>}>
    {detail && <div data-recipient-detail-key={detail.group.key} data-recipient-detail-snapshot={detail.group.snapshotKey}>
      <dl>{([
        ['Mã người nhận', detail.group.recipient.code], ['Tên người nhận', detail.group.recipient.name],
        ['Loại người nhận', tx(detail.group.recipient.type)], ['Thị trường', tx(detail.group.recipient.market)],
        ['Phiên bản trên phiếu', detail.group.recipient.version],
      ] as const).map(([label, value]) => <div key={label}><dt>{tx(label)}</dt><dd>{value}</dd></div>)}</dl>
      <h3>{tx('Chứng từ trong nhóm')}</h3><ul>{detail.group.documentIds.map(id => <li key={id}>{id}</li>)}</ul>
      <h3>{tx('Tổng thực xuất theo SKU, kho và đơn vị')}</h3><ul className="s25-operational-totals">{detail.group.totals.map(total => <li key={total.key}>{total.skuCode} · {total.warehouseId}: <strong>{total.quantity} {tx(total.unit)}</strong></li>)}</ul>
      <DataTable caption={tx('Các lần xuất trong nhóm')} rows={detail.rows} rowKey={row => row.eventId} columns={columns} appearance="refined" emptyContent={<p>{tx('Chưa có lần xuất đã ghi sổ trong kỳ.')}</p>} />
    </div>}
  </GlobalModal>;
}
