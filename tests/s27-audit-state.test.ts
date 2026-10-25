import assert from 'node:assert/strict';
import test from 'node:test';
import { auditFixture } from './s27/fixture';
import { createOperationalAuditReader, DEFAULT_AUDIT_FILTER, projectOperationalAudit, queryOperationalAudit } from '../src/features/S27/audit-operational-binding';
import { auditDetailReadMessage, refreshAuditDetail, resolveAuditDetail, selectAuditDetail, settleAuditDetailQuery } from '../src/features/S27/OperationalDetail';
const period={from:'2026-10-25',to:'2026-10-25'},asOf='2026-10-25T08:00:00.000Z';
const model=(n=25)=>projectOperationalAudit(auditFixture(n),{...period,asOf});

test('initial resume uses the displayed period even when the clock is on the next day', async () => {
  const reader=createOperationalAuditReader({available:true,async read(){return auditFixture(3);}},()=> '2026-10-26T08:00:00.000Z');
  await reader.resume(period);
  assert.equal(reader.getSnapshot().error, '');
  assert.deepEqual(reader.getSnapshot().period, period);
  assert.equal(reader.getSnapshot().model?.rows.length, 3);
  reader.suspend();
  await reader.resume(period);
  assert.equal(reader.getSnapshot().model?.rows.length, 3);
});

test('immutable proof projection, totals, versions and tied timestamp ordering',()=>{
  const source=auditFixture(25),before=JSON.stringify(source),m=projectOperationalAudit(source,{...period,asOf});
  assert.equal(JSON.stringify(source),before);assert.ok(Object.isFrozen(m.rows));
  const q=queryOperationalAudit(m,{...DEFAULT_AUDIT_FILTER,action:'stock-profiles.create',actorId:'preview:ducquang'});
  assert.equal(q.kind,'ready');if(q.kind!=='ready')return;assert.equal(q.pagination.total,12);assert.equal(q.rows.length,10);
  assert.equal(m.rows[0].previousVersion,null);assert.equal(m.rows[1].eventIds.length,1);
  const bad=auditFixture();(bad.auditEvents[0].data as any).commandId='tampered';assert.throws(()=>projectOperationalAudit(bad,{...period,asOf}));
});
test('same exact event survives refresh and new model; stale scopes/content cannot substitute',()=>{
  const m=model(),q={...DEFAULT_AUDIT_FILTER,page:2},state={model:m,loading:false,error:''};
  const row=queryOperationalAudit(m,q);assert.equal(row.kind,'ready');if(row.kind!=='ready')return;
  const pin=selectAuditDetail(row.rows[0].id,state,q,period)!;
  assert.equal(resolveAuditDetail(pin,{...state,model:model()},q,period)?.id,pin.id);
  assert.equal(resolveAuditDetail(pin,{...state,model:model(0)},q,period),null);
  const changed=structuredClone(m);changed.report.token.generation++;assert.equal(resolveAuditDetail(pin,{...state,model:changed},q,period),null);
  const mutated=structuredClone(m);mutated.rows.find(r=>r.id===pin.id)!.actorId='other';assert.equal(resolveAuditDetail(pin,{...state,model:mutated},q,period),null);
});
test('reload preserves query/page and clamps only a now-invalid page',()=>{
  const q={...DEFAULT_AUDIT_FILTER,page:3};assert.equal(settleAuditDetailQuery(q,model()),q);
  assert.equal(settleAuditDetailQuery(q,model(12)).page,2);assert.equal(settleAuditDetailQuery(q,model(0)).page,1);
});
test('reader late response cannot overwrite new response; failed details retry same pin',async()=>{
  let calls=0;let release!:(s:ReturnType<typeof auditFixture>)=>void;
  const reader=createOperationalAuditReader({available:true,read:()=>++calls===1?new Promise(resolve=>release=resolve):Promise.resolve(auditFixture(3))},()=>asOf);
  const old=reader.load(period);await reader.load(period);release(auditFixture(25));await old;assert.equal(reader.getSnapshot().model?.rows.length,3);
  const q={...DEFAULT_AUDIT_FILTER},pin=selectAuditDetail(reader.getSnapshot().model!.rows[0].id,reader.getSnapshot(),q,period)!;
  await refreshAuditDetail(pin,reader,q,period,()=>{});assert.equal(resolveAuditDetail(pin,reader.getSnapshot(),q,period)?.id,pin.id);
});
test('read failures are not empty relationships or invented success/failure statuses',()=>{
  assert.notEqual(auditDetailReadMessage('FORBIDDEN'),auditDetailReadMessage('READ_FAILED'));
  assert.notEqual(auditDetailReadMessage('EVENT_UNAVAILABLE'),auditDetailReadMessage('READ_FAILED'));
  assert.notEqual(auditDetailReadMessage('INCOMPLETE_AUDIT_RELATIONSHIP'),auditDetailReadMessage('READ_FAILED'));
});
test('real rejection clears stale data; retry resolves the same event',async()=>{
  let reject=false;const reader=createOperationalAuditReader({available:true,async read(){if(reject)throw Object.assign(new Error('denied'),{code:'FORBIDDEN'});return auditFixture();}},()=>asOf);
  await reader.load(period);const q={...DEFAULT_AUDIT_FILTER},pin=selectAuditDetail(reader.getSnapshot().model!.rows[0].id,reader.getSnapshot(),q,period)!;
  reject=true;await refreshAuditDetail(pin,reader,q,period,()=>{});assert.equal(reader.getSnapshot().model,null);assert.equal(reader.getSnapshot().error,'FORBIDDEN');
  reject=false;await refreshAuditDetail(pin,reader,q,period,()=>{});assert.equal(resolveAuditDetail(pin,reader.getSnapshot(),q,period)?.id,pin.id);
});
test('reader refuses a successful-but-older snapshot after 10 → 12 → 11',async()=>{
  let revision=10;const reader=createOperationalAuditReader({available:true,async read(){const s=auditFixture();s.snapshotRevision=revision;s.token.revision=revision;return s;}},()=>asOf);
  await reader.load(period);revision=12;await reader.load(period);revision=11;await reader.load(period);assert.equal(reader.getSnapshot().error,'STALE_AUDIT_SNAPSHOT');assert.equal(reader.getSnapshot().model,null);
  revision=12;await reader.load(period);assert.equal(reader.getSnapshot().error,'');
});
test('off-page pin survives, epoch/scenario/revision rollback and revoked scope do not',()=>{
  const m=model(),q={...DEFAULT_AUDIT_FILTER},state={model:m,loading:false,error:''},pin=selectAuditDetail(m.rows[0].id,state,q,period)!;
  const moved=structuredClone(m);moved.rows.reverse();assert.equal(resolveAuditDetail(pin,{...state,model:moved},q,period)?.id,pin.id);
  for(const key of ['epoch','scenarioId','generation','revision'] as const){const changed=structuredClone(m);if(key==='revision')changed.report.token.revision--;else if(key==='generation')changed.report.token.generation++;else changed.report.token[key]='different';assert.equal(resolveAuditDetail(pin,{...state,model:changed},q,period),null);}
  assert.equal(resolveAuditDetail({...pin,scopeRevoked:true},state,q,period),null);
});
