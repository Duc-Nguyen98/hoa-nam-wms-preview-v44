import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter, createOperationalQaAdapter } from '../../src/data/http/operational-preview-adapter';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken, PREVIEW_MOCK_CREDENTIALS } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import type { OperationalCommand, OperationalCommandName, OperationalPayloads, OperationalSnapshot } from '../../src/contracts/operational-preview';
import { createOperationalPartsReader, findOperationalPartsIssue, projectOperationalParts, type PartsReadAdapter } from '../../src/features/S10/parts-operational-binding';
import { createWarrantyBinding } from '../../src/features/S09/warranty-binding';
import { createBusinessHttpAdapters } from '../../src/data/http/business-adapters';
import { createWarrantyReportReader } from '../../src/features/S22/warranty-operational-binding';
import { createOperationalInventoryBinding } from '../../src/features/S16/inventory-binding';
import { createStockReportBinding } from '../../src/features/S21/stock-report-binding';

test('S09/S10/S22 and S16/S21 agree through draft, scanning, posting, return and reset without read mutations', async () => {
  const s = await setup();
  const catalog = () => s.sku.readSnapshot();
  const warranty = createWarrantyBinding(s.adapter, createBusinessHttpAdapters(s.client).S02);
  const parts = s.makeReader();
  const report = createWarrantyReportReader(s.adapter, catalog);
  const inventory = createOperationalInventoryBinding(s.adapter, catalog);
  const stock = createStockReportBinding(s.adapter, catalog);
  try {
    const check = async (status: string, serialQuantity: number, boxQuantity: number, issued: number, returned: number) => {
      const before = await s.adapter.read();
      await warranty.load(); await parts.load(); await report.load(); await inventory.load(); await stock.load();
      for (const reader of [warranty, parts, report, inventory, stock]) assert.equal(reader.getSnapshot().error, '');
      const caseRow = warranty.getSnapshot().snapshot!.warrantyCases.find(row => row.id === s.caseId)!;
      const issue = parts.getSnapshot().model!.issues.find(row => row.record.id === s.issueId)!;
      const caseReport = report.getSnapshot().model!.rows.find(row => row.id === s.caseId)!;
      assert.equal(issue.record.data.status, status);
      assert.equal(issue.warrantyCase.id, caseRow.id);
      assert.equal(caseReport.state, caseRow.data.state);
      assert.deepEqual(caseReport.partIssueIds, [s.issueId]);
      assert.equal(report.getSnapshot().model!.report.summary.total, 1);
      assert.equal(report.getSnapshot().model!.report.summary.processing, 1);
      assert.equal(inventory.getSnapshot().model!.rows.find(row => row.skuId === s.skuIds[0])!.quantity, serialQuantity);
      assert.equal(inventory.getSnapshot().model!.rows.find(row => row.skuId === s.skuIds[1])!.quantity, boxQuantity);
      const component = stock.getSnapshot().model!.rows.find(row => row.skuId === s.skuIds[1])!;
      assert.equal(component.closing, boxQuantity); assert.equal(component.parts, issued); assert.equal(component.reversals, returned);
      assert.deepEqual(await s.adapter.read(), before, 'screen reads must not mutate stock, history or document versions');
    };
    await check('DRAFT', 1, 10, 0, 0);
    const saved = await s.save(); await check('SCANNING', 1, 10, 0, 0);
    const postRequest = await s.request('parts.post', { issueId: s.issueId }, s.issueId, saved.receipt.version);
    const app = s.runtime.appEventAdapters!.P19;
    await app.execute(postRequest); await app.recovery.acknowledge(postRequest.commandId);
    await check('POSTED', 0, 8, 2, 0);
    const posted = await s.adapter.read();
    await app.execute(postRequest); await app.recovery.acknowledge(postRequest.commandId);
    assert.deepEqual(await s.adapter.read(), posted, 'retrying the same posted command cannot deduct twice');
    await s.reverse(); await check('POSTED', 1, 10, 2, 2);
    await s.reset(); await warranty.load(); await parts.load(); await report.load(); await inventory.load(); await stock.load();
    assert.equal(warranty.getSnapshot().snapshot!.warrantyCases.length, 0);
    assert.equal(parts.getSnapshot().model!.issues.length, 0);
    assert.equal(report.getSnapshot().model!.report.summary.total, 0);
    assert.equal(inventory.getSnapshot().model!.rows.length, 0);
    assert.equal(stock.getSnapshot().model!.rows.length, 0);
  } finally {
    for (const reader of [warranty, parts, report, inventory, stock]) reader.suspend();
    s.runtime.uninstall();
  }
});

