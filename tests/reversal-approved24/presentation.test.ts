import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validReversalQuantities } from '../../src/features/S17/approved/presentation';
import { createReversalDesignAdapter } from '../../src/features/S17/approved/adapter';

test('projection requires each quantity to be finite, positive and within remaining stock',()=>{
 const lines=createReversalDesignAdapter().list().find(r=>r.id.endsWith('-007'))!.lines;
 assert.equal(validReversalQuantities(lines),true);
 for(const bad of [12,0,-1,NaN,Infinity]) assert.equal(validReversalQuantities([{...lines[0],quantity:bad},lines[1]]),false);
 assert.equal(validReversalQuantities([]),false);
});
