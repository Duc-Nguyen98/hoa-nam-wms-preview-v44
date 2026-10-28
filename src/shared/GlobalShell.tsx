import { PreviewModeNotice } from './PreviewModeNotice';
import { IS_BROWSER_PREVIEW } from '../preview-mode';
import { useUiCopy } from '../i18n/use-ui-copy';
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { useShellPreferences } from './s00-shell-state';
import { getShellDestinations, matchShellDestinations, S00_SHELL_NAVIGATION } from './s00-navigation';
import { focusShellContent, ShellHeaderActions } from './ShellHeader';
import { ShellActionContext } from './ShellActionContext';
import { useShellUi } from './shell-locale';
import { useAccountCenter } from '../account/AccountCenterContext';
import { Notice } from './Notice';
import { acquireBodyScrollLock } from './body-scroll-lock';
import './s00-shell.css';
import './s00-sidebar-tone.css';

export interface ShellNavigationItem {
  key: string;
  label: string;
  href?: string;
  icon?: IconName;
  /** Preserve an explicitly sourced icon for a nested destination. */
  leafIcon?: boolean;
  children?: readonly ShellNavigationItem[];
  defaultExpanded?: boolean;
  hasSubmenu?: boolean;
}

export interface GlobalShellProps {
  title: string;
  children: ReactNode;
  navigation: readonly ShellNavigationItem[];
  activeKey?: string;
  variant?: 'setup' | 'wms';
  contentWidth?: 'default' | 'wide';
  sidebarTone?: 'navy';
  profile?: { displayName: string; initials: string };
  onUnresolvedAction?: (key: string) => void;
}

type LayoutMode = 'desktop' | 'rail' | 'drawer';
// S00: primary touch retains r2 landscape rail / portrait Drawer. Narrow fine-pointer
// windows use overlay below the observed Vuexy 1280px boundary; no phone detection.
const layoutQueries = ['(pointer: coarse) and (hover: none)', '(orientation: portrait)', '(max-width: 1279px)', '(max-width: 599px)'];
function subscribeLayout(onChange: () => void) {
  const queries = layoutQueries.map((query) => window.matchMedia(query));
  queries.forEach((query) => query.addEventListener('change', onChange));
  return () => queries.forEach((query) => query.removeEventListener('change', onChange));
}
function getLayoutMode(): LayoutMode {
  const [touch, portrait, compact, veryNarrow] = layoutQueries.map((query) => window.matchMedia(query).matches);
  if (touch) return portrait || veryNarrow ? 'drawer' : 'rail';
  return compact ? 'drawer' : 'desktop';
}
function getServerLayoutMode(): LayoutMode { return 'desktop'; }

