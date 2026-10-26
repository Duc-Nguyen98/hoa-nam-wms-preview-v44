export interface ReviewDiagnostic {
  kind: 'blocked-action' | 'blocked-query' | 'runtime-error';
  key: string;
  detail: string;
}
const diagnostics: ReviewDiagnostic[] = [];
export function recordReviewDiagnostic(diagnostic: ReviewDiagnostic) {
  diagnostics.push(diagnostic);
  if (diagnostics.length > 100) diagnostics.shift();
}
export function recordUnresolvedAction(key: string) {
  recordReviewDiagnostic({ kind: 'blocked-action', key, detail: 'Entry point retained from approved visual; destination/flow is not supplied for the current screen scope.' });
}

/** Screen-owned preview blockers may expose their contract reason without
 * leaking form values or turning the action into a success signal. */
export function recordBlockedAction(key: string, detail: string) {
  recordReviewDiagnostic({ kind: 'blocked-action', key, detail });
}

declare global {
  interface Window {
    __HN_REVIEW__: { getDiagnostics: () => ReviewDiagnostic[]; clearDiagnostics: () => void };
  }
}
// Read-only review harness surface in the separate fixture preview, never a product control.
window.__HN_REVIEW__ = {
  getDiagnostics: () => structuredClone(diagnostics),
  clearDiagnostics: () => { diagnostics.length = 0; },
};
