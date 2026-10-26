import type { SessionAdapter, SessionContext, SessionDiagnostic, SessionResult } from '../features/S08/session-contract';

export function createSessionController(adapter: SessionAdapter, report: (event: SessionDiagnostic) => void = () => {}) {
  const initial = adapter.readDefault();
  // Expose the existing request lifecycle without inventing a session outcome.
  let snapshot: Readonly<{ context: SessionContext | null; pending: boolean }> = { context: initial.context, pending: false };
  let epoch = 0;
  const listeners = new Set<() => void>();
  function publish(next: typeof snapshot) {
    snapshot = next;
    listeners.forEach(listener => listener());
  }
  function clear() {
    epoch++;
    publish({ context: null, pending: false });
  }
  return {
    copy: initial.copy,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async confirm() {
      if (snapshot.pending) return;
      if (!snapshot.context) { report({ action: 'confirm', reason: 'MISSING_CONTEXT' }); return; }
      const ticket = epoch;
      publish({ ...snapshot, pending: true });
      if (ticket !== epoch) return;
      try {
        const result: SessionResult = await adapter.confirm();
        if (ticket !== epoch) return;
        // Only the sourced blocked result is accepted; no arbitrary redirect or success.
        report({ action: 'confirm', reason: result?.kind === 'blocked'
          && ['MISSING_CONFIRMATION_TARGET', 'MISSING_CONTEXT'].includes(result.reason)
          ? result.reason : 'UNAPPROVED_ADAPTER_OUTCOME' });
      } catch {
        if (ticket === epoch) report({ action: 'confirm', reason: 'UNAPPROVED_ADAPTER_OUTCOME' });
      } finally {
        if (ticket === epoch) publish({ ...snapshot, pending: false });
      }
    },
    logout() { adapter.reset(); clear(); },
    // Unmount invalidates late responses but does not recreate or grant a session.
    invalidate() { epoch++; if (snapshot.pending) publish({ ...snapshot, pending: false }); },
  };
}
