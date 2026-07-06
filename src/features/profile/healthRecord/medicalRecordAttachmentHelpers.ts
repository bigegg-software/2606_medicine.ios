import type { MedicalRecordAttachment } from '@/api/medicalRecord';

export function decodeAttachmentName(name?: string) {
  if (!name?.trim()) return '';
  const raw = name.trim().replace(/\+/g, ' ');
  if (!/%[0-9A-Fa-f]{2}/.test(raw)) {
    return raw;
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw.replace(/(?:%[0-9A-Fa-f]{2})+/g, segment => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
  }
}

export function getAttachmentDisplayName(att: MedicalRecordAttachment) {
  const fromOriginal = decodeAttachmentName(att.originalName);
  if (fromOriginal) return fromOriginal;

  if (att.ossUrl) {
    const pathPart = att.ossUrl.split('?')[0].split('/').pop() ?? '';
    const fromUrl = decodeAttachmentName(pathPart);
    if (fromUrl) return fromUrl;
  }

  return '附件';
}

export function isImageAttachment(att: MedicalRecordAttachment) {
  const candidates = [att.originalName, att.ossUrl].map(value => decodeAttachmentName(value));
  return candidates.some(name => /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(name));
}

export function partitionAttachments(list: MedicalRecordAttachment[]) {
  const images: MedicalRecordAttachment[] = [];
  const files: MedicalRecordAttachment[] = [];

  for (const att of list) {
    if (!att.ossUrl) continue;
    if (isImageAttachment(att)) {
      images.push(att);
    } else {
      files.push(att);
    }
  }

  return { images, files };
}
