import type { OperationalCommand } from '../contracts/operational-preview';
import type { PreviewBusinessReads } from './business-reads';
import type { PutawayHistoryQuery } from '../contracts/putaway-history';
import type { BusinessCommand } from './business-repository';
import { PreviewHttpError } from './errors';

const invalid = () => new PreviewHttpError(422, 'VALIDATION_FAILED', 'Yêu cầu lưu chưa hợp lệ.');
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** The same versioned API envelope/error path is used by Real and Preview adapters.
 * This transport supplies no actor, capability or domain policy from the request body. */
export async function routeBusinessCommand(method: string, path: string, raw: unknown, business: PreviewBusinessReads, signal: AbortSignal, search?: URLSearchParams) {
  if (method === 'GET' && path === '/api/v1/putaway-history') {
    const q: PutawayHistoryQuery = { from: search?.get('from') ?? '', to: search?.get('to') ?? '', search: search?.get('search') ?? '',
      action: (search?.get('action') ?? '') as PutawayHistoryQuery['action'], page: Number(search?.get('page') ?? 1), pageSize: Number(search?.get('pageSize') ?? 9) };
    return { handled: true as const, data: await business.readPutawayHistory(q, signal), status: 200 };
  }
  if (method === 'GET' && path === '/api/v1/operations/snapshot') return { handled: true as const, data: await business.operational('WEB').read(signal), status: 200 };
  if (method === 'POST' && ['/api/v1/operations/commands', '/api/v1/operations/scenario/commands'].includes(path)) {
    let body: unknown = raw;
    try { if (typeof body === 'string') body = JSON.parse(body); } catch { throw invalid(); }
    if (!object(body)) throw invalid();
    const surface = path === '/api/v1/operations/scenario/commands' ? 'QA' : 'WEB';
    const data = await business.operational(surface).execute(body as unknown as OperationalCommand, signal);
    return { handled: true as const, data, status: data.replayed ? 200 : 201 };
  }
  const warehouse = method === 'PUT' && path === '/api/v1/admin/warehouse-config';
  const defects = method === 'POST' && path === '/api/v1/defects/commands';
  const labels = method === 'POST' && path === '/api/v1/reports/labels/commands';
  const recipients = method === 'POST' && path === '/api/v1/recipients/commands';
  const catalog = method === 'POST' && path === '/api/v1/catalog/commands';
  const pv = method === 'POST' && path === '/api/v1/pv-products/commands';
  if (method === 'GET' && path === '/api/v1/pv-products/snapshot') return { handled: true as const, data: await business.readPvDemoSnapshot(signal), status: 200 };
  if (method === 'GET' && path === '/api/v1/catalog/snapshot') return { handled: true as const, data: await business.readCatalogSnapshot(signal), status: 200 };
  const recipientContext = /^\/api\/v1\/recipients\/command-context\/(NR-00[1-5])$/.exec(path);
  if (method === 'GET' && recipientContext) return { handled: true as const, data: await business.readRecipientContext(recipientContext[1], signal), status: 200 };
  if (method === 'GET' && path === '/api/v1/reports/labels/command-context') return { handled: true as const, data: await business.readLabelContext(signal), status: 200 };
  if (!warehouse && !defects && !labels && !recipients && !catalog && !pv) return { handled: false as const };
  let body: unknown = raw;
  try { if (typeof body === 'string') body = JSON.parse(body); } catch { throw invalid(); }
  if (!object(body)) throw invalid();
  let command: BusinessCommand;
  if (warehouse) {
    const allowed = ['warehouseId', 'commandId', 'epoch', 'expectedVersion', 'name', 'contact_person', 'phone'];
    if (['actor', 'actorId', 'actorKey', 'capabilities', 'permissions'].some(key => Object.hasOwn(body, key))) throw invalid();
    if (Object.keys(body).some(key => !allowed.includes(key))) throw new PreviewHttpError(422, 'IMMUTABLE_OR_UNKNOWN_FIELD', 'Không thể thay đổi trường này.');
    if (typeof body.warehouseId !== 'string' || !body.warehouseId) throw invalid();
    if (body.warehouseId !== 'warehouse-hn-01') throw new PreviewHttpError(404, 'NOT_FOUND', 'Không tìm thấy thông tin kho.');
    command = { command: 'warehouse.update', commandId: body.commandId as string, epoch: body.epoch as string,
      entityId: body.warehouseId, expectedVersion: body.expectedVersion as number,
      payload: { name: body.name, contact_person: body.contact_person, phone: body.phone } };
  } else {
    if (!(pv ? ['pv-products.create', 'pv-products.update'] : catalog ? ['products.create', 'skus.create', 'recipients.create'] : recipients ? ['recipients.update-contact'] : labels ? ['labels.reprint', 'labels.retry'] : ['defects.create', 'defects.update']).includes(String(body.command))
      || Object.keys(body).some(key => !['command', 'commandId', 'epoch', 'entityId', 'expectedVersion', 'payload'].includes(key))) throw invalid();
    command = structuredClone(body) as unknown as BusinessCommand;
  }
  const data = await business.executeCommand(command, signal);
  return { handled: true as const, data, status: (catalog || command.command === 'defects.create') && !data.replayed ? 201 : 200 };
}
