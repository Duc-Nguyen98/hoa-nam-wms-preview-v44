import { useEffect, useRef } from 'react';
import type { TrayRow } from '../../contracts/trays';
import { Button, Icon } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { revealControl } from '../../shared/focus';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { OPERATIONS_EN_COPY } from '../../i18n/operations-copy';

export const TRAY_DETAIL_COPY = {
  ...OPERATIONS_EN_COPY,
  'Chi tiết khay': 'Tray details',
  'Thông tin khay · Chỉ xem': 'Tray information · Read only',
  'Đóng chi tiết khay': 'Close tray details',
  'BOX và thông tin liên quan': 'BOX and related information',
  'Chưa có dữ liệu danh sách BOX, SKU liên kết, trạng thái và vị trí của khay.': 'BOX membership, linked SKU, tray status and location data are not available.',
  'Danh sách BOX và thông tin liên quan chưa khả dụng.': 'BOX membership and related information are not available.',
};

/** Accepted-row projection only. Counts never establish BOX/SKU membership. */
export function TrayDetail({ row, origin, onClose }: { row: TrayRow; origin: HTMLElement; onClose: () => void }) {
  const tx = useUiCopy(TRAY_DETAIL_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerOnBackdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    const releaseScrollLock = acquireBodyScrollLock();
    element.showModal();
    element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      element.close();
      releaseScrollLock();
      if (origin.isConnected) { origin.focus({ preventScroll: true }); revealControl(origin); }
    };
  }, [origin]);
  return <dialog ref={dialog} className="s11-detail" aria-labelledby="s11-detail-title" aria-describedby="s11-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const controls = dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { pointerOnBackdrop.current = false; }}
    onClick={event => { if (pointerOnBackdrop.current && event.target === event.currentTarget) onClose(); pointerOnBackdrop.current = false; }}>
    <header className="s11-detail__header"><div><h2 id="s11-detail-title">{tx('Chi tiết khay')}</h2><p id="s11-detail-description">{tx('Thông tin khay · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết khay')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="s11-detail__body">
      <dl className="s11-detail__fields">
        <div><dt>{tx('Mã khay')}</dt><dd>{row.trayCode}</dd></div>
        <div><dt>{tx('Số BOX')}</dt><dd>{row.boxCount}</dd></div>
        <div><dt>{tx('Số SKU')}</dt><dd>{row.skuCount}</dd></div>
        <div><dt>{tx('Lệnh xếp khay gần nhất')}</dt><dd>{row.latestPackingOrder ?? '—'}</dd></div>
        <div><dt>{tx('Cập nhật')}</dt><dd>{row.updatedAtLabel}</dd></div>
      </dl>
      <section className="s11-detail__unavailable" aria-labelledby="s11-detail-relations"><h3 id="s11-detail-relations">{tx('BOX và thông tin liên quan')}</h3><p>{tx('Chưa có dữ liệu danh sách BOX, SKU liên kết, trạng thái và vị trí của khay.')}</p></section>
    </div>
    <footer className="s11-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
  </dialog>;
}
