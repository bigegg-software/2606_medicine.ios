import { getUserBaseInfo, type UserBaseInfo } from '@/api/patient';
import { getUserInfo, type UserExtr, type UserInfoData } from '@/api/user';
import { saveUserId } from '@/services/storage';
import { isResourceApiOk } from '@/src/utils/apiHelpers';
import { CLEAR_USER, SET_SYSTEM_USER, SET_USER, SET_USER_EXTR, SET_USER_LOADING } from '../type/user';
import type { RootState } from '../store';

type AppDispatch = (action: { type: string; payload?: unknown }) => unknown;

async function applySystemUserInfo(dispatch: AppDispatch, res: unknown) {
  if (!isResourceApiOk(res as { code?: number })) return;
  const data = (res as { data?: UserInfoData }).data;
  if (!data) return;

  const { user, userExtr } = data;
  const userId = user?.userId ?? userExtr?.userId;
  if (userId != null) await saveUserId(userId);

  if (user) {
    dispatch({ type: SET_SYSTEM_USER, payload: user });
  }
  if (userExtr) {
    dispatch({ type: SET_USER_EXTR, payload: userExtr });
  }
}

async function applyUserBaseInfo(dispatch: AppDispatch, res: unknown) {
  if (!isResourceApiOk(res as { code?: number })) return;
  const data = (res as { data?: UserBaseInfo }).data ?? {};
  if (data.userId != null) await saveUserId(data.userId);
  dispatch({ type: SET_USER, payload: data });
}

export const fetchUserInfo = () => async (dispatch: AppDispatch) => {
  try {
    const res = await getUserInfo();
    await applySystemUserInfo(dispatch, res);
  } catch {
    /* ignore */
  }
};

export const fetchUserBaseInfo = () => async (dispatch: AppDispatch, getState: () => RootState) => {
  if (getState().user.loading) return;

  dispatch({ type: SET_USER_LOADING, payload: true });
  try {
    const res = await getUserBaseInfo();
    await applyUserBaseInfo(dispatch, res);
  } catch {
    /* ignore */
  } finally {
    dispatch({ type: SET_USER_LOADING, payload: false });
  }
};

export const fetchUserSession = () => async (dispatch: AppDispatch) => {
  dispatch({ type: SET_USER_LOADING, payload: true });
  try {
    const [systemRes, patientRes] = await Promise.all([
      getUserInfo().catch(() => null),
      getUserBaseInfo().catch(() => null),
    ]);
    await Promise.all([
      systemRes ? applySystemUserInfo(dispatch, systemRes) : Promise.resolve(),
      patientRes ? applyUserBaseInfo(dispatch, patientRes) : Promise.resolve(),
    ]);
    if (systemRes && isResourceApiOk(systemRes as { code?: number })) {
      return (systemRes as { data?: UserInfoData }).data?.user?.identityPerspective ?? '';
    }
    return '';
  } finally {
    dispatch({ type: SET_USER_LOADING, payload: false });
  }
};

export const clearUser = () => ({ type: CLEAR_USER });
