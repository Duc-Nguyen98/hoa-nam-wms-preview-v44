import type { DefectsCommandState } from './defects-command-service';
import { Button, Icon } from '../../shared';

export function defectsRecoveryMessage(code?: string) {
  if (code && /ACTOR|IDENTITY/.test(code)) return 'Thao tác đang chờ thuộc phiên người dùng khác. Đăng nhập lại đúng người dùng để kiểm tra; dữ liệu khôi phục chưa bị xóa.';
  if (code && /EPOCH/.test(code)) return 'Dữ liệu đã được đặt lại trong khi thao tác còn chờ. Kết quả cũ được giữ để đối chiếu; không gửi thành thao tác mới.';
  if (code && /SESSION|CONFIRM/.test(code)) return 'Cần đăng nhập và xác nhận lại phiên để kiểm tra thao tác cũ. Kết quả đang chờ vẫn được giữ.';
  if (code === 'MOCK_STORAGE_UNAVAILABLE' || code === 'RECOVERY_STORAGE_UNAVAILABLE') return 'Chưa thể truy cập bộ nhớ dữ liệu để kiểm tra thao tác cũ. Thao tác gốc được giữ để thử lại; không tạo thao tác mới.';
  if (code && (/FORBIDDEN|PERMISSION/.test(code) || code === 'COMMAND_UNAVAILABLE')) return 'Chưa thể kiểm tra thao tác cũ với quyền hiện tại. Kết quả đang chờ vẫn được giữ; không tạo thao tác mới.';
  if (code && /INVALID|CORRUPT|INTEGRITY/.test(code)) return 'Không thể xác minh dữ liệu khôi phục. Thao tác mới bị chặn và dữ liệu cũ được giữ nguyên.';
  return 'Chưa xác định được kết quả thao tác trước. Kiểm tra lại thao tác gốc trước khi tạo hoặc sửa hồ sơ khác.';
}

/** One recovery surface, rendered on the page or inside its existing form dialog. */
export function DefectsRecoveryPanel({ state, tx, refreshing, onRetry, onReload, onContinue, onView }: {
  state: DefectsCommandState;
  tx: (text: string) => string;
  refreshing: boolean;
  onRetry: () => void;
  onReload: () => void;
  onContinue: () => void;
  onView: () => void;
}) {
  const recovery = state.recovery;
  if (!recovery || recovery.kind === 'empty') return null;
  const busy = recovery.kind === 'loading' || recovery.kind === 'acknowledging' || state.phase === 'submitting';
  const committed = recovery.kind === 'committed';
  const request = recovery.kind === 'pending' ? recovery.request : null;
  const payload = request?.payload;
  const record = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as Record<string, unknown> : null;
  return <section className="df-recovery df-panel hn-premium-panel" aria-label={tx('Khôi phục thao tác đang chờ')}
    data-recovery-state={recovery.kind} data-recovery-read-verified={state.recoveryReadVerified} aria-busy={busy}>
    <h2><Icon name="info" width={18} height={18} />{tx('Khôi phục thao tác đang chờ')}</h2>
    <p role="status" aria-live="polite">{tx(busy ? 'Đang kiểm tra thao tác đã lưu. Chưa thể bắt đầu thao tác mới.'
      : committed ? state.recoveryReadVerified ? 'Đã xác nhận hồ sơ được lưu và đọc lại dữ liệu. Chọn tiếp tục để hoàn tất khôi phục.'
        : refreshing ? 'Đã xác nhận hồ sơ được lưu. Đang đọc lại dữ liệu; thao tác lưu sẽ không được gửi lại.'
          : 'Đã xác nhận hồ sơ được lưu nhưng chưa kiểm tra lại được danh sách. Chỉ tải lại dữ liệu; không gửi lại thao tác lưu.'
        : defectsRecoveryMessage(recovery.kind === 'pending' || recovery.kind === 'blocked' ? recovery.code : undefined))}</p>
    {request && <dl className="df-detail-fields">
      <div><dt>{tx('Thao tác')}</dt><dd>{tx(request.command === 'defects.create' ? 'Thêm lỗi / bệnh' : 'Sửa bản nháp')}</dd></div>
      {record && ['code', 'name', 'description', 'status'].filter(key => typeof record[key] === 'string').map(key => <div key={key}>
        <dt>{tx(({ code: 'Mã lỗi', name: 'Tên lỗi / bệnh', description: 'Mô tả', status: 'Trạng thái' } as Record<string, string>)[key])}</dt>
        <dd>{key === 'status' && (record[key] === 'active' || record[key] === 'inactive')
          ? tx(record[key] === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng') : String(record[key]) || '—'}</dd>
      </div>)}
    </dl>}
    {state.recoveryIssue && <p role="alert">{tx('Chưa thể hoàn tất khôi phục. Kết quả đã lưu vẫn được giữ; hãy thử tiếp tục lại.')}</p>}
    <div className="df-recovery-actions">
      {committed ? <>
        <Button type="button" variant="secondary" onClick={onView}>{tx('Xem hồ sơ đã lưu')}</Button>
        <Button type="button" variant="secondary" onClick={onReload} disabled={refreshing}>{tx('Tải lại danh sách')}</Button>
        <Button type="button" variant="primary" onClick={onContinue} disabled={!state.recoveryReadVerified || busy}>{tx('Tiếp tục')}</Button>
      </> : <Button type="button" variant="secondary" onClick={onRetry} disabled={busy}>{tx('Kiểm tra kết quả')}</Button>}
    </div>
  </section>;
}
