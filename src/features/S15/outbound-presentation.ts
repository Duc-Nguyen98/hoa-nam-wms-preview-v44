import type { CatalogRecipient } from '../../contracts/catalog-create';
import type { OutboundRecord } from './outbound-binding';

/** Submitted recipients are historical evidence, never replaced with a live catalogue join. */
export function outboundRecipient(row: OutboundRecord, recipients: readonly CatalogRecipient[] = []) {
  const value = row.data.recipientSnapshot;
  if (!value) return ['DRAFT','SCANNING'].includes(row.data.status) ? recipients.find(recipient=>recipient.id===row.data.recipientId)??null : null;
  if(typeof value !== 'object') return null;
  const data = value as unknown as Record<string, unknown>;
  return data.id === row.data.recipientId && typeof data.name === 'string'
    ? { code:typeof data.code==='string'?data.code:'', name:data.name, address:typeof data.address === 'string' ? data.address : '', contact:typeof data.contact === 'string' ? data.contact : '', phone:typeof data.phone === 'string' ? data.phone : '' } : null;
}
export function queryOutbounds(rows: readonly OutboundRecord[], search: string, status: string, recipients: readonly CatalogRecipient[] = []) {
  const term=search.trim().normalize('NFC').toLocaleLowerCase();
  return rows.filter(row => (!status || row.data.status===status) && (!term || [row.data.code,outboundRecipient(row, recipients)?.name ?? ''].some(value=>value.normalize('NFC').toLocaleLowerCase().includes(term))));
}
