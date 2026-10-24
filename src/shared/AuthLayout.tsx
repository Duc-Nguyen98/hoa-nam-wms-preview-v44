import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import './auth-layout.css';

/**
 * Presentational copy for authentication-adjacent screens.
 *
 * This deliberately contains no session, permission, navigation or API state.
 * The screen that owns the card remains responsible for its controller and
 * fixture adapter; this component only provides the shared composition.
 */
export type AuthLayoutCopy = {
  brand: string;
  subtitle: string;
  heading: readonly string[];
  introduction: string;
  pillars: readonly string[];
  footer: string;
};

export type AuthLayoutVariant = 'stacked' | 'split-landscape';

export type AuthLayoutProps = {
  copy: AuthLayoutCopy;
  children: ReactNode;
  heroImageSrc?: string;
  variant?: AuthLayoutVariant;
  headingId?: string;
  id?: string;
  className?: string;
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

/**
 * Shared non-CMS composition for S07/S08-style screens.
 *
 * `split-landscape` is opt-in so the S07 approved single-column Tablet layout
 * remains unchanged. It splits only when there is landscape room; portrait
 * always uses the stacked/reflow composition.
 */
export function AuthLayout({
  copy,
  children,
  heroImageSrc,
  variant = 'stacked',
  headingId = 'hn-auth-heading',
  id = 'main-content',
  className,
}: AuthLayoutProps) {
  const heroStyle = heroImageSrc ? ({ '--hn-auth-hero-image': `url(${JSON.stringify(heroImageSrc)})` } as CSSProperties) : undefined;

  return (
    <main
      id={id}
      className={joinClassNames('hn-auth-layout', `hn-auth-layout--${variant}`, className)}
      tabIndex={-1}
    >
      <section className="hn-auth-layout__identity" aria-labelledby={headingId}>
        <div className="hn-auth-layout__hero-art" aria-hidden="true" style={heroStyle} />
        <div className="hn-auth-layout__brand">
          <Icon name="brand" size={44} />
          <div>
            <strong>{copy.brand}</strong>
            <p>{copy.subtitle}</p>
          </div>
        </div>
        <div className="hn-auth-layout__hero-copy">
          <div>
            <h1 id={headingId}>
              {copy.heading.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
            </h1>
            <p>{copy.introduction}</p>
          </div>
          {copy.pillars.length > 0 && (
            <ul className="hn-auth-layout__pillars">
              {copy.pillars.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ul>
          )}
        </div>
      </section>
      <div className="hn-auth-layout__content">
        <div className="hn-auth-layout__form-region">{children}</div>
        <footer className="hn-auth-layout__footer">
          <strong>{copy.brand}</strong>
          <p>{copy.footer}</p>
        </footer>
      </div>
    </main>
  );
}

