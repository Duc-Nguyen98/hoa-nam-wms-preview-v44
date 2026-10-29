import test from 'node:test';
import assert from 'node:assert/strict';
import { readFailureKind } from '../../src/shared/read-failure-kind';

test('read failures distinguish session, permission, missing resource and network failure', () => {
  for (const error of ['SESSION_EXPIRED', 'AUTH_REQUIRED', {status:401}, {response:{status:401}}]) assert.equal(readFailureKind(error), 'unauthorized');
  for (const error of ['FORBIDDEN', 'FORBIDDEN_HISTORY', 'MOCK_COMMAND_FORBIDDEN', {status:403}]) assert.equal(readFailureKind(error), 'forbidden');
  for (const error of ['NOT_FOUND', 'RECORD_NOT_FOUND', {response:{status:404}}]) assert.equal(readFailureKind(error), 'record-not-found');
  for (const error of ['NETWORK_ERROR', {status:500}, new Error('offline'), null, {}]) assert.equal(readFailureKind(error), 'error');
});

test('domain authorization codes take priority over incidental transport status', () => {
  assert.equal(readFailureKind({code:'FORBIDDEN',status:500}), 'forbidden');
  assert.equal(readFailureKind({code:'SESSION_EXPIRED',status:403}), 'unauthorized');
  assert.equal(readFailureKind('customer message mentioning FORBIDDEN'), 'error');
});

