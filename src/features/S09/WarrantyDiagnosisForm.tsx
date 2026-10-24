import { useId, useState } from 'react';
import { Button } from '../../shared/primitives';
import { FormField } from '../../shared/FormField';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { canEditWarrantyDiagnosis, validateWarrantyDiagnosis, type WarrantyDiagnosisContext,
  type WarrantyDiagnosisDefect, type WarrantyDiagnosisDraft, type WarrantyDiagnosisError,
  type WarrantyDiagnosisSubmission } from './warranty-diagnosis-form';

const COPY = {
  'Chẩn đoán hồ sơ bảo hành': 'Warranty case diagnosis',
  'Khách hàng phản ánh': 'Customer reported issue', 'Kỹ thuật viên chẩn đoán': 'Technician diagnosis',
  'Nhập 1–2000 ký tự; có thể xuống dòng.': 'Enter 1–2000 characters; line breaks are allowed.',
  'Bệnh lỗi đang hoạt động': 'Active defects', 'Chưa có bệnh lỗi đang hoạt động.': 'No active defects are available.',
  'Đã chọn: {count}': 'Selected: {count}', 'Bỏ chọn tất cả': 'Clear selection',
  'Có {count} lựa chọn không còn khả dụng.': '{count} selections are no longer available.',
  'Bỏ lựa chọn không còn hoạt động': 'Remove unavailable selections',
  'Ngày dự kiến sửa xong': 'Expected finish date',
  'Chọn ngày không sớm hơn ngày tiếp nhận.': 'Choose a date on or after intake.',
  'Các bệnh lỗi đã liên kết': 'Previously linked defects',
  'Hồ sơ đã hoàn tất hoặc đã trả khách chỉ được xem.': 'Repaired or returned cases are read-only.',
  'Lưu chẩn đoán': 'Save diagnosis', 'Đang lưu…': 'Saving…',
  'Không thể xác định hồ sơ hoặc ngày tiếp nhận.': 'The case or intake date is unavailable.',
  'Hồ sơ đã thay đổi. Mở lại chẩn đoán cho hồ sơ hiện tại.': 'The case has changed. Reopen diagnosis for the current case.',
  'Nhập chẩn đoán kỹ thuật viên.': 'Enter the technician diagnosis.',
  'Chẩn đoán không được vượt quá 2000 ký tự.': 'Diagnosis must not exceed 2000 characters.',
  'Chẩn đoán có ký tự điều khiển không hợp lệ.': 'Diagnosis contains an unsupported control character.',
  'Chọn các bệnh lỗi đang hoạt động, mỗi bệnh lỗi một lần.': 'Select active defects, each at most once.',
  'Nhập ngày hợp lệ theo định dạng YYYY-MM-DD.': 'Enter a valid date in YYYY-MM-DD format.',
  'Ngày dự kiến không được trước ngày tiếp nhận.': 'The expected date cannot precede intake.',
} as const;
const ERROR_COPY: Record<WarrantyDiagnosisError, keyof typeof COPY> = {
  CASE_UNAVAILABLE: 'Không thể xác định hồ sơ hoặc ngày tiếp nhận.',
  CASE_CHANGED: 'Hồ sơ đã thay đổi. Mở lại chẩn đoán cho hồ sơ hiện tại.',
  READ_ONLY: 'Hồ sơ đã hoàn tất hoặc đã trả khách chỉ được xem.',
  DIAGNOSIS_REQUIRED: 'Nhập chẩn đoán kỹ thuật viên.',
  DIAGNOSIS_TOO_LONG: 'Chẩn đoán không được vượt quá 2000 ký tự.',
  DIAGNOSIS_CONTROL: 'Chẩn đoán có ký tự điều khiển không hợp lệ.',
  DEFECT_SELECTION_INVALID: 'Chọn các bệnh lỗi đang hoạt động, mỗi bệnh lỗi một lần.',
  DATE_INVALID: 'Nhập ngày hợp lệ theo định dạng YYYY-MM-DD.',
  DATE_BEFORE_INTAKE: 'Ngày dự kiến không được trước ngày tiếp nhận.',
};

export interface WarrantyDiagnosisFormProps {
  context: WarrantyDiagnosisContext;
  customerReportedIssue: string;
  activeDefects: readonly WarrantyDiagnosisDefect[];
  /** Display-only canonical references; never merged automatically into a new write. */
  historicalDefects?: readonly WarrantyDiagnosisDefect[];
  draft: WarrantyDiagnosisDraft;
  pending: boolean;
  error?: string | null;
  onDraftChange: (draft: WarrantyDiagnosisDraft) => void;
  /** Parent owns async handling, receipt recovery and authoritative outcome. */
  onSubmit: (value: WarrantyDiagnosisSubmission) => void;
}

