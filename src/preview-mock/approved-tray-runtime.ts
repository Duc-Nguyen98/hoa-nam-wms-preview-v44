import type { AxiosInstance } from 'axios';
import { apiClient } from '../data/http/api-client';
import { createCatalogCreateAdapter } from '../data/http/catalog-create-adapter';
import { createOperationalQaAdapter, createOperationalWebAdapter } from '../data/http/operational-preview-adapter';
import { createPutawayHistoryAdapter } from '../data/http/putaway-history-adapter';
import { installPreviewMock, type PreviewMockRuntime } from './index';
import { PUBLIC_DEMO_LOGIN } from './public-demo-login';

/** Isolated business seam for the approved Xếp khay workspace. UI owns routing; this module owns only typed data adapters. */
export function createApprovedTrayRuntime(client: AxiosInstance = apiClient, options: { namespace?: string; businessNow?: () => number } = {}) {
  const namespace = options.namespace ?? 'hoa-nam-wms-tray-approved-v1';
  const runtime = installPreviewMock(client, {
    namespace, approvedPreviewCommands: true, approvedOperationalQa: true, credentialProfile: PUBLIC_DEMO_LOGIN,
    ...(options.businessNow ? { businessNow: options.businessNow } : {}),
  });
  const operationalAdapter = (scope: 'S11' | 'S13' | 'S14') => createOperationalWebAdapter(client, { available: true, scope });
  const qaAdapter = createOperationalQaAdapter(client, { available: true, scope: 'tray-approved-setup' });
  const catalog = createCatalogCreateAdapter('sku', client, { available: true });
  return {
    runtime,
    operationalAdapter,
    qaAdapter,
    readCatalog: () => catalog.readSnapshot(),
    historyAdapter: createPutawayHistoryAdapter(client),
    async initialize() { return runtime; },
    async ready() { const snapshot = await operationalAdapter('S14').read(); return snapshot.scenario !== null; },
  };
}
export type ApprovedTrayRuntime = ReturnType<typeof createApprovedTrayRuntime>;
