import produce from 'immer';
import { actionLoadDevices, actionNeedToLoad } from '../actions/actionTypes';

const defaultState = {
  loaded: false,
  devices: [],
};

const deviceReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLoadDevices:
      return produce(state, (draft) => {
        draft.devices = action.payload;
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

export default deviceReducer;