/** Controlled, unbound consumer. Mount only after Global provides its canonical adapter. */
export function WarrantyDiagnosisForm({ context, customerReportedIssue, activeDefects,
  historicalDefects = [], draft, pending, error, onDraftChange, onSubmit }: WarrantyDiagnosisFormProps) {
  const tx = useUiCopy(COPY), id = useId();
  const [attempted, setAttempted] = useState(false);
  const validation = validateWarrantyDiagnosis(context, draft, activeDefects);
  const errors = attempted && !validation.ok ? validation.errors : {};
  const readonly = !canEditWarrantyDiagnosis(context.state);
  const locked = pending || readonly;
  const activeIds = new Set(activeDefects.map(defect => defect.id));
  const unavailable = draft.defectIds.filter(defectId => !activeIds.has(defectId));
  const fieldError = (field: keyof typeof errors) => errors[field] ? tx(ERROR_COPY[errors[field]]) : undefined;
  function change(patch: Partial<WarrantyDiagnosisDraft>) {
    if (!locked) onDraftChange({ ...draft, ...patch });
  }
  return <form className="s09-diagnosis-form" noValidate aria-label={tx('Chẩn đoán hồ sơ bảo hành')}
    aria-busy={pending} data-case-id={context.caseId} onSubmit={event => {
      event.preventDefault();
      if (locked) return;
      setAttempted(true);
      if (validation.ok) onSubmit(validation.value);
    }}>
    <FormField label={tx('Khách hàng phản ánh')}><textarea readOnly value={customerReportedIssue} rows={3} /></FormField>
    {historicalDefects.length > 0 && <section aria-labelledby={`${id}-history`}>
      <h3 id={`${id}-history`}>{tx('Các bệnh lỗi đã liên kết')}</h3>
      <ul>{historicalDefects.map(defect => <li key={defect.id} data-defect-id={defect.id}>{defect.label}</li>)}</ul>
    </section>}
    {readonly && <p role="status">{tx('Hồ sơ đã hoàn tất hoặc đã trả khách chỉ được xem.')}</p>}
    <FormField label={tx('Kỹ thuật viên chẩn đoán')} required={!readonly}
      hint={tx('Nhập 1–2000 ký tự; có thể xuống dòng.')} error={fieldError('technicianDiagnosis')}>
      <textarea value={draft.technicianDiagnosis} rows={5} readOnly={readonly} disabled={pending}
        onChange={event => change({ technicianDiagnosis: event.target.value })} />
    </FormField>
    <fieldset disabled={locked} aria-describedby={`${id}-selected${errors.defectIds ? ` ${id}-defects-error` : ''}`}>
      <legend>{tx('Bệnh lỗi đang hoạt động')}</legend>
      {!activeDefects.length && <p>{tx('Chưa có bệnh lỗi đang hoạt động.')}</p>}
      {activeDefects.map(defect => <label key={defect.id} style={{ display: 'block' }}>
        <input type="checkbox" value={defect.id} checked={draft.defectIds.includes(defect.id)}
          onChange={event => change({ defectIds: event.target.checked
            ? [...draft.defectIds, defect.id] : draft.defectIds.filter(value => value !== defect.id) })} /> {defect.label}
      </label>)}
      <p id={`${id}-selected`}>{tx('Đã chọn: {count}', { count: draft.defectIds.length })}</p>
      <Button variant="secondary" disabled={locked || !draft.defectIds.length} onClick={() => change({ defectIds: [] })}>{tx('Bỏ chọn tất cả')}</Button>
      {unavailable.length > 0 && <>
        <p>{tx('Có {count} lựa chọn không còn khả dụng.', { count: unavailable.length })}</p>
        <Button variant="secondary" disabled={locked} onClick={() => change({ defectIds: draft.defectIds.filter(value => activeIds.has(value)) })}>{tx('Bỏ lựa chọn không còn hoạt động')}</Button>
      </>}
      {errors.defectIds && <p id={`${id}-defects-error`} role="alert">{fieldError('defectIds')}</p>}
    </fieldset>
    <FormField label={tx('Ngày dự kiến sửa xong')} hint={tx('Chọn ngày không sớm hơn ngày tiếp nhận.')}
      error={fieldError('expectedFinishDate')}>
      <input type="date" value={draft.expectedFinishDate} min={context.intakeDate} readOnly={readonly} disabled={pending}
        onChange={event => change({ expectedFinishDate: event.target.value })} />
    </FormField>
    {errors.context && <p role="alert">{fieldError('context')}</p>}
    {error && <p role="alert">{error}</p>}
    {!readonly && <Button type="submit" loading={pending} disabled={pending}>{tx(pending ? 'Đang lưu…' : 'Lưu chẩn đoán')}</Button>}
  </form>;
}
