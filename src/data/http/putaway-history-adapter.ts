import type { AxiosInstance } from 'axios';
import { apiClient, ApiRequestError } from './api-client';
import { API_VERSION, isRecord } from './api-contract';
import type { PutawayHistoryQuery, PutawayHistoryResult } from '../../contracts/putaway-history';
export type PutawayHistoryReader = { read(query: PutawayHistoryQuery, signal?: AbortSignal): Promise<PutawayHistoryResult> };
export function createPutawayHistoryAdapter(client: AxiosInstance = apiClient): PutawayHistoryReader {
  return { async read(query, signal) {
    const response = await client.get<unknown>('putaway-history', { params: query, signal });
    const envelope = response.data;
    if (!isRecord(envelope) || envelope.apiVersion !== API_VERSION || typeof envelope.requestId !== 'string' || !isRecord(envelope.data)) {
      throw new ApiRequestError('INVALID_RESPONSE', 'Dữ liệu lịch sử trả về chưa hợp lệ.', response.status);
    }
    const data = envelope.data as unknown as PutawayHistoryResult;
    if (!Array.isArray(data.rows) || !Number.isFinite(data.total) || !Number.isFinite(data.scopeTotal) || !isRecord(data.query)) {
      throw new ApiRequestError('INVALID_RESPONSE', 'Dữ liệu lịch sử trả về chưa đầy đủ.', response.status);
    }
    return data;
  } };
}
