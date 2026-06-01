export const SET_LOGIN = 'SET_LOGIN';
export const SET_LOGIN_STATUS = 'SET_LOGIN_STATUS';
export const SET_LOGIN_EXPIRED = 'SET_LOGIN_EXPIRED';

export interface LoginState {
  showLogin: boolean;
  loginExpired: boolean;
  isLogin: boolean;
}

export interface LoginAction {
  type: string;
  payload?: boolean;
}
