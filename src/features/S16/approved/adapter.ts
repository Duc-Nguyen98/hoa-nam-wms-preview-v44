export type Scenario = 'ready' | 'loading' | 'empty' | 'no-results' | 'error' | 'forbidden' | 'not-found';
export interface Sku { readonly sku:string; readonly name:string; readonly warehouse:string; readonly location:string; readonly unit:string; readonly actual:number; readonly held:number; readonly count:number }
export interface Box { readonly id:string; readonly sku:string; readonly tray:string; readonly location:string; readonly warehouse:string; readonly actual:number; readonly held:number; readonly count:number }
export interface Snapshot { readonly id:string; readonly date:string; readonly rows:readonly Sku[]; readonly boxes:readonly Box[] }
export interface InventoryDesignAdapter { readonly skus:readonly Sku[]; readonly boxes:readonly Box[]; readonly snapshots:readonly Snapshot[]; readonly scenario:Scenario; readonly retry?:()=>Promise<Scenario> }
const data: Sku[] = [
 ['HN-DRV-001','Bộ điều khiển động cơ','HN01','9 vị trí','Cái',120,20,118],
 ['HN-PSU-002','Bộ nguồn 24V','HN01','A01-02','Cái',340,50,340],
 ['HN-SEN-003','Cảm biến quang','HN02','B02-01','Cái',500,80,503],
 ['HN-PCB-004','Bo mạch điều khiển','HN01','A02-03','Cái',215,35,213],
 ['HN-MTR-005','Mô tơ cửa','HN02','B01-02','Cái',90,10,90],
 ['HN-WIR-006','Dây tín hiệu','HN01','A03-01','Mét',1200,200,1205],
 ['HN-SWT-007','Công tắc hành trình','HN03','C01-01','Cái',450,70,449],
 ['HN-HMI-008','Màn hình điều khiển','HN02','B02-02','Cái',75,15,75],
 ['HN-FAN-009','Quạt tản nhiệt','HN03','C01-02','Cái',300,60,302],
].map(([sku,name,warehouse,location,unit,actual,held,count]) => Object.freeze({sku,name,warehouse,location,unit,actual,held,count}) as Sku);
const boxes:Box[] = Array.from({length:9},(_,i)=>{const n=String(i+1).padStart(3,'0'); const actual=i<3?20:10; const held=i<4?5:0; return Object.freeze({id:`BOX-${n}`,sku:'HN-DRV-001',tray:`KH-${n}`,location:`A01-${String(i+1).padStart(2,'0')}`,warehouse:'HN01',actual,held,count:actual-(i===0?2:0)});});
const snapshots:Snapshot[] = Array.from({length:9},(_,i)=>{const day=String(28-i).padStart(2,'0');return Object.freeze({id:`DS-202610${day}-01`,date:`2026-10-${day}`,rows:Object.freeze(data.map(row=>Object.freeze({...row}))),boxes:Object.freeze(boxes.map(box=>Object.freeze({...box})))});});
export function createInventoryDesignAdapter(scenario:Scenario='ready'):InventoryDesignAdapter { return Object.freeze({skus:Object.freeze(data),boxes:Object.freeze(boxes),snapshots:Object.freeze(snapshots),scenario}); }
