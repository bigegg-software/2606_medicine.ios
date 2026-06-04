import type { MedicalRecordAttachment } from '@/api/medicalRecord';

let pendingAttachments: MedicalRecordAttachment[] = [];

export function pushPendingAttachments(items: MedicalRecordAttachment[]) {
  pendingAttachments.push(...items);
}

export function consumePendingAttachments() {
  const items = pendingAttachments;
  pendingAttachments = [];
  return items;
}
