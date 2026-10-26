import type { AxiosInstance } from 'axios';
import type { WarehouseCommandAdapter, WarehouseCommandOutcome, WarehouseSnapshot, WarehouseUpdateRequest } from '../../contracts/warehouse-config';
import { API_VERSION, isRecord } from './api-contract';
import { ApiRequestError, apiClient } from './api-client';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';

const positive = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function isWarehouseSnapshot(value: unknown): value is WarehouseSnapshot {
  return isRecord(value) && value.id === 'warehouse-hn-01'
    && ['id', 'code', 'name', 'address', 'contact_person', 'phone'].every(key => typeof value[key] === 'string')
    && ['ACTIVE', 'INACTIVE'].includes(String(value.status));
}
/** Reject a malformed/mismatched receipt: an HTTP 200 alone never proves a committed update. */
export function isWarehouseCommandOutcome(value: unknown, request: Readonly<WarehouseUpdateRequest>): value is WarehouseCommandOutcome {
  if (!isRecord(value) || typeof value.replayed !== 'boolean' || !isRecord(value.receipt)) return false;
  const r = value.receipt;
  return r.mode === 'MOCK' && r.command === 'warehouse.update' && r.entityId === request.warehouseId
    && r.commandId === request.commandId && r.epoch === request.epoch && uuid(r.commandId) && uuid(r.epoch)
    && typeof r.actorKey === 'string' && !!r.actorKey && r.previousVersion === request.expectedVersion
    && positive(r.version) && typeof r.changed === 'boolean' && r.version === request.expectedVersion + (r.changed ? 1 : 0)
    && typeof r.committedAt === 'string' && Number.isFinite(Date.parse(r.committedAt)) && positive(r.snapshotRevision)
    && isRecord(r.record) && r.record.id === request.warehouseId && r.record.kind === 'warehouse' && r.record.version === r.version
    && isWarehouseSnapshot(r.record.data)
    && ['name', 'contact_person', 'phone'].every(key => r.record && isRecord(r.record) && isRecord(r.record.data) && r.record.data[key] === request[key as keyof WarehouseUpdateRequest]);
}

/** Browser-mock seam only. Creating this adapter does not grant any actor permission. */
export function createWarehouseCommandHttpAdapter(client: AxiosInstance = apiClient, options: { available?: boolean; durableRecovery?: boolean } = {}): WarehouseCommandAdapter {
  const send = async (request: Readonly<WarehouseUpdateRequest>, context?: { signal?: AbortSignal }) => {
      if (options.available !== true) throw new ApiRequestError('COMMAND_UNAVAILABLE', 'Luồng lưu chưa khả dụng.', 403);
      const response = await client.put<unknown>('admin/warehouse-config', structuredClone(request), { signal: context?.signal });
      const envelope = response.data;
      if (!isRecord(envelope) || envelope.apiVersion !== API_VERSION || typeof envelope.requestId !== 'string' || !envelope.requestId
        || !isWarehouseCommandOutcome(envelope.data, request)) {
        throw new ApiRequestError('INVALID_RESPONSE', 'Chưa xác định được kết quả lưu. Vui lòng kiểm tra lại.', response.status);
      }
      return structuredClone(envelope.data);
  };
  if (!options.durableRecovery) return Object.freeze({ available: options.available === true, update: send });
  const gate = createPreviewCommandRecovery<WarehouseUpdateRequest, WarehouseCommandOutcome>(client, {
    scope: 'S28:warehouse', send,
    validateOutcome: (value, request, actorKey): value is WarehouseCommandOutcome => isWarehouseCommandOutcome(value, request) && value.receipt.actorKey === actorKey,
    classifyFailure: error => {
      const failure = error as { code?: string; status?: number | null };
      return { code: failure?.code ?? 'REQUEST_FAILED', definitive: !!failure?.status && failure.status >= 400
        && failure.status < 500 && ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE' };
    },
  });
  return Object.freeze({ available: options.available === true, update: (request: Readonly<WarehouseUpdateRequest>) => gate.execute(request),
    recovery: { restore: gate.restore, retry: gate.retry, acknowledge: gate.acknowledge, readCurrent: gate.readCurrent } });
}
