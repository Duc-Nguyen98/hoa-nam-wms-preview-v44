import { BUSINESS_RESOURCES, isBusinessResult, isRecord, type BusinessScreenId } from '../data/http/api-contract';
import { BUSINESS_DEFAULT_QUERIES } from '../data/http/resource-defaults';
import { baselineReaders } from './readers';
import { invalidQueryField } from './query-validation';
import { adminDefaults, localRolesAdapter, localSystemAuditAdapter, localUsersAdapter, localWarehouseRead } from './admin-data';
import { PreviewHttpError } from './errors';
import type { PreviewBusinessReads } from './business-reads';
import type { DefectsQuery } from '../contracts/defects';
import type { LabelReportQuery } from '../contracts/label-report';
import type { RecipientsQuery } from '../contracts/recipients';
import { validateBusinessDateRange } from '../shared/date-policy';

const paths = new Map(Object.entries(BUSINESS_RESOURCES).map(([screen, resource]) => [`/api/v1/${resource}`, screen as BusinessScreenId]));

// Extracted from canonical mock/server.ts. Validation and messages are unchanged.
function decodeValue(raw: string, expected: unknown): unknown {
  if (raw.length > 4096) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện tìm kiếm quá dài.');
  if (typeof expected === 'string') return raw;
  if (typeof expected === 'number') {
    if (!/^\d+$/.test(raw)) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Tham số số không hợp lệ.');
    const value = Number(raw);
    if (!Number.isSafeInteger(value)) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Tham số số vượt giới hạn.');
    return value;
  }
  if (typeof expected === 'boolean') {
    if (raw !== 'true' && raw !== 'false') throw new PreviewHttpError(400, 'INVALID_QUERY', 'Tham số lựa chọn không hợp lệ.');
    return raw === 'true';
  }
  if (expected === null && raw !== 'null' && !raw.startsWith('{')) return raw;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new PreviewHttpError(400, 'INVALID_QUERY', 'Cấu trúc điều kiện không hợp lệ.'); }
  if (expected !== null && (!isRecord(value) || !isRecord(expected))) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Cấu trúc điều kiện không hợp lệ.');
  if (isRecord(value)) {
    if (Object.keys(value).some(key => ['__proto__', 'constructor', 'prototype'].includes(key))) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện không hợp lệ.');
    if (isRecord(expected) && (Object.keys(value).some(key => !(key in expected)) || Object.entries(expected).some(([key, example]) => typeof value[key] !== typeof example))) {
      throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện thiếu trường hoặc sai kiểu dữ liệu.');
    }
  }
  return value;
}

export function decodeBusinessQuery(screen: BusinessScreenId, params: URLSearchParams): { query: object; scenario?: string } {
  const defaults = BUSINESS_DEFAULT_QUERIES[screen];
  const query: Record<string, unknown> = Object.fromEntries(Object.entries(structuredClone(defaults)));
  for (const [key, value] of params) {
    if (params.getAll(key).length !== 1) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện bị lặp.');
    if (key === '_scenario') continue;
    if (!Object.hasOwn(defaults, key)) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện chưa được hỗ trợ.');
    query[key] = decodeValue(value, defaults[key as keyof typeof defaults]);
  }
  if ('page' in query && (Number(query.page) < 1 || ![10, 15, 25, 50].includes(Number(query.pageSize)))) {
    throw new PreviewHttpError(400, 'INVALID_QUERY', 'Trang hoặc số dòng không hợp lệ.');
  }
  const scenario = params.get('_scenario') ?? undefined;
  if (scenario && (scenario.length > 80 || !/^[\w-]+$/.test(scenario))) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Kịch bản không hợp lệ.');
  const invalidField = invalidQueryField(screen, query);
  if (invalidField) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện tra cứu không hợp lệ.', { field: invalidField });
  const period = screen === 'S22' ? query : query.period;
  if (period !== undefined && !validateBusinessDateRange(period).valid) throw new PreviewHttpError(422, 'INVALID_PERIOD', 'Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.', { field:'period' });
  return { query, scenario };
}

function adminQuery<T extends object>(params: URLSearchParams, defaults: T): T {
  const query = structuredClone(defaults) as Record<string, unknown>;
  for (const [key, raw] of params) {
    if (!Object.hasOwn(query, key) || params.getAll(key).length !== 1) throw new PreviewHttpError(400, 'INVALID_QUERY', 'Điều kiện tra cứu không hợp lệ.');
    query[key] = decodeValue(raw, defaults[key as keyof T]);
  }
  if ('period' in query && !validateBusinessDateRange(query.period).valid) throw new PreviewHttpError(422,'INVALID_PERIOD','Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.',{field:'period'});
  return query as T;
}

export async function readPreviewDomain(method: string, url: URL, signal: AbortSignal, business?: PreviewBusinessReads): Promise<unknown> {
  signal.throwIfAborted();
  const admin = ['/api/v1/admin/system-audit', '/api/v1/admin/warehouse-config', '/api/v1/admin/users-rbac/users', '/api/v1/admin/users-rbac/roles'].includes(url.pathname);
  const screen = paths.get(url.pathname);
  if (!admin && !screen) throw new PreviewHttpError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu yêu cầu.');
  if (method !== 'GET') throw new PreviewHttpError(405, 'METHOD_NOT_ALLOWED', admin ? 'Thao tác quản trị này chỉ hỗ trợ đọc.' : 'Thao tác này chưa được hỗ trợ.');
  let result: unknown;
  if (url.pathname === '/api/v1/admin/system-audit') result = await localSystemAuditAdapter.read(adminQuery(url.searchParams, adminDefaults.audit), { signal });
  else if (url.pathname === '/api/v1/admin/warehouse-config') result = business ? await business.readWarehouse(signal) : structuredClone(localWarehouseRead);
  else if (url.pathname === '/api/v1/admin/users-rbac/users') result = await localUsersAdapter.read(adminQuery(url.searchParams, adminDefaults.users), { signal });
  else if (url.pathname === '/api/v1/admin/users-rbac/roles') result = await localRolesAdapter.read(adminQuery(url.searchParams, adminDefaults.roles), { signal });
  else if (screen) {
    const { query, scenario } = decodeBusinessQuery(screen, url.searchParams);
    result = screen === 'S02' && business ? await business.readDefects(query as DefectsQuery, scenario, signal)
      : screen === 'S05' && business ? await business.readRecipients(query as RecipientsQuery, scenario, signal)
      : screen === 'S23' && business && (!scenario || scenario === 'default') ? await business.readLabels(query as LabelReportQuery, signal)
        : await baselineReaders[screen].read(query, signal, scenario);
    if (screen === 'S22' && isRecord(result) && result.kind === 'available' && isRecord(result.model)) {
      // Preserve Premium summary values. The HTTP boundary has not approved full detail coverage.
      result = { ...result, model: { ...result.model, details: { availability: 'BLOCKED_SOURCE_CONFLICT', selectedFixture: null, rows: null, total: null } } };
    }
    if (!isBusinessResult(screen, result)) throw new PreviewHttpError(500, 'INVALID_MODEL', 'Không thể đọc dữ liệu yêu cầu.');
  }
  signal.throwIfAborted();
  if (admin && isRecord(result) && result.kind === 'blocked' && result.reason === 'INVALID_QUERY') {
    throw new PreviewHttpError(400, 'INVALID_QUERY', typeof result.detail === 'string' ? result.detail : 'Điều kiện tra cứu không hợp lệ.');
  }
  return structuredClone(result);
}
