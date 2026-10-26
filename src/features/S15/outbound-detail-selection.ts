import type {OutboundSlipRow,OutboundSlipsModel} from '../../contracts/outbound-slips';

export interface OutboundDetailTarget {issueCode:string;sourceId:string}

/** Resolve on every accepted-model render. Never keep a detached row snapshot or
 * pick the first of duplicate identities, including after an adapter refresh. */
export function resolveOutboundDetail(model:OutboundSlipsModel|null,target:OutboundDetailTarget):OutboundSlipRow|null{
  if(!model||!target.sourceId||model.source.id!==target.sourceId)return null;
  const matches=model.rows.filter(row=>row.issueCode===target.issueCode);
  return matches.length===1?matches[0]:null;
}
