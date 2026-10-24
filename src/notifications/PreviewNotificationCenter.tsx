import { useGlobalToast } from '../toast/GlobalToastProvider';
import { useEffect, useRef } from 'react';
import { GlobalModal } from '../shared/GlobalModal';
import { Button } from '../shared/primitives';
import { Icon } from '../shared/Icon';
import { localeForLanguage, useShellPreferences } from '../shared/shell-preferences';
import { notificationCopy } from './notification-copy';
import { formatMockNotificationTime } from './notification-model';
import { dispatchPreviewNotification, usePreviewNotifications, type NotificationStoreState } from './notification-preview-store';
import './notifications.css';

type NotificationAction = {type:'back'|'read-all'|'retry'|'more'} | {type:'open';id:string};
export function PreviewNotificationCenter({open,onClose}:{open:boolean;onClose:()=>void}) {
  const state=usePreviewNotifications();
  return <NotificationCenterView open={open} onClose={onClose} state={state} dispatch={dispatchPreviewNotification}/>;
}

/** The same view is reused by explicit isolated QA with its own repository. */
export function NotificationCenterView({open,onClose,state,dispatch}:{open:boolean;onClose:()=>void;state:NotificationStoreState;dispatch:(action:NotificationAction)=>Promise<boolean>}) {
  const {language}=useShellPreferences();
  const toast=useGlobalToast();
  const copy=notificationCopy(language);
  const dialog=useRef<HTMLDialogElement>(null);
  const lastItem=useRef<string|null>(null);
  const selected=state.items.find(item=>item.id===state.selectedId);
  const back=()=>{void dispatch({type:'back'});requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>(`[data-mock-id="${lastItem.current}"]`)?.focus({preventScroll:true}));};
  useEffect(()=>{
    if(!open)return;
    const closeOnRoute=()=>{void dispatch({type:'back'});onClose();};
    window.addEventListener('hashchange',closeOnRoute);
    return()=>window.removeEventListener('hashchange',closeOnRoute);
  },[open,onClose,dispatch]);
  const count=state.totalUnread===null?copy.unavailableCount:`${state.totalUnread.toLocaleString(localeForLanguage(language))} ${copy.unreadCount}`;
  return <GlobalModal open={open} onClose={onClose} dialogRef={dialog} id="hn-preview-notification-center" title={copy.title} description={<span role="status" aria-live="polite" data-mock-unread-count={state.totalUnread}>{count}</span>} closeLabel={copy.closeCenter} size="large" className="hn-notification-detail hn-notification-center" data-visual-variant="premium" lang={localeForLanguage(language)}>
    {state.error && <div className="hn-notification-error" role="alert"><p>{copy.loadError}</p><Button variant="secondary" disabled={state.pending} onClick={()=>void dispatch({type:'retry'})}>{copy.retry}</Button></div>}
    {state.pending && <p className="hn-notification-progress" role="status">{copy.saving}</p>}
    {selected ? <div data-preview-notification-detail={selected.id}>
      <Button variant="ghost" onClick={back}>{copy.back}</Button>
      <h3 className="hn-notification-detail-title">{copy[selected.titleKey]}</h3>
      <p className="hn-notification-detail-body">{copy[selected.bodyKey]}</p>
      <dl className="hn-notification-detail-meta">
        <div><dt>{copy.notificationId}</dt><dd>{selected.id}</dd></div>
        <div><dt>{copy.centerTime}</dt><dd><time dateTime={selected.createdAt}>{formatMockNotificationTime(selected.createdAt,language)}</time></dd></div>
        <div><dt>{copy.status}</dt><dd>{selected.readAt===null?copy.unread:copy.read}</dd></div>
      </dl>
      <p className="hn-notification-no-target">{copy.centerNoTarget}</p>
    </div> : <section className="hn-notification-panel" data-preview-notification-center="MOCK" aria-label={copy.centerList} aria-busy={state.pending||state.scenario==='loading'}>
      <div className="hn-notification-panel-header">
        <p className="hn-notification-source">{copy.demoSource}</p>
        <Button variant="secondary" disabled={state.totalUnread===null||state.totalUnread===0||state.pending} onClick={async event=>{
          const origin=event.currentTarget;
          if(await dispatch({type:'read-all'})) {
            toast.notify({tone:'success',origin,message:locale=>notificationCopy(locale).markedAll});
            requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>('.hn-global-modal__close')?.focus({preventScroll:true}));
          }
        }}>{copy.markAll}</Button>
      </div>
      {state.scenario==='loading' && !state.items.length ? <p className="hn-notification-state-slot" role="status">{copy.mainLoading}</p>
        : state.scenario==='empty' ? <p className="hn-notification-state-slot">{copy.mainEmpty}</p>
        : <ul className="hn-notification-list">{state.items.map(item=><li key={item.id}>
          <button type="button" className="hn-notification-item" data-mock-id={item.id} data-unread={item.readAt===null} disabled={state.pending} onClick={()=>{
            lastItem.current=item.id;
            void dispatch({type:'open',id:item.id});
            requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>('.hn-global-modal__close')?.focus({preventScroll:true}));
          }}>
            <span className="hn-notification-item-icon" aria-hidden="true"><Icon name="bell" size={20}/></span>
            <span className="hn-notification-item-copy"><strong>{item.readAt===null&&<span className="hn-notification-unread-dot" aria-hidden="true"/>}{copy[item.titleKey]}</strong><span>{copy[item.bodyKey]}</span><time dateTime={item.createdAt}>{formatMockNotificationTime(item.createdAt,language)}</time></span>
            <span className="hn-notification-read-status">{item.readAt===null?copy.unread:copy.read}</span><Icon name="chevron-right" size={18}/>
          </button>
        </li>)}</ul>}
      {state.items.length<state.total&&<div className="hn-notification-more"><Button variant="secondary" onClick={()=>void dispatch({type:'more'})}>{copy.loadMore}</Button></div>}
    </section>}
  </GlobalModal>;
}
