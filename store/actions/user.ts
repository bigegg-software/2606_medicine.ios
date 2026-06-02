import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { saveUserId } from '@/services/storage';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { CLEAR_USER, SET_USER, SET_USER_LOADING } from '../type/user';
import type { RootState } from '../store';

type AppDispatch = (action: { type: string; payload?: unknown }) => void;

export const fetchUserBaseInfo = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  if (getState().user.loading) return;

  dispatch({ type: SET_USER_LOADING, payload: true });
  try {
    const pRes = await getUserBaseInfo();
    if (isResourceApiOk(pRes as { code?: number })) {
      const data = (pRes as { data?: UserBaseInfo }).data ?? {};
      if (data.userId != null) await saveUserId(data.userId);
      dispatch({ type: SET_USER, payload: data });
    }
  } catch {
    /* ignore */
  } finally {
    dispatch({ type: SET_USER_LOADING, payload: false });
  }
};

export const clearUser = () => ({ type: CLEAR_USER });
