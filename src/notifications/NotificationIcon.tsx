import { Icon } from '../shared/Icon';

/** Semantic notification glyphs use the same 24px canvas and 1.7px stroke as shared icons. */
export function NotificationIcon({ category, size = 24 }: { category: string; size?: number }) {
  const custom = category === 'clock' ? <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>
    : category === 'inventory' ? <><path d="M12 3v18M5 21h14M4 7h16M5 7l-3 8h6L5 7Zm14 0-3 8h6l-3-8Z" /><circle cx="12" cy="6" r="1" /></>
    : category === 'warranty' ? <path d="M15 3a6 6 0 0 0-7 7L3 17a2.8 2.8 0 0 0 4 4l7-6a6 6 0 0 0 7-7l-4 4-5-1-1-4 4-4Z" />
    : category === 'putaway' ? <><path d="M4 3v18M20 3v18M4 8h16M4 15h16M4 21h16M8 4h8v4H8zM7 11h5v4H7zM14 11h3v4h-3z" /></> : null;
  if (custom) return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{custom}</svg>;
  return <Icon name={category === 'inbound' ? 'box' : category === 'printing' ? 'alert-triangle' : category === 'system' ? 'settings' : 'documents'} size={size} aria-hidden="true" />;
}
