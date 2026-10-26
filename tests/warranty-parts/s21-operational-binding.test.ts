import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter, createOperationalQaAdapter } from '../../src/data/http/operational-preview-adapter';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken, PREVIEW_MOCK_CREDENTIALS } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import type { OperationalCommand, OperationalCommandName, OperationalPayloads } from '../../src/contracts/operational-preview';
import { createStockReportBinding, type StockReportReader } from '../../src/features/S21/stock-report-binding';
import { exportOperationalReport } from '../../src/operations/operational-reports';

async function setup() {
  const client = createApiClient({ baseURL: 'https://hoa-nam-mock.invalid/api/v1' });
  const runtime = installPreviewMock(client, { approvedPreviewCommands: true, approvedAppEventFixture: true, businessPersistence: createMemoryBusinessPersistence(), persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(), recoveryPersistence: createMemoryBusinessPersistence() });
  await client.post('auth/login', PREVIEW_MOCK_CREDENTIALS); await client.post('auth/confirm', {});
  const products = createCatalogCreateAdapter('product', client, { available: true }), skus = createCatalogCreateAdapter('sku', client, { available: true }), recipients = createCatalogCreateAdapter('recipient', client, { available: true });
  const epoch = (await products.readSnapshot()).epoch;
  async function master(code: string, unit: 'Cái' | 'Bộ') {
    const pr = { command: 'products.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: `P-${code}`, name: `Product ${code}`, group: 'Phụ kiện' as const, unit, status: 'active' as const } };
    const p = await products.execute(pr); await products.recovery.acknowledge(pr.commandId);
    const sr = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code, productId: p.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
    const sku = await skus.execute(sr); await skus.recovery.acknowledge(sr.commandId); return sku.receipt.entityId;
  }
  const a = await master('S21-A', 'Cái'), b = await master('S21-B', 'Bộ');
  const rr = { command: 'recipients.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S21-R', name: 'Recipient S21', type: 'Khách lẻ' as const, market: 'Miền Nam' as const, area: 'Khu vực', address: 'Địa chỉ', contact: '', phone: '', status: 'active' as const } };
  const recipient = await recipients.execute(rr); await recipients.recovery.acknowledge(rr.commandId);
  const adapter = createOperationalWebAdapter(client, { available: true, scope: 'S21-test' }), qa = createOperationalQaAdapter(client, { available: true, scope: 'S21-test' });
  const request = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number): Promise<OperationalCommand<C>> => {
    const snapshot = await adapter.read(); return { command, payload, commandId: crypto.randomUUID(), epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation, ...(entityId ? { entityId, expectedVersion } : {}) };
  };
  const run = async (target: Pick<typeof adapter, 'execute' | 'recovery'>, command: OperationalCommand) => { const result = await target.execute(command); await target.recovery.acknowledge(command.commandId); return result; };
  const reset = () => request('scenario.reset-own', { confirmed: true, selectedSkuIds: [a, b] }).then(req => run(qa, req)); await reset();
  for (const [skuId, tracking] of [[a, 'PRODUCT_SERIAL'], [b, 'COMPONENT_BOX']] as const) {
    await run(adapter, await request('stock-profiles.create', { skuId, tracking, observedSkuVersion: 1, observedProductVersion: 1 }));
    let inbound = await run(adapter, await request('inbound.create', { mode: tracking === 'PRODUCT_SERIAL' ? 'PRODUCT' : 'COMPONENT', sourceText: 'S21 source', referenceText: '' }));
    const receiptId = inbound.receipt.entityId;
    for (let i = 1; i <= (skuId === a ? 4 : 1); i++) inbound = await run(runtime.appEventAdapters!.P04, await request('inbound.scan', { receiptId, clientScanId: crypto.randomUUID(), skuId, tracking, physicalCode: skuId === a ? `S21-A${i}` : 'S21-BOX', ...(skuId === b ? { quantity: 16 } : {}) }, receiptId, inbound.receipt.version));
    inbound = await run(runtime.appEventAdapters!.P04, await request('inbound.submit', { receiptId }, receiptId, inbound.receipt.version));
    await run(adapter, await request('inbound.post', { receiptId }, receiptId, inbound.receipt.version));
  }
  async function outbound() {
    let out = await run(runtime.appEventAdapters!.P05, await request('outbound.create', { recipientId: recipient.receipt.entityId, observedRecipientVersion: 1, requestedLines: [{ skuId: a, quantity: 3, observedSkuVersion: 1, observedProductVersion: 1 }] })); const id = out.receipt.entityId;
    for (let i = 1; i <= 3; i++) out = await run(runtime.appEventAdapters!.P05, await request('outbound.scan', { outboundId: id, clientScanId: crypto.randomUUID(), physicalCode: `S21-A${i}` }, id, out.receipt.version));
    out = await run(runtime.appEventAdapters!.P05, await request('outbound.submit', { outboundId: id }, id, out.receipt.version));
    out = await run(adapter, await request('outbound.receive', { outboundId: id }, id, out.receipt.version));
    return run(adapter, await request('outbound.post', { outboundId: id }, id, out.receipt.version));
  }
  async function issue() {
    const cas = await run(runtime.appEventAdapters!.P09, await request('warranty.intake', { identityMode: 'TEMP_ONLY', skuId: a, physicalId: null, customerReportedIssue: 'Failure' }));
    await run(adapter, await request('warranty.diagnose', { defectIds: [], technicianDiagnosis: 'Checking', expectedFinishDate: null }, cas.receipt.entityId, cas.receipt.version));
    const view = await adapter.read(), box = view.boxes[0];
    let parts = await run(runtime.appEventAdapters!.P19, await request('parts.create', { caseId: cas.receipt.entityId, observedCaseVersion: view.warrantyCases[0].version }));
    parts = await run(runtime.appEventAdapters!.P19, await request('parts.save', { lines: [{ physicalCode: box.data.physicalCode, quantity: 2, observedVersion: box.version }] }, parts.receipt.entityId, parts.receipt.version));
    return run(runtime.appEventAdapters!.P19, await request('parts.post', { issueId: parts.receipt.entityId }, parts.receipt.entityId, parts.receipt.version));
  }
  async function reverse() {
    const issue = (await adapter.read()).partsIssues[0];
    let rev = await run(adapter, await request('reversal.create', { originalIssueId: issue.id, observedIssueVersion: issue.version, returnedUnused: true, reasonText: 'Unused parts returned' })); const id = rev.receipt.entityId;
    rev = await run(adapter, await request('reversal.attach-evidence', { label: 'Physical return receipt', mediaType: 'text/plain', bytes: [...new TextEncoder().encode('Unused parts returned and counted')] }, id, rev.receipt.version));
    rev = await run(adapter, await request('reversal.confirm-return', { confirmed: true }, id, rev.receipt.version));
    return run(adapter, await request('reversal.post', { reversalId: id }, id, rev.receipt.version));
  }
  const controller = (reader: StockReportReader = adapter, catalog = () => skus.readSnapshot()) => createStockReportBinding(reader, catalog);
  return { client, runtime, adapter, skus, a, b, request, run, reset, outbound, issue, reverse, controller };
}
const values = (c: ReturnType<typeof createStockReportBinding>) => c.getSnapshot().model!.rows.map(r => ({ sku: r.skuCode, unit: r.unit, opening: r.opening, inbound: r.inbound, outbound: r.outbound, parts: r.parts, reversals: r.reversals, closing: r.closing }));
const xml = (bytes: Uint8Array) => Object.values(unzipSync(bytes)).map(bytes => strFromU8(bytes)).join('\n');

