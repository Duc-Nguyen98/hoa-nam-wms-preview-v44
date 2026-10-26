import type { BusinessReceipt } from '../preview-mock/business-repository';
import type { CommandRecoveryResult } from '../data/command-recovery';

export type CatalogDomain = 'product' | 'sku' | 'recipient';
export type CatalogStatus = 'active' | 'inactive';
export const PRODUCT_GROUPS = ['Linh kiện điện', 'Vật tư đóng gói', 'Phụ kiện', 'Bộ phụ kiện'] as const;
export const PRODUCT_UNITS = ['Bộ', 'Cái', 'Sợi', 'Cuộn'] as const;
export const RECIPIENT_TYPES = ['Khách công trình', 'Khách lẻ'] as const;
export const RECIPIENT_MARKETS = ['Miền Bắc', 'Miền Trung', 'Miền Nam'] as const;
export interface ProductCreatePayload { code: string; name: string; group: typeof PRODUCT_GROUPS[number]; unit: typeof PRODUCT_UNITS[number]; status: CatalogStatus }
export interface SkuCreatePayload { code: string; productId: string; observedProductVersion: number; barcode: string | null; status: CatalogStatus }
export interface RecipientCreatePayload { code: string; name: string; type: typeof RECIPIENT_TYPES[number]; market: typeof RECIPIENT_MARKETS[number]; area: string; address: string; contact: string; phone: string; status: CatalogStatus }
export interface CatalogPayloads { product: ProductCreatePayload; sku: SkuCreatePayload; recipient: RecipientCreatePayload }
export const CATALOG_COMMANDS = { product: 'products.create', sku: 'skus.create', recipient: 'recipients.create' } as const;
export const CATALOG_KINDS = { product: 'catalog-product-v1', sku: 'catalog-sku-v1', recipient: 'recipient-master-v1' } as const;
export const CATALOG_PROVENANCE = 'owner-proposed-catalog-v1' as const;
export interface CatalogMetadata { id: string; version: number; provenance: typeof CATALOG_PROVENANCE; createdAt: string; updatedAt: string }
export interface CatalogProduct extends CatalogMetadata, ProductCreatePayload { skuCount: number }
export interface CatalogSku extends CatalogMetadata, Omit<SkuCreatePayload, 'observedProductVersion'> { productCode: string; name: string; group: ProductCreatePayload['group']; unit: ProductCreatePayload['unit'] }
export interface CatalogRecipient extends CatalogMetadata, RecipientCreatePayload {}
/** All lists and derived relationships are projected from one committed snapshot. */
export interface CatalogSnapshot { actorKey: 'preview:ducquang'; epoch: string; snapshotRevision: number; products: CatalogProduct[]; skus: CatalogSku[]; recipients: CatalogRecipient[] }
export interface CatalogCreateRequest<D extends CatalogDomain = CatalogDomain> { commandId: string; epoch: string; command: typeof CATALOG_COMMANDS[D]; payload: CatalogPayloads[D] }
export interface CatalogCreateOutcome { receipt: BusinessReceipt; replayed: boolean }
export interface CatalogCreateAdapter<D extends CatalogDomain = CatalogDomain> {
  available: boolean;
  readSnapshot(): Promise<CatalogSnapshot>;
  execute(request: CatalogCreateRequest<D>): Promise<CatalogCreateOutcome>;
  recovery: {
    restore(): Promise<CommandRecoveryResult<CatalogCreateRequest<D>, CatalogCreateOutcome>>;
    retry(): Promise<CommandRecoveryResult<CatalogCreateRequest<D>, CatalogCreateOutcome>>;
    acknowledge(commandId: string): Promise<void>;
  };
}
export function getRecipientById(snapshot: CatalogSnapshot, id: string) { return snapshot.recipients.find(row => row.id === id) ?? null; }
export function listSelectableRecipients(snapshot: CatalogSnapshot) { return snapshot.recipients.filter(row => row.status === 'active'); }
export function listSelectableProducts(snapshot: CatalogSnapshot) { return snapshot.products.filter(row => row.status === 'active'); }
