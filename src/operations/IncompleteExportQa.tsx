import { useState } from 'react';
import type { OperationalSnapshot } from '../contracts/operational-preview';
import { Button } from '../shared';
import { inspectIncompleteExport } from './incomplete-export-qa';
import type { OperationalReportQuery } from './operational-reports';

export function IncompleteExportQa({ snapshot, query, en }: { snapshot: OperationalSnapshot | null; query: OperationalReportQuery; en: boolean }) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof inspectIncompleteExport>> | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function inspect() {
    if (!snapshot || busy) return;
    setBusy(true); setResult(null); setError('');
    try { setResult(await inspectIncompleteExport(snapshot, query)); }
    catch (e) { setError((e as { code?: string }).code ?? 'QA_READ_FAILED'); }
    finally { setBusy(false); }
  }
  return <fieldset><legend>{en ? 'Incomplete export check · Preview Mock QA' : 'Kiểm tra chặn xuất thiếu dữ liệu · Preview Mock QA'}</legend>
    <p>{en ? 'This read-only probe changes only the completeness flag in a copy. All rows, IDs and the snapshot token are retained. Stored data and the normal pinned report stay unchanged.' : 'Phép thử chỉ đọc, đổi duy nhất cờ đầy đủ trong bản sao. Giữ toàn bộ dòng, ID và token snapshot. Dữ liệu đã lưu và báo cáo đang chốt không thay đổi.'}</p>
    <Button disabled={!snapshot || busy} onClick={() => void inspect()}>{en ? 'Check incomplete export refusal' : 'Kiểm tra từ chối xuất chưa đầy đủ'}</Button>
    {busy && <p role="status">{en ? 'Checking…' : 'Đang kiểm tra…'}</p>}
    {error && <p role="alert">{en ? 'The diagnostic could not be verified.' : 'Chưa xác minh được phép kiểm tra.'} <code>{error}</code></p>}
    {result && <><p role="status">{en ? 'The source and export guards refused the probe. No workbook was created. This is not E2E acceptance.' : 'Bước chốt và bước xuất đều từ chối phép thử. Không tạo tệp Excel. Đây chưa phải nghiệm thu E2E.'}</p><pre aria-label={en ? 'Incomplete export observation' : 'Kết quả kiểm tra xuất chưa đầy đủ'}>{JSON.stringify(result, null, 2)}</pre></>}
  </fieldset>;
}
