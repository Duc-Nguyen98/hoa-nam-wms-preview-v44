import test from 'node:test';import assert from 'node:assert/strict';
import { auditFixture } from '../s27/fixture';
import { findSelectedReversal,type ReversalRecord } from '../../src/features/S17/reversal-binding';
test('S17 detail selection cannot follow an equal ID into another epoch, scenario or generation',()=>{
 const snapshot=auditFixture(0),row={id:'reversal:same-id',version:1} as ReversalRecord;snapshot.reversals=[row];
 const selection={id:row.id,fence:{...snapshot.token}};assert.equal(findSelectedReversal(snapshot,selection),row);
 for(const patch of [{epoch:'other'},{scenarioId:'scenario:other'},{generation:snapshot.token.generation+1}]){const changed={...snapshot,epoch:patch.epoch??snapshot.epoch,token:{...snapshot.token,...patch}};assert.equal(findSelectedReversal(changed,selection),null);}
 assert.equal(findSelectedReversal({...snapshot,reversals:[]},selection),null);assert.equal(findSelectedReversal(null,selection),null);
});
