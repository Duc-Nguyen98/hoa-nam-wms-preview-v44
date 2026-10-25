import { useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalToast } from '../../src/toast/GlobalToastProvider';
import { GlobalModal } from '../../src/shared/GlobalModal';
import { Button } from '../../src/shared/primitives';
import { Icon, type IconName } from '../../src/shared/Icon';
import { localeForLanguage, useShellPreferences, type ShellLanguage } from '../../src/shared/shell-preferences';
import { notificationCopy } from '../../src/notifications/notification-copy';
import { formatMockNotificationTime } from '../../src/notifications/notification-model';
import type { BusinessNotification } from '../../src/notifications/notification-feed';
import { dispatchPreviewNotification, usePreviewNotifications, type NotificationStoreState } from '../../src/notifications/notification-preview-store';
import type { DemoNotification } from '../../src/preview-mock/notifications';
import './before.css';

type NotificationAction = { type: 'back' | 'read-all' | 'retry' | 'more' } | { type: 'open'; id: string };
type NotificationTab = 'all' | 'unread';

const isBusinessNotification = (item: DemoNotification): item is BusinessNotification => item.kind === 'business';
const copyValue = (copy: ReturnType<typeof notificationCopy>, key: string) => copy[key as keyof typeof copy] ?? key;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase();

function notificationIcon(item: DemoNotification): IconName {
  if (item.kind !== 'business') return 'bell';
  if (item.category === 'inventory' || item.severity === 'warning') return 'alert-triangle';
  if (item.category === 'system') return 'settings';
  if (item.category === 'putaway') return 'tray';
  if (item.category === 'warranty') return 'shield';
  return 'documents';
}

