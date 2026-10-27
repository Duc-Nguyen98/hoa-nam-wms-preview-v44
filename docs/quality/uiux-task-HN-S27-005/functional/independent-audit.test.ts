import assert from 'node:assert/strict';
import test from 'node:test';
import { auditFixture } from '../../../../tests/s27/fixture';
import { DEFAULT_AUDIT_FILTER as defaults, projectOperationalAudit, queryOperationalAudit, createOperationalAuditReader } from '../../../../src/features/S27/audit-operational-binding';
import { selectAuditDetail, resolveAuditDetail } from '../../../../src/features/S27/OperationalDetail';
import { getBusinessDateWindow, validateBusinessDateRange } from '../../../../src/shared/date-policy';
import { vietnamPeriod } from '../../../../src/operations/operational-reports';
import { createOperationalService } from '../../../../src/preview-mock/operational-service';
const period={from:'2026-10-25',to:'2026-10-25'},asOf='2026-10-25T16:59:59.999Z';
const make=(n=35)=>projectOperationalAudit(auditFixture(n),{...period,asOf});
const query=(model:any,patch:any={})=>{const result=queryOperationalAudit(model,{...defaults,...patch});assert.equal(result.kind,'ready');if(result.kind!=='ready')throw Error(result.reason);return result;};

