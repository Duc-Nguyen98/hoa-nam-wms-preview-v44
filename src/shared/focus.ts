import { useCallback, useEffect, useRef } from 'react';
import type { FocusEventHandler } from 'react';

/** Reveal keyboard focus after native scrolling, preserving the shared ring clearance. */
export function useKeyboardFocusReveal(): FocusEventHandler<HTMLElement> {
  const frame = useRef<number | null>(null);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  return useCallback(event => {
    const target = event.target, scope = event.currentTarget;
    if (!(target instanceof HTMLElement)) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (scope.isConnected && scope.contains(target) && target.getClientRects().length
        && target.isConnected && document.activeElement === target && target.matches(':focus-visible')
        && !target.matches(':open') && !document.querySelector('dialog[open]')) revealControl(target);
    });
  }, []);
}

/** Reveal a control inside both the table scrollport and the sticky application shell. */
export function revealControl(target: HTMLElement) {
  const region = target.closest<HTMLElement>('.hn-table-scroll');
  if (region && target !== region) {
    const area = region.getBoundingClientRect(), box = target.getBoundingClientRect();
    const headings = [...region.querySelectorAll('thead th')].filter(e => e.getClientRects().length);
    const top = target.closest('tbody') ? Math.max(area.top, ...headings.map(e => e.getBoundingClientRect().bottom)) + 6 : area.top + 6;
    if (box.top < top) region.scrollTop -= top - box.top;
    else if (box.bottom > area.top + region.clientHeight - 6) region.scrollTop += box.bottom - area.top - region.clientHeight + 6;
    const sticky = [...region.querySelectorAll<HTMLElement>('th,td')].filter(e => e.getClientRects().length && getComputedStyle(e).position === 'sticky' && getComputedStyle(e).right === '0px');
    const right = target.closest('td,th') && sticky.includes(target.closest('td,th') as HTMLElement) ? area.right : Math.min(area.right, ...sticky.map(e => e.getBoundingClientRect().left));
    if (box.left < area.left + 6) region.scrollLeft -= area.left + 6 - box.left;
    else if (box.right > right - 6) region.scrollLeft += box.right - right + 6;
  }
  const box = target.getBoundingClientRect();
  const top = Math.max(0, document.querySelector('.hn-header')?.getBoundingClientRect().bottom ?? 0) + 10;
  if (target === region && box.height > innerHeight - top - 10) {
    window.scrollBy({top:box.top-top,behavior:'instant'});
    return;
  }
  if (box.top < top) window.scrollBy({ top: box.top - top, behavior: 'instant' });
  else if (box.bottom > innerHeight - 10) window.scrollBy({ top: box.bottom - innerHeight + 10, behavior: 'instant' });
}

export type ControlFocusFallback = (origin: HTMLElement | null) => HTMLElement | null;
export function restoreControlFocus(origin: HTMLElement | null, resolveFallback?: ControlFocusFallback) {
  const available = (element: HTMLElement | null): element is HTMLElement => Boolean(element?.isConnected && element.getClientRects().length && !element.matches(':disabled') && !element.closest('[hidden],[inert]'));
  const modal = document.querySelector<HTMLDialogElement>('dialog[open]');
  if (modal) { const control = modal.querySelector<HTMLElement>('button, input, select, [tabindex="0"]'); control?.focus(); return; }
  const rowCode = origin?.dataset.recipientCode;
  const replacement = rowCode ? document.querySelector<HTMLElement>(`[data-recipient-code="${CSS.escape(rowCode)}"]`) : null;
  const fallback = document.querySelector<HTMLElement>(origin?.closest('.hn-catalogue-fields') ? '.hn-filter-toggle' : '.hn-page-heading button');
  // An optional screen equivalent is consulted only after the original control
  // and its legacy replacement disappear. Invalid targets keep the fallback chain.
  const suggested = !available(origin) && !available(replacement) ? resolveFallback?.(origin) ?? null : null;
  const validSuggestion = available(suggested) && getComputedStyle(suggested).visibility === 'visible';
  const target = available(origin) ? origin : available(replacement) ? replacement : validSuggestion ? suggested : fallback ?? document.getElementById('main-content');
  if (target) { target.focus({ preventScroll: true }); revealControl(target); }
}
