import { getInUseExPatientRuleInfo, type InUseExPatientRule } from '@/api/schedule';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';
import { enrichHealthGoalTargets } from '@/src/features/schedule/scheduleHelpers';
import { loadTargetCategoryDict } from '@/src/features/schedule/scheduleGoalHelpers';
import type { AppDispatch, RootState } from '../store';
import {
  CLEAR_PRESCRIPTION,
  SET_IN_USE_PRESCRIPTION,
  SET_PRESCRIPTION_LOADING,
} from '../type/prescription';

export const fetchInUsePrescription = (options?: { force?: boolean }) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().prescription;
    if (state.loading) return state.inUse;
    // 非强制刷新时复用已加载处方，避免首页等场景重复打 getInfo
    if (!options?.force && state.inUse) return state.inUse;

    dispatch({ type: SET_PRESCRIPTION_LOADING, payload: true });
    try {
      const res = await getInUseExPatientRuleInfo();
      console.log(res)
      const payload = res as unknown as { code?: number; data?: InUseExPatientRule };
      if (!isResourceApiOk(payload)) {
        dispatch({
          type: SET_IN_USE_PRESCRIPTION,
          payload: { inUse: null, categoryLabelMap: {}, categorySortMap: {} },
        });
        return null;
      }

      let current = apiResourceData<InUseExPatientRule>(payload) ?? null;
      let categoryLabelMap: Record<string, string> = {};
      let categorySortMap: Record<string, number> = {};
      const previousTargets = getState().prescription.inUse?.healthGoalTargetList;

      if (current?.healthGoalTargetList?.length) {
        const [enrichedTargets, categoryDict] = await Promise.all([
          enrichHealthGoalTargets(current.healthGoalTargetList, { previousTargets }),
          loadTargetCategoryDict(),
        ]);
        current = { ...current, healthGoalTargetList: enrichedTargets };
        categoryLabelMap = categoryDict.labelMap;
        categorySortMap = categoryDict.sortMap;
      }

      dispatch({
        type: SET_IN_USE_PRESCRIPTION,
        payload: { inUse: current, categoryLabelMap, categorySortMap },
      });
      return current;
    } catch {
      dispatch({
        type: SET_IN_USE_PRESCRIPTION,
        payload: { inUse: null, categoryLabelMap: {}, categorySortMap: {} },
      });
      return null;
    } finally {
      dispatch({ type: SET_PRESCRIPTION_LOADING, payload: false });
    }
  };

export const clearPrescription = () => ({ type: CLEAR_PRESCRIPTION });
