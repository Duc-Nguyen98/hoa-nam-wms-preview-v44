import type { OverviewDocumentTarget } from '../contracts/overview-document';

export interface OverviewDocumentSelection {
  screen: OverviewDocumentTarget['screen'];
  /** Invalid, duplicated or incomplete identity stays unavailable at the destination. */
  target: OverviewDocumentTarget | null;
}

export function overviewDocumentHref(target: OverviewDocumentTarget): string {
  const params = new URLSearchParams({ source: target.source, documentId: target.documentId, snapshotId: target.snapshotId });
  return `#/preview/${target.screen}?${params}`;
}

export function resolveOverviewDocumentSelection(hash: string): OverviewDocumentSelection | null {
  const match = /^#\/preview\/(S12|S15)\?([^#]*)$/.exec(hash);
  if (!match) return null;
  const screen = match[1] as OverviewDocumentTarget['screen'];
  const params = new URLSearchParams(match[2]);
  const keys = ['source', 'documentId', 'snapshotId'];
  const valid = [...params.keys()].every(key => keys.includes(key))
    && keys.every(key => params.getAll(key).length === 1 && !!params.get(key) && params.get(key)!.length <= 512)
    && params.get('source') === 'overview';
  return { screen, target: valid ? { screen, source: 'overview', documentId: params.get('documentId')!, snapshotId: params.get('snapshotId')! } : null };
}
