import {apiClient} from '../../src/data/http/api-client';
import {initializeBrowserPreview} from '../../src/preview-mock/browser-runtime';
import {createOperationalWebAdapter,createOperationalQaAdapter,hasOperationalCommitProof} from '../../src/data/http/operational-preview-adapter';
import {createCatalogCreateAdapter} from '../../src/data/http/catalog-create-adapter';
import type {OperationalCommand,OperationalCommandName,OperationalPayloads} from '../../src/contracts/operational-preview';
export async function prepareReversalUi(){
 const runtime=initializeBrowserPreview()!,web=createOperationalWebAdapter(apiClient,{available:true,scope:'reversal-ui-prepare'}),qa=createOperationalQaAdapter(apiClient,{available:true,scope:'reversal-ui-prepare'}),catalog=await createCatalogCreateAdapter('sku',apiClient,{available:true}).readSnapshot();
 const request=async<C extends OperationalCommandName>(command:C,payload:OperationalPayloads[C],entityId?:string,expectedVersion?:number):Promise<OperationalCommand<C>>=>{const s=await web.read();return{commandId:crypto.randomUUID(),epoch:s.epoch,scenarioId:s.token.scenarioId,generation:s.token.generation,command,payload,...(entityId?{entityId,expectedVersion}:{})};};
 const run=async<C extends OperationalCommandName>(command:C,payload:OperationalPayloads[C],entityId?:string,expectedVersion?:number)=>{const adapter=command.startsWith('warranty.intake')?runtime.appEventAdapters!.P09:command.startsWith('parts.')?runtime.appEventAdapters!.P19:web,r=await request(command,payload,entityId,expectedVersion),result=await adapter.execute(r);if(!hasOperationalCommitProof(await adapter.read(),r,result))throw new Error('Missing commit proof');await adapter.recovery.acknowledge(r.commandId);return result;};
 const sku=catalog.skus.find(s=>s.code==='PUBLIC-DEMO-SKU-A')!;
 const intake=await run('warranty.intake',{identityMode:'TEMP_ONLY',skuId:sku.id,physicalId:null,customerReportedIssue:'Browser QA: unused spare parts return'});
 const diagnosed=await run('warranty.diagnose',{defectIds:[],technicianDiagnosis:'Two spare parts provided for inspection, unused.',expectedFinishDate:null},intake.receipt.entityId,intake.receipt.version);
 const issue=await run('parts.create',{caseId:intake.receipt.entityId,observedCaseVersion:diagnosed.receipt.version}),box=(await web.read()).boxes.find(b=>b.data.physicalCode==='PUBLIC-DEMO-BOX-0010')!;
 const saved=await run('parts.save',{lines:[{physicalCode:box.data.physicalCode,observedVersion:box.version,quantity:2}]},issue.receipt.entityId,issue.receipt.version);
 await run('parts.post',{issueId:issue.receipt.entityId},issue.receipt.entityId,saved.receipt.version);
 const reset=async()=>{const r=await request('scenario.reset-own',{confirmed:true,selectedSkuIds:catalog.skus.map(s=>s.id)});await qa.execute(r);await qa.recovery.acknowledge(r.commandId);};
 return{client:apiClient,web,reset,caseId:intake.receipt.entityId,issueId:issue.receipt.entityId};
}
