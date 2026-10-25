import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter, createOperationalQaAdapter } from '../../src/data/http/operational-preview-adapter';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken, PREVIEW_MOCK_CREDENTIALS } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import type { OperationalCommand, OperationalCommandName, OperationalPayloads, OperationalSnapshot } from '../../src/contracts/operational-preview';
import { createOutboundBinding, type OutboundAdapter, type OutboundAction, type OutboundIntent } from '../../src/features/S15/outbound-binding';
import { outboundErrorMessage, outboundReadControls } from '../../src/features/S15/outbound-feedback';

async function setup() {
  const base = createMemoryBusinessPersistence(); let storageFails = false;
  const persistence: typeof base = { transact: (change, signal) => base.transact(raw => {
    const result = change(raw); if (storageFails && Object.hasOwn(result, 'write')) throw new Error('test storage'); return result;
  }, signal) };
  const client = createApiClient({ baseURL: 'https://hoa-nam-mock.invalid/api/v1' });
  const runtime = installPreviewMock(client, { approvedPreviewCommands: true, approvedAppEventFixture: true,
    businessPersistence: persistence, persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(), recoveryPersistence: createMemoryBusinessPersistence() });
  await client.post('auth/login', PREVIEW_MOCK_CREDENTIALS); await client.post('auth/confirm', {});
  const product = createCatalogCreateAdapter('product', client, { available: true }), sku = createCatalogCreateAdapter('sku', client, { available: true });
  const recipient = createCatalogCreateAdapter('recipient', client, { available: true });
  const epoch = (await product.readSnapshot()).epoch;
  const pRequest = { command: 'products.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S15-P', name: 'Product S15', group: 'Phụ kiện' as const, unit: 'Cái' as const, status: 'active' as const } };
  const p = await product.execute(pRequest); await product.recovery.acknowledge(pRequest.commandId);
  const skRequest = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S15-A', productId: p.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
  const sk = await sku.execute(skRequest); await sku.recovery.acknowledge(skRequest.commandId);
  const rRequest = { command: 'recipients.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S15-R', name: 'Nơi nhận thực', type: 'Khách lẻ' as const, market: 'Miền Nam' as const, area: 'Khu vực', address: 'Địa chỉ', contact: '', phone: '', status: 'active' as const } };
  const r = await recipient.execute(rRequest); await recipient.recovery.acknowledge(rRequest.commandId);
  const adapter = createOperationalWebAdapter(client, { available: true, scope: 'S15' }), qa = createOperationalQaAdapter(client, { available: true, scope: 'S15-test' });
  const request = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number): Promise<OperationalCommand<C>> => {
    const view = await adapter.read(); return { commandId: crypto.randomUUID(), epoch, scenarioId: view.token.scenarioId, generation: view.token.generation, command, payload, ...(entityId ? { entityId, expectedVersion } : {}) };
  };
  const reset = async () => { const command = await request('scenario.reset-own', { confirmed: true, selectedSkuIds: [sk.receipt.entityId] }); await qa.execute(command); await qa.recovery.acknowledge(command.commandId); };
  await reset();
  const run = async (target: Pick<OutboundAdapter, 'execute' | 'recovery'>, req: OperationalCommand) => { const result = await target.execute(req); await target.recovery.acknowledge(req.commandId); return result; };
  await run(adapter, await request('stock-profiles.create', { skuId: sk.receipt.entityId, tracking: 'PRODUCT_SERIAL', observedSkuVersion: 1, observedProductVersion: 1 }));
  let receipt = await run(adapter, await request('inbound.create', { mode: 'PRODUCT', sourceText: 'Nguồn S15', referenceText: '' }));
  const inboundId = receipt.receipt.entityId;
  for (let i = 1; i <= 4; i++) receipt = await run(runtime.appEventAdapters!.P04, await request('inbound.scan', { receiptId: inboundId, clientScanId: crypto.randomUUID(), skuId: sk.receipt.entityId, tracking: 'PRODUCT_SERIAL', physicalCode: `S15-A00${i}` }, inboundId, receipt.receipt.version));
  receipt = await run(runtime.appEventAdapters!.P04, await request('inbound.submit', { receiptId: inboundId }, inboundId, receipt.receipt.version));
  await run(adapter, await request('inbound.post', { receiptId: inboundId }, inboundId, receipt.receipt.version));
  const createOutbound = async () => run(runtime.appEventAdapters!.P05, await request('outbound.create', { recipientId: r.receipt.entityId, observedRecipientVersion: 1, requestedLines: [{ skuId: sk.receipt.entityId, quantity: 3, observedSkuVersion: 1, observedProductVersion: 1 }] }));
  const submitOutbound = async () => {
    let outbound = await createOutbound(); const id = outbound.receipt.entityId;
    for (let i = 1; i <= 3; i++) outbound = await run(runtime.appEventAdapters!.P05, await request('outbound.scan', { outboundId: id, clientScanId: crypto.randomUUID(), physicalCode: `S15-A00${i}` }, id, outbound.receipt.version));
    return run(runtime.appEventAdapters!.P05, await request('outbound.submit', { outboundId: id }, id, outbound.receipt.version));
  };
  const submitted = await submitOutbound();
  const makeController = (supplied: OutboundAdapter = adapter) => createOutboundBinding(supplied, () => sku.readSnapshot());
  return { client, runtime, adapter, qa, request, reset, run, makeController, submitOutbound, createOutbound, outboundId: submitted.receipt.entityId, skuId: sk.receipt.entityId, recipientId: r.receipt.entityId, persistence, failStorage: (value: boolean) => { storageFails = value; } };
}
function intent(view: OperationalSnapshot, command: OutboundAction, id = view.outbounds[0].id): OutboundIntent {
  const row = view.outbounds.find(r => r.id === id)!; return { id, code: row.data.code, version: row.version, fence: view.token, command };
}

