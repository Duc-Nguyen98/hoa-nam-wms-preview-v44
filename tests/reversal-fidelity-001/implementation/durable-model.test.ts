import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryBusinessPersistence,type BusinessPersistence} from '../../../src/preview-mock/business-persistence';
import {createDurableReversalDesignAdapter,reversalModelScopeKey,REVERSAL_FIXTURE_NAMESPACE} from '../../../src/features/S17/approved/durable-adapter';
import {createReversalDesignAdapter,type ReversalDesignAdapter,type RecordRow} from '../../../src/features/S17/approved/adapter';
import {quantityGroups} from '../../../src/features/S17/approved/presentation';
const scope={username:'qa-fixture-user',roleLabel:'QA role',warehouseLabel:'Fixture warehouse',scenario:'test'};
const draft=(adapter:ReversalDesignAdapter)=>adapter.list().find(r=>r.id==='REV-20261028-007')!;
const start=async(persistence:BusinessPersistence,extra:Partial<Parameters<typeof createDurableReversalDesignAdapter>[0]>={})=>{const adapter=createDurableReversalDesignAdapter({scope,persistence,...extra});await adapter.initialize!();return adapter};
function storage(){const memory=createMemoryBusinessPersistence();let writes=0;const persistence:BusinessPersistence={transact(change,signal){return memory.transact(raw=>{const result=change(raw);if(Object.hasOwn(result,'write'))writes++;return result},signal)}};return{persistence,writes:()=>writes,raw:()=>memory.transact(raw=>({value:raw})),replace:(raw:unknown)=>memory.transact(()=>({value:undefined,write:raw}))};}

test('saved draft, source choice and unsaved UI payload restore in a fresh factory',async()=>{const s=storage(),a=await start(s.persistence),row=draft(a);row.reason='Sai chứng từ';row.note='Durable saved header';row.lines[0].note='Durable line note';row.lines[0].quantity=3;assert.equal(await a.save(row,a.version()),true);await a.saveUi!({sourceId:'PN-20261024-011',draft:row,draftVersion:a.version(),note:row.note});const b=await start(s.persistence);assert.deepEqual(draft(b),row);assert.deepEqual(b.readUi!(),{sourceId:'PN-20261024-011',draft:row,draftVersion:a.version(),note:row.note});assert.equal(b.version(),a.version());});

test('unknown recovers immutable operation identity/input; repeated status is a read without writes',async()=>{const s=storage(),a=await start(s.persistence,{unknownFirst:true}),row=draft(a);row.note='Original submitted input';const originalSources=a.sources();assert.deepEqual(await a.post(row,'same-key',a.version()),{kind:'unknown',key:'same-key'});const op=a.operation!(row.id)!;assert.equal(op.phase,'unknown');const b=await start(s.persistence);assert.deepEqual(b.operation!(row.id),op);const before=s.writes();const receipt=await b.status('same-key');assert.equal(receipt.kind,'confirmed');assert.deepEqual(await b.status('same-key'),receipt);assert.equal(s.writes(),before);assert.equal(b.version(),2);assert.equal(b.list().find(r=>r.id===row.id)!.status,'Đã ghi sổ');assert.deepEqual(b.operation!(row.id)!.payload,row);assert.equal(originalSources.find(r=>r.source===row.source)!.lines[0].original,b.sources().find(r=>r.source===row.source)!.lines[0].original);if(receipt.kind==='confirmed')await b.acknowledge!('same-key',receipt);const c=await start(s.persistence);assert.equal(c.operation!(row.id)!.phase,'confirmed');});

test('crash after durable intent leaves prepared operation; read/reopen never posts it',async()=>{const s=storage(),a=await start(s.persistence,{afterPrepare:async()=>{throw new Error('Simulated interruption')}}),row=draft(a);await assert.rejects(a.post(row,'interrupted',1),/interruption/);const before=await s.raw(),writes=s.writes();const b=await start(s.persistence);assert.equal(b.operation!(row.id)!.phase,'prepared');assert.deepEqual(await b.status('interrupted'),{kind:'unknown',key:'interrupted'});assert.equal(b.version(),1);assert.equal(draft(b).status,'Nháp');assert.equal(s.writes(),writes);assert.deepEqual(await s.raw(),before);assert.deepEqual(await b.post(row,'interrupted',1),{kind:'unknown',key:'interrupted'});assert.equal(b.version(),1);assert.deepEqual(await b.post(row,'replacement',1),{kind:'conflict'});});

