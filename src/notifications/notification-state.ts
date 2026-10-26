import type { DemoNotification, NotificationPage, NotificationRepository } from '../preview-mock/notifications';

export type NotificationAction = { type: 'back' | 'read-all' | 'retry' | 'more' } | { type: 'open' | 'read' | 'unread'; id: string };

export interface NotificationStoreState {
  actorBinding: string | null;
  scenario: 'loading' | 'ready' | 'empty' | 'error';
  items: readonly DemoNotification[];
  selectedId: string | null;
  totalUnread: number | null;
  total: number;
  revision: number;
  limit: number;
  pending: boolean;
  error: boolean;
  refreshing?: boolean;
  stale?: boolean;
}
const emptyState = (actorBinding:string|null):NotificationStoreState => ({actorBinding,scenario:'loading',items:[],selectedId:null,totalUnread:null,total:0,revision:-1,limit:50,pending:false,error:false});
export function createNotificationStore(repository: () => NotificationRepository | undefined, notifyCommit: () => void = () => undefined) {
  let state = emptyState(null), generation = 0, readSequence = 0, pendingCommands = 0;
  const listeners = new Set<() => void>();
  const emit = (next:NotificationStoreState) => {state=next;listeners.forEach(listener=>listener());};
  function accept(page:NotificationPage) {
    if(page.revision < state.revision) return;
    emit({...state,items:page.items,total:page.total,totalUnread:page.totalUnread,revision:page.revision,limit:page.limit,scenario:page.total?'ready':'empty',error:false,stale:false});
  }
  const refresh = async (more = false) => {
    if(!state.actorBinding) return false;
    const epoch=generation, sequence=++readSequence, limit=more ? Math.min(10000,state.limit+50):state.limit;
    emit({...state,...(!state.items.length ? {scenario:'loading' as const}: {}),refreshing:true,error:false});
    try {
      const repo=repository(); if(!repo) throw new Error('Notification repository unavailable');
      const page=await repo.read(limit);
      if(epoch!==generation || sequence!==readSequence) return false;
      accept(page); return true;
    } catch {
      if(epoch===generation && sequence===readSequence) emit({...state,scenario:'error',error:true,stale:state.items.length>0});
      return false;
    } finally { if(epoch===generation && sequence===readSequence) emit({...state,refreshing:false}); }
  };
  const mark = async (id?:string, unread = false) => {
    if(!state.actorBinding) return false;
    const epoch=generation;
    pendingCommands++;
    emit({...state,pending:true,error:false});
    try {
      const repo=repository(); if(!repo) throw new Error('Notification repository unavailable');
      const commandId=globalThis.crypto.randomUUID();
      const page=id ? await (unread ? repo.markUnread(id,commandId,state.limit) : repo.markRead(id,commandId,state.limit)) : await repo.markAllRead(commandId,state.limit);
      if(epoch!==generation) return false;
      accept(page); notifyCommit(); return true;
    } catch {
      if(epoch===generation) emit({...state,error:true});
      return false;
    } finally {if(epoch===generation) {pendingCommands--;emit({...state,pending:pendingCommands>0});}}
  };
  return {
    getSnapshot:()=>state,
    subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
    bind(actorBinding:string|null){if(actorBinding===state.actorBinding)return;generation++;readSequence++;pendingCommands=0;emit(emptyState(actorBinding));if(actorBinding)void refresh();},
    refresh,mark,
    select(id:string){if(!state.items.some(item=>item.id===id))return false;emit({...state,selectedId:id});return true;},
    back(){emit({...state,selectedId:null});},
  };
}

export async function dispatchNotification(store: ReturnType<typeof createNotificationStore>, action: NotificationAction) {
  if (action.type === 'back') { store.back(); return true; }
  if (action.type === 'open') return store.select(action.id);
  if (action.type === 'read') return store.mark(action.id);
  if (action.type === 'unread') return store.mark(action.id, true);
  if (action.type === 'read-all') return store.mark();
  return store.refresh(action.type === 'more');
}

