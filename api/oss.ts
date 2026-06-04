import request from '@/utils/axios';

export type OssUploadResult = {
  url?: string;
  fileName?: string;
  ossId?: string | number;
};

export type OssUploadResponse = {
  code?: number;
  msg?: string;
  data?: OssUploadResult;
};

export const uploadOss = (file: { uri: string; name: string; type: string }) => {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  return request.post<OssUploadResponse>('/resource/oss/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
