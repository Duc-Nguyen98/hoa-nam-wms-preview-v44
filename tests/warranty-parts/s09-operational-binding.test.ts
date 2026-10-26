import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createBusinessHttpAdapters } from '../../src/data/http/business-adapters';
import { createOperationalWebAdapter, createOperationalQaAdapter } from '../../src/data/http/operational-preview-adapter';
import { createDefectsCommandHttpAdapter } from '../../src/features/S02/defects-command-http';
import { createMemoryBusinessPersistence, type BusinessPersistence } from '../../src/preview-mock/business-persistence';
import { installPreviewMock, createMemoryPersistence, createMemorySessionToken, PREVIEW_MOCK_CREDENTIALS } from '../../src/preview-mock';
import { caseTimeline, createWarrantyBinding, readWarrantyDefects, refreshWarrantyEditor, warrantyLocalDate, type WarrantyEditor } from '../../src/features/S09/warranty-binding';
import { validateWarrantyDiagnosis } from '../../src/features/S09/warranty-diagnosis-form';

async function setup(persistence = createMemoryBusinessPersistence()) {
  const client = createApiClient({ baseURL: 'https://hoa-nam-mock.invalid/api/v1' });
  const recoveryPersistence = createMemoryBusinessPersistence();
  const runtime = installPreviewMock(client, { approvedPreviewCommands: true, approvedAppEventFixture: true, businessPersistence: persistence, recoveryPersistence, persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken() });
  await client.post('auth/login', PREVIEW_MOCK_CREDENTIALS); await client.post('auth/confirm', {});
  const products = createCatalogCreateAdapter('product', client, { available: true }), skus = createCatalogCreateAdapter('sku', client, { available: true });
  const epoch = (await products.readSnapshot()).epoch;
  const pReq = { commandId: crypto.randomUUID(), epoch, command: 'products.create' as const, payload: { code: 'CASE-P', name: 'Sản phẩm bảo hành', group: 'Phụ kiện' as const, unit: 'Cái' as const, status: 'active' as const } };
  const p = await products.execute(pReq); await products.readSnapshot(); await products.recovery.acknowledge(pReq.commandId);
  const sReq = { commandId: crypto.randomUUID(), epoch, command: 'skus.create' as const, payload: { code: 'CASE-S', productId: p.receipt.entityId, observedProductVersion: 1, barcode: null, status: 'active' as const } };
  const sku = await skus.execute(sReq); await skus.readSnapshot(); await skus.recovery.acknowledge(sReq.commandId);
  const web = createOperationalWebAdapter(client, { available: true, scope: 'S09' }), qa = createOperationalQaAdapter(client, { available: true });
  async function reset() { const { token } = await web.read(); const req = { ...token, commandId: crypto.randomUUID(), command: 'scenario.reset-own' as const, payload: { confirmed: true as const, selectedSkuIds: [sku.receipt.entityId] } }; delete (req as any).revision; await qa.execute(req); await qa.read(); await qa.recovery.acknowledge(req.commandId); }
  await reset();
  const defects = createBusinessHttpAdapters(client).S02, defectCommands = createDefectsCommandHttpAdapter(client);
  const d = await defectCommands.execute({ commandId: crypto.randomUUID(), epoch, command: 'defects.create', payload: { code: 'CASE-D', name: 'Lỗi nguồn', description: 'Nguồn điện', status: 'active' } });
  const app = runtime.appEventAdapters!.P09;
  async function intake() { const { token } = await web.read(); const req = { epoch, scenarioId: token.scenarioId, generation: token.generation, commandId: crypto.randomUUID(), command: 'warranty.intake' as const, payload: { identityMode: 'TEMP_ONLY' as const, skuId: sku.receipt.entityId, physicalId: null, customerReportedIssue: 'Khách báo không bật nguồn' } }; const r = await app.execute(req); await app.read(); await app.recovery.acknowledge(req.commandId); return r.receipt.entityId; }
  const caseId = await intake(), controller = createWarrantyBinding(web, defects);
  await controller.load(); const row = controller.getSnapshot().snapshot!.warrantyCases.find(r => r.id === caseId)!;
  const draft = { caseId, technicianDiagnosis: 'Kiểm tra nguồn', defectIds: [d.receipt.entityId], expectedFinishDate: warrantyLocalDate(row.data.receivedAt) };
  const checked = validateWarrantyDiagnosis({ caseId, state: row.data.state, intakeDate: warrantyLocalDate(row.data.receivedAt) }, draft, [{ id: d.receipt.entityId, label: 'Lỗi nguồn' }]);
  if (!checked.ok) throw new Error('form selection rejected');
  return { client, runtime, web, controller, defects, defectCommands, epoch, caseId, defectId: d.receipt.entityId, skuId: sku.receipt.entityId, draft, submission: checked.value, persistence, recoveryPersistence, reset, intake };
}
const raw = (p: BusinessPersistence) => p.transact(value => ({ value }));

