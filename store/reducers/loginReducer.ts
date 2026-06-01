import { LoginAction, LoginState, SET_LOGIN, SET_LOGIN_EXPIRED, SET_LOGIN_STATUS } from '../type/login';

const initialState: LoginState = { showLogin: false, loginExpired: false, isLogin: false };

export default function loginReducer(state = initialState, action: LoginAction): LoginState {
  switch (action.type) {
    case SET_LOGIN_STATUS:
      return { ...state, showLogin: action.payload ?? false };
    case SET_LOGIN_EXPIRED:
      return { ...state, loginExpired: action.payload ?? false };
    case SET_LOGIN:
      return { ...state, isLogin: action.payload ?? false };
    default:
      return state;
  }
}
