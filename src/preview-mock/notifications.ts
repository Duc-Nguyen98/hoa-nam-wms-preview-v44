import { createNotificationHarnessState, type NotificationRecord } from '../notifications/notification-model';
import type { PreviewPersistence } from './storage';
import { PreviewHttpError } from './errors';

// Preserve v2 on disk; it contains the obsolete generated five-row business feed.
// v3 starts empty unless an actual provider or explicit QA seed supplies records.
export const NOTIFICATION_STORAGE_NAMESPACE = 'hoa-nam-wms-preview-notifications-v3';
export type DemoNotification = NotificationRecord;
export interface NotificationReceipt { commandId: string; action: 'read-one' | 'unread-one' | 'read-all'; notificationId: string | null; revision: number; committedAt: string; changed: number }
interface ActorNotifications { revision: number; items: DemoNotification[]; receipts: NotificationReceipt[] }
interface RepositoryState { version: 1; actors: Record<string, ActorNotifications> }
export interface NotificationPage { actorKey: string; revision: number; items: readonly DemoNotification[]; total: number; totalUnread: number; limit: number; receipt?: NotificationReceipt }
export interface NotificationRepositoryOptions {
  persistence: PreviewPersistence;
  namespace: string;
  actor: () => Promise<{key:string;confirmed:boolean;expiresAt:number} | null>;
  captureFence: () => () => void;
  now?: () => number;
  /** Isolated tests/QA supply their own seed, never overwrite Main storage. */
  seed?: () => DemoNotification[];
}
const queues = new Map<string, Promise<unknown>>();
function serialized<T>(namespace: string, task: () => Promise<T>) {
  const execute = () => {
    if (typeof window === 'undefined' || !navigator.locks) return task();
    return navigator.locks.request(`${namespace}:notifications`, task);
  };
  const next = (queues.get(namespace) ?? Promise.resolve()).then(execute,execute);
  queues.set(namespace,next.catch(() => undefined));
  return next;
}
const record = (value: unknown): value is Record<string,unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const localized = (value:unknown) => record(value) && ['vi','en','zh-CN'].every(key=>typeof value[key]==='string');
function validPresentation(value:unknown):boolean {
  if(value===undefined)return true;
  if(!record(value))return false;
  return ['title','body','summary','categoryLabel','cardTitle'].every(key=>value[key]===undefined||localized(value[key]))
    && (value.targetVerified===undefined||typeof value.targetVerified==='boolean')
    && (value.fields===undefined||Array.isArray(value.fields)&&value.fields.every(field=>record(field)&&localized(field.label)&&localized(field.value)
      && (field.tone===undefined||['warning','success','info'].includes(String(field.tone)))));
}
function validItem(value: unknown): value is DemoNotification {
  if (!record(value) || typeof value.id !== 'string' || !value.id || typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))
    || !(value.readAt === null || typeof value.readAt === 'string' && Number.isFinite(Date.parse(value.readAt)))) return false;
  if (value.kind === 'mock-preview') {
    return ['itemA','itemB','itemC'].includes(String(value.titleKey)) && ['bodyA','bodyB','bodyC'].includes(String(value.bodyKey)) && value.target === null;
  }
  if (value.kind === 'business') {
    return validPresentation(value.presentation) && ['outbound','inventory','putaway','warranty','system','inbound','printing'].includes(String(value.category))
      && ['info','warning','success'].includes(String(value.severity))
      && ['outboundReadyTitle','inventoryVarianceTitle','putawayCompletedTitle','warrantyReviewTitle','warehouseConfigTitle'].includes(String(value.titleKey))
      && ['outboundReadyBody','inventoryVarianceBody','putawayCompletedBody','warrantyReviewBody','warehouseConfigBody'].includes(String(value.bodyKey))
      && record(value.target) && typeof value.target.href === 'string' && value.target.href.startsWith('#/preview/')
      && typeof value.target.reference === 'string' && ['openDocument','openInventory','openPutaway','openWarranty','openSettings'].includes(String(value.target.labelKey));
  }
  return false;
}
function validState(value: unknown): value is RepositoryState {
  return record(value) && value.version === 1 && record(value.actors) && Object.values(value.actors).every(actor => record(actor)
    && Number.isSafeInteger(actor.revision) && Number(actor.revision) >= 0 && Array.isArray(actor.items) && actor.items.every(validItem)
    && new Set(actor.items.map(item => item.id)).size === actor.items.length && Array.isArray(actor.receipts)
    && actor.receipts.every(receipt => record(receipt) && typeof receipt.commandId === 'string' && ['read-one','unread-one','read-all'].includes(String(receipt.action))
      && Number.isSafeInteger(receipt.revision) && Number.isSafeInteger(receipt.changed) && typeof receipt.committedAt === 'string'));
}
export function createNotificationRepository(options: NotificationRepositoryOptions) {
  const now = options.now ?? Date.now;
  const seed = options.seed ?? (() => []);
  async function execute(limit: number, command?: {commandId:string; action:'read-one'|'unread-one'|'read-all'; notificationId?:string}): Promise<NotificationPage> {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000) throw new PreviewHttpError(400,'INVALID_NOTIFICATION_PAGE','Trang thông báo không hợp lệ.');
    const fence = options.captureFence();
    return serialized(options.namespace, async () => {
      fence();
      const actor = await options.actor();
      if (!actor?.confirmed || actor.expiresAt <= now()) throw new PreviewHttpError(401,'SESSION_EXPIRED','Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
      fence();
      const stored = await options.persistence.read();
      if (stored !== null && !validState(stored)) throw new PreviewHttpError(503,'NOTIFICATION_DATA_INVALID','Dữ liệu thông báo chưa hợp lệ. Vui lòng thử lại.');
      const data: RepositoryState = stored === null ? {version:1,actors:{}} : structuredClone(stored);
      const existing = Object.hasOwn(data.actors,actor.key) ? data.actors[actor.key] : undefined;
      const state = existing ?? {revision:0,items:seed(),receipts:[]};
      if (!state.items.every(validItem)) throw new Error('Invalid notification seed');
      let changed = !existing;
      let receipt: NotificationReceipt | undefined;
      if (command) {
        if (!command.commandId.trim() || command.commandId.length > 160) throw new PreviewHttpError(400,'INVALID_NOTIFICATION_COMMAND','Lệnh thông báo không hợp lệ.');
        receipt = state.receipts.find(item => item.commandId === command.commandId);
        if (receipt && (receipt.action !== command.action || receipt.notificationId !== (command.notificationId ?? null))) throw new PreviewHttpError(409,'NOTIFICATION_COMMAND_CONFLICT','Lệnh thông báo bị trùng. Vui lòng thử lại.');
        if (!receipt) {
          if (command.action !== 'read-all' && !state.items.some(item => item.id === command.notificationId)) throw new PreviewHttpError(404,'NOTIFICATION_NOT_FOUND','Không tìm thấy thông báo.');
          const committedAt = new Date(now()).toISOString();
          let affected = 0;
          state.items = state.items.map(item => {
            const nextReadAt = command.action === 'unread-one' ? null : committedAt;
            const needsChange = command.action === 'unread-one' ? item.readAt !== null : item.readAt === null;
            return needsChange && (command.action === 'read-all' || item.id === command.notificationId)
              ? (affected++, {...item,readAt:nextReadAt}) : item;
          });
          state.revision++;
          receipt = {commandId:command.commandId,action:command.action,notificationId:command.notificationId ?? null,revision:state.revision,committedAt,changed:affected};
          state.receipts.push(receipt); changed = true;
        }
      }
      fence();
      const currentActor = await options.actor();
      if (!currentActor?.confirmed || currentActor.key !== actor.key || currentActor.expiresAt <= now()) throw new PreviewHttpError(401,'NOTIFICATION_ACTOR_CHANGED','Phiên làm việc đã thay đổi.');
      fence();
      if (changed) {
        Object.defineProperty(data.actors,actor.key,{value:state,enumerable:true,writable:true,configurable:true});
        await options.persistence.write(data);
      }
      // Cancellation/account change after commit hides this response, never rolls back persisted state.
      fence();
      return {actorKey:actor.key,revision:state.revision,items:state.items.slice(0,limit),total:state.items.length,
        totalUnread:state.items.filter(item => item.readAt === null).length,limit,...(receipt ? {receipt} : {})} satisfies NotificationPage;
    });
  }
  return {
    read: (limit = 50) => execute(limit),
    markRead: (id:string,commandId:string,limit=50) => execute(limit,{action:'read-one',notificationId:id,commandId}),
    markUnread: (id:string,commandId:string,limit=50) => execute(limit,{action:'unread-one',notificationId:id,commandId}),
    markAllRead: (commandId:string,limit=50) => execute(limit,{action:'read-all',commandId}),
  };
}
export type NotificationRepository = ReturnType<typeof createNotificationRepository>;