async function setup() {
  const client = createApiClient({ baseURL: 'https://hoa-nam-mock.invalid/api/v1' });
  const runtime = installPreviewMock(client, { approvedPreviewCommands: true, approvedAppEventFixture: true,
    businessPersistence: createMemoryBusinessPersistence(), persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(), recoveryPersistence: createMemoryBusinessPersistence() });
  await client.post('auth/login', PREVIEW_MOCK_CREDENTIALS); await client.post('auth/confirm', {});
  const product = createCatalogCreateAdapter('product', client, { available: true }), sku = createCatalogCreateAdapter('sku', client, { available: true });
  const epoch = (await product.readSnapshot()).epoch;
  const productRequest = { command: 'products.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S10-P', name: 'Actual S10 component', group: 'Phụ kiện' as const, unit: 'Cái' as const, status: 'active' as const } };
  const p = await product.execute(productRequest); await product.recovery.acknowledge(productRequest.commandId);
  const skuIds: string[] = [];
  for (const code of ['S10-A', 'S10-B']) {
    const request = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code, productId: p.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
    const result = await sku.execute(request); await sku.recovery.acknowledge(request.commandId); skuIds.push(result.receipt.entityId);
  }
  const adapter = createOperationalWebAdapter(client, { available: true, scope: 'S10' }), other = createOperationalWebAdapter(client, { available: true, scope: 'S10-setup' }), qa = createOperationalQaAdapter(client, { available: true, scope: 'S10-QA' });
  const request = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number): Promise<OperationalCommand<C>> => {
    const snapshot = await adapter.read(); return { commandId: crypto.randomUUID(), epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation, command, payload, ...(entityId ? { entityId, expectedVersion } : {}) };
  };
  const web = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number) => {
    const req = await request(command, payload, entityId, expectedVersion), result = await other.execute(req); await other.recovery.acknowledge(req.commandId); return result;
  };
  const app = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number) => {
    const fixture = runtime.appEventAdapters![command.startsWith('warranty.') ? 'P09' : command.startsWith('parts.') ? 'P19' : 'P04'];
    const req = await request(command, payload, entityId, expectedVersion), result = await fixture.execute(req); await fixture.recovery.acknowledge(req.commandId); return result;
  };
  const reset = async () => { const req = await request('scenario.reset-own', { confirmed: true, selectedSkuIds: skuIds }); await qa.execute(req); await qa.recovery.acknowledge(req.commandId); };
  await reset();
  for (const [i, tracking] of (['PRODUCT_SERIAL', 'COMPONENT_BOX'] as const).entries()) {
    await web('stock-profiles.create', { skuId: skuIds[i], tracking, observedSkuVersion: 1, observedProductVersion: 1 });
    const receipt = await web('inbound.create', { mode: tracking === 'PRODUCT_SERIAL' ? 'PRODUCT' : 'COMPONENT', sourceText: 'Source S10', referenceText: 'REF-S10' });
    const scan = await app('inbound.scan', { receiptId: receipt.receipt.entityId, clientScanId: crypto.randomUUID(), skuId: skuIds[i], tracking, physicalCode: tracking === 'PRODUCT_SERIAL' ? 'S10-SERIAL-A' : 'S10-BOX-B', ...(tracking === 'COMPONENT_BOX' ? { quantity: 10 } : {}) }, receipt.receipt.entityId, receipt.receipt.version);
    const submitted = await app('inbound.submit', { receiptId: receipt.receipt.entityId }, receipt.receipt.entityId, scan.receipt.version);
    await web('inbound.post', { receiptId: receipt.receipt.entityId }, receipt.receipt.entityId, submitted.receipt.version);
  }
  const intake = await app('warranty.intake', { identityMode: 'TEMP_ONLY', skuId: skuIds[0], physicalId: null, customerReportedIssue: 'Actual reported issue' });
  const diagnosed = await web('warranty.diagnose', { defectIds: [], technicianDiagnosis: 'Checking', expectedFinishDate: null }, intake.receipt.entityId, intake.receipt.version);
  const issue = await app('parts.create', { caseId: intake.receipt.entityId, observedCaseVersion: diagnosed.receipt.version });
  const save = async () => {
    const view = await adapter.read(), serial = view.physical[0], box = view.boxes[0], current = view.partsIssues.find(row => row.id === issue.receipt.entityId)!;
    return app('parts.save', { lines: [{ physicalCode: serial.data.physicalCode, observedVersion: serial.version }, { physicalCode: box.data.physicalCode, observedVersion: box.version, quantity: 2 }] }, current.id, current.version);
  };
  const post = async () => { const saved = await save(); return app('parts.post', { issueId: issue.receipt.entityId }, issue.receipt.entityId, saved.receipt.version); };
  const reverse = async () => {
    const view = await adapter.read(), row = view.partsIssues.find(row => row.id === issue.receipt.entityId)!;
    const reversed = await web('reversal.create', { originalIssueId: row.id, observedIssueVersion: row.version, returnedUnused: true, reasonText: 'Actual full unused return' });
    const attached = await web('reversal.attach-evidence', { label: 'Return record', mediaType: 'text/plain', bytes: [...new TextEncoder().encode('Actual test evidence for full unused return')] }, reversed.receipt.entityId, reversed.receipt.version);
    const confirmed = await web('reversal.confirm-return', { confirmed: true }, reversed.receipt.entityId, attached.receipt.version);
    return web('reversal.post', { reversalId: reversed.receipt.entityId }, reversed.receipt.entityId, confirmed.receipt.version);
  };
  const makeReader = (supplied: PartsReadAdapter = adapter) => createOperationalPartsReader(supplied, () => sku.readSnapshot());
  return { client, runtime, adapter, other, request, web, app, reset, makeReader, sku, skuIds, productId: p.receipt.entityId, caseId: intake.receipt.entityId, issueId: issue.receipt.entityId, save, post, reverse };
}

