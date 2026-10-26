import test from 'node:test';
import assert from 'node:assert/strict';
import { createApprovedTraySeed } from '../../src/preview-mock/putaway-approved-seed';

test('approved tray seed keeps 27 boxes, 18 orders and nine linked confirmation rows', () => {
  const seed = createApprovedTraySeed();
  assert.equal(seed.boxes.length, 27); assert.equal(seed.orders.length, 18); assert.equal(seed.trays.length, 9); assert.equal(seed.history.length, 9);
  const boxCodes = new Set(seed.boxes.map(row => row.code));
  assert.equal(boxCodes.size, 27);
  for (const row of seed.history) {
    const box = seed.boxes.find(candidate => candidate.code === row.boxCode);
    assert.ok(box && box.status === 'CONFIRMED' && box.trayCode === row.trayCode && box.orderCode === row.orderCode);
    assert.ok(seed.trays.some(candidate => candidate.code === row.trayCode));
  }
  assert.deepEqual(seed.boxes.filter(row => row.status === 'QUEUE').map(row => row.code), ['BOX-0021','BOX-0022','BOX-0023','BOX-0024','BOX-0025','BOX-0026','BOX-0027','BOX-0028','BOX-0029']);
});
