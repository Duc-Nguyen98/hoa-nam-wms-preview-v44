import { OPEN_NOTIFICATION_EVENT } from '../notifications/open-notification';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, RefObject } from 'react';
import { Icon } from './Icon';
import { revealControl } from './focus';
import { matchShellDestinations } from './s00-navigation';
import type { ShellDestination } from './s00-navigation';
import { useShellUi } from './shell-locale';
import type { ShellLanguage } from './shell-preferences';
import { useShortcutPreferences } from './shortcut-preferences';
import { SHORTCUT_LIMIT } from './shortcut-model';
import { ShortcutSettings } from './ShortcutSettings';
import { Button } from './primitives';
import { IS_BROWSER_PREVIEW } from '../preview-mode';
import { PreviewNotificationCenter } from '../notifications/PreviewNotificationCenter';
import { dispatchPreviewNotification, usePreviewNotifications } from '../notifications/notification-preview-store';
import { NotificationBell } from '../notifications/NotificationBell';
import { useAccountCenter } from '../account/AccountCenterContext';
import { Notice } from './Notice';
import { acquireBodyScrollLock } from './body-scroll-lock';

export function focusShellContent() {
  requestAnimationFrame(() => document.getElementById('main-content')?.focus({ preventScroll: true }));
}

type HeaderPopup = 'shortcuts' | 'profile' | 'notifications' | 'language' | 'theme';
const languageOptions: readonly { value: ShellLanguage; label: string; nativeLabel: string }[] = [
  { value: 'vi', label: 'Tiếng Việt', nativeLabel: 'VI' },
  { value: 'en', label: 'English', nativeLabel: 'EN' },
  { value: 'zh-CN', label: '简体中文', nativeLabel: '中' },
];

function revealHeaderControl(control: HTMLElement) {
  const scroller = control.closest<HTMLElement>('.hn-shortcut-grid, .hn-header-option-list, .hn-profile-menu-body, .hn-search-results');
  if (!scroller) return;
  const target = control.getBoundingClientRect();
  const bounds = scroller.getBoundingClientRect();
  const clearance = 6;
  if (target.top < bounds.top + clearance) scroller.scrollTop -= bounds.top + clearance - target.top;
  else if (target.bottom > bounds.bottom - clearance) scroller.scrollTop += target.bottom - bounds.bottom + clearance;
}

function focusHeaderControl(control?: HTMLElement | null) {
  control?.focus({ preventScroll: true });
  if (control) revealHeaderControl(control);
}

function observeHeaderFocus(scope: HTMLElement) {
  const observer = new ResizeObserver(() => {
    const target = document.activeElement;
    if (target instanceof HTMLElement && scope.contains(target)) revealHeaderControl(target);
  });
  scope.querySelectorAll('.hn-shortcut-grid, .hn-header-option-list, .hn-profile-menu-body, .hn-search-results').forEach(element => observer.observe(element));
  return () => observer.disconnect();
}

