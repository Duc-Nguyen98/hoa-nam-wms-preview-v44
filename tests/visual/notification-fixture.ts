import { createNotificationDesignSeed } from '../../src/preview-mock/notification-design-seed';
export const FIXED_NOW = '2026-10-25T05:00:00.000Z';
/** Fixed-clock view of the same approved data used by browser Preview. */
export function designFixture() {
  return createNotificationDesignSeed(Date.parse(FIXED_NOW)).map((item, i) => ({ ...item, id: `QA-DESIGN-${i + 1}` }));
}
