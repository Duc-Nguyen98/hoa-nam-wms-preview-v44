import type { Line } from './adapter';

/** A draft can only project a stock change once every requested quantity is valid. */
export function validReversalQuantities(lines:readonly Line[]):boolean {
 return lines.length>0 && lines.every(l=>Number.isFinite(l.quantity)&&l.quantity>0&&l.quantity<=l.original-l.prior);
}
