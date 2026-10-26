import { localeForLanguage, parseShellLanguage } from '../../shared/shell-preferences';
import type { CatalogCreateOutcome, CatalogCreateRequest, CatalogProduct, CatalogSku, CatalogSnapshot } from '../../contracts/catalog-create';
import { isCatalogCreateOutcome, normalizeCatalogPayload } from '../../preview-mock/catalog-policy';
import { normalizeSearchText } from '../../shared/search';
import { DEFAULT_PAGE_SIZE } from '../../shared/table-query';

export interface SkuCatalogQuery {
  search: string; group: string; unit: string; status: 'all' | 'active' | 'inactive';
  order: 'newest' | 'oldest' | 'codeAsc' | 'codeDesc'; page: number; pageSize: number;
}
export const DEFAULT_SKU_CATALOG_QUERY: SkuCatalogQuery = {
  search: '', group: 'all', unit: 'all', status: 'all', order: 'newest', page: 1, pageSize: DEFAULT_PAGE_SIZE,
};
const fold = normalizeSearchText;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function queryCatalogSkus(rows: readonly CatalogSku[], query: SkuCatalogQuery) {
  const needle = fold(query.search);
  const filtered = rows.filter(row => (!needle || [row.code, row.name].some(value => fold(value).includes(needle)))
    && (query.group === 'all' || row.group === query.group)
    && (query.unit === 'all' || row.unit === query.unit)
    && (query.status === 'all' || row.status === query.status));
  filtered.sort((a, b) => {
    const primary = query.order === 'newest' ? compare(b.createdAt, a.createdAt)
      : query.order === 'oldest' ? compare(a.createdAt, b.createdAt)
      : query.order === 'codeAsc' ? compare(a.code, b.code) : compare(b.code, a.code);
    return primary || compare(a.id, b.id);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.max(1, Math.min(query.page, pageCount));
  return { rows: filtered.slice((page - 1) * query.pageSize, page * query.pageSize), page, pageCount,
    total: rows.length, filteredTotal: filtered.length,
    groups: [...new Set(rows.map(row => row.group))], units: [...new Set(rows.map(row => row.unit))] };
}
export interface SkuCatalogDraft { code: string; productId: string; barcode: string; status: '' | 'active' | 'inactive' }
export const emptySkuDraft = (): SkuCatalogDraft => ({ code: '', productId: '', barcode: '', status: '' });
export function skuCreatePayload(draft: SkuCatalogDraft, products: readonly CatalogProduct[]) {
  const selected = products.find(product => product.id === draft.productId && product.status === 'active');
  if (!selected) throw { code: 'VALIDATION_FAILED', status: 422, details: { field: 'productId' } };
  return normalizeCatalogPayload('sku', { code: draft.code, productId: selected.id, observedProductVersion: selected.version, barcode: draft.barcode, status: draft.status });
}
export function resolveCatalogSku(snapshot: CatalogSnapshot | null, id: string) {
  const sku = snapshot?.skus.find(row => row.id === id) ?? null;
  const product = sku ? snapshot?.products.find(row => row.id === sku.productId) ?? null : null;
  return { sku, product };
}
/** Receipt identity and the accepted snapshot, never a page position, determine success. */
export function assertSkuAccepted(snapshot: CatalogSnapshot, request: CatalogCreateRequest<'sku'>, outcome: CatalogCreateOutcome) {
  const { sku, product } = resolveCatalogSku(snapshot, outcome.receipt.entityId);
  if (!isCatalogCreateOutcome(outcome, request) || snapshot.epoch !== request.epoch
    || snapshot.snapshotRevision < outcome.receipt.snapshotRevision || snapshot.actorKey !== outcome.receipt.actorKey
    || !sku || !product || sku.productId !== request.payload.productId || sku.version !== outcome.receipt.version
    || sku.code !== request.payload.code || sku.status !== request.payload.status || sku.barcode !== request.payload.barcode) {
    throw { code: 'INVALID_RESPONSE', outcomeUnknown: true };
  }
}

export function formatSkuCatalogTime(value: string, language: string) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : localeForLanguage(parseShellLanguage(language)), {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value));
}

/** Only an explicit transport non-dispatch proof permits skipping recovery. */
export function isSkuCatalogScopeBusy(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const failure = error as { code?: unknown; notDispatched?: unknown };
  return failure.code === 'CATALOG_SCOPE_BUSY' && failure.notDispatched === true;
}
