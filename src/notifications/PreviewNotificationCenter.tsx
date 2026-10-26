import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { useGlobalToast } from '../toast/GlobalToastProvider';
import { GlobalModal } from '../shared/GlobalModal';
import { Button } from '../shared/primitives';
import { Icon } from '../shared/Icon';
import { localeForLanguage, useShellPreferences, type ShellLanguage } from '../shared/shell-preferences';
import { notificationCopy } from './notification-copy';
import { notificationBadge } from './notification-badge';
import { NotificationIcon } from './NotificationIcon';
import { notificationTarget } from './notification-target';
import type { BusinessNotification } from './notification-feed';
import { dispatchPreviewNotification, usePreviewNotifications, type NotificationStoreState } from './notification-preview-store';
import type { NotificationAction } from './notification-state';
import type { DemoNotification } from '../preview-mock/notifications';
import './notifications.css';

type Copy = ReturnType<typeof notificationCopy>;
type NotificationTab = 'all' | 'unread';
const isBusiness = (item: DemoNotification): item is BusinessNotification => item.kind === 'business';
const copyValue = (copy: Copy, key: string) => copy[key as keyof Copy] ?? key;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase();
const localized = (value: Partial<Record<ShellLanguage, string>> | undefined, language: ShellLanguage, fallback: string) => value?.[language] ?? fallback;
const dateKey = (value: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));

function timeText(value: string, language: ShellLanguage, full = false) {
  const date = new Date(value), locale = localeForLanguage(language);
  const time = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  if (!full && dateKey(value) === dateKey(new Date().toISOString())) return time;
  const parts = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(date);
  const part = (kind: string) => parts.find(value => value.type === kind)?.value ?? '';
  const day = full ? `${part('day')}/${part('month')}/${part('year')}` : `${part('day')}/${part('month')}`;
  return `${day} · ${time}`;
}

