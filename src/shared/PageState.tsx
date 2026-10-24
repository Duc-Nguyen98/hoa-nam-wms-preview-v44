import { useUiCopy } from '../i18n/use-ui-copy';
import type { ReactNode } from 'react';
import { Button } from './primitives';

export type PageStateKind =
  | 'loading' | 'empty' | 'no-results' | 'error' | 'unauthorized' | 'forbidden'
  | 'not-found' | 'route-not-found' | 'record-not-found' | 'offline' | 'stale';

export interface PageStateProps {
  kind: PageStateKind;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const defaults: Record<PageStateKind, { title: string; description: string; tone: 'neutral' | 'warning' | 'error' }> = {
  loading: { title: 'Đang tải dữ liệu…', description: 'Vui lòng chờ trong giây lát.', tone: 'neutral' },
  empty: { title: 'Chưa có dữ liệu', description: 'Danh sách hiện chưa có bản ghi nào.', tone: 'neutral' },
  'no-results': { title: 'Không tìm thấy kết quả', description: 'Hãy đổi điều kiện lọc hoặc đặt lại bộ lọc.', tone: 'neutral' },
  error: { title: 'Chưa thể tải dữ liệu', description: 'Đã xảy ra lỗi khi đọc dữ liệu.', tone: 'error' },
  unauthorized: { title: 'Phiên đăng nhập đã hết hạn', description: 'Vui lòng đăng nhập lại để tiếp tục.', tone: 'warning' },
  forbidden: { title: 'Bạn không có quyền truy cập', description: 'Hãy liên hệ quản trị viên nếu bạn cần quyền này.', tone: 'warning' },
  'not-found': { title: 'Không tìm thấy nội dung', description: 'Nội dung yêu cầu không tồn tại hoặc đã được thay đổi.', tone: 'warning' },
  'route-not-found': { title: 'Không tìm thấy trang', description: 'Đường dẫn này không được đăng ký trong hệ thống.', tone: 'warning' },
  'record-not-found': { title: 'Không tìm thấy bản ghi', description: 'Bản ghi yêu cầu không tồn tại hoặc đã được thay đổi.', tone: 'warning' },
  offline: { title: 'Không có kết nối', description: 'Kiểm tra kết nối rồi thử lại.', tone: 'error' },
  stale: { title: 'Dữ liệu có thể đã cũ', description: 'Hãy làm mới để nhận dữ liệu mới nhất.', tone: 'warning' },
};

/** Shell-preserving state panel. It renders no business values or permission decisions. */
export function PageState({ kind, title, description, children, action, onRetry, retryLabel = 'Thử lại', className = '' }: PageStateProps) {
  const tx = useUiCopy();
  const fallback = defaults[kind];
  const retry = onRetry && kind !== 'loading' ? <Button variant="secondary" onClick={onRetry}>{tx(retryLabel)}</Button> : undefined;
  const content = action ?? retry;
  const live = kind === 'loading' ? 'polite' : kind === 'error' || kind === 'offline' ? 'assertive' : 'polite';
  return <section className={`hn-page-state hn-page-state--${kind} hn-page-state--${fallback.tone} ${className}`} data-state={kind} aria-busy={kind === 'loading' || undefined} aria-live={live} role={kind === 'error' || kind === 'offline' ? 'alert' : 'status'}>
    <div className="hn-page-state__content">
      <h2>{tx(title ?? fallback.title)}</h2>
      {(description || children) && <div className="hn-page-state__description">{tx(description ?? fallback.description)}{children}</div>}
      {content && <div className="hn-page-state__actions">{content}</div>}
    </div>
  </section>;
}

