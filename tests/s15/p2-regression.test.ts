import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFixture } from '../s27/fixture';
import type { CatalogSnapshot, CatalogRecipient } from '../../src/contracts/catalog-create';
import type { OperationalCommand, OperationalSnapshot } from '../../src/contracts/operational-preview';
import { createOutboundBinding, type OutboundAdapter } from '../../src/features/S15/outbound-binding';
import { outboundRecipient, queryOutbounds } from '../../src/features/S15/outbound-presentation';
import { outboundErrorMessage, outboundReadControls } from '../../src/features/S15/outbound-feedback';

function fixture() {
  const snapshot = auditFixture(0);
  snapshot.outbounds = [{ id: 'outbound:p2', kind: 'outbound', version: 1, data: {
    ...snapshot.scenario!.data, code: 'PX-P2', appRequestId: 'request:p2', recipientId: 'recipient:p2', recipientVersion: 1,
    recipientSnapshot: null, requestedLines: [{ id: 'line:p2', skuId: 'sku:p2', quantity: 2, skuVersion: 1, productVersion: 1 }],
    allocatedPhysicalIds: [], postedEventIds: [], status: 'DRAFT', submissionId: null, submittedHash: null, submittedVersion: null,
  } }];
  return snapshot;
}
function catalog(snapshot: OperationalSnapshot): CatalogSnapshot {
  return { epoch: snapshot.epoch, actorKey: snapshot.actorKey, snapshotRevision: snapshot.snapshotRevision, products: [], skus: [], recipients: [] } as unknown as CatalogSnapshot;
}

const invalid: [string, (snapshot: OperationalSnapshot) => void][] = [
  ...[0, -1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(value => [`quantity ${value}`, (s: OperationalSnapshot) => { s.outbounds[0].data.requestedLines[0].quantity = value; }] as [string, (s: OperationalSnapshot) => void]),
  ...[0, -1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1].map(value => [`version ${value}`, (s: OperationalSnapshot) => { s.outbounds[0].version = value; }] as [string, (s: OperationalSnapshot) => void]),
  ['duplicate physical ID', s => { const physical = { id: 'physical:p2', kind: 'physical', version: 1, data: { ...s.scenario!.data, physicalCode: 'SERIAL-P2', skuId: 'sku:p2', unit: 'cái', status: 'IN_STOCK', issuedDocumentId: null, sourceReceiptId: 'receipt:p2', sourceLineId: 'line:p2' } } as OperationalSnapshot['physical'][number]; s.physical = [physical, structuredClone(physical)]; }],
];
for (const [name, corrupt] of invalid) test(`S15 rejects ${name} without publishing malformed data or dispatching commands`, async () => {
  const snapshot = fixture(); corrupt(snapshot); let writes = 0;
  const adapter = { available: true, read: async () => snapshot, execute: async () => { writes++; }, recovery: {
    restore: async () => ({ kind: 'empty' }), retry: async () => { writes++; }, acknowledge: async () => { writes++; },
  } } as unknown as OutboundAdapter;
  const binding = createOutboundBinding(adapter, async () => catalog(snapshot));
  await binding.resume();
  assert.equal(binding.getSnapshot().error, 'INVALID_RESPONSE');
  assert.equal(binding.getSnapshot().snapshot, null);
  assert.equal(binding.getSnapshot().catalog, null);
  assert.equal(writes, 0); binding.suspend();
});

test('DRAFT and SCANNING search the displayed current recipient; submitted states only search historical identity', () => {
  const row = fixture().outbounds[0];
  const recipients = [{ id: row.data.recipientId, code: 'REC-P2', name: 'Người nhận hiện tại' }] as CatalogRecipient[];
  for (const status of ['DRAFT', 'SCANNING'] as const) {
    row.data.status = status;
    assert.equal(outboundRecipient(row, recipients)?.name, recipients[0].name);
    assert.deepEqual(queryOutbounds([row], 'NGƯỜI NHẬN HIỆN TẠI', status, recipients), [row]);
  }
  for (const status of ['SUBMITTED', 'READY', 'POSTED'] as const) {
    row.data.status = status; row.data.recipientSnapshot = null;
    assert.equal(queryOutbounds([row], recipients[0].name, status, recipients).length, 0);
    row.data.recipientSnapshot = { id: row.data.recipientId, code: 'OLD', name: 'Người nhận lúc gửi' };
    assert.deepEqual(queryOutbounds([row], 'lúc gửi', status, recipients), [row]);
    assert.equal(queryOutbounds([row], recipients[0].name, status, recipients).length, 0);
  }
});

test('pending Post survives failed snapshot and focus refresh without resend or acknowledgement', async () => {
  const snapshot = fixture(); let writes = 0;
  const request: OperationalCommand = { commandId: 'pending-post:p2', epoch: snapshot.epoch, scenarioId: snapshot.token.scenarioId, generation: snapshot.token.generation, command: 'outbound.post', entityId: 'outbound:p2', expectedVersion: 3, payload: { outboundId: 'outbound:p2' } };
  const adapter = { available: true, read: async () => { throw Object.assign(new Error('offline'), { code: 'READ_FAILED' }); }, execute: async () => { writes++; }, recovery: {
    restore: async () => ({ kind: 'pending', request }), retry: async () => { writes++; }, acknowledge: async () => { writes++; },
  } } as unknown as OutboundAdapter;
  const binding = createOutboundBinding(adapter, async () => catalog(snapshot));
  await binding.resume(); await binding.refresh();
  const state = binding.getSnapshot();
  assert.equal(state.snapshot, null); assert.equal(state.recovery, true);
  assert.deepEqual(state.pendingRequest, request);
  assert.deepEqual(outboundReadControls(state), { readDisabled: true, showReconcile: true });
  assert.match(outboundErrorMessage(state), /Chưa xác định kết quả/);
  assert.equal(writes, 0); binding.suspend();
});
