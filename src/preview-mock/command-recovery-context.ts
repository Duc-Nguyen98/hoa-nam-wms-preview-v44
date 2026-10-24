import type { AxiosInstance } from 'axios';
import { createCommandRecovery, type CommandRecoveryOptions, type RecoverableCommand } from '../data/command-recovery';
import type { BusinessActor } from './business-repository';
import type { BusinessPersistence } from './business-persistence';

export const COMMAND_RECOVERY_NAMESPACE = 'hoa-nam-wms-preview-command-recovery-v1';
export interface PreviewCommandRecoveryContext {
  persistence: BusinessPersistence;
  actor: () => Promise<BusinessActor | null>;
  epoch: () => Promise<string>;
  captureReadFence?: () => () => void;
}
const contexts = new WeakMap<AxiosInstance, PreviewCommandRecoveryContext>();
/** Installation is separate from command authority; this creates no grants. */
export function registerPreviewCommandRecovery(client: AxiosInstance, context: PreviewCommandRecoveryContext) {
  contexts.set(client, context);
  return () => { if (contexts.get(client) === context) contexts.delete(client); };
}
/** Resolve lazily: module-level HTTP adapters are created before Main installs
 * its preview transport. Never use a display role or a caller's actor field. */
export function createPreviewCommandRecovery<R extends RecoverableCommand, O>(client: AxiosInstance,
  options: Pick<CommandRecoveryOptions<R, O>, 'scope' | 'send' | 'validateOutcome' | 'classifyFailure' | 'diagnostics'>) {
  const context = () => {
    const value = contexts.get(client);
    if (!value) throw Object.assign(new Error('Preview command recovery unavailable'), { code: 'RECOVERY_CONTEXT_UNAVAILABLE' });
    return value;
  };
  return createCommandRecovery<R, O>({ ...options,
    persistence: { transact: (change, signal) => context().persistence.transact(change, signal) },
    actor: () => context().actor(), epoch: () => context().epoch(),
    captureReadFence: () => {
      const installed = context();
      if (!installed.captureReadFence) throw Object.assign(new Error('Read authority unavailable'), { code: 'RECOVERY_CONTEXT_UNAVAILABLE' });
      const assertCurrent = installed.captureReadFence();
      return () => {
        if (context() !== installed) throw Object.assign(new Error('Recovery context changed'), { code: 'RECOVERY_CONTEXT_UNAVAILABLE' });
        assertCurrent();
      };
    },
  });
}
