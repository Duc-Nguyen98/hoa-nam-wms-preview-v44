import test from 'node:test';
import assert from 'node:assert/strict';
import {createInventoryDesignAdapter} from '../../src/features/S16/approved/adapter';

const total=(rows:readonly {actual:number;held:number;count:number}[],key:'actual'|'held'|'count')=>rows.reduce((sum,row)=>sum+row[key],0);
test('approved nine-SKU scope has three match, three shortage and three surplus across HN01/HN02/HN03',()=>{
 const a=createInventoryDesignAdapter();assert.equal(a.skus.length,9);assert.equal(new Set(a.skus.map(x=>x.sku)).size,9);
 assert.deepEqual([...new Set(a.skus.map(x=>x.warehouse))].sort(),['HN01','HN02','HN03']);
 assert.deepEqual([-1,0,1].map(sign=>a.skus.filter(x=>Math.sign(x.count-x.actual)===sign).length),[3,3,3]);
 const wire=a.skus.find(x=>x.sku==='HN-WIR-006')!;assert.equal(wire.name,'Dây tín hiệu');assert.equal(wire.actual,1200);assert.equal(wire.held,200);assert.equal(wire.actual-wire.held,1000);
 for(const row of a.skus){assert.ok(row.unit);assert.ok(Number.isSafeInteger(row.actual)&&Number.isSafeInteger(row.held)&&Number.isSafeInteger(row.count));assert.ok(row.actual>=row.held&&row.held>=0&&row.count>=0);}
});
test('DRV nine BOX allocation, reservations and counts reconcile independently to 120/20/100 and 120/118/-2',()=>{
 const a=createInventoryDesignAdapter();const drv=a.skus.find(x=>x.sku==='HN-DRV-001')!;const boxes=a.boxes.filter(x=>x.sku===drv.sku);
 assert.equal(boxes.length,9);assert.equal(new Set(boxes.map(x=>x.id)).size,9);assert.equal(new Set(boxes.map(x=>x.location)).size,9);assert.equal(drv.location,'9 vị trí');
 const expected=[[20,5,18],[20,5,20],[20,5,20],[10,5,10],[10,0,10],[10,0,10],[10,0,10],[10,0,10],[10,0,10]];
 boxes.forEach((row,index)=>{assert.equal(row.id,`BOX-${String(index+1).padStart(3,'0')}`);assert.deepEqual([row.actual,row.held,row.count],expected[index]);assert.equal(row.warehouse,drv.warehouse);});
 assert.deepEqual([total(boxes,'actual'),total(boxes,'held'),total(boxes,'actual')-total(boxes,'held'),total(boxes,'count')],[120,20,100,118]);
 assert.deepEqual([drv.actual,drv.held,drv.actual-drv.held,drv.count],[120,20,100,118]);assert.equal(total(boxes,'count')-total(boxes,'actual'),-2);
});
test('each BOX belongs to an existing SKU; KH-001 contains exactly its one BOX',()=>{
 const a=createInventoryDesignAdapter();for(const box of a.boxes){assert.equal(a.skus.filter(x=>x.sku===box.sku).length,1);assert.ok(box.tray&&box.location);}
 const tray=a.boxes.filter(x=>x.tray==='KH-001');assert.equal(tray.length,1);assert.equal(tray[0].id,'BOX-001');assert.equal(new Set(tray.map(x=>x.sku)).size,1);
});
test('saved results own immutable rows and BOX copies; live and saved objects cannot silently alias or mutate',()=>{
 const a=createInventoryDesignAdapter();assert.equal(new Set(a.snapshots.map(x=>x.id)).size,a.snapshots.length);assert.ok(a.snapshots.length>0);
 for(const snapshot of a.snapshots){assert.match(snapshot.id,/^DS-\d{8}-\d+$/);assert.match(snapshot.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(Object.isFrozen(snapshot)&&Object.isFrozen(snapshot.rows)&&Object.isFrozen(snapshot.boxes));
  const drv=snapshot.rows.find(x=>x.sku==='HN-DRV-001')!;const boxes=snapshot.boxes.filter(x=>x.sku===drv.sku);assert.equal(total(boxes,'actual'),drv.actual);assert.equal(total(boxes,'count'),drv.count);
  snapshot.rows.forEach(row=>{assert.ok(Object.isFrozen(row));assert.notEqual(row,a.skus.find(x=>x.sku===row.sku));});snapshot.boxes.forEach(box=>{assert.ok(Object.isFrozen(box));assert.notEqual(box,a.boxes.find(x=>x.id===box.id));});
 }
 const before=JSON.stringify(a);assert.throws(()=>{(a.skus[0] as {actual:number}).actual=999});assert.throws(()=>{(a.snapshots[0].rows[0] as {count:number}).count=999});assert.equal(JSON.stringify(a),before);
});
test('allocation completeness is explicit, reconciles complete SKU quantities and remains pinned in saved results',()=>{
 const a=createInventoryDesignAdapter();assert.equal(new Set(a.allocationCoverage.map(x=>x.sku)).size,a.skus.length);
 assert.equal(a.allocationCoverage.find(x=>x.sku==='HN-PSU-002')?.status,'unavailable');
 const complete=a.allocationCoverage.filter(x=>x.status==='complete');assert.deepEqual(complete.map(x=>x.sku),['HN-DRV-001']);
 for(const coverage of complete){const row=a.skus.find(x=>x.sku===coverage.sku)!;const boxes=a.boxes.filter(x=>x.sku===coverage.sku);assert.deepEqual([total(boxes,'actual'),total(boxes,'held'),total(boxes,'count')],[row.actual,row.held,row.count]);}
 assert.ok(Object.isFrozen(a.allocationCoverage));for(const snapshot of a.snapshots){assert.ok(Object.isFrozen(snapshot.allocationCoverage));assert.deepEqual(snapshot.allocationCoverage,a.allocationCoverage);snapshot.allocationCoverage.forEach(row=>{assert.ok(Object.isFrozen(row));assert.notEqual(row,a.allocationCoverage.find(x=>x.sku===row.sku));});}
});