test('two independent factories sharing transactional backing cannot confirm twice',async()=>{const s=storage(),a=await start(s.persistence),b=await start(s.persistence);const row=draft(a);const results=await Promise.all([a.post(row,'tab-a',1),b.post(row,'tab-b',1)]);assert.equal(results.filter(r=>r.kind==='confirmed').length,1);assert.equal(results.filter(r=>r.kind==='conflict').length,1);const c=await start(s.persistence);assert.equal(c.version(),2);assert.equal((await s.raw() as {operations:unknown[]}).operations.length,1);assert.equal(c.sources().find(r=>r.source===row.source)!.lines[0].prior,2);});

test('cross-instance draft save rejects stale revision and preserves first accepted value',async()=>{const s=storage(),a=await start(s.persistence),b=await start(s.persistence),r=draft(a),stale=draft(b);r.note='Accepted';stale.note='Stale';assert.equal(await a.save(r,1),true);assert.equal(await b.save(stale,1),false);const c=await start(s.persistence);assert.equal(draft(c).note,'Accepted');assert.equal(c.version(),2);});

test('same key same payload replays confirmed proof without another write; changed payload conflicts',async()=>{const s=storage(),a=await start(s.persistence),r=draft(a);const receipt=await a.post(r,'idempotent',1);const before=s.writes();const b=await start(s.persistence);assert.deepEqual(await b.post(r,'idempotent',1),receipt);assert.equal(s.writes(),before);assert.deepEqual(await b.post({...r,note:'changed'},'idempotent',1),{kind:'conflict'});assert.equal(s.writes(),before);assert.equal(b.version(),2);});

test('unknown same-key resubmit stays unknown and resource cannot use a replacement key',async()=>{const s=storage(),a=await start(s.persistence,{unknownFirst:true}),r=draft(a);await a.post(r,'original',1);const before=s.writes();const b=await start(s.persistence);assert.deepEqual(await b.post(r,'original',1),{kind:'unknown',key:'original'});assert.deepEqual(await b.post(r,'replacement',2),{kind:'conflict'});assert.equal(s.writes(),before);});

test('bad quantity or missing reason cannot reserve a durable intent or mutate the model',async()=>{for(const patch of [{reason:''},{lines:draft(createReversalDesignAdapter()).lines.map(l=>({...l,quantity:999}))}]){const s=storage(),a=await start(s.persistence),r={...draft(a),...patch},before=await s.raw();assert.equal((await a.post(r,'invalid',1)).kind,'blocked');assert.deepEqual(await s.raw(),before);}});

test('storage unavailable during initialization exposes failure and never silently seeds memory',async()=>{const denied:BusinessPersistence={async transact(){throw new Error('Storage denied')}};const a=createDurableReversalDesignAdapter({scope,persistence:denied});await assert.rejects(a.initialize!(),/denied/);assert.deepEqual(a.list(),[]);assert.deepEqual(a.sources(),[]);assert.equal(a.version(),0);await assert.rejects(a.post(draft(createReversalDesignAdapter()),'key',1),/sẵn sàng/);});

test('write denial after initialization never returns a successful save or confirmed post',async()=>{const s=storage();let denied=false;const backing:BusinessPersistence={transact(change,signal){return denied?Promise.reject(new Error('Write denied')):s.persistence.transact(change,signal)}};const a=await start(backing),r=draft(a),before=await s.raw();denied=true;await assert.rejects(a.save({...r,note:'unsaved'},1) as Promise<boolean>,/denied/);await assert.rejects(a.post(r,'denied',1),/denied/);assert.equal(a.operation!(r.id),undefined);assert.deepEqual(await s.raw(),before);});

test('malformed durable state never resets to fixture defaults',async()=>{for(const raw of [{schema:99},{schema:1,scope:reversalModelScopeKey(scope),model:{rev:1,records:[]},operations:[],ui:{}}]){const s=storage();await s.replace(raw);const a=createDurableReversalDesignAdapter({scope,persistence:s.persistence});await assert.rejects(a.initialize!(),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),raw);assert.deepEqual(a.list(),[]);}});

test('mismatched actor, role, warehouse or scenario is rejected even with injected shared backing',async()=>{for(const other of [{...scope,username:'other'},{...scope,roleLabel:'other'},{...scope,warehouseLabel:'other'},{...scope,scenario:'other'}]){const s=storage();await start(s.persistence);const before=await s.raw();await assert.rejects(start(s.persistence,{scope:other}),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),before);}});

