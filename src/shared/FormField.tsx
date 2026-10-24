import { cloneElement, isValidElement, useId } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
}

/** Label, helper and validation composition. Field value/validation stays with the caller. */
export function FormField({ label, children, htmlFor, required = false, hint, error, className = '', ...props }: FormFieldProps) {
  const generatedId = useId();
  const childElement = isValidElement(children) ? children as ReactElement<Record<string, unknown>> : null;
  const childId = childElement && typeof childElement.props.id === 'string' ? childElement.props.id : undefined;
  const controlId = htmlFor ?? childId ?? generatedId;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  let control = children;
  if (childElement && typeof childElement.type !== 'symbol') {
    const element = childElement;
    const existing = typeof element.props['aria-describedby'] === 'string' ? element.props['aria-describedby'] : '';
    control = cloneElement(element, {
      id: element.props.id ?? controlId,
      'aria-describedby': [existing, describedBy].filter(Boolean).join(' ') || undefined,
      'aria-invalid': error ? true : element.props['aria-invalid'],
      'aria-required': required ? true : element.props['aria-required'],
    });
  }
  return <div {...props} className={`hn-form-field${error ? ' hn-form-field--error' : ''} ${className}`}>
    <label className="hn-form-field__label" htmlFor={controlId}>
      <span>{label}</span>{required && <span className="hn-form-field__required" aria-hidden="true">*</span>}
    </label>
    <div className="hn-form-field__control">{control}</div>
    {hint && <p className="hn-form-field__hint" id={hintId}>{hint}</p>}
    {error && <p className="hn-form-field__error" id={errorId} role="alert">{error}</p>}
  </div>;
}

