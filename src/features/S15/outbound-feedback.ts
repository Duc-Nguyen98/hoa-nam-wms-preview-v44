import type { OutboundBindingState } from './outbound-binding';

type FeedbackState = Pick<OutboundBindingState, 'error' | 'failureStage' | 'pendingRequest'>;

export function outboundErrorMessage(state: FeedbackState) {
  const code = state.error;
  if (code === 'ARCHIVED_PROOF_UNAVAILABLE') return 'Chưa xác minh được bằng chứng của thao tác phiên cũ. Thao tác gốc được giữ lại.';
  if (code === 'OUTCOME_UNKNOWN' || (state.pendingRequest && (code.startsWith('RECOVERY_') || (state.failureStage && state.failureStage !== 'command')))) return 'Chưa xác định kết quả. Kiểm tra lại cùng thao tác trước khi gửi tiếp.';
  if (['COMMAND_UNAVAILABLE', 'SESSION_EXPIRED', 'MOCK_COMMAND_FORBIDDEN', 'CONFIRMATION_REQUIRED'].includes(code)) return 'Quyền thao tác hiện không khả dụng.';
  if (code.startsWith('RECOVERY_') || (state.failureStage && state.failureStage !== 'command')) return 'Chưa đọc được dữ liệu. Chọn Đọc lại dữ liệu để thử lại.';
  if (code.includes('STALE') || ['SUBMISSION_CHANGED', 'OUTBOUND_NOT_RECEIVABLE', 'OUTBOUND_NOT_POSTABLE', 'PHYSICAL_UNAVAILABLE', 'INSUFFICIENT_STOCK'].includes(code)) return 'Phiếu hoặc phiên đã thay đổi. Đóng xác nhận, đọc lại dữ liệu và kiểm tra phiếu trước khi thao tác lại.';
  if (code === 'APP_SUBMISSION_REQUIRED') return 'Chờ App quét và gửi đủ mã trước khi tiếp nhận.';
  return 'Không thể hoàn tất. Đọc lại dữ liệu và kiểm tra phiếu trước khi thử lại.';
}

export function outboundReadControls(state: Pick<OutboundBindingState, 'busy' | 'recovery' | 'pendingRequest'>) {
  const pending = state.recovery && state.pendingRequest !== null;
  return { readDisabled: state.busy || pending, showReconcile: pending };
}
