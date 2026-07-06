import type { MedicalRecordAttachment } from '@/api/medicalRecord';
import {
  decodeAttachmentName,
  getAttachmentDisplayName,
  isImageAttachment,
} from '@/src/features/profile/healthRecord/medicalRecordAttachmentHelpers';
import type { UploadPreview, UploadPreviewFile } from './types';

export function isFileUploadType(type: unknown): boolean {
  return type === 'file' || type === 'document';
}

export function uploadFileLooksLikeImage(originalName?: string, url?: string): boolean {
  const name = decodeAttachmentName(originalName).toLowerCase();
  const fileUrl = (url || '').toLowerCase();
  return (
    /\.(png|jpe?g|webp|gif|heic|bmp)$/i.test(name) ||
    /\.(png|jpe?g|webp|gif|heic|bmp)(\?|$)/i.test(fileUrl)
  );
}

export function resolveUploadTypeFromAttachments(
  attachments: MedicalRecordAttachment[],
): 'image' | 'file' {
  if (attachments.some(item => item.uploadType === 'file')) return 'file';
  if (attachments.some(item => item.uploadType === 'image')) return 'image';
  return attachments.some(item => !isImageAttachment(item)) ? 'file' : 'image';
}

export function mapAttachmentToPreviewFile(
  attachment: MedicalRecordAttachment,
): UploadPreviewFile | null {
  const url = String(attachment.ossUrl ?? '').trim();
  if (!url) return null;

  return {
    ossId: attachment.ossId,
    url,
    originalName: decodeAttachmentName(attachment.originalName),
    length: attachment.length ?? 0,
  };
}

export function buildUploadPreviewFromAttachments(
  attachments: MedicalRecordAttachment[],
): UploadPreview {
  const fileList = attachments
    .map(mapAttachmentToPreviewFile)
    .filter((item): item is UploadPreviewFile => item != null);

  return {
    type: resolveUploadTypeFromAttachments(attachments),
    fileList,
  };
}

export function buildUploadFilePayloadFromAttachments(attachments: MedicalRecordAttachment[]) {
  const preview = buildUploadPreviewFromAttachments(attachments);
  if (!preview.fileList.length) {
    return { type: '', fileList: [] as Record<string, unknown>[] };
  }

  return {
    type: preview.type,
    fileList: preview.fileList.map(item => ({
      ossId: item.ossId ?? '',
      url: item.url,
      originalName: item.originalName ?? '',
      length: item.length ?? 0,
    })),
  };
}

export function inferUploadPreviewType(uploadPreview: UploadPreview): 'image' | 'file' {
  if (uploadPreview.type === 'file') return 'file';
  if (uploadPreview.type === 'image') return 'image';

  const first = uploadPreview.fileList[0];
  if (!first) return 'image';
  return uploadFileLooksLikeImage(first.originalName, first.url) ? 'image' : 'file';
}

export function firstUploadPreviewImageSource(
  uploadPreview?: UploadPreview,
): { uri: string } | null {
  const first = uploadPreview?.fileList?.[0];
  if (!first?.url) return null;
  if (uploadPreview?.type === 'image' || uploadFileLooksLikeImage(first.originalName, first.url)) {
    return { uri: first.url };
  }
  return null;
}

export function formatUploadFileSize(size: unknown): string {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return '--';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Math.round(mb)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

export function getUploadPreviewDisplayName(file?: Pick<UploadPreviewFile, 'originalName' | 'url'>) {
  return getAttachmentDisplayName({
    originalName: file?.originalName,
    ossUrl: file?.url,
  }) || '文件';
}
