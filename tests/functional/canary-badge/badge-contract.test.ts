import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationBadge} from '../../../src/notifications/notification-badge';
for(const [count,expected] of [[0,''],[1,'1'],[9,'9'],[10,'10'],[99,'99'],[100,'99+'],[999,'99+']] as const)test(`F-CANARY-CONTRACT-${count}: ${expected||'hidden'}`,()=>assert.equal(notificationBadge(count),expected));
