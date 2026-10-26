import type { BusinessRepository, BusinessRepositoryOptions } from './business-repository';
import type { OperationalService, OperationalSurface } from '../contracts/operational-preview';
import { OPERATIONAL_ACTOR, OPERATIONAL_SURFACES, opFail, projectOperational, toBusinessOperational } from './operational-policy';
export function createOperationalService(surface:OperationalSurface,repository:()=>Promise<BusinessRepository>,authority:Pick<BusinessRepositoryOptions,'actor'|'captureAuthorityFence'>,enabled:boolean):OperationalService {
  function allowed(){if(!enabled||!authority.captureAuthorityFence||!authority.actor)return opFail('COMMAND_UNAVAILABLE',403);}
  return {
    async read(signal){
      allowed();const fence=authority.captureAuthorityFence!(),actor=await authority.actor!();
      if(!actor||actor.key!==OPERATIONAL_ACTOR||!actor.confirmed||actor.expiresAt<=Date.now())return opFail('MOCK_COMMAND_FORBIDDEN',403);
      const repo=await repository(),snapshot=await repo.read(signal),view=projectOperational(snapshot);
      const after=await authority.actor!(),latest=projectOperational(await repo.read(signal));fence();
      if(!after||after.key!==actor.key||!after.confirmed||after.expiresAt<=Date.now()||latest.epoch!==view.epoch||latest.token.scenarioId!==view.token.scenarioId||latest.token.generation!==view.token.generation)return opFail('STALE_SCENARIO');
      return view;
    },
    async execute(request,signal){allowed();if(OPERATIONAL_SURFACES[request.command]!==surface)return opFail('WRONG_COMMAND_SURFACE',403);return (await repository()).execute(toBusinessOperational(request),signal);},
  };
}
