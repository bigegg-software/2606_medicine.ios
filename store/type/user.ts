import type { UserBaseInfo } from '@/api/patient';

export const SET_USER = 'SET_USER';
export const SET_USER_LOADING = 'SET_USER_LOADING';
export const CLEAR_USER = 'CLEAR_USER';

export interface UserState {
  info: UserBaseInfo | null;
  loading: boolean;
}

export type UserAction =
  | { type: typeof SET_USER; payload: UserBaseInfo }
  | { type: typeof SET_USER_LOADING; payload: boolean }
  | { type: typeof CLEAR_USER };
