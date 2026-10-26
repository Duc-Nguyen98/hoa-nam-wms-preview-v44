/** Owner Option A; exact disposable IDs bound by independently reviewed Create receipts.
 * Source: INACTIVE-MASTER-BOUND-ALLOWLIST-2026-10-21.json (752a5858...).
 * No browser-supplied allowlist, receipt, or generic update capability. */
export const INACTIVE_MASTER_SCOPE = {
  "dataset": "p05-v1",
  "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
  "scenarioId": "scenario:7850c497-3da8-4818-be11-248d7ee94148",
  "generation": 1,
  "actorKey": "preview:ducquang"
} as const;
export const INACTIVE_MASTER_ALLOWLIST = [
  {
    "kind": "catalog-product-v1",
    "entityId": "preview-product:7ec40c8f-f744-4297-9128-2affe9eae980",
    "originalCreateCommandId": "bef88277-ea24-4175-8ad2-ce1841980ee0",
    "originalRequest": {
      "command": "products.create",
      "commandId": "bef88277-ea24-4175-8ad2-ce1841980ee0",
      "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
      "payload": {
        "code": "QA-IM-P-20261021",
        "group": "Linh kiện điện",
        "name": "QA Inactive Product 20261021",
        "status": "active",
        "unit": "Cái"
      }
    },
    "originalReceipt": {
      "mode": "MOCK",
      "commandId": "bef88277-ea24-4175-8ad2-ce1841980ee0",
      "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
      "command": "products.create",
      "actorKey": "preview:ducquang",
      "entityId": "preview-product:7ec40c8f-f744-4297-9128-2affe9eae980",
      "previousVersion": null,
      "version": 1,
      "changed": true,
      "committedAt": "2026-10-21T11:46:20.891Z",
      "snapshotRevision": 34,
      "record": {
        "id": "preview-product:7ec40c8f-f744-4297-9128-2affe9eae980",
        "kind": "catalog-product-v1",
        "version": 1,
        "data": {
          "code": "QA-IM-P-20261021",
          "name": "QA Inactive Product 20261021",
          "group": "Linh kiện điện",
          "unit": "Cái",
          "status": "active",
          "provenance": "owner-proposed-catalog-v1",
          "createdAt": "2026-10-21T11:46:20.891Z",
          "updatedAt": "2026-10-21T11:46:20.891Z"
        }
      }
    },
    "command": "qa.product.set-status"
  },
  {
    "kind": "catalog-sku-v1",
    "entityId": "preview-sku:e93e34ed-53b1-4593-b9de-b7a4d3be3691",
    "originalCreateCommandId": "360b5bc0-8624-4013-8f4a-caff7f05b5fc",
    "originalRequest": {
      "command": "skus.create",
      "commandId": "360b5bc0-8624-4013-8f4a-caff7f05b5fc",
      "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
      "payload": {
        "barcode": null,
        "code": "QA-IM-S-20261021",
        "observedProductVersion": 1,
        "productId": "preview-product:7ec40c8f-f744-4297-9128-2affe9eae980",
        "status": "active"
      }
    },
    "originalReceipt": {
      "mode": "MOCK",
      "commandId": "360b5bc0-8624-4013-8f4a-caff7f05b5fc",
      "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
      "command": "skus.create",
      "actorKey": "preview:ducquang",
      "entityId": "preview-sku:e93e34ed-53b1-4593-b9de-b7a4d3be3691",
      "previousVersion": null,
      "version": 1,
      "changed": true,
      "committedAt": "2026-10-21T11:47:01.472Z",
      "snapshotRevision": 35,
      "record": {
        "id": "preview-sku:e93e34ed-53b1-4593-b9de-b7a4d3be3691",
        "kind": "catalog-sku-v1",
        "version": 1,
        "data": {
          "code": "QA-IM-S-20261021",
          "productId": "preview-product:7ec40c8f-f744-4297-9128-2affe9eae980",
          "barcode": null,
          "status": "active",
          "provenance": "owner-proposed-catalog-v1",
          "createdAt": "2026-10-21T11:47:01.472Z",
          "updatedAt": "2026-10-21T11:47:01.472Z"
        }
      }
    },
    "command": "qa.sku.set-status"
  },
  {
    "kind": "recipient-master-v1",
    "entityId": "preview-recipient:f8693a48-2db2-45a7-bc03-6cb7d0ca9427",
    "originalCreateCommandId": "dc580100-ca5c-4d64-b7e2-8fe5fa1a34ad",
    "originalRequest": {
      "command": "recipients.create",
      "commandId": "dc580100-ca5c-4d64-b7e2-8fe5fa1a34ad",
      "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
      "payload": {
        "address": "Dia chi Demo QA inactive 20261021",
        "area": "QA isolated p05-v1",
        "code": "QA-IM-R-20261021",
        "contact": "",
        "market": "Miền Bắc",
        "name": "QA Inactive Recipient 20261021",
        "phone": "",
        "status": "active",
        "type": "Khách công trình"
      }
    },
    "originalReceipt": {
      "mode": "MOCK",
      "commandId": "dc580100-ca5c-4d64-b7e2-8fe5fa1a34ad",
      "epoch": "2256c156-70d0-4005-b8e3-99b94cac8a04",
      "command": "recipients.create",
      "actorKey": "preview:ducquang",
      "entityId": "preview-recipient:f8693a48-2db2-45a7-bc03-6cb7d0ca9427",
      "previousVersion": null,
      "version": 1,
      "changed": true,
      "committedAt": "2026-10-21T11:47:50.234Z",
      "snapshotRevision": 36,
      "record": {
        "id": "preview-recipient:f8693a48-2db2-45a7-bc03-6cb7d0ca9427",
        "kind": "recipient-master-v1",
        "version": 1,
        "data": {
          "code": "QA-IM-R-20261021",
          "name": "QA Inactive Recipient 20261021",
          "type": "Khách công trình",
          "market": "Miền Bắc",
          "area": "QA isolated p05-v1",
          "address": "Dia chi Demo QA inactive 20261021",
          "contact": "",
          "phone": "",
          "status": "active",
          "provenance": "owner-proposed-catalog-v1",
          "createdAt": "2026-10-21T11:47:50.234Z",
          "updatedAt": "2026-10-21T11:47:50.234Z"
        }
      }
    },
    "command": "qa.recipient.set-status"
  }
] as const;
export const INACTIVE_MASTER_COMMANDS = INACTIVE_MASTER_ALLOWLIST.map(entry => entry.command);
