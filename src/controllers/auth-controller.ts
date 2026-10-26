import type { AuthAdapter, AuthCredentials, AuthDiagnostic, AuthInitial } from '../features/S07/auth-contract';

/** Credentials exist only in this mounted controller; diagnostics never include field values. */
export function createAuthController(adapter: AuthAdapter, report: (event: AuthDiagnostic) => void = () => {}) {
  const source = adapter.readDefault();
  // Pending is a UI request lifecycle, not a new authentication outcome.
  let state: AuthInitial & { pending: boolean } = { ...source.initial, pending: false };
  let epoch = 0;
  const listeners = new Set<() => void>();
  const publish = (next: typeof state) => { state = next; listeners.forEach(fn => fn()); };
  const reset = () => { epoch++; publish({ ...source.initial, pending: false }); };
  return {
    copy: source.copy,
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setField(field: keyof AuthCredentials, value: string) { publish({ ...state, [field]: value }); },
    togglePassword() { publish({ ...state, passwordVisible: !state.passwordVisible }); },
    concealPassword() { if (state.passwordVisible) publish({ ...state, passwordVisible: false }); },
    reset,
    async submit() {
      if (state.pending) return;
      const requestEpoch = epoch;
      const credentials = { username: state.username, password: state.password };
      publish({ ...state, passwordVisible: false, pending: true });
      if (requestEpoch !== epoch) return;
      try {
        const result = await adapter.submit(credentials);
        if (requestEpoch !== epoch) return;
        // The assigned preview can only report a blocked boundary, never authenticate.
        report({ action: 'submit', reason: result?.kind === 'blocked' && result.reason === 'MISSING_AUTH_OUTCOME'
          ? result.reason : 'UNAPPROVED_ADAPTER_OUTCOME' });
      } catch {
        if (requestEpoch === epoch) report({ action: 'submit', reason: 'UNAPPROVED_ADAPTER_OUTCOME' });
      } finally { if (requestEpoch === epoch) publish({ ...state, pending: false }); }
    },
    recover() { report({ action: 'recover', reason: adapter.recover().reason }); },
  };
}
