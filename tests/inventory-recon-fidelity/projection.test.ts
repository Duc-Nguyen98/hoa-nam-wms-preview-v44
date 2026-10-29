import test from 'node:test';
import assert from 'node:assert/strict';
import {createInventoryDesignAdapter, type Box, type Sku} from '../../src/features/S16/approved/adapter';
import {availableLocations, knownCount, projectSku, resultKey, sumCounts, variance} from '../../src/features/S16/approved/projection';

test('unverified count stays unknown rather than becoming a zero physical count and false shortage',()=>{
 const row={actual:120,count:null};
 assert.equal(knownCount(row.count),false);assert.equal(variance(row),null);assert.equal(resultKey(row),'unknown');
 assert.equal(variance({actual:120,count:0}),-120);assert.equal(resultKey({actual:120,count:0}),'-1');
 assert.equal(knownCount(0),true);assert.equal(knownCount(NaN),false);assert.equal(knownCount(Infinity),false);assert.equal(knownCount(-Infinity),false);
 assert.equal(variance({actual:120,count:NaN}),null);assert.equal(resultKey({actual:120,count:Infinity}),'unknown');
});

test('known negative, zero and positive variance remain distinct at large safe quantities',()=>{
 assert.deepEqual([1199999998,1200000000,1201000000].map(count=>({delta:variance({actual:1200000000,count}),key:resultKey({actual:1200000000,count})})),[{delta:-2,key:'-1'},{delta:0,key:'0'},{delta:1000000,key:'1'}]);
 assert.equal(variance({actual:0,count:0}),0);assert.equal(resultKey({actual:0,count:0}),'0');
});

test('a partial BOX count makes its total unknown while explicit complete empty and zero remain zero',()=>{
 assert.equal(sumCounts([{count:18},{count:20},{count:null}]),null);
 assert.equal(sumCounts([{count:0},{count:0}]),0);
 assert.equal(sumCounts([]),0);
 assert.equal(sumCounts([{count:18},{count:20},{count:10}]),48);
 assert.equal(sumCounts([{count:NaN}]),null);
});

test('location projection keeps DRV actual/held/count scope and never mutates full SKU120',()=>{
 const a=createInventoryDesignAdapter();const drv=a.skus.find(r=>r.sku==='HN-DRV-001')!;
 const before=JSON.stringify(a);const scoped=projectSku(drv,a.boxes,'HN01','A01-09');
 assert.ok(scoped);assert.deepEqual([scoped.location,scoped.actual,scoped.held,scoped.count,scoped.unit],['A01-09',10,0,10,'Cái']);
 assert.equal(projectSku(drv,a.boxes,'HN02','A01-09'),null);
 assert.equal(projectSku(drv,a.boxes,'HN01','B02-01'),null);
 assert.deepEqual([drv.actual,drv.held,drv.count],[120,20,118]);assert.equal(JSON.stringify(a),before);
});

test('one uncounted selected BOX invalidates projected counted total without losing known actual or held',()=>{
 const a=createInventoryDesignAdapter();const drv=a.skus.find(r=>r.sku==='HN-DRV-001')!;
 const boxes:Box[]=a.boxes.map(b=>b.id==='BOX-001'?{...b,count:null}:b);
 const scoped=projectSku(drv,boxes,'HN01','A01-01');assert.ok(scoped);
 assert.deepEqual([scoped.actual,scoped.held,scoped.count,variance(scoped),resultKey(scoped)],[20,5,null,null,'unknown']);
 const other=projectSku(drv,boxes,'HN01','A01-02');assert.ok(other);assert.deepEqual([other.actual,other.count,variance(other)],[20,20,0]);
});

test('same location text cannot combine BOXes from a different SKU or warehouse',()=>{
 const a=createInventoryDesignAdapter();const drv=a.skus.find(r=>r.sku==='HN-DRV-001')!;
 const source=a.boxes[0];const boxes:Box[]=[source,{...source,id:'OTHER-WH',warehouse:'HN02',actual:999,count:999},{...source,id:'OTHER-SKU',sku:'HN-PSU-002',actual:888,count:888}];
 const scoped=projectSku(drv,boxes,'HN01',source.location);assert.ok(scoped);assert.deepEqual([scoped.actual,scoped.held,scoped.count],[20,5,18]);
});

test('known SKU location remains selectable without inventing BOX coverage or mixing units',()=>{
 const a=createInventoryDesignAdapter();const psu=a.skus.find(r=>r.sku==='HN-PSU-002')!;
 assert.equal(projectSku(psu,[],'HN01','A01-02'),psu);
 const wire:Sku={...a.skus.find(r=>r.sku==='HN-WIR-006')!,count:null};
 const projected=projectSku(wire,[],'HN01','A03-01');assert.ok(projected);assert.deepEqual([projected.actual,projected.held,projected.count,projected.unit],[1200,200,null,'Mét']);
 assert.deepEqual(availableLocations(a.skus,a.boxes,'HN02'),['B01-02','B02-01','B02-02']);
 assert.ok(!availableLocations(a.skus,a.boxes,'').includes('9 vị trí'));
 assert.ok(availableLocations(a.skus,a.boxes,'HN01').includes('A03-01'));
});