test('S10 actual P19 draft/save/post projects exact case/SKU/Product/physical lines and original negatives without a Web write', async () => {
  const s = await setup(); try {
    const c = s.makeReader(); await c.load(); let state = c.getSnapshot(); assert.equal(state.error, ''); const draft = state.model!.issues[0];
    assert.equal(draft.record.id, s.issueId); assert.equal(draft.record.data.status, 'DRAFT'); assert.deepEqual(draft.lines, []); assert.deepEqual(draft.events, []); assert.equal(draft.warrantyCase.id, s.caseId);
    const initialStock = (await s.adapter.read()).stock;
    await s.save(); await c.load(); state = c.getSnapshot(); const scanning = state.model!.issues[0]; assert.equal(scanning.record.data.status, 'SCANNING'); assert.equal(scanning.lines.length, 2); assert.deepEqual(scanning.events, []); assert.deepEqual((await s.adapter.read()).stock, initialStock);
    const current = (await s.adapter.read()).partsIssues[0]; await s.app('parts.post', { issueId: current.id }, current.id, current.version); const beforeRead = await s.adapter.read(); await c.load();
    const posted = c.getSnapshot().model!.issues[0]; assert.equal(posted.record.data.status, 'POSTED'); assert.deepEqual(posted.events.map(event => event.id), posted.record.data.postedEventIds); assert.deepEqual(posted.events.map(event => event.data.signedQuantity).sort(), [-1, -2]);
    assert.equal(posted.lines[0].sku.id, s.skuIds[0]); assert.equal(posted.lines[1].sku.id, s.skuIds[1]); assert.ok(posted.lines.every(line => line.product.id === s.productId && line.line.unit === 'Cái'));
    assert.equal(posted.lines[0].identities[0].id, beforeRead.physical[0].id); assert.equal(posted.lines[1].identities[0].id, beforeRead.boxes[0].id);
    assert.equal(posted.lines[0].identities[0].data.physicalCode, 'S10-SERIAL-A'); assert.equal(posted.lines[1].identities[0].data.physicalCode, 'S10-BOX-B');
    assert.deepEqual(await s.adapter.read(), beforeRead); const model = c.getSnapshot().model!; assert.equal(findOperationalPartsIssue(model, s.issueId, model.token)?.record.id, s.issueId);
    c.suspend(); const reopened = s.makeReader(createOperationalWebAdapter(s.client, { available: true, scope: 'S10' })); await reopened.load(); assert.deepEqual(reopened.getSnapshot().model, model);
  } finally { s.runtime.uninstall(); }
});

