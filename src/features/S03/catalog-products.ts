import { localeForLanguage, parseShellLanguage } from '../../shared/shell-preferences';
import type { CatalogProduct, CatalogSnapshot, CatalogCreateOutcome, CatalogCreateRequest, CatalogCreateAdapter } from '../../contracts/catalog-create';
import { DEFAULT_PRODUCTS_QUERY, type ProductsQuery } from '../../contracts/products';
import { matchesSearchFields } from '../../shared/search';
import { isCatalogCreateOutcome } from '../../preview-mock/catalog-policy';

export const NEW_PRODUCTS_QUERY: ProductsQuery = { ...DEFAULT_PRODUCTS_QUERY };

/** Only this adapter-issued proof permits keeping a competing form ready.
 * Generic conflicts or unknown outcomes still need their existing recovery path. */
export function isUndispatchedCatalogScopeBusy(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const failure = error as { code?: unknown; notDispatched?: unknown };
  return failure.code === 'CATALOG_SCOPE_BUSY' && failure.notDispatched === true;
}

export function formatCatalogTimestamp(value: string, language: string) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : localeForLanguage(parseShellLanguage(language)), {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value));
}

/** This projection never feeds newly created records into the historical source model. */
export function queryCatalogProducts(products: readonly CatalogProduct[], query: ProductsQuery) {
  const filtered = products.filter(row => (query.group === 'all' || row.group === query.group)
    && (query.unit === 'all' || row.unit === query.unit)
    && (query.status === 'all' || row.status === query.status)
    && matchesSearchFields(row, query.search, [item => item.code, item => item.name]));
  const stable = (a: CatalogProduct, b: CatalogProduct) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  filtered.sort((a, b) => {
    if (!query.sortKey || !query.sort) return b.createdAt.localeCompare(a.createdAt) || stable(a, b);
    const left = a[query.sortKey], right = b[query.sortKey];
    const difference = typeof left === 'number' && typeof right === 'number'
      ? left - right : String(left).localeCompare(String(right), 'vi');
    return difference * (query.sort === 'desc' ? -1 : 1) || stable(a, b);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  return { rows: filtered.slice((page - 1) * query.pageSize, page * query.pageSize), total: filtered.length, page, pageCount };
}

/** Receipt identity, not list position, determines which accepted Detail opens. */
export function acceptedCreatedProduct(snapshot: CatalogSnapshot, request: CatalogCreateRequest<'product'>, outcome: CatalogCreateOutcome) {
  if (!isCatalogCreateOutcome(outcome, request) || snapshot.epoch !== request.epoch
    || snapshot.snapshotRevision < outcome.receipt.snapshotRevision) throw new Error('CATALOG_SNAPSHOT_NOT_ACCEPTED');
  const product = snapshot.products.find(row => row.id === outcome.receipt.entityId);
  if (!product || product.version !== outcome.receipt.version) throw new Error('CATALOG_PRODUCT_UNAVAILABLE');
  return product;
}

/** A detached form must leave its durable receipt for the next mounted reader. */
export async function reconcileCreatedProduct(adapter: CatalogCreateAdapter<'product'>, request: CatalogCreateRequest<'product'>,
  outcome: CatalogCreateOutcome, isCurrent: () => boolean) {
  const snapshot = await adapter.readSnapshot();
  if (!isCurrent()) return null;
  const product = acceptedCreatedProduct(snapshot, request, outcome);
  await adapter.recovery.acknowledge(request.commandId);
  return isCurrent() ? { snapshot, product } : null;
}
