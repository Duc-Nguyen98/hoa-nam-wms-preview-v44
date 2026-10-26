import type { BusinessNotification } from '../notifications/notification-feed';
export const NOTIFICATION_DOCUMENT_SNAPSHOT = 'notification-design-documents:2026-10-26:v1';
export const NOTIFICATION_DOCUMENT_BINDINGS = [
  {notificationId:'PREVIEW-DESIGN-1',recordId:'notification-document:outbound:0021',screen:'S15',category:'outbound',reference:'PX-0021',labelKey:'openDocument'},
  {notificationId:'PREVIEW-DESIGN-2',recordId:'notification-document:printing:0012343',screen:'S23',category:'printing',reference:'LBH0012343',labelKey:'openLabelRecord'},
  {notificationId:'PREVIEW-DESIGN-3',recordId:'notification-document:reconciliation:warehouse-a',screen:'S16',category:'inventory',reference:'Kho A',labelKey:'openReconciliation'},
  {notificationId:'PREVIEW-DESIGN-4',recordId:'notification-document:inbound:0042',screen:'S12',category:'inbound',reference:'PN-0042',labelKey:'openReceipt'},
  {notificationId:'PREVIEW-DESIGN-5',recordId:'notification-document:warranty:0018',screen:'S09',category:'warranty',reference:'BH-0018',labelKey:'openWarranty'},
  {notificationId:'PREVIEW-DESIGN-6',recordId:'notification-document:tray:0012',screen:'S11',category:'putaway',reference:'TRAY-0012',labelKey:'openTray'},
] as const satisfies readonly {notificationId:string;recordId:string;screen:string;category:BusinessNotification['category'];reference:string;labelKey:string}[];
export type NotificationDocumentBinding = typeof NOTIFICATION_DOCUMENT_BINDINGS[number];
export type NotificationDocumentTarget = Pick<NotificationDocumentBinding,'screen'> & {source:'notification';recordId:string;notificationId:string;snapshotId:string};
export interface NotificationDocumentSelection {screen:NotificationDocumentBinding['screen'];target:NotificationDocumentTarget|null}
export const notificationDocumentTarget = (binding:NotificationDocumentBinding):NotificationDocumentTarget => ({screen:binding.screen,source:'notification',recordId:binding.recordId,notificationId:binding.notificationId,snapshotId:NOTIFICATION_DOCUMENT_SNAPSHOT});
export function notificationDocumentHref(target:NotificationDocumentTarget) {
  return `#/preview/${target.screen}?${new URLSearchParams({source:target.source,recordId:target.recordId,notificationId:target.notificationId,snapshotId:target.snapshotId})}`;
}
export function resolveNotificationDocumentSelection(hash:string):NotificationDocumentSelection|null {
 const match=/^#\/preview\/(S09|S11|S12|S15|S16|S23)\?([^#]*)$/.exec(hash);if(!match)return null;
 const params=new URLSearchParams(match[2]);
 if(!params.has('recordId')&&!params.has('notificationId')&&!params.getAll('source').includes('notification'))return null;
 const screen=match[1] as NotificationDocumentBinding['screen'],keys=['source','recordId','notificationId','snapshotId'];
 const valid=[...params.keys()].every(key=>keys.includes(key))&&keys.every(key=>params.getAll(key).length===1&&!!params.get(key)&&params.get(key)!.length<=512)&&params.get('source')==='notification';
 return {screen,target:valid?{screen,source:'notification',recordId:params.get('recordId')!,notificationId:params.get('notificationId')!,snapshotId:params.get('snapshotId')!}:null};
}
