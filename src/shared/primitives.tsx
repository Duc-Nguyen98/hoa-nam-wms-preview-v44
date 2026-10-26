import { useUiCopy } from '../i18n/use-ui-copy';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Visual intent only; authorization and destructive policy stay with the caller. */
  tone?: 'default' | 'danger';
  /** Keeps the control focusable while an owner-controlled operation is pending. */
  loading?: boolean;
  /** Render a compact icon action. An accessible name is still required by the caller. */
  iconOnly?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Button({
  variant = 'primary', tone = 'default', loading = false, iconOnly = false,
  leadingIcon, trailingIcon, className = '', type = 'button', children,
  onClick, onClickCapture, 'aria-busy': ariaBusy, 'aria-disabled': ariaDisabled,
  ...props
}: ButtonProps) {
  const tx = useUiCopy();
  return <button
    {...props}
    type={type}
    className={`hn-button hn-button--${variant}${tone === 'danger' ? ' hn-button--danger' : ''} ${className}`}
    data-hn-control="button"
    data-tone={tone}
    data-icon-only={iconOnly || undefined}
    data-loading={loading || undefined}
    aria-busy={loading || ariaBusy}
    aria-disabled={loading || ariaDisabled}
    onClickCapture={event => {
      if (loading) { event.preventDefault(); event.stopPropagation(); return; }
      onClickCapture?.(event);
    }}
    onClick={event => {
      if (loading) { event.preventDefault(); event.stopPropagation(); return; }
      onClick?.(event);
    }}
  >
    {leadingIcon && <span className="hn-button__icon" aria-hidden="true">{leadingIcon}</span>}
    {tx(children)}
    {trailingIcon && <span className="hn-button__icon" aria-hidden="true">{trailingIcon}</span>}
    {loading && <span className="hn-button__loading-indicator" aria-hidden="true" />}
  </button>;
}

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Card({ title, description, children, className = '', ...props }: CardProps) {
  const tx = useUiCopy();
  return <section className={`hn-card ${className}`} {...props}>
    {(title || description) && <div className="hn-card__header">
      {title && <h2>{tx(title)}</h2>}
      {description && <p>{tx(description)}</p>}
    </div>}
    <div className="hn-card__body">{children}</div>
  </section>;
}

export type FeedbackProps = {
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  live?: boolean;
};

/** The caller supplies approved state text and actions; no business state is inferred here. */
export function Feedback({ tone = 'neutral', title, children, action, live = false }: FeedbackProps) {
  const tx = useUiCopy();
  return <div className={`hn-feedback hn-feedback--${tone}`} role={live ? (tone === 'error' ? 'alert' : 'status') : undefined}>
    <strong>{tx(title)}</strong>
    {children && <div className="hn-feedback__body">{children}</div>}
    {action && <div className="hn-feedback__action">{action}</div>}
  </div>;
}

/** Exported for a later approved device policy. Never mounted automatically by GlobalShell. */
export function PhoneNotice({ onCopyLink }: { onCopyLink: () => void }) {
  const tx = useUiCopy();
  return <main className="hn-phone-notice">
    <h1>{tx("Web quản trị chưa hỗ trợ trên điện thoại")}</h1>
    <p>{tx("Trong phiên bản này, vui lòng sử dụng máy tính hoặc tablet để truy cập hệ thống Hoa Nam.")}</p>
    <Button onClick={onCopyLink}>{tx("Sao chép liên kết")}</Button>
  </main>;
}
