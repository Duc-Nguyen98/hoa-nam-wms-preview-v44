import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter, createOperationalQaAdapter } from '../../src/data/http/operational-preview-adapter';
import { createDefectsCommandHttpAdapter } from '../../src/features/S02/defects-command-http';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken, PREVIEW_MOCK_CREDENTIALS } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import { canonicalBusinessJson } from '../../src/preview-mock/business-repository';
import type { OperationalCommand, OperationalCommandName, OperationalPayloads, OperationalSnapshot } from '../../src/contracts/operational-preview';
import { adoptReviewedReversal, createReversalBinding, EVIDENCE_MAX_BYTES, reversalIssueOptions, type ReversalWebAdapter, type ReversalTarget, type ReversalCreateDraft } from '../../src/features/S17/reversal-binding';

const evidence = () => new File([new TextEncoder().encode('Physical unused return inspected: đủ hàng')], 'return-proof.txt', { type: 'text/plain' });
async function setup(tracking: 'COMPONENT_BOX' | 'PRODUCT_SERIAL' = 'COMPONENT_BOX') {
  const base = createMemoryBusinessPersistence(); let failStorage = false;
  const persistence: typeof base = { transact: (change, signal) => base.transact(raw => { const result = change(raw); if (failStorage && Object.hasOwn(result, 'write')) throw new Error('storage'); return result; }, signal) };
  const client = createApiClient({ baseURL: 'https://hoa-nam-mock.invalid/api/v1' });
  const runtime = installPreviewMock(client, { approvedPreviewCommands: true, approvedAppEventFixture: true, businessPersistence: persistence, persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(), recoveryPersistence: createMemoryBusinessPersistence() });
  await client.post('auth/login', PREVIEW_MOCK_CREDENTIALS); await client.post('auth/confirm', {});
  const products = createCatalogCreateAdapter('product', client, { available: true }), skus = createCatalogCreateAdapter('sku', client, { available: true });
  const epoch = (await products.readSnapshot()).epoch;
  const pr = { command: 'products.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S17-P', name: 'Parts S17', group: 'Phụ kiện' as const, unit: 'Cái' as const, status: 'active' as const } };
  const p = await products.execute(pr); await products.recovery.acknowledge(pr.commandId);
  const sr = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S17-B', productId: p.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
  const sku = await skus.execute(sr); await skus.recovery.acknowledge(sr.commandId);
  const adapter = createOperationalWebAdapter(client, { available: true, scope: 'S17' }), other = createOperationalWebAdapter(client, { available: true, scope: 'setup' }), qa = createOperationalQaAdapter(client, { available: true, scope: 'S17-test' });
  const request = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number): Promise<OperationalCommand<C>> => {
    const view = await adapter.read(); return { commandId: crypto.randomUUID(), epoch, scenarioId: view.token.scenarioId, generation: view.token.generation, command, payload, ...(entityId ? { entityId, expectedVersion } : {}) };
  };
  const run = async (target: Pick<ReversalWebAdapter, 'execute' | 'recovery'>, req: OperationalCommand) => { const result = await target.execute(req); await target.recovery.acknowledge(req.commandId); return result; };
  const reset = async () => run(qa, await request('scenario.reset-own', { confirmed: true, selectedSkuIds: [sku.receipt.entityId] })); await reset();
  await run(other, await request('stock-profiles.create', { skuId: sku.receipt.entityId, tracking, observedSkuVersion: 1, observedProductVersion: 1 }));
  let inbound = await run(other, await request('inbound.create', { mode: tracking === 'COMPONENT_BOX' ? 'COMPONENT' : 'PRODUCT', sourceText: 'S17 actual source', referenceText: '' }));
  const receiptId = inbound.receipt.entityId;
  inbound = await run(runtime.appEventAdapters!.P04, await request('inbound.scan', { receiptId, clientScanId: crypto.randomUUID(), skuId: sku.receipt.entityId, tracking, physicalCode: 'S17-ITEM', ...(tracking === 'COMPONENT_BOX' ? { quantity: 10 } : {}) }, receiptId, inbound.receipt.version));
  inbound = await run(runtime.appEventAdapters!.P04, await request('inbound.submit', { receiptId }, receiptId, inbound.receipt.version)); await run(other, await request('inbound.post', { receiptId }, receiptId, inbound.receipt.version));
  const defect = await createDefectsCommandHttpAdapter(client).execute({ command: 'defects.create', commandId: crypto.randomUUID(), epoch, payload: { code: 'S17-D', name: 'Lỗi kiểm tra', description: 'Kiểm tra sửa chữa', status: 'active' } });
  const intake = await run(runtime.appEventAdapters!.P09, await request('warranty.intake', { identityMode: 'TEMP_ONLY', skuId: sku.receipt.entityId, physicalId: null, customerReportedIssue: 'Hỏng linh kiện' }));
  const caseId = intake.receipt.entityId, date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const diagnosis = await run(other, await request('warranty.diagnose', { defectIds: [defect.receipt.entityId], technicianDiagnosis: 'Thay linh kiện', expectedFinishDate: date }, caseId, intake.receipt.version));
  await run(other, await request('warranty.transition', { state: 'REPAIRING' }, caseId, diagnosis.receipt.version));
  async function issue(quantity = 2) {
    let view = await adapter.read(), cas = view.warrantyCases.find(c => c.id === caseId)!;
    let issued = await run(runtime.appEventAdapters!.P19, await request('parts.create', { caseId, observedCaseVersion: cas.version }));
    view = await adapter.read(); const physical = [...view.boxes, ...view.physical].find(p => p.data.physicalCode === 'S17-ITEM')!;
    issued = await run(runtime.appEventAdapters!.P19, await request('parts.save', { lines: [{ physicalCode: physical.data.physicalCode, observedVersion: physical.version, ...(tracking === 'COMPONENT_BOX' ? { quantity } : {}) }] }, issued.receipt.entityId, issued.receipt.version));
    return run(runtime.appEventAdapters!.P19, await request('parts.post', { issueId: issued.receipt.entityId }, issued.receipt.entityId, issued.receipt.version));
  }
  const posted = await issue();
  const makeController = (supplied: ReversalWebAdapter = adapter) => createReversalBinding(supplied, () => skus.readSnapshot());
  return { client, runtime, adapter, other, request, run, reset, issue, makeController, issueId: posted.receipt.entityId, skuId: sku.receipt.entityId, caseId, persistence, setStorageFailure: (value: boolean) => { failStorage = value; } };
}
function draft(view: OperationalSnapshot, id = view.partsIssues[0].id): ReversalCreateDraft { const issue = view.partsIssues.find(i => i.id === id)!; return { originalIssueId: id, observedIssueVersion: issue.version, returnedUnused: true, reasonText: 'Hoàn toàn bộ hàng chưa sử dụng', fence: view.token }; }
function target(view: OperationalSnapshot, id = view.reversals[0].id): ReversalTarget { return { id, version: view.reversals.find(r => r.id === id)!.version, fence: view.token }; }
async function confirmed(c: ReturnType<typeof createReversalBinding>, id?: string) {
  await c.create(draft(c.getSnapshot().snapshot!, id)); assert.equal(c.getSnapshot().error, '');
  const reversalId = c.getSnapshot().acceptedId!; await c.attach(target(c.getSnapshot().snapshot!, reversalId), evidence(), 'Biên bản nhận lại'); assert.equal(c.getSnapshot().error, '');
  await c.confirmReturn(target(c.getSnapshot().snapshot!, reversalId)); assert.equal(c.getSnapshot().error, ''); return reversalId;
}
const originals = (view: OperationalSnapshot, id: string) => canonicalBusinessJson({ issue: view.partsIssues.find(i => i.id === id), events: view.stockEvents.filter(e => e.data.documentId === id) });

