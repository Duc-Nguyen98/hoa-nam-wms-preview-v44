import type { AxiosInstance } from 'axios';
import { API_VERSION, isRecord } from './api-contract';
import { ApiRequestError, apiClient } from './api-client';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';
import type { BusinessReceipt } from '../../preview-mock/business-repository';
import { assertRecipientUpdateContext, assertRecipientUpdateReceipt, type RecipientUpdateAdapter, type RecipientUpdateRequest } from '../../features/S05/recipient-update-command';

type Outcome = { receipt: BusinessReceipt; replayed: boolean };
export function createRecipientUpdateHttpAdapter(client: AxiosInstance = apiClient,
  options: { available?: boolean; durableRecovery?: boolean } = {}): RecipientUpdateAdapter {
  const invalid = () => new ApiRequestError('INVALID_RESPONSE', 'Chưa thể xác minh kết quả lưu nơi nhận.');
  const keyFor = (entityId: string) => {
    if (!/^s05:NR-00[1-5]$/.test(entityId)) throw new ApiRequestError('MOCK_COMMAND_FORBIDDEN', 'Quyền sửa không khả dụng cho bản ghi này.', 403);
    return entityId.slice(4);
  };
  const validOutcome = (value: unknown, request: RecipientUpdateRequest): value is Outcome => {
    if (!isRecord(value) || typeof value.replayed !== 'boolean') return false;
    try { assertRecipientUpdateReceipt(value.receipt as BusinessReceipt, request); return true; } catch { return false; }
  };
  const send = async (request: RecipientUpdateRequest): Promise<Outcome> => {
    keyFor(request.entityId);
    const { data } = await client.post<unknown>('recipients/commands', structuredClone(request));
    if (!isRecord(data) || data.apiVersion !== API_VERSION || typeof data.requestId !== 'string' || !data.requestId || !validOutcome(data.data, request)) throw invalid();
    return structuredClone(data.data);
  };
  const makeGate = (rowKey: string) => {
    keyFor(`s05:${rowKey}`);
    return createPreviewCommandRecovery<RecipientUpdateRequest, Outcome>(client, {
      scope: `S05:recipients:${rowKey}`, send,
      validateOutcome: (value, request, actorKey): value is Outcome => request.entityId === `s05:${rowKey}` && validOutcome(value, request) && value.receipt.actorKey === actorKey,
      classifyFailure: error => {
        const failure = error as { code?: string; status?: number | null };
        return { code: failure?.code ?? 'UPDATE_FAILED', definitive: !!failure?.status && failure.status >= 400 && failure.status < 500
          && ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE' };
      },
    });
  };
  const gates = new Map<string, ReturnType<typeof makeGate>>();
  const gate = (rowKey: string) => { let value = gates.get(rowKey); if (!value) { value = makeGate(rowKey); gates.set(rowKey, value); } return value; };
  const readContext = async (rowKey: string) => {
    keyFor(`s05:${rowKey}`);
    const { data } = await client.get<unknown>(`recipients/command-context/${encodeURIComponent(rowKey)}`);
    if (!isRecord(data) || data.apiVersion !== API_VERSION || typeof data.requestId !== 'string' || !data.requestId) throw invalid();
    try { assertRecipientUpdateContext(data.data, rowKey); } catch { throw invalid(); }
    if (data.data.entityId !== `s05:${rowKey}`) throw invalid();
    return structuredClone(data.data);
  };
  return {
    available: options.available === true,
    readContext: rowKey => options.durableRecovery ? gate(rowKey).readCurrent(() => readContext(rowKey)) : readContext(rowKey),
    execute: request => options.durableRecovery ? gate(keyFor(request.entityId)).execute(request) : send(request),
    invalidate() { /* HTTP reads have no application cache; screen reloads its accepted query. */ },
    ...(options.durableRecovery ? { recovery: {
      restore: (rowKey: string) => gate(rowKey).restore(),
      acknowledge: (rowKey: string, commandId: string) => gate(rowKey).acknowledge(commandId),
    } } : {}),
  };
}
