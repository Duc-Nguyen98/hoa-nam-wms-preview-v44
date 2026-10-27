import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useShellPreferences } from '../shared/shell-preferences';
import { createToastStore } from './toast-store';
import type { ToastInput, ToastRecord, ToastStore } from './toast-store';
import { TOAST_COPY, TOAST_SYMBOLS } from './toast-copy';
import { TOAST_CONFIG, headerToastGeometry } from './toast-config';
import './global-toast.css';

const ToastContext = createContext<ToastStore | null>(null);
const foreground = 'dialog[open],.hn-header-popup,.hn-date-picker__popup[data-open="true"],[role="dialog"][aria-modal="true"]';
function foregrounds() { return [...document.querySelectorAll<HTMLElement>(foreground)].filter(el => el.getClientRects().length && getComputedStyle(el).visibility === 'visible'); }
function isForegroundOpen() { return foregrounds().length > 0; }
function modalSurface() { return foregrounds().filter(el => el.matches('dialog[open],[aria-modal="true"]')).at(-1); }
function moveViewport(viewport: HTMLElement, host: HTMLElement) {
  if (viewport.parentElement === host) return;
  // appendChild can restart CSS animations even though React keeps the same
  // cards. Preserve their real elapsed time when entering/leaving a modal.
  const capturedAt = performance.now();
  const clocks = viewport.getAnimations({ subtree: true }).map(animation => ({
    target: (animation.effect as KeyframeEffect | null)?.target,
    name: animation instanceof CSSAnimation ? animation.animationName : '',
    time: animation.currentTime,
    running: animation.playState === 'running',
    rate: animation.playbackRate,
  }));
  const movable = host as HTMLElement & { moveBefore?: (node: Node, child: Node | null) => void };
  if (viewport.isConnected && movable.moveBefore) movable.moveBefore(viewport, null);
  else host.appendChild(viewport);
  if (typeof viewport.showPopover === 'function') {
    // A newly opened dialog is newer in the top layer. State-preserving moves
    // alone keep the old popover below it and make Close unclickable.
    if (viewport.matches(':popover-open')) viewport.hidePopover();
    viewport.showPopover();
  }
  for (const animation of viewport.getAnimations({ subtree: true })) {
    const clock = clocks.find(item => item.target === (animation.effect as KeyframeEffect | null)?.target
      && item.name === (animation instanceof CSSAnimation ? animation.animationName : ''));
    if (clock && typeof clock.time === 'number') {
      animation.currentTime = clock.time + (clock.running ? (performance.now() - capturedAt) * clock.rate : 0);
    }
  }
}
function restoreToastFocus(entry: ToastRecord) {
  const modal = modalSurface();
  if (modal && !modal.contains(entry.origin ?? null)) {
    const target = [...modal.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),[tabindex="0"]')]
      .find(el => !el.closest('.hn-global-toast-viewport') && el.getClientRects().length);
    (target ?? modal).focus({ preventScroll: true });
  } else if (entry.restoreFocus) entry.restoreFocus();
  else if (entry.origin?.isConnected && entry.origin.getClientRects().length
    && !entry.origin.matches(':disabled') && !entry.origin.closest('[inert]')
    && getComputedStyle(entry.origin).visibility === 'visible') entry.origin.focus({ preventScroll: true });
  else document.getElementById('main-content')?.focus({ preventScroll: true });
}


export function useToastStore() {
  const store = useContext(ToastContext);
  if (!store) throw new Error('Transient feedback requires the root GlobalToastProvider.');
  return store;
}

/** Scoped emitter for future routes; unmount removes only this emitter's events. */
export function useGlobalToast() {
  const store = useToastStore(), owner = useId(), sequence = useRef(0);
  useEffect(() => () => store.removeOwner(owner), [store, owner]);
  return useMemo(() => ({
    notify(input: Omit<ToastInput, 'id' | 'owner'> & { id?: string }) {
      return store.notify({ ...input, id: input.id ?? `${owner}:${++sequence.current}`, owner });
    },
    dismiss: store.dismiss,
    update: store.update,
  }), [store, owner]);
}

