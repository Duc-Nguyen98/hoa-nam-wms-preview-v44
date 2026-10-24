import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GlobalShell } from '../shared/GlobalShell';
import { S00_SHELL_NAVIGATION } from '../shared/s00-navigation';
import { Button } from '../shared/primitives';
import { createIndexedDbPersistence } from '../preview-mock/storage';
import { createNotificationRepository } from '../preview-mock/notifications';
import { createNotificationHarnessState } from './notification-model';
import { createNotificationStore } from './notification-state';
import { NotificationCenterView } from './PreviewNotificationCenter';
import { NotificationBell } from './NotificationBell';
const COUNTS=[0,1,9,10,98,99,100,101,999,10000];
const namespace='hoa-nam-uiux-notification-qa-v1';
const savedCount=()=>{try{const value=Number(localStorage.getItem(`${namespace}:count`));return COUNTS.includes(value)?value:100;}catch{return 100;}};

/** Explicit QA only. Its persistence and synthetic actors never share Main notifications or business data. */
export function NotificationRepositoryQaScreen() {
  const [count,setCount]=useState(savedCount),[actor,setActor]=useState('QA:A'),[open,setOpen]=useState(false),[fault,setFault]=useState(false),[hold,setHold]=useState(false);
  const actorRef=useRef(actor),faultRef=useRef(fault),holdRef=useRef(hold),releases=useRef<Array<()=>void>>([]);
  const channelRef=useRef<BroadcastChannel|undefined>(undefined);
  actorRef.current=actor;faultRef.current=fault;holdRef.current=hold;
  const setup=useMemo(()=>{
    const persistence=createIndexedDbPersistence(`${namespace}:${count}`);
    const repo=createNotificationRepository({namespace:`${namespace}:${count}`,persistence:{...persistence,async read(){if(faultRef.current)throw Error('Explicit QA read fault');if(holdRef.current)await new Promise<void>(resolve=>releases.current.push(resolve));return persistence.read();},async write(value){if(faultRef.current)throw Error('Explicit QA commit fault');await persistence.write(value);}},
      actor:async()=>({key:actorRef.current,confirmed:true,expiresAt:Date.now()+60000}),captureFence:()=>{const captured=actorRef.current;return()=>{if(captured!==actorRef.current)throw Error('QA actor changed');};},
      seed:()=>Array.from({length:count},(_,index)=>({...createNotificationHarnessState().items[index%3],id:`QA-N${index+1}`,readAt:null})),
    });
    const store=createNotificationStore(()=>repo,()=>channelRef.current?.postMessage('committed'));
    return {store,persistence};
  },[count]);
  const state=useSyncExternalStore(setup.store.subscribe,setup.store.getSnapshot,setup.store.getSnapshot);
  useEffect(()=>{setup.store.bind(actor);},[setup,actor]);
  useEffect(()=>{
    const channel=typeof BroadcastChannel==='undefined'?undefined:new BroadcastChannel(`${namespace}:${count}`);
    channelRef.current=channel;
    if(channel)channel.onmessage=()=>void setup.store.refresh();
    return()=>{channel?.close();channelRef.current=undefined;releases.current.splice(0).forEach(resolve=>resolve());};
  },[setup,count]);
  const dispatch=async(action:Parameters<typeof NotificationCenterView>[0]['dispatch'] extends (action:infer A)=>unknown?A:never)=>{
    if(action.type==='back'){setup.store.back();return true;}
    if(action.type==='open')return setup.store.mark(action.id);
    if(action.type==='read-all')return setup.store.mark();
    return setup.store.refresh(action.type==='more');
  };
  return <GlobalShell title="QA · Notification repository" variant="wms" navigation={S00_SHELL_NAVIGATION}>
    <section className="hn-notification-harness">
      <h1>QA · Notification repository</h1>
      <p>Isolated synthetic notifications. These controls never change warehouse records or Main notification storage.</p>
      <label>Fixture unread count <select aria-label="Fixture unread count" value={count} onChange={event=>{const next=Number(event.target.value);localStorage.setItem(`${namespace}:count`,String(next));setCount(next);}}>{COUNTS.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label>QA actor <select aria-label="QA actor" value={actor} onChange={event=>setActor(event.target.value)}><option>QA:A</option><option>QA:B</option></select></label>
      <div className="hn-notification-scenario-actions">
        <Button onClick={()=>setOpen(true)}>Open notification center</Button>
        <Button variant="secondary" onClick={()=>void setup.store.refresh()}>Refresh persisted notifications</Button>
        <Button variant="secondary" onClick={async()=>{await setup.persistence.clear();setup.store.bind(null);setup.store.bind(actor);}}>Reset isolated fixture</Button>
        <Button variant="secondary" aria-pressed={fault} onClick={()=>{faultRef.current=!fault;setFault(!fault);void setup.store.refresh();}}>Toggle storage fault</Button>
        <Button variant="secondary" aria-pressed={hold} onClick={()=>{holdRef.current=!hold;setHold(!hold);if(hold)releases.current.splice(0).forEach(resolve=>resolve());else{setup.store.bind(null);setup.store.bind(actor);}}}>Toggle loading hold</Button>
        <Button variant="secondary" onClick={()=>{void Promise.all([setup.store.mark('QA-N1'),setup.store.mark('QA-N2')]);}}>Concurrent read commands</Button>
      </div>
      <p data-qa-notification-count={state.totalUnread}>Repository total unread: {state.totalUnread??'unavailable'} · Loaded: {state.items.length}/{state.total} · Revision: {state.revision}</p>
      <NotificationBell label="QA unread" unread={state.totalUnread} qa aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)} />
      <NotificationCenterView open={open} onClose={()=>setOpen(false)} state={state} dispatch={dispatch}/>
    </section>
  </GlobalShell>;
}
