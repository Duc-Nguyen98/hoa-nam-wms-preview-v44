import {useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {GlobalToastProvider} from '../../src/toast/GlobalToastProvider';
import {ShellPreferencesRuntime} from '../../src/shared/ShellPreferencesRuntime';
import {GlobalShell} from '../../src/shared/GlobalShell';
import {S00_SHELL_NAVIGATION} from '../../src/shared/s00-navigation';
import {createNotificationStore,dispatchNotification,type NotificationAction} from '../../src/notifications/notification-state';
import {createNotificationRepository} from '../../src/preview-mock/notifications';
import {createIndexedDbPersistence} from '../../src/preview-mock/storage';
import {designFixture,FIXED_NOW} from './notification-fixture';
import type {NotificationLocalizedText} from '../../src/notifications/notification-feed';
import '../../src/shared/styles.css';
import '../../src/shared/unified.css';
import '../../src/shared/components.css';
import '../../src/shared/premium.css';
import '../../src/shared/dark-theme.css';
import '../../src/shared/premium-dark.css';
import '../../src/shared/header-controls.css';

const params=new URLSearchParams(location.search);
const before=params.has('before');
const {NotificationCenterView}=await (before?import('./BeforeNotificationCenter'):import('../../src/notifications/PreviewNotificationCenter'));
function TestPage(){
 const [open,setOpen]=useState(false);
 const mode=params.get('state')??'ready';
 const setup=useMemo(()=>{
   const persistence=createIndexedDbPersistence(`notification-visual-only-${params.get('run')??'default'}`);
   let fail=false,hold=false; let releases:Array<()=>void>=[];
   const repo=createNotificationRepository({persistence:{...persistence,async read(){if(fail)throw Error('isolated storage fault');if(hold)await new Promise<void>(r=>releases.push(r));return persistence.read();},async write(v){if(fail)throw Error('isolated write fault');return persistence.write(v);}},namespace:'notification-visual-only',now:()=>Date.parse(FIXED_NOW),actor:async()=>({key:'QA-VISUAL',confirmed:true,expiresAt:Date.parse(FIXED_NOW)+3600000}),captureFence:()=>()=>{},seed:()=>{
     const base=designFixture();
     if(params.get('state')==='unverified')base[0]={...base[0],presentation:{...base[0].presentation,fields:undefined,targetVerified:false}};
     if(params.get('state')==='empty')return [];
     if(params.get('state')==='long'){base[0]={...base[0],presentation:{...base[0].presentation,title:Object.fromEntries(Object.entries(base[0].presentation!.title!).map(([k,v])=>[k,v.repeat(8)])) as NotificationLocalizedText,body:{vi:'Nội dung dài cần kiểm tra. '.repeat(160),en:'Long detail content. '.repeat(160),'zh-CN':'很长的通知内容。'.repeat(160)}}};}
     if(params.get('state')==='many')return Array.from({length:101},(_,i)=>({...base[i%6],id:`QA-MANY-${i}`,readAt:null}));
     return base;
   }});
   const store=createNotificationStore(()=>repo);
   return {store,setFail(v:boolean){fail=v;},setHold(v:boolean){hold=v;if(!v){releases.splice(0).forEach(r=>r());}},persistence};
 },[]);
 const state=useSyncExternalStore(setup.store.subscribe,setup.store.getSnapshot,setup.store.getSnapshot);
 useEffect(()=>{if(mode==='loading')setup.setHold(true);if(mode==='error')setup.setFail(true);setup.store.bind('QA-VISUAL');},[]);
 return <GlobalShell title="Phiếu xuất kho" navigation={S00_SHELL_NAVIGATION} variant="wms" activeKey="S15"><h1>Phiếu xuất kho</h1><p>Theo dõi tình trạng xuất kho và quản lý chứng từ</p><button id="open-center" onClick={()=>setOpen(true)}>Open notifications</button><button id="fault" onClick={()=>{setup.setFail(true);void setup.store.refresh();}}>Storage error</button><button id="recover" onClick={()=>{setup.setFail(false);setup.setHold(false);void setup.store.refresh();}}>Recover</button><button id="refresh-hold" onClick={()=>{setup.setHold(true);void setup.store.refresh();}}>Refresh hold</button><output id="persisted-unread">{state.totalUnread}</output><NotificationCenterView open={open} onClose={()=>setOpen(false)} state={state} dispatch={(a:NotificationAction)=>dispatchNotification(setup.store,a)}/></GlobalShell>;
}
createRoot(document.getElementById('root')!).render(<ShellPreferencesRuntime><GlobalToastProvider><TestPage/></GlobalToastProvider></ShellPreferencesRuntime>);