export function ShellHeaderActions({ destinations, profile, layoutMode, activeKey, accountLinks, onLogout }: {
  destinations: readonly ShellDestination[];
  profile?: { displayName: string; initials: string; avatarUrl?: string };
  layoutMode: string;
  activeKey?: string;
  accountLinks?: { profileHref: string; settingsHref: string };
  onLogout?: (origin: HTMLElement | null) => void;
}) {
  const { language, theme, setLanguage, setTheme, t } = useShellUi();
  const [popup, setPopup] = useState<HeaderPopup | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const account = useAccountCenter();
  const notificationActor = IS_BROWSER_PREVIEW && account?.authStatus === 'active' ? account.sessionContext?.username ?? null : null;
  const previewNotifications = usePreviewNotifications(notificationActor);
  useEffect(() => {
    if (!IS_BROWSER_PREVIEW || !notificationActor) return;
    let active = true, request = 0;
    const openRelated = async (event: Event) => {
      const id = (event as CustomEvent<{id?:string}>).detail?.id;
      const sequence = ++request;
      setPopup(null);
      const selected = await dispatchPreviewNotification(id ? {type:'open',id} : {type:'back'});
      // A direct document load can render before the actor's notification read
      // finishes. Resolve the requested record before opening the center.
      if (id && !selected) {
        await dispatchPreviewNotification({type:'retry'});
        if (!active || sequence !== request) return;
        await dispatchPreviewNotification({type:'open',id});
      }
      if (active && sequence === request) setNotificationOpen(true);
    };
    window.addEventListener(OPEN_NOTIFICATION_EVENT, openRelated);
    return () => { active = false; window.removeEventListener(OPEN_NOTIFICATION_EVENT, openRelated); };
  }, [notificationActor]);
  const unread = previewNotifications.actorBinding === notificationActor ? previewNotifications.totalUnread : null;
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutSettingsOpen, setShortcutSettingsOpen] = useState(false);
  const [shortcutNotice, setShortcutNotice] = useState<{ kind: 'saved' | 'sessionOnly'; sequence: number } | null>(null);
  const shortcutSequence = useRef(0);
  const shortcutPreferences = useShortcutPreferences(destinations.map(item => item.key));
  const shortcuts = shortcutPreferences.keys.flatMap(key => {
    const item = destinations.find(destination => destination.key === key);
    return item ? [item] : [];
  });
  const accountRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Partial<Record<HeaderPopup, HTMLButtonElement | null>>>({});
  const searchRef = useRef<HTMLButtonElement>(null);
  const searchOpenerRef = useRef<HTMLElement | null>(null);
  const profileFocusLast = useRef(false);
  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  const closePopup = (restore = false) => {
    if (restore && popup) triggerRefs.current[popup]?.focus({ preventScroll: true });
    setPopup(null);
  };
  useLayoutEffect(() => {
    const focusIsInside = accountRef.current?.querySelector('.hn-header-popup')?.contains(document.activeElement);
    closePopup(Boolean(focusIsInside));
  }, [layoutMode]);
  useLayoutEffect(() => {
    if (popup) {
      const panel = accountRef.current?.querySelector('.hn-header-popup');
      const profileActions = popup === 'profile' ? panel?.querySelectorAll<HTMLElement>('.hn-profile-menu-action') : undefined;
      const target = profileFocusLast.current && profileActions?.length ? profileActions[profileActions.length - 1] : panel?.querySelector<HTMLElement>('.hn-header-option[aria-pressed="true"]')
        ?? panel?.querySelector<HTMLElement>('.hn-header-option, a')
        ?? panel?.querySelector<HTMLElement>('.hn-icon-button');
      profileFocusLast.current = false;
      focusHeaderControl(target);
      if (panel instanceof HTMLElement) return observeHeaderFocus(panel);
    }
  }, [popup]);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        // A feature modal or the navigation Drawer owns keyboard input while open.
        if (document.querySelector('dialog[open]:not(.hn-search-dialog)')) return;
        event.preventDefault();
        if (!document.querySelector('.hn-search-dialog[open]')) searchOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : searchRef.current;
        setPopup(null);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!popup) return;
    const onPointer = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        const focusWasInside = accountRef.current?.querySelector('.hn-header-popup')?.contains(document.activeElement);
        const origin = triggerRefs.current[popup];
        setPopup(null);
        if (focusWasInside) requestAnimationFrame(() => {
          if (document.activeElement === document.body) origin?.focus({ preventScroll: true });
        });
      }
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [popup]);
  useEffect(() => {
    if (!shortcutSettingsOpen) return;
    const onHash = () => { setShortcutSettingsOpen(false); setPopup(null); focusShellContent(); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [shortcutSettingsOpen]);
  const openShortcutSettings = () => { setShortcutNotice(null); setPopup(null); setShortcutSettingsOpen(true); };
  const closeShortcutSettings = () => { setShortcutSettingsOpen(false); setPopup('shortcuts'); };
  const openSearch = () => { searchOpenerRef.current = searchRef.current; setPopup(null); setSearchOpen(true); };
  const toggle = (key: HeaderPopup) => { setPopup(popup === key ? null : key); };
  const bind = (key: HeaderPopup) => (element: HTMLButtonElement | null) => { triggerRefs.current[key] = element; };
  const selectedLanguage = languageOptions.find(option => option.value === language) ?? languageOptions[0];
  const popupTitle = popup === 'shortcuts' ? t('header.quickAccess') : popup === 'notifications' ? t('header.notifications') : popup === 'language' ? t('header.language') : popup === 'theme' ? t('header.theme') : t('header.profile');
  const navigate = () => { setPopup(null); focusShellContent(); };
  const navigateAccount = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    navigate();
  };
  const logout = () => {
    const origin = triggerRefs.current.profile ?? null;
    setPopup(null);
    origin?.focus({ preventScroll: true });
    onLogout?.(origin);
  };
  return <>
    <button ref={searchRef} type="button" className="hn-shell-search" aria-label={t('header.search')} aria-haspopup="dialog" aria-expanded={searchOpen} aria-controls="hn-screen-search" onClick={openSearch}>
      <Icon name="search" /><span>{t('header.search')}…</span><kbd className="hn-search-shortcut" aria-hidden="true">{shortcut}</kbd>
    </button>
    <div ref={accountRef} className="hn-header__account" onKeyDown={event => {
      if (event.key === 'Escape' && popup) { event.preventDefault(); event.stopPropagation(); closePopup(true); }
    }} onFocus={event => {
      const target = event.target as HTMLElement;
      if (popup && !target.closest('.hn-header-popup') && target !== triggerRefs.current[popup]) setPopup(null);
    }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPopup(null); }}>
      <button ref={bind('shortcuts')} type="button" className="hn-icon-button hn-shortcuts" aria-label={t('header.quickAccess')} aria-expanded={popup === 'shortcuts'} aria-controls={popup === 'shortcuts' ? 'hn-shortcuts-panel' : undefined} onClick={() => toggle('shortcuts')}><Icon name="section" /></button>
      <NotificationBell ref={bind('notifications')} label={t('header.notifications')} unread={IS_BROWSER_PREVIEW ? unread : null} aria-haspopup={IS_BROWSER_PREVIEW ? 'dialog' : undefined} aria-expanded={IS_BROWSER_PREVIEW ? notificationOpen : popup === 'notifications'} aria-controls={IS_BROWSER_PREVIEW ? 'hn-preview-notification-center' : popup === 'notifications' ? 'hn-notifications-panel' : undefined} onClick={() => {
        if (IS_BROWSER_PREVIEW) { setPopup(null); dispatchPreviewNotification({ type: 'back' }); setNotificationOpen(true); }
        else toggle('notifications');
      }} />
      <button ref={bind('language')} type="button" className="hn-icon-button hn-language" aria-label={`${t('header.language')}: ${selectedLanguage.label}`} aria-expanded={popup === 'language'} aria-controls={popup === 'language' ? 'hn-language-panel' : undefined} onClick={() => toggle('language')}><Icon name="language" /><span aria-hidden="true">{selectedLanguage.nativeLabel}</span></button>
      <button ref={bind('theme')} type="button" className="hn-icon-button hn-theme" aria-label={`${t('header.theme')}: ${theme === 'dark' ? t('header.themeDark') : t('header.themeLight')}`} aria-expanded={popup === 'theme'} aria-controls={popup === 'theme' ? 'hn-theme-panel' : undefined} onClick={() => toggle('theme')}><Icon name={theme === 'dark' ? 'moon' : 'sun'} /></button>
      {profile && <button ref={bind('profile')} type="button" className="hn-profile" aria-label={`${t('header.profile')} ${profile.displayName}`} aria-expanded={popup === 'profile'} aria-controls={popup === 'profile' ? 'hn-profile-panel' : undefined} onClick={() => toggle('profile')} onKeyDown={event => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        profileFocusLast.current = event.key === 'ArrowUp';
        if (popup === 'profile') {
          const actions = accountRef.current?.querySelectorAll<HTMLElement>('.hn-profile-menu-action');
          focusHeaderControl(profileFocusLast.current ? actions?.[actions.length - 1] : actions?.[0]);
          profileFocusLast.current = false;
        } else setPopup('profile');
      }}>
        <span className="hn-profile__avatar" aria-hidden="true">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}</span><span className="hn-profile__name" title={profile.displayName}>{profile.displayName}</span><Icon name="chevron-down" width="16" height="16" />
      </button>}
      {popup && <section className={`hn-header-popup hn-header-popup--${popup}`} id={`hn-${popup}-panel`} aria-label={popupTitle} onFocus={event => revealHeaderControl(event.target as HTMLElement)} onKeyDown={event => {
        if (popup === 'profile' && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          const actions = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('.hn-profile-menu-action'));
          if (!actions.length) return;
          event.preventDefault();
          const index = actions.indexOf(document.activeElement as HTMLElement);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? actions.length - 1 : event.key === 'ArrowDown' ? (index + 1) % actions.length : index <= 0 ? actions.length - 1 : index - 1;
          focusHeaderControl(actions[next]);
          return;
        }
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]'));
        const index = controls.indexOf(document.activeElement as HTMLElement);
        const next = controls[index + (event.shiftKey ? -1 : 1)];
        if (index >= 0 && next) { event.preventDefault(); focusHeaderControl(next); }
        else if (index >= 0) {
          event.preventDefault();
          const origin = triggerRefs.current[popup];
          const pageControls = Array.from(document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')).filter(control => control.tabIndex >= 0 && control.getClientRects().length > 0 && !control.matches(':disabled') && !control.closest('[inert], [hidden], .hn-header-popup'));
          const following = origin ? pageControls[pageControls.indexOf(origin) + 1] : undefined;
          setPopup(null);
          const target = event.shiftKey ? origin : following ?? origin;
          target?.focus({ preventScroll: true });
          if (target && !target.closest('.hn-header')) requestAnimationFrame(() => {
            if (document.activeElement === target && target.isConnected) revealControl(target);
          });
        }
      }}>
        <div className="hn-popup-header"><h2>{popupTitle}</h2><div className="hn-popup-header__actions">{popup === 'shortcuts' && <><span className="hn-shortcut-count">{shortcuts.length}/{SHORTCUT_LIMIT}</span><button type="button" className="hn-icon-button" aria-label={t('shortcuts.configure')} title={t('shortcuts.configure')} aria-haspopup="dialog" aria-controls="hn-shortcut-settings" onClick={openShortcutSettings}><Icon name="plus" /></button></>}<button type="button" className="hn-icon-button" aria-label={`${t('header.close')} ${popupTitle.toLocaleLowerCase(language)}`} onClick={() => closePopup(true)}><Icon name="close" /></button></div></div>
        {popup === 'shortcuts' ? <>
          {shortcuts.length ? <div className="hn-shortcut-grid">{shortcuts.map(item => <a className="hn-shortcut-link" key={item.key} href={item.href} aria-current={item.key === activeKey ? 'page' : undefined} onClick={navigateAccount}>
          <Icon name={item.icon ?? 'section'} className="hn-shortcut-icon" />
          <span className="hn-shortcut-copy"><span className="hn-shortcut-label">{item.label}</span><small>{item.group ?? 'Hoa Nam WMS'}</small></span>
        </a>)}</div> : <div className="hn-header-empty-state hn-shortcut-empty"><Icon name="section" /><strong>{t('shortcuts.empty')}</strong><p>{t('shortcuts.emptyHint')}</p><Button variant="secondary" onClick={openShortcutSettings}>{t('shortcuts.add')}</Button></div>}
        </> : popup === 'profile' && profile ? <div className="hn-profile-menu-body">
          <div className="hn-profile-summary"><span className="hn-profile__avatar" aria-hidden="true">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}</span><div><strong>{profile.displayName}</strong><p>{t('shell.warehouse')}</p></div></div>
          {(accountLinks || onLogout) && <div className="hn-profile-menu-actions">
            {accountLinks && <>
              <a className="hn-header-option hn-profile-menu-action" href={accountLinks.profileHref} onClick={navigateAccount}><span><Icon name="user" />{t('header.myAccount')}</span><Icon name="chevron-right" /></a>
              <a className="hn-header-option hn-profile-menu-action" href={accountLinks.settingsHref} onClick={navigateAccount}><span><Icon name="settings" />{t('header.personalSettings')}</span><Icon name="chevron-right" /></a>
            </>}
            {onLogout && <div className="hn-profile-menu-footer"><button type="button" className="hn-header-option hn-profile-menu-action hn-profile-menu-logout" onClick={logout}><span><Icon name="logout" />{t('header.logout')}</span></button></div>}
          </div>}
        </div> : popup === 'notifications' ? <div className="hn-header-empty-state"><Icon name="bell" /><strong>{t('header.notificationsEmpty')}</strong><p>{t('header.notificationsDescription')}</p></div> : popup === 'language' ? <div className="hn-header-option-list">{languageOptions.map(option => <button key={option.value} type="button" className="hn-header-option" aria-pressed={language === option.value} onClick={() => { setLanguage(option.value); setPopup(null); triggerRefs.current.language?.focus({ preventScroll: true }); }}><span lang={option.value}>{option.label}</span><small>{option.nativeLabel}</small></button>)}<p className="hn-header-popup__hint">{t('header.languageScope')}</p></div> : <div className="hn-header-option-list"><button type="button" className="hn-header-option" aria-pressed={theme === 'light'} onClick={() => { setTheme('light'); setPopup(null); triggerRefs.current.theme?.focus({ preventScroll: true }); }}><span><Icon name="sun" />{t('header.themeLight')}</span></button><button type="button" className="hn-header-option" aria-pressed={theme === 'dark'} onClick={() => { setTheme('dark'); setPopup(null); triggerRefs.current.theme?.focus({ preventScroll: true }); }}><span><Icon name="moon" />{t('header.themeDark')}</span></button></div>}
      </section>}
    </div>
    {IS_BROWSER_PREVIEW && <PreviewNotificationCenter open={notificationOpen} onClose={() => setNotificationOpen(false)} />}
    <ShortcutSettings open={shortcutSettingsOpen} destinations={destinations} selectedKeys={shortcutPreferences.keys} onCancel={closeShortcutSettings} onSave={keys => {
      const persisted = shortcutPreferences.save(keys);
      setShortcutNotice({ kind: persisted ? 'saved' : 'sessionOnly', sequence: ++shortcutSequence.current });
      closeShortcutSettings();
    }} />
    {shortcutNotice && <Notice feedback={{ message: t(`shortcuts.${shortcutNotice.kind}`), tone: shortcutNotice.kind === 'saved' ? 'success' : 'warning', sequence: shortcutNotice.sequence, origin: triggerRefs.current.shortcuts ?? null, container: document.body }} onClose={() => setShortcutNotice(null)} />}
    <ShellSearch open={searchOpen} onClose={() => setSearchOpen(false)} trigger={searchOpenerRef} fallbackTrigger={searchRef} destinations={destinations} />
  </>;
}

