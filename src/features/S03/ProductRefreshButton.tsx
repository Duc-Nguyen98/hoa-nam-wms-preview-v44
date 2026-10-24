import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

/** A description of the existing refresh action; touch still activates it once. */
export function ProductRefreshButton({ busy, onRefresh }: { busy: boolean; onRefresh: () => void }) {
  const tx = useUiCopy(CATALOGUE_EN_COPY);
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const [open, setOpen] = useState(false);
  const visible = open && !busy;

  useLayoutEffect(() => {
    if (!visible || !anchor.current || !tooltip.current) return;
    const bounds = anchor.current.getBoundingClientRect();
    const tip = tooltip.current;
    const box = tip.getBoundingClientRect();
    const margin = 16;
    const preferredTop = bounds.top - box.height - 6;
    tip.style.left = `${Math.max(margin, Math.min(bounds.right - box.width, document.documentElement.clientWidth - box.width - margin))}px`;
    tip.style.top = `${Math.max(margin, Math.min(preferredTop >= margin ? preferredTop : bounds.bottom + 6, innerHeight - box.height - margin))}px`;
    tip.style.visibility = 'visible';
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    const outsideFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target)) dismiss();
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('focusin', outsideFocus);
    document.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('focusin', outsideFocus);
      document.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [visible]);

  return <span ref={anchor} className="pr-refresh-control">
    <Button variant="ghost" className="pr-refresh" aria-label={tx("Cập nhật mới nhất")}
      aria-describedby={visible ? id : undefined} aria-busy={busy} disabled={busy}
      onPointerEnter={event => {
        if (event.pointerType === 'touch') return;
        hovered.current = true;
        setOpen(true);
      }}
      onPointerLeave={() => { hovered.current = false; if (!focused.current) setOpen(false); }}
      onFocus={event => {
        focused.current = event.currentTarget.matches(':focus-visible');
        if (focused.current) setOpen(true);
      }}
      onBlur={() => { focused.current = false; if (!hovered.current) setOpen(false); }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !visible) return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }}
      onClick={() => { setOpen(false); onRefresh(); }}
    ><Icon name="refresh" className={busy ? 'pr-refresh-spinner' : ''} /><span className="hn-sr-only">{tx("Cập nhật mới nhất")}</span></Button>
    {visible && createPortal(<div ref={tooltip} id={id} role="tooltip" className="pr-refresh-tooltip"
      style={{ top: 0, left: 0, visibility: 'hidden' }}>{tx("Làm mới danh sách")}</div>, document.body)}
  </span>;
}
