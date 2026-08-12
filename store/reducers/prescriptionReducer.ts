import {
  CLEAR_PRESCRIPTION,
  SET_IN_USE_PRESCRIPTION,
  SET_PRESCRIPTION_LOADING,
  type PrescriptionAction,
  type PrescriptionState,
} from '../type/prescription';
import { CLEAR_USER } from '../type/user';

const initialState: PrescriptionState = {
  inUse: null,
  categoryLabelMap: {},
  categorySortMap: {},
  loading: false,
};

export default function prescriptionReducer(
  state = initialState,
  action: PrescriptionAction | { type: typeof CLEAR_USER },
): PrescriptionState {
  switch (action.type) {
    case SET_IN_USE_PRESCRIPTION:
      return {
        ...state,
        inUse: action.payload.inUse,
        categoryLabelMap: action.payload.categoryLabelMap ?? {},
        categorySortMap: action.payload.categorySortMap ?? {},
      };
    case SET_PRESCRIPTION_LOADING:
      return { ...state, loading: action.payload };
    case CLEAR_PRESCRIPTION:
    case CLEAR_USER:
      return initialState;
    default:
      return state;
  }
}
