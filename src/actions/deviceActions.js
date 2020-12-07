import { actionLoadDevices, actionNeedToLoad } from './actionTypes';

export const loadDevices = (payload) => ({ type: actionLoadDevices, payload });
export const needToLoad = () => ({ type: actionNeedToLoad });
