import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

/** Passive help for the existing refresh action; it never changes query state. */
export function SkuRefreshButton({ busy, onRefresh }: { busy: boolean; onRefresh: () => void }) {
  const tx = useUiCopy(CATALOGUE_EN_COPY);
  const anchor = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const [open, setOpen] = useState(false);
  const visible = open && !busy;

  useLayoutEffect(() => {
    if (!visible || !anchor.current || !tooltip.current) return;
    let frame: number | null = null;
    const place = () => {
      const trigger = anchor.current;
      const tip = tooltip.current;
      if (!trigger?.isConnected || !tip?.isConnected) return;
      if (document.querySelector('dialog[open]')) { setOpen(false); return; }
      const bounds = trigger.getBoundingClientRect();
      const box = tip.getBoundingClientRect();
      const margin = 16;
      const left = Math.max(margin, Math.min(bounds.right - box.width, document.documentElement.clientWidth - box.width - margin));
      const controls = [...document.querySelectorAll<HTMLElement>('button,input,select,a[href]')]
        .filter(element => !element.closest('[hidden],[inert]') && element.getClientRects().length)
        .map(element => element.getBoundingClientRect());
      const positions = [bounds.top - box.height - 6, bounds.bottom + 6];
      const top = positions.find(y => y >= margin && y + box.height <= innerHeight - margin && !controls.some(rect =>
        left < rect.right && left + box.width > rect.left && y < rect.bottom && y + box.height > rect.top));
      // An accessible name remains available when a narrow layout has no free space.
      if (top === undefined) { setOpen(false); return; }
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
      tip.style.visibility = 'visible';
    };
    const schedulePlacement = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; place(); });
    };
    // Text spacing and disclosure changes can move the trigger without a window resize.
    const observer = new ResizeObserver(schedulePlacement);
    for (const element of [anchor.current, tooltip.current, anchor.current.closest('.sku-filters'), anchor.current.closest('.sku-screen')]) {
      if (element) observer.observe(element);
    }
    place();
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.isComposing) dismiss(); };
    const outsideFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target)) dismiss();
    };
    const observer = new MutationObserver(() => { if (document.querySelector('dialog[open]')) dismiss(); });
    observer.observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true, childList: true });
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('focusin', outsideFocus);
    document.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('focusin', outsideFocus);
      document.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [visible]);

  return <span ref={anchor} className="sku-refresh-control">
    <Button variant="ghost" className="sku-refresh" aria-label={tx("Cập nhật mới nhất")}
      aria-describedby={visible ? 'sku-refresh-tooltip' : undefined} aria-busy={busy} disabled={busy}
      onPointerEnter={event => { if (event.pointerType !== 'touch') { hovered.current = true; setOpen(true); } }}
      onPointerLeave={() => { hovered.current = false; if (!focused.current) setOpen(false); }}
      onFocus={event => { focused.current = event.currentTarget.matches(':focus-visible'); if (focused.current) setOpen(true); }}
      onBlur={() => { focused.current = false; if (!hovered.current) setOpen(false); }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || event.nativeEvent.isComposing || !visible || document.querySelector('dialog[open]')) return;
        event.preventDefault(); event.stopPropagation(); setOpen(false);
      }}
      onClick={() => { setOpen(false); onRefresh(); }}
    ><Icon name="refresh" className={busy ? 'sku-refresh-spinner' : ''} /></Button>
    {visible && createPortal(<div ref={tooltip} id="sku-refresh-tooltip" role="tooltip" className="sku-refresh-tooltip"
      style={{ top: 0, left: 0, visibility: 'hidden' }}>{tx("Cập nhật mới nhất")}</div>, document.body)}
  </span>;
}
