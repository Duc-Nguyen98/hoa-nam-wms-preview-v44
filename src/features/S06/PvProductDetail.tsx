import { useEffect, useRef } from 'react';
import type { PvProduct } from '../../contracts/pv-products';
import { Button, Icon } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { revealControl } from '../../shared/focus';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

export const PV_DETAIL_COPY = {
  ...CATALOGUE_EN_COPY,
  'Chi tiết sản phẩm PV': 'PV product details',
  'Thông tin sản phẩm PV · Chỉ xem': 'PV product information · Read only',
  'Đóng chi tiết sản phẩm PV': 'Close PV product details',
  'Tình trạng ảnh': 'Image availability',
  'Chưa được cung cấp ảnh': 'Image not supplied',
  'Không có thông tin sản phẩm trong danh sách hiện tại.': 'Product information is not available in the current list.',
};

/** W4-04A: projection of an accepted source row, never a Product/SKU join. */
export function PvProductDetail({ row, origin, onClose }: { row?: PvProduct; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(PV_DETAIL_COPY), dialog = useRef<HTMLDialogElement>(null), backdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    const release = acquireBodyScrollLock();
    element.showModal();
    element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => { element.close(); release(); if (origin.isConnected) { origin.focus({ preventScroll: true }); revealControl(origin); } };
  }, [origin]);
  return <dialog ref={dialog} className="pv-detail" aria-labelledby="pv-detail-title" aria-describedby="pv-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const buttons = dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => { backdrop.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { backdrop.current = false; }}
    onClick={event => { if (backdrop.current && event.target === event.currentTarget) onClose(); backdrop.current = false; }}>
    <header className="pv-detail__header"><div><h2 id="pv-detail-title">{tx('Chi tiết sản phẩm PV')}</h2><p id="pv-detail-description">{tx('Thông tin sản phẩm PV · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết sản phẩm PV')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="pv-detail__body">{row ? <dl className="pv-detail__fields">
      <div><dt>{tx('Tên sản phẩm')}</dt><dd>{row.productName}</dd></div>
      <div><dt>{tx('Mã sản phẩm')}</dt><dd>{row.productCode}</dd></div>
      <div><dt>SKU</dt><dd>{row.sku}</dd></div>
      <div><dt>{tx('Nhóm sản phẩm')}</dt><dd>{row.productGroup}</dd></div>
      <div><dt>{tx('Hiển thị trên App PV')}</dt><dd aria-label={row.visibilityLabel === '—' ? tx('Trạng thái hiển thị chưa xác định') : undefined}>{tx(row.visibilityLabel)}</dd></div>
      <div><dt>{tx('Cập nhật')}</dt><dd>{row.updatedAtLabel}</dd></div>
      <div><dt>{tx('Tình trạng ảnh')}</dt><dd>{tx(row.missingImage ? 'Chưa có ảnh' : 'Chưa được cung cấp ảnh')}</dd></div>
    </dl> : <p role="status">{tx('Không có thông tin sản phẩm trong danh sách hiện tại.')}</p>}</div>
    <footer className="pv-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
  </dialog>;
}