test('S10 actual S17 return leaves original issue/events immutable and shows exact separate positive compensation', async () => {
  const s = await setup(); try {
    await s.post(); const c = s.makeReader(); await c.load(); const original = structuredClone(c.getSnapshot().model!.issues[0]);
    await s.reverse(); await c.load(); const after = c.getSnapshot().model!.issues[0]; assert.deepEqual(after.record, original.record); assert.deepEqual(after.events, original.events); assert.equal(after.reversals.length, 1); assert.equal(after.reversals[0].record.data.status, 'POSTED');
    assert.deepEqual(after.reversals[0].events.map(event => event.data.originalEventId).sort(), original.events.map(event => event.id).sort()); assert.deepEqual(after.reversals[0].events.map(event => event.data.signedQuantity).sort(), [1, 2]);
    assert.equal(after.record.data.status, 'POSTED'); assert.deepEqual((await s.adapter.read()).stock.map(row => row.quantity).sort((a, b) => a - b), [1, 10]);
    c.suspend(); const next = s.makeReader(); await next.load(); assert.deepEqual(next.getSnapshot().model!.issues[0], after);
  } finally { s.runtime.uninstall(); }
});

test('S10 historical SERIAL issue remains readable after legitimate reversal and reissue of the same physical identity', async () => {
  const s = await setup(); try {
    await s.post(); const c = s.makeReader(); await c.load(); const original = structuredClone(c.getSnapshot().model!.issues[0]); await s.reverse();
    const view = await s.adapter.read(), cas = view.warrantyCases[0], serial = view.physical[0];
    const second = await s.app('parts.create', { caseId: cas.id, observedCaseVersion: cas.version });
    const saved = await s.app('parts.save', { lines: [{ physicalCode: serial.data.physicalCode, observedVersion: serial.version }] }, second.receipt.entityId, second.receipt.version);
    await s.app('parts.post', { issueId: second.receipt.entityId }, second.receipt.entityId, saved.receipt.version); await c.load(); assert.equal(c.getSnapshot().error, '');
    const model = c.getSnapshot().model!, historical = model.issues.find(row => row.record.id === s.issueId)!; assert.equal(model.issues.length, 2); assert.deepEqual(historical.record, original.record); assert.deepEqual(historical.events, original.events);
    assert.equal(historical.lines[0].identities[0].id, original.lines[0].identities[0].id); assert.equal(historical.lines[0].identities[0].data.issuedDocumentId, second.receipt.entityId);
    assert.equal(historical.events[0].data.documentId, s.issueId); assert.equal(historical.reversals[0].record.data.originalIssueId, s.issueId);
  } finally { s.runtime.uninstall(); }
});

