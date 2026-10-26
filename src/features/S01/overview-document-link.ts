import type { OverviewModel, OverviewRow } from '../../contracts/overview';
import { overviewDocumentHref } from '../../app/overview-document-route';

export function acceptedOverviewDocumentHref(row: OverviewRow, source: OverviewModel['source'] | null): string | null {
  const target = row.documentTarget;
  if (!target || !source || source.provenance !== 'SOURCE_FIXTURE'
    || target.source !== 'overview' || target.snapshotId !== source.snapshotId || target.documentId !== row.id
    || target.screen !== (row.type === 'inbound' ? 'S12' : 'S15')) return null;
  return overviewDocumentHref(target);
}
