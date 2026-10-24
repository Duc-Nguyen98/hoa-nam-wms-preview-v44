/** Screen-local input types only; Global owns the eventual command DTO and adapter. */
export type OperationalTracking = 'PRODUCT_SERIAL' | 'COMPONENT_BOX';
export interface OperationalProfileContext {
  skuId: string;
  skuCode: string;
  productName: string;
  /** Supplied from the selected SKU's actual Product, never inferred from tracking. */
  inheritedUnit: string;
}
export interface OperationalProfileDraft { skuId: string; tracking: string }
export interface OperationalProfileSelection { skuId: string; tracking: OperationalTracking }
export type OperationalProfileValidationError = 'SKU_UNAVAILABLE' | 'SKU_CHANGED' | 'TRACKING_REQUIRED';
export type OperationalProfilePreparation =
  | { kind: 'pending' }
  | { kind: 'invalid'; error: OperationalProfileValidationError }
  | { kind: 'ready'; selection: OperationalProfileSelection };

/** Validate against the current selection, not a display code or a stale draft's SKU. */
export function prepareOperationalProfileSelection(
  context: OperationalProfileContext | null,
  draft: OperationalProfileDraft,
  pending: boolean,
): OperationalProfilePreparation {
  if (pending) return { kind: 'pending' };
  if (!context || !context.skuId.trim() || !context.inheritedUnit.trim()) {
    return { kind: 'invalid', error: 'SKU_UNAVAILABLE' };
  }
  if (draft.skuId !== context.skuId) return { kind: 'invalid', error: 'SKU_CHANGED' };
  if (draft.tracking !== 'PRODUCT_SERIAL' && draft.tracking !== 'COMPONENT_BOX') {
    return { kind: 'invalid', error: 'TRACKING_REQUIRED' };
  }
  // No unit, actor, version, scenario or transport envelope is fabricated here.
  return { kind: 'ready', selection: { skuId: context.skuId, tracking: draft.tracking } };
}
