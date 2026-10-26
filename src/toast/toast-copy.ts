import type { ToastTone } from './toast-store';
export const TOAST_COPY = {
  vi: { region: 'Thông báo tạm thời', close: 'Đóng thông báo', titles: { success: 'Thao tác thành công', error: 'Có lỗi xảy ra', warning: 'Cần kiểm tra', info: 'Thông báo hệ thống' } },
  en: { region: 'Transient notifications', close: 'Close notification', titles: { success: 'Action successful', error: 'Something went wrong', warning: 'Please check', info: 'System notification' } },
  'zh-CN': { region: '临时通知', close: '关闭通知', titles: { success: '操作成功', error: '发生错误', warning: '请检查', info: '系统通知' } },
} satisfies Record<string, { region: string; close: string; titles: Record<ToastTone, string> }>;
export const TOAST_SYMBOLS: Record<ToastTone, string> = { success: '✓', error: '✕', warning: '!', info: 'i' };