function dayKey(value: string, language: ShellLanguage) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(localeForLanguage(language), { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function dayLabel(value: string, language: ShellLanguage, copy: ReturnType<typeof notificationCopy>) {
  const date = new Date(value);
  const now = new Date();
  const dateKey = dayKey(value, language);
  const todayKey = dayKey(now.toISOString(), language);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday.toISOString(), language);
  if (dateKey === todayKey) return copy.groupToday;
  if (dateKey === yesterdayKey) return copy.groupYesterday;
  return new Intl.DateTimeFormat(localeForLanguage(language), { timeZone: 'Asia/Bangkok', day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function itemText(item: DemoNotification, copy: ReturnType<typeof notificationCopy>) {
  return { title: copyValue(copy, item.titleKey), body: copyValue(copy, item.bodyKey), reference: isBusinessNotification(item) ? item.target.reference : item.id };
}

function NotificationItemRow({ item, selected, language, copy, pending, onOpen }: { item: DemoNotification; selected: boolean; language: string; copy: ReturnType<typeof notificationCopy>; pending: boolean; onOpen: (id: string) => void }) {
  const text = itemText(item, copy);
  return <button type="button" className="hn-notification-item" data-notification-id={item.id} data-selected={selected} data-unread={item.readAt === null} disabled={pending} onClick={() => onOpen(item.id)}>
    <span className={`hn-notification-item-icon hn-notification-item-icon--${item.kind === 'business' ? item.category : 'system'}`} aria-hidden="true"><Icon name={notificationIcon(item)} size={19} /></span>
    <span className="hn-notification-item-copy"><strong>{item.readAt === null && <span className="hn-notification-unread-dot" aria-hidden="true" />}{text.title}</strong><span>{text.body}</span><time dateTime={item.createdAt}>{formatMockNotificationTime(item.createdAt, language)}</time></span>
    <span className="hn-notification-read-status">{item.readAt === null ? copy.unread : copy.read}</span><Icon name="chevron-right" size={18} />
  </button>;
}

function NotificationDetail({ item, language, copy, onBack }: { item: DemoNotification; language: string; copy: ReturnType<typeof notificationCopy>; onBack: () => void }) {
  const text = itemText(item, copy);
  const target = isBusinessNotification(item) ? item.target : null;
  return <article className="hn-notification-detail-pane" data-notification-detail={item.id}>
    <div className="hn-notification-detail-topline"><span className="hn-notification-detail-icon" aria-hidden="true"><Icon name={notificationIcon(item)} size={22} /></span><span className={item.readAt === null ? 'hn-notification-detail-status hn-notification-detail-status--unread' : 'hn-notification-detail-status'}>{item.readAt === null ? copy.unread : copy.read}</span></div>
    <h3 className="hn-notification-detail-title">{text.title}</h3>
    <p className="hn-notification-detail-body">{text.body}</p>
    {target && <a className="hn-notification-target" href={target.href}><span>{copyValue(copy, target.labelKey)}</span><strong>{target.reference}</strong><Icon name="arrow-right" size={17} /></a>}
    <dl className="hn-notification-detail-meta">
      <div><dt>{copy.centerReference}</dt><dd>{text.reference}</dd></div>
      <div><dt>{copy.centerTime}</dt><dd><time dateTime={item.createdAt}>{formatMockNotificationTime(item.createdAt, language)}</time></dd></div>
      <div><dt>{copy.notificationId}</dt><dd>{item.id}</dd></div>
    </dl>
    {!target && <p className="hn-notification-no-target">{copy.centerNoTarget}</p>}
    <Button variant="ghost" className="hn-notification-detail-back" onClick={onBack}><Icon name="chevron-left" size={17} />{copy.back}</Button>
  </article>;
}

export function PreviewNotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = usePreviewNotifications();
  return <NotificationCenterView open={open} onClose={onClose} state={state} dispatch={dispatchPreviewNotification} />;
}

/** The same view is reused by explicit isolated QA with its own repository. */
export function NotificationCenterView({ open, onClose, state, dispatch }: { open: boolean; onClose: () => void; state: NotificationStoreState; dispatch: (action: NotificationAction) => Promise<boolean> }) {
  const { language } = useShellPreferences();
  const toast = useGlobalToast();
  const copy = notificationCopy(language);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastItem = useRef<string | null>(null);
  const [tab, setTab] = useState<NotificationTab>('all');
  const [query, setQuery] = useState('');
  const selected = state.items.find(item => item.id === state.selectedId);
  const visibleItems = useMemo(() => {
    const needle = normalize(query.trim());
    return state.items.filter(item => {
      if (tab === 'unread' && item.readAt !== null) return false;
      if (!needle) return true;
      const text = itemText(item, copy);
      return normalize(`${text.title} ${text.body} ${text.reference} ${item.id}`).includes(needle);
    });
  }, [copy, query, state.items, tab]);
  const detailItem = selected && visibleItems.some(item => item.id === selected.id) ? selected : visibleItems[0] ?? state.items[0];
  const groups = useMemo(() => {
    const result: Array<{ key: string; label: string; items: DemoNotification[] }> = [];
    for (const item of visibleItems) {
      const key = dayKey(item.createdAt, language);
      const group = result.find(value => value.key === key);
      if (group) group.items.push(item);
      else result.push({ key, label: dayLabel(item.createdAt, language, copy), items: [item] });
    }
    return result;
  }, [copy, language, visibleItems]);
  const back = () => { void dispatch({ type: 'back' }); requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>(`[data-notification-id="${lastItem.current}"]`)?.focus({ preventScroll: true })); };
  useEffect(() => {
    if (!open) return;
    const closeOnRoute = () => { void dispatch({ type: 'back' }); onClose(); };
    window.addEventListener('hashchange', closeOnRoute);
    return () => window.removeEventListener('hashchange', closeOnRoute);
  }, [dispatch, onClose, open]);
  const count = state.totalUnread === null ? copy.unavailableCount : `${state.totalUnread.toLocaleString(localeForLanguage(language))} ${copy.unreadCount}`;
  const openItem = (id: string) => { lastItem.current = id; void dispatch({ type: 'open', id }); };
  return <GlobalModal open={open} onClose={onClose} dialogRef={dialog} id="hn-preview-notification-center" title={copy.title} description={<span role="status" aria-live="polite" data-notification-unread-count={state.totalUnread}>{count}</span>} closeLabel={copy.closeCenter} size="large" className="hn-notification-center" data-visual-variant="premium" lang={localeForLanguage(language)}>
    {state.error && <div className="hn-notification-error" role="alert"><p>{copy.loadError}</p><Button variant="secondary" disabled={state.pending} onClick={() => void dispatch({ type: 'retry' })}>{copy.retry}</Button></div>}
    {state.pending && <p className="hn-notification-progress" role="status">{copy.saving}</p>}
    <div className="hn-notification-center-toolbar">
      <label className="hn-notification-search"><Icon name="search" size={18} /><span className="hn-visually-hidden">{copy.search}</span><input type="search" value={query} placeholder={copy.searchPlaceholder} aria-label={copy.search} onChange={event => setQuery(event.target.value)} /></label>
      <div className="hn-notification-tabs" role="tablist" aria-label={copy.centerList}><button type="button" role="tab" aria-selected={tab === 'all'} onClick={() => setTab('all')}>{copy.all}<span>{state.total}</span></button><button type="button" role="tab" aria-selected={tab === 'unread'} onClick={() => setTab('unread')}>{copy.unreadTab}<span>{state.totalUnread ?? '—'}</span></button></div>
      <Button variant="secondary" disabled={state.totalUnread === null || state.totalUnread === 0 || state.pending} onClick={async event => { const origin = event.currentTarget; if (await dispatch({ type: 'read-all' })) { toast.notify({ tone: 'success', origin, message: locale => notificationCopy(locale).markedAll }); requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>('.hn-global-modal__close')?.focus({ preventScroll: true })); } }}>{copy.markAll}</Button>
    </div>
    {state.scenario === 'loading' && !state.items.length ? <p className="hn-notification-state-slot" role="status">{copy.mainLoading}</p> : state.scenario === 'empty' ? <p className="hn-notification-state-slot">{copy.mainEmpty}</p> : <div className={`hn-notification-center-grid${selected ? ' hn-notification-center-grid--has-selection' : ''}`}>
      <section className={`hn-notification-list-pane${selected ? ' hn-notification-list-pane--hidden-mobile' : ''}`} aria-label={copy.centerList} aria-busy={state.pending}>
        {groups.length ? <div className="hn-notification-groups">{groups.map(group => <section className="hn-notification-group" key={group.key}><h3>{group.label}</h3><ul className="hn-notification-list">{group.items.map(item => <li key={item.id}><NotificationItemRow item={item} selected={item.id === state.selectedId} language={language} copy={copy} pending={state.pending} onOpen={openItem} /></li>)}</ul></section>)}</div> : <p className="hn-notification-filter-empty">{tab === 'unread' ? copy.noUnread : copy.noSearchResults}</p>}
        {state.items.length < state.total && <div className="hn-notification-more"><Button variant="secondary" onClick={() => void dispatch({ type: 'more' })}>{copy.loadMore}</Button></div>}
      </section>
      <section className={`hn-notification-detail-pane-wrap${selected ? ' hn-notification-detail-pane-wrap--visible-mobile' : ''}`} aria-label={copy.centerDetail}>{detailItem ? <NotificationDetail item={detailItem} language={language} copy={copy} onBack={back} /> : <p className="hn-notification-detail-placeholder">{copy.mainEmpty}</p>}</section>
    </div>}
  </GlobalModal>;
}
