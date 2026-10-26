import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter, createOperationalQaAdapter } from '../../src/data/http/operational-preview-adapter';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken, PREVIEW_MOCK_CREDENTIALS } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import type { OperationalCommand, OperationalCommandName, OperationalPayloads, Tracking } from '../../src/contracts/operational-preview';
import { createOperationalInventoryBinding, resolveInventorySelection, type InventoryOperationalReader } from '../../src/features/S16/inventory-binding';
import { vietnamDate } from '../../src/operations/operational-reports';

async function setup() {
  const client = createApiClient({ baseURL: 'https://hoa-nam-mock.invalid/api/v1' });
  const runtime = installPreviewMock(client, { approvedPreviewCommands: true, approvedAppEventFixture: true,
    businessPersistence: createMemoryBusinessPersistence(), persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(), recoveryPersistence: createMemoryBusinessPersistence() });
  await client.post('auth/login', PREVIEW_MOCK_CREDENTIALS); await client.post('auth/confirm', {});
  const product = createCatalogCreateAdapter('product', client, { available: true }), sku = createCatalogCreateAdapter('sku', client, { available: true });
  const recipient = createCatalogCreateAdapter('recipient', client, { available: true }), epoch = (await product.readSnapshot()).epoch;
  async function master(code: string, unit: 'Cái' | 'Bộ') {
    const pRequest = { command: 'products.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'P-' + code, name: 'Tên hàng ' + code, group: 'Phụ kiện' as const, unit, status: 'active' as const } };
    const p = await product.execute(pRequest); await product.recovery.acknowledge(pRequest.commandId);
    const request = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code, productId: p.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
    const result = await sku.execute(request); await sku.recovery.acknowledge(request.commandId); return { id: result.receipt.entityId, productId: p.receipt.entityId };
  }
  const a = await master('S16-A', 'Cái'), b = await master('S16-B', 'Bộ');
  const recipientRequest = { command: 'recipients.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S16-R', name: 'Nơi nhận S16', type: 'Khách lẻ' as const, market: 'Miền Nam' as const, area: 'Khu vực', address: 'Địa chỉ', contact: '', phone: '', status: 'active' as const } };
  const r = await recipient.execute(recipientRequest); await recipient.recovery.acknowledge(recipientRequest.commandId);
  const web = createOperationalWebAdapter(client, { available: true, scope: 'S16-test-commands' }), reader = createOperationalWebAdapter(client, { available: true, scope: 'S16' }), qa = createOperationalQaAdapter(client, { available: true, scope: 'S16-test' });
  const request = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number): Promise<OperationalCommand<C>> => {
    const snapshot = await web.read(); return { commandId: crypto.randomUUID(), epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation, command, payload, ...(entityId ? { entityId, expectedVersion } : {}) };
  };
  const run = async (adapter: Pick<typeof web, 'execute' | 'recovery'>, command: OperationalCommand) => { const outcome = await adapter.execute(command); await adapter.recovery.acknowledge(command.commandId); return outcome; };
  const reset = async () => run(qa, await request('scenario.reset-own', { confirmed: true, selectedSkuIds: [a.id, b.id] }));
  await reset();
  for (const [id, tracking] of [[a.id, 'PRODUCT_SERIAL'], [b.id, 'COMPONENT_BOX']] as [string, Tracking][]) await run(web, await request('stock-profiles.create', { skuId: id, tracking, observedSkuVersion: 1, observedProductVersion: 1 }));
  const make = (adapter: InventoryOperationalReader = reader, labels = () => sku.readSnapshot()) => createOperationalInventoryBinding(adapter, labels);
  async function inbound(tracking: Tracking) {
    const serial = tracking === 'PRODUCT_SERIAL', skuId = serial ? a.id : b.id;
    let receipt = await run(web, await request('inbound.create', { mode: serial ? 'PRODUCT' : 'COMPONENT', sourceText: 'S16 source', referenceText: tracking }));
    const id = receipt.receipt.entityId;
    for (let i = 1; i <= (serial ? 4 : 2); i++) receipt = await run(runtime.appEventAdapters!.P04, await request('inbound.scan', {
      receiptId: id, clientScanId: crypto.randomUUID(), skuId, tracking, physicalCode: serial ? `S16-A00${i}` : `S16-BOX-${i}`,
      ...(serial ? {} : { quantity: i === 1 ? 10 : 6 }),
    }, id, receipt.receipt.version));
    receipt = await run(runtime.appEventAdapters!.P04, await request('inbound.submit', { receiptId: id }, id, receipt.receipt.version));
    return { post: async () => run(web, await request('inbound.post', { receiptId: id }, id, receipt.receipt.version)), receipt };
  }
  return { client, runtime, web, reader, qa, sku, a, b, recipientId: r.receipt.entityId, request, run, reset, inbound, make };
}
async function loaded(s: Awaited<ReturnType<typeof setup>>) { const c = s.make(); await c.load(); assert.equal(c.getSnapshot().error, ''); return c; }
const quantities = (c: ReturnType<Awaited<ReturnType<typeof setup>>['make']>) => Object.fromEntries(c.getSnapshot().model!.rows.map(row => [row.skuCode, row.quantity]));

