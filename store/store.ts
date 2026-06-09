import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import type { ThunkDispatch, UnknownAction } from 'redux-thunk';
import { thunk } from 'redux-thunk';
import loginReducer from './reducers/loginReducer';
import userReducer from './reducers/userReducer';
import uploadReducer from './reducers/uploadReducer';

const store = createStore(combineReducers({
    login: loginReducer,
    user: userReducer,
    upload: uploadReducer,
}), undefined, applyMiddleware(thunk));
export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;