test('S09 actual form -> HTTP repository diagnosis, true defect FK/frozen labels, all transitions, events, stock neutrality and reload', async () => {
  const s = await setup(); try {
    const before = await s.web.read(), accepted = await s.controller.diagnose(s.submission, 1, before.token);
    assert.equal(accepted?.caseId, s.caseId); assert.equal(s.controller.getSnapshot().recovery.kind, 'empty');
    let view = s.controller.getSnapshot().snapshot!, row = view.warrantyCases[0];
    assert.equal(row.data.state, 'CHECKING'); assert.equal(row.data.customerReportedIssue, 'Khách báo không bật nguồn'); assert.equal(row.data.technicianDiagnosis, 'Kiểm tra nguồn'); assert.deepEqual(row.data.defectIds, [s.defectId]); assert.equal(row.data.skuId, s.skuId);
    const frozen = structuredClone(row.data.defectSnapshot);
    await s.defectCommands.execute({ commandId: crypto.randomUUID(), epoch: s.epoch, command: 'defects.update', entityId: s.defectId, expectedVersion: 1, payload: { name: 'Tên mới', description: 'Mới', status: 'inactive' } });
    await s.controller.load(); assert.deepEqual(s.controller.getSnapshot().snapshot!.warrantyCases[0].data.defectSnapshot, frozen); assert.equal(s.controller.getSnapshot().defects.find(d => d.id === s.defectId)?.row.status, 'inactive');
    for (const next of ['REPAIRING','REPAIRED','RETURNED'] as const) { view = s.controller.getSnapshot().snapshot!; row = view.warrantyCases[0]; assert.equal((await s.controller.transition(s.caseId, row.version, view.token, next))?.caseId, s.caseId); }
    view = await s.web.read(); assert.equal(view.warrantyCases[0].data.state, 'RETURNED'); assert.equal(view.caseEvents.length, 5); assert.deepEqual(view.stock, before.stock); assert.deepEqual(view.stockEvents, before.stockEvents);
    const reloaded = createWarrantyBinding(createOperationalWebAdapter(s.client, { available: true, scope: 'S09' }), s.defects); await reloaded.load(); assert.deepEqual(reloaded.getSnapshot().snapshot, view);
    await reloaded.diagnose(s.submission, 5, view.token); assert.equal(reloaded.getSnapshot().error, 'CASE_IMMUTABLE'); assert.deepEqual(await s.web.read(), view);
  } finally { s.runtime.uninstall(); }
});

test('S09 lost response preserves exact original command; ordinary reload never replays/acks; explicit retry adds no duplicate event', async () => {
  const s = await setup(); try {
    const view = await s.web.read(); const interceptor = s.client.interceptors.response.use(response => { if (response.config.url === 'operations/commands') throw Object.assign(new Error('lost'), { code: 'NETWORK_ERROR' }); return response; });
    await s.controller.diagnose(s.submission, 1, view.token); s.client.interceptors.response.eject(interceptor);
    const pending = await s.web.recovery.restore(); assert.equal(pending.kind, 'pending');
    const committed = await s.web.read(), reopened = createWarrantyBinding(createOperationalWebAdapter(s.client, { available: true, scope: 'S09' }), s.defects);
    await reopened.load(); assert.equal(reopened.getSnapshot().recovery.kind, 'pending'); assert.deepEqual(await s.web.read(), committed);
    const result = await reopened.retry(); assert.equal(result?.caseId, s.caseId); if (pending.kind === 'pending') assert.equal(result?.commandId, pending.request.commandId);
    assert.equal((await s.web.read()).caseEvents.length, 2); assert.equal((await s.web.recovery.restore()).kind, 'empty');
  } finally { s.runtime.uninstall(); }
});