test('scope namespace is isolated from canonical stores and scenario is bounded',()=>{assert.equal(REVERSAL_FIXTURE_NAMESPACE,'hoa-nam-wms-reversal-design-v1');assert.notEqual(reversalModelScopeKey(scope),reversalModelScopeKey({...scope,scenario:'another'}));for(const scenario of ['', '../other', 'x'.repeat(65),'a b'])assert.throws(()=>reversalModelScopeKey({...scope,scenario}),{code:'REVERSAL_SCENARIO_INVALID'});assert.doesNotThrow(()=>reversalModelScopeKey({...scope,scenario:'x'.repeat(64)}));assert.throws(()=>reversalModelScopeKey({...scope,username:''}),{code:'REVERSAL_SCOPE_REQUIRED'});});

test('tampered operation payload or proof makes future reads fail closed without a reset',async()=>{for(const tamper of [(raw:any)=>{raw.operations[0].payload.lines[0].quantity=8},(raw:any)=>{raw.operations[0].receipt.recordId='foreign'},(raw:any)=>{raw.model.receipts[0][1].fingerprint='forged'}]){const s=storage(),a=await start(s.persistence),r=draft(a);await a.post(r,'proof',1);const raw=await s.raw();tamper(raw);await s.replace(raw);const before=await s.raw();await assert.rejects(a.refresh!(),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),before);await assert.rejects(a.status('proof'),{code:'REVERSAL_MODEL_INVALID'});}});

test('receipt acknowledgement validates exact original proof, not a forged confirmation',async()=>{const s=storage(),a=await start(s.persistence,{unknownFirst:true}),r=draft(a);await a.post(r,'ack',1);const proof=await a.status('ack');assert.equal(proof.kind,'confirmed');if(proof.kind!=='confirmed')return;const before=await s.raw();await assert.rejects(a.acknowledge!('ack',{...proof,version:999}),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),before);});

test('model, operation and UI reads are defensive copies',async()=>{const s=storage(),a=await start(s.persistence,{unknownFirst:true}),r=draft(a);await a.saveUi!({draft:r,draftVersion:a.version(),sourceId:r.source});await a.post(r,'copies',1);const before=await s.raw();a.list()[0].reason='tampered';a.operation!(r.id)!.payload.lines[0].quantity=900;a.readUi!().draft!.note='tampered';assert.deepEqual(await s.raw(),before);const b=await start(s.persistence);assert.equal(b.operation!(r.id)!.payload.lines[0].quantity,2);});

test('new operation retains preparation time even if simulated request completes later',async()=>{const s=storage();let time=new Date('2026-10-29T17:00:00Z');const a=await start(s.persistence,{now:()=>time,afterPrepare:async()=>{time=new Date('2026-10-30T15:00:00Z')}});const source=a.sources().find(r=>r.source==='PN-20261024-011')!;const r:RecordRow={...source,id:'REV-DURABLE-TIME',status:'Nháp',created:'2026-10-30T00:00',reason:'Fixture time',lines:source.lines.map(l=>({...l,quantity:1}))};assert.equal(await a.save(r,1),true);const result=await a.post(r,'time',2);assert.equal(result.kind,'confirmed');if(result.kind==='confirmed')assert.equal(result.postedAt,'30/10/2026 00:00');assert.equal(a.operation!(r.id)!.preparedAt,'2026-10-29T17:00:00.000Z');});

test('each initial fixture line declares Cái; forged unit is rejected by source guard and key identity',async()=>{const a=createReversalDesignAdapter();assert.ok(a.list().every(r=>r.lines.every(l=>l.unit==='Cái')));const r=draft(a);r.lines[0].unit='kg';assert.equal(a.save(r,a.version()),false);assert.equal((await a.post(r,'unit',a.version())).kind,'conflict');const good=draft(a);await a.post(good,'unit-good',a.version());assert.equal((await a.post({...good,lines:good.lines.map(l=>({...l,unit:'kg'}))},'unit-good',1)).kind,'conflict');});

test('mixed and unknown units remain separate groups; no inferred Cái or combined total',()=>{const l=draft(createReversalDesignAdapter()).lines[0];assert.deepEqual(quantityGroups([{...l,quantity:2,unit:'Cái'},{...l,quantity:3,unit:'kg'},{...l,quantity:4,unit:undefined},{...l,quantity:1,unit:'kg'}]),[{unit:'Cái',quantity:2},{unit:'kg',quantity:4},{unit:null,quantity:4}]);assert.deepEqual(quantityGroups([{...l,original:10,prior:3,quantity:2}],line=>line.original-line.prior-line.quantity),[{unit:'Cái',quantity:5}]);});


