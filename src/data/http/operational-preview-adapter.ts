import type { AxiosInstance } from 'axios';
import type { OperationalCommand, OperationalOutcome, OperationalSnapshot } from '../../contracts/operational-preview';
import { apiClient, ApiRequestError } from './api-client';
import { API_VERSION, isRecord } from './api-contract';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';
import { createPreviewCommandRecovery } from '../../preview-mock/command-recovery-context';
import { OPERATIONAL_SURFACES } from '../../preview-mock/operational-policy';
export { isOperationalOutcome, hasOperationalCommitProof } from '../../preview-mock/operational-outcome';
import { isOperationalOutcome } from '../../preview-mock/operational-outcome';

function createAdapter(surface:'WEB'|'QA',client:AxiosInstance,options:{available?:boolean;scope?:string}) {
  const available=options.available??IS_BROWSER_PREVIEW;
  const assertAvailable=()=>{if(!available)throw new ApiRequestError('COMMAND_UNAVAILABLE','Luồng nghiệp vụ chưa khả dụng.',403);};
  const unwrap=(data:unknown)=>{if(!isRecord(data)||data.apiVersion!==API_VERSION||typeof data.requestId!=='string')throw new ApiRequestError('INVALID_RESPONSE','Phản hồi chưa hợp lệ.');return data.data;};
  const send=async(request:OperationalCommand):Promise<OperationalOutcome>=>{
    assertAvailable();if(OPERATIONAL_SURFACES[request.command]!==surface)throw new ApiRequestError('WRONG_COMMAND_SURFACE','Thao tác không thuộc giao diện này.',403);
    const result=unwrap((await client.post(surface==='QA'?'operations/scenario/commands':'operations/commands',request)).data);
    if(!isOperationalOutcome(result,request))throw new ApiRequestError('INVALID_RESPONSE','Chưa thể xác minh kết quả.');return result;
  };
  const journal=createPreviewCommandRecovery<OperationalCommand,OperationalOutcome>(client,{scope:`operations-v1:${surface}:${options.scope??'default'}`,diagnostics:{enabled:true,surface,scope:options.scope??'default'},send,validateOutcome:isOperationalOutcome,
    classifyFailure(error){const e=error as {code?:string;status?:number};return {code:e.code??'OPERATION_FAILED',definitive:!!e.status&&e.status>=400&&e.status<500&&![408,429].includes(e.status)&&e.code!=='INVALID_RESPONSE'};}});
  return {available,
    read:()=>{assertAvailable();return journal.readCurrent(async()=>{
      const value=unwrap((await client.get('operations/snapshot')).data);
      if(!isRecord(value)||value.mode!=='MOCK'||value.complete!==true||!isRecord(value.token)||value.token.epoch!==value.epoch||value.token.revision!==value.snapshotRevision||!Array.isArray(value.profiles)||!Array.isArray(value.receipts)||!Array.isArray(value.stockEvents))throw new ApiRequestError('INVALID_RESPONSE','Dữ liệu chưa đầy đủ.');
      return value as unknown as OperationalSnapshot;
    });},
    execute:(request:OperationalCommand)=>{assertAvailable();return journal.execute(structuredClone(request));},
    recovery:{restore:()=>journal.restore(),retry:()=>journal.retry(),acknowledge:(id:string)=>journal.acknowledge(id)},
  };
}
/** Preview-only; no production API contract or App command grant. */
export const createOperationalWebAdapter=(client:AxiosInstance=apiClient,options:{available?:boolean;scope?:string}={})=>createAdapter('WEB',client,options);
/** Bind only in QA/Build Metadata controls with explicit confirmation. */
export const createOperationalQaAdapter=(client:AxiosInstance=apiClient,options:{available?:boolean;scope?:string}={})=>createAdapter('QA',client,options);