test('S15 actual App submit -> Receive same ID/stock4 -> Post same ID/stock1 and exact FKs survive new adapter navigation', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const before = c.getSnapshot().snapshot!;
    assert.equal(before.stock[0].quantity, 4); assert.equal(before.outbounds[0].data.status, 'SUBMITTED');
    await c.act(intent(before, 'outbound.receive')); let view = c.getSnapshot().snapshot!;
    assert.equal(c.getSnapshot().error, ''); assert.equal(view.outbounds[0].id, s.outboundId); assert.equal(view.outbounds[0].data.status, 'READY');
    assert.deepEqual(view.stock, before.stock); assert.deepEqual(view.stockEvents, before.stockEvents); assert.deepEqual(view.physical, before.physical);
    await c.act(intent(view, 'outbound.post')); view = c.getSnapshot().snapshot!;
    assert.equal(c.getSnapshot().error, ''); assert.equal(view.outbounds[0].id, s.outboundId); assert.equal(view.outbounds[0].data.status, 'POSTED'); assert.equal(view.stock[0].quantity, 1);
    const row = view.outbounds[0], event = view.stockEvents.find(e => e.data.eventType === 'OUTBOUND_POST')!;
    assert.equal(row.data.recipientId, s.recipientId); assert.equal((row.data.recipientSnapshot as any).id, s.recipientId);
    assert.equal(row.data.requestedLines[0].skuId, s.skuId); assert.equal(event.data.sourceLineId, row.data.requestedLines[0].id); assert.equal(event.data.documentId, s.outboundId);
    assert.equal(event.data.signedQuantity, -3); assert.equal(event.data.skuId, s.skuId); assert.deepEqual([...event.data.physicalIds].sort(), [...row.data.allocatedPhysicalIds].sort());
    assert.equal(view.physical.filter(p => p.data.status === 'ISSUED' && p.data.issuedDocumentId === row.id).length, 3); assert.deepEqual(row.data.postedEventIds, [event.id]);
    assert.equal(c.getSnapshot().catalog!.recipients.find(r => r.id === s.recipientId)!.name, 'Nơi nhận thực');
    c.suspend(); const remounted = s.makeController(createOperationalWebAdapter(s.client, { available: true, scope: 'S15' })); await remounted.load(); assert.deepEqual(remounted.getSnapshot().snapshot, view);
    assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
  } finally { s.runtime.uninstall(); }
});

test('S15 duplicate clicks post exactly once; unsubmitted draft cannot Receive and never changes stock', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const receive = intent(c.getSnapshot().snapshot!, 'outbound.receive');
    await Promise.all([c.act(receive), c.act(receive)]); assert.equal(c.getSnapshot().acceptedSequence, 1);
    const post = intent(c.getSnapshot().snapshot!, 'outbound.post'); await Promise.all([c.act(post), c.act(post)]);
    assert.equal(c.getSnapshot().acceptedSequence, 2); assert.equal((await s.adapter.read()).stockEvents.filter(e => e.data.eventType === 'OUTBOUND_POST').length, 1);
    const draft = await s.createOutbound(); await c.load(); const before = await s.adapter.read();
    await c.act(intent(before, 'outbound.receive', draft.receipt.entityId)); assert.equal(c.getSnapshot().error, 'OUTBOUND_NOT_RECEIVABLE'); assert.deepEqual(await s.adapter.read(), before);
  } finally { s.runtime.uninstall(); }
});

