import type { MedicalRecord, MedicalRecordAttachment } from '@/api/medicalRecord';
import { uploadFileToAttachment } from '@/src/utils/uploadAttachment';

type LocalIdentifyFile = {
  uri: string;
  name: string;
  type?: string;
  size?: number;
  uploadType?: 'image' | 'file';
};

/** 识别结果若已带附件则直接用；否则把本地文件上传为附件（用户无需再传一次） */
export async function resolveAttachmentsAfterIdentify(
  record: MedicalRecord | null | undefined,
  files: LocalIdentifyFile[],
): Promise<MedicalRecordAttachment[]> {
  const fromApi = (record?.attachmentList ?? []).filter(item => Boolean(item.ossUrl?.trim()));
  if (fromApi.length > 0) {
    return fromApi;
  }

  const uploaded: MedicalRecordAttachment[] = [];
  for (const file of files) {
    const item = await uploadFileToAttachment(file);
    if (item) {
      uploaded.push(item);
    }
  }
  return uploaded;
}
