import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import { useHistory } from 'react-router-dom';
import { restGet } from '../communication';
import { SERVER_PATH } from '../constants';

const classNames = require('classnames');

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [rules, setRules] = useState([]);
  const [socket, setSocket] = useState(null);
  const [flippedCard, setFlippedCard] = useState(null);

  const history = useHistory();

  useEffect(() => {
    restGet(`${SERVER_PATH}api/devices`).then((result) => {
      setDevices(result);
    }).catch((error) => {
      console.log(error.message);
    });
  }, []);

  useEffect(() => {
    restGet(`${SERVER_PATH}api/rules`).then((result) => {
      setRules(result);
    }).catch((error) => {
      console.log(error.message);
    });
  }, []);

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
      socket.on('device update', (payload) => setDevices(payload));
    }
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.on('rule update', (payload) => setRules(payload));
    }
  }, [socket]);

  const pad = (num) => (num < 10 ? `0${num}` : num);
  const timeToString = (time) => `${pad(Math.trunc(time / 60))}:${pad(time % 60)}`;

  const addDeviceClicked = () => {
    history.push('/addDevice');
  };

  const addRuleClicked = () => {
    history.push('/addRule');
  };

  const cardClicked = (id) => {
    setFlippedCard(flippedCard === id ? null : id);
  };

  const editDeviceClicked = (e, id) => {
    e.stopPropagation();
    history.push(`/devices/${id}`);
  };

  const deleteDeviceClicked = (e, id) => {
    e.stopPropagation();
    console.log(`Delete clicked: ${id}`);
  };

  const editRuleClicked = (e, id) => {
    e.stopPropagation();
    history.push(`/rules/${id}`);
  };

  const deleteRuleClicked = (e, id) => {
    e.stopPropagation();
    console.log(`Delete clicked: ${id}`);
  };

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
                        <button onClick={(e) => editDeviceClicked(e, id)} type="button" className="btn btn-md btn-outline-light btn-block">Edit</button>
                        <button onClick={(e) => deleteDeviceClicked(e, id)} type="button" className="btn btn btn-outline-danger btn-block">Delete</button>
                      </div>
                    </div>
                  </div>
                  <div onClick={() => cardClicked(id)} className="flipCard-front flipCard-back card text-center rounded-circle darkBg p-3 clickable shadow-sm deviceCard">
                    <div className="darkBg my-auto mx-3">
                      <p className="mx-0 mt-0 mb-1 text-light sammy-nowrap-2">{name}</p>
                      <h2 className="card-title text-light">{temperature ? `${temperature.toFixed(1)} °C` : 'N/A'}</h2>
                      <div onClick={(e) => e.stopPropagation()} className="fancySwitch mt-3 mx-auto">
                        <input onChange={() => console.log('change')} type="checkbox" className="fancySwitch-checkbox" id={`cb-${id}`} checked={active}/>
                        <label className="fancySwitch-label" htmlFor={`cb-${id}`}/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div onClick={addDeviceClicked} className="card text-center rounded-circle darkBg p-0 clickable shadow-sm mx-2 mb-4 zoom deviceCard">
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
                        <button onClick={(e) => editRuleClicked(e, id)} type="button" className="btn btn-md btn-outline-light btn-block">Edit</button>
                        <button onClick={(e) => deleteRuleClicked(e, id)} type="button" className="btn btn btn-outline-danger btn-block">Delete</button>
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
                        <input onChange={() => console.log('change')} type="checkbox" className="fancySwitch-checkbox" id={`cb-${id}`} checked={enabled}/>
                        <label className="fancySwitch-label" htmlFor={`cb-${id}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div onClick={addRuleClicked} className="card text-center rounded-lg darkBg p-0 clickable shadow-sm mx-2 mb-4 zoom ruleCard">
            <div className="darkBg my-auto mx-3">
              <span className="material-icons text-light text-muted addIcon">add</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