test('S15 stale confirmation version and reset scope never silently rebase', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const captured = intent(c.getSnapshot().snapshot!, 'outbound.receive');
    const other = createOperationalWebAdapter(s.client, { available: true, scope: 'other' });
    await s.run(other, await s.request('outbound.receive', { outboundId: captured.id }, captured.id, captured.version)); const before = await s.adapter.read();
    await c.act(captured); assert.equal(c.getSnapshot().error, 'STALE_VERSION'); assert.deepEqual(await s.adapter.read(), before);
    await s.reset(); await c.load(); const reset = await s.adapter.read();
    await c.act(captured); assert.equal(c.getSnapshot().error, 'STALE_SCENARIO'); assert.deepEqual(await s.adapter.read(), reset);
  } finally { s.runtime.uninstall(); }
});

test('S15 Receive accepted proof remains valid when a competing tab has already posted same aggregate', async () => {
  const s = await setup(); try {
    const other = createOperationalWebAdapter(s.client, { available: true, scope: 'other' });
    const wrapped = { ...s.adapter, execute: async (request: OperationalCommand) => {
      const receipt = await s.adapter.execute(request);
      await s.run(other, await s.request('outbound.post', { outboundId: request.entityId! }, request.entityId, receipt.receipt.version)); return receipt;
    } };
    const c = s.makeController(wrapped); await c.load(); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive'));
    assert.equal(c.getSnapshot().error, ''); assert.equal(c.getSnapshot().acceptedSequence, 1); assert.equal(c.getSnapshot().snapshot!.outbounds[0].data.status, 'POSTED'); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
  } finally { s.runtime.uninstall(); }
});

test('S15 precommit storage failure leaves repository bytes/state unchanged and retries original Receive once', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const before = await s.runtime.business.readSnapshot();
    s.failStorage(true); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive')); s.failStorage(false);
    assert.deepEqual(await s.runtime.business.readSnapshot(), before); const held = await s.adapter.recovery.restore(); assert.equal(held.kind, 'pending'); assert.equal(c.getSnapshot().recovery, true);
    await c.retry(); assert.equal(c.getSnapshot().snapshot!.outbounds[0].data.status, 'READY'); assert.equal(c.getSnapshot().snapshot!.stock[0].quantity, 4);
    assert.equal(c.getSnapshot().snapshot!.auditEvents.filter(e => (e.data as any).commandId === (held as any).request.commandId).length, 1);
  } finally { s.runtime.uninstall(); }
});

test('S15 lost Post response persists original command, ordinary remount never ACKs and explicit retry never deducts twice', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive')); c.suspend();
    const wrapped = { ...s.adapter, execute: async (request: OperationalCommand) => { await s.adapter.execute(request); throw Object.assign(new Error('lost'), { code: 'NETWORK_ERROR' }); } };
    const uncertain = s.makeController(wrapped); await uncertain.load(); await uncertain.act(intent(uncertain.getSnapshot().snapshot!, 'outbound.post'));
    assert.equal(uncertain.getSnapshot().recovery, true); const held = await s.adapter.recovery.restore(); assert.equal(held.kind, 'committed'); uncertain.suspend();
    const reopened = s.makeController(); await reopened.load(); assert.equal(reopened.getSnapshot().acceptedSequence, 0); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    await reopened.retry(); const view = reopened.getSnapshot().snapshot!; assert.equal(view.stock[0].quantity, 1); assert.equal(view.stockEvents.filter(e => e.data.eventType === 'OUTBOUND_POST').length, 1);
    assert.equal(reopened.getSnapshot().acceptedLocal, false); assert.equal(view.auditEvents.filter(e => (e.data as any).commandId === (held as any).request.commandId).length, 1);
  } finally { s.runtime.uninstall(); }
});

