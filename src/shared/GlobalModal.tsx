import { useUiCopy } from '../i18n/use-ui-copy';
import { useEffect, useId, useRef } from 'react';
import type { DialogHTMLAttributes, ReactNode, Ref } from 'react';
import { Button } from './primitives';
import { Icon } from './Icon';
import { acquireBodyScrollLock } from './body-scroll-lock';
import { isModalControl, modalTabStops, modalKeyboardOwned } from './modal-focus';

export type GlobalModalSize = 'small' | 'medium' | 'large';

export interface GlobalModalProps extends Omit<DialogHTMLAttributes<HTMLDialogElement>, 'title' | 'onClose'> {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  size?: GlobalModalSize;
  /** Optional focus target for a form or detail view. */
  initialFocusRef?: Ref<HTMLElement>;
  /** Stable return target when a successful mutation removes the opening row. */
  resolveReturnFocus?: () => HTMLElement | null;
  /** Native ref escape hatch for callers that need to inspect the dialog. */
  dialogRef?: Ref<HTMLDialogElement>;
}

/**
 * Shared modal composition for detail, form and confirmation flows.
 *
 * It owns only presentation and keyboard mechanics. The caller owns the
 * operation, permissions and persistence contract.
 */
export function GlobalModal({
  open, title, description, children, footer, onClose, closeLabel = 'Đóng', size = 'medium',
  initialFocusRef, resolveReturnFocus, dialogRef, className = '', id, ...props
}: GlobalModalProps) {
  const tx = useUiCopy();
  const internalRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closingFromProp = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const setDialogRef = (element: HTMLDialogElement | null) => {
    internalRef.current = element;
    if (typeof dialogRef === 'function') dialogRef(element);
    else if (dialogRef && 'current' in dialogRef) dialogRef.current = element;
  };

  const focusFirst = () => {
    const dialog = internalRef.current;
    if (!dialog) return;
    const preferred = typeof initialFocusRef === 'object' ? initialFocusRef?.current : null;
    const controls = modalTabStops(dialog);
    const target = preferred && isModalControl(dialog, preferred) ? preferred : controls.find(element => element.hasAttribute('autofocus')) ?? controls[0];
    (target ?? dialog).focus({ preventScroll: true });
  };

  useEffect(() => {
    const dialog = internalRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
      }
      const frame = requestAnimationFrame(() => { if (dialog.isConnected && dialog.open) focusFirst(); });
      return () => cancelAnimationFrame(frame);
    }
    if (!open && dialog.open) {
      closingFromProp.current = true;
      dialog.close();
      closingFromProp.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    return acquireBodyScrollLock();
  }, [open]);

  const requestClose = () => {
    if (!open) return;
    onClose();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    props.onKeyDown?.(event);
    if (modalKeyboardOwned(event)) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      requestClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget;
    const controls = modalTabStops(dialog);
    if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); first.focus(); }
  };

  return <dialog
    {...props}
    ref={setDialogRef}
    id={id}
    className={`hn-global-modal hn-global-modal--${size} ${className}`}
    aria-labelledby={titleId}
    aria-describedby={description ? descriptionId : undefined}
    aria-modal="true"
    onKeyDown={handleKeyDown}
    onCancel={event => { event.preventDefault(); requestClose(); }}
    onClose={event => {
      if (!closingFromProp.current && open) onClose();
      const opener = openerRef.current;
      const available = (element: HTMLElement | null | undefined) => element?.isConnected
        && element.getClientRects().length && !element.matches(':disabled');
      const target = available(opener) ? opener : resolveReturnFocus?.();
      // Native close has released modal inertness. A caller's pre-close frame
      // can run too early and silently lose focus when its opener disappeared.
      if (available(target)) target!.focus({ preventScroll: true });
    }}
    onPointerDown={event => {
      props.onPointerDown?.(event);
      (event.currentTarget as HTMLDialogElement).dataset.hnBackdropDown = event.target === event.currentTarget ? 'true' : 'false';
    }}
    onClick={event => {
      props.onClick?.(event);
      const dialog = event.currentTarget;
      if (dialog.dataset.hnBackdropDown === 'true' && event.target === dialog) requestClose();
      delete dialog.dataset.hnBackdropDown;
    }}
  >
    <div className="hn-global-modal__surface">
      <header className="hn-global-modal__header">
        <div className="hn-global-modal__heading">
          <h2 id={titleId}>{tx(title)}</h2>
          {description && <p id={descriptionId}>{tx(description)}</p>}
        </div>
        <Button variant="ghost" iconOnly aria-label={tx(closeLabel)} className="hn-global-modal__close" onClick={requestClose}><Icon name="close" size={18} /></Button>
      </header>
      <div className="hn-global-modal__body">{children}</div>
      {footer && <footer className="hn-global-modal__footer">{footer}</footer>}
    </div>
  </dialog>;
}

