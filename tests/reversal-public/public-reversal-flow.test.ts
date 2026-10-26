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
import { createReversalBinding, reversalIssueOptions } from '../../src/features/S17/reversal-binding';
import { createWarrantyReportReader } from '../../src/features/S22/warranty-operational-binding';
import { createOperationalInventoryBinding } from '../../src/features/S16/inventory-binding';
import { createStockReportBinding } from '../../src/features/S21/stock-report-binding';
import type { OperationalCommand, OperationalSnapshot } from '../../src/contracts/operational-preview';

const now = () => '2026-10-26T10:00:00+07:00';
const marker = 'PUBLIC-DEMO-RETURN-CASE-0010';
async function fixture() {
  const client = createApiClient({ baseURL: 'https://public-return.test/api/v1' });
  const runtime = installPreviewMock(client, {
    origin: 'https://public-return.test', approvedPreviewCommands: true, approvedAppEventFixture: true,
    credentialProfile: PUBLIC_DEMO_LOGIN, businessNow: () => Date.parse(now()),
    persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(),
    businessPersistence: createMemoryBusinessPersistence(), recoveryPersistence: createMemoryBusinessPersistence(),
    notificationPersistence: createMemoryPersistence(),
  });
  await client.post('auth/login', { username: 'demo', password: 'HoaNamDemo@2026' });
  await client.post('auth/confirm', {});
  const web = createOperationalWebAdapter(client, { available: true, scope: 'public-demo-initial-setup' });
  const catalog = createCatalogCreateAdapter('sku', client, { available: true });
  const setup = createPublicDemoSetup(client, () => runtime);
  return { client, runtime, web, catalog, setup };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
async function componentStock(f: Fixture, snapshot: OperationalSnapshot) {
  const sku = (await f.catalog.readSnapshot()).skus.find(row => row.code === 'PUBLIC-DEMO-SKU-B')!;
  return snapshot.stock.find(row => row.skuId === sku.id)!.quantity;
}
async function verifyScreens(f: Fixture) {
  const snapshot = await f.web.read(), labels = () => f.catalog.readSnapshot();
  const surplusCase = snapshot.warrantyCases.find(row => row.data.customerReportedIssue.includes(marker))!;
  const originalCase = snapshot.warrantyCases.find(row => row.data.identityMode === 'SERIAL')!;
  const issue = snapshot.partsIssues.find(row => row.data.caseId === surplusCase.id)!;
  const originalIssue = snapshot.partsIssues.find(row => row.data.caseId === originalCase.id)!;
  assert.equal(snapshot.warrantyCases.length, 2); assert.equal(snapshot.partsIssues.length, 2);
  assert.equal(surplusCase.data.state, 'CHECKING'); assert.equal(originalCase.data.state, 'RETURNED');
  assert.equal(snapshot.reversals.length, 1);
  const reversal = snapshot.reversals[0];
  assert.equal(reversal.data.originalIssueId, issue.id);
  assert.equal(reversal.data.status, 'POSTED'); assert.equal(reversal.data.physicalReturn, 'CONFIRMED');
  assert.equal(reversal.data.returnedUnused, true); assert.ok(reversal.data.evidenceRefs.length > 0);
  const compensation = snapshot.stockEvents.filter(row => row.data.eventType === 'REVERSAL_POST');
  assert.equal(compensation.length, 1); assert.equal(compensation[0].data.signedQuantity, 2);
  assert.equal(compensation[0].data.originalEventId, issue.data.postedEventIds[0]);
  assert.equal(compensation[0].data.documentId, reversal.id);
  assert.deepEqual(reversal.data.postedCompensationEventIds, compensation.map(row => row.id));
  assert.equal(issue.data.status, 'POSTED'); assert.equal(originalIssue.data.status, 'POSTED');
  assert.equal(issue.data.lines[0].quantity, 2); assert.equal(await componentStock(f, snapshot), 16);
  assert.ok(!reversalIssueOptions(snapshot).some(row => row.id === issue.id), 'Posted return cannot be created again from the picker');
  const warranty = createWarrantyBinding(f.web, createBusinessHttpAdapters(f.client).S02);
  const parts = createOperationalPartsReader(f.web, labels), returns = createReversalBinding(f.web, labels);
  const report = createWarrantyReportReader(f.web, labels, now);
  const inventory = createOperationalInventoryBinding(f.web, labels, now), stock = createStockReportBinding(f.web, labels, now);
  const readers = [warranty, parts, returns, report, inventory, stock];
  try {
    for (const reader of readers) { await reader.load(); assert.equal(reader.getSnapshot().error, ''); }
    assert.deepEqual(returns.getSnapshot().snapshot!.reversals[0], reversal);
    assert.equal(returns.getSnapshot().verifiedEvidence[reversal.id].length, reversal.data.evidenceRefs.length);
    const partModel = parts.getSnapshot().model!.issues.find(row => row.record.id === issue.id)!;
    assert.equal(partModel.warrantyCase.id, surplusCase.id);
    assert.deepEqual(partModel.events.map(row => row.data.signedQuantity), [-2]);
    assert.equal(partModel.reversals.length, 1);
    assert.deepEqual(partModel.reversals[0].events.map(row => row.data.signedQuantity), [2]);
    assert.equal(parts.getSnapshot().model!.issues.find(row => row.record.id === originalIssue.id)!.reversals.length, 0);
    const reportModel = report.getSnapshot().model!;
    assert.equal(reportModel.report.summary.total, 2); assert.equal(reportModel.report.summary.complete, 1);
    assert.equal(reportModel.report.summary.processing, 1); assert.equal(reportModel.report.summary.waiting, 0);
    assert.deepEqual(reportModel.rows.find(row => row.id === surplusCase.id)!.partIssueIds, [issue.id]);
    const stockRow = stock.getSnapshot().model!.rows.find(row => row.skuCode === 'PUBLIC-DEMO-SKU-B')!;
    assert.equal(stockRow.parts, 4); assert.equal(stockRow.reversals, 2); assert.equal(stockRow.closing, 16);
    assert.equal(inventory.getSnapshot().model!.rows.find(row => row.skuCode === 'PUBLIC-DEMO-SKU-B')!.quantity, 16);
    assert.equal(inventory.getSnapshot().model!.rows.find(row => row.skuCode === 'PUBLIC-DEMO-SKU-A')!.quantity, 1);
    assert.deepEqual(await f.web.read(), snapshot, 'Reading S09/S10/S17/S16/S21/S22 cannot mutate stock or history');
  } finally { readers.forEach(reader => reader.suspend()); }
  return snapshot;
}

test('fresh public demo preserves the repaired case and reconciles the separate unused return on all screens', async () => {
  const f = await fixture();
  try {
    await f.setup.initialize(); assert.equal(await f.setup.ready(), true);
    const posted = await verifyScreens(f);
    await createPublicDemoSetup(f.client, () => f.runtime).initialize();
    assert.deepEqual(await f.web.read(), posted);
  } finally { f.runtime.uninstall(); }
});

test('v46 upgrade is additive: stock16→14 on surplus issue, stays14 until return post, then16 exactly once', async () => {
  const f = await fixture();
  const intake = f.runtime.appEventAdapters!.P09, execute = intake.execute;
  let pause = true;
  intake.execute = async request => {
    if (pause && request.command === 'warranty.intake' && 'customerReportedIssue' in request.payload && request.payload.customerReportedIssue.includes(marker)) throw new Error('Pause at v46 boundary');
    return execute(request);
  };
  const stages: { command: string; stock: number }[] = [];
  const interceptor = f.client.interceptors.response.use(async response => {
    if (response.config.method === 'post' && response.config.url === 'operations/commands') {
      const request = JSON.parse(response.config.data) as OperationalCommand;
      if (request.command.startsWith('reversal.')) stages.push({ command: request.command, stock: await componentStock(f, await f.web.read()) });
    }
    return response;
  });
  try {
    await assert.rejects(f.setup.initialize());
    const v46 = await f.web.read();
    assert.equal(v46.warrantyCases.length, 1); assert.equal(v46.partsIssues.length, 1);
    assert.equal(v46.reversals.length, 0); assert.equal(await componentStock(f, v46), 16);
    assert.equal(await f.setup.ready(), false);
    pause = false; await f.setup.initialize();
    assert.deepEqual(stages, [
      { command: 'reversal.create', stock: 14 }, { command: 'reversal.attach-evidence', stock: 14 },
      { command: 'reversal.confirm-return', stock: 14 }, { command: 'reversal.post', stock: 16 },
    ]);
    const after = await verifyScreens(f);
    assert.deepEqual(after.scenario, v46.scenario); assert.deepEqual(after.receipts, v46.receipts);
    assert.deepEqual(after.outbounds, v46.outbounds); assert.deepEqual(after.putaways, v46.putaways);
    assert.deepEqual(after.physical, v46.physical);
    for (const row of v46.warrantyCases) assert.deepEqual(after.warrantyCases.find(value => value.id === row.id), row);
    for (const row of v46.partsIssues) assert.deepEqual(after.partsIssues.find(value => value.id === row.id), row);
    for (const row of v46.stockEvents) assert.deepEqual(after.stockEvents.find(value => value.id === row.id), row);
    await f.setup.initialize(); assert.deepEqual(await f.web.read(), after);
    assert.equal(stages.length, 4);
  } finally { f.client.interceptors.response.eject(interceptor); f.runtime.uninstall(); }
});

test('lost committed return response is recovered with the original command; retries and a second return cannot inflate stock', async () => {
  const f = await fixture();
  let loseResponse = true, postedRequest: OperationalCommand | null = null;
  const interceptor = f.client.interceptors.response.use(response => {
    if (response.config.method === 'post' && response.config.url === 'operations/commands') {
      const request = JSON.parse(response.config.data) as OperationalCommand;
      if (request.command === 'reversal.post' && loseResponse) {
        loseResponse = false; postedRequest = request;
        throw Object.assign(new Error('Lost response after commit'), { code: 'NETWORK_ERROR' });
      }
    }
    return response;
  });
  try {
    await assert.rejects(f.setup.initialize());
    const committed = await f.web.read();
    assert.equal(committed.reversals[0].data.status, 'POSTED'); assert.equal(await componentStock(f, committed), 16);
    const held = await f.web.recovery.restore(); assert.ok(held.kind === 'pending' || held.kind === 'committed');
    assert.deepEqual(held.request, postedRequest);
    assert.equal(await f.setup.ready(), false, 'Pending return result must be reconciled before onboarding is ready');
    await createPublicDemoSetup(f.client, () => f.runtime).initialize();
    assert.equal((await f.web.recovery.restore()).kind, 'empty');
    assert.equal(await f.setup.ready(), true); assert.deepEqual(await f.web.read(), committed);
    const replay = await f.web.execute(postedRequest!);
    assert.equal(replay.replayed, true); await f.web.recovery.acknowledge(postedRequest!.commandId);
    assert.deepEqual(await f.web.read(), committed);
    const reversal = committed.reversals[0], issue = committed.partsIssues.find(row => row.id === reversal.data.originalIssueId)!;
    const duplicate: OperationalCommand<'reversal.create'> = {
      commandId: crypto.randomUUID(), epoch: committed.epoch, scenarioId: committed.token.scenarioId,
      generation: committed.token.generation, command: 'reversal.create',
      payload: { originalIssueId: issue.id, observedIssueVersion: issue.version, returnedUnused: true, reasonText: 'Duplicate attempt must fail' },
    };
    await assert.rejects(f.web.execute(duplicate), { code: 'REVERSAL_ALREADY_EXISTS' });
    assert.deepEqual(await f.web.read(), committed);
    await verifyScreens(f);
  } finally { f.client.interceptors.response.eject(interceptor); f.runtime.uninstall(); }
});
