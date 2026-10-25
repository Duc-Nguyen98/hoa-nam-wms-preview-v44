export type BusinessNotificationTitleKey =
  | 'outboundReadyTitle'
  | 'inventoryVarianceTitle'
  | 'putawayCompletedTitle'
  | 'warrantyReviewTitle'
  | 'warehouseConfigTitle';

export type BusinessNotificationBodyKey =
  | 'outboundReadyBody'
  | 'inventoryVarianceBody'
  | 'putawayCompletedBody'
  | 'warrantyReviewBody'
  | 'warehouseConfigBody';

export type BusinessNotificationTarget = {
  href: string;
  labelKey: 'openDocument' | 'openInventory' | 'openPutaway' | 'openWarranty' | 'openSettings';
  reference: string;
};

export type BusinessNotification = {
  readonly id: string;
  readonly kind: 'business';
  readonly category: 'outbound' | 'inventory' | 'putaway' | 'warranty' | 'system' | 'inbound' | 'printing';
  readonly severity: 'info' | 'warning' | 'success';
  readonly titleKey: BusinessNotificationTitleKey;
  readonly bodyKey: BusinessNotificationBodyKey;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly target: BusinessNotificationTarget;
  /** Presentation data supplied by an adapter or an explicit isolated test fixture.
   * Never synthesize missing document fields or imply an unverified target exists. */
  readonly presentation?: {
    title?: NotificationLocalizedText;
    body?: NotificationLocalizedText;
    summary?: NotificationLocalizedText;
    categoryLabel?: NotificationLocalizedText;
    cardTitle?: NotificationLocalizedText;
    fields?: readonly { label: NotificationLocalizedText; value: NotificationLocalizedText; tone?: 'warning' | 'success' | 'info' }[];
    targetVerified?: boolean;
  };
};

export type NotificationLocalizedText = Record<'vi' | 'en' | 'zh-CN', string>;