test('S10 refuses missing FK, incomplete original negatives and mismatched compensation rather than displaying partial claims', async () => {
  const s = await setup(); try {
    await s.post(); await s.reverse(); const snapshot = await s.adapter.read(), catalog = await s.sku.readSnapshot();
    const corruptions: ((view: OperationalSnapshot) => void)[] = [
      view => { view.warrantyCases = []; }, view => { view.physical = []; }, view => { view.boxes = []; },
      view => { view.stockEvents = view.stockEvents.filter(event => event.id !== view.partsIssues[0].data.postedEventIds[0]); },
      view => { view.stockEvents.find(event => event.id === view.partsIssues[0].data.postedEventIds[0])!.data.signedQuantity = 1; },
      view => { view.stockEvents.find(event => event.id === view.reversals[0].data.postedCompensationEventIds[0])!.data.originalEventId = view.partsIssues[0].data.postedEventIds[1]; },
      view => { view.reversals[0].data.postedCompensationEventIds.pop(); },
    ];
    for (const corrupt of corruptions) {
      const c = s.makeReader({ ...s.adapter, read: async () => { const result = await s.adapter.read(); corrupt(result); return result; } }); await c.load();
      assert.equal(c.getSnapshot().model, null); assert.equal(c.getSnapshot().error, 'INCOMPLETE_PARTS_RELATIONSHIP');
    }
    assert.throws(() => projectOperationalParts(snapshot, { ...catalog, products: [] }), { code: 'INCOMPLETE_PARTS_RELATIONSHIP' });
    assert.deepEqual(await s.adapter.read(), snapshot);
  } finally { s.runtime.uninstall(); }
});

test('S10 ordinary refresh does not execute, retry or acknowledge any durable command intent', async () => {
  const s = await setup(); try {
    const req = await s.request('inbound.create', { mode: 'PRODUCT', sourceText: 'Unacknowledged other operation', referenceText: '' }); await s.adapter.execute(req);
    const held = await s.adapter.recovery.restore(), before = await s.adapter.read(); assert.equal(held.kind, 'committed');
    const c = s.makeReader(); await c.load(); await Promise.all([c.load(), c.load()]); c.suspend(); await c.resume();
    assert.equal(c.getSnapshot().error, ''); assert.deepEqual(await s.adapter.recovery.restore(), held); assert.deepEqual(await s.adapter.read(), before);
    assert.equal('execute' in c, false); assert.equal('retry' in c, false); assert.equal('acknowledge' in c, false);
  } finally { s.runtime.uninstall(); }
});

test('S10 refresh failure clears detail; restored read recovers same FK and expired session cannot retain data', async () => {
  const s = await setup(); try {
    let failRead = false;
    const c = s.makeReader({ ...s.adapter, read: () => failRead ? Promise.reject(new Error('offline')) : s.adapter.read() }); await c.load(); const before = c.getSnapshot().model!;
    failRead = true; await c.load(); assert.equal(c.getSnapshot().model, null); assert.equal(c.getSnapshot().error, 'READ_FAILED'); assert.equal(findOperationalPartsIssue(c.getSnapshot().model, s.issueId, before.token), null);
    failRead = false; await c.load(); assert.equal(c.getSnapshot().model!.issues[0].record.id, s.issueId);
    await s.client.post('auth/logout', {}); await c.load(); assert.equal(c.getSnapshot().model, null); assert.ok(c.getSnapshot().error);
  } finally { s.runtime.uninstall(); }
});

test('S10 navigation fences an in-flight read and remount reads current generation', async () => {
  const s = await setup(); try {
    let release!: () => void, entered!: () => void; const hold = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
    const c = s.makeReader({ ...s.adapter, read: async () => { const result = await s.adapter.read(); entered(); await hold; return result; } });
    const pending = c.load(); await started; c.suspend(); await s.reset(); release(); await pending; assert.equal(c.getSnapshot().model, null);
    const current = s.makeReader(); await current.load(); assert.equal(current.getSnapshot().error, ''); assert.deepEqual(current.getSnapshot().model!.issues, []);
  } finally { s.runtime.uninstall(); }
});

