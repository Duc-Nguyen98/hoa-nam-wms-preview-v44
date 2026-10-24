import { useState } from 'react';
import { Button } from '../shared';
import { clearReadDiagnostics, readDiagnosticsSnapshot, setReadDiagnosticsEnabled } from '../data/read-diagnostics';
import { QaJsonDetails } from './QaJsonDetails';

export function ReadDiagnosticsQa({ en }: { en: boolean }) {
  const [snapshot, setSnapshot] = useState(readDiagnosticsSnapshot);
  const refresh = () => setSnapshot(readDiagnosticsSnapshot());
  return <section aria-label={en ? 'Read diagnostics (QA)' : 'Chẩn đoán đọc dữ liệu (QA)'}>
    <h2>{en ? 'Read diagnostics (QA)' : 'Chẩn đoán đọc dữ liệu (QA)'}</h2>
    <p>{en ? 'Enable, visit a screen in this tab, then return here and refresh the trace. Memory only; reload clears it. Records phases, timing and tab visibility; no business data or commands.' : 'Bật, mở màn cần kiểm tra trong cùng tab, rồi quay lại đây và cập nhật dấu vết. Chỉ giữ trong bộ nhớ; tải lại trang sẽ xóa. Ghi bước đọc, thời gian và trạng thái hiển thị tab; không ghi dữ liệu nghiệp vụ hay gửi lệnh.'}</p>
    <label><input type="checkbox" checked={snapshot.enabled} onChange={e => { setReadDiagnosticsEnabled(e.target.checked); refresh(); }}/>{en ? 'Enable read trace in this tab' : 'Bật dấu vết đọc trong tab này'}</label>
    <div className="op-actions"><Button onClick={refresh}>{en ? 'Refresh read trace' : 'Cập nhật dấu vết đọc'}</Button><Button onClick={() => { clearReadDiagnostics(); refresh(); }}>{en ? 'Clear read trace' : 'Xóa dấu vết đọc'}</Button></div>
    <QaJsonDetails label={`${en ? 'Read trace' : 'Dấu vết đọc'} (${snapshot.records.length})`} value={snapshot} scope="read-trace"/>
  </section>;
}
