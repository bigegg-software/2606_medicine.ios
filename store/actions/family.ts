import { getFamilyBindMyList, type FamilyBindItem } from '@/api/familyBind';
import { apiResourceData, type ApiResult } from '@/src/utils/apiHelpers';
import {
  getApprovedFamilyBindList,
  getFamilyTabKey,
} from '@/src/familyPage/utils/familyProfileHelpers';
import type { AppDispatch, RootState } from '../store';
import {
  CLEAR_FAMILY,
  SET_FAMILY_LIST,
  SET_FAMILY_LOADING,
  SET_SELECTED_FAMILY_KEY,
} from '../type/family';

export const setSelectedFamilyKey = (key: string | null) => ({
  type: SET_SELECTED_FAMILY_KEY as typeof SET_SELECTED_FAMILY_KEY,
  payload: key,
});

export const clearFamily = () => ({ type: CLEAR_FAMILY as typeof CLEAR_FAMILY });

function resolveSelectedKey(
  list: FamilyBindItem[],
  prevKey: string | null,
): string | null {
  const approved = getApprovedFamilyBindList(list);
  if (approved.length === 0) return null;
  if (
    prevKey &&
    approved.some((item, index) => getFamilyTabKey(item, index) === prevKey)
  ) {
    return prevKey;
  }
  return getFamilyTabKey(approved[0], 0);
}

/** 拉取子女端「我的家人」列表并写入 store */
export const fetchFamilyBindMyList =
  (options?: { force?: boolean }) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!options?.force && getState().family.loading) return;

    dispatch({ type: SET_FAMILY_LOADING, payload: true });
    try {
      const res = await getFamilyBindMyList();
      const data =
        apiResourceData(res as unknown as ApiResult<FamilyBindItem[]>) ?? [];
      const list = Array.isArray(data) ? data : [];
      dispatch({ type: SET_FAMILY_LIST, payload: list });
      const nextKey = resolveSelectedKey(list, getState().family.selectedKey);
      dispatch({ type: SET_SELECTED_FAMILY_KEY, payload: nextKey });
    } catch {
      dispatch({ type: SET_FAMILY_LIST, payload: [] });
      dispatch({ type: SET_SELECTED_FAMILY_KEY, payload: null });
    } finally {
      dispatch({ type: SET_FAMILY_LOADING, payload: false });
    }
  };
