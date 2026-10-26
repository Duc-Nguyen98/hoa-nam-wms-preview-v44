import { useReportCopy } from '../../i18n/reports-copy';
/** Feedback for the existing read lifecycle; never adds a delay or a data state. */
export function WarrantyPartsReadStatus({ loading, hasSnapshot }: { loading: boolean; hasSnapshot: boolean }) {
  const tx = useReportCopy();
  return <span className="s22-read-status" role="status" aria-atomic="true">
    {tx(hasSnapshot ? (loading ? 'Đang đọc kỳ mới…' : 'Số liệu tổng hợp toàn kỳ') : '')}
  </span>;
}
