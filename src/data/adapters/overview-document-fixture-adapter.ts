import fixture from '../fixtures/S01_SCANNER_PINNED.json';
import type { OverviewDocumentTarget, OverviewSourceDocument } from '../../contracts/overview-document';

export const OVERVIEW_DOCUMENT_SNAPSHOT = `scanner:${fixture.source.commit}:${fixture.source.documentVersion}`;

/** Reads the same documents that supply S01, without joining another cohort by code. */
export function readOverviewSourceDocument(target: OverviewDocumentTarget | null): OverviewSourceDocument | null {
  if (!target || target.source !== 'overview' || target.snapshotId !== OVERVIEW_DOCUMENT_SNAPSHOT
    || !['S12', 'S15'].includes(target.screen)) return null;
  const matches = fixture.stockDocuments.filter(document => document.id === target.documentId);
  if (matches.length !== 1) return null;
  const document = matches[0];
  if (document.type !== (target.screen === 'S12' ? 'inbound' : 'outbound')
    || !['waiting', 'posted'].includes(document.status)) return null;
  return structuredClone({
    id: document.id, number: document.number, type: document.type as OverviewSourceDocument['type'],
    status: document.status as OverviewSourceDocument['status'], day: document.day, time: document.time,
    warehouse: document.warehouse, partner: document.partner, actor: document.actor, note: document.note,
    lines: document.lines.map(({ id, name, sku, quantity, unit, serialCount, serials }) => ({ id, name, sku, quantity, unit, serialCount, serials })),
    events: document.events,
    attachments: document.attachments.filter(attachment => attachment.url.startsWith('https://')),
  });
}
