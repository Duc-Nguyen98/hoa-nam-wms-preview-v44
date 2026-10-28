import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../../src/data/http/api-client';
import { createCatalogCreateAdapter } from '../../src/data/http/catalog-create-adapter';
import { createOperationalWebAdapter } from '../../src/data/http/operational-preview-adapter';
import { createTrayBinding } from '../../src/features/S11/tray-binding';
import { createPublicDemoSetup } from '../../src/preview-mock/public-demo-setup';
import { installPreviewMock } from '../../src/preview-mock';
import { createMemoryBusinessPersistence } from '../../src/preview-mock/business-persistence';
import { createMemoryPersistence, createMemorySessionToken } from '../../src/preview-mock/storage';
import { PUBLIC_DEMO_LOGIN } from '../../src/preview-mock/public-demo-login';

test('approved putaway seed keeps tray display identity and complete S11 lookup links', async () => {
  const client = createApiClient({ baseURL: 'https://putaway-seed.test/api/v1' });
  const runtime = installPreviewMock(client, {
    origin: 'https://putaway-seed.test', approvedPreviewCommands: true, approvedAppEventFixture: true,
    credentialProfile: PUBLIC_DEMO_LOGIN, namespace: `putaway-seed-${crypto.randomUUID()}`,
    persistence: createMemoryPersistence(), sessionToken: createMemorySessionToken(),
    businessPersistence: createMemoryBusinessPersistence(), recoveryPersistence: createMemoryBusinessPersistence(),
    notificationPersistence: createMemoryPersistence(),
  });
  try {
    await client.post('auth/login', { username: 'demo', password: 'HoaNamDemo@2026' });
    await client.post('auth/confirm', {});
    const setup = createPublicDemoSetup(client, () => runtime);
    const snapshot = await setup.initialize();
    const trays = snapshot.setupMasters.filter(record => record.kind === 'operational-setup-tray');
    assert.deepEqual(trays.map(record => (record.data as { code: string }).code), Array.from({ length: 9 }, (_, i) => `TRAY-${String(i + 1).padStart(3, '0')}`));

    const approvedBoxes = snapshot.boxes.filter(record => record.id.startsWith('box:approved:'));
    assert.equal(approvedBoxes.length, 27);
    assert.ok(approvedBoxes.every(record => snapshot.lines.some(line => line.id === record.data.sourceLineId
      && line.data.receiptId === record.data.sourceReceiptId && line.data.skuId === record.data.skuId)));

    const web = createOperationalWebAdapter(client, { available: true, scope: 'putaway-seed-regression' });
    const catalog = createCatalogCreateAdapter('sku', client, { available: true });
    const binding = createTrayBinding(web, () => catalog.readSnapshot());
    await binding.load();
    const state = binding.getSnapshot();
    assert.equal(state.error, '');
    assert.equal(state.model?.rows.length, 9);
    assert.equal(state.model?.rows.filter(row => row.boxes.some(box => box.id.startsWith('box:approved:'))).length, 9);
  } finally {
    runtime.uninstall();
  }
});
