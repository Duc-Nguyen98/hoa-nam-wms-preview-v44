import type { OperationalCommandName } from '../../contracts/operational-preview';
import type { ShellLanguage } from '../../shared/shell-preferences';

type ActionLabels = Readonly<Record<ShellLanguage, string>>;
/** Presentation only: these labels do not infer a result, status, module or permission. */
export const AUDIT_ACTION_LABELS = {
  'qa.product.set-status': { vi: 'Cập nhật trạng thái sản phẩm', en: 'Update product status', 'zh-CN': '更新产品状态' },
  'qa.sku.set-status': { vi: 'Cập nhật trạng thái SKU', en: 'Update SKU status', 'zh-CN': '更新 SKU 状态' },
  'qa.recipient.set-status': { vi: 'Cập nhật trạng thái bên nhận', en: 'Update recipient status', 'zh-CN': '更新收货方状态' },
  'scenario.reset-own': { vi: 'Đặt lại kịch bản', en: 'Reset scenario', 'zh-CN': '重置场景' },
  'scenario.seed-approved': { vi: 'Nạp dữ liệu xếp khay đã duyệt', en: 'Seed approved putaway data', 'zh-CN': '载入已批准的上架数据' },
  'stock-profiles.create': { vi: 'Tạo hồ sơ kho', en: 'Create stock profile', 'zh-CN': '创建库存档案' },
  'inbound.create': { vi: 'Tạo phiếu nhập kho', en: 'Create inbound receipt', 'zh-CN': '创建入库单' },
  'inbound.update-header': { vi: 'Cập nhật thông tin phiếu nhập', en: 'Update inbound receipt information', 'zh-CN': '更新入库单信息' },
  'inbound.scan': { vi: 'Quét hàng nhập kho', en: 'Scan inbound goods', 'zh-CN': '扫描入库货品' },
  'inbound.submit': { vi: 'Gửi phiếu nhập kho', en: 'Submit inbound receipt', 'zh-CN': '提交入库单' },
  'inbound.post': { vi: 'Ghi sổ phiếu nhập kho', en: 'Post inbound receipt', 'zh-CN': '入库单过账' },
  'putaway.create': { vi: 'Tạo lệnh xếp kho', en: 'Create putaway order', 'zh-CN': '创建上架单' },
  'putaway.confirm': { vi: 'Xác nhận xếp kho', en: 'Confirm putaway', 'zh-CN': '确认上架' },
  'putaway.cancel': { vi: 'Hủy lệnh xếp kho', en: 'Cancel putaway order', 'zh-CN': '取消上架单' },
  'outbound.create': { vi: 'Tạo phiếu xuất kho', en: 'Create outbound receipt', 'zh-CN': '创建出库单' },
  'outbound.scan': { vi: 'Quét hàng xuất kho', en: 'Scan outbound goods', 'zh-CN': '扫描出库货品' },
  'outbound.submit': { vi: 'Gửi phiếu xuất kho', en: 'Submit outbound receipt', 'zh-CN': '提交出库单' },
  'outbound.receive': { vi: 'Tiếp nhận phiếu xuất kho', en: 'Receive outbound receipt', 'zh-CN': '接收出库单' },
  'outbound.post': { vi: 'Ghi sổ phiếu xuất kho', en: 'Post outbound receipt', 'zh-CN': '出库单过账' },
  'warranty.intake': { vi: 'Tiếp nhận bảo hành', en: 'Receive warranty case', 'zh-CN': '受理保修' },
  'warranty.diagnose': { vi: 'Cập nhật chẩn đoán bảo hành', en: 'Update warranty diagnosis', 'zh-CN': '更新保修诊断' },
  'warranty.transition': { vi: 'Chuyển trạng thái bảo hành', en: 'Change warranty state', 'zh-CN': '变更保修状态' },
  'parts.create': { vi: 'Tạo phiếu xuất linh kiện', en: 'Create parts issue', 'zh-CN': '创建配件领用单' },
  'parts.save': { vi: 'Lưu chi tiết xuất linh kiện', en: 'Save parts issue lines', 'zh-CN': '保存配件领用明细' },
  'parts.post': { vi: 'Ghi sổ phiếu xuất linh kiện', en: 'Post parts issue', 'zh-CN': '配件领用单过账' },
  'reversal.create': { vi: 'Tạo phiếu hoàn linh kiện', en: 'Create parts return', 'zh-CN': '创建配件退回单' },
  'reversal.attach-evidence': { vi: 'Đính kèm bằng chứng hoàn trả', en: 'Attach return evidence', 'zh-CN': '附加退回凭证' },
  'reversal.confirm-return': { vi: 'Xác nhận hoàn trả thực tế', en: 'Confirm physical return', 'zh-CN': '确认实物退回' },
  'reversal.post': { vi: 'Ghi sổ phiếu hoàn linh kiện', en: 'Post parts return', 'zh-CN': '配件退回单过账' },
  'reversal.cancel': { vi: 'Hủy phiếu hoàn linh kiện', en: 'Cancel parts return', 'zh-CN': '取消配件退回单' },
} as const satisfies Readonly<Record<OperationalCommandName, ActionLabels>>;

export function auditActionLabel(action: string, language: ShellLanguage = 'vi'): string {
  return Object.prototype.hasOwnProperty.call(AUDIT_ACTION_LABELS, action)
    ? AUDIT_ACTION_LABELS[action as OperationalCommandName][language]
    : action;
}

/** The shortened text is never used for lookup or copying; details retain the original value. */
export function shortenAuditId(value: string, maxLength = 28): string {
  if (!value) return '—';
  if (value.length <= maxLength || maxLength < 5) return value;
  const prefixLength = Math.ceil((maxLength - 1) / 2);
  return `${value.slice(0, prefixLength)}…${value.slice(-(maxLength - prefixLength - 1))}`;
}