test('S10 reads operations last and rejects prior-generation detail identity after reset during catalog lookup', async () => {
  const s = await setup(); try {
    const previous = await s.adapter.read(), originalModel = projectOperationalParts(previous, await s.sku.readSnapshot()); let resetOnce = true;
    const c = createOperationalPartsReader(s.adapter, async () => { const catalog = await s.sku.readSnapshot(); if (resetOnce) { resetOnce = false; await s.reset(); } return catalog; });
    await c.load(); const model = c.getSnapshot().model!; assert.equal(model.token.generation, originalModel.token.generation + 1); assert.deepEqual(model.issues, []); assert.equal(findOperationalPartsIssue(model, s.issueId, originalModel.token), null);
  } finally { s.runtime.uninstall(); }
});

test('S10 rejects direct mixed revisions and rereads fresh pairs after real catalog Create and P19 Save between reads', async () => {
  const s = await setup(); try {
    const before = await s.adapter.read(), beforeCatalog = await s.sku.readSnapshot();
    let reads = 0, createdSkuId = '', returnedCatalog = beforeCatalog;
    const c = createOperationalPartsReader(s.adapter, async () => {
      reads++; const catalog = await s.sku.readSnapshot(); returnedCatalog = catalog;
      if (reads === 1) {
        const request = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch: catalog.epoch,
          payload: { code: 'S10-CONCURRENT', productId: s.productId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
        const outcome = await s.sku.execute(request); await s.sku.recovery.acknowledge(request.commandId); createdSkuId = outcome.receipt.entityId;
        await s.save();
        const advanced = await s.adapter.read();
        assert.throws(() => projectOperationalParts(advanced, catalog), { code: 'INCOMPLETE_PARTS_RELATIONSHIP' });
      }
      return catalog;
    });
    await c.load(); const model = c.getSnapshot().model!, current = await s.adapter.read();
    assert.equal(c.getSnapshot().error, ''); assert.equal(reads, 2); assert.equal(model.snapshotRevision, current.snapshotRevision);
    assert.equal(returnedCatalog.snapshotRevision, current.snapshotRevision); assert.ok(returnedCatalog.skus.some(row => row.id === createdSkuId));
    assert.equal(model.issues[0].record.id, s.issueId); assert.equal(model.issues[0].record.data.status, 'SCANNING'); assert.equal(model.issues[0].lines.length, 2);
    assert.deepEqual(model.issues[0].lines.map(line => line.sku.id), s.skuIds); assert.deepEqual(current.stock, before.stock);
    assert.throws(() => projectOperationalParts(current, beforeCatalog), { code: 'INCOMPLETE_PARTS_RELATIONSHIP' });
  } finally { s.runtime.uninstall(); }
});

test('S10 sustained real catalog writes exhaust exactly three fresh pairs, clear stale detail and recover on stable reads', async () => {
  const s = await setup(); try {
    let skew = false, catalogReads = 0, operationReads = 0;
    const c = createOperationalPartsReader({ ...s.adapter, read: async () => { operationReads++; return s.adapter.read(); } }, async () => {
      catalogReads++; const catalog = await s.sku.readSnapshot();
      if (skew) {
        const request = { command: 'skus.create' as const, commandId: crypto.randomUUID(), epoch: catalog.epoch,
          payload: { code: `S10-SKEW-${catalogReads}`, productId: s.productId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
        await s.sku.execute(request); await s.sku.recovery.acknowledge(request.commandId);
      }
      return catalog;
    });
    await c.load(); const original = c.getSnapshot().model!; assert.equal(original.issues[0].record.id, s.issueId);
    skew = true; catalogReads = 0; operationReads = 0; await c.load();
    assert.equal(catalogReads, 3); assert.equal(operationReads, 3); assert.equal(c.getSnapshot().busy, false);
    assert.equal(c.getSnapshot().model, null); assert.equal(c.getSnapshot().error, 'INCOMPLETE_PARTS_RELATIONSHIP');
    assert.equal(findOperationalPartsIssue(c.getSnapshot().model, s.issueId, original.token), null);
    skew = false; await c.load(); assert.equal(c.getSnapshot().error, ''); assert.equal(c.getSnapshot().model!.issues[0].record.id, s.issueId);
    assert.equal(c.getSnapshot().model!.snapshotRevision, (await s.adapter.read()).snapshotRevision);
  } finally { s.runtime.uninstall(); }
});
