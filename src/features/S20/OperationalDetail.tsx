import type { MovementLedgerModel, MovementLedgerRow } from './movement-ledger-binding';

export interface MovementLedgerDetail {
  model: MovementLedgerModel;
  row: MovementLedgerRow;
  eventId: string;
  token: MovementLedgerModel['report']['token'];
}

/** Selection is bound to the rendered complete pin, never an ID looked up in a later model. */
export function selectMovementLedgerDetail(eventId: string, model: MovementLedgerModel | null, expectedModel: MovementLedgerModel | null): MovementLedgerDetail | null {
  if (!model || model !== expectedModel || !model.hasScenario || !model.report.complete) return null;
  const row = model.rows.find(item => item.event.id === eventId), token = model.report.token;
  if (!row || !token.epoch || row.event.data.scenarioId !== token.scenarioId || row.event.data.generation !== token.generation || !model.report.events.includes(row.event)) return null;
  return { model, row, eventId, token: { ...token } };
}

export function resolveMovementLedgerDetail(detail: MovementLedgerDetail | null, model: MovementLedgerModel | null): MovementLedgerRow | null {
  if (!detail || !model || detail.model !== model || !model.report.complete) return null;
  const current = model.report.token, pinned = detail.token;
  if (current.epoch !== pinned.epoch || current.revision !== pinned.revision || current.scenarioId !== pinned.scenarioId || current.generation !== pinned.generation) return null;
  const row = model.rows.find(item => item.event.id === detail.eventId);
  return row === detail.row && row.event.data.scenarioId === current.scenarioId && row.event.data.generation === current.generation ? row : null;
}
