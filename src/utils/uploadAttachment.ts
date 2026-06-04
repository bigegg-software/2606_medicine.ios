import { uploadOss } from '@/api/oss';
import type { MedicalRecordAttachment } from '@/api/medicalRecord';
import { apiResourceData } from '@/src/utils/apiHelpers';

export async function uploadFileToAttachment(file: {
  uri: string;
  name: string;
  type?: string;
}): Promise<MedicalRecordAttachment | null> {
  const res = await uploadOss({
    uri: file.uri,
    name: file.name,
    type: file.type ?? 'image/jpeg',
  });
  const data = apiResourceData<{ url?: string; fileName?: string; ossId?: string | number }>(
    res as { code?: number; data?: { url?: string; fileName?: string; ossId?: string | number } },
  );
  if (!data?.url) {
    return null;
  }
  const ossId = data.ossId != null ? String(data.ossId) : undefined;
  return {
    ossId: ossId || undefined,
    ossUrl: data.url,
    originalName: data.fileName ?? file.name,
  };
}
