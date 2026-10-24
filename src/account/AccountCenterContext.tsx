import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Button } from '../shared/primitives';
import { Icon } from '../shared/Icon';
import { restoreControlFocus } from '../shared/focus';
import { ACCOUNT_EN_COPY } from '../i18n/account-copy';
import { useUiCopy } from '../i18n/use-ui-copy';
import { ApiRequestError, subscribeSessionExpired } from '../data/http/api-client';
import { INITIAL_PROFILE, initialNotifications, clearEmailPreferences, normalizeProfile, notificationDirty, profileDirty, profileInitials, validateProfileDraft } from './account-center-model';
import type { NotificationChannel, NotificationKey, NotificationPreferences, ProfileDraft } from './account-center-model';
import type { AccountHttpApi, AccountPasswordUpdate, AccountRecord, AccountSession } from './account-api-contract';
import { accountHttpApi } from './account-http';
import { useProfileAvatar } from './useProfileAvatar';
import './account-runtime.css';

export type AccountAuthStatus = 'loading' | 'signed-out' | 'confirmation-required' | 'active' | 'error';
type Operation = 'login' | 'confirm' | 'logout' | 'profile' | 'notifications' | 'password';
const idleOperations = (): Record<Operation, boolean> => ({ login: false, confirm: false, logout: false, profile: false, notifications: false, password: false });
export function accountErrorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : 'Chưa thể hoàn tất yêu cầu. Vui lòng thử lại.';
}
interface AccountCenterValue {
  profile: { displayName: string; initials: string; avatarUrl?: string };
  avatar: ReturnType<typeof useProfileAvatar>;
  profileDraft: ProfileDraft;
  savedProfile: ProfileDraft;
  setProfileDraft: (patch: Partial<ProfileDraft>) => void;
  saveProfile: () => Promise<boolean>;
  resetProfile: () => void;
  notificationDraft: NotificationPreferences;
  savedNotifications: NotificationPreferences;
  setNotificationDraft: (key: NotificationKey, channel: NotificationChannel, value: boolean) => void;
  saveNotifications: () => Promise<boolean>;
  resetNotifications: () => void;
  changePassword: (value: AccountPasswordUpdate) => Promise<boolean>;
  requestLogout: (origin?: HTMLElement | null) => void;
  logout: () => Promise<boolean>;
  signedOut: boolean;
  authStatus: AccountAuthStatus;
  authError: string;
  pending: Record<Operation, boolean>;
  sessionContext: (AccountRecord['identity'] & { displayName: string; avatarText: string }) | null;
  refreshSession: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  confirmSession: () => Promise<boolean>;
}
const AccountCenterContext = createContext<AccountCenterValue | null>(null);
export const useAccountCenter = () => useContext(AccountCenterContext);

