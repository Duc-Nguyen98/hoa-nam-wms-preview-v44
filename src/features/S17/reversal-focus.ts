import { useCallback, useEffect, useRef, type FocusEventHandler } from 'react';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';

export function visibleReversalAction(origin: HTMLElement | null, scope: ParentNode = document): HTMLElement | null {
  const key = origin?.getAttribute('data-s17-action');
  return key ? [...scope.querySelectorAll<HTMLElement>('[data-s17-action]')].find(node => node.getAttribute('data-s17-action') === key && node.getClientRects().length > 0) ?? scope.querySelector<HTMLElement>('#s17-search') : null;
}
export function reversalFeedbackSlot(origin: HTMLElement | null): HTMLElement | null {
  const action = visibleReversalAction(origin);
  return (action?.closest('.s17-card') ?? action?.closest('.s17-table-view'))?.querySelector<HTMLElement>('[data-s17-feedback]') ?? null;
}
/** Reveal the equivalent card action within its bounded list before shell reveal. */
function revealCardAction(target: HTMLElement) {
  const region = target.closest<HTMLElement>('.s17-card-view');
  if (!region) return;
  const area = region.getBoundingClientRect(), box = target.getBoundingClientRect();
  if (box.top < area.top + 8) region.scrollTop -= area.top + 8 - box.top;
  else if (box.bottom > area.top + region.clientHeight - 8) region.scrollTop += box.bottom - area.top - region.clientHeight + 8;
}
/** Feature-owned identity transfer; all focus styling/reveal is supplied by S00. */
export function useReversalFocus(ready: boolean) {
  const screen = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const reveal = useKeyboardFocusReveal();
  const onFocusCapture: FocusEventHandler<HTMLDivElement> = useCallback(event => {
    previous.current = event.target.closest('.hn-notice') ? null : event.target;
    reveal(event);
  }, [reveal]);
  useEffect(() => {
    const root = screen.current;
    if (!root || !ready) return;
    let frame = 0;
    const forget = () => { previous.current = null; cancelAnimationFrame(frame); };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const origin = previous.current, active = document.activeElement;
        if (!origin) return;
        // Suppression consumes ownership; closing foreground UI must not revive it.
        if (!root.isConnected || !document.hasFocus() || root.closest('[inert]') || document.querySelector('dialog[open],.hn-header-popup')) { forget(); return; }
        if (origin.isConnected) {
          if (!root.contains(origin)) { forget(); return; }
          if (origin.getClientRects().length) return;
        } else if (!origin.hasAttribute('data-s17-action')) { forget(); return; }
        // A detached row can still own the neutral focus left by its removal.
        // Pointer/keyboard/focus listeners below revoke that ownership on new intent.
        if (active !== origin && active !== document.body) { forget(); return; }
        const target = visibleReversalAction(origin, root) ?? (origin.closest('.s17-table-view') ? root.querySelector<HTMLElement>('#s17-search') : null);
        forget();
        if (target?.isConnected && target.getClientRects().length && !target.matches(':disabled') && !target.closest('[hidden],[inert]')) {
          target.focus({ preventScroll: true }); revealCardAction(target); revealControl(target);
        }
      });
    };
    const outside = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && (!root.contains(event.target) || event.target.closest('.hn-notice'))) forget();
    };
    const relinquish = (event: FocusEvent) => {
      const origin = previous.current;
      if (event.target !== origin || !origin) return;
      // Chrome emits blur before removeChild detaches the still-visible node.
      // Recheck after this DOM commit, without revoking a newer focus owner.
      queueMicrotask(() => {
        if (previous.current === origin && document.activeElement !== origin && origin.isConnected && origin.getClientRects().length) forget();
      });
    };
    const pointerIntent = (event: PointerEvent) => {
      const origin = previous.current;
      // Clicking an already-focused row does not fire focusin again.
      if (!origin || document.activeElement !== origin || !(event.target instanceof Node) || !origin.contains(event.target)) forget();
    };
    const keyboardIntent = (event: KeyboardEvent) => {
      const origin = previous.current;
      if (event.key === 'Tab' || !origin || document.activeElement !== origin || !(event.target instanceof Node) || !origin.contains(event.target)) forget();
    };
    const observer = new ResizeObserver(schedule);
    root.querySelectorAll('.s17-table-view,.s17-card-view').forEach(node => observer.observe(node));
    // Filtering may remove rows without changing the bounded presentation's size.
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', schedule); document.addEventListener('focusin', outside);
    window.addEventListener('blur', forget);
    document.addEventListener('focusout', relinquish);
    document.addEventListener('pointerdown', pointerIntent, true);
    document.addEventListener('keydown', keyboardIntent, true);
    return () => {
      observer.disconnect(); mutations.disconnect(); forget();
      window.removeEventListener('resize', schedule); document.removeEventListener('focusin', outside);
      window.removeEventListener('blur', forget);
      document.removeEventListener('focusout', relinquish);
      document.removeEventListener('pointerdown', pointerIntent, true);
      document.removeEventListener('keydown', keyboardIntent, true);
    };
  }, [ready]);
  return { screen, onFocusCapture };
}