test('R10 nonfinite model/UI/operation quantities fail closed and preserve corrupt bytes',async()=>{
 for(const value of [Infinity,-Infinity,NaN])for(const where of ['model','ui','operation']){
  const s=storage(),a=await start(s.persistence),r=draft(a);if(where==='ui')await a.saveUi!({draft:r,draftVersion:a.version()});if(where==='operation')await a.post(r,'finite-proof',1);
  const raw=await s.raw() as any;const target=where==='model'?raw.model.records.find((row:any)=>row.id===r.id):where==='ui'?raw.ui.draft:raw.operations[0].payload;target.lines[0].quantity=value;await s.replace(raw);const before=await s.raw(),writes=s.writes();
  await assert.rejects(start(s.persistence),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),before);assert.equal(s.writes(),writes);
 }
});

test('R10 forged source and immutable line identity cannot be accepted as persisted authority',async()=>{
 const changes=[(r:RecordRow)=>{r.source='FORGED-SOURCE'},(r:RecordRow)=>{r.source='PN-20261024-011'},(r:RecordRow)=>{r.lines[0].sku='FORGED'},(r:RecordRow)=>{r.lines[0].name='FORGED'},(r:RecordRow)=>{r.lines[0].original=999},(r:RecordRow)=>{r.lines[0].unit='kg'},(r:RecordRow)=>{r.created='FORGED'}];
 for(const change of changes){const s=storage();await start(s.persistence);const raw=await s.raw() as any;change(raw.model.records.find((r:RecordRow)=>r.id==='REV-20261028-007'));await s.replace(raw);const before=await s.raw();await assert.rejects(start(s.persistence),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),before);}
});

test('R10 every registered eligible source permits a legitimate new draft identity',async()=>{
 const s=storage(),a=await start(s.persistence);let index=0;
 for(const source of a.sources()){const row:RecordRow={...source,id:`arbitrary-new-draft-${index++}`,status:'Nháp',created:'2026-10-29T14:00',reason:'Fixture new draft',lines:source.lines.map(line=>({...line,quantity:1}))};assert.equal(await a.save(row,a.version()),true);}
 const b=await start(s.persistence);assert.equal(b.list().filter(row=>row.id.startsWith('arbitrary-new-draft-')).length,9);
});

test('R10 finite invalid draft inputs remain editable validation data; nonfinite writes are rejected',async()=>{
 for(const quantity of [0,-1,12,.5]){const s=storage(),a=await start(s.persistence),row=draft(a);row.lines[0].quantity=quantity;assert.equal(await a.save(row,a.version()),true);const b=await start(s.persistence);assert.equal(draft(b).lines[0].quantity,quantity);}
 for(const quantity of [Infinity,-Infinity,NaN]){const s=storage(),a=await start(s.persistence),row=draft(a),before=await s.raw();row.lines[0].quantity=quantity;assert.equal(await a.save(row,a.version()),false);assert.deepEqual(await s.raw(),before);}
});

test('R10 blank UI input has an explicit finite placeholder and matching empty-field marker',async()=>{
 const s=storage(),a=await start(s.persistence),row=draft(a);row.lines[0].quantity=0;await a.saveUi!({draft:row,draftVersion:a.version(),emptyQuantitySkus:[row.lines[0].sku]});const b=await start(s.persistence);assert.equal(b.readUi!().draft!.lines[0].quantity,0);assert.deepEqual(b.readUi!().emptyQuantitySkus,[row.lines[0].sku]);await assert.rejects(b.saveUi!({draft:row,draftVersion:a.version(),emptyQuantitySkus:['FORGED-SKU']}),{code:'REVERSAL_MODEL_INVALID'});await assert.rejects(b.saveUi!({draft:row,draftVersion:a.version(),emptyQuantitySkus:[row.lines[1].sku]}),{code:'REVERSAL_MODEL_INVALID'});
});