test('S21 HTTP commands A4/B16 -> A1/B16 -> B14 -> B16; exact catalog IDs, units and pinned XLSX survive later mutations/navigation', async () => {
  const s = await setup(); try {
    const c = s.controller(); await c.load(); const first = c.getSnapshot().model!;
    assert.equal(first.rows.find(r => r.skuId === s.a)!.closing, 4); assert.equal(first.rows.find(r => r.skuId === s.b)!.closing, 16);
    assert.equal(first.rows[0].productName, 'Product S21-A'); assert.ok(first.rows.every(r => r.productId && r.warehouseId && r.actual === null && r.difference === null));
    await s.outbound(); await s.issue();
    const pinned = await c.exportXlsx(); assert.equal(pinned.sha256, first.report.sha256); assert.deepEqual(pinned.token, first.report.token); assert.deepEqual(pinned.query, first.report.query);
    const content = xml(pinned.bytes); assert.ok(content.includes(s.a)); assert.ok(content.includes(s.b)); assert.ok(content.includes(first.report.sha256));
    assert.deepEqual(values(c).map(r => r.closing), [4, 16]);
    await c.load(); assert.deepEqual(values(c).map(r => r.closing), [1, 14]);
    await s.reverse(); await c.load();
    assert.deepEqual(values(c), [{ sku: 'S21-A', unit: 'Cái', opening: 0, inbound: 4, outbound: 3, parts: 0, reversals: 0, closing: 1 }, { sku: 'S21-B', unit: 'Bộ', opening: 0, inbound: 16, outbound: 0, parts: 2, reversals: 2, closing: 16 }]);
    const report = c.getSnapshot().model!.report, compensation = report.events.find(e => e.data.eventType === 'REVERSAL_POST')!, original = report.events.find(e => e.id === compensation.data.originalEventId)!;
    assert.equal(original.data.eventType, 'PARTS_ISSUE_POST'); assert.equal(compensation.data.skuId, s.b); assert.equal(compensation.data.sourceLineId, original.data.sourceLineId);
    c.suspend(); const remount = s.controller(createOperationalWebAdapter(s.client, { available: true, scope: 'S21-remount' })); await remount.load(); assert.deepEqual(values(remount), values(c));
    const final = await remount.exportXlsx(); assert.ok(xml(final.bytes).includes('reversals')); assert.ok(xml(final.bytes).includes(final.sha256));
  } finally { s.runtime.uninstall(); }
});

