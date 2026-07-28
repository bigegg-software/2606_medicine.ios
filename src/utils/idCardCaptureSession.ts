import type { IdCardSide, PickedIdCardImage } from '@/src/features/authentication/utils/identityAuditHelpers';

export type PendingIdCardCapture = PickedIdCardImage & {
  side: IdCardSide;
};

let pendingCapture: PendingIdCardCapture | null = null;

export function pushPendingIdCardCapture(item: PendingIdCardCapture) {
  pendingCapture = item;
}

export function consumePendingIdCardCapture() {
  const item = pendingCapture;
  pendingCapture = null;
  return item;
}
