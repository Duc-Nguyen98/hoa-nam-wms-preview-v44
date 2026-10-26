import { TOAST_CONFIG } from './toast-config';
export type ToastTone = 'success' | 'error' | 'warning' | 'info';
export type ToastText = string | ((language: 'vi' | 'en' | 'zh-CN') => string);
export type ToastCloseReason = 'timeout' | 'manual' | 'escape' | 'queue-expired' | 'queue-full';
export interface ToastInput {
  id: string;
  owner: string;
  tone: ToastTone;
  message: ToastText;
  title?: ToastText;
  dedupeKey?: string;
  /** Legacy outcome slots replace their previous event; generic emitters keep stacking. */
  replaceOwner?: boolean;
  origin?: HTMLElement | null;
  restoreFocus?: () => void;
  onClose?: (reason: ToastCloseReason) => void;
}
export interface ToastRecord extends ToastInput {
  phase: 'queued' | 'entering' | 'visible' | 'exiting';
  queuedAt: number;
  admittedAt: number | null;
  expiresAt: number | null;
  removeAt: number | null;
  closeReason?: ToastCloseReason;
}
export const TOAST_TIMING = TOAST_CONFIG;
type Clock = { now: () => number; setTimeout: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>; clearTimeout: (id: ReturnType<typeof setTimeout>) => void };

/** One bounded transient event stream. Locale, focus and hover never extend a lifetime. */
export function createToastStore(clock: Clock = { now: () => Date.now(), setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms), clearTimeout: id => globalThis.clearTimeout(id) }, options: { measuredAdmission?: boolean; pauseActiveWhenSuspended?: boolean } = {}) {
  let active: ToastRecord[] = [], pending: ToastRecord[] = [], suspended = false;
  let suspendedAt: number | null = null;
  let snapshot = { active, pending, suspended };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const flush = () => {
    if (timer !== undefined) clock.clearTimeout(timer);
    snapshot = { active, pending, suspended };
    const now = clock.now();
    const deadlines = [...active.map(t => suspendedAt !== null ? suspendedAt + TOAST_TIMING.queueLifetime : t.phase === 'entering' ? t.admittedAt! + TOAST_TIMING.entrance : t.phase === 'visible' ? t.expiresAt! : t.removeAt!), ...pending.map(t => t.queuedAt + TOAST_TIMING.queueLifetime)];
    timer = deadlines.length ? clock.setTimeout(tick, Math.max(0, Math.min(...deadlines) - now)) : undefined;
    listeners.forEach(listener => listener());
  };
  const admit = () => {
    if (suspended || options.measuredAdmission) return;
    while (pending.length && active.length < TOAST_TIMING.maxVisible) {
      const [entry, ...rest] = pending;
      pending = rest;
      const now = clock.now();
      active = [{ ...entry, phase: 'entering', admittedAt: now, expiresAt: now + TOAST_TIMING.lifetime }, ...active];
    }
  };
  function tick() {
    const now = clock.now(), callbacks: (() => void)[] = [];
    active = active.flatMap(t => {
      if (suspendedAt !== null) {
        if (now - suspendedAt < TOAST_TIMING.queueLifetime) return [t];
        if (t.onClose) callbacks.push(() => t.onClose!('queue-expired'));
        return [];
      }
      const removeAt = t.removeAt ?? t.expiresAt! + TOAST_TIMING.exit;
      if (now >= removeAt) { if (t.onClose) callbacks.push(() => t.onClose!(t.closeReason ?? 'timeout')); return []; }
      if (t.phase === 'exiting') return [t];
      if (now >= t.expiresAt!) return [{ ...t, phase: 'exiting', removeAt, closeReason: 'timeout' }];
      return [t.phase === 'entering' && now >= t.admittedAt! + TOAST_TIMING.entrance ? { ...t, phase: 'visible' } : t];
    });
    pending = pending.filter(t => {
      if (now < t.queuedAt + TOAST_TIMING.queueLifetime) return true;
      if (t.onClose) callbacks.push(() => t.onClose!('queue-expired'));
      return false;
    });
    admit(); flush(); callbacks.forEach(callback => callback());
  }
  const update = (id: string, change: Partial<Pick<ToastInput, 'message' | 'title' | 'tone' | 'onClose' | 'origin' | 'restoreFocus'>>) => {
    active = active.map(t => t.id === id ? { ...t, ...change } : t);
    pending = pending.map(t => t.id === id ? { ...t, ...change } : t);
    flush();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    /** The provider measures the next complete stack before starting any visible timer. */
    admitMeasured(id: string) {
      if (!options.measuredAdmission || suspended || active.length >= TOAST_TIMING.maxVisible || pending[0]?.id !== id) return false;
      const [entry, ...rest] = pending;
      const now = clock.now();
      if (now >= entry.queuedAt + TOAST_TIMING.queueLifetime) { tick(); return false; }
      pending = rest;
      active = [{ ...entry, phase: 'entering', admittedAt: now, expiresAt: now + TOAST_TIMING.lifetime }, ...active];
      flush(); return true;
    },
    notify(input: ToastInput) {
      const key = input.dedupeKey ?? `${input.owner}:${input.tone}:${String(input.message)}`;
      const found = [...active, ...pending].find(t => t.id === input.id || t.owner === input.owner && t.dedupeKey === key);
      if (found) {
        update(found.id, { message: input.message, title: input.title, tone: input.tone, onClose: input.onClose, origin: input.origin, restoreFocus: input.restoreFocus });
        return found.id;
      }
      if (input.replaceOwner) {
        active = active.filter(t => t.owner !== input.owner);
        pending = pending.filter(t => t.owner !== input.owner);
      }
      let evicted: ToastRecord | undefined;
      if (pending.length >= TOAST_TIMING.maxPending) { [evicted, ...pending] = pending; }
      pending = [...pending, { ...input, dedupeKey: key, phase: 'queued', queuedAt: clock.now(), admittedAt: null, expiresAt: null, removeAt: null }];
      admit(); flush(); evicted?.onClose?.('queue-full');
      return input.id;
    },
    update,
    dismiss(id: string, reason: ToastCloseReason = 'manual') {
      const queued = pending.find(t => t.id === id);
      pending = pending.filter(t => t.id !== id);
      active = active.map(t => t.id === id && t.phase !== 'exiting' ? { ...t, phase: 'exiting', removeAt: clock.now() + TOAST_TIMING.exit, closeReason: reason } : t);
      admit(); flush(); queued?.onClose?.(reason);
    },
    removeOwner(owner: string) {
      active = active.filter(t => t.owner !== owner); pending = pending.filter(t => t.owner !== owner);
      admit(); flush();
    },
    clear() { active = []; pending = []; flush(); },
    setSuspended(next: boolean) {
      if (suspended === next) return;
      if (options.pauseActiveWhenSuspended) {
        if (next) suspendedAt = clock.now();
        else if (suspendedAt !== null) {
          const elapsed = clock.now() - suspendedAt;
          active = active.map(t => ({ ...t, admittedAt: t.admittedAt! + elapsed, expiresAt: t.expiresAt! + elapsed, removeAt: t.removeAt === null ? null : t.removeAt + elapsed }));
          suspendedAt = null;
        }
      }
      suspended = next; admit(); flush();
    },
  };
}
export type ToastStore = ReturnType<typeof createToastStore>;
