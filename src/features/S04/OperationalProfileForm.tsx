import { useId } from 'react';
import { BasicSelect, Button } from '../../shared';
import { useUiCopy } from '../../i18n/use-ui-copy';
import {
  prepareOperationalProfileSelection,
  type OperationalProfileContext, type OperationalProfileDraft,
  type OperationalProfileSelection, type OperationalProfileValidationError,
} from './operational-profile-form';

const COPY = {
  'Cấu hình theo dõi SKU': 'SKU tracking profile',
  'Mã SKU': 'SKU code', 'Sản phẩm': 'Product', 'Đơn vị tính': 'Unit',
  'Đơn vị tính được kế thừa từ sản phẩm.': 'The unit is inherited from the product.',
  'Cách theo dõi': 'Tracking method', 'Chọn cách theo dõi': 'Select a tracking method',
  'Sản phẩm theo serial': 'Product by serial', 'Linh kiện theo BOX': 'Component by BOX',
  'Cấu hình không thể thay đổi sau lần quét đầu tiên.': 'The profile cannot be changed after the first scan.',
  'Chưa có SKU hoặc đơn vị tính hợp lệ. Đọc lại dữ liệu SKU.': 'The SKU or its unit is unavailable. Reload the SKU data.',
  'SKU đang chọn đã thay đổi. Chọn lại SKU trước khi gửi.': 'The selected SKU has changed. Select the SKU again before submitting.',
  'Chọn một cách theo dõi hợp lệ.': 'Select a valid tracking method.',
  'Tạo cấu hình': 'Create profile', 'Đang gửi…': 'Submitting…',
};
const VALIDATION_COPY: Record<OperationalProfileValidationError, string> = {
  SKU_UNAVAILABLE: 'Chưa có SKU hoặc đơn vị tính hợp lệ. Đọc lại dữ liệu SKU.',
  SKU_CHANGED: 'SKU đang chọn đã thay đổi. Chọn lại SKU trước khi gửi.',
  TRACKING_REQUIRED: 'Chọn một cách theo dõi hợp lệ.',
};

export interface OperationalProfileFormProps {
  context: OperationalProfileContext | null;
  draft: OperationalProfileDraft;
  pending: boolean;
  validationError?: OperationalProfileValidationError | null;
  /** The future caller supplies an already localized service/recovery message. */
  error?: string | null;
  onDraftChange: (draft: OperationalProfileDraft) => void;
  onValidationError: (error: OperationalProfileValidationError | null) => void;
  onSubmit: (selection: OperationalProfileSelection) => void;
}

/** Component only. The caller owns persistence, eligibility, recovery and accepted reads. */
export function OperationalProfileForm({ context, draft, pending, validationError, error,
  onDraftChange, onValidationError, onSubmit }: OperationalProfileFormProps) {
  const tx = useUiCopy(COPY);
  const id = useId();
  const preparation = prepareOperationalProfileSelection(context, draft, pending);
  const contextError = preparation.kind === 'invalid' && preparation.error !== 'TRACKING_REQUIRED'
    ? preparation.error : null;
  const visibleError = contextError ?? validationError;
  const disabled = pending || !!contextError;
  return <form className="sku-create-form" aria-label={tx('Cấu hình theo dõi SKU')} aria-busy={pending}
    noValidate onSubmit={event => {
      event.preventDefault();
      const result = prepareOperationalProfileSelection(context, draft, pending);
      if (result.kind === 'pending') return;
      if (result.kind === 'invalid') { onValidationError(result.error); return; }
      onValidationError(null);
      onSubmit(result.selection);
    }}>
    <dl className="sku-detail__fields">
      <div><dt>{tx('Mã SKU')}</dt><dd>{context?.skuCode ?? '—'}</dd></div>
      <div><dt>{tx('Sản phẩm')}</dt><dd>{context?.productName ?? '—'}</dd></div>
      <div><dt>{tx('Đơn vị tính')}</dt><dd>{context?.inheritedUnit ?? '—'}</dd></div>
    </dl>
    <p>{tx('Đơn vị tính được kế thừa từ sản phẩm.')}</p>
    <label htmlFor={`${id}-tracking`}>{tx('Cách theo dõi')} *
      <BasicSelect id={`${id}-tracking`} value={draft.tracking} disabled={disabled} required
        aria-invalid={visibleError === 'TRACKING_REQUIRED'}
        aria-describedby={`${id}-hint${visibleError ? ` ${id}-error` : ''}`}
        onChange={event => {
          onValidationError(null);
          onDraftChange({ ...draft, tracking: event.target.value });
        }}>
        <option value="">{tx('Chọn cách theo dõi')}</option>
        <option value="PRODUCT_SERIAL">{tx('Sản phẩm theo serial')}</option>
        <option value="COMPONENT_BOX">{tx('Linh kiện theo BOX')}</option>
      </BasicSelect>
    </label>
    <p id={`${id}-hint`}>{tx('Cấu hình không thể thay đổi sau lần quét đầu tiên.')}</p>
    {visibleError && <p id={`${id}-error`} role="alert">{tx(VALIDATION_COPY[visibleError])}</p>}
    {error && <p role="alert">{error}</p>}
    <Button type="submit" disabled={disabled}>{tx(pending ? 'Đang gửi…' : 'Tạo cấu hình')}</Button>
  </form>;
}