function dayLabel(value: string, language: ShellLanguage, copy: Copy) {
  const today = new Date(), yesterday = new Date(today.getTime() - 86_400_000);
  if (dateKey(value) === dateKey(today.toISOString())) return copy.groupToday;
  if (dateKey(value) === dateKey(yesterday.toISOString())) return copy.groupYesterday;
  return new Intl.DateTimeFormat(localeForLanguage(language), { timeZone: 'Asia/Bangkok', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
}

function itemText(item: DemoNotification, copy: Copy, language: ShellLanguage) {
  const presentation = isBusiness(item) ? item.presentation : undefined;
  const reference = isBusiness(item) ? item.target.reference : item.id;
  return {
    title: localized(presentation?.title, language, copyValue(copy, item.titleKey)),
    body: localized(presentation?.body, language, copyValue(copy, item.bodyKey)),
    summary: localized(presentation?.summary, language, reference), reference,
    category: localized(presentation?.categoryLabel, language, copyValue(copy, `${isBusiness(item) ? item.category : 'system'}Category`)),
  };
}

function NotificationRow({ item, selected, language, copy, onOpen }: { item: DemoNotification; selected: boolean; language: ShellLanguage; copy: Copy; onOpen: (id: string) => void }) {
  const text = itemText(item, copy, language), category = isBusiness(item) ? item.category : 'system';
  return <button type="button" className="hn-notification-item" data-notification-id={item.id} data-selected={selected} data-unread={item.readAt === null} aria-current={selected ? 'true' : undefined} onClick={() => onOpen(item.id)}>
    <span className={`hn-notification-item-icon hn-notification-item-icon--${category}`}><NotificationIcon category={category} /></span>
    <span className="hn-notification-item-copy"><strong>{item.readAt === null && <span className="hn-notification-unread-dot" aria-label={copy.unread} />}{text.title}</strong><span title={text.summary}>{text.summary}</span></span>
    <time dateTime={item.createdAt}>{timeText(item.createdAt, language)}</time><span className="hn-notification-row-chevron"><Icon name="chevron-right" size={20} /></span>
  </button>;
}

function NotificationDetail({ item, language, copy, titleRef, pending, offline, onBack, onRead, onNavigate, onPrevious, onNext, position, total }: {
  item: DemoNotification; language: ShellLanguage; copy: Copy; titleRef: RefObject<HTMLHeadingElement | null>; pending: boolean; offline: boolean;
  onBack: () => void; onRead: () => void; onNavigate: () => void; onPrevious?: () => void; onNext?: () => void; position: number; total: number;
}) {
  const text = itemText(item, copy, language), business = isBusiness(item) ? item : null;
  const fields = business?.presentation?.fields, target = business ? notificationTarget(business) : null;
  return <article className="hn-notification-detail-pane" data-notification-detail={item.id}>
    <Button variant="ghost" className="hn-notification-detail-back" onClick={onBack}><Icon name="chevron-left" size={18} />{copy.back}</Button>
    <div className="hn-notification-detail-content">
      <p className="hn-notification-category">{text.category}</p>
      <h3 ref={titleRef} tabIndex={-1} className="hn-notification-detail-title">{text.title}</h3>
      <div className="hn-notification-detail-metadata"><span><Icon name="calendar" size={18} /><time dateTime={item.createdAt}>{timeText(item.createdAt, language, true)}</time></span><span><Icon name={item.readAt === null ? 'bell' : 'circle-check'} size={17} />{item.readAt === null ? copy.unread : copy.read}</span></div>
      <p className="hn-notification-detail-body">{text.body}</p>
      <section className="hn-notification-business-card" aria-label={copy.businessInformation}>
        <h4><NotificationIcon category={business?.category ?? 'system'} size={24} />{localized(business?.presentation?.cardTitle, language, copy.businessInformation)}</h4>
        <dl>{fields?.length ? fields.map((field, index) => <div key={index}><dt>{localized(field.label, language, '')}</dt><dd>{field.tone ? <span className={`hn-notification-business-status hn-notification-business-status--${field.tone}`}>{field.tone === 'success' ? <Icon name="circle-check" size={16} /> : <NotificationIcon category="clock" size={16} />}{localized(field.value, language, '')}</span> : localized(field.value, language, '')}</dd></div>) : <div><dt>{copy.centerReference}</dt><dd>{text.reference}</dd></div>}</dl>
        {!fields?.length && <p className="hn-notification-missing-data">{copy.missingBusinessInformation}</p>}
      </section>
      <div className="hn-notification-detail-actions">
        {target && <a className="hn-notification-primary" href={target.href} onClick={event => {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          // Clearing selection can immediately render the first notification's link.
          // Capture the clicked destination before that update changes the anchor.
          const href = target.href;
          event.preventDefault();
          onNavigate();
          window.location.hash = href;
        }}>{copyValue(copy, target.labelKey)}<Icon name="arrow-right" size={20} /></a>}
        <Button variant="ghost" className="hn-notification-toggle-read" disabled={pending || offline} onClick={onRead}>{item.readAt === null ? copy.markRead : copy.markUnread}</Button>
      </div>
      {!target && <p className="hn-notification-no-target">{copy.centerNoTarget}</p>}
    </div>
    <footer className="hn-notification-detail-footer"><span className="hn-notification-reading-notice"><Icon name="info" size={17} />{copy.readingNotice}</span><nav aria-label={copy.centerDetail}><span>{copy.notification} {position} / {total}</span><Button variant="secondary" iconOnly aria-label={copy.previous} disabled={!onPrevious} onClick={onPrevious}><Icon name="chevron-left" size={18} /></Button><Button variant="secondary" iconOnly aria-label={copy.next} disabled={!onNext} onClick={onNext}><Icon name="chevron-right" size={18} /></Button></nav></footer>
  </article>;
}

export function PreviewNotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <NotificationCenterView open={open} onClose={onClose} state={usePreviewNotifications()} dispatch={dispatchPreviewNotification} />;
}

/** Presentational view: repository selection, read commands and data remain separate. */
export function NotificationCenterView({ open, onClose, state, dispatch }: { open: boolean; onClose: () => void; state: NotificationStoreState; dispatch: (action: NotificationAction) => Promise<boolean> }) {
  const { language } = useShellPreferences(), toast = useGlobalToast(), copy = notificationCopy(language), uid = useId();
  const dialog = useRef<HTMLDialogElement>(null), listScroll = useRef<HTMLDivElement>(null), titleRef = useRef<HTMLHeadingElement>(null);
  const lastItem = useRef<string | null>(null), lastScroll = useRef(0);
  const [tab, setTab] = useState<NotificationTab>('all'), [query, setQuery] = useState('');
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const selected = state.items.find(item => item.id === state.selectedId);
  const visibleItems = useMemo(() => state.items.filter(item => {
    if (tab === 'unread' && item.readAt !== null) return false;
    const text = itemText(item, copy, language);
    return !query.trim() || normalize(`${text.title} ${text.body} ${text.summary} ${text.reference}`).includes(normalize(query.trim()));
  }), [copy, language, query, state.items, tab]);
  const detailItem = state.selectedId ? (selected && visibleItems.some(item => item.id === selected.id) ? selected : undefined) : visibleItems[0];
  const position = detailItem ? visibleItems.findIndex(item => item.id === detailItem.id) : -1;
  const groups = useMemo(() => {
    const result: Array<{ key: string; label: string; items: DemoNotification[] }> = [];
    for (const item of visibleItems) {
      const key = dateKey(item.createdAt), group = result.find(value => value.key === key);
      if (group) group.items.push(item); else result.push({ key, label: dayLabel(item.createdAt, language, copy), items: [item] });
    }
    return result;
  }, [copy, language, visibleItems]);
  const back = () => {
    void dispatch({ type: 'back' });
    requestAnimationFrame(() => {
      if (listScroll.current) listScroll.current.scrollTop = lastScroll.current;
      const row = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('[data-notification-id]') ?? []).find(item => item.dataset.notificationId === lastItem.current);
      (row ?? dialog.current?.querySelector<HTMLInputElement>('input[type="search"]'))?.focus({ preventScroll: true });
    });
  };
  const openItem = (id: string) => { lastItem.current = id; lastScroll.current = listScroll.current?.scrollTop ?? 0; void dispatch({ type: 'open', id }); };
  const toggleRead = async () => {
    if (!detailItem) return;
    const wasUnread = detailItem.readAt === null;
    if (await dispatch({ type: wasUnread ? 'read' : 'unread', id: detailItem.id })) {
      // A read item leaves the Unread result set; return to the filtered list
      // instead of silently replacing its detail with a different notification.
      if (tab === 'unread' && wasUnread) back();
    }
  };
  const chooseTab = (value: NotificationTab) => { setTab(value); void dispatch({ type: 'back' }); };
  const tabKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 'all' : event.key === 'End' ? 'unread' : tab === 'all' ? 'unread' : 'all';
    chooseTab(next); event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
  };
  useEffect(() => { if (open && state.selectedId) requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true })); }, [open, state.selectedId]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const closeOnRoute = () => { void dispatch({ type: 'back' }); onClose(); };
    window.addEventListener('hashchange', closeOnRoute); return () => window.removeEventListener('hashchange', closeOnRoute);
  }, [dispatch, onClose, open]);
  const unreadBadge = notificationBadge(state.totalUnread);
  const title = <span className="hn-notification-heading-content"><span className="hn-notification-heading-icon" aria-hidden="true"><Icon name="bell" size={32} /></span><span className="hn-notification-heading-text">{copy.title}</span>{unreadBadge && <span className="hn-notification-heading-badge" data-notification-unread-count={state.totalUnread}>{unreadBadge} {copy.unreadCount}</span>}</span>;
  return <GlobalModal open={open} onClose={onClose} dialogRef={dialog} id="hn-preview-notification-center" title={title} description={copy.subtitle} closeLabel={copy.closeCenter} size="large" className="hn-notification-center" data-visual-variant="premium" lang={localeForLanguage(language)}>
    {(offline || state.stale) && <div className="hn-notification-banner" role="status"><Icon name="info" size={18} /><span>{offline ? copy.offline : copy.stale}</span></div>}
    {state.error && <div className="hn-notification-error" role="alert"><p>{copy.loadError}</p><Button variant="secondary" disabled={state.pending || offline} onClick={() => void dispatch({ type: 'retry' })}>{copy.retry}</Button></div>}
    {(state.pending || state.refreshing) && <p className="hn-notification-progress" role="status">{state.pending ? copy.saving : copy.refreshing}</p>}
    <div className="hn-notification-center-grid" data-detail-open={Boolean(selected && detailItem)}>
      <section className="hn-notification-list-pane" aria-label={copy.centerList}>
        <div className="hn-notification-center-toolbar">
          <label className="hn-notification-search"><Icon name="search" size={20} /><input type="search" value={query} placeholder={copy.searchPlaceholder} aria-label={copy.search} onChange={event => { setQuery(event.target.value); void dispatch({ type: 'back' }); }} /></label>
          <div className="hn-notification-filter-row"><div className="hn-notification-tabs" role="tablist" aria-label={copy.centerList} onKeyDown={tabKeys}>
            <button type="button" role="tab" id={`${uid}-all`} aria-controls={`${uid}-list`} data-tab="all" tabIndex={tab === 'all' ? 0 : -1} aria-selected={tab === 'all'} onClick={() => chooseTab('all')}>{copy.all}<span>{state.total > 99 ? '99+' : state.total}</span></button>
            <button type="button" role="tab" id={`${uid}-unread`} aria-controls={`${uid}-list`} data-tab="unread" tabIndex={tab === 'unread' ? 0 : -1} aria-selected={tab === 'unread'} onClick={() => chooseTab('unread')}>{copy.unreadTab}<span>{state.totalUnread === null ? '—' : unreadBadge || '0'}</span></button>
          </div><Button variant="ghost" className="hn-notification-mark-all" disabled={state.totalUnread === null || state.totalUnread === 0 || state.pending || offline} onClick={async event => { const origin = event.currentTarget; if (await dispatch({ type: 'read-all' })) toast.notify({ tone: 'success', origin, message: locale => notificationCopy(locale).markedAll }); }}><Icon name="circle-check" size={19} />{copy.markAll}</Button></div>
        </div>
        <div ref={listScroll} className="hn-notification-list-scroll" role="tabpanel" id={`${uid}-list`} aria-labelledby={`${uid}-${tab}`} aria-busy={state.pending || state.refreshing || state.scenario === 'loading'}>
          {state.scenario === 'loading' && !state.items.length ? <p className="hn-notification-state-slot" role="status">{copy.mainLoading}</p> : groups.length ? <div className="hn-notification-groups">{groups.map(group => <section className="hn-notification-group" key={group.key}><h3>{group.label}</h3><ul className="hn-notification-list">{group.items.map(item => <li key={item.id}><NotificationRow item={item} selected={item.id === detailItem?.id} language={language} copy={copy} onOpen={openItem} /></li>)}</ul></section>)}</div> : <p className="hn-notification-filter-empty">{query.trim() ? copy.noSearchResults : tab === 'unread' ? copy.noUnread : copy.mainEmpty}</p>}
          {state.items.length < state.total && <div className="hn-notification-more"><Button variant="secondary" disabled={state.refreshing || offline} onClick={() => void dispatch({ type: 'more' })}>{copy.loadMore}</Button></div>}
        </div>
        <footer className="hn-notification-list-footer">{visibleItems.length.toLocaleString(localeForLanguage(language))} {copy.allCount}</footer>
      </section>
      <section className="hn-notification-detail-pane-wrap" aria-label={copy.centerDetail}>{detailItem ? <NotificationDetail item={detailItem} language={language} copy={copy} titleRef={titleRef} pending={state.pending} offline={offline} onBack={back} onNavigate={() => { void dispatch({ type: 'back' }); onClose(); }} onRead={() => void toggleRead()} position={position + 1} total={visibleItems.length} onPrevious={position > 0 ? () => openItem(visibleItems[position - 1].id) : undefined} onNext={position >= 0 && position + 1 < visibleItems.length ? () => openItem(visibleItems[position + 1].id) : undefined} /> : <p className="hn-notification-detail-placeholder">{state.scenario === 'loading' ? copy.mainLoading : query.trim() ? copy.noSearchResults : copy.mainEmpty}</p>}</section>
    </div>
  </GlobalModal>;
}
