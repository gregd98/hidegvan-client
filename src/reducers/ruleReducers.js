import produce from 'immer';
import { actionLoadRules, actionNeedToLoad } from '../actions/actionTypes';

const defaultState = {
  loaded: false,
  rules: [],
};

const ruleReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLoadRules:
      return produce(state, (draft) => {
        draft.rules = action.payload;
        draft.loaded = true;
      });
    case actionNeedToLoad:
      return produce(state, (draft) => {
        draft.loaded = false;
      });
    default:
      return state;
  }
};

export default ruleReducer;
