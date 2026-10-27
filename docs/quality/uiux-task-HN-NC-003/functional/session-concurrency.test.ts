import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotificationRepository} from '../../../../src/preview-mock/notifications';
import {createMemoryPersistence} from '../../../../src/preview-mock/storage';
import {designFixture,FIXED_NOW} from '../../../../tests/visual/notification-fixture';
const now=Date.parse(FIXED_NOW);
for(const scenario of ['anonymous','unconfirmed','expired'] as const)test(`F-NC-003-SESSION-${scenario} refuses read and mutation without persistence`,async()=>{
 const persistence=createMemoryPersistence();let writes=0;let reads=0;
 const repo=createNotificationRepository({persistence:{...persistence,async read(){reads++;return persistence.read();},async write(v){writes++;return persistence.write(v);}},namespace:crypto.randomUUID(),now:()=>now,actor:async()=>scenario==='anonymous'?null:{key:'A',confirmed:scenario!=='unconfirmed',expiresAt:scenario==='expired'?now:now+60000},captureFence:()=>()=>{},seed:designFixture});
 await assert.rejects(repo.read(),{status:401,code:'SESSION_EXPIRED'});await assert.rejects(repo.markAllRead('denied'),{status:401,code:'SESSION_EXPIRED'});assert.equal(writes,0);assert.equal(reads,0);
});
test('F-NC-003-CONCURRENT duplicate command replay and distinct updates retain exact count',async()=>{
 const repo=createNotificationRepository({persistence:createMemoryPersistence(),namespace:crypto.randomUUID(),now:()=>now,actor:async()=>({key:'A',confirmed:true,expiresAt:now+60000}),captureFence:()=>()=>{},seed:designFixture});
 await repo.read();const replies=await Promise.all([repo.markRead('QA-DESIGN-2','same-command'),repo.markRead('QA-DESIGN-2','same-command')]);assert.equal(replies[0].revision,replies[1].revision);assert.equal((await repo.read()).totalUnread,1);
 await Promise.all([repo.markUnread('QA-DESIGN-2','unread'),repo.markRead('QA-DESIGN-3','read-other')]);assert.equal((await repo.read()).totalUnread,1);
});