test('S17 actual BOX10 -> P19 issue2 -> create/file bytes/confirm stock8 -> Post10, immutable original/FKs/reload', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const before = c.getSnapshot().snapshot!, immutable = originals(before, s.issueId), stockEvents = before.stockEvents;
    assert.equal(before.stock[0].quantity, 8); assert.equal(before.warrantyCases[0].data.state, 'REPAIRING');
    await c.create(draft(before)); let view = c.getSnapshot().snapshot!; assert.equal(c.getSnapshot().error, ''); const id = c.getSnapshot().acceptedId!;
    assert.equal(view.stock[0].quantity, 8); assert.equal(view.reversals[0].data.originalIssueId, s.issueId); assert.equal(view.reversals[0].data.physicalReturn, 'PENDING');
    const file = evidence(); await c.attach(target(view, id), file, 'Biên bản thực'); view = c.getSnapshot().snapshot!;
    const stored = view.evidence[0].data as any, expected = Buffer.from(await file.arrayBuffer());
    assert.deepEqual(stored.bytes, [...expected]); assert.equal(stored.byteLength, file.size); assert.equal(stored.sha256, createHash('sha256').update(expected).digest('hex')); assert.equal(stored.attachmentRef, view.evidence[0].id); assert.equal(stored.reversalId, id); assert.equal(view.stock[0].quantity, 8);
    await c.confirmReturn(target(view, id)); view = c.getSnapshot().snapshot!; assert.equal(view.reversals[0].data.physicalReturn, 'CONFIRMED'); assert.deepEqual(view.stockEvents, stockEvents); assert.equal(view.stock[0].quantity, 8);
    await c.post(target(view, id)); view = c.getSnapshot().snapshot!; assert.equal(c.getSnapshot().error, ''); assert.equal(view.stock[0].quantity, 10); assert.equal(view.reversals[0].data.status, 'POSTED'); assert.equal(originals(view, s.issueId), immutable);
    const original = view.stockEvents.find(e => e.data.documentId === s.issueId)!, compensation = view.stockEvents.find(e => e.data.eventType === 'REVERSAL_POST')!;
    assert.equal(compensation.data.originalEventId, original.id); assert.equal(compensation.data.sourceLineId, original.data.sourceLineId); assert.equal(compensation.data.documentId, id); assert.equal(compensation.data.boxId, original.data.boxId); assert.equal(compensation.data.signedQuantity, 2); assert.equal(compensation.data.skuId, s.skuId);
    assert.deepEqual(view.reversals[0].data.postedCompensationEventIds, [compensation.id]); assert.equal(view.boxes[0].data.contentRevision, before.boxes[0].data.contentRevision + 1);
    c.suspend(); const remount = s.makeController(createOperationalWebAdapter(s.client, { available: true, scope: 'S17' })); await remount.load(); assert.deepEqual(remount.getSnapshot().snapshot, view); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
  } finally { s.runtime.uninstall(); }
});

