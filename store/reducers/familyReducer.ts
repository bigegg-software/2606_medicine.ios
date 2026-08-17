import {
  CLEAR_FAMILY,
  SET_FAMILY_LIST,
  SET_FAMILY_LOADING,
  SET_SELECTED_FAMILY_KEY,
  type FamilyAction,
  type FamilyState,
} from '../type/family';
import { CLEAR_USER } from '../type/user';

const initialState: FamilyState = {
  list: [],
  selectedKey: null,
  loading: false,
};

export default function familyReducer(
  state = initialState,
  action: FamilyAction | { type: typeof CLEAR_USER },
): FamilyState {
  switch (action.type) {
    case SET_FAMILY_LIST:
      return { ...state, list: action.payload };
    case SET_SELECTED_FAMILY_KEY:
      return { ...state, selectedKey: action.payload };
    case SET_FAMILY_LOADING:
      return { ...state, loading: action.payload };
    case CLEAR_FAMILY:
    case CLEAR_USER:
      return initialState;
    default:
      return state;
  }
}
