import type { OperationalCommand, OperationalCommandName, OperationalOutcome, OperationalPayloads, OperationalSnapshot } from '../contracts/operational-preview';
import type { CommandRecoveryResult } from '../data/command-recovery';
import { hasOperationalCommitProof } from '../preview-mock/operational-outcome';
export interface PreviewOperationAdapter {
  read():Promise<OperationalSnapshot>;execute(r:OperationalCommand):Promise<OperationalOutcome>;
  recovery:{restore():Promise<CommandRecoveryResult<OperationalCommand,OperationalOutcome>>;retry():Promise<CommandRecoveryResult<OperationalCommand,OperationalOutcome>>;acknowledge(id:string):Promise<void>};
}
export function createPreviewOperationController(adapter:PreviewOperationAdapter){
  let state:{snapshot:OperationalSnapshot|null;busy:boolean;error:string;pending:boolean;message:string}={snapshot:null,busy:false,error:'',pending:true,message:''};
  let active=true,revision=0;const listeners=new Set<()=>void>();const publish=(next:Partial<typeof state>)=>{state={...state,...next};listeners.forEach(fn=>fn());};
  async function run(action:(token:number)=>Promise<void>){if(!active||state.busy)return;const token=++revision;publish({busy:true,error:'',message:''});try{await action(token);}catch(e){if(active&&token===revision){const r=await adapter.recovery.restore().catch(()=>({kind:'blocked'}));if(!active||token!==revision)return;publish({snapshot:null,pending:r.kind!=='empty',error:(e as {code?:string}).code??'OPERATION_FAILED'});}}finally{if(active&&token===revision)publish({busy:false});}}
  async function accept(request:OperationalCommand,outcome:OperationalOutcome,token:number){const snapshot=await adapter.read();if(!active||token!==revision)return;if(!hasOperationalCommitProof(snapshot,request,outcome))throw Object.assign(new Error(),{code:'COMMIT_PROOF_REQUIRED'});await adapter.recovery.acknowledge(request.commandId);if(active&&token===revision)publish({snapshot,pending:false,message:request.command!=='scenario.reset-own'&&snapshot.token.scenarioId!==request.scenarioId?'ARCHIVED_VERIFIED':'COMMIT_VERIFIED'});}
  return{getSnapshot:()=>state,subscribe(fn:()=>void){listeners.add(fn);return()=>listeners.delete(fn);},
    resume(){active=true;return this.read();},suspend(){active=false;revision++;state={...state,busy:false};},
    read:()=>run(async token=>{const recovery=await adapter.recovery.restore(),snapshot=await adapter.read();if(active&&token===revision)publish({snapshot,pending:recovery.kind!=='empty',error:recovery.kind==='blocked'?recovery.code:''});}),
    reconcile:()=>run(async token=>{const r=await adapter.recovery.retry();if(r.kind==='committed')await accept(r.request,r.outcome,token);else if(r.kind==='blocked')throw Object.assign(new Error(),{code:r.code});else {const snapshot=await adapter.read();if(active&&token===revision)publish({snapshot,pending:r.kind!=='empty'});}}),
    execute:<C extends OperationalCommandName>(command:C,payload:OperationalPayloads[C],entityId?:string,expectedVersion?:number)=>run(async token=>{
      if(!state.snapshot||state.pending)throw Object.assign(new Error(),{code:'READ_OR_RECOVERY_REQUIRED'});
      const snapshot=state.snapshot,request:OperationalCommand<C>={command,commandId:crypto.randomUUID(),epoch:snapshot.epoch,scenarioId:snapshot.token.scenarioId,generation:snapshot.token.generation,payload,...(entityId?{entityId,expectedVersion}:{})};
      const outcome=await adapter.execute(request);await accept(request,outcome,token);
    }),
  };
}