/** Account state is accepted only after its HTTP request succeeds; passwords remain form-local. */
export function AccountCenterProvider({ children, api = accountHttpApi }: { children: ReactNode; api?: AccountHttpApi }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const avatar = useProfileAvatar();
  const avatarRef = useRef(avatar); avatarRef.current = avatar;
  const [savedProfile, setSavedProfile] = useState<ProfileDraft>({ ...INITIAL_PROFILE });
  const [profileDraft, setDraft] = useState<ProfileDraft>({ ...INITIAL_PROFILE });
  const [savedNotifications, setSavedNotifications] = useState(initialNotifications);
  const [notificationDraft, setNotifications] = useState(initialNotifications);
  const [authStatus, setAuthStatus] = useState<AccountAuthStatus>('loading');
  const [authError, setAuthError] = useState('');
  const [accountRecord, setAccountRecord] = useState<AccountRecord | null>(null);
  const [pending, setPending] = useState(idleOperations);
  const pendingRequests = useRef(new Map<Operation, AbortController>());
  const sessionRequest = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const restoreFrame = useRef<number | null>(null);
  const dirty = avatar.dirty || avatar.pending || profileDirty(profileDraft, savedProfile) || notificationDirty(notificationDraft, savedNotifications);

  function acceptSession(session: AccountSession) {
    setAuthError('');
    setAuthStatus(session.state);
    if (session.state === 'signed-out') {
      setAccountRecord(null);
      setDraft({ ...INITIAL_PROFILE }); setSavedProfile({ ...INITIAL_PROFILE });
      setNotifications(initialNotifications()); setSavedNotifications(initialNotifications());
      avatarRef.current.clear();
    } else {
      const record = session.account;
      setAccountRecord(record);
      setDraft(record.profile); setSavedProfile(record.profile);
      setNotifications(record.notifications); setSavedNotifications(record.notifications);
      avatarRef.current.hydrate(record.avatar);
    }
  }
  function invalidateSession() {
    epoch.current++;
    sessionRequest.current?.abort();
    for (const request of pendingRequests.current.values()) request.abort();
    pendingRequests.current.clear();
    setPending(idleOperations());
    setLogoutOpen(false); setLogoutError('');
    acceptSession({ state: 'signed-out' });
  }
  async function refreshSession() {
    sessionRequest.current?.abort();
    const controller = new AbortController(); sessionRequest.current = controller;
    const ticket = epoch.current;
    setAuthStatus('loading'); setAuthError('');
    try {
      const session = await api.session(controller.signal);
      if (!controller.signal.aborted && epoch.current === ticket) acceptSession(session);
    } catch (error) {
      if (!controller.signal.aborted && epoch.current === ticket) { setAuthError(accountErrorMessage(error)); setAuthStatus('error'); }
    } finally { if (sessionRequest.current === controller) sessionRequest.current = null; }
  }
  useEffect(() => {
    const unsubscribe = subscribeSessionExpired(invalidateSession);
    void refreshSession();
    return () => {
      unsubscribe();
      sessionRequest.current?.abort();
      for (const request of pendingRequests.current.values()) request.abort();
      pendingRequests.current.clear();
      if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current);
    };
  }, [api]);
  function begin(kind: Operation) {
    if (pendingRequests.current.has(kind)) return null;
    const controller = new AbortController(); pendingRequests.current.set(kind, controller);
    setPending(current => ({ ...current, [kind]: true }));
    return controller;
  }
  function end(kind: Operation, controller: AbortController) {
    if (pendingRequests.current.get(kind) !== controller) return;
    pendingRequests.current.delete(kind); setPending(current => ({ ...current, [kind]: false }));
  }
  function onFailure(error: unknown): never {
    if (error instanceof ApiRequestError && error.status === 401 && error.code === 'SESSION_EXPIRED') {
      invalidateSession();
    }
    throw error;
  }
  async function login(username: string, password: string) {
    const controller = begin('login'); if (!controller) return false;
    const ticket = ++epoch.current;
    try {
      const session = await api.login(username, password, controller.signal);
      if (controller.signal.aborted || ticket !== epoch.current) return false;
      if (session.state !== 'confirmation-required' && session.state !== 'active') throw new ApiRequestError('INVALID_RESPONSE', 'Chưa thể xác nhận đăng nhập. Vui lòng thử lại.');
      acceptSession(session);
      window.location.hash = session.state === 'active' ? '#/preview/S01' : '#/preview/S08';
      return true;
    } finally { end('login', controller); }
  }
  async function confirmSession() {
    const controller = begin('confirm'); if (!controller) return false;
    const ticket = epoch.current;
    try {
      const session = await api.confirm(controller.signal);
      if (controller.signal.aborted || ticket !== epoch.current) return false;
      if (session.state !== 'active') throw new ApiRequestError('INVALID_RESPONSE', 'Chưa thể bắt đầu phiên làm việc. Vui lòng thử lại.');
      acceptSession(session); window.location.hash = '#/preview/S01'; return true;
    } catch (error) { return onFailure(error); }
    finally { end('confirm', controller); }
  }
  async function logout() {
    const controller = begin('logout'); if (!controller) return false;
    setLogoutError('');
    try {
      await api.logout(controller.signal);
      epoch.current++;
      for (const [kind, request] of pendingRequests.current) if (kind !== 'logout') request.abort();
      sessionRequest.current?.abort();
      setLogoutOpen(false); acceptSession({ state: 'signed-out' });
      window.location.replace('#/preview/S07'); return true;
    } finally { end('logout', controller); }
  }
  async function confirmLogout() {
    try { await logout(); } catch (error) { setLogoutError(accountErrorMessage(error)); }
  }
  function closeLogout() {
    if (pendingRequests.current.has('logout')) return;
    setLogoutOpen(false);
    if (restoreFrame.current !== null) cancelAnimationFrame(restoreFrame.current);
    restoreFrame.current = requestAnimationFrame(() => {
      restoreFrame.current = null;
      const target = origin.current;
      if (target?.isConnected && target.closest('.hn-header') && target.getClientRects().length) target.focus({ preventScroll: true });
      else restoreControlFocus(target);
    });
  }
  function keepLogoutFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  useLayoutEffect(() => {
    const node = dialog.current; if (!node) return;
    if (logoutOpen && !node.open) { node.showModal(); cancelButton.current?.focus(); }
    else if (!logoutOpen && node.open) node.close();
  }, [logoutOpen]);
  useEffect(() => {
    if (!logoutOpen) return;
    const overflow = document.body.style.overflow, padding = document.body.style.paddingRight;
    const gutter = innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) document.body.style.paddingRight = `${(parseFloat(getComputedStyle(document.body).paddingRight) || 0) + gutter}px`;
    document.body.style.overflow = 'hidden';
    const onHash = () => setLogoutOpen(false);
    window.addEventListener('hashchange', onHash);
    return () => { document.body.style.overflow = overflow; document.body.style.paddingRight = padding; window.removeEventListener('hashchange', onHash); };
  }, [logoutOpen]);
  const value: AccountCenterValue = {
    profile: { displayName: savedProfile.displayName, initials: profileInitials(savedProfile.displayName), avatarUrl: avatar.saved ?? undefined },
    avatar, savedProfile, profileDraft, pending, authStatus, authError,
    signedOut: authStatus === 'signed-out',
    sessionContext: accountRecord ? { ...accountRecord.identity, displayName: accountRecord.profile.displayName, avatarText: profileInitials(accountRecord.profile.displayName) } : null,
    refreshSession, login, confirmSession, logout,
    setProfileDraft: patch => setDraft(current => ({ ...current, ...patch })),
    async saveProfile() {
      if (avatar.pending || pendingRequests.current.has('notifications') || Object.keys(validateProfileDraft(profileDraft)).length) return false;
      const controller = begin('profile'); if (!controller) return false;
      const ticket = epoch.current, submitted = { ...profileDraft }, submittedAvatar = avatar.draft;
      try {
        const image = await avatarRef.current.serialize(controller.signal);
        const result = await api.profile({ ...normalizeProfile(submitted), avatar: image }, controller.signal);
        if (controller.signal.aborted || ticket !== epoch.current) return false;
        setSavedProfile(result.profile); setDraft(current => profileDirty(current, submitted) ? current : result.profile);
        setAccountRecord(result); avatarRef.current.commit(result.avatar, submittedAvatar);
        if (!result.profile.email) { setNotifications(clearEmailPreferences); setSavedNotifications(result.notifications); }
        return true;
      } catch (error) { return onFailure(error); }
      finally { end('profile', controller); }
    },
    resetProfile() { if (!pendingRequests.current.has('profile')) { setDraft({ ...savedProfile }); avatar.reset(); } },
    notificationDraft, savedNotifications,
    setNotificationDraft(key, channel, checked) {
      if (channel === 'email' && !savedProfile.email) return;
      setNotifications(current => ({ ...current, [key]: { ...current[key], [channel]: checked } }));
    },
    async saveNotifications() {
      if (pendingRequests.current.has('profile')) return false;
      const controller = begin('notifications'); if (!controller) return false;
      const ticket = epoch.current, submitted = structuredClone(notificationDraft);
      try {
        const result = await api.notifications(savedProfile.email ? submitted : clearEmailPreferences(submitted), controller.signal);
        if (controller.signal.aborted || ticket !== epoch.current) return false;
        setSavedNotifications(result.notifications); setNotifications(current => notificationDirty(current, submitted) ? current : result.notifications);
        setAccountRecord(result); return true;
      } catch (error) { return onFailure(error); }
      finally { end('notifications', controller); }
    },
    resetNotifications: () => { if (!pendingRequests.current.has('notifications')) setNotifications(savedNotifications); },
    async changePassword(passwords) {
      const controller = begin('password'); if (!controller) return false;
      const ticket = epoch.current;
      try { await api.password(passwords, controller.signal); return !controller.signal.aborted && ticket === epoch.current; }
      catch (error) { return onFailure(error); }
      finally { end('password', controller); }
    },
    requestLogout(control) {
      if (restoreFrame.current !== null) { cancelAnimationFrame(restoreFrame.current); restoreFrame.current = null; }
      origin.current = control ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      setLogoutError(''); setLogoutOpen(true);
    },
  };
  return <AccountCenterContext.Provider value={value}>
    {children}
    <dialog ref={dialog} className="account-logout-dialog" data-hn-control-theme aria-labelledby="account-logout-title" aria-describedby="account-logout-description"
      onKeyDown={keepLogoutFocus} onCancel={event => { event.preventDefault(); closeLogout(); }} onClose={() => setLogoutOpen(false)}>
      <div className="account-logout-heading"><span className="account-logout-symbol"><Icon name="logout" size={24} /></span><h2 id="account-logout-title">{tx('Đăng xuất khỏi Hoa Nam WMS?')}</h2><Button variant="ghost" iconOnly aria-label={tx('Đóng xác nhận đăng xuất')} aria-disabled={pending.logout} onClick={closeLogout}><Icon name="close" /></Button></div>
      <div className="account-logout-body" tabIndex={0} role="region" aria-label={tx('Thông tin đăng xuất')}>
        <p id="account-logout-description">{tx('Bạn sẽ trở về màn hình đăng nhập. Đăng xuất không kết thúc ca làm việc hoặc thay đổi phiếu kho.')}</p>
        {dirty && <p className="account-logout-warning"><Icon name="alert-triangle" />{tx('Các thay đổi chưa lưu sẽ bị bỏ.')}</p>}
        {logoutError && <p className="account-logout-warning" role="alert">{tx(logoutError)}</p>}
      </div>
      <div className="account-logout-actions"><button ref={cancelButton} type="button" className="hn-button hn-button--secondary" data-hn-control="button" aria-disabled={pending.logout} onClick={closeLogout}>{tx('Ở lại')}</button><Button tone="danger" loading={pending.logout} leadingIcon={<Icon name="logout" />} onClick={() => { void confirmLogout(); }}>{tx('Đăng xuất')}</Button></div>
    </dialog>
  </AccountCenterContext.Provider>;
}
export function AccountSignedOutView({ children }: { children: ReactNode }) {
  return <div className="account-signedout">{children}</div>;
}
