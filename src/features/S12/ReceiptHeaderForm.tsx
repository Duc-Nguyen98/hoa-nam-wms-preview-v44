import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../shared/primitives';
import { Icon } from '../../shared/Icon';
import { BasicSelect } from '../../shared/controls';
import { FormField } from '../../shared/FormField';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { canEditReceiptHeader, validateReceiptHeaderDraft, type ReceiptHeaderContext, type ReceiptHeaderDraft, type ReceiptHeaderError, type ReceiptHeaderSubmission } from './receipt-header-form';

const COPY = {
  'Tạo phiếu nhập': 'Create receipt', 'Sửa thông tin phiếu nhập': 'Edit receipt header',
  'Loại phiếu nhập': 'Receipt type', 'Chọn loại phiếu': 'Select receipt type',
  'Sản phẩm': 'Products', 'Linh kiện': 'Components', 'Nguồn nhập': 'Source', 'Tham chiếu': 'Reference',
  'Tối đa 200 ký tự, một dòng.': 'Up to 200 characters, one line.',
  'Không bắt buộc. Tối đa 200 ký tự, một dòng.': 'Optional. Up to 200 characters, one line.',
  'Loại phiếu không thay đổi khi sửa thông tin.': 'Receipt type cannot be changed when editing the header.',
  'Chỉ sửa thông tin khi phiếu còn nháp và chưa ghi nhận mã.': 'The header can only be edited while the receipt is draft with no recorded codes.',
  'Đang chờ dữ liệu phiếu nhập.': 'Waiting for receipt data.',
  'Chưa xác định kết quả. Cần kiểm tra kết quả trước khi gửi tiếp.': 'The outcome is unknown. Check the result before submitting again.',
  'Phiếu nhập đã thay đổi. Tải lại thông tin trước khi sửa.': 'The receipt has changed. Reload its details before editing.',
  'Lưu': 'Save', 'Đang lưu…': 'Saving…', 'Hủy': 'Cancel',
  'Chọn loại phiếu nhập.': 'Select a receipt type.', 'Nhập nguồn nhập.': 'Enter a source.',
  'Nội dung không được vượt quá 200 ký tự.': 'The text must not exceed 200 characters.',
  'Chỉ nhập một dòng, không có ký tự điều khiển.': 'Enter one line without control characters.',
  'Kiểm tra lại thông tin': 'Check the highlighted information',
  'Có {count} trường cần kiểm tra.': '{count} fields need attention.',
  'Có {count} lỗi cần sửa trước khi lưu.': '{count} errors need to be fixed before saving.',
};
const ERROR_COPY: Record<ReceiptHeaderError, keyof typeof COPY> = {
  MODE_REQUIRED: 'Chọn loại phiếu nhập.', MODE_IMMUTABLE: 'Loại phiếu không thay đổi khi sửa thông tin.',
  SOURCE_REQUIRED: 'Nhập nguồn nhập.', TOO_LONG: 'Nội dung không được vượt quá 200 ký tự.',
  SINGLE_LINE: 'Chỉ nhập một dòng, không có ký tự điều khiển.',
  IDENTITY_MISMATCH: 'Phiếu nhập đã thay đổi. Tải lại thông tin trước khi sửa.',
  UPDATE_LOCKED: 'Chỉ sửa thông tin khi phiếu còn nháp và chưa ghi nhận mã.',
};
export interface ReceiptHeaderFormProps {
  context: ReceiptHeaderContext | null;
  draft: ReceiptHeaderDraft;
  status: 'idle' | 'submitting' | 'unknown';
  /** Parent-owned, already user-facing service error; no success is inferred here. */
  error?: string | null;
  onDraftChange: (draft: ReceiptHeaderDraft) => void;
  onSubmit: (submission: ReceiptHeaderSubmission) => void;
  onCancel: () => void;
  extraActions?: ReactNode;
  actionLayout?: 'inline' | 'external';
  formId?: string;
}

