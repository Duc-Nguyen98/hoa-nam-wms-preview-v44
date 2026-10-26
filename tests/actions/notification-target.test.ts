import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationTarget } from '../../src/notifications/notification-target';
import { createNotificationDesignSeed } from '../../src/preview-mock/notification-design-seed';
import { overviewDocumentHref } from '../../src/app/overview-document-route';

test('notification links distinguish list navigation from document identity', () => {
 const rows=createNotificationDesignSeed();
 assert.equal(notificationTarget(rows[0])?.labelKey,'openOutboundList');
 assert.equal(notificationTarget(rows[3])?.labelKey,'openReceiptList');
 const oldTray={...rows[5],target:{...rows[5].target,href:'#/preview/S14'}};
 const before=JSON.stringify(oldTray);
 assert.equal(notificationTarget(oldTray)?.href,'#/preview/S11');
 assert.equal(JSON.stringify(oldTray),before);
});
test('notification refuses mismatched, malformed or unverified targets', () => {
 const item=createNotificationDesignSeed()[0];
 for(const href of ['#/preview/S12','#/preview/S99','#/preview/S15?documentId=x','https://example.com']) {
  assert.equal(notificationTarget({...item,target:{...item.target,href}}),null);
 }
 assert.equal(notificationTarget({...item,presentation:{...item.presentation,targetVerified:false}}),null);
 const href=overviewDocumentHref({screen:'S15',source:'overview',documentId:'outbound-a',snapshotId:'snapshot-a'});
 assert.equal(notificationTarget({...item,target:{...item.target,href}})?.labelKey,'openDocument');
 assert.equal(notificationTarget({...item,target:{...item.target,href:href.replace('S15','S12')}}),null);
});
