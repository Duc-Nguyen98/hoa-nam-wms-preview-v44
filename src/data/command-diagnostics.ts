/** Opt-in, per-tab command observations. Records are memory-only and never include request payloads. */
export type CommandDiagnosticSurface = 'WEB' | 'QA';
export type CommandDiagnosticStage = 'entered' | 'prepared' | 'dispatched' | 'response-validated'
  | 'rejected' | 'unknown' | 'blocked' | 'committed' | 'acknowledged';
export type CommandDiagnosticJournalState = 'unverified' | 'empty' | 'pending' | 'committed';

export interface CommandDiagnosticRecord {
  id: number;
  attempt: number;
  commandId: string;
  command: string;
  entityId?: string;
  expectedVersion?: number;
  surface: CommandDiagnosticSurface;
  scope: string;
  startedAt: string;
  updatedAt: string;
  elapsedMs: number;
  stage: CommandDiagnosticStage;
  journalState: CommandDiagnosticJournalState;
  code?: string;
  phases: Array<{
    stage: CommandDiagnosticStage;
    journalState: CommandDiagnosticJournalState;
    at: string;
    elapsedMs: number;
    code?: string;
  }>;
}

export interface CommandDiagnosticRequest {
  commandId?: unknown;
  command?: unknown;
  entityId?: unknown;
  expectedVersion?: unknown;
}

export interface CommandDiagnosticOptions {
  enabled: boolean;
  surface: CommandDiagnosticSurface;
  scope: string;
}

export interface CommandDiagnosticTrace {
  phase(stage: CommandDiagnosticStage, journalState: CommandDiagnosticJournalState, code?: unknown): void;
}

const MAX_RECORDS = 80;
const MAX_PHASES = 24;
const records: CommandDiagnosticRecord[] = [];
const starts = new WeakMap<CommandDiagnosticRecord, number>();
let enabled = false;
let sequence = 0;

const noTrace: CommandDiagnosticTrace = { phase: () => undefined };
const safeId = (value: unknown): string | undefined => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
const safeToken = (value: unknown, maxLength: number): string | undefined => typeof value === 'string'
  && value.length <= maxLength && /^[A-Za-z0-9._:-]+$/.test(value) ? value : undefined;
const safeCode = (value: unknown): string | undefined => typeof value === 'string'
  && /^[A-Z][A-Z0-9_]{0,79}$/.test(value) ? value : undefined;
const clock = () => globalThis.performance?.now?.() ?? Date.now();

export function setCommandDiagnosticsEnabled(value: boolean) { enabled = value; }

export function clearCommandDiagnostics() {
  records.length = 0;
}

export function commandDiagnosticsSnapshot() {
  return { enabled, records: structuredClone(records) };
}

/** Captures only the fixed command metadata allowlist; all failures are diagnostic-only. */
export function startCommandDiagnostic(
  options: CommandDiagnosticOptions,
  request: CommandDiagnosticRequest,
): CommandDiagnosticTrace {
  if (!enabled || !options.enabled) return noTrace;
  try {
    const commandId = safeId(request.commandId);
    const command = safeToken(request.command, 80);
    const scope = safeToken(options.scope, 128);
    const entityId = safeToken(request.entityId, 128);
    const surface = options.surface;
    if (!commandId || !command || !scope || (surface !== 'WEB' && surface !== 'QA')) return noTrace;
    const started = clock(), startedAt = new Date().toISOString();
    const attempt = 1 + records.filter(item => item.commandId === commandId && item.scope === scope && item.surface === surface).length;
    const record: CommandDiagnosticRecord = {
      id: ++sequence,
      attempt,
      commandId,
      command,
      ...(entityId ? { entityId } : {}),
      ...(Number.isSafeInteger(request.expectedVersion) && Number(request.expectedVersion) >= 0
        ? { expectedVersion: Number(request.expectedVersion) } : {}),
      surface,
      scope,
      startedAt,
      updatedAt: startedAt,
      elapsedMs: 0,
      stage: 'entered',
      journalState: 'unverified',
      phases: [{ stage: 'entered', journalState: 'unverified', at: startedAt, elapsedMs: 0 }],
    };
    starts.set(record, started);
    records.push(record);
    if (records.length > MAX_RECORDS) records.shift();
    return {
      phase(stage, journalState, rawCode) {
        try {
          const at = new Date().toISOString();
          const elapsedMs = Math.max(0, clock() - started);
          const code = safeCode(rawCode);
          record.updatedAt = at;
          record.elapsedMs = elapsedMs;
          record.stage = stage;
          record.journalState = journalState;
          if (code) record.code = code;
          else delete record.code;
          record.phases.push({ stage, journalState, at, elapsedMs, ...(code ? { code } : {}) });
          if (record.phases.length > MAX_PHASES) record.phases.shift();
        } catch { /* Diagnostics must never affect command behavior. */ }
      },
    };
  } catch { return noTrace; }
}

/** Updates only a command already observed in this tab; used after durable acknowledgement. */
export function updateCommandDiagnostic(
  commandId: string,
  scope: string,
  surface: CommandDiagnosticSurface,
  stage: CommandDiagnosticStage,
  journalState: CommandDiagnosticJournalState,
  rawCode?: unknown,
) {
  try {
    const record = [...records].reverse().find(item => item.commandId === commandId && item.scope === scope && item.surface === surface);
    // ACK observations cannot establish a commit for a blocked/rejected/unknown attempt.
    if (!record || record.stage !== 'committed') return;
    const at = new Date().toISOString();
    const code = safeCode(rawCode);
    const started = starts.get(record);
    const elapsedMs = started === undefined ? record.elapsedMs : Math.max(0, clock() - started);
    record.updatedAt = at;
    record.elapsedMs = elapsedMs;
    record.stage = stage;
    record.journalState = journalState;
    if (code) record.code = code;
    else delete record.code;
    record.phases.push({ stage, journalState, at, elapsedMs, ...(code ? { code } : {}) });
    if (record.phases.length > MAX_PHASES) record.phases.shift();
  } catch { /* Diagnostics must never affect command behavior. */ }
}
