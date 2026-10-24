/** Screen-local input state for HN-PV-DEMO-v1.0 PV02; not a Shared DTO or store. */
export interface PvDemoDraft {
  skuId: string;
  displayName: string;
  imageAssetId: string | null;
  visibility: '' | 'hidden' | 'visible';
}

export function emptyPvDemoDraft(): PvDemoDraft {
  return { skuId: '', displayName: '', imageAssetId: null, visibility: '' };
}

export type PvNameIssue = 'required' | 'control-character' | 'too-long';

/** Check forbidden characters before trim so a trailing newline cannot disappear. */
export function validatePvDisplayName(raw: string): { value: string; issue?: PvNameIssue } {
  const value = raw.trim().normalize('NFC');
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(raw)) return { value, issue: 'control-character' };
  if (!value) return { value, issue: 'required' };
  if ([...value].length > 120) return { value, issue: 'too-long' };
  return { value };
}

export function isPvDemoDraftDirty(initial: Readonly<PvDemoDraft>, draft: Readonly<PvDemoDraft>): boolean {
  return initial.skuId !== draft.skuId || initial.displayName !== draft.displayName ||
    initial.imageAssetId !== draft.imageAssetId || initial.visibility !== draft.visibility;
}

export function selectPvDemoSku(draft: Readonly<PvDemoDraft>, skuId: string, productName: string): PvDemoDraft {
  // Selection prefills once; typing and later master refresh must not overwrite the draft.
  return { ...draft, skuId, displayName: productName };
}