test('S17 SERIAL return restores same physical ID and exact original event while original bytes stay identical', async () => {
  const s = await setup('PRODUCT_SERIAL'); try {
    const c = s.makeController(); await c.load(); const before = c.getSnapshot().snapshot!, bytes = originals(before, s.issueId), physical = before.physical[0]; assert.equal(before.stock[0].quantity, 0);
    const id = await confirmed(c); await c.post(target(c.getSnapshot().snapshot!, id)); const after = c.getSnapshot().snapshot!;
    assert.equal(c.getSnapshot().error, ''); assert.equal(after.stock[0].quantity, 1); assert.equal(after.physical[0].id, physical.id); assert.equal(after.physical[0].data.status, 'IN_STOCK'); assert.equal(after.physical[0].data.issuedDocumentId, null); assert.equal(originals(after, s.issueId), bytes);
  } finally { s.runtime.uninstall(); }
});

test('S17 missing evidence/return, unsupported/empty/oversized files and unused declaration reject without mutation', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const before = await s.adapter.read(); await c.create({ ...draft(before), returnedUnused: false }); assert.equal(c.getSnapshot().error, 'UNUSED_RETURN_REQUIRED'); assert.deepEqual(await s.adapter.read(), before);
    await c.create(draft(before)); const view = c.getSnapshot().snapshot!, saved = await s.adapter.read(), t = target(view);
    await c.confirmReturn(t); assert.equal(c.getSnapshot().error, 'EVIDENCE_REQUIRED'); await c.post(t); assert.equal(c.getSnapshot().error, 'PHYSICAL_RETURN_REQUIRED');
    for (const file of [new File([], 'empty.txt', { type: 'text/plain' }), new File(['abc'], 'wrong.exe', { type: 'application/octet-stream' }), new File([new Uint8Array(EVIDENCE_MAX_BYTES + 1)], 'large.pdf', { type: 'application/pdf' })]) {
      await c.attach(t, file, 'Bằng chứng'); assert.equal(c.getSnapshot().error, 'EVIDENCE_INVALID'); assert.deepEqual(await s.adapter.read(), saved);
    }
    await c.attach(t, evidence(), 'bad\nlabel'); assert.equal(c.getSnapshot().error, 'VALIDATION_FAILED'); assert.deepEqual(await s.adapter.read(), saved);
  } finally { s.runtime.uninstall(); }
});