test('S21 Vietnam midnight boundary: receipt in day20, outbound/parts/reversal in day21; opening distinct from compensation', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-10-20T16:59:59Z') });
  const s = await setup(); try {
    t.mock.timers.setTime(Date.parse('2026-10-20T17:00:00Z')); await s.outbound(); await s.issue(); await s.reverse();
    const c = s.controller(); await c.load({ from: '2026-10-20', to: '2026-10-20' });
    assert.deepEqual(values(c).map(r => [r.opening, r.inbound, r.outbound, r.parts, r.reversals, r.closing]), [[0, 4, 0, 0, 0, 4], [0, 16, 0, 0, 0, 16]]);
    await c.load({ from: '2026-10-21', to: '2026-10-21' });
    assert.deepEqual(values(c).map(r => [r.opening, r.inbound, r.outbound, r.parts, r.reversals, r.closing]), [[4, 0, 3, 0, 0, 1], [16, 0, 0, 2, 2, 16]]);
    const draft = { from: '2026-10-20', to: '2026-10-20' };
    const exported = await c.exportXlsx(); assert.deepEqual(exported.query, c.getSnapshot().model!.report.query); assert.ok(xml(exported.bytes).includes('2026-10-21')); assert.notEqual(exported.query.from, draft.from);
    await c.load({ from: '2026-10-22', to: '2026-10-21' }); assert.equal(c.getSnapshot().error, 'INVALID_PERIOD'); assert.equal(c.getSnapshot().model, null); assert.deepEqual(c.getSnapshot().acceptedPeriod, { from: '2026-10-21', to: '2026-10-21' }); await assert.rejects(c.exportXlsx());
  } finally { s.runtime.uninstall(); }
});

test('S21 incomplete proof/population, missing catalog FK and tampered export refuse unverified data', async () => {
  const s = await setup(); try {
    for (const mutation of ['proof', 'population'] as const) {
      const c = s.controller({ ...s.adapter, read: async () => { const snapshot = await s.adapter.read(); if (mutation === 'proof') snapshot.commitSnapshots = []; else snapshot.stockEvents.pop(); return snapshot; } });
      await c.load(); assert.equal(c.getSnapshot().error, 'INCOMPLETE_POPULATION'); assert.equal(c.getSnapshot().model, null); await assert.rejects(c.exportXlsx());
    }
    const c = s.controller(); await c.load(); const tampered = structuredClone(c.getSnapshot().model!.report); tampered.stock[0].closing++;
    await assert.rejects(exportOperationalReport(tampered, 'stock'), { code: 'INCOMPLETE_POPULATION' });
    const missing = s.controller(s.adapter, async () => ({ ...await s.skus.readSnapshot(), products: [] })); await missing.load(); assert.equal(missing.getSnapshot().error, 'CATALOG_LINK_UNAVAILABLE');
  } finally { s.runtime.uninstall(); }
});

test('S21 bounded coherent revision retry, reset clears old rows, read failures and navigation fence exports', async () => {
  const s = await setup(); try {
    let reads = 0;
    const c = s.controller(s.adapter, async () => { const catalog = await s.skus.readSnapshot(); if (++reads === 1) catalog.snapshotRevision--; return catalog; }); await c.load(); assert.equal(reads, 2); assert.ok(c.getSnapshot().model);
    const unstable = s.controller(s.adapter, async () => { const catalog = await s.skus.readSnapshot(); catalog.snapshotRevision--; return catalog; }); await unstable.load(); assert.equal(unstable.getSnapshot().error, 'SNAPSHOT_CHANGED');
    await s.reset(); const loading = c.load(); assert.equal(c.getSnapshot().model, null); await assert.rejects(c.exportXlsx()); await loading; assert.deepEqual(c.getSnapshot().model!.rows, []);
    let failRead = false; const failed = s.controller({ ...s.adapter, read: () => failRead ? Promise.reject(new Error('read failed')) : s.adapter.read() }); await failed.load(); failRead = true; await failed.load(); assert.equal(failed.getSnapshot().model, null); assert.equal(failed.getSnapshot().error, 'READ_FAILED');
    await c.load(); const focusExport = c.exportXlsx(), focusLoad = c.load(); await assert.rejects(focusExport, { code: 'SNAPSHOT_CHANGED' }); await focusLoad;
    const exporting = c.exportXlsx(); c.suspend(); await assert.rejects(exporting, { code: 'SNAPSHOT_CHANGED' });
    await c.resume(); await s.client.post('auth/logout', {}); await c.load(); assert.equal(c.getSnapshot().model, null); await assert.rejects(c.exportXlsx());
  } finally { s.runtime.uninstall(); }
});