test('S15 read-after-commit failure retains durable receipt; navigation during dispatch cannot publish success', async () => {
  const s = await setup(); try {
    let failRead = false;
    const wrapped = { ...s.adapter, execute: async (request: OperationalCommand) => { const receipt = await s.adapter.execute(request); failRead = true; return receipt; }, read: () => failRead ? Promise.reject(new Error('failed read')) : s.adapter.read() };
    const c = s.makeController(wrapped); await c.load(); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive'));
    assert.equal(c.getSnapshot().recovery, true); assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    failRead = false; await c.retry(); assert.equal(c.getSnapshot().snapshot!.outbounds[0].data.status, 'READY');
    let release!: () => void, entered!: () => void;
    const hold = new Promise<void>(r => { release = r; }), started = new Promise<void>(r => { entered = r; });
    const delayed = { ...s.adapter, execute: async (request: OperationalCommand) => { const receipt = await s.adapter.execute(request); entered(); await hold; return receipt; } };
    const d = s.makeController(delayed); await d.load(); const posting = d.act(intent(d.getSnapshot().snapshot!, 'outbound.post'));
    await started; d.suspend(); release(); await posting; assert.equal(d.getSnapshot().acceptedSequence, 0); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    const reopened = s.makeController(); await reopened.load(); await reopened.retry(); assert.equal(reopened.getSnapshot().snapshot!.stock[0].quantity, 1);
  } finally { s.runtime.uninstall(); }
});

test('S15 expired session cannot Receive under prior authority and clears canonical screen data', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const captured = intent(c.getSnapshot().snapshot!, 'outbound.receive'); await s.client.post('auth/logout', {}); await c.act(captured);
    assert.equal(c.getSnapshot().snapshot, null); assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal(c.getSnapshot().recovery, true);
  } finally { s.runtime.uninstall(); }
});

test('S15 explicit archived Receive reconciles immutable proof without selecting archived row or current-success credit', async () => {
  const s = await setup(); try {
    const before = await s.adapter.read(), request = await s.request('outbound.receive', { outboundId: s.outboundId }, s.outboundId, before.outbounds[0].version);
    await s.adapter.execute(request); await s.reset(); const current = await s.adapter.read();
    const c = s.makeController(); await c.load(); assert.equal(c.getSnapshot().recovery, true); assert.equal(c.getSnapshot().acceptedSequence, 0);
    await c.retry(); assert.equal(c.getSnapshot().archivedReconciled, true); assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal(c.getSnapshot().acceptedId, null); assert.deepEqual(c.getSnapshot().snapshot, current); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
  } finally { s.runtime.uninstall(); }
});

test('S15 missing or tampered archived proof retains original command and active cohort unchanged', async () => {
  for (const mode of ['missing', 'tampered'] as const) {
    const s = await setup(); try {
      const before = await s.adapter.read(), request = await s.request('outbound.receive', { outboundId: s.outboundId }, s.outboundId, before.outbounds[0].version);
      const receipt = await s.adapter.execute(request); await s.reset(); const current = await s.adapter.read();
      const wrapped = { ...s.adapter, read: async () => { const view = await s.adapter.read();
        if (mode === 'missing') view.archivedCommitSnapshots = []; else (view.archivedCommitSnapshots.find(p => p.id === receipt.receipt.commitSnapshotId)!.data as any).changes[0].canonicalRecord = '{}'; return view;
      } };
      const c = s.makeController(wrapped); await c.load(); await c.retry(); assert.equal(c.getSnapshot().error, 'ARCHIVED_PROOF_UNAVAILABLE'); assert.equal(c.getSnapshot().recovery, true); assert.equal(c.getSnapshot().acceptedSequence, 0); assert.deepEqual(c.getSnapshot().snapshot!.outbounds, current.outbounds);
      const held = await s.adapter.recovery.restore(); assert.equal(held.kind, 'committed'); assert.equal((held as any).request.commandId, request.commandId); assert.deepEqual(await s.adapter.read(), current);
    } finally { s.runtime.uninstall(); }
  }
});

test('S15 reset racing a direct Receive response requires explicit archived reconciliation; focus load does not ACK', async () => {
  const s = await setup(); try {
    const wrapped = { ...s.adapter, execute: async (request: OperationalCommand) => { const receipt = await s.adapter.execute(request); await s.reset(); return receipt; } };
    const c = s.makeController(wrapped); await c.load(); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive'));
    assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal(c.getSnapshot().archivedReconciled, false); assert.equal(c.getSnapshot().recovery, true); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    await c.load(); assert.equal(c.getSnapshot().archivedReconciled, false); assert.equal(c.getSnapshot().acceptedSequence, 0);
    await c.retry(); assert.equal(c.getSnapshot().archivedReconciled, true); assert.equal(c.getSnapshot().snapshot!.outbounds.length, 0);
  } finally { s.runtime.uninstall(); }
});

