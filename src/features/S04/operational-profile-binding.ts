import type { CatalogCreateAdapter, CatalogSnapshot } from '../../contracts/catalog-create';
import type { OperationalCommand, OperationalSnapshot, OperationalOutcome } from '../../contracts/operational-preview';
import type { CommandRecoveryResult } from '../../data/command-recovery';
import { hasOperationalCommitProof, isOperationalOutcome, type createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { canonicalBusinessJson } from '../../preview-mock/business-repository';
import type { OperationalProfileSelection } from './operational-profile-form';

type Adapter = ReturnType<typeof createOperationalWebAdapter>;
type ProfileCommand = OperationalCommand<'stock-profiles.create'>;
type Recovery = CommandRecoveryResult<OperationalCommand, OperationalOutcome>;
export interface ProfileBindingState {
  busy: boolean;
  catalog: CatalogSnapshot | null;
  operations: OperationalSnapshot | null;
  recovery: Recovery;
  error: string | null;
  acceptedSkuId: string | null;
  archivedCommandId: string | null;
}
/** Presentation only: the first render precedes the effect that starts the read. */
export function profileReadPending(state: ProfileBindingState) {
  return state.busy || (!state.catalog && !state.operations && !state.error
    && state.recovery.kind === 'blocked' && state.recovery.code === 'READ_REQUIRED');
}
const failure = (code: string): never => { throw Object.assign(new Error(code), { code }); };
const errorCode = (error: unknown) => (error as { code?: string })?.code ?? 'OPERATION_FAILED';
export function isProfileCommand(request: OperationalCommand): request is ProfileCommand {
  if (request.command !== 'stock-profiles.create') return false;
  const p = request.payload as ProfileCommand['payload'];
  return typeof p.skuId === 'string' && ['PRODUCT_SERIAL', 'COMPONENT_BOX'].includes(p.tracking)
    && Number.isSafeInteger(p.observedSkuVersion) && p.observedSkuVersion > 0
    && Number.isSafeInteger(p.observedProductVersion) && p.observedProductVersion > 0;
}
function assertPair(catalog: CatalogSnapshot, operations: OperationalSnapshot) {
  if (catalog.epoch !== operations.epoch || catalog.actorKey !== operations.actorKey) failure('READ_CONTEXT_CHANGED');
}
export function profileEligibility(state: ProfileBindingState, skuId: string) {
  const { catalog, operations } = state;
  const sku = catalog?.skus.find(row => row.id === skuId);
  const product = catalog?.products.find(row => row.id === sku?.productId);
  const profile = operations?.profiles.find(row => row.data.skuId === skuId) ?? null;
  let reason: string | null = null;
  if (!catalog || !operations) reason = 'READ_REQUIRED';
  else if (!operations.scenario) reason = 'SCENARIO_REQUIRED';
  else if (!operations.scenario.data.selectedSkuIds.includes(skuId)) reason = 'SKU_OUTSIDE_SCENARIO';
  else if (!sku || !product || sku.status !== 'active' || product.status !== 'active') reason = 'SKU_UNAVAILABLE';
  else if (profile) reason = 'PROFILE_EXISTS';
  return { sku, product, profile, reason };
}

/** Screen controller only. Persistence, grants and durable intent belong to the canonical adapter. */
export function createProfileBinding(adapter: Adapter, catalogAdapter: Pick<CatalogCreateAdapter<'sku'>, 'readSnapshot'>, skuId: string) {
  let state: ProfileBindingState = { busy: false, catalog: null, operations: null,
    recovery: { kind: 'blocked', code: 'READ_REQUIRED' }, error: null, acceptedSkuId: null, archivedCommandId: null };
  let generation = 0;
  const listeners = new Set<(next: ProfileBindingState) => void>();
  const publish = (patch: Partial<ProfileBindingState>) => { state = { ...state, ...patch }; for (const listener of listeners) listener(state); };
  const current = (token: number) => token === generation;
  async function readPair() {
    const catalog = await catalogAdapter.readSnapshot();
    const operations = await adapter.read();
    assertPair(catalog, operations);
    return { catalog, operations };
  }
  async function restore() {
    try { return await adapter.recovery.restore(); }
    catch (error) { return { kind: 'blocked', code: errorCode(error) } as const; }
  }
  async function accept(request: OperationalCommand, outcome: OperationalOutcome, token: number, reconcileArchived = false) {
    if (!isProfileCommand(request)) return failure('RECOVERY_COMMAND_MISMATCH');
    if (!isOperationalOutcome(outcome, request)) return failure('RECOVERY_COMMAND_MISMATCH');
    const next = await readPair();
    if (!current(token)) return;
    const { operations, catalog } = next;
    if (operations.epoch !== request.epoch || operations.actorKey !== outcome.receipt.actorKey) failure('READ_CONTEXT_CHANGED');
    if (operations.token.scenarioId !== request.scenarioId || operations.token.generation !== request.generation) {
      // An explicit reconciliation may verify a historical write, but never turn it into an active profile.
      if (!reconcileArchived || !hasOperationalCommitProof(operations, request, outcome)) failure('RECOVERY_ARCHIVED_SCENARIO');
      await adapter.recovery.acknowledge(request.commandId);
      if (current(token)) publish({ ...next, recovery: { kind: 'empty' }, error: null, acceptedSkuId: null, archivedCommandId: request.commandId });
      return;
    }
    const profile = operations.profiles.find(row => row.id === outcome.receipt.entityId);
    const sku = catalog.skus.find(row => row.id === request.payload.skuId);
    const product = catalog.products.find(row => row.id === sku?.productId);
    if (!profile || !sku || !product || profile.data.skuId !== request.payload.skuId
      || profile.data.productId !== product.id || profile.data.unit !== product.unit
      || profile.data.tracking !== request.payload.tracking || profile.data.skuVersion !== request.payload.observedSkuVersion
      || profile.data.productVersion !== request.payload.observedProductVersion
      || operations.snapshotRevision < outcome.receipt.snapshotRevision
      || canonicalBusinessJson(profile) !== canonicalBusinessJson(outcome.receipt.record)) failure('ACCEPTED_READ_MISMATCH');
    // Never clear the original intent until its actual canonical record was read and checked.
    await adapter.recovery.acknowledge(request.commandId);
    if (current(token)) publish({ ...next, recovery: { kind: 'empty' }, error: null, acceptedSkuId: request.payload.skuId });
  }
  async function run(action: (token: number) => Promise<void>) {
    if (state.busy) return;
    const token = ++generation;
    publish({ busy: true, error: null, acceptedSkuId: null, archivedCommandId: null });
    try { await action(token); }
    catch (error) {
      if (!current(token)) return;
      const recovery = await restore();
      if (current(token)) publish({ catalog: null, operations: null, recovery, error: errorCode(error) });
    } finally { if (current(token)) publish({ busy: false }); }
  }
  return {
    getState: () => state,
    subscribe(listener: (next: ProfileBindingState) => void) { listeners.add(listener); listener(state); return () => { listeners.delete(listener); }; },
    invalidate() { ++generation; publish({ busy: false, catalog: null, operations: null, acceptedSkuId: null, archivedCommandId: null }); },
    read: () => run(async token => {
      if (!adapter.available) failure('COMMAND_UNAVAILABLE');
      const recovery = await restore();
      const next = await readPair();
      if (current(token)) publish({ ...next, recovery });
      // Mount/refresh reads intent only; replay and acknowledgement require an explicit action.
    }),
    create: (selection: OperationalProfileSelection) => run(async token => {
      if (!adapter.available) failure('COMMAND_UNAVAILABLE');
      if (state.recovery.kind !== 'empty') failure('RECOVERY_PENDING');
      if (selection.skuId !== skuId) failure('SKU_CHANGED');
      const eligible = profileEligibility(state, skuId);
      if (eligible.reason || !eligible.sku || !eligible.product || !state.operations || !state.catalog) failure(eligible.reason ?? 'READ_REQUIRED');
      assertPair(state.catalog!, state.operations!);
      const request: ProfileCommand = { command: 'stock-profiles.create', commandId: crypto.randomUUID(),
        epoch: state.operations!.epoch, scenarioId: state.operations!.token.scenarioId, generation: state.operations!.token.generation,
        payload: { skuId, tracking: selection.tracking, observedSkuVersion: eligible.sku!.version, observedProductVersion: eligible.product!.version } };
      const outcome = await adapter.execute(request);
      if (!current(token)) return;
      publish({ recovery: { kind: 'committed', request, outcome } });
      await accept(request, outcome, token);
    }),
    reconcile: () => run(async token => {
      let recovery = await restore();
      if (!current(token)) return;
      publish({ recovery });
      if (recovery.kind === 'pending' || recovery.kind === 'committed') {
        if (!isProfileCommand(recovery.request)) failure('RECOVERY_COMMAND_MISMATCH');
        if (recovery.kind === 'pending') recovery = await adapter.recovery.retry();
        if (!current(token)) return;
        publish({ recovery });
        if (recovery.kind === 'committed') await accept(recovery.request, recovery.outcome, token, true);
      } else if (recovery.kind === 'empty') {
        const next = await readPair();
        if (current(token)) publish(next);
      }
    }),
  };
}
