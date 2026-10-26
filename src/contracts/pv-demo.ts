import type { BusinessReceipt } from '../preview-mock/business-repository';
import type { CommandRecoveryResult } from '../data/command-recovery';
import type { CatalogProduct, CatalogSku } from './catalog-create';

export const PV_DEMO_KIND = 'pv-profile-v1' as const;
export const PV_DEMO_PROVENANCE = 'HN-PV-DEMO-v1.0' as const;
/** No product image has approved provenance yet. Null remains supported. */
export const PV_DEMO_ASSETS: readonly { assetId: string; path: string; sha256: string }[] = [];
export type PvVisibility = 'hidden' | 'visible';
export interface PvEditable { displayName: string; imageAssetId: string | null; visibility: PvVisibility }
export interface PvObserved { observedSkuVersion: number; observedProductVersion: number }
export interface PvCreatePayload extends PvEditable, PvObserved { skuId: string; productId: string }
export interface PvUpdatePayload extends PvEditable, PvObserved {}
export interface PvProfile extends PvEditable {
  id: string; version: number; skuId: string; productId: string;
  provenance: typeof PV_DEMO_PROVENANCE; createdAt: string; updatedAt: string;
  createdBy: string; updatedBy: string;
  masterAvailable: boolean;
}
export interface PvAudit {
  id: string; commandId: string; entityId: string; actorKey: string; committedAt: string;
  command: 'pv-products.create' | 'pv-products.update';
  before: Omit<PvProfile, 'masterAvailable'> | null;
  after: Omit<PvProfile, 'masterAvailable'>;
}
export interface PvDemoSnapshot {
  mode: 'MOCK'; actorKey: 'preview:ducquang'; epoch: string; snapshotRevision: number;
  products: CatalogProduct[]; skus: CatalogSku[]; profiles: PvProfile[]; audits: PvAudit[];
  assets: typeof PV_DEMO_ASSETS;
  summary: { total: number; visible: number; hidden: number; missingImage: number };
}
export type PvDemoRequest = { commandId: string; epoch: string } & (
  { command: 'pv-products.create'; payload: PvCreatePayload } |
  { command: 'pv-products.update'; entityId: string; expectedVersion: number; payload: PvUpdatePayload }
);
export interface PvDemoOutcome { receipt: BusinessReceipt; replayed: boolean }
export interface PvDemoAdapter {
  available: boolean;
  readSnapshot(): Promise<PvDemoSnapshot>;
  execute(request: PvDemoRequest): Promise<PvDemoOutcome>;
  recovery: {
    restore(): Promise<CommandRecoveryResult<PvDemoRequest, PvDemoOutcome>>;
    retry(): Promise<CommandRecoveryResult<PvDemoRequest, PvDemoOutcome>>;
    acknowledge(commandId: string): Promise<void>;
  };
}
/** Approved canonical links; target screen resolves the ID from its own snapshot. */
export function pvMasterHref(screen: 'S03' | 'S04', entityId: string): string {
  return `#/preview/${screen}?entityId=${encodeURIComponent(entityId)}`;
}
