/** Preview-only contracts. None of these names are confirmed backend DTO fields. */
export interface AuthCredentials { username: string; password: string }
export interface AuthInitial extends AuthCredentials { passwordVisible: boolean }
export interface AuthCopy {
  brand: string; subtitle: string; heading: string[]; introduction: string;
  pillars: string[]; username: string; usernamePlaceholder: string;
  password: string; passwordPlaceholder: string; showPassword: string; hidePassword: string;
  forgotPassword: string; submit: string; accessTitle: string; accessDescription: string; footer: string;
}
export type AuthBlockedReason = 'MISSING_AUTH_OUTCOME' | 'MISSING_RECOVERY_FLOW' | 'UNAPPROVED_ADAPTER_OUTCOME';
export interface AuthResult { kind: 'blocked'; reason: AuthBlockedReason }
export interface AuthAdapter {
  readDefault(): { initial: AuthInitial; copy: AuthCopy };
  submit(credentials: Readonly<AuthCredentials>): Promise<AuthResult>;
  recover(): AuthResult;
}
export interface AuthDiagnostic { action: 'submit' | 'recover'; reason: AuthBlockedReason }
