import { legacy_createStore as createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import loginReducer from './reducers/loginReducer';

const store = createStore(combineReducers({ login: loginReducer }), undefined, applyMiddleware(thunk));
export default store;
export type RootState = ReturnType<typeof store.getState>;