test('S15 competing outbounds cannot post the same physical allocation twice', async () => {
  const s = await setup(); try {
    const second = await s.submitOutbound(), c = s.makeController(); await c.load();
    await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive', s.outboundId));
    await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive', second.receipt.entityId));
    const otherAdapter = createOperationalWebAdapter(s.client, { available: true, scope: 'competing' }), other = s.makeController(otherAdapter); await other.load();
    const firstPost = intent(c.getSnapshot().snapshot!, 'outbound.post', s.outboundId), secondPost = intent(other.getSnapshot().snapshot!, 'outbound.post', second.receipt.entityId);
    await Promise.all([c.act(firstPost), other.act(secondPost)]);
    const after = await s.adapter.read(); assert.equal(after.stock[0].quantity, 1); assert.equal(after.outbounds.filter(r => r.data.status === 'POSTED').length, 1);
    assert.equal(after.stockEvents.filter(e => e.data.eventType === 'OUTBOUND_POST').length, 1);
    assert.equal(c.getSnapshot().acceptedSequence + other.getSnapshot().acceptedSequence, 3);
    const loser = c.getSnapshot().error || other.getSnapshot().error; assert.ok(['PHYSICAL_UNAVAILABLE', 'SUBMISSION_CHANGED', 'INSUFFICIENT_STOCK'].includes(loser), loser);
  } finally { s.runtime.uninstall(); }
});

test('S15 reads canonical operations after catalog so a concurrent reset cannot publish the old cohort', async () => {
  const s = await setup(); try {
    const before = await s.adapter.read(), catalog = createCatalogCreateAdapter('sku', s.client, { available: true }); let once = true;
    const c = createOutboundBinding(s.adapter, async () => { const value = await catalog.readSnapshot(); if (once) { once = false; await s.reset(); } return value; });
    await c.load(); assert.equal(c.getSnapshot().snapshot!.token.generation, before.token.generation + 1); assert.equal(c.getSnapshot().snapshot!.outbounds.length, 0);
  } finally { s.runtime.uninstall(); }
});

test('S15 tampered active Post ledger read does not acknowledge accepted command until canonical proof returns', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive')); c.suspend();
    let tamper = true;
    const wrapped = { ...s.adapter, read: async () => { const view = await s.adapter.read(); const event = view.stockEvents.find(e => e.data.eventType === 'OUTBOUND_POST'); if (tamper && event) event.data.signedQuantity = -2; return view; } };
    const d = s.makeController(wrapped); await d.load(); await d.act(intent(d.getSnapshot().snapshot!, 'outbound.post'));
    assert.equal(d.getSnapshot().recovery, true); assert.equal(d.getSnapshot().acceptedSequence, 0); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    tamper = false; await d.retry(); assert.equal(d.getSnapshot().acceptedSequence, 1); assert.equal(d.getSnapshot().snapshot!.stock[0].quantity, 1);
  } finally { s.runtime.uninstall(); }
});

async function rejectStaleReceive(s: Awaited<ReturnType<typeof setup>>, c: ReturnType<typeof createOutboundBinding>) {
  await c.load();
  const captured = intent(c.getSnapshot().snapshot!, 'outbound.receive');
  const other = createOperationalWebAdapter(s.client, { available: true, scope: 'feedback-other' });
  await s.run(other, await s.request('outbound.receive', { outboundId: captured.id }, captured.id, captured.version));
  await c.act(captured);
  assert.equal(c.getSnapshot().error, 'STALE_VERSION');
  return captured;
}

