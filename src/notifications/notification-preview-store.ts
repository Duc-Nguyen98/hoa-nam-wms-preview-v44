import { useLayoutEffect, useSyncExternalStore } from 'react';
import { readBrowserPreviewRuntime } from '../preview-mock/browser-runtime';
import { createNotificationStore, dispatchNotification, type NotificationAction } from './notification-state';
export type { NotificationStoreState } from './notification-state';

let channel: BroadcastChannel | undefined;
const store=createNotificationStore(()=>readBrowserPreviewRuntime()?.notifications,()=>channel?.postMessage('committed'));
let listening=false;
function listen() {
  if(listening || typeof window==='undefined')return;
  listening=true;
  window.addEventListener('focus',()=>void store.refresh());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void store.refresh();});
  if(typeof BroadcastChannel!=='undefined') {
    channel=new BroadcastChannel('hoa-nam-preview-notifications-v1');
    channel.onmessage=event=>{if(event.data==='committed')void store.refresh();};
  }
}
export const dispatchPreviewNotification = (action: NotificationAction) => dispatchNotification(store, action);
export function usePreviewNotifications(actorBinding?:string|null) {
  useLayoutEffect(()=>{
    if(actorBinding===undefined)return;
    listen();store.bind(actorBinding);
    // A signed-out shell unmounts its header. Clear that actor immediately, so
    // signing back into the same account performs a fresh repository read.
    return()=>{if(store.getSnapshot().actorBinding===actorBinding)store.bind(null);};
  },[actorBinding]);
  return useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
}
