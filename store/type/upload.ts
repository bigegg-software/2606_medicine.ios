export const SET_UPLOADING = 'SET_UPLOADING';
export const SET_UPLOAD_PROGRESS = 'SET_UPLOAD_PROGRESS';

export interface UploadState {
  uploading: boolean;
  progress: number;
}

export type UploadAction =
  | { type: typeof SET_UPLOADING; payload: boolean }
  | { type: typeof SET_UPLOAD_PROGRESS; payload: number };
