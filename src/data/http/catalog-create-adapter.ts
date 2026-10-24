import type { AxiosInstance } from 'axios';
import { API_VERSION, isRecord } from './api-contract';
import { apiClient, ApiRequestError } from './api-client';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';
import { CATALOG_COMMANDS, type CatalogDomain, type CatalogCreateAdapter, type CatalogCreateRequest, type CatalogCreateOutcome } from '../../contracts/catalog-create';
import { isCatalogSnapshot, isCatalogCreateOutcome, normalizeCatalogPayload } from '../../preview-mock/catalog-policy';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';
import { canonicalBusinessJson } from '../../preview-mock/business-repository';

/** Default binding is deliberately Preview-only; no production write contract is inferred. */
export function createCatalogCreateAdapter<D extends CatalogDomain>(domain: D, client: AxiosInstance = apiClient,
  options: { available?: boolean } = {}): CatalogCreateAdapter<D> {
  const available = options.available ?? IS_BROWSER_PREVIEW;
  const assertAvailable = () => { if (!available) throw new ApiRequestError('COMMAND_UNAVAILABLE', 'Luồng tạo hồ sơ chưa khả dụng.', 403); };
  const invalid = () => new ApiRequestError('INVALID_RESPONSE', 'Chưa thể xác minh hồ sơ đã lưu.');
  const unwrap = (data: unknown) => {
    if (!isRecord(data) || data.apiVersion !== API_VERSION || typeof data.requestId !== 'string' || !data.requestId) throw invalid();
    return data.data;
  };
  const send = async (request: CatalogCreateRequest<D>): Promise<CatalogCreateOutcome> => {
    assertAvailable();
    if (request.command !== CATALOG_COMMANDS[domain]) throw new ApiRequestError('COMMAND_UNAVAILABLE', 'Thao tác không phù hợp.', 403);
    const { data } = await client.post<unknown>('catalog/commands', structuredClone(request));
    const outcome = unwrap(data);
    if (!isCatalogCreateOutcome(outcome, request)) throw invalid();
    return structuredClone(outcome);
  };
  const recovery = createPreviewCommandRecovery<CatalogCreateRequest<D>, CatalogCreateOutcome>(client, {
    scope: `catalog-v1:${domain}`, send,
    validateOutcome: (value, request, actorKey): value is CatalogCreateOutcome => request.command === CATALOG_COMMANDS[domain] && isCatalogCreateOutcome(value, request, actorKey),
    classifyFailure: error => {
      const failure = error as { code?: string; status?: number | null };
      return { code: failure?.code ?? 'CREATE_FAILED', definitive: !!failure?.status && failure.status >= 400 && failure.status < 500
        && ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE' };
    },
  });
  const scopeBusy = () => Object.assign(new ApiRequestError('CATALOG_SCOPE_BUSY', 'Một thao tác khác đang chờ xác nhận. Nội dung đang nhập được giữ lại; hãy thử lại sau.', 409), { notDispatched: true as const });
  async function execute(input: CatalogCreateRequest<D>): Promise<CatalogCreateOutcome> {
    assertAvailable();
    if (input.command !== CATALOG_COMMANDS[domain]) throw new ApiRequestError('COMMAND_UNAVAILABLE', 'Thao tác không phù hợp.', 403);
    const request = { ...structuredClone(input), payload: normalizeCatalogPayload(domain, input.payload) };
    const initial = await recovery.restore();
    // Preserve an already outstanding same-ID request. A new form cannot adopt
    // another tab's receipt as its own submission or replace its durable intent.
    if ((initial.kind === 'pending' || initial.kind === 'committed') && initial.request.commandId !== request.commandId) {
      if (initial.kind === 'committed' || initial.code) throw scopeBusy();
    }
    const mayWait = initial.kind === 'empty' || initial.kind === 'pending' && initial.request.commandId !== request.commandId && !initial.code;
    const deadline = Date.now() + 8_000;
    for (;;) {
      try { return await recovery.execute(request); }
      catch (error) {
        // These admission failures happen before send(). Never retry transport
        // failures here: an unknown outcome belongs to same-ID recovery only.
        const failure = error as { code?: string };
        if (!mayWait || !['RECOVERY_PENDING', 'RECOVERY_ACK_REQUIRED', 'RECOVERY_BUSY'].includes(failure.code ?? '')) throw error;
        const state = await recovery.restore();
        if (state.kind === 'blocked') throw error;
        if (state.kind !== 'empty') {
          if (state.request.commandId === request.commandId || canonicalBusinessJson(state.request) === canonicalBusinessJson(request)) throw error;
          if (state.kind === 'pending' && state.code) throw scopeBusy();
          if (Date.now() >= deadline) throw scopeBusy();
        } else if (Date.now() >= deadline) throw scopeBusy();
        // The first tab normally acknowledges immediately after its accepted
        // snapshot. Both valid commands can then commit, while duplicate values
        // still conflict inside the serialized repository transaction.
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }
  }
  return {
    available,
    readSnapshot: () => {
      assertAvailable();
      return recovery.readCurrent(async () => {
        const { data } = await client.get<unknown>('catalog/snapshot');
        const snapshot = unwrap(data);
        if (!isCatalogSnapshot(snapshot)) throw invalid();
        return structuredClone(snapshot);
      });
    },
    execute,
    recovery: { restore: () => recovery.restore(), retry: () => recovery.retry(), acknowledge: commandId => recovery.acknowledge(commandId) },
  };
}
