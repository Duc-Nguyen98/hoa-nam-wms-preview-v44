export const QA_DATASET_QUERY = 'qa-dataset';
export const QA_DATASET_P05 = 'p05-v1' as const;
export type QaDataset = typeof QA_DATASET_P05;

export function parseQaDataset(search: string): QaDataset | null {
  const values = new URLSearchParams(search).getAll(QA_DATASET_QUERY);
  if (!values.length) return null;
  if (values.length !== 1 || values[0] !== QA_DATASET_P05) throw new Error('Unsupported or duplicate qa-dataset query.');
  return QA_DATASET_P05;
}

export function buildPreviewRoute(hash: string, search: string, appPreview: boolean): string {
  const params = new URLSearchParams(search);
  const dataset = parseQaDataset(search);
  params.delete('app-preview');
  params.delete(QA_DATASET_QUERY);
  if (dataset) params.set(QA_DATASET_QUERY, dataset);
  if (appPreview) params.set('app-preview', '1');
  const query = params.toString();
  // Keep an explicit empty query marker so hash-only links clear inherited
  // app-preview/dataset parameters instead of preserving window.location.search.
  return `?${query}${hash.startsWith('#') ? hash : `#${hash}`}`;
}
