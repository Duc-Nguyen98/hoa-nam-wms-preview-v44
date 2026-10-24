import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { PvDemoAdapter, PvDemoOutcome, PvDemoSnapshot } from '../../contracts/pv-demo';
import { createPvDemoSession } from './pv-demo-session';

export function usePvDemo(adapter: PvDemoAdapter, onCommitted: (snapshot: PvDemoSnapshot, outcome: PvDemoOutcome, newer: boolean) => void) {
  const committed = useRef(onCommitted); committed.current = onCommitted;
  const session = useMemo(() => createPvDemoSession(adapter, (...args) => committed.current(...args)), [adapter]);
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useEffect(() => {
    session.activate();
    const refresh = () => { if (document.visibilityState === 'visible') void session.recover(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      session.suspend();
    };
  }, [session]);
  return { ...state, execute: session.execute, recover: session.recover, clearIssue: session.clearIssue };
}