test('S15 rejected Post feedback survives focus refresh while reading and after the same scope succeeds', async () => {
  const s = await setup(); try {
    let held = false, release!: () => void, entered!: () => void;
    const hold = new Promise<void>(r => { release = r; }), started = new Promise<void>(r => { entered = r; });
    const wrapped = { ...s.adapter, read: async () => { if (held) { entered(); await hold; } return s.adapter.read(); } };
    const c = s.makeController(wrapped), second = await s.submitOutbound(); await c.load();
    await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive', s.outboundId));
    await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive', second.receipt.entityId));
    const other = createOperationalWebAdapter(s.client, { available: true, scope: 'feedback-post-other' });
    const ready = await other.read(), first = ready.outbounds.find(r => r.id === s.outboundId)!;
    await s.run(other, await s.request('outbound.post', { outboundId: first.id }, first.id, first.version));
    await c.act(intent(c.getSnapshot().snapshot!, 'outbound.post', second.receipt.entityId));
    assert.equal(c.getSnapshot().error, 'PHYSICAL_UNAVAILABLE');
    const before = await s.runtime.business.readSnapshot(); held = true;
    const refresh = c.refresh(); await started;
    assert.equal(c.getSnapshot().busy, true); assert.equal(c.getSnapshot().error, 'PHYSICAL_UNAVAILABLE');
    release(); await refresh; held = false;
    assert.equal(c.getSnapshot().busy, false); assert.equal(c.getSnapshot().error, 'PHYSICAL_UNAVAILABLE');
    await c.refresh(); assert.equal(c.getSnapshot().error, 'PHYSICAL_UNAVAILABLE');
    assert.deepEqual(await s.runtime.business.readSnapshot(), before);
    assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
  } finally { s.runtime.uninstall(); }
});

test('S15 explicit Read and a new successful action dismiss rejected feedback without later resurrection', async () => {
  const s = await setup(); try {
    const c = s.makeController(), captured = await rejectStaleReceive(s, c);
    await c.refresh(); assert.equal(c.getSnapshot().error, 'STALE_VERSION');
    await c.load(); assert.equal(c.getSnapshot().error, '');
    await c.refresh(); assert.equal(c.getSnapshot().error, '');
    await c.act(captured); assert.equal(c.getSnapshot().error, 'STALE_VERSION');
    await c.act(intent(c.getSnapshot().snapshot!, 'outbound.post'));
    assert.equal(c.getSnapshot().error, ''); assert.equal(c.getSnapshot().snapshot!.outbounds[0].data.status, 'POSTED');
    await c.refresh(); assert.equal(c.getSnapshot().error, '');
  } finally { s.runtime.uninstall(); }
});

test('S15 background refresh drops old feedback when reset changes the scenario and generation', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await rejectStaleReceive(s, c);
    const old = c.getSnapshot().snapshot!.token; await s.reset(); await c.refresh();
    assert.equal(c.getSnapshot().error, ''); assert.notEqual(c.getSnapshot().snapshot!.token.scenarioId, old.scenarioId);
    assert.equal(c.getSnapshot().snapshot!.token.generation, old.generation + 1);
    assert.equal(c.getSnapshot().snapshot!.outbounds.length, 0);
  } finally { s.runtime.uninstall(); }
});

test('S15 feedback cannot cross a successfully read actor or epoch change', async () => {
  for (const changed of ['actor', 'epoch'] as const) {
    const s = await setup(); try {
      let switchScope = false;
      const catalog = createCatalogCreateAdapter('sku', s.client, { available: true });
      const wrapped = { ...s.adapter, read: async () => {
        const view = await s.adapter.read();
        if (switchScope && changed === 'actor') view.actorKey = 'preview:other';
        if (switchScope && changed === 'epoch') { view.epoch = 'next-epoch'; view.token.epoch = 'next-epoch'; }
        return view;
      } };
      const c = createOutboundBinding(wrapped, async () => {
        const value = await catalog.readSnapshot();
        // Adversarial provider boundary only; production keeps its fixed Preview actor type.
        if (switchScope && changed === 'actor') value.actorKey = 'preview:other' as typeof value.actorKey;
        if (switchScope && changed === 'epoch') value.epoch = 'next-epoch';
        return value;
      });
      await rejectStaleReceive(s, c); switchScope = true; await c.refresh();
      assert.equal(c.getSnapshot().error, '');
      switchScope = false; await c.refresh(); assert.equal(c.getSnapshot().error, '');
    } finally { s.runtime.uninstall(); }
  }
});

