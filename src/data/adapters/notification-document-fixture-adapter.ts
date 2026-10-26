import { createNotificationDesignSeed } from '../../preview-mock/notification-design-seed';
import type { BusinessNotification } from '../../notifications/notification-feed';
import { NOTIFICATION_DOCUMENT_BINDINGS, NOTIFICATION_DOCUMENT_SNAPSHOT, notificationDocumentTarget, notificationDocumentHref, type NotificationDocumentTarget } from '../../app/notification-document-route';

// These six immutable Preview records contain only the fields supplied with the
// approved notification data. No join to operational or overview records by code.
export function readNotificationSourceDocument(target:NotificationDocumentTarget|null) {
 if(!target||target.source!=='notification'||target.snapshotId!==NOTIFICATION_DOCUMENT_SNAPSHOT)return null;
 const index=NOTIFICATION_DOCUMENT_BINDINGS.findIndex(binding=>binding.recordId===target.recordId&&binding.notificationId===target.notificationId&&binding.screen===target.screen);
 if(index<0)return null;
 const item=createNotificationDesignSeed(0)[index],binding=NOTIFICATION_DOCUMENT_BINDINGS[index];
 return {...binding,fields:item.presentation!.fields!,title:item.presentation!.cardTitle!,description:item.presentation!.body!,categoryLabel:item.presentation!.categoryLabel!,snapshotId:NOTIFICATION_DOCUMENT_SNAPSHOT};
}
export function resolveNotificationSourceTarget(item:BusinessNotification) {
 // The isolated visual harness uses QA-DESIGN-N aliases so each browser run
 // can use a fresh IndexedDB namespace. Resolve those aliases only to the
 // corresponding approved source identity; the target and supplied fields
 // below still have to match the immutable snapshot exactly.
 const fixtureAlias=/^(?:QA-DESIGN|PREVIEW-DESIGN)-(\d+)$/.exec(item.id);
 const canonicalId=fixtureAlias?`PREVIEW-DESIGN-${fixtureAlias[1]}`:item.id;
 const binding=NOTIFICATION_DOCUMENT_BINDINGS.find(value=>value.notificationId===canonicalId&&value.category===item.category&&value.reference===item.target.reference);
 if(!binding||item.presentation?.targetVerified!==true)return null;
 const target=notificationDocumentTarget(binding),source=readNotificationSourceDocument(target)!;
 const href=notificationDocumentHref(target);
 const allowed=[href,`#/preview/${binding.screen}`,...(binding.screen==='S11'?['#/preview/S14']:[])];
 // Old persisted rows retain their read state. Only the exact known legacy
 // notification identity and supplied business fields receive a resolved link.
 if(!allowed.includes(item.target.href)||JSON.stringify(item.presentation.fields)!==JSON.stringify(source.fields))return null;
 return {href,labelKey:binding.labelKey};
}
