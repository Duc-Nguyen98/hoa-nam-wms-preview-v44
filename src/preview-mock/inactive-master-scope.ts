import type { BusinessApplyContext, BusinessRecord } from './business-repository';
import { canonicalBusinessJson } from './business-repository';
import { validateCommitSnapshot, type CommitSnapshotData } from './business-atomic';
import type { OperationalScope, OperationalSnapshot } from '../contracts/operational-preview';
import { isRecord } from '../data/http/api-contract';
import { PreviewHttpError } from './errors';
import { INACTIVE_MASTER_ALLOWLIST, INACTIVE_MASTER_SCOPE } from './inactive-master-allowlist';

/** Fixed planned setup commands, not a grant to arbitrary future generations.
 * Its actual request must be reviewed after the two fresh flow SKUs exist.
 * Merely loading this code neither sends the command nor resets a scenario. */
export const INACTIVE_MASTER_SETUP_COMMAND_ID = '1ffbda3e-5baa-46f2-9471-ec8d86bbd97d';
export const INACTIVE_MASTER_RECOVERY_SETUP_COMMAND_ID = '15bc9a7d-3dd8-4624-8408-d41e686385b2';
export const INACTIVE_MASTER_RECOVERY_PREVIOUS_SCOPE: OperationalScope = {
  scenarioId: 'scenario:b926baea-c82c-40aa-a6d9-666c2c1ddcdb', generation: 2,
};
const base = INACTIVE_MASTER_SCOPE;
const plans = [
  { commandId: INACTIVE_MASTER_SETUP_COMMAND_ID, previous: base },
  { commandId: INACTIVE_MASTER_RECOVERY_SETUP_COMMAND_ID, previous: INACTIVE_MASTER_RECOVERY_PREVIOUS_SCOPE },
] as const;
type SetupPlan = (typeof plans)[number];
type SetupContext = Pick<BusinessApplyContext, 'epoch' | 'records' | 'committedCommand'>;
const fail = (): never => { throw new PreviewHttpError(409, 'QA_SETUP_PROOF_REQUIRED', 'Chưa xác minh được phiên QA đã duyệt.'); };
export const sameInactiveScope = (a: OperationalScope, b: OperationalScope) => a.scenarioId === b.scenarioId && a.generation === b.generation;

function owned(data: Record<string, unknown>, scope: OperationalScope) {
  return data.scenarioId === scope.scenarioId && data.generation === scope.generation
    && data.warehouseId === 'warehouse-hn-01' && data.createdBy === base.actorKey && data.updatedBy === base.actorKey;
}

/** Immutable proof shape shared by the trusted policy and its read-only UI projection.
 * The projection is never command authorization: policy additionally looks up the
 * original request/receipt inside the committing persistence transaction. */
function bindingFromProof(record: BusinessRecord, plan: SetupPlan) {
  if (record.kind !== 'commit-snapshot' || record.version !== 1 || !isRecord(record.data)) return null;
  const proof = record.data as unknown as CommitSnapshotData;
  if (proof.id !== record.id || proof.commandId !== plan.commandId || proof.epoch !== base.epoch
    || proof.actorKey !== base.actorKey || !Number.isSafeInteger(proof.revision) || proof.revision <= 36
    || !Number.isFinite(Date.parse(proof.committedAt)) || !Array.isArray(proof.changes) || proof.changes.length !== 3
    || !Array.isArray(proof.eventIds) || proof.eventIds.length !== 0
    || !Array.isArray(proof.auditIds) || proof.auditIds.length !== 1 || proof.auditIds[0] !== 'audit:' + plan.commandId) return null;
  try {
    const rows = proof.changes.map(change => {
      const row = JSON.parse(change.canonicalRecord) as BusinessRecord;
      if (!isRecord(row) || !isRecord(row.data) || row.id !== change.entityId || row.version !== change.version
        || canonicalBusinessJson(row) !== change.canonicalRecord) throw new Error('invalid proof');
      return { row, change };
    });
    if (new Set(rows.map(item => item.row.id)).size !== 3) return null;
    const next = rows.find(item => item.row.kind === 'operational-scenario' && item.row.id !== plan.previous.scenarioId);
    const previous = rows.find(item => item.row.id === plan.previous.scenarioId);
    const audit = rows.find(item => item.row.id === proof.auditIds[0]);
    if (!next || !previous || !audit) return null;
    const data = next.row.data as Record<string, unknown>, old = previous.row.data as Record<string, unknown>, event = audit.row.data as Record<string, unknown>;
    const scope = { scenarioId: next.row.id, generation: plan.previous.generation + 1 };
    if (!/^scenario:[0-9a-f-]{36}$/i.test(next.row.id) || next.row.version !== 1 || next.change.previousVersion !== null
      || !owned(data, scope) || data.status !== 'ACTIVE' || data.ownerActor !== base.actorKey
      || data.setupManifestId !== 'HN-SIX-FLOWS-v0.1' || data.startedAt !== proof.committedAt
      || data.createdAt !== proof.committedAt || data.updatedAt !== proof.committedAt
      || !Array.isArray(data.selectedSkuIds) || data.selectedSkuIds.length !== 3 || new Set(data.selectedSkuIds).size !== 3
      || data.selectedSkuIds.some(id => typeof id !== 'string' || !/^preview-sku:[0-9a-f-]{36}$/i.test(id))
      || !data.selectedSkuIds.includes(INACTIVE_MASTER_ALLOWLIST[1].entityId)
      || previous.row.kind !== 'operational-scenario' || previous.row.version !== 2 || previous.change.previousVersion !== 1
      || !owned(old, plan.previous) || old.ownerActor !== base.actorKey || old.status !== 'ARCHIVED' || old.updatedAt !== proof.committedAt
      || audit.row.kind !== 'audit-event' || audit.row.version !== 1 || audit.change.previousVersion !== null
      || !owned(event, scope) || event.action !== 'scenario.reset-own' || event.entityId !== next.row.id
      || event.commandId !== plan.commandId || event.sourceSurface !== 'QA' || event.actor !== base.actorKey
      || event.previousVersion !== null || event.newVersion !== 1 || event.commitSnapshotId !== proof.id
      || event.timestamp !== proof.committedAt || canonicalBusinessJson(event.eventIds) !== '[]'
      || canonicalBusinessJson(event.FK) !== canonicalBusinessJson([plan.previous.scenarioId])) return null;
    return { scope, proof, next: next.row };
  } catch { return null; }
}

