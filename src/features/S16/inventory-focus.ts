import { useCallback, useEffect, useRef } from 'react';
import type { FocusEventHandler } from 'react';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';

const foregroundSelector = 'dialog[open],.hn-header-popup,.hn-date-picker__popup[data-open="true"]';

/** A row has two presentations, never two business identities. */
export function visibleInventoryAction(origin: HTMLElement | null, scope: ParentNode = document): HTMLElement | null {
  const key = origin?.getAttribute('data-s16-action');
  if (!key) return null;
  return [...scope.querySelectorAll<HTMLElement>('[data-s16-action]')]
    .find(element => element.getAttribute('data-s16-action') === key && element.getClientRects().length > 0) ?? null;
}

/** Each presentation owns a normal-flow feedback host, keyed via the same row action. */
export function inventoryFeedbackSlot(origin: HTMLElement | null): HTMLElement | null {
  const action = visibleInventoryAction(origin);
  const presentation = action?.closest('.s16-card') ?? action?.closest('.s16-table-view');
  return presentation?.querySelector<HTMLElement>('[data-s16-feedback]') ?? null;
}

/** Preserve caller-owned table/card focus through resize and accepted row removal. */
export function useInventoryFocus(ready: boolean) {
  const screen = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const revealKeyboardFocus = useKeyboardFocusReveal();
  const onFocusCapture: FocusEventHandler<HTMLDivElement> = useCallback(event => {
    // Notice owns focus across portal-host changes. It may now live inside a
    // presentation, but must never be treated as a disappearing table control.
    if (event.target.closest('.hn-notice')) { lastFocused.current = null; return; }
    lastFocused.current = event.target;
    revealKeyboardFocus(event);
  }, [revealKeyboardFocus]);
  useEffect(() => {
    const root = screen.current;
    if (!root || !ready) return;
    let frame: number | null = null;
    const restore = () => {
      frame = null;
      const origin = lastFocused.current, active = document.activeElement;
      if (!origin) return;
      if (document.querySelector(foregroundSelector)) { lastFocused.current = null; return; }
      const removedRow = !origin.isConnected && origin.hasAttribute('data-s16-action');
      if (!origin.isConnected) lastFocused.current = null;
      if (!removedRow && (!origin.isConnected || !root.contains(origin))) return;
      if (origin.getClientRects().length) {
        if (active === origin && origin.matches(':focus-visible')) revealControl(origin);
        return;
      }
      // An intentional move always wins; a removed row may recover only from BODY.
      if (active !== origin && active !== document.body) return;
      const target = visibleInventoryAction(origin, root)
        ?? (removedRow || origin.closest('.s16-table-view') ? root.querySelector<HTMLInputElement>('#s16-search') : null);
      if (target?.isConnected && target.getClientRects().length && !target.matches(':disabled')
        && !target.closest('[hidden],[inert],[aria-hidden="true"]') && getComputedStyle(target).visibility === 'visible') {
        target.focus({ preventScroll: true }); revealControl(target);
      }
    };
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    };
    const forgetOutsideFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target !== document.body && !root.contains(event.target)) lastFocused.current = null;
    };
    const forgetPointerIntent = (event: PointerEvent) => {
      const origin = lastFocused.current;
      if (origin?.hasAttribute('data-s16-action') && event.target instanceof Node && !origin.contains(event.target)) lastFocused.current = null;
    };
    const forgetKeyboardIntent = (event: KeyboardEvent) => {
      if ((event.key === 'Tab' || event.key === 'Escape') && lastFocused.current?.hasAttribute('data-s16-action')) lastFocused.current = null;
    };
    const forgetWindowFocus = () => { lastFocused.current = null; };
    const observer = new ResizeObserver(schedule);
    root.querySelectorAll('.s16-table-view,.s16-card-view').forEach(element => observer.observe(element));
    // Equal-height result replacement produces no resize. Observe removals as well,
    // and retire ownership if shell foreground opens before the scheduled recovery.
    const mutations = new MutationObserver(() => {
      if (document.querySelector(foregroundSelector)) { lastFocused.current = null; return; }
      const origin = lastFocused.current;
      if (origin?.hasAttribute('data-s16-action') && !origin.isConnected) schedule();
    });
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-open'] });
    window.addEventListener('resize', schedule);
    window.addEventListener('blur', forgetWindowFocus);
    document.addEventListener('focusin', forgetOutsideFocus);
    document.addEventListener('pointerdown', forgetPointerIntent, true);
    document.addEventListener('keydown', forgetKeyboardIntent, true);
    return () => {
      observer.disconnect(); mutations.disconnect();
      window.removeEventListener('resize', schedule); window.removeEventListener('blur', forgetWindowFocus);
      document.removeEventListener('focusin', forgetOutsideFocus);
      document.removeEventListener('pointerdown', forgetPointerIntent, true);
      document.removeEventListener('keydown', forgetKeyboardIntent, true);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [ready]);
  return { screen, onFocusCapture };
}
