import { localeForLanguage, parseShellLanguage, type ShellLanguage } from '../../shared/shell-preferences';
import type { CatalogCreateAdapter, CatalogCreateOutcome, CatalogCreateRequest, CatalogRecipient, CatalogSnapshot, RecipientCreatePayload } from '../../contracts/catalog-create';
import { isCatalogCreateOutcome, isCatalogSnapshot, normalizeCatalogPayload } from '../../preview-mock/catalog-policy';

export const RECIPIENT_CREATE_FIELDS = ['code', 'name', 'type', 'market', 'area', 'address', 'contact', 'phone', 'status'] as const;
export type RecipientCreateField = typeof RECIPIENT_CREATE_FIELDS[number];
export type RecipientCreateDraft = Record<RecipientCreateField, string>;
export const emptyRecipientDraft = (): RecipientCreateDraft => ({ code: '', name: '', type: '', market: '', area: '', address: '', contact: '', phone: '', status: '' });
export type RecipientCatalogSort = 'createdAt' | 'code' | 'name' | 'type' | 'market' | 'contact' | 'address' | 'status';
export interface RecipientCatalogQuery {
  search: string;
  type: string;
  market: string;
  status: 'all' | 'active' | 'inactive';
  sort: { key: RecipientCatalogSort; direction: 'asc' | 'desc' };
  page: number;
  pageSize: number;
}
export const defaultRecipientCatalogQuery = (): RecipientCatalogQuery => ({ search: '', type: 'all', market: 'all', status: 'all', sort: { key: 'createdAt', direction: 'desc' }, page: 1, pageSize: 10 });
const folded = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi').trim();
const byId = (a: CatalogRecipient, b: CatalogRecipient) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Query only the new, validated cohort; historical totals and source queries are independent. */
export function queryRecipientCatalog(rows: readonly CatalogRecipient[], query: RecipientCatalogQuery) {
  const search = folded(query.search);
  const filtered = rows.filter(row => (query.type === 'all' || row.type === query.type)
    && (query.market === 'all' || row.market === query.market)
    && (query.status === 'all' || row.status === query.status)
    && (!search || [row.code, row.name, row.market, row.area, row.address, row.contact, row.phone].some(value => folded(value).includes(search))));
  filtered.sort((a, b) => {
    const left = a[query.sort.key], right = b[query.sort.key];
    const comparison = query.sort.key === 'createdAt'
      ? (left < right ? -1 : left > right ? 1 : 0)
      : left.localeCompare(right, 'vi', { numeric: true });
    return comparison * (query.sort.direction === 'asc' ? 1 : -1) || byId(a, b);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.max(1, Math.min(query.page, pageCount));
  return { rows: filtered.slice((page - 1) * query.pageSize, page * query.pageSize), total: filtered.length, page, pageCount, totalCreated: rows.length };
}

export function createRecipientCatalogRequest(epoch: string, draft: RecipientCreateDraft): CatalogCreateRequest<'recipient'> {
  const payload = normalizeCatalogPayload('recipient', draft);
  return { command: 'recipients.create', commandId: crypto.randomUUID(), epoch, payload };
}

function unconfirmed(): never {
  throw Object.assign(new Error('RECIPIENT_CREATE_UNCONFIRMED'), { code: 'RECIPIENT_CREATE_UNCONFIRMED', outcomeUnknown: true });
}

/** Success requires a semantic receipt and the exact persisted ID in an accepted snapshot.
 * Do not acknowledge a journal entry while its accepted read is unavailable. */
export async function acceptCreatedRecipient(
  adapter: CatalogCreateAdapter<'recipient'>,
  request: CatalogCreateRequest<'recipient'>,
  outcome: CatalogCreateOutcome,
  stillCurrent: () => boolean = () => true,
): Promise<{ snapshot: CatalogSnapshot; row: CatalogRecipient }> {
  if (!isCatalogCreateOutcome(outcome, request)) return unconfirmed();
  const snapshot = await adapter.readSnapshot();
  if (!stillCurrent() || !isCatalogSnapshot(snapshot) || snapshot.epoch !== request.epoch
    || snapshot.snapshotRevision < outcome.receipt.snapshotRevision) return unconfirmed();
  const row = snapshot.recipients.find(item => item.id === outcome.receipt.entityId);
  if (!row || row.version !== outcome.receipt.version || row.createdAt !== outcome.receipt.committedAt
    || RECIPIENT_CREATE_FIELDS.some(field => row[field] !== request.payload[field])) return unconfirmed();
  await adapter.recovery.acknowledge(request.commandId);
  if (!stillCurrent()) return unconfirmed();
  return { snapshot, row };
}

export function recipientDraftFromPayload(payload: RecipientCreatePayload): RecipientCreateDraft {
  return { ...payload };
}

/** Only the adapter's verified pre-dispatch collision may keep this tab's draft editable. */
export function isRecipientCatalogScopeBusy(error: unknown): boolean {
  const failure = error as { code?: string; notDispatched?: boolean } | null;
  return failure?.code === 'CATALOG_SCOPE_BUSY' && failure.notDispatched === true;
}

export function formatRecipientCreatedAt(value: string, language: ShellLanguage) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : localeForLanguage(parseShellLanguage(language)), {
    dateStyle: 'short', timeStyle: 'medium', timeZone: 'Asia/Bangkok',
  }).format(new Date(value));
}
