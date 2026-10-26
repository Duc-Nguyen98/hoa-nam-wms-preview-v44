import { useUiCopy } from '../i18n/use-ui-copy';
import { PageState } from './PageState';

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
  return <PageState kind={pending ? 'loading' : error ? 'error' : 'stale'}
    title={pending ? tx('Đang tải {label}…', { label: tx(label) }) : error ? tx('Chưa thể tải {label}', { label: tx(label) }) : tx('{label} hiện chưa khả dụng', { label: tx(label) })}
    onRetry={!pending ? onRetry : undefined} />;
}
