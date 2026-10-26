/** Screen-local presentation payloads, not a transport DTO or authorization decision. */
export type ReceiptHeaderMode = 'PRODUCT' | 'COMPONENT';
export interface ReceiptHeaderDraft { mode: ReceiptHeaderMode | ''; sourceText: string; referenceText: string; boundReceiptId?: string }
export type ReceiptHeaderContext = { intent: 'create' } | {
  intent: 'update'; receiptId: string; mode: ReceiptHeaderMode; receiptStatus: string; scanCount: number;
};
export type ReceiptHeaderSubmission =
  | { intent: 'create'; payload: { mode: ReceiptHeaderMode; sourceText: string; referenceText: string } }
  | { intent: 'update'; receiptId: string; payload: { sourceText: string; referenceText: string } };
export type ReceiptHeaderField = 'mode' | 'sourceText' | 'referenceText' | 'form';
export type ReceiptHeaderError = 'MODE_REQUIRED' | 'MODE_IMMUTABLE' | 'SOURCE_REQUIRED' | 'TOO_LONG' | 'SINGLE_LINE' | 'UPDATE_LOCKED' | 'IDENTITY_MISMATCH';
export type ReceiptHeaderValidation = { ok: true; submission: ReceiptHeaderSubmission }
  | { ok: false; errors: Partial<Record<ReceiptHeaderField, ReceiptHeaderError>> };
const forbidden = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;

export function canEditReceiptHeader(context: ReceiptHeaderContext): boolean {
  return context.intent === 'create' || (context.receiptStatus === 'DRAFT'
    && Number.isSafeInteger(context.scanCount) && context.scanCount === 0);
}

/** SF04: header only; service must recheck eligibility atomically on submission. */
export function validateReceiptHeaderDraft(draft: Readonly<ReceiptHeaderDraft>, context: Readonly<ReceiptHeaderContext>): ReceiptHeaderValidation {
  const errors: Partial<Record<ReceiptHeaderField, ReceiptHeaderError>> = {};
  if (!canEditReceiptHeader(context)) errors.form = 'UPDATE_LOCKED';
  if (context.intent === 'update' && (!context.receiptId.trim() || draft.boundReceiptId !== context.receiptId)) errors.form = 'IDENTITY_MISMATCH';
  if (draft.mode !== 'PRODUCT' && draft.mode !== 'COMPONENT') errors.mode = 'MODE_REQUIRED';
  else if (context.intent === 'update' && draft.mode !== context.mode) errors.mode = 'MODE_IMMUTABLE';
  const sourceText = draft.sourceText.trim().normalize('NFC');
  const referenceText = draft.referenceText.trim().normalize('NFC');
  // Check raw text too: trimming must never silently remove a forbidden newline/control.
  for (const field of ['sourceText', 'referenceText'] as const) {
    const value = field === 'sourceText' ? sourceText : referenceText;
    if (forbidden.test(draft[field])) errors[field] = 'SINGLE_LINE';
    else if (Array.from(value).length > 200) errors[field] = 'TOO_LONG';
    else if (field === 'sourceText' && !value) errors.sourceText = 'SOURCE_REQUIRED';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, submission: context.intent === 'create'
    ? { intent: 'create', payload: { mode: draft.mode as ReceiptHeaderMode, sourceText, referenceText } }
    : { intent: 'update', receiptId: context.receiptId, payload: { sourceText, referenceText } } };
}
