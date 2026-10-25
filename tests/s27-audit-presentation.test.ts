import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIT_ACTION_LABELS, auditActionLabel, shortenAuditId } from '../src/features/S27/audit-copy';

test('every declared operational action has distinct nonempty labels in VI/EN/ZH', () => {
  for (const [action, labels] of Object.entries(AUDIT_ACTION_LABELS)) {
    for (const language of ['vi', 'en', 'zh-CN'] as const) {
      assert.equal(auditActionLabel(action, language), labels[language]);
      assert.ok(labels[language].length > 0);
      assert.notEqual(labels[language], action);
    }
  }
  assert.equal(auditActionLabel('stock-profiles.create'), 'Tạo hồ sơ kho');
  assert.equal(auditActionLabel('scenario.reset-own'), 'Đặt lại kịch bản');
});

test('unknown action identifiers remain verbatim in every language', () => {
  const action = 'future-extension.commit-inventory_v2';
  for (const language of ['vi', 'en', 'zh-CN'] as const) assert.equal(auditActionLabel(action, language), action);
  assert.equal(auditActionLabel('constructor'), 'constructor');
  assert.equal(auditActionLabel('__proto__'), '__proto__');
});

test('list identifiers shorten presentation only, preserving distinguishable ends', () => {
  const value = 'audit:910af539-c034-428c-98e6-e84001784097';
  const short = shortenAuditId(value);
  assert.equal(short.length, 28);
  assert.equal(short, 'audit:910af539…-e84001784097');
  assert.equal(value, 'audit:910af539-c034-428c-98e6-e84001784097');
  assert.equal(shortenAuditId('WEB'), 'WEB');
  assert.equal(shortenAuditId(''), '—');
  assert.equal(shortenAuditId(value, 20).length, 20);
});
