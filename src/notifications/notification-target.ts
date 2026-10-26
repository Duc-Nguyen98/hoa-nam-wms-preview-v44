import { resolveNotificationSourceTarget } from '../data/adapters/notification-document-fixture-adapter';
import { resolveNotificationDocumentSelection } from '../app/notification-document-route';
import type { BusinessNotification } from './notification-feed';
import { resolveOverviewDocumentSelection } from '../app/overview-document-route';

const lists = {
  outbound: { href: '#/preview/S15', labelKey: 'openOutboundList' },
  inbound: { href: '#/preview/S12', labelKey: 'openReceiptList' },
  printing: { href: '#/preview/S23', labelKey: 'openLabels' },
  inventory: { href: '#/preview/S16', labelKey: 'openInventory' },
  putaway: { href: '#/preview/S14', labelKey: 'openPutawayList' },
  warranty: { href: '#/preview/S09', labelKey: 'openWarrantyList' },
  system: { href: '#/preview/S28', labelKey: 'openSettings' },
} as const;

/** A screen link is not a document identity. Validate its destination and label it as a list. */
export function notificationTarget(item: BusinessNotification) {
  if (item.presentation?.targetVerified !== true) return null;
  const related = resolveNotificationSourceTarget(item);
  if (related) return related;
  if (item.id.startsWith('PREVIEW-DESIGN-') || resolveNotificationDocumentSelection(item.target.href)) return null;
  const selection = resolveOverviewDocumentSelection(item.target.href);
  if (selection) {
    const screen = item.category === 'inbound' ? 'S12' : item.category === 'outbound' ? 'S15' : null;
    return selection.target && selection.screen === screen
      ? { href: item.target.href, labelKey: screen === 'S12' ? 'openReceipt' : 'openDocument' } : null;
  }
  const list = lists[item.category];
  // Earlier saved design notifications pointed a tray reference at putaway orders.
  // Resolve those existing records without replacing their persisted read status.
  if (item.category === 'putaway' && /^TRAY-/.test(item.target.reference)
      && ['#/preview/S11', '#/preview/S14'].includes(item.target.href)) {
    return { href: '#/preview/S11', labelKey: 'openTrayList' };
  }
  return item.target.href === list.href ? list : null;
}
