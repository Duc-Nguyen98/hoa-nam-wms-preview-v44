import { PREVIEW_TIME_ZONE } from '../../src/shared/foundation';
import type { BusinessNotification } from '../../src/notifications/notification-feed';

const daysAgo = (now: number, days: number, hour: number, minute: number) => {
  const value = new Date(now);
  value.setHours(hour, minute, 0, 0);
  value.setDate(value.getDate() - days);
  return value.toLocaleString('en-CA', { timeZone: PREVIEW_TIME_ZONE, hour12: false }).replace(', ', 'T') + '+07:00';
};

/** Business-shaped feed used only by the public Preview runtime. QA seeds are supplied explicitly. */
export function createBusinessNotificationSeed(now = Date.now()): BusinessNotification[] {
  return [
    {
      id: 'HN-NTF-OUT-20261025-0187', kind: 'business', category: 'outbound', severity: 'success',
      titleKey: 'outboundReadyTitle', bodyKey: 'outboundReadyBody', createdAt: daysAgo(now, 0, 9, 42), readAt: null,
      target: { href: '#/preview/S15', labelKey: 'openDocument', reference: 'PXK-20261025-0187' },
    },
    {
      id: 'HN-NTF-INV-20261025-0042', kind: 'business', category: 'inventory', severity: 'warning',
      titleKey: 'inventoryVarianceTitle', bodyKey: 'inventoryVarianceBody', createdAt: daysAgo(now, 0, 8, 18), readAt: null,
      target: { href: '#/preview/S16', labelKey: 'openInventory', reference: 'SKU-HAN-AC-042' },
    },
    {
      id: 'HN-NTF-PUT-20261024-0091', kind: 'business', category: 'putaway', severity: 'info',
      titleKey: 'putawayCompletedTitle', bodyKey: 'putawayCompletedBody', createdAt: daysAgo(now, 1, 16, 35), readAt: new Date(now - 1000 * 60 * 60 * 17).toISOString(),
      target: { href: '#/preview/S14', labelKey: 'openPutaway', reference: 'PUT-20261024-0091' },
    },
    {
      id: 'HN-NTF-WTY-20261023-0114', kind: 'business', category: 'warranty', severity: 'warning',
      titleKey: 'warrantyReviewTitle', bodyKey: 'warrantyReviewBody', createdAt: daysAgo(now, 2, 14, 5), readAt: new Date(now - 1000 * 60 * 60 * 40).toISOString(),
      target: { href: '#/preview/S09', labelKey: 'openWarranty', reference: 'BH-20261023-0114' },
    },
    {
      id: 'HN-NTF-SYS-20261022-0008', kind: 'business', category: 'system', severity: 'info',
      titleKey: 'warehouseConfigTitle', bodyKey: 'warehouseConfigBody', createdAt: daysAgo(now, 3, 10, 12), readAt: new Date(now - 1000 * 60 * 60 * 70).toISOString(),
      target: { href: '#/preview/S28', labelKey: 'openSettings', reference: 'CFG-20261022-0008' },
    },
  ];
}
