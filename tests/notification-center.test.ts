import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryPersistence } from '../src/preview-mock/storage';
import { createNotificationRepository } from '../src/preview-mock/notifications';
import { notificationBadge } from '../src/notifications/notification-badge';

function repository() {
  return createNotificationRepository({
    persistence: createMemoryPersistence(),
    namespace: `notification-test-${Math.random()}`,
    actor: async () => ({ key: 'preview:ducquang', confirmed: true, expiresAt: Date.now() + 60_000 }),
    captureFence: () => () => undefined,
  });
}

test('business notification feed is persisted per actor and read commands are idempotent', async () => {
  const repo = repository();
  const initial = await repo.read();
  assert.equal(initial.items.length, 5);
  assert.equal(initial.totalUnread, 2);
  assert.equal(initial.items[0]?.kind, 'business');
  assert.equal(initial.items[0]?.target.href, '#/preview/S15');

  const first = initial.items[0]!;
  const marked = await repo.markRead(first.id, 'command-1');
  assert.equal(marked.totalUnread, 1);
  const replay = await repo.markRead(first.id, 'command-1');
  assert.equal(replay.revision, marked.revision);
  assert.equal(replay.totalUnread, 1);

  const all = await repo.markAllRead('command-all');
  assert.equal(all.totalUnread, 0);
  assert.ok(all.items.every(item => item.readAt !== null));
});

test('notification badge hides zero and caps high counts', () => {
  assert.equal(notificationBadge(0), '');
  assert.equal(notificationBadge(1), '1');
  assert.equal(notificationBadge(99), '99');
  assert.equal(notificationBadge(100), '99+');
});