test('R10 orphan/duplicate receipt maps, impossible pending proof and removed seed records are corrupt',async()=>{
 for(const tamper of [(raw:any)=>raw.model.receipts.push(structuredClone(raw.model.receipts[0])),(raw:any)=>{const entry=structuredClone(raw.model.receipts[0]);entry[0]='orphan';entry[1].receipt.key='orphan';entry[1].receipt.version++;raw.model.receipts.push(entry)},(raw:any)=>raw.model.pending.push(structuredClone(raw.model.receipts[0])),(raw:any)=>raw.model.records.pop()]){const s=storage(),a=await start(s.persistence);await a.post(draft(a),'map-proof',1);const raw=await s.raw();tamper(raw);await s.replace(raw);const before=await s.raw();await assert.rejects(start(s.persistence),{code:'REVERSAL_MODEL_INVALID'});assert.deepEqual(await s.raw(),before);}
});


test('R11 stale autosave cannot replace acknowledged winner or borrow a fresh revision after reopen',async()=>{
 const s=storage(),a=await start(s.persistence),b=await start(s.persistence),winner=draft(a),stale=draft(b),base=b.version();winner.note='ACKNOWLEDGED WINNER';stale.note='REJECTED STALE INPUT';assert.equal(await a.save(winner,a.version()),true);
 await assert.rejects(b.saveUi!({draft:stale,draftVersion:base,note:stale.note,sourceId:stale.source}),{code:'REVERSAL_DRAFT_STALE'});assert.equal(await b.save(stale,base),false);
 const reopened=await start(s.persistence),stored=draft(reopened),ui=reopened.readUi!();assert.equal(stored.note,winner.note);assert.equal(ui.draft?.note,winner.note);assert.equal(ui.draftVersion,reopened.version());const restored=ui.draft?.id===stored.id?ui.draft:stored;assert.equal(await reopened.save(restored,reopened.version()),true);assert.equal(draft(reopened).note,winner.note);
});

test('R11 concurrent autosave and winning commit cannot cause stale scratch adoption',async()=>{
 for(const order of ['autosave-first','save-first']){const s=storage(),a=await start(s.persistence),b=await start(s.persistence),winner=draft(a),scratch=draft(b);winner.note='winner';scratch.note='scratch';const autosave=()=>b.saveUi!({draft:scratch,draftVersion:1,note:scratch.note});const commit=()=>a.save(winner,1);const results=await Promise.allSettled(order==='autosave-first'?[autosave(),commit()]:[commit(),autosave()]);assert.equal(results.filter(result=>result.status==='fulfilled'&&result.value===true).length,1);const reopened=await start(s.persistence);assert.equal(draft(reopened).note,'winner');assert.equal(reopened.readUi!().draft?.note,'winner');assert.equal(reopened.readUi!().draftVersion,2);}
});

test('R11 legacy/mismatched scratch base is discarded on read instead of inheriting current revision',async()=>{
 for(const draftVersion of [undefined,1]){const s=storage(),a=await start(s.persistence),winner=draft(a);winner.note='winner';await a.save(winner,1);const raw=await s.raw() as any;raw.ui={sourceId:'PN-20261024-011',draft:{...winner,note:'old scratch'},draftVersion,note:'old scratch'};await s.replace(raw);const reopened=await start(s.persistence);assert.equal(draft(reopened).note,'winner');assert.equal(reopened.readUi!().draft,undefined);assert.equal(reopened.readUi!().sourceId,'PN-20261024-011');}
});

test('R11 omitted base fails with zero writes; source-only selection still works from a stale tab',async()=>{
 const s=storage(),a=await start(s.persistence),b=await start(s.persistence),winner=draft(a);winner.note='winner';await a.save(winner,1);const before=s.writes();await assert.rejects(b.saveUi!({draft:draft(b)}),{code:'REVERSAL_DRAFT_STALE'});assert.equal(s.writes(),before);await b.saveUi!({sourceId:'PN-20261024-011'});const reopened=await start(s.persistence);assert.equal(reopened.readUi!().sourceId,'PN-20261024-011');assert.equal(reopened.readUi!().draft?.note,'winner');assert.equal(draft(reopened).note,'winner');
});

test('R11 delayed autosave identical to acknowledged save is harmless and keeps current base',async()=>{
 const s=storage(),a=await start(s.persistence),row=draft(a);row.note='acknowledged';await a.save(row,1);await a.saveUi!({draft:row,draftVersion:1,note:row.note});const reopened=await start(s.persistence);assert.equal(reopened.readUi!().draftVersion,2);assert.equal(draft(reopened).note,row.note);assert.equal(reopened.readUi!().draft?.note,row.note);
});
