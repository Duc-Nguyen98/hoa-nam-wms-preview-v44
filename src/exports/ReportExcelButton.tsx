import { useEffect, useRef, useState } from 'react';
import { Button } from '../shared/primitives';
import { Icon } from '../shared/Icon';
import type { NoticeFeedback } from '../shared/Notice';
import { collectReport, exportErrorMessage } from './collect-report';
import type { ExportScreen } from './report-export-contract';
import { reportExportSuccessMessage, useReportCopy } from '../i18n/reports-copy';
import './report-export.css';

export function ReportExcelButton({ screen, query, expectedTotal, busy, onNotice }: {
  screen: ExportScreen; query: object | null; expectedTotal?: number; busy?: boolean;
  onNotice: (message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone']) => void;
}) {
  const tx = useReportCopy();
  const pending = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const queryKey = JSON.stringify(query);
  // Route/filter changes cancel the old request, including chunk loading and download.
  useEffect(() => { setLoading(false); setProgress(null); return () => { pending.current?.abort(); pending.current = null; }; }, [screen, queryKey]);
  async function download(origin: HTMLElement) {
    if (!query || busy || pending.current) return;
    const operation = new AbortController(); pending.current = operation;
    setLoading(true); setProgress(null);
    try {
      const data = await collectReport(screen, query, { signal: operation.signal, expectedTotal, translate: tx,
        onProgress: (loaded, total) => setProgress({ loaded, total }) });
      const { buildHoaNamWorkbook } = await import('./hoa-nam-xlsx');
      operation.signal.throwIfAborted();
      const bytes = buildHoaNamWorkbook({ ...data, translate: tx });
      operation.signal.throwIfAborted();
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      const timestamp = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(data.exportedAt).replace(/[^0-9]/g, '');
      link.href = url; link.download = `HoaNam_${screen}_${timestamp}.xlsx`; link.hidden = true;
      document.body.append(link);
      try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
      // Store canonical UI copy; each caller translates the same event at render time.
      onNotice(reportExportSuccessMessage(data.rows.length), origin, 'success');
    } catch (error) {
      if (!operation.signal.aborted) onNotice(exportErrorMessage(error), origin, 'error');
    } finally {
      if (pending.current === operation) { pending.current = null; setLoading(false); setProgress(null); }
    }
  }
  return <span className="hn-report-export">
    <Button variant="secondary" className="hn-report-export-button" leadingIcon={<Icon name="download" size={18} />} disabled={!query || busy} loading={loading}
      aria-label={tx('Xuất Excel')} title={tx('Xuất tất cả dòng theo kỳ và bộ lọc đang áp dụng')} onClick={event => void download(event.currentTarget)}>{tx(loading ? 'Đang xuất…' : 'Xuất Excel')}</Button>
    <span className="hn-sr-only" role="status" aria-live="polite">{loading ? progress ? tx('Đã đọc {loaded}/{total} dòng', progress) : tx('Đang lấy dữ liệu') : ''}</span>
  </span>;
}