test('S09 committed journal from another tab is read-only on focus; draft retained across explicit rebase and recovery', async () => {
  const s = await setup(); try {
    const view = await s.web.read(); const editor: WarrantyEditor = { caseId: s.caseId, version: 1, fence: view.token, draft: { ...s.draft, technicianDiagnosis: 'Nội dung chưa gửi' } };
    const request = { epoch: view.epoch, scenarioId: view.token.scenarioId, generation: view.token.generation, commandId: crypto.randomUUID(), command: 'warranty.diagnose' as const, entityId: s.caseId, expectedVersion: 1, payload: { defectIds: s.submission.defectIds, technicianDiagnosis: 'Tab khác', expectedFinishDate: s.submission.expectedFinishDate } };
    await s.web.execute(request); await s.controller.load(); assert.equal(s.controller.getSnapshot().recovery.kind, 'committed'); assert.equal((await s.web.recovery.restore()).kind, 'committed');
    await s.controller.retry(); const next = refreshWarrantyEditor(editor, s.controller.getSnapshot().snapshot!); assert.equal(next.version, 2); assert.deepEqual(next.draft, editor.draft); assert.equal(editor.version, 1);
    await s.reset(); await s.controller.load(); assert.throws(() => refreshWarrantyEditor(editor, s.controller.getSnapshot().snapshot!), (e: any) => e.code === 'STALE_SCENARIO');
  } finally { s.runtime.uninstall(); }
});

test('S09 read-after-commit failure keeps journal until archived proof is verified; reconciliation preserves active data', async () => {
  const s = await setup(); try {
    const view = await s.web.read(); let denyRead = false;
    const wrapped = { ...s.web, read: async () => { if (denyRead) throw new Error('read lost'); return s.web.read(); }, execute: async (request: any) => { const result = await s.web.execute(request); denyRead = true; return result; } };
    const c = createWarrantyBinding(wrapped, s.defects); await c.load(); await c.diagnose(s.submission, 1, view.token); assert.equal((await s.web.recovery.restore()).kind, 'committed');
    denyRead = false; await s.reset(); await c.load(); assert.equal(c.getSnapshot().recovery.kind, 'committed'); const current = await s.web.read(); const result = await c.retry(); assert.equal(result?.archived, true); assert.equal(result?.caseId, null); assert.equal(c.getSnapshot().error, ''); assert.equal((await s.web.recovery.restore()).kind, 'empty'); assert.deepEqual(c.getSnapshot().snapshot, current); assert.equal(current.warrantyCases.length, 0);
  } finally { s.runtime.uninstall(); }
});

test('S09 stale versions, double click, terminal transitions and revoked session cannot create extra history', async () => {
  const s = await setup(); try {
    let view = await s.web.read(); await s.controller.transition(s.caseId, 1, view.token, 'REPAIRING'); assert.equal(s.controller.getSnapshot().error, 'INVALID_CASE_TRANSITION');
    await s.controller.load(); await Promise.all([s.controller.diagnose(s.submission, 1, view.token), s.controller.diagnose(s.submission, 1, view.token)]); assert.equal((await s.web.read()).caseEvents.length, 2);
    await s.controller.diagnose(s.submission, 1, view.token); assert.equal(s.controller.getSnapshot().error, 'STALE_VERSION'); assert.equal((await s.web.read()).caseEvents.length, 2);
    await s.controller.load(); view = await s.web.read(); const before = await raw(s.persistence); await s.client.post('auth/logout', {}); await s.controller.diagnose(s.submission, 2, view.token); assert.equal(s.controller.getSnapshot().snapshot, null); assert.deepEqual(await raw(s.persistence), before);
  } finally { s.runtime.uninstall(); }
});

test('S09 precommit storage error preserves repository bytes and original intent retry succeeds once', async () => {
  const base = createMemoryBusinessPersistence(); let blocked = false;
  const persistence: BusinessPersistence = { transact: (change, signal) => base.transact(raw => { const result = change(raw); if (blocked && Object.hasOwn(result, 'write')) throw new Error('storage'); return result; }, signal) };
  const s = await setup(persistence); try {
    const before = await raw(base), view = await s.web.read(); blocked = true; await s.controller.diagnose(s.submission, 1, view.token); blocked = false;
    assert.deepEqual(await raw(base), before); assert.equal((await s.web.recovery.restore()).kind, 'pending'); await s.controller.retry(); assert.equal((await s.web.read()).caseEvents.length, 2);
  } finally { s.runtime.uninstall(); }
});

