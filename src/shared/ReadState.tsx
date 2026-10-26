import type { ReactNode } from 'react';
import { PageState } from './PageState';

/** Use the approved full state for an initial read; preserve compact refresh feedback. */
export function ReadState({ loading, error, hasData, loadingText, errorText, action }: {
  loading: boolean; error?: string | null; hasData: boolean;
  loadingText: ReactNode; errorText: ReactNode; action?: ReactNode;
}) {
  if (hasData) return <>{loading && <p role="status">{loadingText}</p>}{error && <p role="alert">{errorText}</p>}</>;
  if (loading) return <PageState kind="loading" title={loadingText}/>;
  if (!error) return null;
  const kind=error==='SESSION_EXPIRED'?'unauthorized':['FORBIDDEN','MOCK_COMMAND_FORBIDDEN'].includes(error)?'forbidden':'error';
  return <PageState kind={kind} description={errorText} action={action}/>;
}
