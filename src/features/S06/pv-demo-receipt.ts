import type { PvDemoSnapshot, PvDemoRequest, PvDemoOutcome } from '../../contracts/pv-demo';
import { validatePvDisplayName } from './PvDemoDraft';

/** ACK only a validated receipt with a corresponding canonical readback. */
export function verifyPvReadback(snapshot: PvDemoSnapshot, request: PvDemoRequest, outcome: PvDemoOutcome) {
  const receipt = outcome.receipt;
  const stored = receipt.record.data as Record<string, unknown> | null;
  const profile = snapshot.profiles.find(row => row.id === receipt.entityId);
  const name = validatePvDisplayName(request.payload.displayName);
  if (receipt.commandId !== request.commandId || receipt.epoch !== request.epoch || snapshot.epoch !== request.epoch ||
    receipt.command !== request.command || receipt.actorKey !== snapshot.actorKey || receipt.record.id !== receipt.entityId ||
    receipt.record.kind !== 'pv-profile-v1' || receipt.record.version !== receipt.version ||
    !stored || !profile || name.issue || profile.version < receipt.version || snapshot.snapshotRevision < receipt.snapshotRevision ||
    stored.displayName !== name.value || stored.visibility !== request.payload.visibility || stored.imageAssetId !== request.payload.imageAssetId ||
    stored.provenance !== 'HN-PV-DEMO-v1.0' || profile.provenance !== stored.provenance ||
    profile.skuId !== stored.skuId || profile.productId !== stored.productId ||
    (request.command === 'pv-products.update' && request.entityId !== profile.id) ||
    (request.command === 'pv-products.create' && (profile.skuId !== request.payload.skuId || profile.productId !== request.payload.productId))) return null;
  if (request.command === 'pv-products.create' ? receipt.version !== 1 || receipt.previousVersion !== null || !receipt.changed :
    receipt.previousVersion !== request.expectedVersion || receipt.version !== request.expectedVersion + Number(receipt.changed)) return null;
  if (profile.version === receipt.version && (profile.displayName !== name.value ||
    profile.visibility !== request.payload.visibility || profile.imageAssetId !== request.payload.imageAssetId)) return null;
  return { profile, newer: profile.version > receipt.version };
}
