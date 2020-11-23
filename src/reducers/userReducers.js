import produce from 'immer';
import { actionLogIn, actionLogOut } from '../actions/actionTypes';

const defaultState = {
  loggedIn: false,
};

const userReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLogIn:
      return produce(state, (draft) => {
        draft.loggedIn = true;
      });
    case actionLogOut:
      return defaultState;
    default:
      return state;
  }
};

export default userReducer;
