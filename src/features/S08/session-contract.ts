import type { AuthCopy } from '../S07/auth-contract';

/** Preview vocabulary only; never a backend DTO or permission grant. */
export interface SessionContext {
  avatarText: string;
  displayName: string;
  roleLabel: string;
  warehouseLabel: string;
  warehouseStatusLabel: string;
  verification: 'P01_CONTEXT_FIXTURE_ONLY';
}
export interface SessionCopy {
  layout: AuthCopy;
  title: string;
  instruction: string;
  confirm: string;
  logout: string;
}
export type SessionBlocker = 'MISSING_CONFIRMATION_TARGET' | 'MISSING_CONTEXT' | 'UNAPPROVED_ADAPTER_OUTCOME';
export interface SessionResult { kind: 'blocked'; reason: SessionBlocker }
export interface SessionAdapter {
  readDefault(): { context: SessionContext | null; copy: SessionCopy };
  confirm(): Promise<SessionResult>;
  reset(): void;
}
export interface SessionDiagnostic { action: 'confirm'; reason: SessionBlocker }