export function GlobalShell({ title, children, navigation, activeKey, variant = 'setup', contentWidth, profile, onUnresolvedAction }: GlobalShellProps) {
  const tx = useUiCopy();
  const accountCenter = useAccountCenter();
  const { language, t, navLabel } = useShellUi();
  const mode = useSyncExternalStore(subscribeLayout, getLayoutMode, getServerLayoutMode);
  const { pinned, groups: expandedGroups, setPinned, setGroup } = useShellPreferences();
  const collapsed = !pinned;
  const [hovered, setHovered] = useState(false);
  const [navFocused, setNavFocused] = useState(false);
  const [expansionDismissed, setExpansionDismissed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navigationQuery, setNavigationQuery] = useState('');
  const [navigationNotice, setNavigationNotice] = useState<{ label: string; key: string; origin: HTMLElement; sequence: number } | null>(null);
  const reportShellAction = useContext(ShellActionContext);
  const noticeSequence = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreMenuFocusRef = useRef(false);
  const lastShellFocusRef = useRef<HTMLElement | null>(null);
  const backdropPointerDownRef = useRef(false);
  const compactRail = mode === 'rail' || (mode === 'desktop' && collapsed);
  const isWms = variant === 'wms';
  const localize = (items: readonly ShellNavigationItem[]): ShellNavigationItem[] => items.map(item => ({ ...item, label: navLabel(item.key, item.label), children: item.children ? localize(item.children) : undefined }));
  const shellNavigation = useMemo(() => localize(isWms ? S00_SHELL_NAVIGATION : navigation), [isWms, navigation, language]);
  const visibleNavigation = useMemo(() => {
    const query = navigationQuery.trim();
    if (!query) return shellNavigation;
    const matchingKeys = new Set(matchShellDestinations(getShellDestinations(shellNavigation), query).map(item => item.key));
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi');
    const filter = (items: readonly ShellNavigationItem[]): ShellNavigationItem[] => items.flatMap(item => {
      const children = item.children ? filter(item.children) : [];
      const ownMatch = normalize(item.label).includes(normalize(query));
      if (!ownMatch && !matchingKeys.has(item.key) && !children.length) return [];
      return [{ ...item, defaultExpanded: Boolean(children.length || ownMatch), children: item.children ? (children.length ? children : item.children) : undefined }];
    });
    return filter(shellNavigation);
  }, [navigationQuery, shellNavigation]);
  const destinations = useMemo(() => {
    const original = getShellDestinations(S00_SHELL_NAVIGATION);
    return getShellDestinations(localize(S00_SHELL_NAVIGATION)).map(item => ({ ...item, searchText: original.find(source => source.key === item.key)?.label ?? '' }));
  }, [language]);
  const navExpanded = !compactRail || (mode === 'desktop' && !expansionDismissed && (hovered || navFocused));
  const menuLabel = mode === 'desktop' ? t(collapsed ? 'shell.expand' : 'shell.collapse') : t('shell.openMenu');

  useEffect(() => { setDrawerOpen(false); setHovered(false); setNavFocused(false); setExpansionDismissed(false); setNavigationNotice(null); }, [mode]);
  useLayoutEffect(() => {
    // A breakpoint can remove the focused sidebar or move its pin to the header.
    if (lastShellFocusRef.current && !lastShellFocusRef.current.isConnected && document.activeElement === document.body) {
      menuButtonRef.current?.focus({ preventScroll: true });
    }
  }, [mode]);
  useLayoutEffect(() => {
    const openAncestors = (items: readonly ShellNavigationItem[]): boolean => {
      let contains = false;
      for (const item of items) {
        if (item.key === activeKey) contains = true;
        if (item.children && openAncestors(item.children)) {
          if (expandedGroups[item.key] !== true) setGroup(item.key, true);
          contains = true;
        }
      }
      return contains;
    };
    openAncestors(shellNavigation);
  }, [activeKey, shellNavigation]);
  useLayoutEffect(() => {
    if (!restoreMenuFocusRef.current) return;
    restoreMenuFocusRef.current = false;
    menuButtonRef.current?.focus({ preventScroll: true });
  }, [collapsed, mode]);
  useLayoutEffect(() => {
    if (!navigationNotice) return;
    const origin = navigationNotice.origin;
    const nav = origin.closest<HTMLElement>('.hn-navigation');
    if (!nav || !origin.getClientRects().length) return;
    const row = origin.getBoundingClientRect(); const area = nav.getBoundingClientRect();
    if (row.bottom > area.bottom - 8) nav.scrollTop += row.bottom - area.bottom + 8;
  }, [navigationNotice]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) {
      dialog.showModal();
      const openedGroup = openerRef.current?.dataset.navKey;
      const target = openedGroup
        ? dialog.querySelector<HTMLElement>(`[data-nav-key="${CSS.escape(openedGroup)}"]`)
        : dialog.querySelector<HTMLElement>('[aria-current="page"]');
      const nav = target?.closest<HTMLElement>('.hn-navigation');
      if (target && nav) {
        const row = target.getBoundingClientRect(); const area = nav.getBoundingClientRect();
        if (row.bottom > area.bottom - 8) nav.scrollTop += row.bottom - area.bottom + 8;
        else if (row.top < area.top + 8) nav.scrollTop += row.top - area.top - 8;
      }
    }
    if (!drawerOpen && dialog.open) {
      dialog.close();
      const opener = openerRef.current?.isConnected ? openerRef.current : menuButtonRef.current;
      opener?.focus({ preventScroll: true });
    }
    if (!drawerOpen) return;
    return acquireBodyScrollLock();
  }, [drawerOpen]);

  const toggleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (mode === 'desktop') {
      restoreMenuFocusRef.current = true;
      setPinned(!pinned);
      setNavFocused(false);
      setExpansionDismissed(false);
    }
    else {
      openerRef.current = event.currentTarget;
      setDrawerOpen(true);
    }
  };
  const keepDrawerFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const placeTooltip = (element: HTMLElement, resetDismissal = true) => {
    const bounds = element.getBoundingClientRect();
    element.style.setProperty('--hn-tooltip-top', `${bounds.top + bounds.height / 2}px`);
    if (resetDismissal) delete element.dataset.tooltipDismissed;
  };
  const updateScrolledTooltips = (navigationElement: HTMLElement) => {
    const navBounds = navigationElement.getBoundingClientRect();
    navigationElement.querySelectorAll<HTMLElement>('.hn-navigation__link').forEach(element => {
      if (!element.matches(':hover, :focus')) return;
      const bounds = element.getBoundingClientRect();
      if (bounds.top < navBounds.top || bounds.bottom > navBounds.bottom) element.dataset.tooltipDismissed = 'true';
      else placeTooltip(element, false);
    });
  };
  const dismissTooltips = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || drawerOpen) return;
    event.currentTarget.querySelectorAll<HTMLElement>('.hn-navigation__link, .hn-menu-toggle').forEach(element => {
      element.dataset.tooltipDismissed = 'true';
    });
    if (mode === 'desktop' && collapsed && navExpanded) {
      if ((document.activeElement as HTMLElement)?.closest('.hn-sidebar')) menuButtonRef.current?.focus({ preventScroll: true });
      setExpansionDismissed(true); setHovered(false); setNavFocused(false);
    }
  };
  const closeNavigationNotice = (restore: boolean) => {
    if (restore) {
      let origin = navigationNotice?.origin;
      if (drawerOpen && origin?.dataset.navKey && !dialogRef.current?.contains(origin)) {
        origin = dialogRef.current?.querySelector<HTMLElement>(`[data-nav-key="${CSS.escape(origin.dataset.navKey)}"]`) ?? undefined;
      }
      const fallback = drawerOpen ? dialogRef.current?.querySelector<HTMLButtonElement>('.hn-drawer__header button') : menuButtonRef.current;
      (origin?.isConnected && origin.getClientRects().length ? origin : fallback)?.focus({ preventScroll: true });
    }
    setNavigationNotice(null);
  };
  const navigate = (inDrawer: boolean) => { if (inDrawer) setDrawerOpen(false); setNavigationNotice(null); setHovered(false); setNavFocused(false); focusShellContent(); };
  const containsActive = (item: ShellNavigationItem): boolean => item.key === activeKey || Boolean(item.children?.some(containsActive));
  const renderItems = (items: readonly ShellNavigationItem[], rail: boolean, inDrawer: boolean, nested = false): ReactNode => items.map((item) => {
    const isGroup = Boolean(item.children?.length);
    const opensDrawer = mode === 'rail' && !inDrawer && (isGroup || !item.href);
    const expanded = expandedGroups[item.key] ?? item.defaultExpanded ?? false;
    const groupId = `hn-nav-${inDrawer ? 'drawer' : 'sidebar'}-${item.key}`;
    const itemContent = <>{nested && !item.leafIcon ? <span className="hn-navigation__dot" aria-hidden="true" /> : <Icon name={item.icon ?? 'section'} />}<span className="hn-navigation__label">{item.label}</span>{(isGroup || item.hasSubmenu) && <Icon name={isGroup && expanded ? 'chevron-down' : 'chevron-right'} className="hn-navigation__chevron" width="16" height="16" />}{rail && <span className="hn-navigation__tooltip" aria-hidden="true">{item.label}</span>}</>;
    return <div key={item.key} className="hn-navigation__item">
      {item.href && !isGroup ? <a href={item.href} className="hn-navigation__link" aria-current={item.key === activeKey ? 'page' : undefined} aria-label={rail ? item.label : undefined} onMouseEnter={(event) => placeTooltip(event.currentTarget)} onFocus={(event) => placeTooltip(event.currentTarget)} onClick={() => navigate(inDrawer)}>{itemContent}</a> : <button type="button" className="hn-navigation__link" data-nav-key={item.key} data-active-parent={isGroup && containsActive(item) ? 'true' : undefined} aria-label={rail ? item.label : undefined} aria-haspopup={opensDrawer ? 'dialog' : undefined} aria-expanded={opensDrawer ? drawerOpen && openerRef.current?.dataset.navKey === item.key : isGroup ? expanded && !rail : item.hasSubmenu ? false : undefined} aria-controls={opensDrawer ? 'hn-navigation-drawer' : isGroup ? groupId : undefined} onMouseEnter={(event) => placeTooltip(event.currentTarget)} onFocus={(event) => placeTooltip(event.currentTarget)} onClick={event => {
        if (isGroup && mode === 'rail' && !inDrawer) { openerRef.current = event.currentTarget; setGroup(item.key, true); setDrawerOpen(true); }
        else if (isGroup) setGroup(item.key, !expanded);
        else {
          if (reportShellAction) reportShellAction({ key: `navigation:${item.key}`, screenKey: activeKey });
          else onUnresolvedAction?.(`navigation:${item.key}`);
          setNavigationNotice({ label: item.label, key: item.key, origin: event.currentTarget, sequence: ++noticeSequence.current });
          if (mode === 'rail' && !inDrawer) { openerRef.current = event.currentTarget; setDrawerOpen(true); }
        }
      }}>{itemContent}</button>}
      {isGroup && <div id={groupId} className="hn-navigation__children" hidden={!expanded || rail}>{renderItems(item.children!, rail, inDrawer, true)}</div>}
    </div>;
  });
  const renderNavigation = (rail: boolean, inDrawer = false) => <nav className={`hn-navigation${rail ? ' hn-navigation--rail' : ''}`} aria-label={t('shell.menu')} lang={language} onPointerEnter={event => { if (!inDrawer && mode === 'desktop' && event.pointerType === 'mouse') { setHovered(true); setExpansionDismissed(false); } }} onFocus={() => { if (!inDrawer && mode === 'desktop') { setNavFocused(true); setExpansionDismissed(false); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !(event.relatedTarget as HTMLElement)?.closest('.hn-global-toast')) setNavFocused(false); }} onScroll={event => updateScrolledTooltips(event.currentTarget)}>{renderItems(visibleNavigation, rail, inDrawer)}</nav>;
  const renderNavigationSearch = (inDrawer = false) => <label className={`hn-sidebar__search${inDrawer ? ' hn-sidebar__search--drawer' : ''}`}>
    <Icon name="search" aria-hidden="true" />
    <input value={navigationQuery} onChange={event => setNavigationQuery(event.target.value)} placeholder={t('shell.functionSearch')} aria-label={t('shell.functionSearch')} />
    {navigationQuery && <button type="button" className="hn-sidebar__search-clear" aria-label={t('shell.clearFunctionSearch')} onClick={() => setNavigationQuery('')}><Icon name="close" size={16} /></button>}
  </label>;
  const renderMenuButton = () => <button ref={menuButtonRef} type="button" className={`hn-icon-button hn-menu-toggle${mode === 'desktop' ? ' hn-nav-pin' : ''}`} onClick={toggleMenu} onMouseEnter={event => { delete event.currentTarget.dataset.tooltipDismissed; }} onFocus={event => { delete event.currentTarget.dataset.tooltipDismissed; }} aria-label={menuLabel} aria-expanded={mode === 'desktop' ? !collapsed : drawerOpen} aria-controls={mode !== 'desktop' ? 'hn-navigation-drawer' : undefined}>
    <Icon name={mode === 'desktop' ? (collapsed ? 'unpin' : 'pin') : 'menu'} />
    <span className="hn-control-tooltip" aria-hidden="true">{menuLabel}</span>
  </button>;
  const renderBrand = (rail: boolean) => <><Icon name="brand" className="hn-wms-brand-mark" width="36" height="36" />{!rail && <span className="hn-wms-brand-name">HOA NAM WMS<span>{t('shell.system')}</span></span>}</>;
  const renderSidebarFooter = (inDrawer = false) => <footer className={`${inDrawer ? 'hn-drawer' : 'hn-sidebar'}__footer`} aria-label={tx("Thông tin phiên bản")}><span inert={!inDrawer && !navExpanded}>{IS_BROWSER_PREVIEW ? <PreviewModeNotice /> : tx("Phiên bản 1.0.0")}</span><span>© 2006 Hoa Nam. {t('shell.copyright')}</span></footer>;

  return <div className="hn-shell" data-shell-version="s00" data-layout={mode} data-collapsed={compactRail} data-nav-expanded={navExpanded} data-variant={variant} data-content-width={contentWidth === 'wide' ? 'wide' : undefined} onKeyDown={dismissTooltips} onFocusCapture={event => { lastShellFocusRef.current = event.target; }}>
    <a className="hn-skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>{t('shell.skip')}</a>
    {mode !== 'drawer' && <aside lang={language} className="hn-sidebar" aria-label="Hoa Nam WMS" onPointerLeave={() => { setHovered(false); setExpansionDismissed(false); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setNavFocused(false); }}>
      <div className="hn-brand" aria-label="Hoa Nam WMS">{renderBrand(!navExpanded)}{mode === 'desktop' && renderMenuButton()}</div>
      {navExpanded && renderNavigationSearch()}
      {renderNavigation(!navExpanded)}
      {navExpanded && <div className="hn-sidebar__warehouse"><Icon name="warehouse" /><span>{t('shell.warehouse')}</span></div>}
      {renderSidebarFooter()}
    </aside>}
    <dialog lang={language} id="hn-navigation-drawer" ref={dialogRef} className="hn-drawer" aria-labelledby="hn-drawer-title" onKeyDown={keepDrawerFocus} onCancel={(event) => { event.preventDefault(); setDrawerOpen(false); }} onClose={() => setDrawerOpen(false)} onPointerDown={event => { backdropPointerDownRef.current = event.target === event.currentTarget; }} onPointerCancel={() => { backdropPointerDownRef.current = false; }} onClick={event => {
      const clickedBackdrop = backdropPointerDownRef.current && event.target === event.currentTarget;
      backdropPointerDownRef.current = false;
      if (clickedBackdrop) setDrawerOpen(false);
    }}>
      <div className="hn-drawer__panel">
        <div className="hn-drawer__header">{isWms ? <div id="hn-drawer-title" className="hn-drawer__brand">{renderBrand(false)}</div> : <h2 id="hn-drawer-title">Hoa Nam WMS</h2>}<button type="button" className="hn-icon-button" autoFocus onClick={() => setDrawerOpen(false)} aria-label={t('shell.closeMenu')}><Icon name="close" /></button></div>
        {renderNavigationSearch(true)}
        {renderNavigation(false, true)}
        {isWms && <div className="hn-drawer__warehouse"><Icon name="warehouse" /><span>{t('shell.warehouse')}</span></div>}
        {renderSidebarFooter(true)}
      </div>
    </dialog>
    <div className="hn-shell__workspace">
      <div className="hn-header-wrap"><header lang={language} className="hn-header">
        {mode !== 'desktop' && renderMenuButton()}
        {mode !== 'desktop' && isWms && <a className="hn-mobile-brand" href="#/preview/S01" aria-label="HOA NAM WMS"><Icon name="brand" size={36} /><span>HOA NAM WMS</span></a>}
        {isWms ? <>
          <ShellHeaderActions destinations={destinations} profile={accountCenter ? accountCenter.profile : profile} layoutMode={mode} activeKey={activeKey}
            accountLinks={accountCenter ? { profileHref: '#/account/profile', settingsHref: '#/account/settings' } : undefined}
            onLogout={accountCenter?.requestLogout} />
        </> : <><p className="hn-header__title">{title}</p><span className="hn-warehouse"><Icon name="warehouse" /><span>{t('shell.warehouse')}</span></span></>}
      </header></div>
      <main id="main-content" className="hn-main" tabIndex={-1}>{children}</main>
    </div>

    {navigationNotice && <Notice feedback={{ message: `${navLabel(navigationNotice.key, navigationNotice.label)} ${tx('chưa khả dụng trong bản xem trước.')}`, tone: 'info', sequence: navigationNotice.sequence, origin: navigationNotice.origin, container: document.body }} onClose={() => closeNavigationNotice(false)} resolveFocusFallback={() => menuButtonRef.current} />}
  </div>;
}
