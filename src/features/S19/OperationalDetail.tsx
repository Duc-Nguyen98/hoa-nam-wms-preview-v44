import { Button } from '../../shared/primitives';
import { DataTable } from '../../shared/DataTable';
import { GlobalModal } from '../../shared/GlobalModal';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { localeForLanguage, useShellPreferences } from '../../shared/shell-preferences';
import type { OutboundReadModel } from './outbound-binding';

export interface OutboundDetailSelection {
  model: OutboundReadModel;
  eventId: string;
  token: OutboundReadModel['report']['token'];
}
type DetailState = { model: OutboundReadModel | null; busy: boolean; error: string };

/** Bind to the accepted report object as well as its full session/scenario token. */
export function selectOutboundDetail(state: DetailState, eventId: string): OutboundDetailSelection | null {
  if (!state.model || state.busy || state.error) return null;
  const selection = { model: state.model, eventId, token: { ...state.model.report.token } };
  return resolveOutboundDetail(state, selection) ? selection : null;
}
export function resolveOutboundDetail(state: DetailState, selection: OutboundDetailSelection | null) {
  const model = state.model;
  if (!model || state.busy || state.error || !selection || selection.model !== model) return null;
  const a = selection.token, b = model.report.token;
  if (a.epoch !== b.epoch || a.scenarioId !== b.scenarioId || a.generation !== b.generation || a.revision !== b.revision) return null;
  const row = model.rows.find(item => item.eventId === selection.eventId);
  const event = model.report.events.find(item => item.id === selection.eventId && item.data.eventType === 'OUTBOUND_POST');
  const document = row && model.report.outbounds.find(item => item.id === row.outboundId);
  if (!row || !event || !document || event.data.documentId !== document.id
    || event.data.sourceLineId !== row.sourceLineId || !document.data.postedEventIds.includes(event.id)) return null;
  return { row, event, document };
}

export const OUTBOUND_DETAIL_COPY = {
  'Chi tiết': 'Details', 'Chi tiết lần xuất kho': 'Outbound event details', 'Đóng': 'Close',
  'Đọc lại dữ liệu': 'Refresh data',
  'Thông tin chỉ đọc của lần xuất đã chọn trong kỳ báo cáo.': 'Read-only information for the selected outbound event in the report period.',
  'Thông tin lần xuất': 'Outbound event information', 'Trường': 'Field', 'Giá trị': 'Value',
  'Mã sự kiện': 'Event ID', 'ID phiếu xuất': 'Outbound ID', 'Mã phiếu': 'Outbound code',
  'ID người nhận': 'Recipient ID', 'Phiên bản người nhận khi App gửi': 'Recipient version at App submission',
  'Mã người nhận khi App gửi': 'Recipient code at App submission', 'Người nhận khi App gửi': 'Recipient at App submission',
  'Loại người nhận': 'Recipient type', 'Thị trường': 'Market', 'ID SKU': 'SKU ID', 'SKU': 'SKU',
  'ID sản phẩm': 'Product ID', 'Tên hàng': 'Product name', 'Kho': 'Warehouse', 'Đơn vị tính': 'Unit',
  'SL thực xuất': 'Shipped quantity', 'Biến động tồn kho': 'Stock change', 'Ngày ghi sổ': 'Posted at',
  'Người ghi sổ': 'Posted by', 'ID dòng nguồn': 'Source line ID', 'ID vật phẩm': 'Physical IDs', 'ID thùng': 'Box ID',
};

export function OperationalOutboundDetail({ detail, onClose, onRefresh, resolveReturnFocus }: {
  detail: ReturnType<typeof resolveOutboundDetail>;
  onClose: () => void;
  onRefresh: () => void;
  resolveReturnFocus: () => HTMLElement | null;
}) {
  const tx = useUiCopy(OUTBOUND_DETAIL_COPY), row = detail?.row;
  const { language } = useShellPreferences();
  const locale = localeForLanguage(language);
  const fields: [string, string | number][] = row ? [
    ['Mã sự kiện', row.eventId], ['ID phiếu xuất', row.outboundId], ['Mã phiếu', row.outboundCode],
    ['ID người nhận', row.recipient.id], ['Phiên bản người nhận khi App gửi', row.recipient.version],
    ['Mã người nhận khi App gửi', row.recipient.code], ['Người nhận khi App gửi', row.recipient.name],
    ['Loại người nhận', tx(row.recipient.type)], ['Thị trường', tx(row.recipient.market)],
    ['ID SKU', row.skuId], ['SKU', row.skuCode], ['ID sản phẩm', row.productId], ['Tên hàng', row.productName],
    ['Kho', row.warehouseId], ['Đơn vị tính', tx(row.unit)], ['SL thực xuất', row.quantity],
    ['Biến động tồn kho', row.signedQuantity], ['Ngày ghi sổ', new Date(row.committedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh' })], ['Người ghi sổ', row.actor],
    ['ID dòng nguồn', row.sourceLineId], ['ID vật phẩm', row.physicalIds.join(', ') || '—'], ['ID thùng', row.boxId ?? '—'],
  ] : [];
  return <GlobalModal open={!!detail} title={tx('Chi tiết lần xuất kho')} size="large" onClose={onClose}
    description={tx('Thông tin chỉ đọc của lần xuất đã chọn trong kỳ báo cáo.')}
    closeLabel={tx('Đóng')} resolveReturnFocus={resolveReturnFocus} footer={<><Button variant="secondary" onClick={onRefresh}>{tx('Đọc lại dữ liệu')}</Button><Button onClick={onClose}>{tx('Đóng')}</Button></>}>
    {row && <div data-s19-detail-event-id={row.eventId}>
      <DataTable caption={tx('Thông tin lần xuất')} rows={fields} rowKey={field => field[0]} columns={[
        { id: 'field', heading: tx('Trường'), render: field => tx(field[0]) },
        { id: 'value', heading: tx('Giá trị'), render: field => <span style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}>{field[1]}</span> },
      ]} />
    </div>}
  </GlobalModal>;
}
