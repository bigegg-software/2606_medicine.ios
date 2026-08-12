import type { InUseExPatientRule } from '@/api/schedule';

export const SET_IN_USE_PRESCRIPTION = 'SET_IN_USE_PRESCRIPTION';
export const SET_PRESCRIPTION_LOADING = 'SET_PRESCRIPTION_LOADING';
export const CLEAR_PRESCRIPTION = 'CLEAR_PRESCRIPTION';

export type PrescriptionState = {
  /** 当前正在使用的运动处方（含已补全的健康目标详情） */
  inUse: InUseExPatientRule | null;
  /** target_category 字典 label map */
  categoryLabelMap: Record<string, string>;
  /** target_category 字典 sort map */
  categorySortMap: Record<string, number>;
  loading: boolean;
};

export type SetInUsePrescriptionPayload = {
  inUse: InUseExPatientRule | null;
  categoryLabelMap?: Record<string, string>;
  categorySortMap?: Record<string, number>;
};

export type PrescriptionAction =
  | { type: typeof SET_IN_USE_PRESCRIPTION; payload: SetInUsePrescriptionPayload }
  | { type: typeof SET_PRESCRIPTION_LOADING; payload: boolean }
  | { type: typeof CLEAR_PRESCRIPTION };
