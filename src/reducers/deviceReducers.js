import produce from 'immer';
import { actionLoadDevices } from '../actions/actionTypes';

const defaultState = {
  devices: [],
};

const deviceReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLoadDevices:
      return produce(state, (draft) => {
        draft.devices = action.payload;
      });
    default:
      return state;
  }
};

export default deviceReducer;
