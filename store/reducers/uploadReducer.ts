import {
  UploadAction,
  UploadState,
  SET_UPLOADING,
  SET_UPLOAD_PROGRESS,
} from '../type/upload';

const initialState: UploadState = {
  uploading: false,
  progress: 0,
};

export default function uploadReducer(state = initialState, action: UploadAction): UploadState {
  switch (action.type) {
    case SET_UPLOADING:
      return { ...state, uploading: action.payload };
    case SET_UPLOAD_PROGRESS:
      return { ...state, progress: action.payload };
    default:
      return state;
  }
}
