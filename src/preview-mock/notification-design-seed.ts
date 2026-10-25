import type { BusinessNotification, NotificationLocalizedText } from '../notifications/notification-feed';

const l = (vi: string, en: string, zh: string): NotificationLocalizedText => ({ vi, en, 'zh-CN': zh });
type Field = NonNullable<NonNullable<BusinessNotification['presentation']>['fields']>[number];
const field = (label: NotificationLocalizedText, value: NotificationLocalizedText, tone?: Field['tone']): Field => ({ label, value, ...(tone ? { tone } : {}) });
const ref = (value: string) => field(l('Mã nghiệp vụ', 'Reference', '业务编号'), l(value, value, value));
const warehouse = field(l('Kho', 'Warehouse', '仓库'), l('Kho A', 'Warehouse A', 'A库'));
const status = (value: NotificationLocalizedText, tone: Field['tone']) => field(l('Trạng thái', 'Status', '状态'), value, tone);

/** User-approved Preview data. Seed once per actor; never reset persisted read state. */
export function createNotificationDesignSeed(now = Date.now()): BusinessNotification[] {
  // Anchor today/yesterday to the application's Asia/Bangkok business timezone,
  // independently of the browser/host timezone. QA injects its fixed clock.
  const day = new Date(now + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const midnight = Date.parse(`${day}T00:00:00+07:00`);
  const at = (minutes: number) => new Date(midnight + minutes * 60000).toISOString();
  const titles = [
    l('Phiếu xuất kho cần kiểm tra', 'Outbound slip needs review', '出库单需要检查'),
    l('In nhãn chưa thành công', 'Label printing failed', '标签打印失败'),
    l('Đối soát phát hiện chênh lệch', 'Reconciliation found a variance', '对账发现差异'),
    l('Phiếu nhập kho đã hoàn tất', 'Goods receipt completed', '入库单已完成'),
    l('Hồ sơ bảo hành được cập nhật', 'Warranty case updated', '保修单已更新'),
    l('Xếp khay hoàn tất', 'Putaway completed', '上架已完成'),
  ];
  const summaries = [
    l('PX-0021 · Đại lý Hoàng Minh', 'PX-0021 · Hoang Minh Dealer', 'PX-0021 · 黄明经销商'),
    l('LBH0012343 · Máy in kho A', 'LBH0012343 · Warehouse A printer', 'LBH0012343 · A库打印机'),
    l('Kho A · Cần kiểm tra số lượng', 'Warehouse A · Check quantity', 'A库 · 请检查数量'),
    l('PN-0042 · 24 sản phẩm', 'PN-0042 · 24 products', 'PN-0042 · 24件产品'),
    l('BH-0018 · Đang sửa chữa', 'BH-0018 · Under repair', 'BH-0018 · 维修中'),
    l('TRAY-0012 · Kho A', 'TRAY-0012 · Warehouse A', 'TRAY-0012 · A库'),
  ];
  const categoryLabels = [l('Xuất kho','Outbound','出库'), l('In nhãn','Printing','打印'), l('Đối soát','Reconciliation','对账'), l('Nhập kho','Inbound','入库'), l('Bảo hành','Warranty','保修'), l('Xếp khay','Putaway','上架')];
  const cardTitles = [l('Thông tin phiếu xuất','Outbound slip information','出库单信息'), l('Thông tin in nhãn','Label printing information','标签打印信息'), l('Thông tin đối soát','Reconciliation information','对账信息'), l('Thông tin phiếu nhập','Goods receipt information','入库单信息'), l('Thông tin bảo hành','Warranty information','保修信息'), l('Thông tin xếp khay','Putaway information','上架信息')];
  const fields: Field[][] = [
    [field(l('Mã phiếu','Slip number','单据编号'),l('PX-0021','PX-0021','PX-0021')),
      field(l('Người nhận','Recipient','收货人'),l('Đại lý Hoàng Minh','Hoang Minh Dealer','黄明经销商')),
      field(l('Kho xuất','Warehouse','出库仓库'),l('Kho A','Warehouse A','A库')),
      field(l('Số lượng','Quantity','数量'),l('12 sản phẩm','12 products','12件产品')),
      status(l('Chờ kiểm tra','Awaiting review','待检查'),'warning')],
    [ref('LBH0012343'), field(l('Máy in','Printer','打印机'),l('Máy in kho A','Warehouse A printer','A库打印机')), status(l('In chưa thành công','Printing failed','打印失败'),'warning')],
    [warehouse, field(l('Yêu cầu','Action required','待办事项'),l('Kiểm tra số lượng','Check quantity','检查数量')), status(l('Có chênh lệch','Variance detected','发现差异'),'warning')],
    [ref('PN-0042'), warehouse, field(l('Số lượng','Quantity','数量'),l('24 sản phẩm','24 products','24件产品')), status(l('Đã hoàn tất','Completed','已完成'),'success')],
    [ref('BH-0018'), status(l('Đang sửa chữa','Under repair','维修中'),'info')],
    [ref('TRAY-0012'), warehouse, status(l('Đã hoàn tất','Completed','已完成'),'success')],
  ];
  const categories: BusinessNotification['category'][] = ['outbound','printing','inventory','inbound','warranty','putaway'];
  const references = ['PX-0021','LBH0012343','Kho A','PN-0042','BH-0018','TRAY-0012'];
  // Supported screen routes, not fabricated document-selection query parameters.
  const screens = ['S15','S23','S16','S12','S09','S14'];
  const labels: BusinessNotification['target']['labelKey'][] = ['openDocument','openLabels','openInventory','openReceipt','openWarranty','openPutaway'];
  const minutes = [630,585,555,520,-460,-595];
  return titles.map((title, i) => ({
    id: `PREVIEW-DESIGN-${i + 1}`, kind: 'business', category: categories[i],
    severity: i === 1 || i === 2 ? 'warning' : i === 3 || i === 5 ? 'success' : 'info',
    titleKey: 'outboundReadyTitle', bodyKey: 'outboundReadyBody',
    createdAt: at(minutes[i]), readAt: i === 1 || i === 2 ? null : at(660),
    target: { href: `#/preview/${screens[i]}`, labelKey: labels[i], reference: references[i] },
    presentation: {
      title, summary: summaries[i], categoryLabel: categoryLabels[i], cardTitle: cardTitles[i],
      body: i === 0 ? l('Phiếu PX-0021 đang chờ kiểm tra thông tin trước khi tiếp tục xử lý. Vui lòng đối chiếu người nhận và danh sách hàng hóa.', 'Slip PX-0021 is awaiting review before processing continues. Please verify the recipient and item list.', '出库单 PX-0021 正等待检查。请核对收货人和货物清单。') : summaries[i],
      fields: fields[i], targetVerified: true,
    },
  }));
}
