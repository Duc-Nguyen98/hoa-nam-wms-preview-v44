import test from 'node:test';
import assert from 'node:assert/strict';
import {readRoute,writeRoute,returnContexts,validHistoryDates,validMovementDate} from '../../src/features/S16/approved/navigation';
import {getBusinessDateWindow,validateBusinessDate,validateBusinessDateRange} from '../../src/shared/date-policy';

test('Vietnam midnight changes the accepted business date independently of UTC calendar day',()=>{
 const before=new Date('2026-10-28T16:59:59.999Z'),after=new Date('2026-10-28T17:00:00.000Z');
 assert.equal(getBusinessDateWindow({now:before}).today,'2026-10-28');
 assert.equal(getBusinessDateWindow({now:after}).today,'2026-10-29');
 assert.equal(validateBusinessDate('2026-10-29',{now:before}).valid,false);
 assert.equal(validateBusinessDate('2026-10-29',{now:after}).valid,true);
 const window=getBusinessDateWindow({now:after});assert.equal(window.minDate,'2026-07-31');
 assert.equal(validateBusinessDate('2026-07-31',{now:after}).valid,true);
 assert.equal(validateBusinessDate('2026-07-30',{now:after}).valid,false);
 assert.equal(validateBusinessDateRange({from:'2026-07-31',to:'2026-10-29'},{now:after}).valid,true);
 assert.equal(validateBusinessDateRange({from:'2026-10-29',to:'2026-07-31'},{now:after}).valid,false);
});

test('versioned inventory URL roundtrip preserves applied scope, dates, sort and page without auth changes',()=>{
 const calls:{method:string;url:string;state:unknown}[]=[];
 const prior=(globalThis as {window?:unknown}).window;
 const fake={location:{hash:'#/preview/S16?v=1&view=history&sku=HN-PSU-002&warehouse=HN01&location=A01-02&q=DS-20261027&result=0&from=2026-10-26&to=2026-10-28&date=2026-10-28&movementType=inbound&movementBox=BOX-004&movementQuery=NK-004&savedResult=-1&source=snapshot&tray=KH-004&page=2&sort=desc&snapshot=DS-20261027-01',pathname:'/',search:'?inventoryDesign=20261029'},history:{state:{existing:'preserved'},pushState(state:unknown,_unused:string,url:string){calls.push({method:'push',state,url});},replaceState(state:unknown,_unused:string,url:string){calls.push({method:'replace',state,url});}}};
 try{
  (globalThis as {window?:unknown}).window=fake;
  const route=readRoute();assert.deepEqual([route.view,route.query,route.location,route.from,route.to,route.page,route.sort],['history','DS-20261027','A01-02','2026-10-26','2026-10-28',2,true]);
  assert.deepEqual([route.warehouse,route.sku,route.tray,route.snapshot,route.source,route.savedResult],['HN01','HN-PSU-002','KH-004','DS-20261027-01','snapshot','-1']);
  assert.deepEqual([route.movementDate,route.movementType,route.movementBox,route.movementQuery],['2026-10-28','inbound','BOX-004','NK-004']);
  writeRoute(route,true);assert.equal(calls.length,1);assert.equal(calls[0].method,'push');assert.deepEqual(calls[0].state,{existing:'preserved'});
  assert.ok(calls[0].url.startsWith('/?inventoryDesign=20261029#/preview/S16?v=1&'));
  fake.location.hash=calls[0].url.slice(calls[0].url.indexOf('#'));assert.deepEqual(readRoute(),route);
  writeRoute(route);assert.equal(calls[1].method,'replace');
 }finally{if(prior===undefined)delete (globalThis as {window?:unknown}).window;else(globalThis as {window?:unknown}).window=prior;}
});

test('history/date deep links keep invalid values available for validation instead of silently clearing them',()=>{
 const prior=(globalThis as {window?:unknown}).window;
 try{
  (globalThis as {window?:unknown}).window={location:{hash:'#/preview/S16?view=history&from=2099-01-01&to=2099-01-02&date=2099-01-01'}};
  const route=readRoute();assert.equal(route.from,'2099-01-01');assert.equal(route.to,'2099-01-02');assert.equal(route.movementDate,'2099-01-01');
  assert.equal(validHistoryDates(route.from,route.to),false);assert.equal(validMovementDate(route.movementDate),false);
  const window=getBusinessDateWindow();assert.equal(validHistoryDates(window.minDate!,window.maxDate!),true);assert.equal(validHistoryDates(window.maxDate!,window.minDate!),false);
  assert.equal(validHistoryDates('',''),true);assert.equal(validHistoryDates('',window.maxDate!),false);assert.equal(validMovementDate(''),true);assert.equal(validMovementDate('2026-02-30'),false);
 }finally{if(prior===undefined)delete (globalThis as {window?:unknown}).window;else(globalThis as {window?:unknown}).window=prior;}
});

test('return context is accepted only under the registered navigation version',()=>{
 const prior=(globalThis as {window?:unknown}).window;
 try{
  (globalThis as {window?:unknown}).window={history:{state:{inventoryDesign:{version:0,contexts:{stock:{scroll:400}}}}}};
  assert.deepEqual(returnContexts(),{});
  const contexts={stock:{scroll:400,route:{view:'stock'}}};
  (globalThis as {window?:unknown}).window={history:{state:{inventoryDesign:{version:1,contexts}}}};
  assert.equal(returnContexts(),contexts);
 }finally{if(prior===undefined)delete (globalThis as {window?:unknown}).window;else(globalThis as {window?:unknown}).window=prior;}
});
