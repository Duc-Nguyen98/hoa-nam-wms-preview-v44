import assert from 'node:assert/strict';
import test from 'node:test';
import {createOverviewFixtureAdapter} from '../../../../src/data/adapters/overview-fixture-adapter';
import {DEFAULT_OVERVIEW_QUERY} from '../../../../src/contracts/overview';
import {OVERVIEW_RUNTIME_POLICY} from '../../../../src/controllers/overview-runtime';
import {validateBusinessDateRange,getBusinessDateWindow} from '../../../../src/shared/date-policy';
import {createMockAccount} from '../../../../src/preview-mock/account';
import {PUBLIC_DEMO_LOGIN} from '../../../../src/preview-mock/public-demo-login';
import {createMemoryPersistence,createMemorySessionToken} from '../../../../src/preview-mock/storage';
import {readFailureKind} from '../../../../src/shared/read-failure-kind';
import lock from '../../references/recovered-foundation-20261027/docs/ui-foundation/UI_FOUNDATION_LOCK.json';

test('independent source arithmetic reconciles16 identities,16 chart total,5 pending with3 visible',async()=>{
 const adapter=createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY);
 assert.equal(DEFAULT_OVERVIEW_QUERY.pageSize,lock.decisions.pageSize);
 assert.equal(DEFAULT_OVERVIEW_QUERY.pageSize,10);
 assert.deepEqual(OVERVIEW_RUNTIME_POLICY.pageSizeOptions,lock.decisions.pageSizeOptions);
 const pages=[];
 const initial=await adapter.read();assert.equal(initial.kind,'ready');if(initial.kind!=='ready')return;
 for(let page=1;page<=initial.model.pagination.pageCount;page++){
  const r=await adapter.read({...DEFAULT_OVERVIEW_QUERY,page});assert.equal(r.kind,'ready');if(r.kind!=='ready')return;
  pages.push(...r.model.rows);
  assert.deepEqual([r.model.summary.inbound,r.model.summary.outbound,r.model.summary.openWarranties,r.model.summary.waiting],[8,8,4,5]);
  assert.equal(r.model.summary.stockTotal,null);assert.equal(r.model.summary.stockDisplay,'—');
  assert.equal(r.model.chart.reduce((n,b)=>n+b.inbound+b.outbound,0),16);
  assert.equal(r.model.attention?.length,5);assert.equal(r.model.attention?.slice(0,3).length,3);
 }
 assert.equal(new Set(pages.map(r=>r.id)).size,16);
 const px=pages.find(r=>r.id==='p12-stock-PX-0007')!;
 assert.deepEqual([px.number,px.partner,px.quantity,px.actor,px.day,px.time,px.status],['PX-0007','Cửa hàng An Bình',2,'Lan Nguyễn','2026-09-19','14:35','waiting']);
});

test('unknown stock and current warranty survive period with no documents',async()=>{
 const r=await createOverviewFixtureAdapter(OVERVIEW_RUNTIME_POLICY).read({...DEFAULT_OVERVIEW_QUERY,period:{from:'2026-09-01',to:'2026-09-01'}});
 assert.equal(r.kind,'ready');if(r.kind!=='ready')return;
 assert.equal(r.model.emptyReason,'no-documents');assert.equal(r.model.summary.stockTotal,null);assert.equal(r.model.summary.openWarranties,4);
 assert.deepEqual([r.model.summary.inbound,r.model.summary.outbound,r.model.summary.waiting],[0,0,0]);
});

test('date policy includes exactly90day lower boundary, rejects91days/future/reversed with Vietnam day',()=>{
 const now=new Date('2026-10-26T18:30:00Z');
 assert.deepEqual(getBusinessDateWindow({now}),{today:'2026-10-27',minDate:'2026-07-29',maxDate:'2026-10-27',empty:false,policy:'rolling-90'});
 assert.equal(validateBusinessDateRange({from:'2026-07-29',to:'2026-10-27'},{now}).valid,true);
 for(const [from,to,code] of [['2026-07-28','2026-10-27','DATE_BEFORE_MIN'],['2026-10-27','2026-10-28','DATE_AFTER_MAX'],['2026-10-27','2026-10-26','DATE_RANGE_REVERSED']]){
  const r=validateBusinessDateRange({from,to},{now});assert.equal(r.valid,false);if(!r.valid)assert.equal(r.code,code);
 }
});

test('existing MOCK account rejects S01 without session or confirmation; expiry invalidates read',async()=>{
 let now=Date.parse('2026-10-27T01:00:00Z');
 const account=createMockAccount({credentialProfile:PUBLIC_DEMO_LOGIN,namespace:'hn-s01-004-independent-memory',persistence:createMemoryPersistence(),sessionToken:createMemorySessionToken(),now:()=>now});
 const request=(method:string,path:string,data:unknown={})=>account.route(method,path,JSON.stringify(data),'application/json',new AbortController().signal);
 await assert.rejects(request('GET','/api/v1/overview'),{status:401,code:'SESSION_EXPIRED'});
 await request('POST','/api/v1/auth/login',{username:'demo',password:'HoaNamDemo@2026'});
 await assert.rejects(request('GET','/api/v1/overview'),{status:403,code:'CONFIRMATION_REQUIRED'});
 await request('POST','/api/v1/auth/confirm');
 assert.deepEqual(await request('GET','/api/v1/overview'),{handled:false});
 now+=8*60*60*1000+1;
 await assert.rejects(request('GET','/api/v1/overview'),{status:401,code:'SESSION_EXPIRED'});
 assert.equal(readFailureKind({code:'SESSION_EXPIRED'}),'unauthorized');assert.equal(readFailureKind({code:'FORBIDDEN'}),'forbidden');
});