function ShellSearch({ open, onClose, trigger, fallbackTrigger, destinations }: {
  open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null>; fallbackTrigger: RefObject<HTMLButtonElement | null>; destinations: readonly ShellDestination[];
}) {
  const { t, language } = useShellUi();
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigating = useRef(false);
  const pointerOnBackdrop = useRef(false);
  const composing = useRef(false);
  const matches = matchShellDestinations(destinations, query);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) { setQuery(''); composing.current = false; navigating.current = false; dialog.showModal(); inputRef.current?.focus(); }
    if (!open && dialog.open) {
      dialog.close();
      if (navigating.current) focusShellContent();
      else {
        const origin = trigger.current;
        const visible = origin?.isConnected && origin.getClientRects().length > 0 && !origin.matches(':disabled') && !origin.closest('[hidden], [inert]') && getComputedStyle(origin).visibility !== 'hidden';
        const target = visible && origin !== document.body && origin !== document.documentElement ? origin : fallbackTrigger.current;
        target?.focus({ preventScroll: true });
      }
    }
  }, [open, trigger, fallbackTrigger]);
  useEffect(() => {
    if (!open) return;
    return acquireBodyScrollLock();
  }, [open]);
  useEffect(() => {
    if (open && dialogRef.current) return observeHeaderFocus(dialogRef.current);
  }, [open]);
  const onKey = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    // Search inputs consume Escape to clear their value in Chromium; the modal
    // owns Escape so one press always closes it and restores its invoker.
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return; }
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('.hn-search-results a'));
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index = links.indexOf(document.activeElement as HTMLAnchorElement);
      if (!links.length) return;
      const next = event.key === 'ArrowDown' ? (index + 1) % links.length : index <= 0 ? links.length - 1 : index - 1;
      focusHeaderControl(links[next]);
    }
    if (event.key === 'Enter' && event.target === inputRef.current && links.length) { event.preventDefault(); links[0].click(); }
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('input,button,a[href]'));
    const first = controls[0]; const last = controls.at(-1);
    const index = controls.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey ? index <= 0 ? last : controls[index - 1] : controls[index + 1] ?? first;
    if (next) { event.preventDefault(); focusHeaderControl(next); }
  };
  return <dialog id="hn-screen-search" lang={language} className="hn-shell-dialog hn-search-dialog" ref={dialogRef} aria-labelledby="hn-search-title" onKeyDown={onKey} onCancel={event => { event.preventDefault(); if (!composing.current) onClose(); }} onClose={onClose} onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }} onPointerCancel={() => { pointerOnBackdrop.current = false; }} onClick={event => {
    if (pointerOnBackdrop.current && event.target === event.currentTarget) onClose();
    pointerOnBackdrop.current = false;
  }}>
    <div className="hn-search-dialog__content">
      <div className="hn-popup-header"><h2 id="hn-search-title">{t('header.search')}</h2><button type="button" className="hn-icon-button" aria-label={`${t('header.close')} ${t('header.search')}`} onClick={onClose}><Icon name="close" /></button></div>
      <label className="hn-search-field"><Icon name="search" /><input ref={inputRef} type="search" aria-label={t('header.search')} placeholder={t('header.searchInput')} value={query} onChange={event => setQuery(event.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} autoComplete="off" /></label>
      <p className="hn-search-result-count" role="status">{matches.length} {t('header.searchCount')}</p>
      <ul className="hn-search-results">{matches.map(item => <li key={item.key}><a href={item.href} onClick={() => { navigating.current = true; onClose(); }}><Icon name={item.icon ?? 'section'} /><span>{item.label}{item.group && <small>{item.group}</small>}</span><Icon name="chevron-right" /></a></li>)}</ul>
      {!matches.length && <p className="hn-search-empty">{t('header.searchEmpty')}</p>}
    </div>
  </dialog>;
}
