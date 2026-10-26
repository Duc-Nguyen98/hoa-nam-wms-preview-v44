import { useCallback } from 'react';
import { useShellPreferences, type ShellLanguage } from '../../shared/shell-preferences';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';
import { translateUiCopy } from '../../i18n/ui-copy';

/** S01-local copy: do not translate source names, identifiers or business data. */
export const OVERVIEW_COPY: Readonly<Record<string, readonly [string, string]>> = {
  'Danh sách phiếu nhập và xuất trong kỳ.': ['Inbound and outbound documents in this period.', '本期入库和出库单据。'],
  'Chờ xử lý': ['Pending', '待处理'],
  'Xem phiếu': ['View document', '查看单据'],
  'Phiếu nhập kho': ['Inbound receipt', '入库单'],
  'Phiếu xuất kho': ['Outbound slip', '出库单'],
  'Danh sách phiếu nhập': ['Inbound receipts', '入库单列表'],
  'Danh sách phiếu xuất': ['Outbound slips', '出库单列表'],
  'Về Tổng quan': ['Back to overview', '返回概览'],
  'Không tìm thấy chứng từ': ['Document not found', '未找到单据'],
  'Liên kết không hợp lệ hoặc chứng từ không còn trong nguồn dữ liệu đã chọn. Vui lòng mở lại từ Tổng quan.': ['The link is invalid or the document is no longer in the selected source. Open it again from the overview.', '链接无效或所选数据源中已无此单据。请从概览重新打开。'],
  'Hàng hóa': ['Items', '货物'],
  'Serial đã ghi nhận': ['Recorded serial numbers', '已记录序列号'],
  'Chưa có serial ghi nhận.': ['No serial numbers recorded.', '尚无已记录序列号。'],
  'Ghi chú': ['Notes', '备注'],
  'Tệp đính kèm': ['Attachments', '附件'],
  'Lịch sử chứng từ': ['Document history', '单据历史'],
  'Kho': ['Warehouse', '仓库'],
  'Kỳ thời gian': ['Period', '期间'],
  'Đối tác': ['Partner', '合作伙伴'],
  'Thời gian': ['Time', '时间'],
  'Theo dõi kho và công việc cần xử lý.': ['Monitor your warehouse and pending work.', '跟踪仓库及待处理工作。'],
  'Tồn kho hiện tại': ['Current inventory', '当前库存'],
  'Phiếu nhập': ['Inbound receipts', '入库单'],
  'Phiếu xuất': ['Outbound slips', '出库单'],
  'Phiếu nhập trong kỳ': ['Inbound receipts in period', '本期入库单'],
  'Phiếu xuất trong kỳ': ['Outbound slips in period', '本期出库单'],
  'Bảo hành đang mở': ['Open warranty cases', '未结保修单'],
  'Tất cả trạng thái': ['All statuses', '所有状态'],
  'Không áp dụng kỳ chứng từ': ['Independent of document period', '不受单据期间限制'],
  'Chưa có số liệu xác nhận': ['No confirmed inventory figure', '暂无已确认库存数据'],
  'Hiện tại': ['Current', '当前'],
  'Trong kỳ': ['In period', '本期'],
  'Cần xử lý': ['Needs attention', '待处理'],
  'Các phiếu đang chờ xử lý, cần theo dõi và hoàn tất.': ['Pending documents to review and complete.', '跟踪并完成待处理单据。'],
  'Xem danh sách': ['View list', '查看列表'],
  'Phiếu nhập chờ xử lý': ['Pending inbound receipt', '待处理入库单'],
  'Phiếu xuất chờ xử lý': ['Pending outbound slip', '待处理出库单'],
  'Không có phiếu cần xử lý trong kỳ.': ['No pending documents in this period.', '本期无待处理单据。'],
  'Chưa có thông tin phiếu cần xử lý.': ['Pending document information is unavailable.', '暂无法获取待处理单据。'],
  'Xem phiếu {number}': ['View document {number}', '查看单据 {number}'],
  'Hoạt động nhập – xuất': ['Inbound / outbound activity', '出入库活动'],
  'Phiếu nhập và xuất trong kỳ chứng từ': ['Inbound and outbound documents in the selected period', '所选期间的出入库单据'],
  'Kho và kỳ áp dụng cho chỉ số chứng từ, công việc cần xử lý và biểu đồ. Tìm kiếm và bộ lọc bên dưới chỉ áp dụng cho danh sách.': ['Warehouse and period apply to document totals, pending work and chart. Search and filters below affect the activity list only.', '仓库及期间适用于单据总数、待处理工作和图表。下方搜索及筛选仅影响活动列表。'],
  'Phân tích nhập – xuất': ['Inbound / outbound analysis', '出入库分析'],
  'Biểu đồ theo dõi số phiếu trong kỳ.': ['Document counts for the selected period.', '所选期间的单据数量。'],
  'Chi tiết phiếu': ['Document details', '单据详情'],
  'Chi tiết phiếu nhập': ['Inbound receipt details', '入库单详情'],
  'Chi tiết phiếu xuất': ['Outbound slip details', '出库单详情'],
  'Thông tin chứng từ': ['Document information', '单据信息'],
  'Thông tin hệ thống': ['System information', '系统信息'],
  'Mở phiếu nhập kho': ['Open inbound receipt', '打开入库单'],
  'Mở phiếu xuất kho': ['Open outbound slip', '打开出库单'],
  'Chưa có liên kết được xác minh tới chứng từ nguồn.': ['A verified link to the source document is not yet available.', '尚无已验证的源单据链接。'],
  'Sao chép mã phiếu': ['Copy document number', '复制单据编号'],
  'Sao chép ID': ['Copy ID', '复制 ID'],
  'Đã sao chép.': ['Copied.', '已复制。'],
  'Không thể sao chép. Vui lòng thử lại.': ['Unable to copy. Please try again.', '无法复制，请重试。'],
  'Không có quyền xem ID.': ['You do not have permission to view this ID.', '无权查看此 ID。'],
  'Chưa xác minh quyền xem ID.': ['Access to this ID has not been verified.', '尚未验证此 ID 的访问权限。'],
  'Chi tiết đối chiếu theo dữ liệu chứng từ đang hiển thị.': ['Details match the currently displayed document snapshot.', '详情与当前显示的单据快照一致。'],
  'Đã làm mới dữ liệu.': ['Data refreshed.', '数据已刷新。'],
  'Không thể mở chứng từ này.': ['This document cannot be opened.', '无法打开此单据。'],
  'Cái': ['pcs', '件'],
  'hồ sơ': ['cases', '单'],
  'phiếu': ['documents', '单'],
};
const english = { ...CATALOGUE_EN_COPY, ...Object.fromEntries(Object.entries(OVERVIEW_COPY).map(([vi, [en]]) => [vi, en])) };
export function overviewCopy<Value>(value: Value, language: ShellLanguage, values?: Readonly<Record<string, string | number>>): Value {
  const local = typeof value === 'string' && language === 'zh-CN' ? OVERVIEW_COPY[value]?.[1] : undefined;
  return local === undefined ? translateUiCopy(value, english, language, values) : (values ? local.replace(/\{(\w+)\}/g, (match, key: string) => key in values ? String(values[key]) : match) : local) as Value;
}
export function useOverviewCopy() {
  const { language } = useShellPreferences();
  return useCallback(<Value,>(value: Value, values?: Readonly<Record<string, string | number>>) => overviewCopy(value, language, values), [language]);
}
