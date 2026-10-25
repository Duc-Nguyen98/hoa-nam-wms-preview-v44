import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotificationRepository} from '../src/preview-mock/notifications';
import {createNotificationStore,dispatchNotification} from '../src/notifications/notification-state';
import {createMemoryPersistence} from '../src/preview-mock/storage';
import {designFixture,FIXED_NOW} from './visual/notification-fixture';

function setup(seed=designFixture){
 let fail=false; let actor='A';
 const persistence=createMemoryPersistence();
 const repo=createNotificationRepository({persistence:{...persistence,async write(v){if(fail)throw Error('write failed');return persistence.write(v);}},namespace:`qa-${crypto.randomUUID()}`,now:()=>Date.parse(FIXED_NOW),actor:async()=>({key:actor,confirmed:true,expiresAt:Date.parse(FIXED_NOW)+60000}),captureFence:()=>()=>{},seed});
 return {repo,persistence,fail(){fail=true;},actor(v:string){actor=v;}};
}
test('selection and refreshing never mark a notification read',async()=>{
 const {repo}=setup();const store=createNotificationStore(()=>repo);store.bind('A');await store.refresh();
 assert.equal(store.getSnapshot().totalUnread,2);
 await dispatchNotification(store,{type:'open',id:'QA-DESIGN-2'});
 assert.equal(store.getSnapshot().selectedId,'QA-DESIGN-2');assert.equal(store.getSnapshot().totalUnread,2);
 await store.refresh();assert.equal((await repo.read()).totalUnread,2);
});
test('read/unread commands commit, replay safely, persist and stay actor-scoped',async()=>{
 const s=setup();await s.repo.read();
 const read=await s.repo.markRead('QA-DESIGN-2','read');assert.equal(read.totalUnread,1);
 const unread=await s.repo.markUnread('QA-DESIGN-2','unread');assert.equal(unread.totalUnread,2);
 const replay=await s.repo.markUnread('QA-DESIGN-2','unread');assert.equal(replay.revision,unread.revision);
 assert.equal((await s.repo.read()).items[1].readAt,null);
 await assert.rejects(s.repo.markRead('QA-DESIGN-2','unread'),{code:'NOTIFICATION_COMMAND_CONFLICT'});
 await assert.rejects(s.repo.markUnread('missing','missing'),{code:'NOTIFICATION_NOT_FOUND'});
 await s.repo.markAllRead('all');assert.equal((await s.repo.read()).totalUnread,0);
 s.actor('B');assert.equal((await s.repo.read()).totalUnread,2);s.actor('A');assert.equal((await s.repo.read()).totalUnread,0);
});
test('failed mutation preserves confirmed state and reports failure',async()=>{
 const s=setup();const store=createNotificationStore(()=>s.repo);store.bind('A');await store.refresh();s.fail();
 assert.equal(await store.mark('QA-DESIGN-2'),false);assert.equal(store.getSnapshot().totalUnread,2);assert.equal(store.getSnapshot().error,true);assert.equal(store.getSnapshot().pending,false);
});
test('unconfigured public feed starts empty; no fabricated document card',async()=>{
 const repo=createNotificationRepository({persistence:createMemoryPersistence(),namespace:'empty-default',actor:async()=>({key:'A',confirmed:true,expiresAt:Date.now()+60000}),captureFence:()=>()=>{}});
 assert.equal((await repo.read()).total,0);
});
test('old in-flight response cannot populate another account',async()=>{
 const s=setup();let release:()=>void=()=>{};
 const hold=new Promise<void>(r=>release=r);const repo={...s.repo,async read(){await hold;return s.repo.read();}};
 const store=createNotificationStore(()=>repo);store.bind('A');store.bind(null);release();await new Promise(r=>setTimeout(r,0));
 assert.equal(store.getSnapshot().actorBinding,null);assert.equal(store.getSnapshot().items.length,0);
});
