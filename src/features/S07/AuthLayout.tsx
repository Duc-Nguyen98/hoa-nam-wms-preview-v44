import type { ReactNode } from 'react';
import { Icon } from '../../shared/Icon';
import type { AuthCopy } from './auth-contract';

/** S07 composition, not a copied CMS shell. Shared extraction belongs to S00. */
export function AuthLayout({ copy, children }: { copy: AuthCopy; children: ReactNode }) {
  return <main id="main-content" className="s07-auth" tabIndex={-1}>
    <section className="s07-identity" aria-labelledby="s07-heading">
      <div className="s07-identity-art" aria-hidden="true" />
      <div className="s07-brand">
        <Icon name="brand" size={64} />
        <div><strong>{copy.brand}</strong><p>{copy.subtitle}</p></div>
      </div>
      <div className="s07-hero-copy">
        <div><h1 id="s07-heading">{copy.heading.map(line => <span key={line}>{line}</span>)}</h1><p>{copy.introduction}</p></div>
        <ul className="s07-pillars">{copy.pillars.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
    </section>
    <div className="s07-content">
      <div className="s07-form-region">{children}</div>
      <footer className="s07-footer">
        <div><strong>{copy.brand}</strong><p>{copy.footer}</p></div>
      </footer>
    </div>
  </main>;
}
