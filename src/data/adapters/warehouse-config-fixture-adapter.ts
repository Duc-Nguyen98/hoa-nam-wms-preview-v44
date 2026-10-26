import type { WarehouseConfigAdapter } from '../../contracts/warehouse-config';

/** Product default deliberately does not import or activate the wh-1 test record. */
export function createWarehouseConfigFixtureAdapter(): WarehouseConfigAdapter {
  return { read: () => ({ kind: 'source-unselected', message: 'Chưa có nguồn dữ liệu được xác nhận cho cấu hình kho. Thông tin kho chưa được tải; không thể chỉnh sửa hoặc lưu.' }) };
}