export function GlobalToastProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createToastStore(undefined, { measuredAdmission: true, pauseActiveWhenSuspended: true }));
  return <ToastContext.Provider value={store}>{children}<GlobalToastRegion store={store} /></ToastContext.Provider>;
}

function GlobalToastRegion({ store }: { store: ToastStore }) {
  const { active, pending, suspended } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const { language: locale } = useShellPreferences();
  const copy = TOAST_COPY[locale];
  const [viewport] = useState(() => {
    const element = document.createElement('div'); element.className = 'hn-global-toast-viewport'; element.setAttribute('popover', 'manual'); return element;
  });
  const region = useRef<HTMLDivElement>(null), measure = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState(() => headerToastGeometry(null, document.documentElement.clientWidth, innerHeight));
  useLayoutEffect(() => {
    let frame: number | null = null;
    const sync = () => {
      moveViewport(viewport, modalSurface() ?? document.body);
      if (typeof viewport.showPopover === 'function' && !viewport.matches(':popover-open')) viewport.showPopover();
      // Closing a native dialog hides descendants before its mutation callback.
      // At that point browser animation clocks can be gone. Recover from the
      // event's actual admission/deadline rather than replaying entrance/progress.
      const snapshot = store.getSnapshot();
      if (!snapshot.suspended) for (const animation of viewport.getAnimations({ subtree: true })) {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        const card = target instanceof Element ? target.closest<HTMLElement>('.hn-global-toast') : null;
        const event = snapshot.active.find(entry => entry.id === card?.dataset.eventId);
        if (!event || !(animation instanceof CSSAnimation)) continue;
        const start = animation.animationName === 'hn-toast-out' ? (event.removeAt ?? Date.now()) - TOAST_CONFIG.exit : event.admittedAt;
        if (start !== null) animation.currentTime = Math.max(0, Date.now() - start);
      }
      const header = document.querySelector(TOAST_CONFIG.headerSelector)?.getBoundingClientRect() ?? null;
      // The fixed portal can exclude a classic scrollbar. CSS right offsets
      // must use its actual containing box, not window.innerWidth.
      const host = viewport.getBoundingClientRect();
      const g = headerToastGeometry(header, host.width, host.height, host);
      setGeometry(old => Object.keys(g).every(k => old[k as keyof typeof g] === g[k as keyof typeof g]) ? old : g);
      for (const el of [region.current, measure.current]) if (el) {
        el.style.setProperty('--hn-toast-top', `${g.top}px`); el.style.setProperty('--hn-toast-right', `${g.right}px`);
        el.style.setProperty('--hn-toast-width', `${g.width}px`); el.style.setProperty('--hn-toast-available', `${g.availableHeight}px`);
      }
      const rect = region.current?.getBoundingClientRect(), probe = measure.current?.getBoundingClientRect();
      const next = store.getSnapshot().pending[0], height = rect?.height ?? 0;
      const foregroundBounds = foregrounds().map(el => el.getBoundingClientRect());
      const toastRight = host.right - g.right, toastTop = host.top + g.top;
      const blocked = (h: number) => h > 0 && foregroundBounds.some(b => b.left < toastRight && b.right > toastRight - g.width && b.top < toastTop + h && b.bottom > toastTop);
      // Page actions may overlap by Owner approval. Only foreground surfaces
      // defer the fixed rail; the store imposes a finite 30-second budget.
      store.setSuspended(blocked(height));
      const wanted = height + (active.length ? TOAST_CONFIG.stackGap : 0) + (probe?.height ?? 0);
      if (next && next.id === pending[0]?.id && probe && probe.height > 0 && wanted <= g.availableHeight && !blocked(wanted)) store.admitMeasured(next.id);
    };
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(() => { frame = null; sync(); }); };
    const observer = new MutationObserver(records => { if (records.some(record => !viewport.contains(record.target))) schedule(); });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open','data-open','aria-modal','class','style','hidden'] });
    const resize = new ResizeObserver(schedule); resize.observe(document.documentElement);
    resize.observe(viewport);
    const header = document.querySelector(TOAST_CONFIG.headerSelector); if (header) resize.observe(header);
    if (region.current) resize.observe(region.current);
    const clear = () => store.clear();
    window.addEventListener('resize', schedule); document.addEventListener('scroll', sync, true);
    document.addEventListener('focusin', schedule); window.addEventListener('hashchange', clear); sync();
    return () => { observer.disconnect(); resize.disconnect(); if(frame !== null)cancelAnimationFrame(frame); window.removeEventListener('resize', schedule); document.removeEventListener('scroll', sync, true); document.removeEventListener('focusin', schedule); window.removeEventListener('hashchange', clear); };
  }, [store, active, pending, locale, viewport]);
  useLayoutEffect(() => () => { viewport.remove(); }, [viewport]);
  const dismiss = (entry: ToastRecord, reason: 'manual' | 'escape') => {
    if (region.current?.contains(document.activeElement)) restoreToastFocus(entry);
    store.dismiss(entry.id, reason);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if(event.key !== 'Escape' || event.isComposing || event.defaultPrevented || isForegroundOpen() || suspended)return;
      const current=store.getSnapshot().active.find(t=>t.phase !== 'exiting'); if(current){event.preventDefault();dismiss(current,'escape');}
    };
    document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);
  },[store,suspended]);
  const style = { '--hn-toast-top': `${geometry.top}px`, '--hn-toast-right': `${geometry.right}px`, '--hn-toast-width': `${geometry.width}px`, '--hn-toast-available': `${geometry.availableHeight}px`, '--hn-toast-gap': `${TOAST_CONFIG.stackGap}px`, '--hn-toast-enter': `${TOAST_CONFIG.entrance}ms`, '--hn-toast-lifetime': `${TOAST_CONFIG.lifetime}ms`, '--hn-toast-exit': `${TOAST_CONFIG.exit}ms` } as CSSProperties;
  return createPortal(<><div ref={region} className="hn-global-toast-region" role="group" style={style} lang={locale} aria-label={copy.region} data-provider-count="1" data-placement="header-top-right" data-suspended={suspended ? 'true' : undefined} data-suspension-reason={suspended ? 'foreground-priority' : undefined} data-queued-count={pending.length} aria-hidden={suspended || undefined} inert={suspended || undefined}>
    {active.map(entry=><ToastCard key={entry.id} entry={entry} locale={locale} dismiss={dismiss}/>)}
  </div>{pending[0]&&<div ref={measure} className="hn-toast-measure" style={style} lang={locale} aria-hidden="true" inert><ToastCard entry={pending[0]} locale={locale} dismiss={dismiss} measuring/></div>}</>,viewport);
}

