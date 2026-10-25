import { apiClient } from '../data/http/api-client';
import { installPreviewMock, type PreviewMockRuntime } from './index';
import { PUBLIC_DEMO_LOGIN } from './public-demo-login';
import { IS_BROWSER_PREVIEW } from '../preview-mode';
import { BUSINESS_STORAGE_NAMESPACE, createIndexedDbBusinessPersistence } from './business-persistence';
import { COMMAND_RECOVERY_NAMESPACE } from './command-recovery-context';
import { parseQaDataset, QA_DATASET_P05 } from './qa-dataset';
let runtime:PreviewMockRuntime|undefined;
/** Explicit separate App Preview entry on the same origin/store. Not an authorization boundary. */
export function initializeBrowserPreview(){
  if(IS_BROWSER_PREVIEW&&!runtime){
    const dataset=parseQaDataset(window.location.search);
    const isolated=dataset===QA_DATASET_P05;
    const businessNow = () => Date.parse('2026-10-25T14:24:00+07:00');
    runtime=installPreviewMock(apiClient,{approvedPreviewCommands:true,approvedNotificationDesignData:true,approvedOperationalQa:true,approvedInactiveMasterQa:isolated,credentialProfile:PUBLIC_DEMO_LOGIN,approvedAppEventFixture:true,businessNow,
      ...(isolated?{businessPersistence:createIndexedDbBusinessPersistence(`${BUSINESS_STORAGE_NAMESPACE}:qa-${dataset}`),recoveryPersistence:createIndexedDbBusinessPersistence(`${COMMAND_RECOVERY_NAMESPACE}:qa-${dataset}`)}:{businessPersistence:createIndexedDbBusinessPersistence(`${BUSINESS_STORAGE_NAMESPACE}:s27-design-v1`),recoveryPersistence:createIndexedDbBusinessPersistence(`${COMMAND_RECOVERY_NAMESPACE}:s27-design-v1`)})});
  }
  return runtime;
}
export const readBrowserPreviewRuntime=()=>runtime;
