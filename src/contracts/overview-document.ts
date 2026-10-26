/** A source-qualified document identity. A displayed number is never a join key. */
export interface OverviewDocumentTarget {
  screen: 'S12' | 'S15';
  source: 'overview';
  documentId: string;
  snapshotId: string;
}

export interface OverviewSourceDocument {
  id: string;
  number: string;
  type: 'inbound' | 'outbound';
  status: 'waiting' | 'posted';
  day: string;
  time: string;
  warehouse: string;
  partner: string;
  actor: string;
  note: string;
  lines: Array<{ id: string; name: string; sku: string; quantity: number; unit: string; serialCount: number; serials: string[] }>;
  events: Array<{ id: string; day: string; time: string; label: string; actor: string; description: string }> | null;
  attachments: Array<{ id: string; name: string; size: string; url: string }>;
}
