import type { AxiosInstance } from 'axios';
import type { DefectsCommandAdapter, DefectsCommandOutcome, DefectsCommandRequest } from '../../contracts/defects';
import { API_VERSION, isRecord } from '../../data/http/api-contract';
import { apiClient } from '../../data/http/api-client';
import { DefectsCommandError, isDefectsCommandOutcome } from './defects-command-service';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';

/** S02-only transport adapter. Server-side command policy remains independently authoritative. */
export function createDefectsCommandHttpAdapter(client: AxiosInstance = apiClient, options: { durableRecovery?: boolean } = {}): DefectsCommandAdapter {
  const send: DefectsCommandAdapter['execute'] = async (request, context) => {
      const response = await client.post<unknown>('defects/commands', structuredClone(request), { signal: context?.signal });
      const envelope = response.data;
      if (!isRecord(envelope) || envelope.apiVersion !== API_VERSION || typeof envelope.requestId !== 'string' || !envelope.requestId
        || !isDefectsCommandOutcome(envelope.data, request)) {
        throw new DefectsCommandError('INVALID_RESPONSE', response.status, undefined, true);
      }
      return structuredClone(envelope.data);
  };
  if (!options.durableRecovery) return { execute: send };
  const gate = createPreviewCommandRecovery<DefectsCommandRequest, DefectsCommandOutcome>(client, {
    scope: 'S02:defects', send,
    validateOutcome: (value, request, actorKey): value is DefectsCommandOutcome => isDefectsCommandOutcome(value, request) && value.receipt.actorKey === actorKey,
    classifyFailure: error => {
      const failure = error as { code?: string; status?: number | null; outcomeUnknown?: boolean };
      return { code: failure?.code ?? 'REQUEST_FAILED', definitive: !failure?.outcomeUnknown && !!failure?.status
        && failure.status >= 400 && failure.status < 500 && ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE' };
    },
  });
  return { execute: request => gate.execute(request), recovery: { restore: gate.restore, retry: gate.retry, acknowledge: gate.acknowledge } };
}
