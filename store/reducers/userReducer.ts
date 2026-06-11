import { CLEAR_USER, SET_USER, SET_USER_EXTR, SET_USER_LOADING, UserAction, UserState } from '../type/user';

const initialState: UserState = {
  info: null,
  userExtr: null,
  loading: false,
};

export default function userReducer(state = initialState, action: UserAction): UserState {
  switch (action.type) {
    case SET_USER:
      return { ...state, info: action.payload };
    case SET_USER_EXTR:
      return { ...state, userExtr: action.payload };
    case SET_USER_LOADING:
      return { ...state, loading: action.payload };
    case CLEAR_USER:
      return initialState;
    default:
      return state;
  }
}
