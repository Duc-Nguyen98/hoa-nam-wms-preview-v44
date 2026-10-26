/** Display cap only. The repository retains the full unread count. */
export function notificationBadge(count: unknown): string {
  if (typeof count !== 'number' || !Number.isFinite(count) || count <= 0) return '';
  const total = Math.floor(count);
  return total >= 100 ? '99+' : total > 0 ? String(total) : '';
}
