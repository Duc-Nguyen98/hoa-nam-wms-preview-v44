export interface NavigationAttempt {
  from: string;
  to: string;
}

export interface NavigationGuard {
  isDirty: () => boolean;
  discard: () => void;
}

let activeGuard: NavigationGuard | null = null;
let attempt: NavigationAttempt | null = null;
let approvedTarget: string | null = null;
const listeners = new Set<() => void>();

export function registerNavigationGuard(guard: NavigationGuard) {
  activeGuard = guard;
  return () => {
    if (activeGuard === guard) {
      activeGuard = null;
      attempt = null;
      approvedTarget = null;
      emit();
    }
  };
}

export function subscribeNavigationBlocker(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNavigationAttempt() {
  return attempt;
}

export function getNavigationGuard() {
  return activeGuard;
}

export function consumeApprovedNavigation(target: string) {
  if (approvedTarget !== target) return false;
  approvedTarget = null;
  return true;
}

export function blockNavigation(next: NavigationAttempt) {
  if (!activeGuard?.isDirty()) return false;
  attempt = next;
  emit();
  return true;
}

export function cancelNavigation() {
  attempt = null;
  emit();
}

export function discardAndContinueNavigation() {
  if (!attempt || !activeGuard) return;
  const next = attempt.to;
  activeGuard.discard();
  approvedTarget = next;
  attempt = null;
  emit();
  window.location.hash = next;
}

export function continueNavigation() {
  if (!attempt) return;
  const next = attempt.to;
  approvedTarget = next;
  attempt = null;
  emit();
  window.location.hash = next;
}

function emit() {
  listeners.forEach(listener => listener());
}
