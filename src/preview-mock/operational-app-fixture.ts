import type { AxiosInstance } from 'axios';
import type { OperationalCommand, OperationalOutcome, OperationalService } from '../contracts/operational-preview';
import { createPreviewCommandRecovery } from './command-recovery-context';
import { isOperationalOutcome } from './operational-outcome';
/** Fixed P04 Preview event adapter; no network route and no Web scan control.
 * Explicit opt-in at installPreviewMock; account/session still supplies authority. */
export function createOperationalAppFixture(client:AxiosInstance,service:OperationalService,surface:'APP_P04'|'APP_P05'|'APP_P09'|'APP_P19'='APP_P04'){
  const journal=createPreviewCommandRecovery<OperationalCommand,OperationalOutcome>(client,{scope:'operations-v1:'+surface,send:r=>service.execute(r),validateOutcome:isOperationalOutcome,
    classifyFailure(error){const e=error as {code?:string;status?:number};return {code:e.code??'OPERATION_FAILED',definitive:!!e.status&&e.status>=400&&e.status<500&&![408,429].includes(e.status)};}});
  return {surface,inputMethod:'MANUAL_PREVIEW' as const,read:()=>service.read(),execute:(request:OperationalCommand)=>journal.execute(structuredClone(request)),
    recovery:{restore:()=>journal.restore(),retry:()=>journal.retry(),acknowledge:(commandId:string)=>journal.acknowledge(commandId)}};
}
