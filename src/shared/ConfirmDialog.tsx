import { useUiCopy } from '../i18n/use-ui-copy';
import type { ReactNode } from 'react';
import { Button } from './primitives';
import { GlobalModal } from './GlobalModal';

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/** A single-action confirmation layer. It never decides whether an action is allowed. */
export function ConfirmDialog({
  open, title, description, children, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  busy = false, tone = 'default', onConfirm, onCancel,
}: ConfirmDialogProps) {
  const tx = useUiCopy();
  return <GlobalModal open={open} title={title} description={description} onClose={onCancel} size="small" footer={
    <div className="hn-confirm-dialog__actions">
      <Button variant="secondary" onClick={onCancel} disabled={busy}>{tx(cancelLabel)}</Button>
      <Button variant="primary" tone={tone === 'danger' ? 'danger' : undefined} loading={busy} onClick={onConfirm}>{tx(confirmLabel)}</Button>
    </div>
  }>
    {children}
  </GlobalModal>;
}

