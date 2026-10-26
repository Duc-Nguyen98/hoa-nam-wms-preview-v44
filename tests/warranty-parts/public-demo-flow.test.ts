import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter } from '../../src/data/http/operational-preview-adapter';
import { createBusinessHttpAdapters } from '../../src/data/http/business-adapters';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import { PUBLIC_DEMO_LOGIN } from '../../src/preview-mock/public-demo-login';
import { createPublicDemoSetup } from '../../src/preview-mock/public-demo-setup';
import { createWarrantyBinding } from '../../src/features/S09/warranty-binding';
import { createOperationalPartsReader } from '../../src/features/S10/parts-operational-binding';
import { createWarrantyReportReader } from '../../src/features/S22/warranty-operational-binding';
import { createOperationalInventoryBinding } from '../../src/features/S16/inventory-binding';
import { createStockReportBinding } from '../../src/features/S21/stock-report-binding';
import type { OperationalSnapshot } from '../../src/contracts/operational-preview';

const now = () => '2026-10-26T10:00:00+07:00';
async function fixture() {
  const client = createApiClient({ baseURL: 'https://public-warranty.test/api/v1' });
  const runtime = installPreviewMock(client, {
    origin: 'https://public-warranty.test', approvedPreviewCommands: true,
    approvedAppEventFixture: true, credentialProfile: PUBLIC_DEMO_LOGIN,
    businessNow: () => Date.parse(now()), persistence: createMemoryPersistence(),
    sessionToken: createMemorySessionToken(), businessPersistence: createMemoryBusinessPersistence(),
    recoveryPersistence: createMemoryBusinessPersistence(), notificationPersistence: createMemoryPersistence(),
  });
  await client.post('auth/login', { username: 'demo', password: 'HoaNamDemo@2026' });
  await client.post('auth/confirm', {});
  const web = createOperationalWebAdapter(client, { available: true, scope: 'demo-flow-audit' });
  const catalog = createCatalogCreateAdapter('sku', client, { available: true });
  const setup = createPublicDemoSetup(client, () => runtime);
  return { client, runtime, web, catalog, setup };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
async function quantities(f: Fixture, snapshot: OperationalSnapshot) {
  const catalog = await f.catalog.readSnapshot();
  return Object.fromEntries(catalog.skus.map(sku => [sku.code, snapshot.stock.find(row => row.skuId === sku.id)?.quantity ?? 0]));
}
async function verifyScreens(f: Fixture) {
  const before = await f.web.read(), labels = () => f.catalog.readSnapshot();
  const warranty = createWarrantyBinding(f.web, createBusinessHttpAdapters(f.client).S02);
  const parts = createOperationalPartsReader(f.web, labels);
  const report = createWarrantyReportReader(f.web, labels, now);
  const inventory = createOperationalInventoryBinding(f.web, labels, now);
  const stock = createStockReportBinding(f.web, labels, now);
  const readers = [warranty, parts, report, inventory, stock];
  try {
    for (const reader of readers) { await reader.load(); assert.equal(reader.getSnapshot().error, ''); }
    assert.equal(before.warrantyCases.length, 1);
    const cas = before.warrantyCases[0], issue = before.partsIssues[0];
    assert.equal(cas.data.state, 'RETURNED');
    assert.equal(cas.data.identityMode, 'SERIAL');
    assert.equal(before.physical.find(row => row.id === cas.data.physicalId)?.data.physicalCode, 'PUBLIC-DEMO-SERIAL-0012');
    assert.equal(cas.data.defectIds.length, 1);
    assert.ok(cas.data.expectedFinishDate);
    assert.equal(before.partsIssues.length, 1); assert.equal(issue.data.status, 'POSTED');
    assert.equal(issue.data.caseId, cas.id); assert.equal(issue.data.lines.length, 1);
    assert.equal(issue.data.lines[0].quantity, 2);
    const event = before.stockEvents.find(row => row.id === issue.data.postedEventIds[0])!;
    assert.equal(event.data.eventType, 'PARTS_ISSUE_POST'); assert.equal(event.data.signedQuantity, -2);
    assert.equal(event.data.documentId, issue.id); assert.equal(issue.data.postedEventIds.length, 1);
    assert.deepEqual(warranty.getSnapshot().snapshot!.warrantyCases[0], cas);
    assert.equal(parts.getSnapshot().model!.issues[0].warrantyCase.id, cas.id);
    const model = report.getSnapshot().model!;
    assert.equal(model.rows[0].id, cas.id); assert.equal(model.rows[0].state, 'RETURNED');
    assert.deepEqual(model.rows[0].partIssueIds, [issue.id]);
    assert.deepEqual(model.rows[0].timeline.map(row => row.state), ['RECEIVED', 'CHECKING', 'REPAIRING', 'REPAIRED', 'RETURNED']);
    assert.equal(model.report.summary.total, 1); assert.equal(model.report.summary.complete, 1);
    assert.equal(model.report.summary.processing, 0); assert.equal(model.report.summary.waiting, 0);
    const balance = stock.getSnapshot().model!.rows.find(row => row.skuCode === 'PUBLIC-DEMO-SKU-B')!;
    assert.equal(balance.closing, 16); assert.equal(balance.parts, 2); assert.equal(balance.reversals, 0);
    assert.equal(inventory.getSnapshot().model!.rows.find(row => row.skuCode === 'PUBLIC-DEMO-SKU-B')!.quantity, 16);
    assert.deepEqual(await quantities(f, before), { 'PUBLIC-DEMO-SKU-A': 1, 'PUBLIC-DEMO-SKU-B': 16 });
    const box = before.boxes.find(row => row.data.physicalCode === 'PUBLIC-DEMO-BOX-0010')!;
    assert.equal(before.stockEvents.filter(row => row.data.boxId === box.id).reduce((sum, row) => sum + row.data.signedQuantity, 0), 10);
    assert.deepEqual(await f.web.read(), before, 'All five screen reads preserve documents, stock and timeline');
  } finally { readers.forEach(reader => reader.suspend()); }
}

test('public demo full warranty flow uses one issued serial and two parts; all five screens agree and reload is idempotent', async () => {
  const f = await fixture();
  const checkpoints: { command: string; before: OperationalSnapshot; after: OperationalSnapshot }[] = [];
  const app = f.runtime.appEventAdapters!.P19, execute = app.execute;
  app.execute = async request => {
    const before = await f.web.read(), result = await execute(request), after = await f.web.read();
    checkpoints.push({ command: request.command, before, after }); return result;
  };
  try {
    assert.equal(await f.setup.ready(), false);
    await f.setup.initialize(); assert.equal(await f.setup.ready(), true);
    assert.deepEqual(checkpoints.map(row => row.command), ['parts.create', 'parts.save', 'parts.post']);
    for (const checkpoint of checkpoints) {
      assert.equal((await quantities(f, checkpoint.before))['PUBLIC-DEMO-SKU-B'], 18);
      assert.equal((await quantities(f, checkpoint.after))['PUBLIC-DEMO-SKU-B'], checkpoint.command === 'parts.post' ? 16 : 18);
    }
    await verifyScreens(f);
    const before = await f.web.read();
    await createPublicDemoSetup(f.client, () => f.runtime).initialize();
    assert.deepEqual(await f.web.read(), before);
    assert.equal(checkpoints.length, 3, 'No additional App commands on repeat setup');
  } finally { f.runtime.uninstall(); }
});

test('v45 session upgrades additively and a lost parts-post response resumes without duplicate deduction', async () => {
  const f = await fixture();
  const intake = f.runtime.appEventAdapters!.P09, originalIntake = intake.execute;
  let stopBeforeIntake = true;
  intake.execute = async request => {
    if (stopBeforeIntake) throw new Error('Simulated stop at v45 data boundary');
    return originalIntake(request);
  };
  const parts = f.runtime.appEventAdapters!.P19, originalParts = parts.execute;
  let loseResponse = true;
  parts.execute = async request => {
    const result = await originalParts(request);
    if (request.command === 'parts.post' && loseResponse) { loseResponse = false; throw new Error('Simulated lost committed response'); }
    return result;
  };
  try {
    await assert.rejects(f.setup.initialize());
    const v45 = await f.web.read();
    assert.equal(v45.warrantyCases.length, 0); assert.equal(v45.partsIssues.length, 0);
    assert.equal(v45.receipts.filter(row => row.data.status === 'POSTED').length, 4);
    assert.deepEqual(await quantities(f, v45), { 'PUBLIC-DEMO-SKU-A': 1, 'PUBLIC-DEMO-SKU-B': 18 });
    assert.equal(await f.setup.ready(), false, 'Existing v45 data must request enrichment');
    stopBeforeIntake = false;
    await assert.rejects(f.setup.initialize());
    const committed = await f.web.read();
    assert.equal(committed.partsIssues.length, 1); assert.equal(committed.partsIssues[0].data.status, 'POSTED');
    assert.equal((await quantities(f, committed))['PUBLIC-DEMO-SKU-B'], 16);
    assert.equal(await f.setup.ready(), false, 'Posted parts alone cannot skip finishing the warranty flow');
    assert.notEqual((await parts.recovery.restore()).kind, 'empty');
    await createPublicDemoSetup(f.client, () => f.runtime).initialize();
    assert.equal((await parts.recovery.restore()).kind, 'empty');
    assert.equal(await f.setup.ready(), true);
    const final = await f.web.read();
    assert.equal(final.scenario!.id, v45.scenario!.id); assert.equal(final.token.generation, v45.token.generation);
    assert.deepEqual(final.receipts, v45.receipts); assert.deepEqual(final.outbounds, v45.outbounds);
    assert.deepEqual(final.putaways, v45.putaways); assert.deepEqual(final.physical, v45.physical);
    assert.deepEqual(final.stockEvents.filter(row => row.data.eventType !== 'PARTS_ISSUE_POST'), v45.stockEvents);
    assert.deepEqual(final.partsIssues, committed.partsIssues);
    await verifyScreens(f);
    await f.setup.initialize(); assert.deepEqual(await f.web.read(), final);
  } finally { f.runtime.uninstall(); }
});