test('S17 cancel is stock-neutral, keeps its reason, and permits new reversal only for an actually eligible original', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); await c.create(draft(c.getSnapshot().snapshot!)); const old = c.getSnapshot().acceptedId!, before = await s.adapter.read();
    await c.cancel(target(before, old), 'Đã kiểm tra, chưa nhận lại'); const after = c.getSnapshot().snapshot!;
    assert.equal(after.reversals.find(r => r.id === old)!.data.status, 'CANCELLED'); assert.equal(after.reversals[0].data.cancelReason, 'Đã kiểm tra, chưa nhận lại'); assert.deepEqual(after.stockEvents, before.stockEvents); assert.deepEqual(after.stock, before.stock);
    assert.ok(reversalIssueOptions(after).some(i => i.id === s.issueId)); await c.create(draft(after)); assert.notEqual(c.getSnapshot().acceptedId, old); assert.equal(c.getSnapshot().snapshot!.reversals.length, 2);
  } finally { s.runtime.uninstall(); }
});

test('S17 duplicate clicks and repeated posted action never duplicate compensation or create a second reversal', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const create = draft(c.getSnapshot().snapshot!); await Promise.all([c.create(create), c.create(create)]); assert.equal(c.getSnapshot().snapshot!.reversals.length, 1);
    await c.attach(target(c.getSnapshot().snapshot!), evidence(), 'Evidence'); await c.confirmReturn(target(c.getSnapshot().snapshot!)); const t = target(c.getSnapshot().snapshot!);
    await Promise.all([c.post(t), c.post(t)]); const after = await s.adapter.read(); assert.equal(after.stock[0].quantity, 10); assert.equal(after.stockEvents.filter(e => e.data.eventType === 'REVERSAL_POST').length, 1);
    await c.post(target(after)); assert.equal(c.getSnapshot().error, 'REVERSAL_IMMUTABLE'); await c.create(draft(after)); assert.equal(c.getSnapshot().error, 'REVERSAL_TYPE_NOT_ALLOWED'); assert.deepEqual(await s.adapter.read(), after);
  } finally { s.runtime.uninstall(); }
});

test('S17 stale version and generation preserve original reason/file target and do not silently rebase', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const create = draft(c.getSnapshot().snapshot!); await c.create(create); const t = target(c.getSnapshot().snapshot!), file = evidence();
    const attach = await s.request('reversal.attach-evidence', { label: 'Other tab', mediaType: 'text/plain', bytes: [1, 2, 3] }, t.id, t.version); await s.run(s.other, attach); const before = await s.adapter.read();
    await c.attach(t, file, 'Unsaved label'); assert.equal(c.getSnapshot().error, 'STALE_VERSION'); assert.deepEqual(await s.adapter.read(), before); assert.equal(file.name, 'return-proof.txt'); assert.equal(t.version, 1);
    await s.reset(); await c.load(); const reset = await s.adapter.read(); await c.create(create); assert.equal(c.getSnapshot().error, 'STALE_SCENARIO'); assert.deepEqual(await s.adapter.read(), reset); assert.equal(create.reasonText, 'Hoàn toàn bộ hàng chưa sử dụng');
  } finally { s.runtime.uninstall(); }
});

