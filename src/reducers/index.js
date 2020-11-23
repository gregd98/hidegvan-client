import { combineReducers } from 'redux';
import userReducer from './userReducers';
import deviceReducer from './deviceReducers';
import ruleReducer from './ruleReducers';

const rootReducer = combineReducers({
  user: userReducer,
  devices: deviceReducer,
  rules: ruleReducer,
});

export default rootReducer;
