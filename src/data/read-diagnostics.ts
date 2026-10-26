/** Explicit QA opt-in, memory only. Never records actors, tokens, requests or data. */
export interface ReadDiagnostic {
  id: number; scope: string; operation: 'restore' | 'snapshot'; startedAt: string;
  status: 'pending' | 'success' | 'failure' | 'timeout'; phase: string; elapsedMs: number; code?: string;
  phases: { phase: string; elapsedMs: number; visibility: string }[];
}
let enabled = false, sequence = 0;
const records: ReadDiagnostic[] = [];
export type ReadStorageDiagnosticName = 'account.queue-wait' | 'account.web-lock-wait' | 'account.load'
  | 'business.idb.transaction';
export type ReadStorageDiagnosticPhase = 'start' | 'queue.ready' | 'web-lock.request' | 'web-lock.enter'
  | 'load.read.start' | 'load.read.end' | 'open.start' | 'open.end' | 'transaction.queued' | 'transaction.create'
  | 'cursor.request' | 'cursor.result' | 'change.start' | 'change.end' | 'clone.start' | 'clone.end'
  | 'transaction.complete' | 'transaction.abort' | 'finish';
export interface ReadStorageDiagnostic {
  id: number; name: ReadStorageDiagnosticName; startedAt: string;
  status: 'pending' | 'complete' | 'failure'; durationMs: number;
  phases: { phase: ReadStorageDiagnosticPhase; elapsedMs: number }[];
}
export type ListReadDiagnosticScope = 'S01' | 'S02' | 'S24' | 'S29.users' | 'S29.roles';
export type ListReadDiagnosticResultKind = 'ready' | 'blocked' | 'error' | 'other';
export interface ListReadDiagnostic {
  id: number; scope: ListReadDiagnosticScope; startedAt: string;
  status: 'pending' | 'complete' | 'failure'; durationMs: number;
  resultKind: ListReadDiagnosticResultKind | null;
}
let storageSequence = 0;
const storageRecords: ReadStorageDiagnostic[] = [];
let listSequence = 0;
const listRecords: ListReadDiagnostic[] = [];
const clock = () => globalThis.performance?.now() ?? Date.now();
const visibility = () => typeof document === 'undefined' ? 'unavailable' : document.visibilityState;
export interface ReadLifecycleDiagnostic {
  id: number; documentId: string; event: 'enabled' | 'visibilitychange' | 'focus' | 'blur' | 'pageshow' | 'pagehide';
  at: string; elapsedMs: number; visibility: string; focused: boolean; trusted: boolean;
  screen: string | null; readCursor: number;
}
let documentId: string | null = null, lifecycleSequence = 0;
const lifecycle: ReadLifecycleDiagnostic[] = [];
let removeLifecycleObservers: (() => void) | null = null;
export type QaSerializationScope = 'canonical' | 'command-evidence' | 'read-trace';
const serialization: { scope: QaSerializationScope; startMs: number; durationMs: number; characters: number }[] = [];
const longTasks: { startMs: number; durationMs: number; deliveryVisibility: string; readCursorAtDelivery: number }[] = [];
const schedulingGaps: { expectedMs: number; resumedMs: number; delayMs: number; visibility: string; readCursor: number }[] = [];
let measurementStartMs = 0;
let removeSchedulingObservers: (() => void) | null = null;
/** Observe scheduling only after explicit QA opt-in; never reads application data. */
function observeScheduling() {
  if (removeSchedulingObservers || typeof window === 'undefined') return;
  let observer: PerformanceObserver | undefined, timer: ReturnType<typeof setTimeout> | undefined;
  let active = true;
  const cleanup = () => { active = false; if (timer !== undefined) clearTimeout(timer); try { observer?.disconnect(); } catch { /* Passive cleanup. */ } };
  removeSchedulingObservers = cleanup;
  try {
    if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      observer = new PerformanceObserver(list => {
        if (!active || !enabled) return;
        try { for (const entry of list.getEntries()) {
          if (entry.startTime < measurementStartMs) continue;
          longTasks.push({ startMs: entry.startTime, durationMs: entry.duration, deliveryVisibility: visibility(), readCursorAtDelivery: sequence });
          if (longTasks.length > 256) longTasks.shift();
        } } catch { /* Diagnostics must never affect workflow. */ }
      });
      observer.observe({ type: 'longtask' });
    }
  } catch { try { observer?.disconnect(); } catch { /* Optional browser support. */ } }
  const schedule = () => {
    const expectedMs = clock() + 250;
    timer = setTimeout(() => {
      if (!active || !enabled) return;
      try {
        const resumedMs = clock(), delayMs = resumedMs - expectedMs;
        if (delayMs >= 100 && expectedMs >= measurementStartMs) {
          schedulingGaps.push({ expectedMs, resumedMs, delayMs, visibility: visibility(), readCursor: sequence });
          if (schedulingGaps.length > 256) schedulingGaps.shift();
        }
      } catch { /* Passive timing only. */ }
      schedule();
    }, 250);
  };
  try { schedule(); } catch { cleanup(); removeSchedulingObservers = null; }
}
/** Same JSON rendering as before; only fixed labels, size and duration are retained. */
export function serializeQaDiagnostic(value: unknown, scope: QaSerializationScope): string | undefined {
  if (!enabled) return JSON.stringify(value, null, 2);
  let startMs: number | undefined;
  try { startMs = clock(); } catch { /* Rendering is independent of the timing clock. */ }
  const result = JSON.stringify(value, null, 2);
  try {
    if (startMs !== undefined) {
      serialization.push({ scope, startMs, durationMs: Math.max(0, clock() - startMs), characters: result?.length ?? 0 });
      if (serialization.length > 256) serialization.shift();
    }
  } catch { /* Preserve the rendered result even if observation fails. */ }
  return result;
}
function observeLifecycle() {
  if (removeLifecycleObservers || typeof document === 'undefined' || typeof window === 'undefined') return;
  const doc = document, win = window;
  const attached: { target: EventTarget; name: string; listener: EventListener }[] = [];
  const remove = () => { for (const item of attached) { try { item.target.removeEventListener(item.name, item.listener); } catch { /* Passive cleanup. */ } } };
  try {
    documentId ??= crypto.randomUUID();
    const record = (event: ReadLifecycleDiagnostic['event'], trusted: boolean) => {
      if (!enabled || !documentId) return;
      try {
        lifecycle.push({ id: ++lifecycleSequence, documentId, event, at: new Date().toISOString(), elapsedMs: clock(),
          visibility: doc.visibilityState, focused: doc.hasFocus(), trusted,
          screen: /^#\/preview\/(S\d{2})(?:\?|$)/.exec(win.location.hash)?.[1] ?? null, readCursor: sequence });
        if (lifecycle.length > 256) lifecycle.shift();
      } catch { /* Passive observer; never changes application behavior. */ }
    };
    const onVisibility = (event: Event) => { if (event.isTrusted) record('visibilitychange', true); };
    const onWindow = (event: Event) => { if (event.isTrusted) record(event.type as 'focus' | 'blur' | 'pageshow' | 'pagehide', true); };
    const add = (target: EventTarget, name: string, listener: EventListener) => { target.addEventListener(name, listener); attached.push({ target, name, listener }); };
    add(doc, 'visibilitychange', onVisibility);
    for (const name of ['focus', 'blur', 'pageshow', 'pagehide']) add(win, name, onWindow);
    removeLifecycleObservers = remove;
    record('enabled', false);
  } catch { remove(); /* Observation failure must never alter reads or commands. */ }
}
export function setReadDiagnosticsEnabled(value: boolean) {
  enabled = value;
  if (enabled) { observeLifecycle(); observeScheduling(); }
  else {
    try { removeLifecycleObservers?.(); } catch { /* Passive cleanup. */ } removeLifecycleObservers = null;
    try { removeSchedulingObservers?.(); } catch { /* Passive cleanup. */ } removeSchedulingObservers = null;
  }
}
export function clearReadDiagnostics() {
  records.length = 0; storageRecords.length = 0; listRecords.length = 0; lifecycle.length = 0; serialization.length = 0; longTasks.length = 0; schedulingGaps.length = 0;
  try { measurementStartMs = clock(); } catch { /* Diagnostic clock failure does not affect data. */ }
}
export function readDiagnosticsSnapshot() { return { enabled, documentId, timeOrigin: globalThis.performance?.timeOrigin ?? null, measurementStartMs, lifecycle: structuredClone(lifecycle), records: structuredClone(records), spans: structuredClone(storageRecords), listSpans: structuredClone(listRecords), serialization: structuredClone(serialization), longTasks: structuredClone(longTasks), schedulingGaps: structuredClone(schedulingGaps) }; }
/** Fixed-scope timing only; list inputs, outputs, errors and actors are never retained. */
export function trackListRead<T extends { kind?: unknown }>(scope: ListReadDiagnosticScope, invoke: () => Promise<T>): Promise<T> {
  if (!enabled) return invoke();
  let started = 0;
  let record: ListReadDiagnostic | null = null;
  try {
    started = clock();
    record = { id: ++listSequence, scope, startedAt: new Date().toISOString(), status: 'pending', durationMs: 0, resultKind: null };
    listRecords.push(record); if (listRecords.length > 256) listRecords.shift();
  } catch { record = null; }
  const finish = (status: 'complete' | 'failure', resultKind: ListReadDiagnosticResultKind | null) => {
    if (!record) return;
    try {
      record.status = status;
      record.durationMs = Math.max(0, clock() - started);
      record.resultKind = resultKind;
    } catch { /* Diagnostics never affect workflow. */ }
  };
  let pending: Promise<T>;
  try { pending = invoke(); }
  catch (error) { finish('failure', 'error'); throw error; }
  return pending.then(result => {
    let resultKind: ListReadDiagnosticResultKind = 'other';
    try {
      resultKind = result?.kind === 'ready' ? 'ready'
        : result?.kind === 'blocked' ? 'blocked' : result?.kind === 'error' ? 'error' : 'other';
    } catch { /* A diagnostic must not inspect or alter a caller result. */ }
    finish(resultKind === 'error' ? 'failure' : 'complete', resultKind);
    return result;
  }, error => {
    finish('failure', 'error');
    throw error;
  });
}
/** Opt-in timing only. Names and phase labels are fixed by source; no payloads are accepted. */
export function startReadStorageDiagnostic(name: ReadStorageDiagnosticName) {
  if (!enabled) return { phase: (_phase: ReadStorageDiagnosticPhase) => {}, finish: (_status: 'complete' | 'failure' = 'complete') => {} };
  let start: number, record: ReadStorageDiagnostic;
  try {
    start = clock();
    record = { id: ++storageSequence, name, startedAt: new Date().toISOString(), status: 'pending', durationMs: 0, phases: [] };
    storageRecords.push(record); if (storageRecords.length > 256) storageRecords.shift();
    record.phases.push({ phase: 'start', elapsedMs: 0 });
  } catch { return { phase: (_phase: ReadStorageDiagnosticPhase) => {}, finish: (_status: 'complete' | 'failure' = 'complete') => {} }; }
  let finished = false;
  return {
    phase(phase: ReadStorageDiagnosticPhase) {
      if (finished) return;
      try { record.phases.push({ phase, elapsedMs: Math.max(0, clock() - start) }); } catch { /* Diagnostics never affect workflow. */ }
    },
    finish(status: 'complete' | 'failure' = 'complete') {
      if (finished) return;
      finished = true;
      try { record.status = status; record.durationMs = Math.max(0, clock() - start); record.phases.push({ phase: 'finish', elapsedMs: record.durationMs }); } catch { /* Diagnostics never affect workflow. */ }
    },
  };
}
export function startReadDiagnostic(scope: string, operation: ReadDiagnostic['operation']) {
  let start: number, record: ReadDiagnostic | null;
  try {
    start = clock();
    record = enabled ? { id: ++sequence, scope, operation, startedAt: new Date().toISOString(), status: 'pending', phase: 'start', elapsedMs: 0, phases: [] } : null;
    if (record) { records.push(record); if (records.length > 80) records.shift(); }
  } catch {
    return { phase(_name: string) {}, finish(_status: Exclude<ReadDiagnostic['status'], 'pending'>, _code?: string) {} };
  }
  let finished = false;
  const phase = (name: string) => {
    if (!record || finished) return;
    try {
      record.phase = name; record.elapsedMs = Math.max(0, clock() - start);
      record.phases.push({ phase: name, elapsedMs: record.elapsedMs, visibility: visibility() });
    } catch { /* Passive diagnostics never affect recovery or command execution. */ }
  };
  phase('start');
  return {
    phase,
    finish(status: Exclude<ReadDiagnostic['status'], 'pending'>, code?: string) {
      if (!record || finished) return;
      finished = true;
      try {
        record.status = status; record.elapsedMs = Math.max(0, clock() - start);
        if (code) record.code = /^[A-Z][A-Z0-9_]{0,79}$/.test(code) ? code : 'READ_FAILED';
      } catch { /* Passive diagnostics never affect recovery or command execution. */ }
    },
  };
}
export type ReadDiagnosticTrace = ReturnType<typeof startReadDiagnostic>;
