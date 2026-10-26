import type { BusinessActor, BusinessCommand } from './business-repository';
import type { PreviewBusinessCommandBinding } from './business-reads';
import { createWarehouseCommandSeam } from '../features/S28/warehouse-command';
import { createLabelPrintCommandSeam } from '../features/S23/label-print-command';
import { LABEL_REPORT_ENTITY_ID } from './business-reads';
import { authorizeRecipientContact, RECIPIENT_CONTACT_HANDLERS } from './recipient-contact-policy';
import { authorizeCatalogCreate, CATALOG_CREATE_HANDLERS } from './catalog-policy';
import { authorizePvDemo, PV_DEMO_HANDLERS } from './pv-demo-policy';

/** Owner P01 A,18October2026. Browser demonstration policy only; no production grant. */
export const APPROVED_PREVIEW_ACTOR = 'preview:ducquang';
export const APPROVED_PREVIEW_POLICY = Object.freeze({
  version: 'OWNER-PROGRESS-RECOVERY-2026-10-18-P01-A',
  actorKey: APPROVED_PREVIEW_ACTOR,
  warehouseId: 'warehouse-hn-01',
  warehouseCapabilities: ['warehouse.view', 'warehouse.manage'],
  defectCapabilities: ['mock.defects.read', 'mock.defects.create', 'mock.defects.update'],
  labelCapabilities: ['labels.reprint', 'labels.retry'],
  labelEntityId: LABEL_REPORT_ENTITY_ID,
  labelCodes: ['LBH0012341', 'LBH0012342', 'LBH0012343', 'LBH0012344', 'LBH0012345'],
  labelDecision: 'OWNER-TOAST-S23-CLEANUP-2026-10-19',
  recipientCapabilities: ['recipients.update-contact'],
  recipientDecision: 'OWNER-WAVE4-EXECUTION-2026-10-19-W4-02A',
  catalogCapabilities: ['products.create', 'skus.create', 'recipients.create'],
  catalogDecision: 'OWNER-CATALOG-CREATE-APPROVED-2026-10-19',
  pvCapabilities: ['pv-products.create', 'pv-products.update', 'pv-products.preview'],
  pvDecision: 'HN-PV-DEMO-v1.0-OWNER-CONDITIONAL-20261021',
});

export function createApprovedPreviewBinding(account: {
  recoveryActor(): Promise<BusinessActor | null>;
  captureRecoveryReadFence(): () => void;
}, defectsHandlers?: PreviewBusinessCommandBinding['defectsHandlers']): PreviewBusinessCommandBinding {
  const warehouse = createWarehouseCommandSeam(actor => actor.key === APPROVED_PREVIEW_ACTOR);
  const labels = createLabelPrintCommandSeam((actor, target) => actor.key === APPROVED_PREVIEW_ACTOR
    && target.entityId === APPROVED_PREVIEW_POLICY.labelEntityId
    && APPROVED_PREVIEW_POLICY.labelCodes.includes(target.labelCode));
  return {
    actor: () => account.recoveryActor(),
    captureReadFence: () => account.captureRecoveryReadFence(),
    defectsHandlers,
    operationalEnabled: true,
    putawayHistoryRead: true,
    labelHandlers: labels.handlers,
    recipientHandlers: RECIPIENT_CONTACT_HANDLERS,
    catalogHandlers: CATALOG_CREATE_HANDLERS,
    pvHandlers: PV_DEMO_HANDLERS,
    authorize(actor: Readonly<BusinessActor>, command: Readonly<BusinessCommand>) {
      if (actor.key !== APPROVED_PREVIEW_ACTOR || actor.confirmed !== true) return false;
      if (authorizeCatalogCreate(actor, command)) return true;
      if (authorizePvDemo(actor, command)) return true;
      if (command.command === 'recipients.update-contact') return authorizeRecipientContact(actor, command);
      if (command.command === 'warehouse.update') return warehouse.authorize(actor, command);
      if (command.command === 'labels.reprint' || command.command === 'labels.retry') return labels.authorize(actor, command);
      return (command.command === 'defects.create' || command.command === 'defects.update')
        && !!defectsHandlers?.[command.command];
    },
  };
}
