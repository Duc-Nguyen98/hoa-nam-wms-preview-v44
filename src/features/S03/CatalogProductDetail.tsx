import { useEffect, useRef } from 'react';
import type { CatalogSnapshot } from '../../contracts/catalog-create';
import { Button, Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { useShellPreferences } from '../../shared/shell-preferences';
import { PRODUCT_CATALOG_COPY } from './catalog-copy';
import { revealProductControl } from './product-focus';
import { formatCatalogTimestamp } from './catalog-products';
import { catalogDialogControls } from './catalog-focus';

export function CatalogProductDetail({ snapshot, id, origin, onClose }: { snapshot: CatalogSnapshot; id: string; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(PRODUCT_CATALOG_COPY);
  const { language } = useShellPreferences();
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerOnBackdrop = useRef(false);
  const row = snapshot.products.find(product => product.id === id);
  const skus = snapshot.skus.filter(sku => sku.productId === id);
  useEffect(() => {
    const element = dialog.current!;
    const unlock = acquireBodyScrollLock(); element.showModal();
    element.querySelector<HTMLButtonElement>('button')?.focus();
    return () => { element.close(); unlock(); if (origin.isConnected) { origin.focus({ preventScroll: true }); revealProductControl(origin); } };
  }, [origin]);
  return <dialog ref={dialog} className="pr-detail" aria-labelledby="pr-catalog-detail-title" aria-describedby="pr-catalog-detail-description" data-catalog-product-id={id}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = catalogDialogControls(event.currentTarget);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }} onPointerCancel={() => { pointerOnBackdrop.current = false; }}
    onClick={event => { if (pointerOnBackdrop.current && event.target === event.currentTarget) onClose(); pointerOnBackdrop.current = false; }}>
    <header className="pr-detail__header"><div><h2 id="pr-catalog-detail-title">{tx('Chi tiết sản phẩm')}</h2><p id="pr-catalog-detail-description">{tx('Thông tin sản phẩm · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết sản phẩm')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="pr-detail__body">{!row ? <p role="alert">{tx('Không tìm thấy hồ sơ trong dữ liệu hiện tại.')}</p> : <>
      <dl className="pr-detail__fields">
        <div className="pr-catalog-id"><dt>{tx('ID sản phẩm')}</dt><dd>{row.id}</dd></div>
        <div><dt>{tx('Mã sản phẩm')}</dt><dd>{row.code}</dd></div><div><dt>{tx('Tên sản phẩm')}</dt><dd>{row.name}</dd></div>
        <div><dt>{tx('Nhóm hàng')}</dt><dd>{row.group}</dd></div><div><dt>{tx('Đơn vị tính')}</dt><dd>{row.unit}</dd></div>
        <div><dt>{tx('Số SKU')}</dt><dd>{row.skuCount}</dd></div><div><dt>{tx('Phiên bản')}</dt><dd>{row.version}</dd></div>
        <div><dt>{tx('Trạng thái')}</dt><dd><StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.status === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng')}</StatusBadge></dd></div>
        <div><dt>{tx('Ngày tạo')}</dt><dd>{formatCatalogTimestamp(row.createdAt, language)}</dd></div>
        <div><dt>{tx('Cập nhật')}</dt><dd>{formatCatalogTimestamp(row.updatedAt, language)}</dd></div>
      </dl>
      <section className="pr-detail__relation" aria-labelledby="pr-catalog-sku-title"><h3 id="pr-catalog-sku-title">{tx('SKU liên kết')}</h3>
        {!skus.length ? <p>{tx('Chưa có SKU liên kết.')}</p> : <ul className="pr-catalog-skus">{skus.map(sku => <li key={sku.id}>
          <strong>{sku.code}</strong><p>{tx('ID SKU')}: {sku.id}</p><p>{sku.name} · {sku.group} · {sku.unit}</p>
          <p>{tx('Mã vạch')}: {sku.barcode ?? tx('Không có')}</p><StatusBadge tone={sku.status === 'active' ? 'success' : 'neutral'}>{tx(sku.status === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng')}</StatusBadge>
        </li>)}</ul>}
      </section>
    </>}</div>
    <footer className="pr-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
  </dialog>;
}
