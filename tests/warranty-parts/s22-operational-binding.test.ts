import test from 'node:test';
import assert from 'node:assert/strict';
import { strFromU8, unzipSync } from 'fflate';
import { APPROVED_DEFECTS_HANDLERS } from '../../src/features/S02/defects-approved-policy';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import { createPreviewBusinessReads } from '../../src/preview-mock/business-reads';
import { createApprovedPreviewBinding } from '../../src/preview-mock/approved-business-policy';
import type { OperationalCommand, OperationalCommandName, OperationalPayloads, OperationalSnapshot } from '../../src/contracts/operational-preview';
import { exportOperationalReport, vietnamDate, vietnamPeriod } from '../../src/operations/operational-reports';
import { createWarrantyReportReader, defaultWarrantyReportPeriod, findPinnedWarrantyCase, projectWarrantyReport, type WarrantyReportReadAdapter } from '../../src/features/S22/warranty-operational-binding';
import { getBusinessDateWindow } from '../../src/shared/date-policy';

async function setup() {
  let confirmed = true, session = 0;
  const binding = createApprovedPreviewBinding({ recoveryActor: async () => ({ key: 'preview:ducquang', confirmed, expiresAt: Date.now() + 600000 }),
    captureRecoveryReadFence: () => { const expected = session; return () => { if (session !== expected) throw Object.assign(new Error(), { code: 'SESSION_EXPIRED' }); }; } }, APPROVED_DEFECTS_HANDLERS);
  const business = createPreviewBusinessReads(createMemoryBusinessPersistence(), binding), epoch = (await business.readSnapshot()).epoch;
  const create = (command: string, payload: unknown) => business.executeCommand({ command, commandId: crypto.randomUUID(), epoch, payload });
  const product = await create('products.create', { code: 'S22-P', name: 'S22 actual product', group: 'Phụ kiện', unit: 'Cái', status: 'active' });
  const sku = await create('skus.create', { code: 'S22-A', productId: product.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' });
  const skuId = sku.receipt.entityId, productId = product.receipt.entityId;
  const web = business.operational('WEB'), qa = business.operational('QA'), inbound = business.operational('APP_P04'), outbound = business.operational('APP_P05'), intake = business.operational('APP_P09'), parts = business.operational('APP_P19');
  const request = async <C extends OperationalCommandName>(command: C, payload: OperationalPayloads[C], entityId?: string, expectedVersion?: number): Promise<OperationalCommand<C>> => {
    const view = await web.read(); return { command, commandId: crypto.randomUUID(), epoch, scenarioId: view.token.scenarioId, generation: view.token.generation, payload, ...(entityId ? { entityId, expectedVersion } : {}) };
  };
  const reset = async () => qa.execute(await request('scenario.reset-own', { confirmed: true, selectedSkuIds: [skuId] })); await reset();
  await web.execute(await request('stock-profiles.create', { skuId, tracking: 'PRODUCT_SERIAL', observedSkuVersion: 1, observedProductVersion: 1 }));
  const receipt = await web.execute(await request('inbound.create', { mode: 'PRODUCT', sourceText: 'S22 source', referenceText: '' })); let version = receipt.receipt.version;
  for (let i = 1; i <= 4; i++) version = (await inbound.execute(await request('inbound.scan', { receiptId: receipt.receipt.entityId, clientScanId: crypto.randomUUID(), skuId, tracking: 'PRODUCT_SERIAL', physicalCode: `S22-A00${i}` }, receipt.receipt.entityId, version))).receipt.version;
  const submission = await inbound.execute(await request('inbound.submit', { receiptId: receipt.receipt.entityId }, receipt.receipt.entityId, version));
  await web.execute(await request('inbound.post', { receiptId: receipt.receipt.entityId }, receipt.receipt.entityId, submission.receipt.version));
  const recipient = await create('recipients.create', { code: 'S22-R', name: 'Recipient', type: 'Khách lẻ', market: 'Miền Nam', area: 'Area', address: 'Address', contact: '', phone: '', status: 'active' });
  const out = await outbound.execute(await request('outbound.create', { recipientId: recipient.receipt.entityId, observedRecipientVersion: 1, requestedLines: [{ skuId, quantity: 3, observedSkuVersion: 1, observedProductVersion: 1 }] })); version = out.receipt.version;
  for (let i = 1; i <= 3; i++) version = (await outbound.execute(await request('outbound.scan', { outboundId: out.receipt.entityId, clientScanId: crypto.randomUUID(), physicalCode: `S22-A00${i}` }, out.receipt.entityId, version))).receipt.version;
  const sent = await outbound.execute(await request('outbound.submit', { outboundId: out.receipt.entityId }, out.receipt.entityId, version));
  const ready = await web.execute(await request('outbound.receive', { outboundId: out.receipt.entityId }, out.receipt.entityId, sent.receipt.version)); await web.execute(await request('outbound.post', { outboundId: out.receipt.entityId }, out.receipt.entityId, ready.receipt.version));
  const view = await web.read(), physical = view.physical.filter(row => row.data.status === 'ISSUED'), cases: string[] = [], defects: string[] = [];
  const addCase = async (physicalId: string | null = null, text = 'New customer report') => intake.execute(await request('warranty.intake', { identityMode: physicalId ? 'SERIAL' : 'TEMP_ONLY', skuId, physicalId, customerReportedIssue: text }));
  for (let i = 0; i < 3; i++) cases.push((await addCase(i ? physical.find(row => row.data.physicalCode === `S22-A00${i + 1}`)!.id : null, `Customer report C${i + 1}\nActual intake`)).receipt.entityId);
  for (let i = 1; i <= 2; i++) defects.push((await create('defects.create', { code: `S22-D${i}`, name: `Defect ${i}`, description: 'Actual defects', status: 'active' })).receipt.entityId);
  const date = vietnamDate(new Date().toISOString());
  for (const i of [0, 2]) {
    version = (await web.execute(await request('warranty.diagnose', { defectIds: defects, technicianDiagnosis: `Diagnosis C${i + 1}`, expectedFinishDate: date }, cases[i], 1))).receipt.version;
    version = (await web.execute(await request('warranty.transition', { state: 'REPAIRING' }, cases[i], version))).receipt.version;
    if (i === 2) await web.execute(await request('warranty.transition', { state: 'REPAIRED' }, cases[i], version));
  }
  const current = await web.read(), case1 = current.warrantyCases.find(row => row.id === cases[0])!;
  for (let i = 0; i < 2; i++) await parts.execute(await request('parts.create', { caseId: case1.id, observedCaseVersion: case1.version }));
  const period = { from: date, to: date }, asOf = new Date(Date.now() + 86400000).toISOString();
  const adapter: WarrantyReportReadAdapter = { available: true, read: () => web.read() };
  const make = (readAdapter = adapter, readCatalog = () => business.readCatalogSnapshot(), exporter = exportOperationalReport) => createWarrantyReportReader(readAdapter, readCatalog, () => asOf, exporter);
  return { business, web, create, productId, skuId, cases, defects, date, period, asOf, adapter, make, reset, addCase, revoke() { confirmed = false; session++; } };
}

test('S22 actual three distinct cases pin3/1/1/1/2/1 with real labels, source text, timeline and no defects/parts row inflation', async () => {
  const s = await setup(), before = await s.business.readSnapshot(), c = s.make(); await c.load(s.period); const state = c.getSnapshot(), model = state.model!;
  assert.equal(state.error, ''); assert.deepEqual(model.report.summary, { total: 3, complete: 1, processing: 1, waiting: 1, incomplete: 2, overdue: 1 });
  assert.deepEqual(model.rows.map(row => row.id).sort(), [...s.cases].sort()); assert.equal(model.rows.length, 3);
  const [c1, c2, c3] = s.cases.map(id => model.rows.find(row => row.id === id)!);
  assert.equal(c1.state, 'REPAIRING'); assert.equal(c1.overdue, true); assert.equal(c1.defectIds.length, 2); assert.equal(c1.partIssueIds.length, 2);
  assert.equal(c1.customerReportedIssue, 'Customer report C1\nActual intake'); assert.equal(c1.technicianDiagnosis, 'Diagnosis C1'); assert.equal(c1.physicalCode, null); assert.ok(c1.temporaryIdentity);
  assert.deepEqual(c1.timeline.map(row => row.state), ['RECEIVED', 'CHECKING', 'REPAIRING']); assert.ok(c1.timeline.every(row => row.actor === 'preview:ducquang'));
  assert.equal(c2.state, 'RECEIVED'); assert.equal(c2.expectedFinishDate, null); assert.equal(c2.overdue, false); assert.equal(c2.technicianDiagnosis, ''); assert.equal(c2.physicalCode, 'S22-A002');
  assert.equal(c3.state, 'REPAIRED'); assert.equal(c3.overdue, false); assert.equal(c3.physicalCode, 'S22-A003');
  assert.ok(model.rows.every(row => row.skuId === s.skuId && row.skuCode === 'S22-A' && row.productName === 'S22 actual product'));
  assert.ok(Object.isFrozen(model.report) && Object.isFrozen(model.rows) && Object.isFrozen(c1.timeline)); assert.deepEqual(await s.business.readSnapshot(), before);
  c.suspend(); const remount = s.make(); await remount.load(s.period); assert.deepEqual(remount.getSnapshot().model, model);
});

test('S22 initial and refreshed periods include earlier session cases; explicit user period stays selected', async () => {
  const s = await setup(), c = s.make();
  const before = await s.business.readSnapshot();
  await c.resume();
  assert.equal(c.getSnapshot().error, '');
  assert.deepEqual(c.getSnapshot().period, { from: s.date, to: vietnamDate(s.asOf) });
  assert.equal(c.getSnapshot().model!.report.summary.total, 3, 'opening the report the next day must retain current-session cases');
  await c.load(); assert.equal(c.getSnapshot().model!.report.summary.total, 3);
  const tomorrow = vietnamDate(s.asOf);
  await c.load({ from: tomorrow, to: tomorrow });
  assert.equal(c.getSnapshot().model!.report.summary.total, 0);
  await c.load(); assert.deepEqual(c.getSnapshot().period, { from: tomorrow, to: tomorrow });
  assert.equal(c.getSnapshot().model!.report.summary.total, 0, 'focus refresh must not replace an explicit date selection');
  assert.deepEqual(await s.business.readSnapshot(), before);
  c.suspend();
});

test('S22 automatic period follows Vietnam midnight and clamps only its derived start to the shared 90-day window', async () => {
  const s = await setup(), snapshot = await s.web.read();
  snapshot.scenario!.data.startedAt = '2026-10-24T17:00:00Z';
  assert.deepEqual(defaultWarrantyReportPeriod(snapshot, '2026-10-26T16:59:59Z'), { from: '2026-10-25', to: '2026-10-26' });
  assert.deepEqual(defaultWarrantyReportPeriod(snapshot, '2026-10-26T17:00:00Z'), { from: '2026-10-25', to: '2026-10-27' });
  snapshot.scenario!.data.startedAt = '2020-01-01T00:00:00Z';
  const window = getBusinessDateWindow({ now: new Date(s.asOf) });
  assert.deepEqual(defaultWarrantyReportPeriod(snapshot, s.asOf), { from: window.minDate, to: window.today });
  snapshot.scenario = null;
  assert.deepEqual(defaultWarrantyReportPeriod(snapshot, s.asOf), { from: window.today, to: window.today });
  let reads = 0;
  const c = s.make({ available: true, read: async () => { reads++; return s.web.read(); } });
  await c.load({ from: '2000-01-01', to: '2000-01-01' });
  assert.equal(c.getSnapshot().error, 'INVALID_PERIOD'); assert.equal(c.getSnapshot().model, null); assert.equal(reads, 0);
  c.suspend();
});

test('S22 real concurrent catalog creation retries coherent pairs; continuous revision skew fails closed after3', async () => {
  const s = await setup(); let reads = 0, skew = false;
  const readCatalog = async () => { const catalog = await s.business.readCatalogSnapshot(); reads++;
    if (reads === 1 || skew) await s.create('skus.create', { code: `S22-NEW-${reads}`, productId: s.productId, observedProductVersion: 1, barcode: null, status: 'active' });
    return catalog;
  };
  const c = s.make(s.adapter, readCatalog); await c.load(s.period); assert.equal(reads, 2); assert.equal(c.getSnapshot().error, '');
  const snapshot = await s.web.read(), catalog = await s.business.readCatalogSnapshot(); assert.throws(() => projectWarrantyReport(snapshot, { ...catalog, snapshotRevision: catalog.snapshotRevision - 1 }, { ...s.period, asOf: s.asOf }), { code: 'STALE_SNAPSHOT' });
  skew = true; const previous = reads; await c.load(s.period); assert.equal(reads - previous, 3); assert.equal(c.getSnapshot().model, null); assert.equal(c.getSnapshot().error, 'STALE_SNAPSHOT'); assert.equal(await c.exportXlsx(), null);
});

test('S22 frozen intake Product/SKU labels cannot be replaced by current labels; ID/version mismatches reject', async () => {
  const s = await setup(), snapshot = await s.web.read(), catalog = await s.business.readCatalogSnapshot(), query = { ...s.period, asOf: s.asOf };
  // Deliberately different reader labels exercise the display boundary; no master update contract is invented.
  const relabeled = structuredClone(catalog); relabeled.skus[0].code = 'NEW-CURRENT-LABEL'; relabeled.skus[0].version++;
  relabeled.products[0].name = 'New current product name'; relabeled.products[0].version++;
  const model = projectWarrantyReport(snapshot, relabeled, query);
  assert.ok(model.rows.every(row => row.skuCode === 'S22-A' && row.productName === 'S22 actual product'));
  assert.ok(model.rows.every(row => row.skuCode === model.report.cases.find(item => item.id === row.id)!.skuCode && row.productName === model.report.cases.find(item => item.id === row.id)!.productName));
  const exportXml = strFromU8(unzipSync(await exportOperationalReport(model.report, 'cases'))['xl/worksheets/sheet1.xml']);
  assert.ok(exportXml.includes('S22 actual product') && exportXml.includes('S22-A')); assert.ok(!exportXml.includes('NEW-CURRENT-LABEL') && !exportXml.includes('New current product name'));
  const staleVersion = structuredClone(catalog); staleVersion.skus[0].version = 0;
  assert.throws(() => projectWarrantyReport(snapshot, staleVersion, query), { code: 'INCOMPLETE_POPULATION' });
  const wrongProduct = structuredClone(catalog); wrongProduct.skus[0].productId = 'wrong-product';
  assert.throws(() => projectWarrantyReport(snapshot, wrongProduct, query), { code: 'INCOMPLETE_POPULATION' });
});

test('S22 selected case retains its scope through refresh/error and resolves new pin only in the same generation', async () => {
  const s = await setup(); let failRead = false;
  const c = s.make({ ...s.adapter, read: () => failRead ? Promise.reject(new Error('offline')) : s.web.read() });
  await c.load(s.period); const old = c.getSnapshot().model!, selection = { id: s.cases[0], fence: old.report.token };
  assert.equal(findPinnedWarrantyCase(old, selection)?.id, selection.id);
  await s.addCase(); const refresh = c.load(s.period); assert.equal(findPinnedWarrantyCase(c.getSnapshot().model, selection), null); await refresh;
  assert.notEqual(c.getSnapshot().model!.report.sha256, old.report.sha256); assert.equal(findPinnedWarrantyCase(c.getSnapshot().model, selection)?.id, selection.id);
  failRead = true; await c.load(s.period); assert.equal(c.getSnapshot().error, 'READ_FAILED'); assert.equal(findPinnedWarrantyCase(c.getSnapshot().model, selection), null);
  failRead = false; await c.load(s.period); assert.equal(findPinnedWarrantyCase(c.getSnapshot().model, selection)?.id, selection.id);
  await c.load({ from: '2000-01-01', to: '2000-01-01' }); assert.equal(findPinnedWarrantyCase(c.getSnapshot().model, selection), null);
  await s.reset(); await c.load(s.period); assert.equal(findPinnedWarrantyCase(c.getSnapshot().model, selection), null); assert.equal(selection.fence.generation, old.report.token.generation);
});

test('S22 incomplete and tampered canonical populations, missing FK and wrong actor never publish partial summaries', async () => {
  const s = await setup();
  for (const corrupt of [
    (v: OperationalSnapshot) => { v.warrantyCases.pop(); }, (v: OperationalSnapshot) => { v.caseEvents.pop(); }, (v: OperationalSnapshot) => { v.stockEvents.pop(); },
    (v: OperationalSnapshot) => { v.warrantyCases[0].data.customerReportedIssue = 'tampered'; }, (v: OperationalSnapshot) => { v.actorKey = 'foreign'; },
  ]) {
    const c = s.make({ ...s.adapter, read: async () => { const v = await s.web.read(); corrupt(v); return v; } }); await c.load(s.period); assert.equal(c.getSnapshot().model, null); assert.ok(c.getSnapshot().error); assert.equal(await c.exportXlsx(), null);
  }
  const c = s.make(s.adapter, async () => ({ ...await s.business.readCatalogSnapshot(), skus: [] })); await c.load(s.period); assert.equal(c.getSnapshot().error, 'INCOMPLETE_POPULATION');
});

test('S22 Vietnam period includes full local days and asOf never pretends a historical state from current snapshot', async () => {
  const s = await setup(), c = s.make();
  assert.deepEqual(vietnamPeriod('2026-10-20', '2026-10-20'), { fromInclusive: Date.parse('2026-10-19T17:00:00Z'), toExclusive: Date.parse('2026-10-20T17:00:00Z') });
  assert.equal(vietnamDate('2026-10-20T16:59:59.999Z'), '2026-10-20'); assert.equal(vietnamDate('2026-10-20T17:00:00Z'), '2026-10-21');
  await c.load(s.period, new Date().toISOString()); assert.equal(c.getSnapshot().model!.report.summary.overdue, 0);
  await c.load(s.period, s.asOf); assert.equal(c.getSnapshot().model!.report.summary.overdue, 1);
  // The current shared date policy rejects periods outside its rolling 90-day window.
  await c.load({ from: '2000-01-01', to: '2000-01-01' }, s.asOf); assert.equal(c.getSnapshot().error, 'INVALID_PERIOD'); assert.equal(c.getSnapshot().model, null);
  for (const period of [{ from: '2026-02-30', to: '2026-03-01' }, { from: '2026-10-21', to: '2026-10-20' }]) { await c.load(period); assert.equal(c.getSnapshot().error, 'INVALID_PERIOD'); assert.equal(c.getSnapshot().model, null); }
  await c.load(s.period, '2000-01-01T00:00:00Z'); assert.equal(c.getSnapshot().error, 'AS_OF_BEFORE_SNAPSHOT'); assert.equal(c.getSnapshot().model, null);
});

test('S22 Excel exports exact reviewed cases/query/token/hash without hidden reads or repin after same-generation changes', async () => {
  const s = await setup(); let reads = 0;
  const c = s.make({ ...s.adapter, read: async () => { reads++; return s.web.read(); } }); await c.load(s.period); const model = c.getSnapshot().model!;
  const first = await c.exportXlsx(); assert.ok(first); assert.equal(first.report, model.report); const xml = strFromU8(unzipSync(first.bytes)['xl/worksheets/sheet1.xml']);
  for (const id of s.cases) assert.ok(xml.includes(id)); assert.ok(xml.includes(model.report.sha256)); assert.ok(xml.includes(model.report.token.scenarioId!)); assert.ok(xml.includes(s.asOf)); assert.ok(xml.includes(s.date));
  for (const row of model.report.cases) {
    assert.equal(row.skuCode, 'S22-A'); assert.equal(row.productId, s.productId); assert.equal(row.productCode, 'S22-P'); assert.equal(row.productName, 'S22 actual product'); assert.equal(row.unit, 'Cái');
    assert.equal(row.productSnapshot.skuId, s.skuId); assert.equal(row.productSnapshot.skuVersion, 1); assert.equal(row.productSnapshot.productVersion, 1);
  }
  for (const value of ['skuCode', 'productId', 'productCode', 'productName', 'unit', 'productSnapshot', 'S22-A', 'S22-P', 'S22 actual product', 'Cái']) assert.ok(xml.includes(value), value);
  await s.addCase(); const second = await c.exportXlsx(); assert.equal(reads, 1); assert.deepEqual(second!.bytes, first.bytes); assert.equal(c.getSnapshot().model, model);
  await c.load(s.period); assert.equal(c.getSnapshot().model!.report.summary.total, 4); assert.notEqual(c.getSnapshot().model!.report.sha256, model.report.sha256);
  const corrupt = structuredClone(model.report); corrupt.cases.pop(); await assert.rejects(exportOperationalReport(corrupt, 'cases'), { code: 'INCOMPLETE_POPULATION' });
  const corruptLabel = structuredClone(model.report); corruptLabel.cases[0].productName = 'Tampered export label'; await assert.rejects(exportOperationalReport(corruptLabel, 'cases'), { code: 'INCOMPLETE_POPULATION' });
  const failing = s.make(s.adapter, () => s.business.readCatalogSnapshot(), async () => { throw new Error('export failed'); }); await failing.load(s.period); assert.equal(await failing.exportXlsx(), null); assert.equal(failing.getSnapshot().error, 'EXPORT_FAILED');
});

test('S22 reset and refresh invalidate in-flight export; new generation is empty while prior pin remains immutable', async () => {
  const s = await setup(); let release!: () => void, entered!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
  const c = s.make(s.adapter, () => s.business.readCatalogSnapshot(), async (report, kind) => { entered(); await hold; return exportOperationalReport(report, kind); });
  await c.load(s.period); const original = c.getSnapshot().model!, copy = structuredClone(original.report), exporting = c.exportXlsx(); await started;
  await s.reset(); const loading = c.load(s.period); assert.equal(c.getSnapshot().model, null); await loading; release(); assert.equal(await exporting, null);
  assert.equal(c.getSnapshot().model!.report.summary.total, 0); assert.equal(c.getSnapshot().model!.report.token.generation, original.report.token.generation + 1); assert.deepEqual(original.report, copy);
});

test('S22 navigation fences old reads; failed/unconfirmed reads clear accepted data and prevent export', async () => {
  const s = await setup(); let release!: () => void, entered!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
  const c = s.make({ ...s.adapter, read: async () => { const view = await s.web.read(); entered(); await hold; return view; } }); const reading = c.load(s.period); await started;
  c.suspend(); await s.reset(); release(); await reading; assert.equal(c.getSnapshot().model, null);
  const d = s.make(); await d.load(s.period); assert.equal(d.getSnapshot().model!.report.summary.total, 0); s.revoke(); await d.load(s.period); assert.equal(d.getSnapshot().model, null); assert.ok(d.getSnapshot().error); assert.equal(await d.exportXlsx(), null);
  const failed = s.make({ ...s.adapter, read: async () => { throw new Error('offline'); } }); await failed.load(s.period); assert.equal(failed.getSnapshot().model, null);
});
