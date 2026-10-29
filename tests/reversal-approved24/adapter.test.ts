import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReversalDesignAdapter, reversalImpact } from '../../src/features/S17/approved/adapter';

test('availability excludes drafts/cancellations and returned copies cannot mutate sources',()=>{
 const a=createReversalDesignAdapter();const s=a.sources();const draft=s.find(r=>r.source==='PN-20261022-007')!;assert.equal(draft.lines.reduce((n,l)=>n+l.original-l.prior,0),20);const posted=s.find(r=>r.source==='PN-20261020-001')!;assert.equal(posted.lines.reduce((n,l)=>n+l.prior,0),45);draft.lines[0].original=0;assert.equal(a.sources().find(r=>r.source===draft.source)!.lines[0].original,10);
});
test('unknown remains unknown on resubmit; same key query resolves and collision conflicts',async()=>{
 const a=createReversalDesignAdapter({unknownFirst:true});const r=a.list().find(x=>x.id.endsWith('-007'))!;const v=a.version();assert.equal((await a.post(r,'request-1',v)).kind,'unknown');assert.equal((await a.post(r,'request-1',v)).kind,'unknown');const changed=structuredClone(r);changed.lines[0].quantity=3;assert.equal((await a.post(changed,'request-1',v)).kind,'conflict');assert.equal((await a.status('other')).kind,'unknown');const receipt=await a.status('request-1');assert.equal(receipt.kind,'confirmed');assert.deepEqual(await a.post(r,'request-1',v),receipt);assert.equal((await a.post(changed,'request-1',v)).kind,'conflict');assert.equal((await a.post(r,'different-key',v)).kind,'conflict');
});
test('draft save fences stale writes and cannot spoof source or posted state',async()=>{
 const a=createReversalDesignAdapter();const draft=a.list().find(x=>x.id.endsWith('-007'))!;const stale=a.version();const altered=structuredClone(draft);altered.reason='Sai chứng từ';assert.equal(a.save(altered,stale),true);assert.equal(a.version(),stale+1);assert.equal(a.save(draft,stale),false);assert.equal((await a.post(draft,'stale',stale)).kind,'conflict');const fake=structuredClone(draft);fake.id='REV-FAKE';fake.status='Đã ghi sổ';assert.equal(a.save(fake,a.version()),false);fake.status='Nháp';fake.source='PN-FAKE';assert.equal(a.save(fake,a.version()),false);const posted=a.list().find(x=>x.id.endsWith('-009'))!;posted.status='Nháp';assert.equal(a.save(posted,a.version()),false);
});
test('duplicate SKU, dependency guard, invalid amount and outbound cannot post',async()=>{
 const a=createReversalDesignAdapter();const blocked=a.list().find(x=>x.id.endsWith('-002'))!;assert.equal((await a.post(blocked,'blocked',a.version())).kind,'blocked');const r=a.list().find(x=>x.id.endsWith('-007'))!;const duplicate=structuredClone(r);duplicate.lines[1]=structuredClone(duplicate.lines[0]);assert.equal((await a.post(duplicate,'duplicate',a.version())).kind,'conflict');r.lines[0].quantity=12;assert.equal((await a.post(r,'invalid',a.version())).kind,'blocked');const outbound=a.list().find(x=>x.type==='Đảo xuất')!;outbound.status='Nháp';assert.equal((await a.post(outbound,'outbound',a.version())).kind,'blocked');assert.equal(a.list().find(x=>x.id===r.id)!.status,'Nháp');
});
test('impact uses record quantities and reverses outbound direction',()=>{
 const a=createReversalDesignAdapter();const inbound=a.list().find(x=>x.id.endsWith('-009'))!;assert.deepEqual(reversalImpact(inbound),{original:90,change:-45,net:45,projected:-45});const outbound=a.list().find(x=>x.id.endsWith('-006'))!;assert.deepEqual(reversalImpact(outbound),{original:-10,change:1,net:-9,projected:1});const pending=a.list().find(x=>x.id.endsWith('-008'))!;assert.equal(reversalImpact(pending).change,0);
});
