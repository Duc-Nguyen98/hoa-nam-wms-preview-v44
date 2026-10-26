import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApiClient } from '../../src/data/http/api-client';
import { createBusinessHttpAdapters } from '../../src/data/http/business-adapters';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import { PUBLIC_DEMO_LOGIN } from '../../src/preview-mock/public-demo-login';
import { DEFAULT_DEFECTS_QUERY, updateDefectsQuery, validateDefectDraft } from '../../src/contracts/defects';
import { createDefectsCommandHttpAdapter } from '../../src/features/S02/defects-command-http';
import { createDefectsCommandService } from '../../src/features/S02/defects-command-service';
import { createApprovedDefectsCommandPolicy } from '../../src/features/S02/defects-approved-policy';
import { createDefectsFixtureAdapter } from '../../src/data/adapters/defects-fixture-adapter';
import { queryDefectsRows, normalizeDefectsSearch } from '../../src/data/adapters/defects-query';
import { APPROVED_DEFECTS_HANDLERS } from '../../src/features/S02/defects-approved-policy';

async function fixture(login = true) {
  let clock=Date.now();
  const client = createApiClient({baseURL:'https://s00-4.test/api/v1'});
  const runtime = installPreviewMock(client,{origin:'https://s00-4.test',approvedPreviewCommands:true,
    credentialProfile:PUBLIC_DEMO_LOGIN,now:()=>clock,persistence:createMemoryPersistence(),sessionToken:createMemorySessionToken(),
    businessPersistence:createMemoryBusinessPersistence(),recoveryPersistence:createMemoryBusinessPersistence(),
    notificationPersistence:createMemoryPersistence()});
  const auth = async () => {await client.post('auth/login',{username:'demo',password:'HoaNamDemo@2026'});await client.post('auth/confirm',{});};
  if(login) await auth();
  const read = async () => {const r=await createBusinessHttpAdapters(client).S02.read();assert.equal(r.kind,'ready');if(r.kind!=='ready')throw Error('read blocked');return r.model;};
  const adapter=createDefectsCommandHttpAdapter(client);
  const create = async (code='QA-NEW') => {const m=await read();return adapter.execute({command:'defects.create',commandId:randomUUID(),epoch:m.commandContext!.epoch,payload:{code,name:'QA lỗi',description:'',status:'active'}});};
  return {client,runtime,auth,read,adapter,create,expire:()=>{clock+=7*24*60*60*1000;}};
}
const draft={code:'QA-NEW',name:'QA lỗi',description:'',status:'active' as const};

