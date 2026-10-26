import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon } from '../shared/Icon';
import { notificationBadge } from './notification-badge';

type NotificationBellProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  label: string;
  unread: number | null | undefined;
  qa?: boolean;
};

/** Main and isolated QA share the same button, icon, badge and accessible count. */
export const NotificationBell = forwardRef<HTMLButtonElement, NotificationBellProps>(function NotificationBell({ label, unread, qa, className = '', ...props }, ref) {
  const badge = notificationBadge(unread);
  const known = typeof unread === 'number' && Number.isFinite(unread) && unread >= 0;
  return <button {...props} ref={ref} type="button" className={`hn-icon-button hn-notifications ${className}`.trim()} aria-label={known ? `${label} · ${unread}` : label}>
    <Icon name="bell" />
    {badge && <span className="hn-notifications__count" aria-hidden="true" data-preview-bell-unread={qa ? undefined : unread} data-qa-badge={qa || undefined}>{badge}</span>}
  </button>;
});
