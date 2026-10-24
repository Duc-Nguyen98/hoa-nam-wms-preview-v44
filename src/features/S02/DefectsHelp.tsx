import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Icon } from '../../shared';
import './DefectsHelp.css';

interface DefectsHelpProps {
  /** Accessible name for the help button; the field itself keeps its own label. */
  label: string;
  /** Stable description ID that a related control can reference even while closed. */
  id: string;
  text: string;
}

export function DefectsHelp({ label, id, text }: DefectsHelpProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const anchorHovered = useRef(false);
  const tooltipHovered = useRef(false);
  const anchorFocused = useRef(false);
  const skipPointerFocus = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }
  function show() {
    clearCloseTimer();
    if (!openRef.current) setPosition(null);
    openRef.current = true;
    setOpen(true);
  }
  function dismiss() {
    clearCloseTimer();
    openRef.current = false;
    tooltipHovered.current = false;
    setOpen(false);
  }
  function closeAfterPointerLeaves() {
    clearCloseTimer();
    // Allow the pointer to cross the small gap between trigger and tooltip.
    closeTimer.current = setTimeout(() => {
      if (!anchorHovered.current && !tooltipHovered.current && !anchorFocused.current) dismiss();
    }, 120);
  }

  useEffect(() => () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    function placeTooltip() {
      const anchor = anchorRef.current;
      const tooltip = tooltipRef.current;
      if (!anchor || !tooltip) return;
      const bounds = anchor.getBoundingClientRect();
      const box = tooltip.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const margin = 12;
      const gap = 8;
      const preferredTop = bounds.bottom + gap;
      const top = preferredTop + box.height <= height - margin
        ? preferredTop : bounds.top - box.height - gap;
      setPosition({
        left: Math.max(margin, Math.min(bounds.left + (bounds.width - box.width) / 2, width - box.width - margin)),
        top: Math.max(margin, Math.min(top, height - box.height - margin)),
      });
    }
    placeTooltip();
    window.addEventListener('resize', placeTooltip);
    return () => window.removeEventListener('resize', placeTooltip);
  }, [open, text]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node) || anchorRef.current?.contains(target) || tooltipRef.current?.contains(target)) return;
      dismiss();
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      dismiss();
    }
    function closeOnScroll(event: Event) {
      if (event.target instanceof Node && tooltipRef.current?.contains(event.target)) return;
      dismiss();
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);

  return <span ref={anchorRef} className="df-help">
    <span id={id} className="hn-sr-only">{text}</span>
    <Button
      variant="ghost"
      className="df-help__trigger"
      aria-label={label}
      aria-describedby={id}
      aria-expanded={open}
      aria-controls={open ? `${id}-tooltip` : undefined}
      data-help-open={open}
      onPointerEnter={event => {
        if (event.pointerType === 'touch') return;
        anchorHovered.current = true;
        show();
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'touch') return;
        anchorHovered.current = false;
        closeAfterPointerLeaves();
      }}
      onPointerDown={() => { skipPointerFocus.current = true; }}
      onPointerCancel={() => { skipPointerFocus.current = false; }}
      onFocus={() => {
        anchorFocused.current = true;
        // A touch/click opens once, in onClick, rather than immediately closing
        // a tooltip that the same pointer action just opened through focus.
        if (skipPointerFocus.current) {
          skipPointerFocus.current = false;
          return;
        }
        show();
      }}
      onBlur={() => {
        anchorFocused.current = false;
        skipPointerFocus.current = false;
        closeAfterPointerLeaves();
      }}
      onClick={() => {
        skipPointerFocus.current = false;
        if (openRef.current) dismiss();
        else show();
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !openRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        dismiss();
      }}
    ><Icon name="help" width={18} height={18} /></Button>
    {open && createPortal(<div
      ref={tooltipRef}
      id={`${id}-tooltip`}
      role="tooltip"
      className="df-help-tooltip"
      style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}
      onPointerEnter={() => { tooltipHovered.current = true; clearCloseTimer(); }}
      onPointerLeave={() => { tooltipHovered.current = false; closeAfterPointerLeaves(); }}
    >{text}</div>, document.body)}
  </span>;
}
