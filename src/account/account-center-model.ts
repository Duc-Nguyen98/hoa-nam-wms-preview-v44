import shellPresentation from '../data/fixtures/S01.presentation.json';

export type AccountPanel = 'profile' | 'security' | 'settings' | 'notifications';
export const ACCOUNT_PANELS: Readonly<Record<AccountPanel, string>> = {
  profile: 'Tài khoản của tôi', security: 'Bảo mật tài khoản', settings: 'Cài đặt cá nhân', notifications: 'Tùy chọn thông báo',
};
export function resolveAccountPanel(hash: string): AccountPanel | null {
  const candidate = hash.replace('#/account/', '');
  return hash.startsWith('#/account/') && Object.hasOwn(ACCOUNT_PANELS, candidate) ? candidate as AccountPanel : null;
}
export interface ProfileDraft { displayName: string; email: string; phone: string }
// Source identity is a visual fixture, never a claim about authentication/RBAC.
export const INITIAL_PROFILE: Readonly<ProfileDraft> = { displayName: shellPresentation.profile.displayName, email: '', phone: '' };
export function normalizeProfile(draft: ProfileDraft): ProfileDraft {
  return { displayName: draft.displayName.trim().replace(/\s+/g, ' '), email: draft.email.trim(), phone: draft.phone.trim() };
}
export function profileInitials(name: string) {
  if (name.trim().replace(/\s+/g, ' ') === INITIAL_PROFILE.displayName) return shellPresentation.profile.initials;
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? [words[0], words.at(-1)!] : words).map(word => Array.from(word)[0]).join('').toLocaleUpperCase('vi').slice(0, 4) || 'TK';
}
export function validateProfileDraft(draft: ProfileDraft): Partial<Record<keyof ProfileDraft, string>> {
  const next = normalizeProfile(draft);
  const errors: Partial<Record<keyof ProfileDraft, string>> = {};
  if (!next.displayName) errors.displayName = 'Nhập họ và tên.';
  else if (Array.from(next.displayName).length > 80) errors.displayName = 'Họ và tên không quá 80 ký tự.';
  if (next.email && (next.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email))) errors.email = 'Nhập địa chỉ email hợp lệ.';
  if (next.phone.length > 30) errors.phone = 'Số điện thoại không quá 30 ký tự.';
  return errors;
}
export function profileDirty(draft: ProfileDraft, saved: ProfileDraft) {
  return draft.displayName !== saved.displayName || draft.email !== saved.email || draft.phone !== saved.phone;
}
export type NotificationKey = 'assignments' | 'discrepancies' | 'accountActivity';
export type NotificationChannel = 'inApp' | 'email';
export type NotificationPreferences = Record<NotificationKey, Record<NotificationChannel, boolean>>;
export const NOTIFICATION_KEYS: readonly NotificationKey[] = ['assignments', 'discrepancies', 'accountActivity'];
export function initialNotifications(): NotificationPreferences {
  return { assignments: { inApp: false, email: false }, discrepancies: { inApp: false, email: false }, accountActivity: { inApp: false, email: false } };
}
export function notificationDirty(draft: NotificationPreferences, saved: NotificationPreferences) {
  return NOTIFICATION_KEYS.some(key => draft[key].inApp !== saved[key].inApp || draft[key].email !== saved[key].email);
}
export function clearEmailPreferences(value: NotificationPreferences): NotificationPreferences {
  return Object.fromEntries(NOTIFICATION_KEYS.map(key => [key, { ...value[key], email: false }])) as NotificationPreferences;
}
