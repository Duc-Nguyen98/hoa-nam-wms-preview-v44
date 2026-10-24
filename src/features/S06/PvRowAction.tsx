import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from '../../shared';

// Notice is a compatibility emitter; visible feedback belongs to the global provider.
const feedbackSelector = '.hn-notice,.hn-global-toast';

/** Passive labels for the screen row actions, outside the scroll container. */
export function PvRowAction({ label, productCode, icon, onClick }: {
  label: string; productCode: string; icon: 'edit' | 'more' | 'eye'; onClick: () => void;
}) {
  const anchor = useRef<HTMLSpanElement>(null), tip = useRef<HTMLSpanElement>(null);
  const hovered = useRef(false), focused = useRef(false);
  const focusFrame = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const id = useId();
  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return;
    const bounds = anchor.current.getBoundingClientRect(), box = tip.current.getBoundingClientRect();
    const headerBottom = document.querySelector('.hn-header')?.getBoundingClientRect().bottom ?? 0;
    const group = anchor.current.closest('.pv-row-actions')!.getBoundingClientRect();
    const left = Math.max(12, Math.min(bounds.right - box.width, document.documentElement.clientWidth - box.width - 12));
    const controls = [...document.querySelectorAll<HTMLElement>('button,input,select,a[href],.hn-notice:not([data-suspended="true"]),.hn-global-toast')]
      .filter(e => e.getClientRects().length && !e.closest('[hidden],[inert]')).map(e => e.getBoundingClientRect());
    const position = [
      { x: left, y: bounds.top - box.height - 6 },
      { x: group.left - box.width - 8, y: bounds.top + (bounds.height - box.height) / 2 },
      { x: left, y: bounds.bottom + 6 },
    ].find(({ x, y }) => x >= 12 && x + box.width <= document.documentElement.clientWidth - 12 &&
      y >= headerBottom + 6 && y + box.height <= innerHeight - 12 && !controls.some(r =>
        x < r.right && x + box.width > r.left && y < r.bottom && y + box.height > r.top));
    if (!position || document.querySelector('dialog[open],.hn-header-popup')) { setOpen(false); return; }
    tip.current.style.left = `${position.x}px`;
    tip.current.style.top = `${position.y}px`;
    tip.current.style.visibility = 'visible';
  }, [open]);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  function cancelFocusHint() {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = null;
  }
  useEffect(() => {
    if (!open) return;
    const dismiss = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.isComposing) dismiss(); };
    const observer = new MutationObserver(records => {
      const noticeChanged = records.some(record => (record.target instanceof HTMLElement && record.target.closest(feedbackSelector)) ||
        [...record.addedNodes].some(node => node instanceof HTMLElement && (node.matches(feedbackSelector) || node.querySelector(feedbackSelector))));
      if (noticeChanged || document.querySelector('dialog[open],.hn-header-popup')) dismiss();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'style'] });
    document.addEventListener('scroll', dismiss, true);
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', dismiss);
    return () => {
      observer.disconnect();
      document.removeEventListener('scroll', dismiss, true);
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);
  return <span className="pv-action-anchor" ref={anchor}>
    <Button variant="ghost" className={`pv-icon-action pv-icon-action--${icon}`} aria-label={`${label} ${productCode}`} aria-describedby={open ? id : undefined}
      onPointerEnter={event => { if (event.pointerType !== 'touch') { hovered.current = true; setOpen(true); } }}
      onPointerLeave={() => { hovered.current = false; if (!focused.current) setOpen(false); }}
      onFocus={event => {
        focused.current = event.currentTarget.matches(':focus-visible');
        cancelFocusHint();
        // Let native focus and DataTable finish revealing the row before placing
        // its label. Opening earlier loses the label to that same scroll event.
        if (focused.current) focusFrame.current = requestAnimationFrame(() => {
          focusFrame.current = requestAnimationFrame(() => {
            focusFrame.current = null;
            if (focused.current && anchor.current?.contains(document.activeElement)) setOpen(true);
          });
        });
      }}
      onBlur={() => { cancelFocusHint(); focused.current = false; setOpen(false); }}
      onKeyDown={event => { if (event.key === 'Escape' && (open || focusFrame.current !== null) && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); cancelFocusHint(); setOpen(false); } }}
      onClick={() => { cancelFocusHint(); setOpen(false); onClick(); }}><Icon name={icon} size={18} /></Button>
    {open && createPortal(<span id={id} ref={tip} role="tooltip" className="pv-action-tip" style={{ left: 0, top: 0, visibility: 'hidden' }}>{label}</span>, document.body)}
  </span>;
}
