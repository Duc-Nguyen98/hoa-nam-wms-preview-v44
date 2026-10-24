import { useRef } from 'react';
import { Notice } from '../shared/Notice';
import type { ToastTone } from './toast-store';

/** Presentation adapter for existing outcome state. No local card, timer or position.
 * eventKey is untranslated so a locale change updates copy without restarting the clock.
 * Persistent field validation and recovery controls remain beside their fields/actions.
 */
export function OperationResultToast({ eventKey, message, tone }: { eventKey: string; message: string; tone: ToastTone }) {
  const event = useRef({ key: eventKey, sequence: 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  if (event.current.key !== eventKey) event.current = { key: eventKey, sequence: event.current.sequence + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
  return <Notice feedback={{ message, tone, sequence: event.current.sequence, origin: event.current.origin, container: document.body }} onClose={() => {}} />;
}
