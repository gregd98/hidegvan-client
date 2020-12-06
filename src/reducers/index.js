import { combineReducers } from 'redux';
import userReducer from './userReducers';
import deviceReducer from './deviceReducers';
import ruleReducer from './ruleReducers';
import statisticsReducer from './statisticsReducers';

const rootReducer = combineReducers({
  user: userReducer,
  devices: deviceReducer,
  rules: ruleReducer,
  statistics: statisticsReducer,
});

export default rootReducer;