function ToastCard({ entry, locale, dismiss, measuring = false }: { entry: ToastRecord; locale: 'vi' | 'en' | 'zh-CN'; dismiss: (entry: ToastRecord, reason: 'manual' | 'escape') => void; measuring?: boolean }) {
  const ref = useRef<HTMLDivElement>(null), latest = useRef(entry);
  latest.current = entry;
  const copy = TOAST_COPY[locale];
  useLayoutEffect(() => {
    const element = ref.current;
    return () => {
      // Expiring a focused Close must not strand keyboard focus on body.
      if (!element?.contains(document.activeElement)) return;
      const current = latest.current;
      restoreToastFocus(current);
    };
  }, []);
  return <div ref={ref} className={measuring ? 'hn-toast-probe' : 'hn-global-toast'} data-tone={entry.tone} data-phase={entry.phase} data-event-id={measuring ? undefined : entry.id} data-admitted-at={entry.admittedAt} data-expires-at={entry.expiresAt} role={measuring ? undefined : entry.tone === 'error' ? 'alert' : 'status'} aria-atomic={measuring ? undefined : 'true'}>
      <span className="hn-global-toast-icon" aria-hidden="true">{TOAST_SYMBOLS[entry.tone]}</span><div className="hn-global-toast-body"><div className="hn-global-toast-title">{typeof entry.title === 'function' ? entry.title(locale) : entry.title ?? copy.titles[entry.tone]}</div><div className="hn-global-toast-description">{typeof entry.message === 'function' ? entry.message(locale) : entry.message}</div></div>
      <button type="button" className="hn-global-toast-close" aria-label={copy.close} onClick={() => dismiss(entry, 'manual')}>×</button><div className="hn-global-toast-progress" aria-hidden="true" />
    </div>;
}
