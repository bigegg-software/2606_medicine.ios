import type { UserBaseInfo } from '@/api/patient';
import type { SystemUser, UserExtr } from '@/api/user';

export const SET_USER = 'SET_USER';
export const SET_SYSTEM_USER = 'SET_SYSTEM_USER';
export const SET_USER_EXTR = 'SET_USER_EXTR';
export const SET_USER_LOADING = 'SET_USER_LOADING';
export const CLEAR_USER = 'CLEAR_USER';

export interface UserState {
  info: UserBaseInfo | null;
  systemUser: SystemUser | null;
  userExtr: UserExtr | null;
  loading: boolean;
}

export type UserAction =
  | { type: typeof SET_USER; payload: UserBaseInfo }
  | { type: typeof SET_SYSTEM_USER; payload: SystemUser }
  | { type: typeof SET_USER_EXTR; payload: UserExtr }
  | { type: typeof SET_USER_LOADING; payload: boolean }
  | { type: typeof CLEAR_USER };
