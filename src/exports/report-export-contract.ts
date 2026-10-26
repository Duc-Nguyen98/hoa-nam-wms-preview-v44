/** Owner-authorized read exports, 14/10/2026. No new write/print permission is implied. */
export type ExportScreen = 'S01' | 'S18' | 'S19' | 'S20' | 'S21' | 'S22' | 'S23' | 'S24' | 'S25' | 'S26';
export interface ExportColumn { key: string; label: string; type: 'text' | 'number' | 'date' | 'datetime' | 'percent'; width?: number }
const text = (key: string, label: string, width = 24): ExportColumn => ({ key, label, type: 'text', width });
const number = (key: string, label: string): ExportColumn => ({ key, label, type: 'number', width: 17 });
const date = (key: string, label: string, time = false): ExportColumn => ({ key, label, type: time ? 'datetime' : 'date', width: time ? 24 : 18 });
export const REPORT_EXPORTS: Record<ExportScreen, { title: string; identity: string; columns: ExportColumn[] }> = {
  S01: { title: 'Hoạt động nhập – xuất', identity: 'id', columns: [text('number', 'Mã phiếu', 27), text('typeLabel', 'Loại phiếu'), date('day', 'Ngày'), text('time', 'Giờ'), text('partner', 'Đối tác', 32), text('warehouse', 'Kho'), text('actor', 'Người thực hiện'), number('quantity', 'Số lượng'), text('statusLabel', 'Trạng thái')] },
  S18: { title: 'Báo cáo nhập kho', identity: 'renderKey', columns: [text('code', 'Mã phiếu', 27), date('receivedDate', 'Ngày nhập'), text('supplier', 'Nhà cung cấp', 32), number('receivedQuantity', 'SL thực nhập'), text('status', 'Trạng thái'), text('creator', 'Người tạo')] },
  S19: { title: 'Báo cáo xuất kho', identity: 'renderKey', columns: [text('code', 'Mã phiếu', 27), date('shippedDate', 'Ngày xuất'), text('customer', 'Khách hàng', 32), number('shippedQuantity', 'SL thực xuất'), text('status', 'Trạng thái'), text('creator', 'Người tạo')] },
  S20: { title: 'Lịch sử nhập, xuất kho', identity: 'renderKey', columns: [date('occurredAt', 'Thời gian', true), text('type', 'Loại giao dịch'), text('code', 'Mã phiếu', 27), text('subject', 'Đối tượng', 32), number('quantity', 'Số lượng'), text('performer', 'Người thực hiện')] },
  S21: { title: 'Báo cáo tồn kho & đối soát', identity: 'renderKey', columns: [text('sku', 'SKU'), text('name', 'Tên sản phẩm', 38), number('opening', 'Tồn đầu'), number('inbound', 'Nhập'), number('outboundProducts', 'Xuất sản phẩm'), number('outboundWarranty', 'Xuất bảo hành'), number('reversals', 'Đảo giao dịch'), number('closing', 'Tồn cuối'), number('actual', 'Tồn thực tế'), number('difference', 'Chênh lệch'), text('status', 'Trạng thái')] },
  S22: { title: 'Báo cáo bảo hành linh kiện', identity: 'id', columns: [text('code', 'Mã phiếu', 27), text('serial', 'Serial'), text('sku', 'SKU'), text('productName', 'Sản phẩm', 38), text('partName', 'Linh kiện', 32), date('receivedAt', 'Ngày tiếp nhận'), date('dueAt', 'Hạn xử lý'), text('status', 'Trạng thái')] },
  S23: { title: 'Nhãn đóng gói & in lại', identity: 'labelCode', columns: [text('labelCode', 'Mã nhãn'), text('documentCode', 'Mã chứng từ', 27), text('sku', 'SKU'), text('productName', 'Sản phẩm', 38), date('printedAt', 'Thời điểm in', true), text('status', 'Trạng thái'), number('printCount', 'Số lần in')] },
  S24: { title: 'Đối soát dữ liệu', identity: 'referenceCode', columns: [text('referenceCode', 'Mã tham chiếu', 27), text('object', 'Đối tượng'), text('systemValue', 'Giá trị hệ thống', 32), text('comparisonValue', 'Giá trị đối soát', 32), text('result', 'Kết quả'), text('detail', 'Chi tiết', 48), date('updatedAt', 'Cập nhật', true)] },
  S25: { title: 'Báo cáo xuất theo đại lý', identity: 'rowKey', columns: [text('dealer', 'Đại lý', 32), text('recipient', 'Người nhận', 28), number('documents', 'Số phiếu'), number('products', 'Sản phẩm'), number('completed', 'Hoàn tất'), number('incomplete', 'Chưa hoàn tất'), date('lastExport', 'Lần xuất gần nhất', true)] },
  S26: { title: 'Truy vết hàng hóa', identity: 'sku', columns: [text('sku', 'SKU'), text('name', 'Tên hàng hóa', 38), text('serial', 'Serial'), text('lot', 'Lô'), text('pallet', 'Pallet'), text('status', 'Trạng thái'), text('location', 'Vị trí'), text('lastEvent', 'Sự kiện gần nhất', 32), date('updatedAt', 'Cập nhật', true), { key: 'completeness', label: 'Độ đầy đủ', type: 'percent', width: 17 }] },
};

const filterNames: Record<string, string> = { search: 'Tìm kiếm', supplier: 'Nhà cung cấp', customer: 'Khách hàng', status: 'Trạng thái', type: 'Loại phiếu', performer: 'Người thực hiện', object: 'Đối tượng', result: 'Kết quả', dealer: 'Đại lý', needsReview: 'Cần kiểm tra', sku: 'SKU', dataType: 'Loại dữ liệu', codeType: 'Loại mã' };
const values: Record<string, string> = { inbound: 'Nhập kho', outbound: 'Xuất kho', waiting: 'Chờ xử lý trên Web', posted: 'Đã ghi sổ' };
export function exportFilterLabel(query: Record<string, unknown>, translate: (value: string) => string = value => value): string {
  return Object.entries(query).filter(([key, value]) => filterNames[key] && value !== '' && value !== 'all' && value !== false && value !== null && value !== undefined)
    .map(([key, value]) => `${translate(filterNames[key])}: ${value === true ? translate('Có') : values[String(value)] ? translate(values[String(value)]) : ['status', 'type', 'object', 'result', 'dataType', 'codeType'].includes(key) ? translate(String(value)) : String(value)}`).join(' · ') || translate('Tất cả');
}
export function exportPeriodLabel(period: { from: string; to: string }, translate: (value: string) => string = value => value): string {
  const dateLabel = (value: string) => value.split('-').reverse().join('/');
  return `${dateLabel(period.from)} – ${dateLabel(period.to)} (${translate('giờ Việt Nam')})`;
}
