import { useShellPreferences, localeForLanguage } from './shell-preferences';
import { useUiCopy } from '../i18n/use-ui-copy';
import { useId } from 'react';
import type { MouseEvent } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { useKeyboardFocusReveal } from './focus';

export interface CatalogueNavItem {
  key: string;
  label: string;
  /** Source-backed count, supplied by the caller; omitted preserves legacy markup. */
  count?: number;
  icon?: IconName;
  href?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  current?: boolean;
  unavailable?: boolean;
  unavailableDescription?: string;
}

export interface CatalogueNavTabsProps {
  label: string;
  items: readonly CatalogueNavItem[];
  className?: string;
}

/** Page navigation, not tab panels. Callers own destinations and unavailable feedback. */
export function CatalogueNavTabs({ label, items, className }: CatalogueNavTabsProps) {
  const tx = useUiCopy();
  const { language } = useShellPreferences();
  const id = useId();
  const revealKeyboardFocus = useKeyboardFocusReveal();
  return <nav className={['hn-catalogue-nav', className].filter(Boolean).join(' ')} aria-label={tx(label)} onFocusCapture={revealKeyboardFocus}>
    <ul>{items.map((item, index) => {
      const unavailableId = `${id}-${index}-unavailable`;
      const content = <>{item.icon && <Icon name={item.icon} size={18} />}<span className="hn-catalogue-nav-label">{tx(item.label)}</span>{item.count !== undefined && <>{' '}<span className="hn-catalogue-nav-count">{item.count.toLocaleString(localeForLanguage(language))}</span></>}{item.unavailable && <Icon name="lock" size={16} />}</>;
      const common = {
        className: 'hn-catalogue-nav-item',
        'aria-current': item.current ? 'page' as const : undefined,
        'aria-disabled': item.unavailable ? true : undefined,
        'aria-describedby': item.unavailable ? unavailableId : undefined,
        'data-unavailable': item.unavailable ? 'true' : undefined,
        onClick: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
          if (item.unavailable) event.preventDefault();
          item.onClick?.(event);
        },
      };
      return <li key={item.key}>
        {item.href && !item.unavailable
          ? <a {...common} href={item.href}>{content}</a>
          : <button {...common} type="button">{content}</button>}
        {item.unavailable && <span id={unavailableId} className="hn-sr-only">{tx(item.unavailableDescription ?? 'Chưa khả dụng.') }</span>}
      </li>;
    })}</ul>
  </nav>;
}
