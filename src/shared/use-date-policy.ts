import { useEffect, useState } from 'react';
import { getBusinessDateWindow, type DatePolicyOptions } from './date-policy';

/** Refresh at Vietnam midnight, and after the browser wakes or regains focus. */
export function useDatePolicy(options: Omit<DatePolicyOptions, 'now'> = {}) {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setClock(now);
      const midnight = Date.parse(`${getBusinessDateWindow({ now }).today}T00:00:00+07:00`) + 86_400_000;
      clearTimeout(timer);
      timer = setTimeout(tick, Math.max(25, midnight - now.getTime() + 25));
    };
    const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
    tick();
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(timer); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  return getBusinessDateWindow({ ...options, now: clock });
}
