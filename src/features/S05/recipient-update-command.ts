import type { RecipientRow } from '../../contracts/recipients';
import type { BusinessCommand, BusinessReceipt } from '../../preview-mock/business-repository';
import { PreviewHttpError } from '../../preview-mock/errors';
import type { CommandRecoveryResult } from '../../data/command-recovery';

export const RECIPIENT_CONTACT_COMMAND = 'recipients.update-contact' as const;
export const RECIPIENT_CONTACT_FIELDS = ['name', 'contact', 'phone'] as const;
export type RecipientContactDraft = Pick<RecipientRow, typeof RECIPIENT_CONTACT_FIELDS[number]>;
export type RecipientContactPatch = Partial<RecipientContactDraft>;
export interface RecipientUpdateContext {
  entityId: string; epoch: string; version: number;
  actorKey: 'preview:ducquang'; provenance: 'accepted-source-detail'; row: RecipientRow;
}
export interface RecipientUpdateRequest extends BusinessCommand {
  command: typeof RECIPIENT_CONTACT_COMMAND; entityId: string; expectedVersion: number; payload: RecipientContactPatch;
}
export interface RecipientUpdateAdapter {
  /** Host capability resolution; display role and matching code alone never grant access. */
  available: boolean;
  readContext(rowKey: string): Promise<RecipientUpdateContext>;
  execute(request: Readonly<RecipientUpdateRequest>): Promise<{ receipt: BusinessReceipt; replayed: boolean }>;
  invalidate(): void | Promise<void>;
  recovery?: {
    restore(rowKey: string): Promise<CommandRecoveryResult<RecipientUpdateRequest, { receipt: BusinessReceipt; replayed: boolean }>>;
    acknowledge(rowKey: string, commandId: string): Promise<void>;
  };
}
export type RecipientContactErrors = Partial<Record<keyof RecipientContactDraft, string>>;
const fail = (code: string, details?: unknown) => new PreviewHttpError(code === 'MOCK_COMMAND_FORBIDDEN' ? 403 : 422, code, 'Không thể lưu thông tin nơi nhận.', details);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && [Object.prototype,null].includes(Object.getPrototypeOf(v));
const controls = /[\u0000-\u001f\u007f-\u009f]/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** W4-02A: host must independently enforce current actor, provenance, scope and capability. */
export function assertRecipientUpdateContext(value: unknown, selectedKey: string): asserts value is RecipientUpdateContext {
  if (!object(value) || value.actorKey !== 'preview:ducquang' || value.provenance !== 'accepted-source-detail'
    || typeof value.entityId !== 'string' || !value.entityId || typeof value.epoch !== 'string' || !uuid.test(value.epoch)
    || !Number.isSafeInteger(value.version) || Number(value.version) < 1 || !object(value.row)
    || value.row.key !== selectedKey || typeof value.row.code !== 'string' || !/^NR-00[1-5]$/.test(value.row.code)
    || !['key','code','name','contact','phone','type','market','area','address','statusLabel'].every(k=>typeof (value.row as Record<string,unknown>)[k] === 'string')
    || !['active','inactive'].includes(String(value.row.status))) throw fail('MOCK_COMMAND_FORBIDDEN');
}

/** Pure screen-owned business validation; host handler preserves its own envelope. */
export function applyRecipientContactPatch(payload: unknown, current: RecipientRow): RecipientRow {
  if (!object(payload)) throw fail('VALIDATION_FAILED');
  if (Reflect.ownKeys(payload).some(key => typeof key !== 'string' || !(RECIPIENT_CONTACT_FIELDS as readonly string[]).includes(key))) throw fail('IMMUTABLE_OR_UNKNOWN_FIELD');
  const patch: RecipientContactPatch = {}, fieldErrors: RecipientContactErrors = {};
  for (const key of RECIPIENT_CONTACT_FIELDS) {
    if (!Object.hasOwn(payload,key)) continue;
    const raw=payload[key];
    if(typeof raw !== 'string') { fieldErrors[key]='Giá trị phải là chuỗi.'; continue; }
    // Unchanged legacy values are retained verbatim. Any changed value follows W4-02A.
    if(raw===current[key]) continue;
    const value=raw.trim();
    const length=[...value].length;
    if(key==='name' && (length<1 || length>120 || controls.test(raw))) fieldErrors.name='Tên nơi nhận cần 1–120 ký tự, không chứa ký tự điều khiển.';
    if(key==='contact' && (length>100 || controls.test(raw))) fieldErrors.contact='Người liên hệ tối đa 100 ký tự, không chứa ký tự điều khiển.';
    if(key==='phone' && (length>32 || controls.test(raw) || (value!=='' && (!/^[0-9 +()\-]+$/.test(value) || (value.match(/[0-9]/g)?.length ?? 0)<6 || (value.match(/[0-9]/g)?.length ?? 0)>15)))) fieldErrors.phone='Điện thoại tối đa 32 ký tự và có 6–15 chữ số; chỉ dùng số, khoảng trắng, +, -, (, ).';
    patch[key]=value;
  }
  if(Object.keys(fieldErrors).length) throw fail('VALIDATION_FAILED',{fieldErrors});
  return {...current,...patch};
}

export function assertRecipientUpdateReceipt(receipt: BusinessReceipt, sent: RecipientUpdateRequest): void {
  if(!receipt || receipt.mode!=='MOCK'||receipt.commandId!==sent.commandId||receipt.command!==sent.command||receipt.epoch!==sent.epoch
    ||receipt.entityId!==sent.entityId||receipt.actorKey!=='preview:ducquang'||receipt.previousVersion!==sent.expectedVersion
    ||typeof receipt.changed!=='boolean'||receipt.version!==sent.expectedVersion+(receipt.changed?1:0)
    ||receipt.record?.id!==sent.entityId||receipt.record?.version!==receipt.version) throw fail('INVALID_RECEIPT');
}

export function recipientContactPatch(draft: RecipientContactDraft, current: RecipientRow): RecipientContactPatch {
  const changed=Object.fromEntries(RECIPIENT_CONTACT_FIELDS.filter(key=>draft[key]!==current[key]).map(key=>[key,draft[key]]));
  const next=applyRecipientContactPatch(changed,current);
  return Object.fromEntries(RECIPIENT_CONTACT_FIELDS.filter(key=>next[key]!==current[key]).map(key=>[key,next[key]]));
}

export function createRecipientUpdateRequest(context: RecipientUpdateContext, draft: RecipientContactDraft, commandId=crypto.randomUUID()): RecipientUpdateRequest | null {
  assertRecipientUpdateContext(context,context.row.key);
  if(!uuid.test(commandId)) throw fail('VALIDATION_FAILED');
  const payload=recipientContactPatch(draft,context.row);
  if(!Object.keys(payload).length) return null;
  return {command:RECIPIENT_CONTACT_COMMAND,commandId,epoch:context.epoch,entityId:context.entityId,expectedVersion:context.version,payload};
}