test('S09 reset during defect pagination publishes only new operational generation; navigation cancels stale accepted state', async () => {
  const s = await setup(); try {
    let reset = true; const defects = { read: async (...args: Parameters<typeof s.defects.read>) => { const result = await s.defects.read(...args); if (reset) { reset = false; await s.reset(); } return result; } };
    const c = createWarrantyBinding(s.web, defects); await c.load(); assert.equal(c.getSnapshot().snapshot!.token.generation, 2); assert.equal(c.getSnapshot().snapshot!.warrantyCases.length, 0);
    const id = await s.intake(); await c.load(); const view = c.getSnapshot().snapshot!;
    const wrapped = { ...s.web, execute: async (request: any) => { const r = await s.web.execute(request); nav.suspend(); return r; } }; const nav = createWarrantyBinding(wrapped, s.defects); await nav.load();
    assert.equal(await nav.diagnose({ ...s.submission, caseId: id }, 1, view.token), undefined); assert.equal((await s.web.recovery.restore()).kind, 'committed');
  } finally { s.runtime.uninstall(); }
});

test('S09 timeline uses canonical commit revision for identical timestamps, not UUID/state ordering; complete defect pages use entity IDs', async () => {
  const s = await setup(); try {
    const before = await s.web.read(); await s.controller.diagnose(s.submission, 1, before.token); let view = await s.web.read(); await s.controller.transition(s.caseId, 2, view.token, 'REPAIRING');
    view = structuredClone(await s.web.read()); for (const e of view.caseEvents) (e.data as any).timestamp = '2026-10-20T00:00:00.000Z'; view.caseEvents.reverse();
    assert.deepEqual(caseTimeline(view, s.caseId).map(e => (e.data as any).state), ['RECEIVED','CHECKING','REPAIRING']);
    const defects = await readWarrantyDefects(s.defects); assert.ok(defects.rows.some(d => d.id === s.defectId)); assert.equal(new Set(defects.rows.map(d => d.id)).size, defects.rows.length);
  } finally { s.runtime.uninstall(); }
});

test('S09 absent or tampered archive proof never acknowledges original intent', async () => {
  const s = await setup(); try {
    const view = await s.web.read();
    const request = { epoch: view.epoch, scenarioId: view.token.scenarioId, generation: view.token.generation, commandId: crypto.randomUUID(), command: 'warranty.diagnose' as const, entityId: s.caseId, expectedVersion: 1, payload: { defectIds: s.submission.defectIds, technicianDiagnosis: s.submission.technicianDiagnosis, expectedFinishDate: s.submission.expectedFinishDate } };
    await s.web.execute(request); await s.reset();
    for (const tamper of ['missing', 'record'] as const) {
      const wrapped = { ...s.web, read: async () => { const snap = structuredClone(await s.web.read()); if (tamper === 'missing') snap.archivedCommitSnapshots = []; else for (const proof of snap.archivedCommitSnapshots) (proof.data as any).changes[0].canonicalRecord = '{}'; return snap; } };
      const c = createWarrantyBinding(wrapped, s.defects); await c.load(); assert.equal(await c.retry(), undefined); assert.equal(c.getSnapshot().error, 'ARCHIVE_PROOF_REQUIRED'); assert.equal((await s.web.recovery.restore()).kind, 'committed');
    }
    const c = createWarrantyBinding(s.web, s.defects); await c.load(); assert.equal((await c.retry())?.archived, true); assert.equal((await s.web.recovery.restore()).kind, 'empty');
  } finally { s.runtime.uninstall(); }
});

test('S09 reset during new dispatch does not auto-ack archive; explicit recovery is required', async () => {
  const s = await setup(); try {
    const wrapped = { ...s.web, execute: async (request: any) => { const result = await s.web.execute(request); await s.reset(); return result; } };
    const c = createWarrantyBinding(wrapped, s.defects); await c.load(); const view = c.getSnapshot().snapshot!;
    assert.equal(await c.diagnose(s.submission, 1, view.token), undefined); assert.equal(c.getSnapshot().error, 'RECOVERY_ARCHIVED_SCENARIO'); assert.equal((await s.web.recovery.restore()).kind, 'committed');
    const result = await c.retry(); assert.equal(result?.archived, true); assert.equal(result?.caseId, null); assert.equal(c.getSnapshot().snapshot!.warrantyCases.length, 0); assert.equal((await s.web.recovery.restore()).kind, 'empty');
  } finally { s.runtime.uninstall(); }
});
