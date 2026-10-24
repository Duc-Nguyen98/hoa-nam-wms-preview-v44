import type { CatalogSnapshot } from '../contracts/catalog-create';
import type { OperationalPayloads } from '../contracts/operational-preview';

export interface OutboundDraftRow { skuId: string; quantity: string }
export type OutboundDraftError = 'EMPTY' | 'DUPLICATE_SKU' | 'MISSING_SKU' | 'INACTIVE_SKU' | 'INVALID_QUANTITY';

export function validateOutboundDraft(rows: readonly OutboundDraftRow[], catalog: CatalogSnapshot, selectedSkuIds: readonly string[]): { ok: true; requestedLines: OperationalPayloads['outbound.create']['requestedLines'] } | { ok: false; error: OutboundDraftError } {
  if (!rows.length) return { ok: false, error: 'EMPTY' };
  const seen = new Set<string>();
  const requestedLines: OperationalPayloads['outbound.create']['requestedLines'] = [];
  for (const row of rows) {
    if (!row.skuId) return { ok: false, error: 'MISSING_SKU' };
    if (seen.has(row.skuId)) return { ok: false, error: 'DUPLICATE_SKU' };
    seen.add(row.skuId);
    if (!selectedSkuIds.includes(row.skuId)) return { ok: false, error: 'MISSING_SKU' };
    const sku = catalog.skus.find(candidate => candidate.id === row.skuId);
    if (!sku) return { ok: false, error: 'MISSING_SKU' };
    const product = catalog.products.find(candidate => candidate.id === sku.productId);
    if (!product) return { ok: false, error: 'MISSING_SKU' };
    if (sku.status !== 'active' || product.status !== 'active') return { ok: false, error: 'INACTIVE_SKU' };
    const quantity = Number(row.quantity.trim());
    if (!row.quantity.trim() || !Number.isSafeInteger(quantity) || quantity <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
    requestedLines.push({ skuId: sku.id, quantity, observedSkuVersion: sku.version, observedProductVersion: product.version });
  }
  return { ok: true, requestedLines };
}
