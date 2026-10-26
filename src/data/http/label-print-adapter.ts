import type { AxiosInstance } from 'axios';
import { API_VERSION, isRecord } from './api-contract';
import { ApiRequestError, apiClient } from './api-client';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';
import { isLabelPrintOutcome, type LabelPrintCommandAdapter, type LabelPrintContext, type LabelPrintOutcome, type LabelPrintRequest } from '../../features/S23/label-print-command';

/** Availability is a host policy input, never a query, display role or request grant. */
export function createLabelPrintHttpAdapter(client: AxiosInstance = apiClient,
  options: { available?: boolean; durableRecovery?: boolean } = {}): LabelPrintCommandAdapter {
  const invalid = () => new ApiRequestError('INVALID_RESPONSE', 'Chưa thể xác minh kết quả tác vụ nhãn.');
  const send = async (request: LabelPrintRequest): Promise<LabelPrintOutcome> => {
    const { data } = await client.post<unknown>('reports/labels/commands', structuredClone(request));
    if (!isRecord(data) || data.apiVersion !== API_VERSION || typeof data.requestId !== 'string' || !data.requestId
      || !isLabelPrintOutcome(data.data, request)) throw invalid();
    return structuredClone(data.data);
  };
  const readContext = async (): Promise<LabelPrintContext> => {
    const { data } = await client.get<unknown>('reports/labels/command-context');
    if (!isRecord(data) || data.apiVersion !== API_VERSION || typeof data.requestId !== 'string' || !isRecord(data.data)
      || typeof data.data.epoch !== 'string' || typeof data.data.entityId !== 'string' || !data.data.entityId
      || !Number.isSafeInteger(data.data.version) || Number(data.data.version) < 1) throw invalid();
    return structuredClone(data.data) as unknown as LabelPrintContext;
  };
  if (!options.durableRecovery) return { available: options.available === true, readContext, execute: send };
  const gate = createPreviewCommandRecovery<LabelPrintRequest, LabelPrintOutcome>(client, {
    scope: 'S23:labels', send,
    validateOutcome: (value, request, actorKey): value is LabelPrintOutcome => isLabelPrintOutcome(value, request) && value.receipt.actorKey === actorKey,
    classifyFailure: error => {
      const failure = error as { code?: string; status?: number | null };
      return { code: failure?.code ?? 'PRINT_JOB_FAILED', definitive: !!failure?.status && failure.status >= 400 && failure.status < 500
        && ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE' };
    },
  });
  return { available: options.available === true, readContext, execute: request => gate.execute(request),
    recovery: { restore: gate.restore, retry: gate.retry, acknowledge: gate.acknowledge } };
}
