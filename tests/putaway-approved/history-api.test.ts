import test from 'node:test';
import assert from 'node:assert/strict';
import { createPutawayHistoryAdapter } from '../../src/data/http/putaway-history-adapter';
import { routeBusinessCommand } from '../../src/preview-mock/business-command-transport';

const query = { from: '2026-10-25', to: '2026-10-26', search: 'BOX-0001', action: 'putaway.confirm' as const, page: 1, pageSize: 9 };
test('putaway history adapter accepts the scoped result envelope', async () => {
  const client = { get: async () => ({ status: 200, data: { apiVersion: '1', requestId: 'req-1', data: { rows: [], total: 0, scopeTotal: 0, page: 1, pageSize: 9, query } } }) };
  const result = await createPutawayHistoryAdapter(client as never).read(query);
  assert.deepEqual(result.query, query); assert.equal(result.scopeTotal, 0);
});

test('history route forwards only typed query fields to the business reader', async () => {
  let received: unknown;
  const business = { readPutawayHistory: async (value: unknown) => { received = value; return { rows: [], total: 0, scopeTotal: 0, page: 1, pageSize: 9, query }; } };
  const result = await routeBusinessCommand('GET', '/api/v1/putaway-history', undefined, business as never, new AbortController().signal,
    new URLSearchParams({ ...query, action: query.action, page: String(query.page), pageSize: String(query.pageSize) }));
  assert.equal(result.handled, true); assert.deepEqual(received, query);
});

test('history route is a distinct API surface for forbidden readers', async () => {
  const business = { readPutawayHistory: async () => { throw Object.assign(new Error('forbidden'), { code: 'PUTAWAY_HISTORY_FORBIDDEN' }); } };
  await assert.rejects(() => routeBusinessCommand('GET', '/api/v1/putaway-history', undefined, business as never, new AbortController().signal,
    new URLSearchParams({ ...query, page: String(query.page), pageSize: String(query.pageSize) })), /forbidden/);
});
