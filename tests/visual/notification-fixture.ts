import type { BusinessNotification, NotificationLocalizedText } from '../../src/notifications/notification-feed';
const l = (vi:string,en:string,zh:string):NotificationLocalizedText => ({vi,en,'zh-CN':zh});
export const FIXED_NOW = '2026-10-25T05:00:00.000Z';
/** Approved artwork content, explicitly TEST ONLY. Never installed into the public repository. */
export function designFixture(): BusinessNotification[] {
  const names = [l('Phiếu xuất kho cần kiểm tra','Outbound slip needs review','出库单需要检查'),l('In nhãn chưa thành công','Label printing failed','标签打印失败'),l('Đối soát phát hiện chênh lệch','Reconciliation found a variance','对账发现差异'),l('Phiếu nhập kho đã hoàn tất','Goods receipt completed','入库单已完成'),l('Hồ sơ bảo hành được cập nhật','Warranty case updated','保修单已更新'),l('Xếp khay hoàn tất','Putaway completed','上架已完成')];
  const summaries=[l('PX-0021 · Đại lý Hoàng Minh','PX-0021 · Hoang Minh Dealer','PX-0021 · 黄明经销商'),l('LBH0012343 · Máy in kho A','LBH0012343 · Warehouse A printer','LBH0012343 · A库打印机'),l('Kho A · Cần kiểm tra số lượng','Warehouse A · Check quantity','A库 · 请检查数量'),l('PN-0042 · 24 sản phẩm','PN-0042 · 24 products','PN-0042 · 24件产品'),l('BH-0018 · Đang sửa chữa','BH-0018 · Under repair','BH-0018 · 维修中'),l('TRAY-0012 · Kho A','TRAY-0012 · Warehouse A','TRAY-0012 · A库')];
  const categories:BusinessNotification['category'][]=['outbound','printing','inventory','inbound','warranty','putaway'];
  const refs=['PX-0021','LBH0012343','Kho A','PN-0042','BH-0018','TRAY-0012'];
  const times=['2026-10-25T03:30:00Z','2026-10-25T02:45:00Z','2026-10-25T02:15:00Z','2026-10-25T01:40:00Z','2026-10-24T09:20:00Z','2026-10-24T07:05:00Z'];
  return names.map((title,i)=>({id:`QA-DESIGN-${i+1}`,kind:'business',category:categories[i],severity:i===1||i===2?'warning':i===3?'success':'info',titleKey:'outboundReadyTitle',bodyKey:'outboundReadyBody',createdAt:times[i],readAt:i===1||i===2?null:'2026-10-25T04:00:00Z',target:{href:`#/preview/S15?fixtureDocument=${refs[i]}`,labelKey:'openDocument',reference:refs[i]},presentation:{title,summary:summaries[i],body:i===0?l('Phiếu PX-0021 đang chờ kiểm tra thông tin trước khi tiếp tục xử lý. Vui lòng đối chiếu người nhận và danh sách hàng hóa.','Slip PX-0021 is awaiting review before processing continues. Please verify the recipient and item list.','出库单 PX-0021 正等待检查。请核对收货人和货物清单。'):summaries[i],categoryLabel:l(['Xuất kho','In nhãn','Đối soát','Nhập kho','Bảo hành','Xếp khay'][i],['Outbound','Printing','Reconciliation','Inbound','Warranty','Putaway'][i],['出库','打印','对账','入库','保修','上架'][i]),cardTitle:l('Thông tin phiếu xuất','Outbound slip information','出库单信息'),targetVerified:true,fields:i===0?[
    {label:l('Mã phiếu','Slip number','单据编号'),value:l('PX-0021','PX-0021','PX-0021')},
    {label:l('Người nhận','Recipient','收货人'),value:l('Đại lý Hoàng Minh','Hoang Minh Dealer','黄明经销商')},
    {label:l('Kho xuất','Warehouse','出库仓库'),value:l('Kho A','Warehouse A','A库')},
    {label:l('Số lượng','Quantity','数量'),value:l('12 sản phẩm','12 products','12件产品')},
    {label:l('Trạng thái','Status','状态'),value:l('Chờ kiểm tra','Awaiting review','待检查'),tone:'warning'},
  ]:[{label:l('Mã nghiệp vụ','Reference','业务编号'),value:l(refs[i],refs[i],refs[i])}]}}));
}
