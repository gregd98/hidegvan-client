import produce from 'immer';
import { actionLoadRules } from '../actions/actionTypes';

const defaultState = {
  rules: [],
};

const ruleReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLoadRules:
      return produce(state, (draft) => {
        draft.rules = action.payload;
      });
    default:
      return state;
  }
};

export default ruleReducer;
