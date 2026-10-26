import { useEffect, useRef, type ReactNode } from 'react';
import { Button, Icon } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { SKU_CATALOG_COPY } from './sku-catalog-copy';

function dialogControls(element: HTMLDialogElement) {
  return [...element.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')]
    .filter(control => {
      // The shared toast viewport is moved into native dialogs, but its portal
      // owns a separate focus lifecycle and must not become this form's boundary.
      if (control.closest('.hn-global-toast-viewport,[inert],[hidden],[aria-hidden="true"]') || control.tabIndex < 0) return false;
      const bounds = control.getBoundingClientRect();
      const visibility = getComputedStyle(control).visibility;
      return control.getClientRects().length > 0 && bounds.width > 0 && bounds.height > 0
        && visibility !== 'hidden' && visibility !== 'collapse';
    });
}

/** Uses the S04 dialog geometry and the shared lock, buttons and focus semantics. */
export function SkuCatalogDialog({ title, description, origin, busy = false, onClose, children, footer }: {
  title: string; description?: string; origin: HTMLElement | null; busy?: boolean;
  onClose: () => void; children: ReactNode; footer: ReactNode;
}) {
  const tx = useUiCopy(SKU_CATALOG_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const backdrop = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    const release = acquireBodyScrollLock();
    element.showModal();
    dialogControls(element)[0]?.focus({ preventScroll: true });
    return () => {
      element.close(); release();
      const target = origin?.isConnected ? origin : document.querySelector<HTMLElement>('#sku-catalog-scope');
      target?.focus({ preventScroll: true });
    };
  }, [origin]);
  return <dialog ref={dialog} className="sku-detail sku-catalog-dialog" aria-labelledby="sku-catalog-dialog-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = dialogControls(event.currentTarget);
      if (!controls.length) { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); return; }
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onPointerDown={event => { backdrop.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { backdrop.current = false; }}
    onClick={event => {
      if (backdrop.current && event.target === event.currentTarget && !busy) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }
      backdrop.current = false;
    }}>
    <header className="sku-detail__header"><div><h2 id="sku-catalog-dialog-title">{tx(title)}</h2>{description && <p>{tx(description)}</p>}</div>
      <Button variant="ghost" iconOnly disabled={busy} aria-label={tx('Đóng')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="sku-detail__body">{children}</div>
    <footer className="sku-detail__footer">{footer}</footer>
  </dialog>;
}