test('S17 reviewed version adoption preserves File/label/reason and rejects changed scope, terminal or ineligible actions', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); await c.create(draft(c.getSnapshot().snapshot!));
    const old = target(c.getSnapshot().snapshot!), file = evidence();
    const edit = { kind: 'attach' as const, target: old, file, label: 'Unsaved label', reason: 'Retained unrelated input' };
    await s.run(s.other, await s.request('reversal.attach-evidence', { label: 'Other tab', mediaType: 'text/plain', bytes: [1, 2, 3] }, old.id, old.version));
    await c.load(); const reviewed = c.getSnapshot().snapshot!, reviewedTarget = target(reviewed);
    assert.equal(edit.target.version, 1); assert.equal(edit.file, file); // Read/focus alone never adopts.
    await c.attach(edit.target, edit.file, edit.label); assert.equal(c.getSnapshot().error, 'STALE_VERSION');
    const adopted = adoptReviewedReversal(edit, reviewed, reviewedTarget);
    assert.equal(adopted.target.version, reviewedTarget.version); assert.equal(adopted.file, file); assert.equal(adopted.label, edit.label); assert.equal(adopted.reason, edit.reason); assert.equal(edit.target.version, 1);
    assert.throws(() => adoptReviewedReversal(edit, reviewed, { ...reviewedTarget, id: 'different' }), { code: 'STALE_VERSION' });
    assert.throws(() => adoptReviewedReversal({ ...edit, kind: 'post' }, reviewed, reviewedTarget), { code: 'PHYSICAL_RETURN_REQUIRED' });
    await c.attach(adopted.target, adopted.file, adopted.label); assert.equal(c.getSnapshot().error, '');
    const changed = c.getSnapshot().snapshot!; assert.throws(() => adoptReviewedReversal(edit, changed, reviewedTarget), { code: 'STALE_VERSION' });
    await c.confirmReturn(target(changed)); const confirmedView = c.getSnapshot().snapshot!;
    assert.throws(() => adoptReviewedReversal({ ...edit, kind: 'confirm' }, confirmedView, target(confirmedView)), { code: 'STALE_VERSION' });
    const cancelDraft = { kind: 'cancel' as const, target: old, reason: 'Keep cancellation reason' };
    const cancel = adoptReviewedReversal(cancelDraft, confirmedView, target(confirmedView)); assert.equal(cancel.reason, cancelDraft.reason);
    await c.cancel(cancel.target, cancel.reason); const cancelled = c.getSnapshot().snapshot!;
    assert.throws(() => adoptReviewedReversal(edit, cancelled, target(cancelled)), { code: 'REVERSAL_IMMUTABLE' });
    await s.reset(); await c.load(); assert.throws(() => adoptReviewedReversal(edit, c.getSnapshot().snapshot!, reviewedTarget), { code: 'STALE_SCENARIO' });
    assert.equal(edit.file, file); assert.equal(edit.reason, 'Retained unrelated input');
  } finally { s.runtime.uninstall(); }
});

test('S17 normal reload rejects missing or tampered persisted evidence and restores verified download bytes only after a valid read', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const id = await confirmed(c); c.suspend();
    let mode: 'valid' | 'missing' | 'tampered' = 'valid';
    const wrapped = { ...s.adapter, read: async () => { const view = await s.adapter.read();
      if (mode === 'missing') view.evidence = []; else if (mode === 'tampered') (view.evidence[0].data as any).bytes[0] ^= 1;
      return view;
    } };
    const d = s.makeController(wrapped); await d.load(); const verified = d.getSnapshot().verifiedEvidence[id][0];
    assert.deepEqual(verified.bytes, Array.from(new Uint8Array(await evidence().arrayBuffer())));
    for (const fault of ['missing', 'tampered'] as const) {
      mode = fault; await d.load(); assert.equal(d.getSnapshot().error, 'INVALID_RESPONSE'); assert.equal(d.getSnapshot().snapshot, null); assert.equal(d.getSnapshot().catalog, null); assert.deepEqual(d.getSnapshot().verifiedEvidence, {});
      assert.equal(d.getSnapshot().acceptedSequence, 0); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
      mode = 'valid'; await d.load(); assert.equal(d.getSnapshot().error, ''); assert.deepEqual(d.getSnapshot().verifiedEvidence[id][0], verified); assert.ok(d.getSnapshot().snapshot);
    }
  } finally { s.runtime.uninstall(); }
});