test('every raw supported search field resolves the exact source record; normalized action and actor search',()=>{
 const model=make();const row=model.rows[1];
 for(const value of [row.id,row.entityId,row.commandId,row.commitSnapshotId,row.eventIds[0],row.relatedIds[0]]) assert.ok(query(model,{search:value.toUpperCase()}).rows.some(r=>r.id===row.id));
 for(const value of [row.action,row.actorId,row.sourceSurface])assert.ok(query(model,{search:value.toUpperCase()}).pagination.total>0);
 assert.equal(query(model,{search:'INBOUND.POST',action:'inbound.post',actorId:row.actorId}).pagination.total,1);
 assert.equal(query(model,{search:'not-a-supported-identifier'}).pagination.total,0);
});
test('action/actor combination, all six sort variants, pages and source preservation',()=>{
 const source=auditFixture(35),before=JSON.stringify(source),model=projectOperationalAudit(source,{...period,asOf});
 assert.equal(query(model,{action:'stock-profiles.create'}).pagination.total,32);
 assert.equal(query(model,{action:'stock-profiles.create',actorId:'preview:ducquang'}).pagination.total,17);
 for(const sortKey of ['at','actorId','id'])for(const sortDirection of ['asc','desc']){
  const ids=[1,2,3,4].flatMap(page=>query(model,{sortKey,sortDirection,page}).rows.map(r=>r.id));assert.equal(ids.length,35);assert.equal(new Set(ids).size,35);
 }
 assert.equal(query(model,{sortKey:'id',sortDirection:'desc'}).rows[0].id,model.rows[34].id);
 assert.equal(query(model,{pageSize:25}).rows.length,25);assert.equal(JSON.stringify(source),before);
 assert.throws(()=>{(model.rows as any).push({})});assert.throws(()=>{(model.rows[1].relatedIds as any).push('mutation')});
});
test('inclusive Vietnam 90-day date limits, no future and exact midnight boundaries',async()=>{
 const now=new Date('2026-10-25T17:00:00.000Z'),window=getBusinessDateWindow({now});assert.equal(window.today,'2026-10-26');assert.equal(window.minDate,'2026-07-28');
 assert.equal(validateBusinessDateRange({from:'2026-07-28',to:'2026-10-26'},{now}).valid,true);
 assert.equal(validateBusinessDateRange({from:'2026-07-27',to:'2026-10-26'},{now}).valid,false);
 assert.equal(validateBusinessDateRange({from:'2026-10-26',to:'2026-10-27'},{now}).valid,false);
 assert.equal(validateBusinessDateRange({from:'2026-10-26',to:'2026-10-25'},{now}).valid,false);
 const boundary=vietnamPeriod('2026-10-25','2026-10-25');assert.equal(new Date(boundary.fromInclusive).toISOString(),'2026-10-24T17:00:00.000Z');assert.equal(new Date(boundary.toExclusive).toISOString(),'2026-10-25T17:00:00.000Z');
 for(const time of ['2026-10-24T16:59:59.999Z','2026-10-24T17:00:00.000Z','2026-10-25T16:59:59.999Z','2026-10-25T17:00:00.000Z']){
  // Timestamp-only source copy keeps every immutable canonical record consistent.
  const source=JSON.parse(JSON.stringify(auditFixture(1)).replaceAll('2026-10-25T07:24:00.000Z',time));
  const model=projectOperationalAudit(source,{...period,asOf:'2026-10-26T00:00:00.000Z'});
  assert.equal(model.rows.length,time>='2026-10-24T17:00:00.000Z'&&time<'2026-10-25T17:00:00.000Z'?1:0);
 }
 let reads=0;const reader=createOperationalAuditReader({available:true,async read(){reads++;return auditFixture();}},()=>now.toISOString());
 await reader.load({from:'2026-07-27',to:'2026-10-26'});assert.equal(reader.getSnapshot().error,'INVALID_PERIOD');assert.equal(reads,0);
});
test('details exactly match proof versions/raw IDs/relationships; changed query and mutation cannot select a substitute',()=>{
 const model=make(),state={model,loading:false,error:''},q={...defaults},row=model.rows[1],selection=selectAuditDetail(row.id,state,q,period)!;
 assert.deepEqual(resolveAuditDetail(selection,state,q,period),row);assert.equal(row.previousVersion,2);assert.equal(row.newVersion,3);assert.equal(row.relatedIds[0],row.entityId);assert.equal(row.eventIds.length,1);
 assert.equal(resolveAuditDetail(selection,state,{...q,search:'other'},period),null);
 const mutated=structuredClone(model);mutated.rows[1].commandId='substitute';assert.equal(resolveAuditDetail(selection,{...state,model:mutated},q,period),null);
 for(const r of model.rows){const proof=model.report.audit.find(a=>a.id===r.id)!.data as any;assert.equal(r.id,'audit:'+proof.commandId);assert.deepEqual(r.eventIds,proof.eventIds);assert.deepEqual(r.relatedIds,proof.FK);}
});
test('reader safely rejects denied, unavailable, incomplete and actor-scoped snapshots',async()=>{
 for(const code of ['FORBIDDEN','UNAUTHENTICATED','SESSION_EXPIRED','CONFIRMATION_REQUIRED','COMMAND_UNAVAILABLE','READ_FAILED']){
  const reader=createOperationalAuditReader({available:true,async read(){throw Object.assign(new Error(code),{code});}},()=>asOf);await reader.load(period);assert.equal(reader.getSnapshot().model,null);assert.equal(reader.getSnapshot().error,code);
 }
 for(const field of ['complete','actorKey']){const reader=createOperationalAuditReader({available:true,async read(){const source=auditFixture();(source as any)[field]=field==='complete'?false:'preview:unauthorized';return source;}},()=>asOf);await reader.load(period);assert.equal(reader.getSnapshot().model,null);assert.equal(reader.getSnapshot().error,'INCOMPLETE_POPULATION');}
});
test('MOCK service read authority denies absent/wrong/unconfirmed/expired actors before repository access and fences scope',async()=>{
 for(const actor of [null,{key:'preview:other',confirmed:true,expiresAt:Date.now()+100000},{key:'preview:ducquang',confirmed:false,expiresAt:Date.now()+100000},{key:'preview:ducquang',confirmed:true,expiresAt:0}]){
  let reads=0;const service=createOperationalService('WEB',async()=>{reads++;throw Error('must not read');},{actor:async()=>actor as any,captureAuthorityFence:()=>()=>{}},true);
  await assert.rejects(service.read(),(e:any)=>e.code==='MOCK_COMMAND_FORBIDDEN');assert.equal(reads,0);
 }
 let calls=0,fences=0;const actor={key:'preview:ducquang',confirmed:true,expiresAt:Date.now()+100000};
 const service=createOperationalService('WEB',async()=>({read:async()=>({epoch:'qa-auth',snapshotRevision:1,records:[]})}) as any,{actor:async()=>{calls++;return actor as any;},captureAuthorityFence:()=>()=>{fences++;}},true);
 const result=await service.read();assert.equal(result.mode,'MOCK');assert.equal(calls,2);assert.equal(fences,1);
 const unavailable=createOperationalService('WEB',async()=>{throw Error('must not read');},{},false);await assert.rejects(unavailable.read(),(e:any)=>e.code==='COMMAND_UNAVAILABLE');
});
