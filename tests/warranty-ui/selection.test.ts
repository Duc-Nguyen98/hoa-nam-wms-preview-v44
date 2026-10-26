import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFixture } from '../s27/fixture';
import { findSelectedWarrantyCase, type WarrantyCaseRecord } from '../../src/features/S09/warranty-binding';

test('S09 detail cannot switch to an equal ID in a different session, generation or epoch', () => {
  const snapshot = auditFixture(0);
  const row = { id: 'case:same-id', version: 1 } as WarrantyCaseRecord;
  snapshot.warrantyCases = [row];
  const selection = { id: row.id, fence: { ...snapshot.token } };
  assert.equal(findSelectedWarrantyCase(snapshot, selection), row);
  for (const token of [
    { ...snapshot.token, scenarioId: 'scenario:other' },
    { ...snapshot.token, generation: snapshot.token.generation + 1 },
    { ...snapshot.token, epoch: 'epoch:other' },
  ]) {
    assert.equal(findSelectedWarrantyCase({ ...snapshot, epoch: token.epoch, token }, selection), null);
  }
  assert.equal(findSelectedWarrantyCase({ ...snapshot, scenario: null }, selection), null);
  assert.equal(findSelectedWarrantyCase({ ...snapshot, warrantyCases: [] }, selection), null);
  assert.equal(findSelectedWarrantyCase(null, selection), null);
  const updated = { ...row, version: 2 };
  assert.equal(findSelectedWarrantyCase({ ...snapshot, warrantyCases: [updated] }, selection), updated);
});
