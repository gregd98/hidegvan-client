import produce from 'immer';
import { actionLoadStatistics } from '../actions/actionTypes';

const defaultState = {
  devices: [],
};

const statisticsReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLoadStatistics:
      return produce(state, (draft) => {
        draft.devices = action.payload;
      });
    default:
      return state;
  }
};

export default statisticsReducer;
