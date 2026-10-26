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
import { apiClient } from '../../src/data/http/api-client';
import { initializeBrowserPreview } from '../../src/preview-mock/browser-runtime';
export async function seedWarrantyUi() {
  const client = apiClient, runtime = initializeBrowserPreview()!;
  const product = createCatalogCreateAdapter('product', client, { available: true }), sku = createCatalogCreateAdapter('sku', client, { available: true });
  const epoch = (await product.readSnapshot()).epoch;
  const productRequest = { command: 'products.create' as const, commandId: crypto.randomUUID(), epoch, payload: { code: 'S10-P', name: 'Linh kiện máy in nhiệt', group: 'Phụ kiện' as const, unit: 'Cái' as const, status: 'active' as const } };
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
  const intake = await app('warranty.intake', { identityMode: 'TEMP_ONLY', skuId: skuIds[0], physicalId: null, customerReportedIssue: 'Khách báo máy không lên nguồn' });
  const diagnosed = await web('warranty.diagnose', { defectIds: [], technicianDiagnosis: 'Đã kiểm tra nguồn và đầu in', expectedFinishDate: null }, intake.receipt.entityId, intake.receipt.version);
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