/** Controlled component only. Parent owns service context, command identity and recovery. */
export function ReceiptHeaderForm({ context, draft, status, error, onDraftChange, onSubmit, onCancel, extraActions, actionLayout = 'inline', formId }: ReceiptHeaderFormProps) {
  const tx = useUiCopy(COPY), id = useId();
  const [attempted, setAttempted] = useState(false);
  const validation = context ? validateReceiptHeaderDraft(draft, context) : null;
  const errors = attempted && validation && !validation.ok ? validation.errors : {};
  const locked = !context || !canEditReceiptHeader(context) || status !== 'idle';
  const fieldError = (field: 'mode' | 'sourceText' | 'referenceText') => errors[field] ? tx(ERROR_COPY[errors[field]]) : undefined;
  const title = tx(context?.intent === 'update' ? 'Sửa thông tin phiếu nhập' : 'Tạo phiếu nhập');
  const errorCount = Object.keys(errors).length;
  const counter = (value: string) => Array.from(value.normalize('NFC')).length;
  return <form id={formId} className="s12-receipt-header-form" noValidate aria-label={title} aria-busy={status === 'submitting'} onSubmit={event => {
    event.preventDefault();
    if (locked || !context) return;
    const form = event.currentTarget;
    setAttempted(true);
    const checked = validateReceiptHeaderDraft(draft, context);
    if (checked.ok) onSubmit(checked.submission);
    else requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({ preventScroll: true }));
  }}>
    {errorCount > 0 && <div className="s12-form-errors" role="alert" tabIndex={-1}><Icon name="alert-circle" size={20} /><span>{tx('Có {count} trường cần kiểm tra.', { count: errorCount })}</span></div>}
    <FormField htmlFor={`${id}-mode`} label={tx('Loại phiếu nhập')} required error={fieldError('mode')}
      hint={context?.intent === 'update' ? tx('Loại phiếu không thay đổi khi sửa thông tin.') : undefined}>
      <BasicSelect id={`${id}-mode`} value={context?.intent === 'update' ? context.mode : draft.mode}
        disabled={locked || context?.intent === 'update'} required
        onChange={event => onDraftChange({ ...draft, mode: event.target.value as ReceiptHeaderDraft['mode'] })}>
        <option value="">{tx('Chọn loại phiếu')}</option><option value="PRODUCT">{tx('Sản phẩm')}</option><option value="COMPONENT">{tx('Linh kiện')}</option>
      </BasicSelect>
    </FormField>
    <FormField htmlFor={`${id}-source`} label={tx('Nguồn nhập')} required error={fieldError('sourceText')} hint={<span className="s12-field-hint-row"><span>{tx('Tối đa 200 ký tự, một dòng.')}</span><span className="s12-field-counter" aria-live="polite">{counter(draft.sourceText)} / 200</span></span>}>
      <input id={`${id}-source`} type="text" autoComplete="off" required disabled={locked} value={draft.sourceText}
        onChange={event => onDraftChange({ ...draft, sourceText: event.target.value })} />
    </FormField>
    <FormField htmlFor={`${id}-reference`} label={tx('Tham chiếu')} error={fieldError('referenceText')} hint={<span className="s12-field-hint-row"><span>{tx('Không bắt buộc. Tối đa 200 ký tự, một dòng.')}</span><span className="s12-field-counter" aria-live="polite">{counter(draft.referenceText)} / 200</span></span>}>
      <input id={`${id}-reference`} type="text" autoComplete="off" disabled={locked} value={draft.referenceText}
        onChange={event => onDraftChange({ ...draft, referenceText: event.target.value })} />
    </FormField>
    {!context && <p role="status">{tx('Đang chờ dữ liệu phiếu nhập.')}</p>}
    {context && !canEditReceiptHeader(context) && <p role="status">{tx('Chỉ sửa thông tin khi phiếu còn nháp và chưa ghi nhận mã.')}</p>}
    {status === 'unknown' && <p role="status">{tx('Chưa xác định kết quả. Cần kiểm tra kết quả trước khi gửi tiếp.')}</p>}
    {errors.form === 'IDENTITY_MISMATCH' && <p role="alert">{tx(ERROR_COPY[errors.form])}</p>}
    {error && <p role="alert">{error}</p>}
    {actionLayout === 'inline' && <div className="s12-action-row">{extraActions}<Button type="button" variant="secondary" disabled={status === 'submitting'} onClick={onCancel}>{tx('Hủy')}</Button>
      <Button type="submit" disabled={locked} loading={status === 'submitting'}>{tx(status === 'submitting' ? 'Đang lưu…' : 'Lưu')}</Button></div>}
  </form>;
}
