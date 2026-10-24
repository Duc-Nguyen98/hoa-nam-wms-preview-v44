import { useEffect, useRef } from 'react';
import type { ReceiptRow } from '../../contracts/receipts';
import { Button, Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { revealControl } from '../../shared/focus';
import { OPERATIONS_EN_COPY } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';

const DETAIL_COPY = {
  ...OPERATIONS_EN_COPY,
  'Chi tiết phiếu nhập': 'Receipt details',
  'Thông tin phiếu nhập · Chỉ xem': 'Receipt information · Read only',
  'Đóng chi tiết phiếu nhập': 'Close receipt details',
  'Mã phiếu nhập': 'Receipt code',
  'Tham chiếu': 'Reference',
  'Số SKU': 'SKU count',
  'Số mã ghi nhận': 'Recorded code count',
  'Không còn tìm thấy phiếu nhập trong danh sách đang hiển thị. Đóng chi tiết và tải lại danh sách để kiểm tra.': 'This receipt is no longer available in the displayed list. Close the details and reload the list to check again.',
};

/** W4-05A: selected-row projection only. No receipt lines, joins or Post authority. */
export function ReceiptDetail({ row, origin, onClose }: { row: ReceiptRow | null; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(DETAIL_COPY);
  const dialog = useRef<HTMLDialogElement>(null), backdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!, release = acquireBodyScrollLock();
    element.showModal(); element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      element.close(); release();
      const target = origin.isConnected ? origin : document.getElementById('s12-search');
      if (target) { target.focus({ preventScroll: true }); revealControl(target); }
    };
  }, [origin]);
  return <dialog ref={dialog} className="s12-detail" aria-labelledby="s12-detail-title" aria-describedby="s12-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      backdrop.current = event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    }}
    onPointerCancel={() => { backdrop.current = false; }}
    onClick={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (backdrop.current && event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose();
      backdrop.current = false;
    }}>
    <header className="s12-detail__header"><div><h2 id="s12-detail-title">{tx('Chi tiết phiếu nhập')}</h2><p id="s12-detail-description">{tx('Thông tin phiếu nhập · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết phiếu nhập')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="s12-detail__body">{row ? <dl className="s12-detail__fields">
      <div><dt>{tx('Mã phiếu nhập')}</dt><dd data-detail-field="receipt">{row.receipt}</dd></div>
      <div><dt>{tx('Nguồn nhập')}</dt><dd data-detail-field="source">{row.source}</dd></div>
      <div><dt>{tx('Tham chiếu')}</dt><dd data-detail-field="reference">{row.reference || '—'}</dd></div>
      <div><dt>{tx('Số SKU')}</dt><dd data-detail-field="skuCount">{row.skuCount}</dd></div>
      <div><dt>{tx('Số mã ghi nhận')}</dt><dd data-detail-field="codeCount">{row.codeCount}</dd></div>
      <div><dt>{tx('Người tạo')}</dt><dd data-detail-field="creator">{row.creator}</dd></div>
      <div><dt>{tx('Trạng thái')}</dt><dd data-detail-field="status"><StatusBadge tone={row.status === 'Đã nhập kho' ? 'success' : row.status === 'Đang ghi nhận' ? 'warning' : 'neutral'}>{tx(row.status)}</StatusBadge></dd></div>
      <div><dt>{tx('Cập nhật')}</dt><dd data-detail-field="updatedAt">{row.updatedAt}</dd></div>
    </dl> : <p role="status" data-detail-unavailable>{tx('Không còn tìm thấy phiếu nhập trong danh sách đang hiển thị. Đóng chi tiết và tải lại danh sách để kiểm tra.')}</p>}</div>
    <footer className="s12-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
  </dialog>;
}