test('S15 catalog/read/auth/recovery failures replace retained feedback and never resurrect it', async () => {
  for (const failure of ['catalog', 'read', 'auth', 'recovery'] as const) {
    const s = await setup(); try {
      let failRead = false;
      const code = failure === 'auth' ? 'SESSION_EXPIRED' : failure === 'recovery' ? 'RECOVERY_UNAVAILABLE' : 'READ_FAILED';
      const reject = () => Promise.reject(Object.assign(new Error(code), { code }));
      const catalog = createCatalogCreateAdapter('sku', s.client, { available: true });
      const wrapped = { ...s.adapter,
        read: () => failRead && ['read', 'auth'].includes(failure) ? reject() : s.adapter.read(),
        recovery: { ...s.adapter.recovery, restore: () => failRead && failure === 'recovery' ? Promise.resolve({ kind: 'blocked' as const, code }) : s.adapter.recovery.restore() },
      };
      const c = createOutboundBinding(wrapped, () => failRead && failure === 'catalog' ? reject() : catalog.readSnapshot());
      await rejectStaleReceive(s, c); failRead = true; await c.refresh();
      assert.equal(c.getSnapshot().error, code); assert.equal(c.getSnapshot().snapshot, null);
      failRead = false; await c.refresh(); assert.equal(c.getSnapshot().error, '');
    } finally { s.runtime.uninstall(); }
  }
});

test('S15 background refresh shows pending/committed recovery instead of old feedback without retry or ACK', async () => {
  for (const kind of ['pending', 'committed'] as const) {
    const s = await setup(); try {
      let retries = 0, acknowledgements = 0;
      const wrapped = { ...s.adapter, recovery: { ...s.adapter.recovery,
        retry: async () => { retries++; return s.adapter.recovery.retry(); },
        acknowledge: async (commandId: string) => { acknowledgements++; return s.adapter.recovery.acknowledge(commandId); },
      } };
      const c = s.makeController(wrapped); await rejectStaleReceive(s, c);
      const ready = await s.adapter.read(), row = ready.outbounds[0];
      const request = await s.request('outbound.post', { outboundId: row.id }, row.id, row.version);
      if (kind === 'pending') { s.failStorage(true); await assert.rejects(s.adapter.execute(request)); s.failStorage(false); }
      else await s.adapter.execute(request);
      const before = await s.runtime.business.readSnapshot();
      await c.refresh(); assert.equal(c.getSnapshot().error, 'OUTCOME_UNKNOWN'); assert.equal(c.getSnapshot().recovery, true);
      assert.equal(c.getSnapshot().pendingRequest!.commandId, request.commandId);
      assert.equal((await s.adapter.recovery.restore()).kind, kind);
      assert.equal(retries, 0); assert.equal(acknowledgements, 0);
      assert.deepEqual(await s.runtime.business.readSnapshot(), before);
    } finally { s.runtime.uninstall(); }
  }
});

for (const phase of ['blocked-restore', 'throwing-restore', 'catalog', 'operational'] as const) {
  test(`S15 initial ${phase} failure offers read-only refresh and recovers on the same controller`, async () => {
    const s = await setup(); try {
      let failing = true, retries = 0, acknowledgements = 0, executions = 0;
      const code = phase.includes('restore') ? 'RECOVERY_CONTEXT_UNAVAILABLE' : 'READ_FAILED';
      const reject = async () => { throw Object.assign(new Error(code), { code }); };
      const catalog = createCatalogCreateAdapter('sku', s.client, { available: true });
      const adapter = { ...s.adapter,
        read: () => failing && phase === 'operational' ? reject() : s.adapter.read(),
        execute: async (request: OperationalCommand) => { executions++; return s.adapter.execute(request); },
        recovery: { ...s.adapter.recovery,
          restore: () => failing && phase === 'blocked-restore' ? Promise.resolve({ kind: 'blocked' as const, code })
            : failing && phase === 'throwing-restore' ? reject() : s.adapter.recovery.restore(),
          retry: async () => { retries++; return s.adapter.recovery.retry(); },
          acknowledge: async (id: string) => { acknowledgements++; return s.adapter.recovery.acknowledge(id); },
        },
      };
      const c = createOutboundBinding(adapter, () => failing && phase === 'catalog' ? reject() : catalog.readSnapshot());
      const before = await s.runtime.business.readSnapshot();
      await c.resume();
      const failed = c.getSnapshot();
      assert.equal(failed.error, code); assert.equal(failed.pendingRequest, null); assert.equal(failed.snapshot, null); assert.equal(failed.busy, false);
      assert.equal(failed.failureStage, phase.includes('restore') ? 'recovery-read' : phase === 'catalog' ? 'catalog-read' : 'operational-read');
      assert.equal(outboundErrorMessage(failed), 'Chưa đọc được dữ liệu. Chọn Đọc lại dữ liệu để thử lại.');
      assert.deepEqual(outboundReadControls(failed), { readDisabled: false, showReconcile: false });
      failing = false; await c.load();
      assert.equal(c.getSnapshot().error, ''); assert.equal(c.getSnapshot().failureStage, null); assert.equal(c.getSnapshot().recovery, false);
      assert.ok(c.getSnapshot().snapshot?.outbounds.some(r => r.id === s.outboundId));
      assert.deepEqual(await s.runtime.business.readSnapshot(), before);
      assert.deepEqual({ retries, acknowledgements, executions }, { retries: 0, acknowledgements: 0, executions: 0 });
    } finally { s.runtime.uninstall(); }
  });
}

