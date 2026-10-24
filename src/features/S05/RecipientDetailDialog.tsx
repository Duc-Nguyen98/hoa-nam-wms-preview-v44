import { useCallback, useEffect, useRef } from 'react';
import type { RecipientRow } from '../../contracts/recipients';
import { Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';

import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

const DETAIL_EN_COPY = { ...CATALOGUE_EN_COPY, "Chi tiết nơi nhận": "Recipient details", "Mã nơi nhận:": "Recipient code:", "Đóng chi tiết nơi nhận": "Close recipient details", "Khu vực": "Area", "Điện thoại": "Phone" };

/**
 * Read-only S05 detail surface. The fixture's code is the only stable identity
 * available to this screen; it is intentionally not presented as Scanner's
 * recipientId because that mapping is still a blocked source contract.
 */
export function RecipientDetailDialog({
  row,
  onClose,
}: {
  row: RecipientRow | null;
  onClose: () => void;
}) {
  const tx = useUiCopy(DETAIL_EN_COPY);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointerOnBackdrop = useRef(false);
  const focusFrame = useRef<number | undefined>(undefined);
  const releaseBodyLock = useRef<(() => void) | undefined>(undefined);
  const releaseResources = useCallback(() => {
    if (focusFrame.current !== undefined) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = undefined;
    const release = releaseBodyLock.current;
    releaseBodyLock.current = undefined;
    release?.();
  }, []);
  const closeDialog = () => {
    releaseResources();
    dialogRef.current?.close();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (row) {
      if (!dialog.open) dialog.showModal();
      releaseBodyLock.current = acquireBodyScrollLock();
      focusFrame.current = requestAnimationFrame(() => {
        focusFrame.current = undefined;
        if (dialog.open) closeRef.current?.focus({ preventScroll: true });
      });
    } else if (!row && dialog.open) {
      dialog.close();
    }
    return releaseResources;
  }, [row, releaseResources]);

  return (
    <dialog
      ref={dialogRef}
      className="hn-shell-dialog recipient-detail-dialog"
      data-recipient-code={row?.code}
      aria-labelledby="recipient-detail-title"
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
        const first = controls[0], last = controls.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onCancel={event => {
        event.preventDefault();
        closeDialog();
      }}
      onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }}
      onPointerCancel={() => { pointerOnBackdrop.current = false; }}
      onClick={event => {
        if (pointerOnBackdrop.current && event.target === event.currentTarget) closeDialog();
        pointerOnBackdrop.current = false;
      }}
      onClose={() => { releaseResources(); onClose(); }}
    >
      {row && (
        <div className="recipient-detail-dialog__panel">
          <header className="recipient-detail-dialog__header">
            <div>
              <p className="recipient-detail-dialog__eyebrow">{tx("Chi tiết nơi nhận")}</p>
              <h2 id="recipient-detail-title">{row.name}</h2>
              <p className="recipient-detail-dialog__code">{tx("Mã nơi nhận:")}{' '}<strong>{row.code}</strong></p>
            </div>
            <button ref={closeRef} type="button" className="hn-button hn-button--ghost recipient-detail-dialog__close" aria-label={tx("Đóng chi tiết nơi nhận")} onClick={closeDialog}>
              <Icon name="close" width={18} height={18} />
            </button>
          </header>
          <div className="recipient-detail-dialog__body">
            <dl className="recipient-detail-dialog__fields">
              <div><dt>{tx("Loại nơi nhận")}</dt><dd>{row.type}</dd></div>
              <div><dt>{tx("Thị trường")}</dt><dd>{row.market}</dd></div>
              <div><dt>{tx("Khu vực")}</dt><dd>{row.area}</dd></div>
              <div><dt>{tx("Người liên hệ")}</dt><dd>{row.contact}</dd></div>
              <div><dt>{tx("Điện thoại")}</dt><dd>{row.phone}</dd></div>
              <div><dt>{tx("Địa chỉ")}</dt><dd>{row.address}</dd></div>
              <div><dt>{tx("Trạng thái")}</dt><dd><StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.statusLabel)}</StatusBadge></dd></div>
            </dl>
          </div>
          <footer className="recipient-detail-dialog__footer">
            <button type="button" className="hn-button hn-button--secondary" onClick={closeDialog}>{tx("Đóng")}</button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
