/** Screen-local form values only. Global owns canonical DTOs, authority and commands.
 * Source: HN-SIX-FLOWS-v0.1 SF-07 and operational text rules.
 */
export type WarrantyDiagnosisState = 'RECEIVED' | 'CHECKING' | 'REPAIRING' | 'REPAIRED' | 'RETURNED';
export interface WarrantyDiagnosisContext {
  caseId: string;
  state: WarrantyDiagnosisState;
  intakeDate: string;
}
export interface WarrantyDiagnosisDefect { id: string; label: string }
export interface WarrantyDiagnosisDraft {
  /** Captured when the parent opens this draft; never rebind on selection change. */
  caseId: string;
  technicianDiagnosis: string;
  defectIds: readonly string[];
  expectedFinishDate: string;
}
export interface WarrantyDiagnosisSubmission {
  caseId: string;
  technicianDiagnosis: string;
  defectIds: string[];
  expectedFinishDate: string | null;
}
export type WarrantyDiagnosisError = 'CASE_UNAVAILABLE' | 'CASE_CHANGED' | 'READ_ONLY' | 'DIAGNOSIS_REQUIRED'
  | 'DIAGNOSIS_TOO_LONG' | 'DIAGNOSIS_CONTROL' | 'DEFECT_SELECTION_INVALID'
  | 'DATE_INVALID' | 'DATE_BEFORE_INTAKE';
export type WarrantyDiagnosisErrors = Partial<Record<'context' | keyof WarrantyDiagnosisDraft, WarrantyDiagnosisError>>;
export type WarrantyDiagnosisValidation = { ok: true; value: WarrantyDiagnosisSubmission }
  | { ok: false; errors: WarrantyDiagnosisErrors };

export function canEditWarrantyDiagnosis(state: WarrantyDiagnosisState): boolean {
  return ['RECEIVED', 'CHECKING', 'REPAIRING'].includes(state);
}

export function isWarrantyIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Does not transition state or grant authority. Server validation remains required.
 * Empty selection/date is allowed here: those are mandatory when entering REPAIRING,
 * which is a separate command. Existing inactive links are not silently rewritten.
 */
export function validateWarrantyDiagnosis(
  context: WarrantyDiagnosisContext, draft: WarrantyDiagnosisDraft,
  activeDefects: readonly WarrantyDiagnosisDefect[],
): WarrantyDiagnosisValidation {
  const errors: WarrantyDiagnosisErrors = {};
  if (!context.caseId.trim() || !isWarrantyIsoDate(context.intakeDate)) errors.context = 'CASE_UNAVAILABLE';
  else if (draft.caseId !== context.caseId) errors.context = 'CASE_CHANGED';
  else if (!canEditWarrantyDiagnosis(context.state)) errors.context = 'READ_ONLY';
  const technicianDiagnosis = draft.technicianDiagnosis.trim().normalize('NFC');
  if (/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/u.test(draft.technicianDiagnosis)) {
    errors.technicianDiagnosis = 'DIAGNOSIS_CONTROL';
  } else if (!technicianDiagnosis) errors.technicianDiagnosis = 'DIAGNOSIS_REQUIRED';
  else if ([...technicianDiagnosis].length > 2000) errors.technicianDiagnosis = 'DIAGNOSIS_TOO_LONG';
  const activeIds = new Set(activeDefects.map(defect => defect.id));
  if (new Set(draft.defectIds).size !== draft.defectIds.length
    || draft.defectIds.some(id => !id || !activeIds.has(id))) errors.defectIds = 'DEFECT_SELECTION_INVALID';
  const expectedFinishDate = draft.expectedFinishDate || null;
  if (expectedFinishDate && !isWarrantyIsoDate(expectedFinishDate)) errors.expectedFinishDate = 'DATE_INVALID';
  else if (expectedFinishDate && isWarrantyIsoDate(context.intakeDate) && expectedFinishDate < context.intakeDate) {
    errors.expectedFinishDate = 'DATE_BEFORE_INTAKE';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { caseId: context.caseId, technicianDiagnosis,
    defectIds: [...draft.defectIds], expectedFinishDate } };
}