for (const kind of ['pending', 'committed'] as const) {
  test(`S15 ${kind} request survives a blocked journal read and is never presented as ordinary refresh`, async () => {
    const s = await setup(); try {
      let blocked = false, retries = 0, acknowledgements = 0;
      const request = await s.request('outbound.receive', { outboundId: s.outboundId }, s.outboundId, 5);
      if (kind === 'pending') { s.failStorage(true); await assert.rejects(s.adapter.execute(request)); s.failStorage(false); }
      else await s.adapter.execute(request);
      const adapter = { ...s.adapter, recovery: { ...s.adapter.recovery,
        restore: () => blocked ? Promise.resolve({ kind: 'blocked' as const, code: 'RECOVERY_CONTEXT_UNAVAILABLE' }) : s.adapter.recovery.restore(),
        retry: async () => { retries++; return s.adapter.recovery.retry(); },
        acknowledge: async (id: string) => { acknowledgements++; return s.adapter.recovery.acknowledge(id); },
      } };
      const c = s.makeController(adapter), before = await s.runtime.business.readSnapshot();
      await c.load(); assert.equal(c.getSnapshot().pendingRequest?.commandId, request.commandId);
      blocked = true; await c.refresh();
      assert.equal(c.getSnapshot().pendingRequest?.commandId, request.commandId);
      assert.equal(c.getSnapshot().snapshot, null); assert.equal(c.getSnapshot().recovery, true);
      assert.equal(outboundErrorMessage(c.getSnapshot()), 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.');
      assert.deepEqual(outboundReadControls(c.getSnapshot()), { readDisabled: true, showReconcile: true });
      assert.deepEqual(await s.runtime.business.readSnapshot(), before);
      assert.equal(retries, 0); assert.equal(acknowledgements, 0);
    } finally { s.runtime.uninstall(); }
  });
}

test('S15 keeps the exact sent request when commit verification and journal reading both fail', async () => {
  const s = await setup(); try {
    let afterSend = false, sent: OperationalCommand | null = null;
    const catalog = createCatalogCreateAdapter('sku', s.client, { available: true });
    const adapter = { ...s.adapter,
      execute: async (request: OperationalCommand) => { sent = request; const outcome = await s.adapter.execute(request); afterSend = true; return outcome; },
      recovery: { ...s.adapter.recovery, restore: () => afterSend ? Promise.resolve({ kind: 'blocked' as const, code: 'RECOVERY_CONTEXT_UNAVAILABLE' }) : s.adapter.recovery.restore() },
    };
    const c = createOutboundBinding(adapter, async () => { if (afterSend) throw Object.assign(new Error('READ_FAILED'), { code: 'READ_FAILED' }); return catalog.readSnapshot(); });
    await c.load(); await c.act(intent(c.getSnapshot().snapshot!, 'outbound.receive'));
    assert.ok(sent); assert.deepEqual(c.getSnapshot().pendingRequest, sent);
    assert.equal(c.getSnapshot().failureStage, 'catalog-read'); assert.equal(c.getSnapshot().acceptedSequence, 0);
    assert.equal(outboundErrorMessage(c.getSnapshot()), 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.');
    assert.deepEqual(outboundReadControls(c.getSnapshot()), { readDisabled: true, showReconcile: true });
    assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    const committed = await s.runtime.business.readSnapshot();
    afterSend = false; await c.retry();
    assert.equal(c.getSnapshot().acceptedSequence, 1); assert.equal(c.getSnapshot().pendingRequest, null); assert.equal(c.getSnapshot().failureStage, null);
    assert.deepEqual(await s.runtime.business.readSnapshot(), committed);
  } finally { s.runtime.uninstall(); }
});
