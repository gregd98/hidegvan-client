import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import { useHistory } from 'react-router-dom';
import { restGet } from '../communication';

const classNames = require('classnames');

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [rules, setRules] = useState([]);
  const [socket, setSocket] = useState(null);
  const [flipped, setFlipped] = useState(null);

  const history = useHistory();

  useEffect(() => {
    restGet('http://localhost/api/devices').then((result) => {
      setDevices(result);
    }).catch((error) => {
      console.log(error.message);
    });
  }, []);

  useEffect(() => {
    restGet('http://localhost/api/rules').then((result) => {
      setRules(result);
    }).catch((error) => {
      console.log(error.message);
    });
  }, []);

  useEffect(() => {
    const so = socketIOClient('127.0.0.1');
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

  const deviceClicked = (id) => {
    setFlipped(flipped === id ? null : id);
  };

  const editClicked = (e, id) => {
    e.stopPropagation();
    history.push(`/devices/${id}/edit`);
  };

  const deleteClicked = (e, id) => {
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
            const classes = classNames({ flipCard: true, 'is-flipped': flipped !== id });
            return (
              <div key={id} className="flipCard-body mx-2 mb-4 rounded-circle zoom" >
                <div className={classes}>
                  <div onClick={() => deviceClicked(id)} className="flipCard-front card text-center rounded-circle darkBg p-0 clickable shadow" style={{ width: 188, height: 188, maxWidth: 188 }}>
                    <div className="darkBg my-auto mx-3">
                      <div className="mx-1">
                        <button onClick={(e) => editClicked(e, id)} type="button" className="btn btn-md btn-outline-light btn-block">Edit</button>
                        <button onClick={(e) => deleteClicked(e, id)} type="button" className="btn btn btn-outline-danger btn-block">Delete</button>
                      </div>
                    </div>
                  </div>
                  <div onClick={() => deviceClicked(id)} className="flipCard-front flipCard-back card text-center rounded-circle darkBg p-3 clickable shadow" style={{ width: 188, height: 188, maxWidth: 188 }}>
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
          <div onClick={addDeviceClicked} className="card text-center rounded-circle darkBg p-0 clickable shadow mx-2 mb-4 zoom" style={{ width: 188, height: 188, maxWidth: 188 }}>
            <div className="darkBg my-auto mx-3">
              <span className="material-icons text-light text-muted addIcon">add</span>
            </div>
          </div>
        </div>
        <h1 className="display-4 text-light mt-3">Rules<button type="button" className="btn btn-sm btn-outline-light ml-3">Add rule</button></h1>
        <div className="d-flex justify-content-center flex-wrap mt-4">
          {rules.map((rule) => (
            <div key={rule.id} onClick={() => console.log('click')} className="card text-center rounded-lg darkBg mx-2 mb-4 shadow clickable zoom" style={{ width: 188, maxWidth: 188 }}>
              <div className="card-body">
                <h4 className="text-light mb-0">{rule.name}</h4>
                {rule.activated && <p className="primaryText">Active now</p>}
                <h5 className="text-light mt-4">{timeToString(rule.startTime)} · {timeToString(rule.endTime)}</h5>
                <h5 className="text-light">{rule.minTemp.toFixed(1)} °C · {rule.maxTemp.toFixed(1)} °C</h5>
                <p className="text-light text-muted mx-0 mb-0 mt-3">Measure:</p>
                <h5 className="text-light mt-0">Device name</h5>
                <p className="text-light text-muted mx-0 mb-0 mt-3">Control:</p>
                <h5 className="text-light mt-0">Device name</h5>
                <div onClick={(e) => e.stopPropagation()} className="fancySwitch mx-auto mt-4 zoom">
                  <input onChange={() => console.log('change')} type="checkbox" className="fancySwitch-checkbox" id={'cb-nana'} checked={rule.enabled}/>
                  <label className="fancySwitch-label" htmlFor={'cb-nana'} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
