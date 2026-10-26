import type { AxiosInstance } from 'axios';
import { API_VERSION, isRecord } from './api-contract';
import { apiClient, ApiRequestError } from './api-client';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';
import type { PvDemoAdapter, PvDemoRequest, PvDemoOutcome } from '../../contracts/pv-demo';
import { isPvDemoSnapshot, isPvDemoOutcome, normalizePvPayload } from '../../preview-mock/pv-demo-policy';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';
import { CommandRecoveryError } from '../command-recovery';

/** Preview-only existing Shared Repository, authority and durable command journal. */
export function createPvDemoAdapter(client: AxiosInstance = apiClient, options: { available?: boolean } = {}): PvDemoAdapter {
  const available = options.available ?? IS_BROWSER_PREVIEW;
  const assertAvailable = () => { if (!available) throw new ApiRequestError('COMMAND_UNAVAILABLE', 'PV Demo chưa khả dụng.', 403); };
  const invalid = () => new ApiRequestError('INVALID_RESPONSE', 'Chưa thể xác minh hồ sơ PV đã lưu.');
  const unwrap = (data: unknown) => {
    if (!isRecord(data) || data.apiVersion !== API_VERSION || typeof data.requestId !== 'string' || !data.requestId) throw invalid();
    return data.data;
  };
  const send = async (request: PvDemoRequest): Promise<PvDemoOutcome> => {
    assertAvailable();
    const { data } = await client.post<unknown>('pv-products/commands', structuredClone(request));
    const result = unwrap(data);
    if (!isPvDemoOutcome(result, request)) throw invalid();
    return structuredClone(result);
  };
  const recovery = createPreviewCommandRecovery<PvDemoRequest, PvDemoOutcome>(client, {
    scope: 'pv-demo-v1', send,
    diagnostics: { enabled: available, surface: 'WEB', scope: 'pv-demo-v1' },
    validateOutcome: (value, request, actorKey): value is PvDemoOutcome => isPvDemoOutcome(value, request, actorKey),
    classifyFailure: error => {
      const failure = error as { code?: string; status?: number | null };
      return { code: failure?.code ?? 'PV_SAVE_FAILED', definitive: !!failure?.status && failure.status >= 400 && failure.status < 500
        && ![408,429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE' };
    },
  });
  return {
    available,
    readSnapshot: () => {
      assertAvailable();
      return recovery.readCurrent(async () => {
        const { data } = await client.get<unknown>('pv-products/snapshot');
        const snapshot = unwrap(data);
        if (!isPvDemoSnapshot(snapshot)) throw invalid();
        return structuredClone(snapshot);
      });
    },
    execute: async input => {
      assertAvailable();
      const request = { ...structuredClone(input), payload: normalizePvPayload(input.command, input.payload) } as PvDemoRequest;
      const state = await recovery.restore();
      if (state.kind === 'blocked') throw new CommandRecoveryError(state.code);
      if ((state.kind === 'pending' || state.kind === 'committed') && state.request.commandId !== request.commandId)
        throw Object.assign(new ApiRequestError('PV_SCOPE_BUSY', 'Một thao tác PV đang chờ xác nhận. Nội dung đang nhập được giữ lại.', 409), { notDispatched: true });
      return recovery.execute(request);
    },
    recovery: { restore: () => recovery.restore(), retry: () => recovery.retry(), acknowledge: commandId => recovery.acknowledge(commandId) },
  };
}
