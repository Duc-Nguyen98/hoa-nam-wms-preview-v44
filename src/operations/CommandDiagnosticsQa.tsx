import { useState } from 'react';
import { Button } from '../shared';
import { clearCommandDiagnostics, commandDiagnosticsSnapshot, setCommandDiagnosticsEnabled } from '../data/command-diagnostics';

export function CommandDiagnosticsQa({ en }: { en: boolean }) {
  const [snapshot, setSnapshot] = useState(commandDiagnosticsSnapshot);
  const refresh = () => setSnapshot(commandDiagnosticsSnapshot());
  return <section aria-label={en ? 'Command diagnostics (QA)' : 'Chẩn đoán lệnh (QA)'}>
    <h2>{en ? 'Command diagnostics (QA)' : 'Chẩn đoán lệnh (QA)'}</h2>
    <p>{en ? 'Opt-in, per-tab memory only; reload clears records. Captures allowlisted command metadata and recovery phases, never payloads. A committed marker is not UI acceptance; acknowledged means durable removal and the final authority check passed.' : 'Tùy chọn bật, chỉ lưu trong bộ nhớ của tab; tải lại trang sẽ xóa. Chỉ ghi metadata lệnh được cho phép và các bước phục hồi, không ghi payload. Đánh dấu committed chưa có nghĩa giao diện đã chấp nhận; acknowledged nghĩa là đã xóa journal bền vững và qua kiểm tra quyền cuối.'}</p>
    <label><input type="checkbox" checked={snapshot.enabled} onChange={e => { setCommandDiagnosticsEnabled(e.target.checked); refresh(); }}/>{en ? 'Enable command trace in this tab' : 'Bật dấu vết lệnh trong tab này'}</label>
    <div className="op-actions"><Button onClick={refresh}>{en ? 'Refresh command trace' : 'Cập nhật dấu vết lệnh'}</Button><Button onClick={() => { clearCommandDiagnostics(); refresh(); }}>{en ? 'Clear command trace' : 'Xóa dấu vết lệnh'}</Button></div>
    <details><summary>{en ? 'Command trace' : 'Dấu vết lệnh'} ({snapshot.records.length})</summary><pre>{JSON.stringify(snapshot, null, 2)}</pre></details>
  </section>;
}
