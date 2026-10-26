import { useUiCopy } from '../i18n/use-ui-copy';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './primitives';
import { Icon } from './Icon';

/** Passive help for the existing refresh action, shared by the catalogues. */
export function RefreshButton({ busy, onRefresh }: { busy: boolean; onRefresh: () => void }) {
  const tx = useUiCopy();
  const anchor = useRef<HTMLSpanElement>(null), tooltip = useRef<HTMLSpanElement>(null);
  const hovered = useRef(false), focused = useRef(false);
  const [open, setOpen] = useState(false);
  const id = useId(), visible = open && !busy;
  useLayoutEffect(() => {
    if (!visible) return;
    let frame: number | null = null;
    const place = () => {
      const trigger = anchor.current, tip = tooltip.current;
      if (!trigger || !tip) return;
      const bounds = trigger.getBoundingClientRect(), box = tip.getBoundingClientRect();
      const margin = 12, headerBottom = document.querySelector('.hn-header')?.getBoundingClientRect().bottom ?? 0;
      const left = Math.max(margin, Math.min(bounds.right - box.width, document.documentElement.clientWidth - box.width - margin));
      const controls = [...document.querySelectorAll<HTMLElement>('button,input,select,a[href]')]
        .filter(e => e.getClientRects().length && !e.closest('[hidden],[inert]')).map(e => e.getBoundingClientRect());
      const top = [bounds.top - box.height - 8, bounds.bottom + 8].find(y =>
        y >= headerBottom + 6 && y + box.height <= innerHeight - margin && !controls.some(r =>
          left < r.right && left + box.width > r.left && y < r.bottom && y + box.height > r.top));
      if (top === undefined) { setOpen(false); return; }
      tip.style.left = `${left}px`; tip.style.top = `${top}px`; tip.style.visibility = 'visible';
    };
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(() => { frame = null; place(); }); };
    const observer = new ResizeObserver(schedule);
    for (const e of [anchor.current, tooltip.current, anchor.current?.closest('.hn-catalogue-toolbar')]) if (e) observer.observe(e);
    place();
    return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const dismiss = () => setOpen(false);
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.isComposing) dismiss(); };
    const observer = new MutationObserver(() => { if (document.querySelector('dialog[open],.hn-header-popup')) dismiss(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    document.addEventListener('scroll', dismiss, true); window.addEventListener('resize', dismiss);
    document.addEventListener('pointerdown', dismiss, true); document.addEventListener('keydown', escape);
    return () => { observer.disconnect(); document.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss); document.removeEventListener('pointerdown', dismiss, true); document.removeEventListener('keydown', escape); };
  }, [visible]);
  return <span ref={anchor} className="hn-refresh-wrap"><Button variant="secondary" className="hn-refresh"
    aria-label={tx("Cập nhật mới nhất")} aria-describedby={visible ? id : undefined} aria-busy={busy} disabled={busy}
    onPointerEnter={e => { if (e.pointerType !== 'touch') { hovered.current = true; setOpen(true); } }}
    onPointerLeave={() => { hovered.current = false; if (!focused.current) setOpen(false); }}
    onFocus={e => { focused.current = e.currentTarget.matches(':focus-visible'); if (focused.current) setOpen(true); }}
    onBlur={() => { focused.current = false; setOpen(false); }}
    onKeyDown={e => { if (e.key === 'Escape' && !e.nativeEvent.isComposing && visible) { e.preventDefault(); e.stopPropagation(); setOpen(false); } }}
    onClick={() => { setOpen(false); onRefresh(); }}><Icon name="refresh" /></Button>
    {visible && createPortal(<span ref={tooltip} id={id} role="tooltip" className="hn-refresh-tip" style={{ top: 0, left: 0, visibility: 'hidden' }}>{tx("Cập nhật mới nhất")}</span>, document.body)}
  </span>;
}