test('S16 actual HTTP receipt A4/B16 → neutral putaway → outbound A1 → parts B14 → reversal B16, reload preserves IDs/unit/token', async () => {
  const s = await setup(); try {
    const c = await loaded(s), a = await s.inbound('PRODUCT_SERIAL'); await c.load(); assert.deepEqual(quantities(c), {});
    await a.post(); const b = await s.inbound('COMPONENT_BOX'); await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 4 });
    await b.post(); await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 4, 'S16-B': 16 });
    let model = c.getSnapshot().model!, snapshot = await s.web.read();
    assert.deepEqual(model.report.token, snapshot.token); assert.equal(model.report.query.to, vietnamDate(model.report.query.asOf));
    assert.equal(model.rows.find(row => row.skuId === s.a.id)!.productId, s.a.productId);
    assert.equal(model.rows.find(row => row.skuId === s.b.id)!.productName, 'Tên hàng S16-B');
    assert.equal(model.rows.find(row => row.skuId === s.b.id)!.unit, 'Bộ');
    assert.ok(model.rows.every(row => row.actual === null && row.difference === null));
    const box = snapshot.boxes.find(row => row.data.physicalCode === 'S16-BOX-1')!, eventsBefore = snapshot.stockEvents;
    const task = await s.run(s.web, await s.request('putaway.create', { boxId: box.id, observedBoxVersion: box.version }));
    await s.run(s.web, await s.request('putaway.confirm', { trayId: snapshot.setupMasters.find(row => row.kind === 'operational-setup-tray')!.id }, task.receipt.entityId, 1));
    await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 4, 'S16-B': 16 }); assert.deepEqual((await s.web.read()).stockEvents, eventsBefore);
    let outbound = await s.run(s.runtime.appEventAdapters!.P05, await s.request('outbound.create', { recipientId: s.recipientId, observedRecipientVersion: 1, requestedLines: [{ skuId: s.a.id, quantity: 3, observedSkuVersion: 1, observedProductVersion: 1 }] }));
    const outboundId = outbound.receipt.entityId;
    for (let i = 1; i <= 3; i++) outbound = await s.run(s.runtime.appEventAdapters!.P05, await s.request('outbound.scan', { outboundId, clientScanId: crypto.randomUUID(), physicalCode: `S16-A00${i}` }, outboundId, outbound.receipt.version));
    outbound = await s.run(s.runtime.appEventAdapters!.P05, await s.request('outbound.submit', { outboundId }, outboundId, outbound.receipt.version));
    outbound = await s.run(s.web, await s.request('outbound.receive', { outboundId }, outboundId, outbound.receipt.version));
    await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 4, 'S16-B': 16 });
    await s.run(s.web, await s.request('outbound.post', { outboundId }, outboundId, outbound.receipt.version));
    await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 1, 'S16-B': 16 });
    const intake = await s.run(s.runtime.appEventAdapters!.P09, await s.request('warranty.intake', { identityMode: 'TEMP_ONLY', skuId: s.a.id, physicalId: null, customerReportedIssue: 'Fault' }));
    const diagnosed = await s.run(s.web, await s.request('warranty.diagnose', { defectIds: [], technicianDiagnosis: 'Check', expectedFinishDate: null }, intake.receipt.entityId, 1));
    let issue = await s.run(s.runtime.appEventAdapters!.P19, await s.request('parts.create', { caseId: intake.receipt.entityId, observedCaseVersion: diagnosed.receipt.version }));
    const currentBox = (await s.web.read()).boxes.find(row => row.id === box.id)!;
    issue = await s.run(s.runtime.appEventAdapters!.P19, await s.request('parts.save', { lines: [{ physicalCode: currentBox.data.physicalCode, quantity: 2, observedVersion: currentBox.version }] }, issue.receipt.entityId, issue.receipt.version));
    issue = await s.run(s.runtime.appEventAdapters!.P19, await s.request('parts.post', { issueId: issue.receipt.entityId }, issue.receipt.entityId, issue.receipt.version));
    await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 1, 'S16-B': 14 });
    const original = structuredClone((await s.web.read()).partsIssues);
    let reversal = await s.run(s.web, await s.request('reversal.create', { originalIssueId: issue.receipt.entityId, observedIssueVersion: issue.receipt.version, returnedUnused: true, reasonText: 'Unused return' }));
    reversal = await s.run(s.web, await s.request('reversal.attach-evidence', { label: 'Actual returned goods', mediaType: 'text/plain', bytes: [82, 69, 84, 85, 82, 78] }, reversal.receipt.entityId, reversal.receipt.version));
    reversal = await s.run(s.web, await s.request('reversal.confirm-return', { confirmed: true }, reversal.receipt.entityId, reversal.receipt.version));
    await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 1, 'S16-B': 14 });
    await s.run(s.web, await s.request('reversal.post', { reversalId: reversal.receipt.entityId }, reversal.receipt.entityId, reversal.receipt.version));
    await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 1, 'S16-B': 16 });
    model = c.getSnapshot().model!; assert.ok(model.rows.every(row => row.actual === null && row.difference === null));
    assert.deepEqual(model.report.partsIssues, original); assert.equal(model.report.events.filter(event => event.data.eventType === 'REVERSAL_POST').length, 1);
    assert.deepEqual(model.report.token, (await s.web.read()).token); assert.ok(Object.isFrozen(model.report));
    c.suspend(); const remounted = await loaded(s); assert.deepEqual(remounted.getSnapshot().model!.rows, model.rows); assert.deepEqual(remounted.getSnapshot().model!.report.token, model.report.token);
  } finally { s.runtime.uninstall(); }
});

