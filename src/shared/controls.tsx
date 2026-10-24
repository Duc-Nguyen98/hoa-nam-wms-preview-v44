import { useUiCopy } from '../i18n/use-ui-copy';
import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import './basic-select.css';

/** Native value/change/keyboard semantics, with the shared Basic presentation. */
export function BasicSelect({ className = '', onKeyDown, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`hn-basic-select ${className}`} {...props} onKeyDown={event => {
    // Escape belongs to an open picker before the surrounding filter disclosure.
    if (event.key === 'Escape' && event.currentTarget.matches(':open')) event.stopPropagation();
    onKeyDown?.(event);
  }} />;
}

export type FilterInputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: IconName };
export function FilterInput({ label, icon = 'search', className = '', id, ...props }: FilterInputProps) {
  const tx = useUiCopy();
  const generatedId = useId();
  return <label className={`hn-filter-input ${className}`} htmlFor={id ?? generatedId}><span className="hn-sr-only">{tx(label)}</span><Icon name={icon} /><input id={id ?? generatedId} {...props} /></label>;
}

export type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode };
export function FilterSelect({ label, children, className = '', id, ...props }: FilterSelectProps) {
  const tx = useUiCopy();
  const generatedId = useId();
  return <label className={`hn-filter-select hn-basic-field ${className}`} htmlFor={id ?? generatedId}><span>{tx(label)}</span><BasicSelect id={id ?? generatedId} {...props}>{children}</BasicSelect></label>;
}

/** Visual tone only; the calling view model owns the source label and business status mapping. */
export type StatusBadgeTone = 'success' | 'warning' | 'neutral' | 'error' | 'info';

export interface StatusBadgeProps {
  tone?: StatusBadgeTone;
  children: ReactNode;
  className?: string;
  /** Optional explicit name for badges whose visible label is not sufficient. */
  'aria-label'?: string;
}

export function StatusBadge({ tone = 'neutral', children, className = '', 'aria-label': ariaLabel }: StatusBadgeProps) {
  const tx = useUiCopy();
  return <span className={`hn-status-badge hn-status-badge--${tone} ${className}`} data-tone={tone} aria-label={tx(ariaLabel)}>{tx(children)}</span>;
}