/** Trusted stored receipt-to-scope resolver. No caller-provided ID or fallback. */
function resolvePlan(c: SetupContext, plan: SetupPlan) {
  const committed = c.committedCommand(plan.commandId);
  const proofs = c.records.filter(row => row.kind === 'commit-snapshot' && isRecord(row.data) && row.data.commandId === plan.commandId);
  if (!committed) { if (proofs.length) return fail(); return null; }
  if (c.epoch !== base.epoch || proofs.length !== 1) return fail();
  const binding = bindingFromProof(proofs[0], plan);
  if (!binding) return fail();
  const { request, receipt } = committed;
  const selectedSkuIds = (binding.next.data as Record<string, unknown>).selectedSkuIds;
  if (canonicalBusinessJson(request) !== canonicalBusinessJson({ commandId: plan.commandId, epoch: base.epoch,
    command: 'scenario.reset-own', payload: { scope: { scenarioId: plan.previous.scenarioId, generation: plan.previous.generation }, input: { confirmed: true, selectedSkuIds } } })
    || receipt.actorKey !== base.actorKey || receipt.epoch !== base.epoch || receipt.command !== 'scenario.reset-own'
    || receipt.commandId !== plan.commandId || receipt.entityId !== binding.scope.scenarioId
    || receipt.version !== 1 || receipt.previousVersion !== null || receipt.changed !== true
    || receipt.commitSnapshotId !== binding.proof.id || canonicalBusinessJson(receipt.record) !== canonicalBusinessJson(binding.next)) return fail();
  validateCommitSnapshot(c.records, receipt);
  return binding.scope;
}

export function resolveInactiveMasterSetups(c: SetupContext): OperationalScope[] {
  const first = resolvePlan(c, plans[0]), second = resolvePlan(c, plans[1]);
  if (second && (!first || !sameInactiveScope(first, plans[1].previous))) return fail();
  return [first, second].filter(scope => scope !== null);
}

export function resolveInactiveMasterSetup(c: SetupContext): OperationalScope | null {
  return resolveInactiveMasterSetups(c).at(-1) ?? null;
}

/** Guard the reserved setup ID before its initial write. Other reset commands
 * retain their existing rules; they do not acquire inactive-master permission. */
export function assertInactiveMasterSetupRequest(commandId: string, scope: OperationalScope, input: Record<string, unknown>, actorKey: string, epoch: string | undefined, context?: Pick<SetupContext, 'records'> & Partial<Pick<SetupContext, 'committedCommand'>>) {
  const plan = plans.find(item => item.commandId === commandId);
  if (!plan) return;
  if (epoch !== base.epoch || actorKey !== base.actorKey || !sameInactiveScope(scope, plan.previous) || input.confirmed !== true
    || !Array.isArray(input.selectedSkuIds) || input.selectedSkuIds.length !== 3
    || new Set(input.selectedSkuIds).size !== 3 || !input.selectedSkuIds.includes(INACTIVE_MASTER_ALLOWLIST[1].entityId)) return fail();
  if (plan.commandId === INACTIVE_MASTER_RECOVERY_SETUP_COMMAND_ID) {
    if (!context?.committedCommand) return fail();
    const first = resolvePlan({ epoch, records: context.records, committedCommand: context.committedCommand }, plans[0]);
    if (!first || !sameInactiveScope(first, plan.previous)) return fail();
  }
}

/** Already validated canonical projection only; does not authorize a write. */
export function inactiveMasterProjectionScopes(snapshot: Pick<OperationalSnapshot, 'epoch' | 'actorKey' | 'commitSnapshots' | 'archivedCommitSnapshots'>): OperationalScope[] {
  if (snapshot.epoch !== base.epoch || snapshot.actorKey !== base.actorKey) return [];
  if (!Array.isArray(snapshot.commitSnapshots) || !Array.isArray(snapshot.archivedCommitSnapshots)) return [];
  const scopes: OperationalScope[] = [];
  for (const plan of plans) {
    const candidates = [...snapshot.commitSnapshots, ...snapshot.archivedCommitSnapshots].filter(row => isRecord(row.data) && row.data.commandId === plan.commandId);
    if (!candidates.length) continue;
    if (candidates.length !== 1) return [];
    const binding = bindingFromProof(candidates[0], plan);
    if (!binding || plan.commandId === INACTIVE_MASTER_RECOVERY_SETUP_COMMAND_ID && !scopes.some(scope => sameInactiveScope(scope, plan.previous))) return [];
    scopes.push(binding.scope);
  }
  return scopes;
}

export function inactiveMasterProjectionScope(snapshot: Pick<OperationalSnapshot, 'epoch' | 'actorKey' | 'commitSnapshots' | 'archivedCommitSnapshots'>): OperationalScope | null {
  return inactiveMasterProjectionScopes(snapshot).at(-1) ?? null;
}