test('S17 intervening real BOX consumption blocks Post atomically; originals remain immutable', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const id = await confirmed(c), t = target(c.getSnapshot().snapshot!, id); await s.issue(1); const before = await s.runtime.business.readSnapshot();
    await c.post(t); assert.equal(c.getSnapshot().error, 'INTERVENING_CONSUMPTION'); assert.deepEqual(await s.runtime.business.readSnapshot(), before); assert.equal((await s.adapter.read()).stock[0].quantity, 7);
  } finally { s.runtime.uninstall(); }
});

test('S17 accepted Post proof survives a subsequent legitimate reissue before read/ACK', async () => {
  for (const tracking of ['COMPONENT_BOX', 'PRODUCT_SERIAL'] as const) {
    const s = await setup(tracking); try {
      const c = s.makeController(); await c.load(); const id = await confirmed(c); c.suspend();
      const wrapped = { ...s.adapter, execute: async (request: OperationalCommand) => { const outcome = await s.adapter.execute(request); await s.issue(1); return outcome; } };
      const d = s.makeController(wrapped); await d.load(); await d.post(target(d.getSnapshot().snapshot!, id)); assert.equal(d.getSnapshot().error, ''); assert.equal(d.getSnapshot().acceptedSequence, 1); assert.equal(d.getSnapshot().snapshot!.stock[0].quantity, tracking === 'COMPONENT_BOX' ? 9 : 0); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
    } finally { s.runtime.uninstall(); }
  }
});

test('S17 precommit failure preserves whole repository and original command retry posts exactly once', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const id = await confirmed(c), before = await s.runtime.business.readSnapshot(), t = target(c.getSnapshot().snapshot!, id);
    s.setStorageFailure(true); await c.post(t); s.setStorageFailure(false); assert.deepEqual(await s.runtime.business.readSnapshot(), before); const held = await s.adapter.recovery.restore(); assert.equal(held.kind, 'pending');
    await c.retry(); const after = c.getSnapshot().snapshot!; assert.equal(after.stock[0].quantity, 10); assert.equal(after.stockEvents.filter(e => e.data.eventType === 'REVERSAL_POST').length, 1); assert.equal(after.auditEvents.filter(e => (e.data as any).commandId === (held as any).request.commandId).length, 1);
  } finally { s.runtime.uninstall(); }
});

test('S17 lost Post response survives navigation and only explicit original-journal retry ACKs without extra stock', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); const id = await confirmed(c); c.suspend();
    const wrapped = { ...s.adapter, execute: async (r: OperationalCommand) => { await s.adapter.execute(r); throw Object.assign(new Error('lost'), { code: 'NETWORK_ERROR' }); } };
    const d = s.makeController(wrapped); await d.load(); await d.post(target(d.getSnapshot().snapshot!, id)); assert.equal(d.getSnapshot().recovery, true); d.suspend();
    const remount = s.makeController(); await remount.load(); assert.equal(remount.getSnapshot().acceptedSequence, 0); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    await remount.retry(); assert.equal(remount.getSnapshot().snapshot!.stock[0].quantity, 10); assert.equal(remount.getSnapshot().snapshot!.stockEvents.filter(e => e.data.eventType === 'REVERSAL_POST').length, 1); assert.equal(remount.getSnapshot().acceptedLocal, false);
  } finally { s.runtime.uninstall(); }
});

test('S17 denied actor cannot create and read-after-commit failure never ACKs until valid reread', async () => {
  const s = await setup(); try {
    let failRead = false; const wrapped = { ...s.adapter, execute: async (r: OperationalCommand) => { const outcome = await s.adapter.execute(r); failRead = true; return outcome; }, read: () => failRead ? Promise.reject(new Error('read')) : s.adapter.read() };
    const c = s.makeController(wrapped); await c.load(); await c.create(draft(c.getSnapshot().snapshot!)); assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal(c.getSnapshot().recovery, true); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
    failRead = false; await c.retry(); assert.equal(c.getSnapshot().acceptedSequence, 1); const t = target(c.getSnapshot().snapshot!); await s.client.post('auth/logout', {}); await c.cancel(t, 'Denied'); assert.equal(c.getSnapshot().snapshot, null); assert.equal(c.getSnapshot().acceptedSequence, 1);
  } finally { s.runtime.uninstall(); }
});