test('S16 reset empties active inventory and old detail fence cannot select same SKU in another generation', async () => {
  const s = await setup(); try {
    await (await s.inbound('COMPONENT_BOX')).post(); const c = await loaded(s), model = c.getSnapshot().model!;
    const selection = { key: model.rows[0].key, ...model.report.token }; assert.ok(resolveInventorySelection(model, selection));
    await s.reset(); await c.load(); assert.equal(c.getSnapshot().error, ''); assert.deepEqual(c.getSnapshot().model!.rows, []); assert.equal(resolveInventorySelection(c.getSnapshot().model, selection), null);
    const changedScope = { ...model, report: { ...model.report, token: c.getSnapshot().model!.report.token } }; assert.equal(resolveInventorySelection(changedScope, selection), null);
    assert.equal((await s.sku.readSnapshot()).skus.some(row => row.id === s.b.id), true); assert.ok((await s.web.read()).archivedCommitSnapshots.length > 0);
  } finally { s.runtime.uninstall(); }
});

test('S16 concurrent read retries label/quantity pair at one actual revision; persistent skew refuses a model', async () => {
  const s = await setup(); try {
    const old = await s.sku.readSnapshot(); let calls = 0;
    const c = s.make(s.reader, async () => { const labels = await s.sku.readSnapshot(); if (++calls === 1) await s.run(s.web, await s.request('inbound.create', { mode: 'PRODUCT', sourceText: 'Concurrent', referenceText: '' })); return labels; });
    await c.load(); assert.equal(c.getSnapshot().error, ''); assert.equal(calls, 2); assert.deepEqual(c.getSnapshot().model!.report.token, (await s.web.read()).token);
    let stale = true, skewCalls = 0;
    const skew = s.make(s.reader, async () => { skewCalls++; return stale ? old : s.sku.readSnapshot(); }); await skew.load(); assert.equal(skew.getSnapshot().error, 'SNAPSHOT_CHANGED'); assert.equal(skew.getSnapshot().model, null); assert.equal(skewCalls, 3);
    stale = false; await skew.load(); assert.equal(skew.getSnapshot().error, ''); assert.deepEqual(skew.getSnapshot().model!.report.token, (await s.web.read()).token);
  } finally { s.runtime.uninstall(); }
});

