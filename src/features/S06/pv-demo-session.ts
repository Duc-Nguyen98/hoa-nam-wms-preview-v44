import type { PvDemoAdapter, PvDemoOutcome, PvDemoRequest, PvDemoSnapshot } from '../../contracts/pv-demo';
import type { PvDemoDraft } from './PvDemoDraft';
import { verifyPvReadback } from './pv-demo-receipt';

export interface PvFormIssue { message: string; field?: keyof PvDemoDraft; conflict?: boolean }
export type PvDemoPhase = 'loading' | 'ready' | 'saving' | 'pending' | 'blocked' | 'readback';
export interface PvDemoState {
  snapshot: PvDemoSnapshot | null; phase: PvDemoPhase; issue: PvFormIssue | null;
  busy: boolean; request: PvDemoRequest | null;
}
export function pvFailureIssue(error: unknown): PvFormIssue {
  const failure = error as { code?: string; details?: { field?: string } };
  const field = failure?.details?.field;
  const safeField = field === 'skuId' || field === 'displayName' || field === 'visibility' || field === 'imageAssetId' ? field : undefined;
  if (failure?.code === 'MASTER_UNAVAILABLE')
    return { message: 'Nguồn sản phẩm không khả dụng.', field: 'skuId', conflict: true };
  if (['STALE_VERSION', 'STALE_MASTER_VERSION', 'STALE_DEMO_EPOCH', 'ENTITY_NOT_FOUND'].includes(failure?.code ?? ''))
    return { message: 'Dữ liệu đã thay đổi. Hãy tải dữ liệu mới nhất trước khi lưu.', conflict: true };
  if (failure?.code === 'DUPLICATE_VALUE') return { message: 'SKU đã có hồ sơ PV.', field: 'skuId', conflict: true };
  return { message: failure?.code === 'VALIDATION_FAILED' ? 'Kiểm tra các trường được đánh dấu.' : 'Chưa thể lưu hồ sơ.', field: safeField };
}
function definitive(error: unknown) {
  const failure = error as { status?: number; code?: string; notDispatched?: boolean };
  return failure?.notDispatched === true || (!!failure?.status && failure.status >= 400 && failure.status < 500 &&
    ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE');
}

/** Screen-local coordination only. Shared owns persistence and exact-request retry. */
export function createPvDemoSession(adapter: PvDemoAdapter,
  onCommitted: (snapshot: PvDemoSnapshot, outcome: PvDemoOutcome, newer: boolean) => void) {
  let state: PvDemoState = { snapshot: null, phase: 'loading', issue: null, busy: false, request: null };
  let active = false, generation = 0, gate = false;
  let unresolved: PvDemoRequest | null = null;
  let known: { request: PvDemoRequest; outcome: PvDemoOutcome } | null = null;
  const listeners = new Set<() => void>();
  const current = (token: number) => active && generation === token;
  function publish(patch: Partial<PvDemoState>) {
    state = { ...state, ...patch };
    if (active) listeners.forEach(listener => listener());
  }
  function block() {
    publish({ phase: known ? 'readback' : 'blocked', snapshot: null,
      issue: { message: 'Không thể xác minh kết quả. Bản nhập được giữ nguyên.' } });
  }
  async function accept(request: PvDemoRequest, outcome: PvDemoOutcome, token: number) {
    known = { request, outcome };
    publish({ phase: 'readback', request });
    const before = await adapter.readSnapshot();
    if (!current(token)) return null;
    if (!verifyPvReadback(before, request, outcome)) throw new Error('PV_READBACK_NOT_VERIFIED');
    await adapter.recovery.acknowledge(request.commandId);
    if (!current(token)) return null;
    // ACK can cross another tab's session/epoch change, including an already empty journal.
    const next = await adapter.readSnapshot();
    if (!current(token)) return null;
    const verified = verifyPvReadback(next, request, outcome);
    if (!verified) throw new Error('PV_READBACK_NOT_VERIFIED');
    known = null; unresolved = null;
    publish({ snapshot: next, phase: 'ready', issue: null, request: null });
    onCommitted(next, outcome, verified.newer);
    return next;
  }
  async function inspect(retry: boolean, token: number): Promise<PvDemoSnapshot | null> {
    if (known) return accept(known.request, known.outcome, token);
    const result = await (retry ? adapter.recovery.retry() : adapter.recovery.restore());
    if (!current(token)) return null;
    if (result.kind === 'blocked') { block(); return null; }
    if (result.kind === 'pending' || result.kind === 'committed') {
      if (unresolved && unresolved.commandId !== result.request.commandId) { block(); return null; }
      unresolved = result.request;
      if (result.kind === 'committed') return accept(result.request, result.outcome, token);
      publish({ phase: 'pending', request: result.request, issue: null }); return null;
    }
    // An empty journal cannot prove the result of an earlier unknown dispatch.
    if (unresolved) { block(); return null; }
    const next = await adapter.readSnapshot();
    if (!current(token)) return null;
    publish({ snapshot: next, phase: 'ready', request: null });
    return next;
  }
  async function run(operation: (token: number) => Promise<PvDemoSnapshot | null>) {
    if (!active || gate) return null;
    gate = true;
    const token = generation;
    publish({ busy: true, snapshot: null });
    try {
      if (!adapter.available) { block(); return null; }
      return await operation(token);
    } catch { if (current(token)) block(); return null; }
    finally {
      gate = false;
      if (current(token)) publish({ busy: false });
      else if (active) void recover();
    }
  }
  function recover(retry = false) { return run(token => inspect(retry, token)); }
  async function execute(input: PvDemoRequest) {
    if (state.phase !== 'ready' || gate || !active) return null;
    const request = structuredClone(input);
    return run(async token => {
      unresolved = request;
      publish({ phase: 'saving', issue: null, request });
      let outcome: PvDemoOutcome;
      try { outcome = await adapter.execute(request); }
      catch (error) {
        if (definitive(error)) unresolved = null;
        if (!current(token)) return null;
        publish({ issue: pvFailureIssue(error) });
        return inspect(false, token);
      }
      known = { request, outcome };
      if (!current(token)) return null;
      return accept(request, outcome, token);
    });
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    activate() { active = true; generation++; publish({ snapshot: null, phase: 'loading' }); void recover(); },
    suspend() { active = false; generation++; },
    execute, recover, clearIssue: () => publish({ issue: null }),
  };
}
