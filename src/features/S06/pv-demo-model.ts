import type { PvDemoSnapshot, PvProfile, PvDemoRequest } from '../../contracts/pv-demo';
import { validatePvDisplayName, type PvDemoDraft } from './PvDemoDraft';

const excludedProduct = 'preview-product:7ec40c8f-f744-4297-9128-2affe9eae980';
const excludedSku = 'preview-sku:e93e34ed-53b1-4593-b9de-b7a4d3be3691';

export function pvMasters(snapshot: PvDemoSnapshot, skuId: string) {
  const sku = snapshot.skus.find(row => row.id === skuId);
  const product = sku && snapshot.products.find(row => row.id === sku.productId);
  return sku && product ? { sku, product } : null;
}
export function pvMasterEligible(snapshot: PvDemoSnapshot, skuId: string) {
  const master = pvMasters(snapshot, skuId);
  return !!master && master.sku.id !== excludedSku && master.product.id !== excludedProduct &&
    master.sku.status === 'active' && master.product.status === 'active';
}
export function pvCreateChoices(snapshot: PvDemoSnapshot) {
  return snapshot.skus.filter(sku => pvMasterEligible(snapshot, sku.id) && !snapshot.profiles.some(row => row.skuId === sku.id));
}
export function pvProfileDraft(profile: PvProfile): PvDemoDraft {
  return { skuId: profile.skuId, displayName: profile.displayName, imageAssetId: profile.imageAssetId, visibility: profile.visibility };
}
export function pvHasEditableChange(profile: PvProfile, draft: PvDemoDraft) {
  return profile.displayName !== validatePvDisplayName(draft.displayName).value ||
    profile.visibility !== draft.visibility || profile.imageAssetId !== draft.imageAssetId;
}
export function pvPreviewRows(snapshot: PvDemoSnapshot) {
  return snapshot.profiles.filter(row => row.visibility === 'visible' && row.masterAvailable &&
    pvMasterEligible(snapshot, row.skuId) && pvMasters(snapshot, row.skuId)?.product.id === row.productId);
}
export function pvDraftErrors(snapshot: PvDemoSnapshot, draft: PvDemoDraft, profile?: PvProfile) {
  const errors: Partial<Record<keyof PvDemoDraft, string>> = {};
  const master = pvMasters(snapshot, draft.skuId), name = validatePvDisplayName(draft.displayName);
  if (!master || !pvMasterEligible(snapshot, draft.skuId)) errors.skuId = 'MASTER_UNAVAILABLE';
  else if (!profile && snapshot.profiles.some(row => row.skuId === draft.skuId)) errors.skuId = 'DUPLICATE_VALUE';
  else if (profile && (profile.skuId !== draft.skuId || profile.productId !== master.product.id)) errors.skuId = 'MASTER_UNAVAILABLE';
  if (name.issue) errors.displayName = name.issue;
  if (draft.visibility !== 'hidden' && draft.visibility !== 'visible') errors.visibility = 'required';
  if (draft.imageAssetId !== null && !snapshot.assets.some(asset => asset.assetId === draft.imageAssetId)) errors.imageAssetId = 'ASSET_UNAVAILABLE';
  return errors;
}
export function pvBuildRequest(snapshot: PvDemoSnapshot, draft: PvDemoDraft, commandId: string, profile?: PvProfile): PvDemoRequest | null {
  if (Object.keys(pvDraftErrors(snapshot, draft, profile)).length || (profile && !pvHasEditableChange(profile, draft))) return null;
  const { sku, product } = pvMasters(snapshot, draft.skuId)!;
  const payload = { displayName: validatePvDisplayName(draft.displayName).value, imageAssetId: draft.imageAssetId,
    visibility: draft.visibility as 'hidden' | 'visible', observedSkuVersion: sku.version, observedProductVersion: product.version };
  return profile
    ? { commandId, epoch: snapshot.epoch, command: 'pv-products.update', entityId: profile.id, expectedVersion: profile.version, payload }
    : { commandId, epoch: snapshot.epoch, command: 'pv-products.create', payload: { ...payload, skuId: sku.id, productId: product.id } };
}

export function pvAssetPath(snapshot: PvDemoSnapshot, assetId: string | null) {
  const asset = snapshot.assets.find(row => row.assetId === assetId);
  // Only the trusted manifest supplies paths; never accept a URL from form input.
  return asset && asset.path.startsWith('/') && !asset.path.startsWith('//') && !/[\\\u0000-\u0020]/u.test(asset.path)
    ? asset.path : null;
}
