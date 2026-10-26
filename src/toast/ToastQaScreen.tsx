import { useRef } from 'react';
import { GlobalShell } from '../shared/GlobalShell';
import { S00_SHELL_NAVIGATION } from '../shared/s00-navigation';
import { useShellPreferences } from '../shared/shell-preferences';
import { useGlobalToast } from './GlobalToastProvider';
import type { ToastTone } from './toast-store';
import { TOAST_COPY } from './toast-copy';

const samples = {
  vi: { success: 'Dữ liệu đã được cập nhật thành công.', error: 'Không thể lưu dữ liệu. Vui lòng thử lại.', warning: 'Một số thông tin chưa được xác nhận.', info: 'Dữ liệu mới đã sẵn sàng để xem.' },
  en: { success: 'The data has been updated successfully.', error: 'Unable to save the data. Please try again.', warning: 'Some information has not been confirmed.', info: 'New data is ready to view.' },
  'zh-CN': { success: '数据已成功更新。', error: '无法保存数据，请重试。', warning: '部分信息尚未确认。', info: '新数据已可查看。' },
};

/** Preview-only diagnostics, exercising the same root provider as all business screens. */
export function ToastQaScreen() {
  const { language, theme, setLanguage, setTheme } = useShellPreferences();
  const en = language === 'en', locale = language;
  const toast = useGlobalToast(), sequence = useRef(0), dialog = useRef<HTMLDialogElement>(null);
  const emit = (tone: ToastTone, unique = false) => toast.notify({ tone, message: lang => samples[lang][tone], dedupeKey: unique ? `qa:${++sequence.current}` : `qa:${tone}`, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  return <GlobalShell title="QA · Global Toast" variant="wms" navigation={S00_SHELL_NAVIGATION}>
    <section className="hn-toast-qa" aria-label="QA · Global Toast" style={{ maxWidth: 960, margin: '32px auto', padding: 24 }}>
      <h1>QA · Global Toast</h1><p>MOCK · {en ? 'Animation samples only. These buttons do not save business data or prove API integration.' : 'Chỉ minh họa hiệu ứng. Các nút này không lưu dữ liệu nghiệp vụ và không chứng minh tích hợp API.'}</p>
      <p><a href="./release.html">Build / Revision</a> · <a href="#/preview/S01">{en ? 'Main Preview' : 'Preview chính'}</a></p>
      <p>{en ? 'One shared provider · 350 ms entrance · 3,000 ms lifetime · 300 ms exit. Owner review pending.' : 'Một provider dùng chung · vào 350 ms · tự đóng 3.000 ms · thoát 300 ms. Chờ Owner nghiệm thu.'}</p>
      <div className="hn-toast-qa-actions">
        {(['success', 'error', 'warning', 'info'] as const).map(tone => <button type="button" className="hn-button" key={tone} data-toast-demo={tone} onClick={() => emit(tone)}>{TOAST_COPY[locale].titles[tone]}</button>)}
        <button type="button" className="hn-button" data-toast-demo="stack" onClick={() => { emit('info', true); emit('warning', true); emit('success', true); }}>{en ? 'Show three' : 'Hiện ba Toast'}</button>
        <button type="button" className="hn-button" data-toast-demo="burst" onClick={() => { for (let i = 0; i < 25; i++) emit('info', true); }}>{en ? 'Test bounded queue' : 'Kiểm tra hàng đợi giới hạn'}</button>
        <button type="button" className="hn-button" data-toast-demo="duplicate" onClick={() => { emit('info'); emit('info'); }}>{en ? 'Repeat same event' : 'Lặp cùng sự kiện'}</button>
        <button type="button" className="hn-button" data-toast-demo="long" onClick={() => toast.notify({ tone: 'info', message: lang => ({vi:'Kiểm tra thông báo dài trong Preview: ',en:'Preview diagnostic with a long message: ','zh-CN':'预览长通知测试：'})[lang] + 'DEMO-ONLY-'.repeat(24), dedupeKey: 'qa:long' })}>{en ? 'Long message' : 'Nội dung dài'}</button>
        <button type="button" className="hn-button" data-toast-demo="dialog" onClick={() => dialog.current?.showModal()}>{en ? 'Open test dialog' : 'Mở Dialog kiểm tra'}</button>
      </div>
      <div className="hn-toast-qa-actions"><button type="button" className="hn-button" data-toast-demo="language" onClick={() => setLanguage(language === 'vi' ? 'en' : language === 'en' ? 'zh-CN' : 'vi')}>VI / EN / 简体中文</button><button type="button" className="hn-button" data-toast-demo="theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Light / Dark</button></div>
      <dialog ref={dialog} aria-labelledby="toast-qa-dialog-title"><h2 id="toast-qa-dialog-title">{en ? 'Feedback while dialog is open' : 'Thông báo khi Dialog đang mở'}</h2><p>{en ? 'Feedback uses the shared overlay and protects this dialog and its focus. A missing safe gap remains a QA failure.' : 'Thông báo dùng overlay chung, bảo vệ Dialog và focus. Trường hợp thiếu vùng an toàn vẫn là lỗi QA.'}</p><button type="button" data-toast-demo="queued" onClick={() => emit('info', true)}>{en ? 'Emit event' : 'Phát sự kiện'}</button><button type="button" data-toast-demo="dialog-close" onClick={() => dialog.current?.close()}>{en ? 'Close dialog' : 'Đóng Dialog'}</button></dialog>
    </section>
  </GlobalShell>;
}
