import type { Line } from './adapter';

/** A draft can only project a stock change once every requested quantity is valid. */
export function validReversalQuantities(lines:readonly Line[]):boolean {
 return lines.length>0 && lines.every(l=>Number.isFinite(l.quantity)&&l.quantity>0&&l.quantity<=l.original-l.prior);
}

/** Never add quantities with different or unknown units into a labelled unit total. */
export function quantityGroups(lines:readonly Line[],value:(line:Line)=>number=line=>line.quantity):{unit:string|null;quantity:number}[]{
 const groups=new Map<string|null,number>();
 for(const line of lines){const unit=line.unit?.trim()||null;groups.set(unit,(groups.get(unit)??0)+value(line));}
 return [...groups].map(([unit,quantity])=>({unit,quantity}));
}
