import type { NotificationPreferences, ProfileDraft } from './account-center-model';

/** Versioned application API contract. See AUTH_HTTP_HANDOFF.md for local seed provenance. */
export interface AccountRecord {
  profile: ProfileDraft;
  avatar: string | null;
  notifications: NotificationPreferences;
  identity: { username: string; roleLabel: string; warehouseLabel: string; warehouseStatusLabel: string };
}
export type AccountSession = { state: 'signed-out' } | { state: 'confirmation-required' | 'active'; account: AccountRecord };
export interface AccountProfileUpdate extends ProfileDraft { avatar: string | null }
export interface AccountPasswordUpdate { currentPassword: string; newPassword: string }
export interface AccountHttpApi {
  session(signal?: AbortSignal): Promise<AccountSession>;
  login(username: string, password: string, signal?: AbortSignal): Promise<AccountSession>;
  confirm(signal?: AbortSignal): Promise<AccountSession>;
  logout(signal?: AbortSignal): Promise<void>;
  profile(value: AccountProfileUpdate, signal?: AbortSignal): Promise<AccountRecord>;
  notifications(value: NotificationPreferences, signal?: AbortSignal): Promise<AccountRecord>;
  password(value: AccountPasswordUpdate, signal?: AbortSignal): Promise<void>;
}
