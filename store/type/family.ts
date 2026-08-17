import type { FamilyBindItem } from '@/api/familyBind';

export const SET_FAMILY_LIST = 'SET_FAMILY_LIST';
export const SET_SELECTED_FAMILY_KEY = 'SET_SELECTED_FAMILY_KEY';
export const SET_FAMILY_LOADING = 'SET_FAMILY_LOADING';
export const CLEAR_FAMILY = 'CLEAR_FAMILY';

export type FamilyState = {
  /** 子女端「我的家人」列表（含各 bindStatus） */
  list: FamilyBindItem[];
  /** 当前选中家人 tab key（与 getFamilyTabKey 一致） */
  selectedKey: string | null;
  loading: boolean;
};

export type FamilyAction =
  | { type: typeof SET_FAMILY_LIST; payload: FamilyBindItem[] }
  | { type: typeof SET_SELECTED_FAMILY_KEY; payload: string | null }
  | { type: typeof SET_FAMILY_LOADING; payload: boolean }
  | { type: typeof CLEAR_FAMILY };
