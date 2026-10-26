import { useEffect, useRef } from 'react';
import type { ProductRow } from '../../contracts/products';
import { Button, Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { revealProductControl } from './product-focus';

import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

const DETAIL_EN_COPY = { ...CATALOGUE_EN_COPY, "Chi tiết sản phẩm": "Product details", "Thông tin sản phẩm · Chỉ xem": "Product information · Read only", "Đóng chi tiết sản phẩm": "Close product details", "Danh sách SKU liên kết hiện chưa khả dụng.": "The linked SKU list is not available yet.", "Xem danh sách SKU": "View SKU list", "Bạn vẫn có thể xem số SKU trong thông tin sản phẩm.": "The SKU count is available in the product information." };

/** Read-only projection of the accepted row. No entity lookup or SKU relation is inferred. */
export function ProductDetail({ row, origin, onClose }: { row: ProductRow; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(DETAIL_EN_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerOnBackdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    const releaseBodyScrollLock = acquireBodyScrollLock();
    element.showModal();
    element.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      element.close();
      releaseBodyScrollLock();
      if (origin.isConnected) { origin.focus({ preventScroll: true }); revealProductControl(origin); }
    };
  }, [origin]);
  return <dialog ref={dialog} className="pr-detail" aria-labelledby="pr-detail-title" aria-describedby="pr-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const buttons = dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { pointerOnBackdrop.current = false; }}
    onClick={event => { if (pointerOnBackdrop.current && event.target === event.currentTarget) onClose(); pointerOnBackdrop.current = false; }}>
    <header className="pr-detail__header"><div><h2 id="pr-detail-title">{tx("Chi tiết sản phẩm")}</h2><p id="pr-detail-description">{tx("Thông tin sản phẩm · Chỉ xem")}</p></div><Button variant="ghost" iconOnly aria-label={tx("Đóng chi tiết sản phẩm")} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="pr-detail__body">
      <dl className="pr-detail__fields">
        <div><dt>{tx("Mã sản phẩm")}</dt><dd>{row.code}</dd></div>
        <div><dt>{tx("Tên sản phẩm")}</dt><dd>{row.name}</dd></div>
        <div><dt>{tx("Nhóm hàng")}</dt><dd>{row.group}</dd></div>
        <div><dt>{tx("Số SKU")}</dt><dd>{row.skuCount}</dd></div>
        <div><dt>{tx("Đơn vị tính")}</dt><dd>{row.unit}</dd></div>
        <div><dt>{tx("Trạng thái")}</dt><dd><StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.statusLabel)}</StatusBadge></dd></div>
        <div><dt>{tx("Cập nhật")}</dt><dd>{row.updatedAt}</dd></div>
      </dl>
      <section className="pr-detail__relation" aria-labelledby="pr-detail-sku-title"><h3 id="pr-detail-sku-title">{tx("SKU liên kết")}</h3><p>{tx("Danh sách SKU liên kết hiện chưa khả dụng.")}</p><Button variant="secondary" disabled aria-describedby="pr-detail-sku-help">{tx("Xem danh sách SKU")}</Button><p id="pr-detail-sku-help">{tx("Bạn vẫn có thể xem số SKU trong thông tin sản phẩm.")}</p></section>
    </div>
    <footer className="pr-detail__footer"><Button onClick={onClose}>{tx("Đóng")}</Button></footer>
  </dialog>;
}
