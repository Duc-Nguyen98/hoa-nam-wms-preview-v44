import { useId, useLayoutEffect, useRef } from 'react';
import { useUiCopy } from '../i18n/use-ui-copy';
import { useToastStore } from '../toast/GlobalToastProvider';
import type { ToastTone } from '../toast/toast-store';
import { restoreControlFocus } from './focus';
import type { ControlFocusFallback } from './focus';

export interface NoticeFeedback {
  message: string;
  tone: ToastTone;
  sequence: number;
  container: HTMLElement;
  origin: HTMLElement | null;
}

/** Compatibility boundary: callers keep their operation/guard outcomes; one root owns presentation. */
export function Notice({ feedback, onClose, resolveFocusFallback }: {
  feedback: NoticeFeedback; onClose: () => void; resolveFocusFallback?: ControlFocusFallback;
  /** Legacy positioning arguments are retained for callers, superseded by the global contract. */
  protectedContentSelector?: string; autoDismissMs?: number; placement?: 'auto' | 'top-right';
  resolveInlineSlot?: (origin: HTMLElement | null) => HTMLElement | null; revealInlineOnOpen?: boolean;
}) {
  const tx = useUiCopy(), store = useToastStore(), owner = useId();
  const latest = useRef({ onClose, feedback, resolveFocusFallback });
  const event = useRef<{ sequence: number; id: string } | null>(null);
  latest.current = { onClose, feedback, resolveFocusFallback };
  const message = tx(feedback.message);
  useLayoutEffect(() => () => {
    // The global event owns its lifetime. A local Detail opening may clear the
    // emitter; detach its callback without cancelling already displayed feedback.
    if (event.current) store.update(event.current.id, { onClose: undefined });
  }, [store, owner]);
  useLayoutEffect(() => {
    const sequence = feedback.sequence;
    const change = { message, tone: feedback.tone,
      origin: feedback.origin,
      restoreFocus: () => restoreControlFocus(latest.current.feedback.origin, latest.current.resolveFocusFallback),
      onClose: () => { if (latest.current.feedback.sequence === sequence) latest.current.onClose(); },
    };
    if (event.current?.sequence === sequence) {
      // Translation rerenders update the admitted event, even when notify deduped its requested ID.
      // update deliberately cannot resurrect an expired event or restart its deadline.
      store.update(event.current.id, change);
    } else {
      event.current = { sequence, id: store.notify({ id: `${owner}:${sequence}`, owner,
        dedupeKey: `${owner}:${feedback.tone}:${feedback.message}`, replaceOwner: true, ...change }) };
    }
  }, [store, owner, feedback.sequence, feedback.tone, feedback.origin, message]);
  return null;
}
