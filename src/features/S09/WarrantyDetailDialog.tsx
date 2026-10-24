import { useCallback, useEffect, useRef } from 'react';
import type { WarrantyRow } from '../../contracts/warranty-cases';
import { OPERATIONS_EN_COPY } from '../../i18n/operations-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';

export const WARRANTY_DETAIL_COPY = {
  ...OPERATIONS_EN_COPY,
  'Chi tiết hồ sơ bảo hành': 'Warranty case details',
  'Đóng chi tiết hồ sơ bảo hành': 'Close warranty case details',
  'Thông tin hồ sơ': 'Case information',
  'Mã hồ sơ': 'Case code',
  'Ngày tiếp nhận': 'Received date',
  'Hạn xử lý': 'Due date',
  'Dữ liệu tại ngày {date}': 'Data as of {date}',
  'Lịch sử xử lý': 'Processing history',
  'Chưa có dữ liệu lịch sử xử lý cho hồ sơ này.': 'Processing history data has not been supplied for this case.',
  'Chứng từ / Phiếu xuất linh kiện liên quan': 'Related documents / Parts issue slips',
  'Chưa có dữ liệu liên kết chứng từ hoặc phiếu xuất linh kiện cho hồ sơ này.': 'Document and parts issue slip links have not been supplied for this case.',
  'Chi tiết hiển thị thông tin hồ sơ hiện có. Lịch sử xử lý và chứng từ liên quan chưa có dữ liệu.': 'Details show the available case information. Processing history and related documents have not been supplied.',
};

/** Read-only projection of the accepted shared read model, not a new case DTO.
 * Snapshot dates/age and opaque case codes are preserved verbatim. The source
 * has no event history or document relation keys; no joins are inferred. */
export function WarrantyDetailDialog({ row, snapshot, onClose }: {
  row: WarrantyRow | null; snapshot: string; onClose: () => void;
}) {
  const tx = useUiCopy(WARRANTY_DETAIL_COPY);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backdropPointer = useRef(false);
  const releaseBodyLock = useRef<(() => void) | undefined>(undefined);
  const focusFrame = useRef<number | undefined>(undefined);
  const releaseDialogResources = useCallback(() => {
    if (focusFrame.current !== undefined) {
      cancelAnimationFrame(focusFrame.current);
      focusFrame.current = undefined;
    }
    const release = releaseBodyLock.current;
    releaseBodyLock.current = undefined;
    release?.();
  }, []);
  const closeDialog = () => {
    releaseDialogResources();
    dialogRef.current?.close();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (row) {
      if (!dialog.open) dialog.showModal();
      releaseBodyLock.current = acquireBodyScrollLock();
      focusFrame.current = requestAnimationFrame(() => {
        focusFrame.current = undefined;
        if (dialog.open) closeRef.current?.focus({ preventScroll: true });
      });
    } else if (!row && dialog.open) dialog.close();
    return releaseDialogResources;
  }, [row, releaseDialogResources]);

  const [received, due] = row?.receiptAndDueDate.split(' · ') ?? [];
  const [status, ...dueStatus] = row?.statusLabel.split(' · ') ?? [];
  const tone = ['Hoàn tất sửa chữa', 'Đã trả khách'].includes(status) ? 'success'
    : status?.startsWith('Đang sửa chữa') ? 'warning' : 'neutral';
  return <dialog ref={dialogRef} className="hn-shell-dialog s09-detail-dialog"
    data-case-code={row?.caseCode} aria-labelledby="s09-detail-title"
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
      const first = buttons[0], last = buttons.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onCancel={event => { event.preventDefault(); closeDialog(); }}
    onPointerDown={event => { backdropPointer.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { backdropPointer.current = false; }}
    onClick={event => {
      if (backdropPointer.current && event.target === event.currentTarget) closeDialog();
      backdropPointer.current = false;
    }}
    onClose={() => { releaseDialogResources(); onClose(); }}>
    {row && <>
      <header className="s09-detail-dialog__header">
        <div><p>{tx('Chi tiết hồ sơ bảo hành')}</p><h2 id="s09-detail-title">{row.caseCode}</h2>
          <p>{tx('Dữ liệu tại ngày {date}', { date: snapshot.split('-').reverse().join('/') })}</p></div>
        <button ref={closeRef} type="button" className="hn-button hn-button--ghost s09-detail-dialog__close"
          aria-label={tx('Đóng chi tiết hồ sơ bảo hành')} onClick={closeDialog}><Icon name="close" size={18} /></button>
      </header>
      <div className="s09-detail-dialog__body">
        <section aria-labelledby="s09-detail-info"><h3 id="s09-detail-info">{tx('Thông tin hồ sơ')}</h3>
          <dl className="s09-detail-dialog__fields">
            <div><dt>{tx('Mã hồ sơ')}</dt><dd>{row.caseCode}</dd></div>
            <div><dt>{tx('Nhận dạng')}</dt><dd>{row.identity === 'TEMP_ONLY' ? <StatusBadge>{row.identity}</StatusBadge> : <>{tx('SN:')} {row.identity}</>}</dd></div>
            <div className="s09-detail-dialog__wide"><dt>{tx('Thiết bị / Sản phẩm')}</dt><dd>{row.product}</dd></div>
            <div className="s09-detail-dialog__wide"><dt>{tx('Khách hàng')}</dt><dd>{row.maskedCustomer}</dd></div>
            <div><dt>{tx('Ngày tiếp nhận')}</dt><dd>{received}</dd></div>
            <div><dt>{tx('Hạn xử lý')}</dt><dd>{due}</dd></div>
            <div><dt>{tx('Trạng thái')}</dt><dd data-detail-field="status"><StatusBadge tone={tone}>{tx(status)}</StatusBadge>{dueStatus.length > 0 && <span className="s09-detail-dialog__due">{dueStatus.map(value => tx(value)).join(' · ')}</span>}</dd></div>
            <div><dt>{tx('Tuổi hồ sơ')}</dt><dd>{tx(row.ageAtSnapshot)}</dd></div>
          </dl>
        </section>
        <section aria-labelledby="s09-detail-history" data-detail-unavailable="timeline"><h3 id="s09-detail-history">{tx('Lịch sử xử lý')}</h3><p>{tx('Chưa có dữ liệu lịch sử xử lý cho hồ sơ này.')}</p></section>
        <section aria-labelledby="s09-detail-documents" data-detail-unavailable="related-documents"><h3 id="s09-detail-documents">{tx('Chứng từ / Phiếu xuất linh kiện liên quan')}</h3><p>{tx('Chưa có dữ liệu liên kết chứng từ hoặc phiếu xuất linh kiện cho hồ sơ này.')}</p></section>
      </div>
      <footer className="s09-detail-dialog__footer"><button type="button" className="hn-button hn-button--secondary" onClick={closeDialog}>{tx('Đóng')}</button></footer>
    </>}
  </dialog>;
}