test('F-S02-001 required fields and invalid status are rejected',()=>{
  assert.deepEqual(Object.keys(validateDefectDraft({...draft,code:' ',name:''})),['code','name']);
  assert.ok(validateDefectDraft({...draft,status:'deleted' as any}).status);
});
test('F-S02-002 create/read/update/status and immutable saved code use canonical HTTP receipts',async()=>{
  const f=await fixture();try{
    const before=await f.read(),created=await f.create(' QA-NEW ');assert.equal(created.receipt.record.data.code,'QA-NEW');
    assert.equal((await f.read()).summary.total,before.summary.total+1);
    const req={command:'defects.update' as const,commandId:randomUUID(),epoch:created.receipt.epoch,entityId:created.receipt.entityId,expectedVersion:1,payload:{name:'QA sửa',description:'mô tả',status:'inactive'}};
    const updated=await f.adapter.execute(req);assert.equal(updated.receipt.version,2);assert.equal(updated.receipt.record.data.status,'inactive');
    const canonical=(await f.read()).rows.find(r=>r.code==='QA-NEW')!;assert.equal(canonical.name,'QA sửa');assert.equal(canonical.description,'mô tả');
    await assert.rejects(f.adapter.execute({...req,commandId:randomUUID(),expectedVersion:2,payload:{...req.payload,code:'RENAMED'}}),{code:'IMMUTABLE_OR_UNKNOWN_FIELD'});
    assert.equal((await f.read()).rows.find(r=>r.code==='QA-NEW')!.status,'inactive');
  }finally{f.runtime.uninstall();}
});
test('F-S02-003 duplicate trim/case/NFC codes reject atomically',async()=>{
  const f=await fixture();try{await f.create('QÁ');const before=await f.read();await assert.rejects(f.create(' qa\u0301 '),{code:'DUPLICATE_DEFECT_CODE'});assert.deepEqual(await f.read(),before);}finally{f.runtime.uninstall();}
});
test('F-S02-004 exact replay has one record; changed payload with same ID fails',async()=>{
  const f=await fixture();try{const m=await f.read(),req={command:'defects.create' as const,commandId:randomUUID(),epoch:m.commandContext!.epoch,payload:draft};
    const a=await f.adapter.execute(req),b=await f.adapter.execute(req);assert.equal(b.replayed,true);assert.deepEqual(b.receipt,a.receipt);
    assert.equal((await f.read()).rows.filter(r=>r.code===draft.code).length,1);
    await assert.rejects(f.adapter.execute({...req,payload:{...draft,name:'changed'}}),{status:409});
  }finally{f.runtime.uninstall();}
});
test('F-S02-005 concurrent expectedVersion has one winner and one 409',async()=>{
  const f=await fixture();try{const a=await f.create();const req={command:'defects.update' as const,epoch:a.receipt.epoch,entityId:a.receipt.entityId,expectedVersion:1};
    const results=await Promise.allSettled([f.adapter.execute({...req,commandId:randomUUID(),payload:{name:'A',description:'',status:'active'}}),f.adapter.execute({...req,commandId:randomUUID(),payload:{name:'B',description:'',status:'inactive'}})]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const rejected=results.find(r=>r.status==='rejected') as PromiseRejectedResult;assert.equal(rejected.reason.status,409);
    assert.equal((await f.read()).commandContext!.records[a.receipt.entityId]?.version??(await f.runtime.business.readSnapshot()).records.find(r=>r.id===a.receipt.entityId)!.version,2);
  }finally{f.runtime.uninstall();}
});
test('F-S02-006 direct API mutation rejects anonymous and logged-out session',async()=>{
  const f=await fixture();try{const m=await f.read(),req={command:'defects.create' as const,commandId:randomUUID(),epoch:m.commandContext!.epoch,payload:draft};
    await f.client.post('auth/logout',{});await assert.rejects(f.adapter.execute(req),{status:401});
  }finally{f.runtime.uninstall();}
  const anonymous=await fixture(false);try{await assert.rejects(anonymous.client.get('defects'),{status:401});}finally{anonymous.runtime.uninstall();}
});
test('F-S02-007 invalid fields and absent entity reject without mutation',async()=>{
  const f=await fixture();try{const before=await f.read(),epoch=before.commandContext!.epoch;
    await assert.rejects(f.adapter.execute({command:'defects.create',commandId:randomUUID(),epoch,payload:{...draft,name:''}}),{status:422});
    await assert.rejects(f.adapter.execute({command:'defects.update',commandId:randomUUID(),epoch,entityId:'defect:'+randomUUID(),expectedVersion:1,payload:{name:'x',description:'',status:'active'}}),{status:404});
    assert.deepEqual(await f.read(),before);
  }finally{f.runtime.uninstall();}
});
test('F-S02-008 normalized search, filters, sort, pagination and review states',async()=>{
  const adapter=createDefectsFixtureAdapter();const base=await adapter.read();assert.equal(base.kind,'ready');if(base.kind!=='ready')return;
  const row=base.model.rows[0],query={...DEFAULT_DEFECTS_QUERY,search:row.code.toLowerCase()};const found=await adapter.read(query);assert.equal(found.kind,'ready');if(found.kind==='ready')assert.ok(found.model.rows.some(r=>r.code===row.code));
  const folded=await adapter.read({...DEFAULT_DEFECTS_QUERY,search:'  '+normalizeDefectsSearch(row.name).toUpperCase()+'  '});assert.equal(folded.kind,'ready');if(folded.kind==='ready')assert.ok(folded.model.rows.some(r=>r.key===row.key));
  const synthetic=Array.from({length:31},(_,i)=>({...row,key:String(i),code:String(i).padStart(2,'0')}));
  const paged=queryDefectsRows(synthetic,{...DEFAULT_DEFECTS_QUERY,page:3},{searchMatch:'folded-includes'},[15]);assert.equal(paged.kind,'ready');if(paged.kind==='ready'){assert.equal(paged.rows.length,1);assert.equal(paged.pagination.total,31);}
  const sorted=queryDefectsRows(synthetic,{...DEFAULT_DEFECTS_QUERY,sortKey:'code',sort:'desc'},{searchMatch:'folded-includes'},[15]);assert.equal(sorted.kind,'ready');if(sorted.kind==='ready'){assert.equal(sorted.rows[0].code,'30');assert.equal(sorted.rows.at(-1)!.code,'16');}
  const filtered=await adapter.read({...DEFAULT_DEFECTS_QUERY,status:'inactive',sortKey:'code',sort:'desc'});assert.equal(filtered.kind,'ready');if(filtered.kind==='ready')assert.ok(filtered.model.rows.every(r=>r.status==='inactive'));
  assert.equal(updateDefectsQuery({...DEFAULT_DEFECTS_QUERY,page:2},{search:'a'}).page,1);
  const none=await adapter.read({...DEFAULT_DEFECTS_QUERY,search:'NO-MATCH-S00-4'});if(none.kind==='ready')assert.equal(none.model.emptyReason,'no-matches');else assert.fail();
  for(const [scenario,reason] of [['401','UNAUTHORIZED'],['403','FORBIDDEN'],['404','NOT_FOUND'],['load-error','LOAD_ERROR']]){const r=await adapter.read(DEFAULT_DEFECTS_QUERY,scenario);assert.equal(r.kind,'blocked');if(r.kind==='blocked')assert.equal(r.reason,reason);}
});
test('F-S02-009 unknown response retries original request and denies replacement',async()=>{
  const f=await fixture();try{const m=await f.read(),sent:any[]=[];let lost=true;const service=createDefectsCommandService({policy:createApprovedDefectsCommandPolicy(()=>true),adapter:{execute:async req=>{sent.push(structuredClone(req));const result=await f.adapter.execute(req);if(lost){lost=false;throw Error('lost response');}return result;}}});
    const input={operation:'create' as const,draft,original:draft,context:m.commandContext};const first=await service.save(input);assert.equal(first.kind,'failed');assert.equal(service.getSnapshot().phase,'outcome-unknown');assert.equal(service.reset(),false);
    const retry=await service.save({...input,draft:{...draft,name:'replacement'}});assert.equal(retry.kind,'committed');assert.deepEqual(sent[1],sent[0]);assert.equal((await f.read()).rows.filter(r=>r.code===draft.code).length,1);
  }finally{f.runtime.uninstall();}
});
test('F-S02-010 ungranted Preview binding rejects direct command with 403',async()=>{
  const client=createApiClient({baseURL:'https://s00-4-deny.test/api/v1'});
  const runtime=installPreviewMock(client,{origin:'https://s00-4-deny.test',credentialProfile:PUBLIC_DEMO_LOGIN,
    businessCommands:{actor:async()=>({key:'qa:reader',confirmed:true,expiresAt:Date.now()+60000}),authorize:()=>false,defectsHandlers:APPROVED_DEFECTS_HANDLERS},
    persistence:createMemoryPersistence(),sessionToken:createMemorySessionToken(),businessPersistence:createMemoryBusinessPersistence(),recoveryPersistence:createMemoryBusinessPersistence(),notificationPersistence:createMemoryPersistence()});
  try{await client.post('auth/login',{username:'demo',password:'HoaNamDemo@2026'});await client.post('auth/confirm',{});
    const epoch=(await runtime.business.readSnapshot()).epoch;
    await assert.rejects(createDefectsCommandHttpAdapter(client).execute({command:'defects.create',commandId:randomUUID(),epoch,payload:draft}),{status:403,code:'MOCK_COMMAND_FORBIDDEN'});
    assert.equal((await runtime.business.readSnapshot()).records.filter(r=>r.kind==='defect'&&(r.data as any).code===draft.code).length,0);
  }finally{runtime.uninstall();}
});
test('F-AUTH-011 unconfirmed and expired sessions reject actual Preview API reads/commands',async()=>{
 const f=await fixture(false);try{
  await assert.rejects(f.client.post('auth/login',{username:'demo',password:'incorrect'}),{status:401,code:'INVALID_CREDENTIALS'});
  await f.client.post('auth/login',{username:'demo',password:'HoaNamDemo@2026'});await assert.rejects(f.read(),{status:403,code:'CONFIRMATION_REQUIRED'});
  await f.client.post('auth/confirm',{});const model=await f.read();f.expire();
  await assert.rejects(f.adapter.execute({command:'defects.create',commandId:randomUUID(),epoch:model.commandContext!.epoch,payload:draft}),{status:401});
  await assert.rejects(f.read(),{status:401});
 }finally{f.runtime.uninstall();}
});
test('F-S02-012 durable restore never mutates/replays and acknowledgment requires verified canonical read',async()=>{
 const f=await fixture();try{
  const factory=()=>createDefectsCommandService({policy:createApprovedDefectsCommandPolicy(()=>true),adapter:createDefectsCommandHttpAdapter(f.client,{durableRecovery:true})});
  const service=factory(),m=await f.read();await service.restoreRecovery();
  const outcome=await service.save({operation:'create',draft,original:draft,context:m.commandContext});assert.equal(outcome.kind,'committed');if(outcome.kind!=='committed')return;
  const before=await f.runtime.business.readSnapshot(),restored=factory();await restored.restoreRecovery();assert.deepEqual(await f.runtime.business.readSnapshot(),before);
  assert.equal(await restored.acknowledgeRecovery(),false);assert.equal(restored.availability('create').available,false);
  await f.read();assert.equal(await restored.confirmRecoveryRead(outcome.outcome.receipt.commandId),true);assert.equal(await restored.acknowledgeRecovery(),true);
  assert.equal(restored.availability('create').available,true);assert.deepEqual(await f.runtime.business.readSnapshot(),before);
 }finally{f.runtime.uninstall();}
});
