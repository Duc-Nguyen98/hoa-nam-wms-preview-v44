import { useUiCopy } from '../../i18n/use-ui-copy';
import { useShellPreferences } from '../../shared/shell-preferences';

const EN: Record<string, string> = {
  'Theo dõi thao tác và truy vết sự kiện. Dữ liệu trong phạm vi được cấp. Giờ Việt Nam.': 'Track operations and trace events within your authorized scope. Vietnam time.',
  'Đang đọc lại nhật ký…': 'Refreshing audit…',
};
const ZH: Record<string, string> = {
  'Nhật ký hệ thống': '系统日志', 'Hệ thống': '系统', 'Danh sách sự kiện': '事件列表',
  'Theo dõi thao tác và truy vết sự kiện. Dữ liệu trong phạm vi được cấp. Giờ Việt Nam.': '跟踪操作并追溯事件。仅显示授权范围内的数据。越南时间。',
  'Theo dõi các sự kiện đã ghi nhận trong phạm vi snapshot được cấp.': '查看授权快照范围内记录的事件。',
  'Nhật ký phiên hiện tại': '当前会话日志', 'Nhật ký tham chiếu': '参考日志', 'Nhật ký hồ sơ PV': 'PV 档案日志',
  'Nhật ký các giao dịch đã ghi nhận trong phiên hiện tại; không bao gồm lịch sử phiên đã lưu trữ.': '当前会话中已记录的交易；不包括已归档的会话历史。',
  'Phạm vi · Giờ Việt Nam': '日期范围 · 越南时间', 'Đọc lại nhật ký': '重新读取日志',
  'Đang kiểm tra nguồn nhật ký…': '正在检查日志来源…', 'Đang đọc lại nhật ký…': '正在重新读取日志…',
  'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.': '请选择最近 90 天内且不晚于今天的日期范围。',
  'Chưa có phiên làm việc.': '没有活动会话。',
  'Mã commit, bút toán và mã liên quan nằm trong chi tiết sự kiện.': '提交 ID、库存分录和关联 ID 可在事件详情中查看。',
  'Mã sự kiện, mã lệnh và mã commit nằm trong chi tiết.': '事件 ID、命令 ID 和提交 ID 可在详情中查看。',
  'Thời gian': '时间', 'Hoạt động': '活动', 'Hành động': '操作', 'Người thao tác': '操作人',
  'Nguồn thực hiện': '执行来源', 'Đối tượng': '对象', 'Phiên bản': '版本', 'Xem chi tiết': '查看详情',
  'Xem chi tiết sự kiện {v0}': '查看事件详情 {v0}', 'kết quả': '条结果', 'sự kiện': '个事件',
  'Sắp xếp nhật ký': '日志排序', 'Thời gian · Mới nhất': '时间 · 最新优先', 'Thời gian · Cũ nhất': '时间 · 最早优先',
  'Người thao tác · A–Z': '操作人 · A–Z', 'Người thao tác · Z–A': '操作人 · Z–A',
  'Mã sự kiện · Tăng dần': '事件 ID · 升序', 'Mã sự kiện · Giảm dần': '事件 ID · 降序',
  'Tìm và lọc nhật ký hệ thống': '搜索和筛选系统日志', 'Tìm trong nhật ký…': '搜索日志…',
  'Tìm mã sự kiện, đối tượng, lệnh, commit, biến động hoặc người thao tác': '搜索事件、对象、命令、提交、库存变动 ID 或操作人',
  'Tìm chuỗi con, không phân biệt hoa thường hoặc dấu.': '搜索部分文字，不区分大小写或变音符号。',
  'Tất cả hành động': '全部操作', 'Phân hệ': '模块', 'Tất cả phân hệ': '全部模块', 'Tất cả người thao tác': '全部操作人',
  'Chưa có nguồn phân hệ để lọc; bộ lọc sẽ được mở khi mapping được xác nhận.': '当前来源不提供模块信息；确认映射后将启用此筛选。',
  'Chưa thể áp dụng bộ lọc. Đặt lại bộ lọc để tiếp tục.': '无法应用筛选，请重置筛选后继续。',
  'Danh sách nhật ký hệ thống': '系统日志列表', 'Chưa có sự kiện trong kỳ đã chọn.': '所选日期范围内没有事件。',
  'Không có sự kiện phù hợp trong kỳ đã chọn.': '所选日期范围内没有匹配事件。',
  'Bạn không có quyền xem chi tiết sự kiện này trong phiên hiện tại.': '您在当前会话中无权查看此事件详情。',
  'Nguồn nhật ký hiện chưa khả dụng.': '日志来源当前不可用。',
  'Sự kiện không còn khả dụng trong phạm vi hiện tại.': '此事件在当前范围内已不可用。',
  'Chưa tải được chi tiết sự kiện. Đọc lại dữ liệu để thử lại.': '无法加载事件详情。请重新读取数据以重试。',
  'Chưa xác minh được tính đầy đủ của sự kiện và các mã liên quan. Đọc lại dữ liệu để thử lại.': '无法验证事件及关联 ID 的完整性。请重新读取数据以重试。',
};

/** Local context avoids translating technical identifiers or changing shared Activity meanings. */
export function useAuditCopy(english: Readonly<Record<string, string>> = {}) {
  const shared = useUiCopy({ ...EN, ...english });
  const { language } = useShellPreferences();
  return (source: string, values?: Readonly<Record<string, string | number>>) => {
    const result = language === 'zh-CN' ? ZH[source] ?? shared(source) : shared(source);
    return values ? result.replace(/\{(\w+)\}/g, (match, key: string) => key in values ? String(values[key]) : match) : result;
  };
}
