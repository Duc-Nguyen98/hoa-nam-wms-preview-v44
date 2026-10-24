import type { AxiosInstance } from 'axios';
import type { SystemAuditAdapter } from '../../contracts/system-audit';
import type { WarehouseConfigAdapter, WarehouseRead } from '../../contracts/warehouse-config';
import type { RoleAdapter, UserAdapter } from '../../contracts/s29-users-rbac';
import { API_VERSION, isRecord, serializeQuery } from './api-contract';
import { apiClient } from './api-client';
import { createWarehouseCommandHttpAdapter } from './warehouse-command-adapter';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

type Envelope<T> = { apiVersion: typeof API_VERSION; requestId: string; data: T };

async function readAdmin<T>(path: string, query: object | undefined, client: AxiosInstance, signal?: AbortSignal): Promise<T> {
  const response = await client.get<unknown>(path, {
    params: query ? serializeQuery(query) : undefined,
    signal,
  });
  const envelope = response.data;
  if (!isRecord(envelope) || envelope.apiVersion !== API_VERSION || typeof envelope.requestId !== 'string'
    || !('data' in envelope)) {
    throw new Error('Dữ liệu quản trị trả về chưa hợp lệ. Vui lòng thử lại.');
  }
  return (envelope as unknown as Envelope<T>).data;
}

export interface AdminHttpAdapters {
  systemAudit: SystemAuditAdapter;
  warehouse: WarehouseConfigAdapter;
  users: UserAdapter;
  roles: RoleAdapter;
}

/**
 * Read-only local seams for the late screens. The service response is still
 * versioned HTTP; no fixture adapter is mounted in the product path.
 */
export function createAdminHttpAdapters(client: AxiosInstance = apiClient): AdminHttpAdapters {
  return {
    systemAudit: { read: (query, context) => readAdmin('admin/system-audit', query, client, context?.signal) },
    warehouse: {
      read: () => ({ kind: 'source-unselected', message: 'Đang tải cấu hình kho…' }),
      readAsync: context => readAdmin<WarehouseRead>('admin/warehouse-config', undefined, client, context?.signal),
      command: createWarehouseCommandHttpAdapter(client, { available: IS_BROWSER_PREVIEW, durableRecovery: IS_BROWSER_PREVIEW }),
    },
    users: { read: (query, context) => readAdmin('admin/users-rbac/users', query, client, context?.signal) },
    roles: { read: (query, context) => readAdmin('admin/users-rbac/roles', query, client, context?.signal) },
  };
}

export const adminHttpAdapters = createAdminHttpAdapters();
