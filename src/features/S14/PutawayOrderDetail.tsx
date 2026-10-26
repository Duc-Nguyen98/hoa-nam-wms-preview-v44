import { useEffect, useRef } from 'react';
import type { PutawayOrderRow } from '../../contracts/putaway-orders';
import { Button, Icon } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { revealControl } from '../../shared/focus';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { OPERATIONS_EN_COPY } from '../../i18n/operations-copy';
export const PUTAWAY_DETAIL_COPY = {
  'Chi tiết {detail} lệnh trong tổng hợp {aggregate} lệnh.': 'Detail set: {detail} orders; aggregate: {aggregate} orders.',
  ...OPERATIONS_EN_COPY,
  'Phiên bản': 'Version',
  'Chi tiết lệnh xếp khay': 'Putaway order details',
  'Thông tin lệnh · Chỉ xem': 'Order information · Read only',
  'Đóng chi tiết lệnh': 'Close order details',
  'Tiếp tục chưa khả dụng.': 'Continue is not available.',
  'Không có thông tin lệnh trong danh sách hiện tại.': 'Order information is not available in the current list.',
};
/** Approved selected-row projection only; no membership, location or stock is inferred. */
export function PutawayOrderDetail({ row, origin, onClose }: { row?: PutawayOrderRow; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(PUTAWAY_DETAIL_COPY), dialog = useRef<HTMLDialogElement>(null), backdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!, release = acquireBodyScrollLock();
    element.showModal(); element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => { element.close(); release(); if (origin.isConnected) { origin.focus({ preventScroll: true }); revealControl(origin); } };
  }, [origin]);
  return <dialog ref={dialog} className="s14-detail" aria-labelledby="s14-detail-title" aria-describedby="s14-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const buttons = dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'), first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => { backdrop.current = event.target === event.currentTarget; }} onPointerCancel={() => { backdrop.current = false; }}
    onClick={event => { if (backdrop.current && event.target === event.currentTarget) onClose(); backdrop.current = false; }}>
    <header className="s14-detail__header"><div><h2 id="s14-detail-title">{tx('Chi tiết lệnh xếp khay')}</h2><p id="s14-detail-description">{tx('Thông tin lệnh · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết lệnh')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="s14-detail__body">{row ? <dl className="s14-detail__fields">
      <div><dt>{tx('Mã lệnh')}</dt><dd>{row.orderCode}</dd></div>
      <div><dt>{tx('Mã BOX')}</dt><dd>{row.boxCode}</dd></div>
      <div><dt>SKU</dt><dd>{row.sku}</dd></div>
      <div><dt>{tx('Phiếu nhập nguồn')}</dt><dd>{row.sourceReceipt}</dd></div>
      <div><dt>{tx('Khay đích')}</dt><dd>{tx(row.destinationTray)}</dd></div>
      <div><dt>{tx('Số lượng')}</dt><dd>{row.quantity}</dd></div>
      <div><dt>{tx('Trạng thái')}</dt><dd>{tx(row.status)}</dd></div>
      <div><dt>{tx('Cập nhật')}</dt><dd>{row.updatedAt}</dd></div>
      <div><dt>{tx('Phiên bản')}</dt><dd>{row.version}</dd></div>
    </dl> : <p role="status">{tx('Không có thông tin lệnh trong danh sách hiện tại.')}</p>}</div>
    <footer className="s14-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
  </dialog>;
}
