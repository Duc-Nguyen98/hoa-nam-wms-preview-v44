export const OPEN_NOTIFICATION_EVENT = 'hoa-nam:open-notification';
export function openRelatedNotification(id?:string) {
 window.dispatchEvent(new CustomEvent(OPEN_NOTIFICATION_EVENT,{detail:{id}}));
}
