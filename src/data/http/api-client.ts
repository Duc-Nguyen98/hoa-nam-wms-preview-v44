import axios, { type AxiosInstance } from 'axios';
import { API_VERSION, BUSINESS_RESOURCES, isBusinessResult, isRecord, serializeQuery, type BusinessScreenId } from './api-contract';

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly requestId: string | null;
  readonly details?: unknown;
  constructor(code: string, message: string, status: number | null = null, requestId: string | null = null, details?: unknown) {
    super(message); this.name = 'ApiRequestError'; this.code = code; this.status = status; this.requestId = requestId; this.details = details;
  }
}
type SessionExpiredListener = (error: ApiRequestError) => void;
const sessionExpiredListeners = new WeakMap<AxiosInstance, Set<SessionExpiredListener>>();
/** Subscribe to session expiry on the same HTTP client used for business/account requests. */
export function subscribeSessionExpired(listener: SessionExpiredListener, client: AxiosInstance = apiClient) {
  let listeners = sessionExpiredListeners.get(client);
  if (!listeners) { listeners = new Set(); sessionExpiredListeners.set(client, listeners); }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export interface ApiClientOptions { baseURL?: string; timeoutMs?: number }
export function createApiClient(options: ApiClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL ?? import.meta.env?.VITE_API_BASE_URL ?? '/api/v1',
    timeout: options.timeoutMs ?? 10_000,
    withCredentials: true,
    headers: { Accept: 'application/json' },
  });
  instance.interceptors.response.use(response => response, (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const body: unknown = error.response?.data;
    const failure = isRecord(body) && isRecord(body.error) ? body.error : null;
    const code = failure && typeof failure.code === 'string' ? failure.code
      : error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' ? 'REQUEST_TIMEOUT' : error.response ? 'HTTP_ERROR' : 'NETWORK_ERROR';
    const message = failure && typeof failure.message === 'string' ? failure.message
      : code === 'REQUEST_TIMEOUT' ? 'Kết nối quá thời gian chờ. Vui lòng thử lại.' : 'Không thể kết nối dịch vụ. Vui lòng thử lại.';
    const failureError = new ApiRequestError(code, message, error.response?.status ?? null,
      isRecord(body) && typeof body.requestId === 'string' ? body.requestId : null, failure?.details);
    if (failureError.status === 401 && failureError.code === 'SESSION_EXPIRED') {
      for (const listener of sessionExpiredListeners.get(instance) ?? []) listener(failureError);
    }
    return Promise.reject(failureError);
  });
  return instance;
}
export const apiClient = createApiClient();

export async function readBusinessResource<Result>(
  screen: BusinessScreenId, query: object, context: { signal?: AbortSignal; scenario?: string } = {}, client: AxiosInstance = apiClient,
): Promise<Result> {
  const response = await client.get<unknown>(BUSINESS_RESOURCES[screen], {
    params: { ...serializeQuery(query), ...(context.scenario ? { _scenario: context.scenario } : {}) }, signal: context.signal,
  });
  const envelope = response.data;
  if (!isRecord(envelope) || envelope.apiVersion !== API_VERSION || typeof envelope.requestId !== 'string'
    || !isBusinessResult(screen, envelope.data)) {
    throw new ApiRequestError('INVALID_RESPONSE', 'Dữ liệu trả về chưa hợp lệ. Vui lòng tải lại.', response.status,
      isRecord(envelope) && typeof envelope.requestId === 'string' ? envelope.requestId : null);
  }
  return envelope.data as Result;
}
