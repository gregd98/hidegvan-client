import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCookies } from 'react-cookie';
import socketIOClient from 'socket.io-client';
import { useHistory } from 'react-router-dom';
import { restGet, restDelete, restPost } from '../utils/communication';
import { SERVER_PATH } from '../constants';
import { ConfirmationDialog, MessageDialog } from './dialog_utils.jsx';
import ErrorPage from './error_page.jsx';
import LoadingPage from './loading_page.jsx';
import { loadDevices } from '../actions/deviceActions';
import { loadRules } from '../actions/ruleActions';

const classNames = require('classnames');

const Dashboard = () => {
  const devices = useSelector((state) => state.devices.devices);
  const rules = useSelector((state) => state.rules.rules);
  const [socket, setSocket] = useState(null);
  const [flippedCard, setFlippedCard] = useState(null);
  const [switchDisabled, setSwitchDisabled] = useState(false);
  const [msgDialog, setMsgDialog] = useState('');
  const [deletionDialog, setDeletionDialog] = useState({
    text: '',
    btnHandler: () => {},
    isLoading: false,
    errorMessage: '',
  });

  const [pageError, setPageError] = useState({});
  const [isLoading, setLoading] = useState(false);

  const history = useHistory();
  const dispatch = useDispatch();
  const cookies = useCookies();
  const removeCookie = cookies[2];

  const pad = (num) => (num < 10 ? `0${num}` : num);
  const timeToString = (time) => `${pad(Math.trunc(time / 60))}:${pad(time % 60)}`;

  useEffect(() => {
    const removeModal = () => {
      window.$('#deletionDialog').modal('hide');
      window.$('#messageDialog').modal('hide');
      window.$('body').removeClass('modal-open');
      window.$('.modal-backdrop').remove();
    };
    window.onpopstate = removeModal;
    return () => {
      removeModal();
      window.onpopstate = () => {};
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        dispatch(loadDevices(await restGet(`${SERVER_PATH}api/devices`, dispatch, removeCookie)));
        dispatch(loadRules(await restGet(`${SERVER_PATH}api/rules`, dispatch, removeCookie)));
      } catch (error) {
        setPageError(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, removeCookie]);

  useEffect(() => {
    const so = socketIOClient(window.location.hostname);
    setSocket(so);
    return () => {
      so.disconnect();
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('device update', (payload) => dispatch(loadDevices(payload)));
      socket.on('rule update', (payload) => dispatch(loadRules(payload)));
    }
  }, [dispatch, socket]);

  const deleteEntity = async (id, isDevice) => {
    const setData = (obj) => setDeletionDialog((rest) => ({ ...rest, ...obj }));
    try {
      setData({ isLoading: true });
      await restDelete(`${SERVER_PATH}api/${isDevice ? 'devices' : 'rules'}/${id}`, dispatch, removeCookie);
      window.$('#deletionDialog').modal('hide');
    } catch (error) {
      setData({ isLoading: false, errorMessage: `Error: ${error.message}` });
    }
  };

  const addClicked = (isDevice) => {
    history.push(`/add-${isDevice ? 'device' : 'rule'}`);
  };

  const cardClicked = (id) => {
    setFlippedCard(flippedCard === id ? null : id);
  };

  const switchEntity = (id, name, state, isDevice) => {
    setSwitchDisabled(true);
    restPost(`${SERVER_PATH}api/${isDevice ? 'devices' : 'rules'}/${id}/switch-state`, { state }, dispatch, removeCookie).then(() => {
      setSwitchDisabled(false);
    })
      .catch((error) => {
        setMsgDialog(`Failed to ${isDevice ? `switch ${name}` : `${state ? 'enable' : 'disable'} ${name}`}: ${error.message}`);
        window.$('#messageDialog').modal('show');
      });
  };

  const editClicked = (e, id, isDevice) => {
    e.stopPropagation();
    history.push(`/${isDevice ? 'devices' : 'rules'}/${id}`);
  };

  const deleteClicked = (e, id, name, isDevice) => {
    e.stopPropagation();
    setDeletionDialog({
      text: `Do you want to delete ${isDevice ? 'device' : 'rule'} ${name}?`,
      btnHandler: () => deleteEntity(id, isDevice),
      isLoading: false,
      errorMessage: '',
    });
    window.$('#deletionDialog').modal('show');
  };

  if (pageError.message) {
    return <ErrorPage status={pageError.status} message={pageError.message} />;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="d-flex justify-content-center mt-4 text-center">
      <div style={{ width: 900 }}>
        <h1 className="display-4 text-light">Devices</h1>
        <div className="d-flex justify-content-center flex-wrap mt-4">
          {devices.map(({
            id, name, temperature, active,
          }) => {
            const classes = classNames({ flipCard: true, 'is-flipped': flippedCard !== id });
            return (
              <div key={id} className="flipDevice mx-2 mb-4 rounded-circle zoom" >
                <div className={classes}>
                  <div onClick={() => cardClicked(id)} className="flipCard-front card text-center rounded-circle darkBg p-0 clickable shadow-sm deviceCard">
                    <div className="darkBg my-auto mx-3">
                      <div className="mx-1">
                        <button onClick={(e) => editClicked(e, id, true)} type="button" className="btn btn-md btn-outline-light btn-block">Edit</button>
                        <button onClick={(e) => deleteClicked(e, id, name, true)} type="button" className="btn btn btn-outline-danger btn-block">Delete</button>
                      </div>
                    </div>
                  </div>
                  <div onClick={() => cardClicked(id)} className="flipCard-front flipCard-back card text-center rounded-circle darkBg p-3 clickable shadow-sm deviceCard">
                    <div className="darkBg my-auto mx-3">
                      <p className="mx-0 mt-0 mb-1 text-light sammy-nowrap-2">{name}</p>
                      <h2 className="card-title text-light">{temperature ? `${temperature.toFixed(1)} °C` : 'N/A'}</h2>
                      <div onClick={(e) => e.stopPropagation()} className="fancySwitch mt-3 mx-auto">
                        <input onChange={() => switchEntity(id, name, !active, true)} type="checkbox" className="fancySwitch-checkbox" id={`cb-${id}`} checked={active} disabled={switchDisabled}/>
                        <label className="fancySwitch-label" htmlFor={`cb-${id}`}/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div onClick={() => addClicked(true)} className="card text-center rounded-circle darkBg p-0 clickable shadow-sm mx-2 mb-4 zoom deviceCard">
            <div className="darkBg my-auto mx-3">
              <span className="material-icons text-light text-muted addIcon">add</span>
            </div>
          </div>
        </div>
        <h1 className="display-4 text-light mt-3">Rules</h1>
        <div className="d-flex justify-content-center flex-wrap mt-4">
          {rules.map((rule) => {
            const {
              id, name, startTime, endTime, minTemp, maxTemp, activated, enabled,
            } = rule;
            const classes = classNames({ flipCard: true, 'is-flipped': flippedCard !== id });
            return (
              <div key={id} className="flipRule mx-2 mb-4 rounded-lg zoom" >
                <div className={classes}>
                  <div onClick={() => cardClicked(id)} className="flipCard-front card text-center rounded-lg darkBg p-0 clickable shadow-sm ruleCard">
                    <div className="darkBg my-auto mx-3">
                      <div className="mx-1">
                        <button onClick={(e) => editClicked(e, id, false)} type="button" className="btn btn-md btn-outline-light btn-block">Edit</button>
                        <button onClick={(e) => deleteClicked(e, id, name, false)} type="button" className="btn btn btn-outline-danger btn-block">Delete</button>
                      </div>
                    </div>
                  </div>
                  <div onClick={() => cardClicked(id)} className="flipCard-front flipCard-back card text-center rounded-lg darkBg p-2 shadow-sm clickable ruleCard" >
                    <div id={`miarak-${id}`} className="darkBg my-auto">
                      <h4 className="text-light mb-0 sammy-nowrap-2">{name}</h4>
                      {activated ? <p className="primaryText">ACTIVE</p> : <p className="primaryText text-muted">INACTIVE</p>}
                      <h5 className="text-light mt-4">{timeToString(startTime)} · {timeToString(endTime)}</h5>
                      <h5 className="text-light">{minTemp.toFixed(1)} °C · {maxTemp.toFixed(1)} °C</h5>
                      <p className="text-light text-muted mx-0 mb-0 mt-3">Measure:</p>
                      <h5 className="text-light mt-0 sammy-nowrap-2">{rule.measuringDevice.name}</h5>
                      <p className="text-light text-muted mx-0 mb-0 mt-3">Controlled:</p>
                      <h5 className="text-light mt-0 sammy-nowrap-2">{rule.controlDevice.name}</h5>
                      <div onClick={(e) => e.stopPropagation()} className="fancySwitch mx-auto mt-4">
                        <input onChange={() => switchEntity(id, name, !enabled, false)} type="checkbox" className="fancySwitch-checkbox" id={`cb-${id}`} checked={enabled} disabled={switchDisabled}/>
                        <label className="fancySwitch-label" htmlFor={`cb-${id}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div onClick={() => addClicked(false)} className="card text-center rounded-lg darkBg p-0 clickable shadow-sm mx-2 mb-4 zoom ruleCard">
            <div className="darkBg my-auto mx-3">
              <span className="material-icons text-light text-muted addIcon">add</span>
            </div>
          </div>
        </div>
        <ConfirmationDialog id="deletionDialog"
                            text={deletionDialog.text}
                            btnText="Delete"
                            btnType="danger"
                            btnHandler={deletionDialog.btnHandler}
                            isLoading={deletionDialog.isLoading}
                            errorMessage={deletionDialog.errorMessage}/>
        <MessageDialog id="messageDialog" text={msgDialog}/>
      </div>
    </div>
  );
};

export default Dashboard;
