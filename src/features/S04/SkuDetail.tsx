import { useEffect, useRef } from 'react';
import type { SkuRow } from '../../contracts/skus';
import { Button, Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { revealSkuControl } from './sku-focus';

const DETAIL_EN_COPY = {
  ...CATALOGUE_EN_COPY,
  'Chi tiết SKU': 'SKU details',
  'Thông tin SKU · Chỉ xem': 'SKU information · Read only',
  'Đóng chi tiết SKU': 'Close SKU details',
  'Mã SKU': 'SKU code',
  'Tên sản phẩm': 'Product name',
  'Không còn tìm thấy SKU trong danh sách đang hiển thị. Đóng chi tiết và cập nhật danh sách để kiểm tra lại.': 'This SKU is no longer available in the displayed list. Close the details and refresh the list to check again.',
};

/** Owner W4-01B: seven accepted read-model fields only; no write or relation. */
export function SkuDetail({ row, origin, onClose }: { row: SkuRow | null; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(DETAIL_EN_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerOnBackdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    const release = acquireBodyScrollLock();
    element.showModal();
    element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      element.close(); release();
      const target = origin.isConnected ? origin : document.querySelector<HTMLElement>('#sku-search');
      if (target) { target.focus({ preventScroll: true }); revealSkuControl(target); }
    };
  }, [origin]);
  return <dialog ref={dialog} className="sku-detail" aria-labelledby="sku-detail-title" aria-describedby="sku-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const buttons = dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      pointerOnBackdrop.current = event.target === event.currentTarget &&
        (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    }}
    onPointerCancel={() => { pointerOnBackdrop.current = false; }}
    onClick={event => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (pointerOnBackdrop.current && event.target === event.currentTarget &&
        (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) onClose();
      pointerOnBackdrop.current = false;
    }}>
    <header className="sku-detail__header"><div><h2 id="sku-detail-title">{tx('Chi tiết SKU')}</h2><p id="sku-detail-description">{tx('Thông tin SKU · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết SKU')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="sku-detail__body">
      {row ? <dl className="sku-detail__fields">
        <div><dt>{tx('Mã SKU')}</dt><dd data-detail-field="code">{row.code}</dd></div>
        <div><dt>{tx('Tên sản phẩm')}</dt><dd data-detail-field="name">{row.name}</dd></div>
        <div><dt>{tx('Nhóm hàng')}</dt><dd data-detail-field="group">{row.group}</dd></div>
        <div><dt>{tx('Đơn vị tính')}</dt><dd data-detail-field="unit">{row.unit}</dd></div>
        <div><dt>{tx('Mã vạch')}</dt><dd data-detail-field="barcode" className="sku-detail__barcode">{row.barcode || '—'}</dd></div>
        <div><dt>{tx('Trạng thái')}</dt><dd data-detail-field="status"><StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.statusLabel)}</StatusBadge></dd></div>
        <div><dt>{tx('Cập nhật')}</dt><dd data-detail-field="updatedAt">{row.updatedAt}</dd></div>
      </dl> : <p role="status" data-detail-unavailable>{tx('Không còn tìm thấy SKU trong danh sách đang hiển thị. Đóng chi tiết và cập nhật danh sách để kiểm tra lại.')}</p>}
    </div>
    <footer className="sku-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
  </dialog>;
}
