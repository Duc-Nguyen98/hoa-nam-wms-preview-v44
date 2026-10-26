import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationTarget } from '../../src/notifications/notification-target';
import { createNotificationDesignSeed } from '../../src/preview-mock/notification-design-seed';
import { overviewDocumentHref } from '../../src/app/overview-document-route';
import { NOTIFICATION_DOCUMENT_BINDINGS, notificationDocumentTarget, notificationDocumentHref, resolveNotificationDocumentSelection } from '../../src/app/notification-document-route';
import { readNotificationSourceDocument } from '../../src/data/adapters/notification-document-fixture-adapter';

test('all six notification links resolve only their exact source record', () => {
 const rows=createNotificationDesignSeed();
 for(const [index,binding] of NOTIFICATION_DOCUMENT_BINDINGS.entries()) {
  const target=notificationTarget(rows[index])!;
  assert.equal(target.labelKey,binding.labelKey);
  assert.equal(target.href,notificationDocumentHref(notificationDocumentTarget(binding)));
  const record=readNotificationSourceDocument(resolveNotificationDocumentSelection(target.href)!.target)!;
  assert.equal(record.recordId,binding.recordId);assert.equal(record.reference,rows[index].target.reference);
  assert.deepEqual(record.fields,rows[index].presentation!.fields);
 }
});
test('known persisted legacy links resolve exact records without mutating read state', () => {
 for(const [index,item] of createNotificationDesignSeed().entries()) {
  const binding=NOTIFICATION_DOCUMENT_BINDINGS[index];
  const old={...item,readAt:'2026-10-25T12:00:00.000Z',target:{...item.target,href:`#/preview/${index===5?'S14':binding.screen}`}};
  const before=JSON.stringify(old);
  assert.equal(notificationTarget(old)?.href,notificationDocumentHref(notificationDocumentTarget(binding)));
  assert.equal(JSON.stringify(old),before);
 }
});
test('notification refuses mismatched, malformed or unverified target identity', () => {
 const item=createNotificationDesignSeed()[0];
 for(const href of ['#/preview/S12','#/preview/S99','#/preview/S15?documentId=x','https://example.com',item.target.href.replace('PREVIEW-DESIGN-1','PREVIEW-DESIGN-2')]) {
  assert.equal(notificationTarget({...item,target:{...item.target,href}}),null);
 }
 assert.equal(notificationTarget({...item,presentation:{...item.presentation,targetVerified:false}}),null);
 assert.equal(notificationTarget({...item,target:{...item.target,reference:'PX-9999'}}),null);
 assert.equal(notificationTarget({...item,presentation:{...item.presentation,fields:[]}}),null);
 assert.equal(notificationTarget({...item,id:'unrelated-record'}),null);
});
test('malformed notification queries fail closed and source lookup checks every identity dimension', () => {
 const target=notificationDocumentTarget(NOTIFICATION_DOCUMENT_BINDINGS[0]);
 const href=notificationDocumentHref(target);
 for(const query of [href+'&recordId=duplicate',href+'&extra=bad',href.replace('source=notification','source=overview'),href.replace(/&snapshotId=[^&]+/,''),href.replace(/recordId=[^&]+/,'recordId=')]) {
  assert.equal(resolveNotificationDocumentSelection(query)?.target,null);
 }
 for(const wrong of [{recordId:'missing'},{notificationId:'PREVIEW-DESIGN-2'},{snapshotId:'missing'},{screen:'S12' as const}])assert.equal(readNotificationSourceDocument({...target,...wrong}),null);
 assert.equal(resolveNotificationDocumentSelection('#/preview/S15'),null);
});
test('other notifications retain supported list and overview document routes', () => {
 const item={...createNotificationDesignSeed()[0],id:'other-notification'};
 assert.equal(notificationTarget({...item,target:{...item.target,href:'#/preview/S15'}})?.labelKey,'openOutboundList');
 const href=overviewDocumentHref({screen:'S15',source:'overview',documentId:'outbound-a',snapshotId:'snapshot-a'});
 assert.equal(notificationTarget({...item,target:{...item.target,href}})?.labelKey,'openDocument');
 assert.equal(notificationTarget({...item,target:{...item.target,href:href.replace('S15','S12')}}),null);
});