test('S16 rejects incomplete population, forged stock total and missing Product/SKU links without false quantities', async () => {
  const s = await setup(); try {
    await (await s.inbound('COMPONENT_BOX')).post();
    const incomplete = s.make({ ...s.reader, read: async () => ({ ...await s.reader.read(), stockEvents: [] }) }); await incomplete.load(); assert.equal(incomplete.getSnapshot().error, 'INCOMPLETE_POPULATION'); assert.equal(incomplete.getSnapshot().model, null);
    const forged = s.make({ ...s.reader, read: async () => { const snapshot = await s.reader.read(); snapshot.stock[0].quantity = 42; return snapshot; } }); await forged.load(); assert.equal(forged.getSnapshot().error, 'INCOMPLETE_POPULATION');
    const missing = s.make(s.reader, async () => ({ ...await s.sku.readSnapshot(), products: [] })); await missing.load(); assert.equal(missing.getSnapshot().error, 'CATALOG_LINK_UNAVAILABLE'); assert.equal(missing.getSnapshot().model, null);
  } finally { s.runtime.uninstall(); }
});

test('S16 read/session failures clear current model; refresh recovers without any business command or journal ACK', async () => {
  const s = await setup(); try {
    await (await s.inbound('PRODUCT_SERIAL')).post(); let fail = false, journalCalls = 0;
    const adapter = { ...s.reader, read: () => fail ? Promise.reject(new Error('Storage read failed')) : s.reader.read(), execute: () => { journalCalls++; throw new Error('must not write'); }, recovery: { restore: () => { journalCalls++; }, retry: () => { journalCalls++; }, acknowledge: () => { journalCalls++; } } };
    const c = s.make(adapter); await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 4 });
    fail = true; await c.load(); assert.equal(c.getSnapshot().model, null); assert.equal(c.getSnapshot().error, 'READ_FAILED');
    fail = false; await c.load(); assert.deepEqual(quantities(c), { 'S16-A': 4 }); assert.equal(journalCalls, 0);
    await s.client.post('auth/logout', {}); await c.load(); assert.equal(c.getSnapshot().model, null); assert.ok(c.getSnapshot().error); assert.equal(journalCalls, 0);
  } finally { s.runtime.uninstall(); }
});

test('S16 superseded read and suspended response never republish stale model', async () => {
  const s = await setup(); try {
    let release!: () => void, entered!: () => void, first = true;
    const gate = new Promise<void>(resolve => { release = resolve; }), reading = new Promise<void>(resolve => { entered = resolve; });
    const adapter = { ...s.reader, read: async () => { const snapshot = await s.reader.read(); if (first) { first = false; entered(); await gate; } return snapshot; } };
    const c = s.make(adapter), pending = c.load(); await reading;
    await s.reset(); await c.load(); const model = c.getSnapshot().model!; release(); await pending;
    assert.equal(c.getSnapshot().model, model); assert.deepEqual(model.report.token, (await s.web.read()).token);
    let releaseSecond!: () => void; const gateSecond = new Promise<void>(resolve => { releaseSecond = resolve; });
    const suspended = s.make({ ...s.reader, read: async () => { await gateSecond; return s.reader.read(); } });
    const waiting = suspended.load(); suspended.suspend(); releaseSecond(); await waiting; assert.equal(suspended.getSnapshot().model, null);
  } finally { s.runtime.uninstall(); }
});
