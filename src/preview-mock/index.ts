import { createOperationalAppFixture } from './operational-app-fixture';
import { createOperationalQaSession } from '../operations/operational-qa-session';
import { createCatalogQaSession } from '../operations/catalog-qa-session';
import type { OperationalSurface } from '../contracts/operational-preview';
import { AxiosError, AxiosHeaders, CanceledError, type AxiosAdapter, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { API_VERSION, BUSINESS_RESOURCES } from '../data/http/api-contract';
import { createMockAccount } from './account';
import { createApprovedPreviewBinding } from './approved-business-policy';
import { APPROVED_DEFECTS_HANDLERS } from '../features/S02/defects-approved-policy';
import { readPreviewDomain } from './domain';
import { PreviewHttpError } from './errors';
import { createPreviewBusinessReads, type PreviewBusinessReads, type PreviewBusinessCommandBinding } from './business-reads';
import { routeBusinessCommand } from './business-command-transport';
import { BUSINESS_STORAGE_NAMESPACE, createIndexedDbBusinessPersistence, type BusinessPersistence } from './business-persistence';
import { COMMAND_RECOVERY_NAMESPACE, registerPreviewCommandRecovery } from './command-recovery-context';
import { createBrowserSessionToken, createIndexedDbPersistence, PREVIEW_STORAGE_NAMESPACE, type PreviewPersistence, type PreviewSessionToken } from './storage';
import { createNotificationRepository, NOTIFICATION_STORAGE_NAMESPACE, type NotificationRepository } from './notifications';
import { createNotificationDesignSeed } from './notification-design-seed';

export { PREVIEW_MOCK_CREDENTIALS } from './account';
export { PreviewHttpError } from './errors';
export { createMemoryPersistence, createMemorySessionToken } from './storage';
export const PREVIEW_MOCK_MODE = 'MOCK' as const;
export interface PreviewMockOptions {
  /** User-approved presentation data, enabled explicitly by the browser Preview. */
  approvedNotificationDesignData?: boolean;
  notificationPersistence?: PreviewPersistence;
  credentialProfile?: import('./account').PreviewCredentialProfile;
  /** Explicit injected policy for isolated tests. Never read from request data. */
  businessCommands?: PreviewBusinessCommandBinding;
  /** Only the browser Preview entry point opts into the explicit Owner policy. */
  approvedPreviewCommands?: boolean;
  /** Explicit isolated App-event Preview harness only; Main does not enable this. */
  approvedAppEventFixture?: boolean;
  /** Visible, opt-in diagnostics only; does not introduce an actor or capability. */
  approvedOperationalQa?: boolean;
  /** Host-selected p05-v1 persistence; never inferred from command input. */
  approvedInactiveMasterQa?: boolean;
  businessPersistence?: BusinessPersistence;
  recoveryPersistence?: BusinessPersistence;
  persistence?: PreviewPersistence;
  sessionToken?: PreviewSessionToken;
  namespace?: string;
  crypto?: Crypto;
  now?: () => number;
  /** Dedicated deterministic clock for business/demo records; account time remains real by default. */
  businessNow?: () => number;
  /** Tests can supply an origin without a DOM. Browser installation uses its actual origin. */
  origin?: string;
}
export interface PreviewMockRuntime {
  readonly notifications: NotificationRepository;
  readonly mode: typeof PREVIEW_MOCK_MODE;
  readonly appEvents?: ReturnType<typeof createOperationalAppFixture>;
  readonly appEventAdapters?: Record<'P04'|'P05'|'P09'|'P19',ReturnType<typeof createOperationalAppFixture>>;
  readonly operationalQa?: (surface: OperationalSurface) => ReturnType<typeof createOperationalQaSession>;
  readonly catalogQa?: () => ReturnType<typeof createCatalogQaSession>;
  readonly business: Pick<PreviewBusinessReads, 'readSnapshot' | 'reset'>;
  reset(): Promise<void>;
  uninstall(): void;
}
const installed = new WeakMap<AxiosInstance, PreviewMockRuntime>();

/** Install once on the SAME canonical client used by account, domain, admin and export APIs. */
export function installPreviewMock(client: AxiosInstance, options: PreviewMockOptions = {}): PreviewMockRuntime {
  const previous = installed.get(client);
  if (previous) return previous;
  const namespace = options.namespace ?? PREVIEW_STORAGE_NAMESPACE;
  const account = createMockAccount({
    credentialProfile: options.credentialProfile,
    namespace, now: options.now, crypto: options.crypto,
    persistence: options.persistence ?? createIndexedDbPersistence(namespace),
    sessionToken: options.sessionToken ?? createBrowserSessionToken(namespace),
  });
  // Preserve existing empty v3 and older records on disk; isolate the approved dataset.
  const notificationNamespace = `${NOTIFICATION_STORAGE_NAMESPACE}${options.approvedNotificationDesignData ? ':design-v1' : ''}:${namespace}`;
  const notifications = createNotificationRepository({
    persistence: options.notificationPersistence ?? createIndexedDbPersistence(notificationNamespace),
    namespace: notificationNamespace, actor: account.recoveryActor,
    captureFence: account.captureRecoveryReadFence, now: options.now,
    ...(options.approvedNotificationDesignData ? { seed: () => createNotificationDesignSeed((options.now ?? Date.now)()) } : {}),
  });
  const commandBinding = options.businessCommands ?? (options.approvedPreviewCommands ? createApprovedPreviewBinding(account, APPROVED_DEFECTS_HANDLERS) : undefined);
  const businessPersistence = options.businessPersistence ?? createIndexedDbBusinessPersistence(
    namespace === PREVIEW_STORAGE_NAMESPACE ? BUSINESS_STORAGE_NAMESPACE : `${BUSINESS_STORAGE_NAMESPACE}:${namespace}`,
  );
  const inactiveMasterQaEnabled = options.approvedPreviewCommands === true && options.approvedOperationalQa === true && options.approvedInactiveMasterQa === true;
  const business = createPreviewBusinessReads(businessPersistence, commandBinding ? {
    ...commandBinding, inactiveMasterQaEnabled,
  } : undefined, { now: options.businessNow });
  const unregisterRecovery = registerPreviewCommandRecovery(client, {
    persistence: options.recoveryPersistence ?? createIndexedDbBusinessPersistence(
      namespace === PREVIEW_STORAGE_NAMESPACE ? COMMAND_RECOVERY_NAMESPACE : `${COMMAND_RECOVERY_NAMESPACE}:${namespace}`),
    actor: commandBinding?.actor ?? account.recoveryActor,
    epoch: async () => (await business.readSnapshot()).epoch,
    // Injected actors must supply their own generation fence; never bind one to
    // the unrelated Main account. No positive command capability is introduced.
    captureReadFence: commandBinding ? commandBinding.captureReadFence : account.captureRecoveryReadFence,
  });
  const origin = options.origin ?? (typeof location !== 'undefined' ? location.origin : 'https://hoa-nam-mock.invalid');
  let requestSequence = 0;
  function requestId() {
    const webCrypto = options.crypto ?? globalThis.crypto;
    return webCrypto?.randomUUID?.() ?? `mock-${(options.now ?? Date.now)()}-${++requestSequence}`;
  }
  async function dispatch(config: InternalAxiosRequestConfig, signal: AbortSignal): Promise<AxiosResponse> {
    const id = requestId();
    let status = 200;
    let body: unknown;
    const headers = new AxiosHeaders({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Request-Id': id, 'X-Preview-Mode': PREVIEW_MOCK_MODE });
    try {
      signal.throwIfAborted();
      const url = new URL(client.getUri(config), origin);
      if (url.origin !== origin || !url.pathname.startsWith('/api/v1/')) throw new PreviewHttpError(400, 'UNSUPPORTED_PREVIEW_REQUEST', 'Yêu cầu này không thuộc dịch vụ MOCK.');
      const method = (config.method ?? 'GET').toUpperCase();
      let data: unknown;
      if (method === 'OPTIONS') { status = 204; data = undefined; }
      else if (method === 'GET' && url.pathname === '/api/v1/health') {
        data = { status: 'ok', service: 'hoa-nam-browser-mock', mode: PREVIEW_MOCK_MODE, resources: Object.keys(BUSINESS_RESOURCES) };
      } else {
        const result = await account.route(method, url.pathname, config.data, config.headers.get('Content-Type'), signal);
        if (result.handled) data = result.data;
        else {
          const command = await routeBusinessCommand(method, url.pathname, config.data, business, signal, url.searchParams);
          if (command.handled) { data = command.data; status = command.status; }
          else data = await readPreviewDomain(method, url, signal, business);
        }
      }
      signal.throwIfAborted();
      body = status === 204 ? undefined : { apiVersion: API_VERSION, requestId: id, data };
    } catch (error) {
      if (signal.aborted) throw signal.reason;
      const failure = error instanceof PreviewHttpError ? error : new PreviewHttpError(500, 'INTERNAL_ERROR', 'Dịch vụ MOCK chưa xử lý được yêu cầu. Vui lòng thử lại.');
      status = failure.status;
      if (status === 405) headers.set('Allow', 'GET');
      body = { apiVersion: API_VERSION, requestId: id, error: { code: failure.code, message: failure.message, ...(failure.details === undefined ? {} : { details: failure.details }) } };
    }
    const response: AxiosResponse = { status, statusText: status < 400 ? 'OK' : 'Mock request failed', data: body, headers, config, request: { mode: PREVIEW_MOCK_MODE } };
    if (!config.validateStatus || config.validateStatus(status)) return response;
    throw new AxiosError(`Request failed with status code ${status}`, status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, response.request, response);
  }
  const adapter: AxiosAdapter = config => new Promise((resolve, reject) => {
    const controller = new AbortController();
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clean = () => {
      if (timer !== undefined) clearTimeout(timer);
      config.signal?.removeEventListener?.('abort', abort);
      config.cancelToken?.unsubscribe(cancel);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true; controller.abort(error); clean(); reject(error);
    };
    const abort = () => fail(new CanceledError('canceled', config));
    const cancel = () => abort();
    if (config.signal?.aborted) { abort(); return; }
    config.signal?.addEventListener?.('abort', abort, { once: true });
    config.cancelToken?.subscribe(cancel);
    if (settled) return;
    if (config.timeout && config.timeout > 0) {
      timer = setTimeout(() => fail(new AxiosError(`timeout of ${config.timeout}ms exceeded`, AxiosError.ECONNABORTED, config)), config.timeout);
    }
    void dispatch(config, controller.signal).then(response => {
      if (settled) return;
      settled = true; clean(); resolve(response);
    }, fail);
  });
  const originalAdapter = client.defaults.adapter;
  client.defaults.adapter = adapter;
  let disposed = false;
  const qaSessions = new Map<OperationalSurface, ReturnType<typeof createOperationalQaSession>>();
  const operationalQa = options.approvedOperationalQa && options.approvedPreviewCommands && commandBinding ? (surface: OperationalSurface) => {
    const allowed = options.approvedAppEventFixture ? ['APP_P04', 'APP_P05', 'APP_P09', 'APP_P19'] : ['WEB', 'QA'];
    if (disposed || !allowed.includes(surface)) throw new PreviewHttpError(403, 'WRONG_COMMAND_SURFACE', 'QA surface unavailable.');
    let session = qaSessions.get(surface);
    if (!session) {
      session = createOperationalQaSession(client, { enabled: true, surface, persistence: businessPersistence,
        binding: { ...commandBinding, inactiveMasterQaEnabled, actor: async () => disposed ? null : commandBinding.actor() } });
      qaSessions.set(surface, session);
    }
    return session;
  } : undefined;
  let catalogSession: ReturnType<typeof createCatalogQaSession> | undefined;
  const catalogQa = options.approvedOperationalQa && options.approvedPreviewCommands && !options.approvedAppEventFixture && commandBinding ? () => {
    if (disposed) throw new PreviewHttpError(403, 'QA_DISABLED', 'QA unavailable.');
    return catalogSession ??= createCatalogQaSession(client, { enabled: true, persistence: businessPersistence,
      binding: { ...commandBinding, actor: async () => disposed ? null : commandBinding.actor() } });
  } : undefined;
  const runtime: PreviewMockRuntime = {
    notifications,
    mode: PREVIEW_MOCK_MODE,
    ...(operationalQa ? { operationalQa } : {}),
    ...(catalogQa ? { catalogQa } : {}),
    ...(options.approvedAppEventFixture && options.approvedPreviewCommands ? { appEvents: createOperationalAppFixture(client, business.operational('APP_P04')), appEventAdapters: {P04:createOperationalAppFixture(client,business.operational('APP_P04'),'APP_P04'),P05:createOperationalAppFixture(client,business.operational('APP_P05'),'APP_P05'),P19:createOperationalAppFixture(client,business.operational('APP_P19'),'APP_P19'),P09:createOperationalAppFixture(client,business.operational('APP_P09'),'APP_P09')} } : {}),
    business: { readSnapshot: business.readSnapshot, reset: business.reset },
    reset: () => account.reset(),
    uninstall() {
      disposed = true;
      if (client.defaults.adapter === adapter) client.defaults.adapter = originalAdapter;
      unregisterRecovery();
      installed.delete(client);
    },
  };
  installed.set(client, runtime);
  return runtime;
}
