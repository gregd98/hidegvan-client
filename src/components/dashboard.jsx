import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import { useHistory } from 'react-router-dom';
import { restGet } from '../communication';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [rules, setRules] = useState([]);
  const [socket, setSocket] = useState(null);

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

  const deviceClicked = (deviceId) => {
    history.push(`/devices/${deviceId}/edit`);
  };

  return (
    <div className="d-flex justify-content-center mt-4 text-center">
      <div style={{ width: 900 }}>
        <h1 className="display-4 text-light">Devices<button onClick={addDeviceClicked} type="button" className="btn btn-sm btn-outline-light ml-3">Add device</button></h1>
        <div className="d-flex justify-content-center flex-wrap mt-4">
          {devices.map((device) => (
            <div key={device.id} onClick={() => deviceClicked(device.id)} className="card text-center mx-2 mb-4 rounded-circle darkBg p-3 shadow clickable zoom" style={{ width: 188, maxWidth: 188 }}>
              <div className="card-body">
                <p className="mx-0 mt-0 mb-1 text-light sammy-nowrap-2">{device.name}</p>
                <h2 className="card-title text-light">{device.temperature.toFixed(1)} °C</h2>
                <div onClick={(e) => e.stopPropagation()} className="fancySwitch m-auto zoom">
                  <input onChange={() => console.log('change')} type="checkbox" className="fancySwitch-checkbox" id={`cb-${device.id}`} checked={device.active}/>
                  <label className="fancySwitch-label" htmlFor={`cb-${device.id}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <h1 className="display-4 text-light">Rules<button type="button" className="btn btn-sm btn-outline-light ml-3">Add rule</button></h1>
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
