import { useUiCopy } from '../i18n/use-ui-copy';
import { Button, Feedback } from './primitives';

/** Initial reads have no accepted data to preserve; never render a false empty table. */
export function InitialReadState({ label, loading, error, blocked, onRetry }: {
  label: string;
  loading: boolean;
  error?: unknown;
  blocked?: boolean;
  onRetry?: () => void;
}) {
  const tx = useUiCopy();
  const pending = loading || (!error && !blocked);
  return <Feedback live tone={pending ? 'neutral' : error ? 'error' : 'warning'}
    title={pending ? tx('Đang tải {label}…', { label: tx(label) }) : error ? tx('Chưa thể tải {label}', { label: tx(label) }) : tx('{label} hiện chưa khả dụng', { label: tx(label) })}
    action={!pending && onRetry ? <Button variant="secondary" onClick={onRetry}>{tx("Thử lại")}</Button> : undefined} />;
}