test('S17 navigation while reading selected File never dispatches a stale command or loses original file bytes', async () => {
  const s = await setup(); try {
    const c = s.makeController(); await c.load(); await c.create(draft(c.getSnapshot().snapshot!)); const t = target(c.getSnapshot().snapshot!), file = evidence(), originalRead = file.arrayBuffer.bind(file);
    let release!: () => void, entered!: () => void; const hold = new Promise<void>(r => { release = r; }), started = new Promise<void>(r => { entered = r; });
    file.arrayBuffer = async () => { entered(); await hold; return originalRead(); };
    const before = await s.adapter.read(), attaching = c.attach(t, file, 'Keep label'); await started; c.suspend(); release(); await attaching;
    assert.deepEqual(await s.adapter.read(), before); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' }); assert.equal(file.name, 'return-proof.txt');
  } finally { s.runtime.uninstall(); }
});

test('S17 explicit archived recovery is informational and missing/tampered proof preserves original journal', async () => {
  for (const mode of ['valid', 'missing', 'tampered'] as const) {
    const s = await setup(); try {
      const before = await s.adapter.read(), d = draft(before), request = await s.request('reversal.create', { originalIssueId: d.originalIssueId, observedIssueVersion: d.observedIssueVersion, returnedUnused: true, reasonText: d.reasonText }); const outcome = await s.adapter.execute(request); await s.reset(); const current = await s.adapter.read();
      const wrapped = { ...s.adapter, read: async () => { const view = await s.adapter.read(); if (mode === 'missing') view.archivedCommitSnapshots = []; else if (mode === 'tampered') (view.archivedCommitSnapshots.find(p => p.id === outcome.receipt.commitSnapshotId)!.data as any).changes[0].canonicalRecord = '{}'; return view; } };
      const c = s.makeController(wrapped); await c.load(); assert.equal((await s.adapter.recovery.restore()).kind, 'committed'); await c.retry();
      assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal(c.getSnapshot().acceptedId, null); assert.deepEqual(c.getSnapshot().snapshot!.reversals, current.reversals);
      if (mode === 'valid') { assert.equal(c.getSnapshot().archivedReconciled, true); assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' }); }
      else { assert.equal(c.getSnapshot().error, 'ARCHIVED_PROOF_UNAVAILABLE'); assert.equal(c.getSnapshot().recovery, true); assert.equal((await s.adapter.recovery.restore()).kind, 'committed'); }
    } finally { s.runtime.uninstall(); }
  }
});

test('S17 tampered original/event/evidence reads retain accepted intent instead of reporting success', async () => {
  for (const mode of ['original', 'event', 'evidence'] as const) {
    const s = await setup(); try {
      const c = s.makeController(); await c.load(); const id = await confirmed(c); c.suspend(); let tamper = true;
      const wrapped = { ...s.adapter, read: async () => { const view = await s.adapter.read(); if (tamper && view.reversals.some(r => r.data.status === 'POSTED')) {
        if (mode === 'original') view.partsIssues[0].data.code = 'changed'; else if (mode === 'event') view.stockEvents.find(e => e.data.documentId === s.issueId)!.data.signedQuantity = -1; else (view.evidence[0].data as any).bytes[0] = 0;
      } return view; } };
      const d = s.makeController(wrapped); await d.load(); await d.post(target(d.getSnapshot().snapshot!, id)); assert.equal(d.getSnapshot().acceptedSequence, 0); assert.equal(d.getSnapshot().recovery, true); assert.equal((await s.adapter.recovery.restore()).kind, 'committed');
      tamper = false; await d.retry(); assert.equal(d.getSnapshot().acceptedSequence, 1); assert.equal(d.getSnapshot().snapshot!.stock[0].quantity, 10);
    } finally { s.runtime.uninstall(); }
  }
});

test('S17 rereads a coherent pair after real catalog Create and reversal Create between catalog and operations reads', async () => {
  const s = await setup(); try {
    const skus = createCatalogCreateAdapter('sku', s.client, { available: true }); let reads = 0, addedSkuId = '', reversalId = '';
    const c = createReversalBinding(s.adapter, async () => {
      reads++; const catalog = await skus.readSnapshot();
      if (reads === 1) {
        const request = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch: catalog.epoch,
          payload: { code: 'S17-CONCURRENT', productId: catalog.skus[0].productId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
        const added = await skus.execute(request); await skus.recovery.acknowledge(request.commandId); addedSkuId = added.receipt.entityId;
        const d = draft(await s.adapter.read()), created = await s.run(s.other, await s.request('reversal.create', { originalIssueId: d.originalIssueId, observedIssueVersion: d.observedIssueVersion, returnedUnused: true, reasonText: d.reasonText }));
        reversalId = created.receipt.entityId;
      }
      return catalog;
    });
    await c.load(); const state = c.getSnapshot(); assert.equal(state.error, ''); assert.equal(reads, 2);
    assert.equal(state.snapshot!.snapshotRevision, state.catalog!.snapshotRevision); assert.ok(state.catalog!.skus.some(row => row.id === addedSkuId));
    assert.equal(state.snapshot!.reversals[0].id, reversalId); assert.equal(state.snapshot!.reversals[0].data.originalIssueId, s.issueId);
    assert.deepEqual(state.verifiedEvidence[reversalId], []); assert.equal(state.snapshot!.stock[0].quantity, 8); assert.equal(state.acceptedSequence, 0);
  } finally { s.runtime.uninstall(); }
});

test('S17 persistent real catalog skew rejects after three pairs and never ACKs or claims committed-command success until coherent read', async () => {
  const s = await setup(); try {
    const skus = createCatalogCreateAdapter('sku', s.client, { available: true }); let skew = false, writes = 0, operationReads = 0;
    const c = createReversalBinding({ ...s.adapter, read: async () => { operationReads++; return s.adapter.read(); } }, async () => {
      const catalog = await skus.readSnapshot();
      if (skew) {
        const request = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch: catalog.epoch,
          payload: { code: `S17-SKEW-${++writes}`, productId: catalog.skus[0].productId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
        await skus.execute(request); await skus.recovery.acknowledge(request.commandId);
      }
      return catalog;
    });
    await c.load(); const d = draft(c.getSnapshot().snapshot!); skew = true; operationReads = 0;
    await c.create(d); assert.equal(writes, 3); assert.equal(operationReads, 3); assert.equal(c.getSnapshot().error, 'STALE_SNAPSHOT');
    assert.equal(c.getSnapshot().snapshot, null); assert.equal(c.getSnapshot().catalog, null); assert.deepEqual(c.getSnapshot().verifiedEvidence, {});
    assert.equal(c.getSnapshot().acceptedSequence, 0); assert.equal(c.getSnapshot().acceptedId, null); assert.equal(c.getSnapshot().recovery, true);
    const held = await s.adapter.recovery.restore(); assert.equal(held.kind, 'committed'); assert.equal((await s.adapter.read()).reversals.length, 1);
    await c.load(); assert.equal(writes, 6); assert.equal(operationReads, 6); assert.equal(c.getSnapshot().snapshot, null); assert.equal(c.getSnapshot().acceptedSequence, 0);
    assert.deepEqual(await s.adapter.recovery.restore(), held);
    skew = false; await c.retry(); const state = c.getSnapshot(); assert.equal(state.error, ''); assert.equal(state.acceptedSequence, 1);
    assert.equal(state.snapshot!.snapshotRevision, state.catalog!.snapshotRevision); assert.equal(state.snapshot!.reversals.length, 1); assert.equal(state.snapshot!.stock[0].quantity, 8);
    assert.deepEqual(await s.adapter.recovery.restore(), { kind: 'empty' });
  } finally { s.runtime.uninstall(); }
});
