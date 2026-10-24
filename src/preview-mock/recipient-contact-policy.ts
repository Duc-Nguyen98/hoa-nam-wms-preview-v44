import type { RecipientRow } from '../contracts/recipients';
import { recipientSourceRows } from '../data/adapters/recipients-fixture-adapter';
import { applyRecipientContactPatch, RECIPIENT_CONTACT_COMMAND } from '../features/S05/recipient-update-command';
import type { BusinessActor, BusinessCommand, BusinessHandler, BusinessRecord } from './business-repository';
import { PreviewHttpError } from './errors';

/** Owner W4-02A: Preview-only identities, never production IDs or a code-based grant. */
const APPROVED_KEYS = ['NR-001', 'NR-002', 'NR-003', 'NR-004', 'NR-005'] as const;
const supplied = recipientSourceRows();
if (supplied.length !== APPROVED_KEYS.length || new Set(supplied.map(row => row.key)).size !== APPROVED_KEYS.length
  || supplied.some(row => !(APPROVED_KEYS as readonly string[]).includes(row.key) || row.code !== row.key)) {
  throw new Error('S05 W4-02A accepted identity set changed; explicit source review required');
}
export const RECIPIENT_SOURCE_ROWS = Object.freeze(supplied.map(row => Object.freeze(row)));
export const RECIPIENT_ENTITY_IDS = Object.freeze(APPROVED_KEYS.map(key => `s05:${key}`));
export interface RecipientContactData { provenance: 'accepted-source-detail'; row: RecipientRow }
const forbidden = () => new PreviewHttpError(403, 'MOCK_COMMAND_FORBIDDEN', 'Quyền sửa không khả dụng cho bản ghi này.');
export function isRecipientContactRecord(record: BusinessRecord | undefined): record is BusinessRecord & { data: RecipientContactData } {
  if (!record || record.kind !== 'recipient' || !RECIPIENT_ENTITY_IDS.includes(record.id) || !record.data || typeof record.data !== 'object') return false;
  const data = record.data as RecipientContactData;
  const original = RECIPIENT_SOURCE_ROWS.find(row => `s05:${row.key}` === record.id);
  return !!original && data.provenance === 'accepted-source-detail' && !!data.row
    && Object.keys(data).every(key => ['provenance', 'row'].includes(key))
    && Object.keys(data.row).length === Object.keys(original).length
    && Object.keys(original).every(key => ['name', 'contact', 'phone'].includes(key)
      ? typeof data.row[key as keyof RecipientRow] === 'string'
      : data.row[key as keyof RecipientRow] === original[key as keyof RecipientRow]);
}
export function authorizeRecipientContact(actor: Readonly<BusinessActor>, command: Readonly<BusinessCommand>) {
  return actor.key === 'preview:ducquang' && actor.confirmed === true && command.command === RECIPIENT_CONTACT_COMMAND
    && typeof command.entityId === 'string' && RECIPIENT_ENTITY_IDS.includes(command.entityId);
}
export const RECIPIENT_CONTACT_HANDLERS: Record<string, BusinessHandler> = {
  [RECIPIENT_CONTACT_COMMAND]: { operation: 'update', entityKind: 'recipient', apply(payload, current) {
    if (!isRecipientContactRecord(current)) throw forbidden();
    return { provenance: current.data.provenance, row: applyRecipientContactPatch(payload, current.data.row) };
  } },
};
