import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import socketIOClient from 'socket.io-client';
import { restGet } from '../utils/communication';
import { SERVER_PATH } from '../constants';
import { loadStatistics } from '../actions/statisticActions';
import { Input, SelectInput } from './form_utils.jsx';

const moment = require('moment');
const validate = require('validate.js');

const Statistics = () => {
  const devices = useSelector((state) => state.statistics.devices);
  const [socketUpdate, setSocketUpdate] = useState(null);
  const [lastTime, setLastTime] = useState(3600000 * 6);

  const [lastFormDisabled, setLastFormDisabled] = useState(false);
  const [lastFormError, setLastFormError] = useState('');
  const [quantity, setQuantity] = useState({ value: '6', error: '' });
  const [unit, setUnit] = useState({
    options: [
      { id: 'hours', name: 'hours' },
      { id: 'days', name: 'days' },
      { id: 'weeks', name: 'weeks' },
      { id: 'months', name: 'months' },
      { id: 'years', name: 'years' },
    ],
    selectedId: 'hours',
    error: '',
  });

  const [intervalFormDisabled, setIntervalFormDisabled] = useState(false);
  const [intervalFormError, setIntervalFormError] = useState('');
  const [firstDate, setFirstDate] = useState({ value: '', time: '', error: '' });
  const [lastDate, setLastDate] = useState({ value: '', time: '', error: '' });

  const [isInter, setInter] = useState(false);

  const [socket, setSocket] = useState(null);

  const dispatch = useDispatch();
  const cookies = useCookies();
  const removeCookie = cookies[2];
  const history = useHistory();

  const offset = (new Date()).getTimezoneOffset() * 60000;

  const setterDict = {
    firstDate: setFirstDate,
    lastDate: setLastDate,
    quantity: setQuantity,
    unit: setUnit,
  };

  const required = { allowEmpty: false, message: 'This field is required.' };
  const constraints = {
    lastConstraint: {
      quantity: {
        presence: required,
      },
      unit: {
        presence: required,
        selector: true,
      },
    },
    intervalConstraint: {
      firstDate: {
        presence: required,
        validDate: true,
      },
      lastDate: {
        presence: required,
        validDate: true,
        dateDiff: true,
      },
    },
  };

  validate.validators.selector = (value) => {
    if (!value) {
      return 'This field is required.';
    }
    return undefined;
  };

  validate.validators.validDate = (value) => {
    if ((moment(new Date(value))).isValid()) {
      return undefined;
    }
    return 'Enter a valid date.';
  };

  validate.validators.dateDiff = (value) => {
    if ((new Date(value)).getTime() >= (new Date(firstDate.value)).getTime()) {
      return undefined;
    }
    return 'Last date must be larger or equal than first date.';
  };

  useEffect(() => {
    document.title = 'Statistics';
  }, []);

  useEffect(() => {
    restGet(`${SERVER_PATH}api/temperatures?lastTime=${3600000 * 6}`, dispatch, removeCookie).then((result) => {
      dispatch(loadStatistics(result));
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
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
      socket.on('temperature update', (payload) => {
        setSocketUpdate(payload);
      });
    }
  }, [dispatch, socket]);

  useEffect(() => {
    if (socketUpdate !== null) {
      const newList = devices.map((item) => {
        if (item.id !== socketUpdate.deviceId) {
          return item;
        }
        let temperatures = [...(item.temperatures)];
        temperatures.push(socketUpdate.temperature);
        if (isInter) {
          temperatures = temperatures.filter(
            (temp) => temp[0] >= (new Date(firstDate.value)).getTime()
              && temp[0] < (new Date(lastDate.value)).getTime() + 86400000,
          );
        } else {
          const currentTime = (new Date()).getTime();
          temperatures = temperatures.filter((temp) => currentTime - temp[0] <= lastTime);
        }
        return { id: item.id, name: item.name, temperatures };
      });
      dispatch(loadStatistics(newList));
      setSocketUpdate(null);
    }
  }, [devices, dispatch, firstDate.value, isInter, lastDate.value, lastTime, socketUpdate]);

  const applyClicked = (isInterval) => {
    setInter(isInterval);
    const evaluateInputErrors = (errors) => {
      Object.entries(errors).forEach(([key, value]) => {
        setterDict[key]((rest) => ({ ...rest, error: value[0] }));
      });
    };
    const setFormDisabled = isInterval ? setIntervalFormDisabled : setLastFormDisabled;
    const setFormError = isInterval ? setIntervalFormError : setLastFormError;
    const update = (a, b) => {
      setFormError('');
      setFormDisabled(true);
      const query = !isInterval ? `lastTime=${a}` : `firstDate=${a + offset}&lastDate=${b + offset}`;
      restGet(`${SERVER_PATH}api/temperatures?${query}`, dispatch, removeCookie).then((result) => {
        dispatch(loadStatistics(result));
        setFormDisabled(false);
      }).catch((error) => {
        if (error.inputErrors) {
          evaluateInputErrors(error.inputErrors);
        } else {
          setFormError(`Error: ${error.message}`);
        }
        setFormDisabled(false);
      });
    };

    if (isInterval) {
      const body = {
        firstDate: firstDate.value,
        lastDate: lastDate.value,
      };
      const validation = validate(body, constraints.intervalConstraint, { fullMessages: false });
      if (validation) {
        evaluateInputErrors(validation);
      } else {
        const getNum = (time) => (new Date(time)).getTime();
        const setDate = (date, setter) => setter(
          (rest) => ({ ...rest, time: getNum(date) }),
        );
        setDate(firstDate.value, setFirstDate);
        setDate(lastDate.value, setLastDate);
        update(getNum(firstDate.value), getNum(lastDate.value));
      }
    } else {
      const body = {
        quantity: quantity.value,
        unit: unit.selectedId,
      };

      const validation = validate(body, constraints.lastConstraint, { fullMessages: false });
      if (validation) {
        evaluateInputErrors(validation);
      } else {
        const n = parseInt(quantity.value, 10);
        if (!Number.isNaN(n)) {
          const getMultiplier = () => {
            switch (unit.selectedId) {
              case 'hours': default: return 3600000;
              case 'days': return 86400000;
              case 'weeks': return 604800000;
              case 'months': return 2630016000;
              case 'years': return 31556952000;
            }
          };
          const sum = n * getMultiplier();
          setLastTime(sum);
          update(sum);
        }
      }
    }
  };

  const downloadFile = (deviceId, name, type) => {
    const objToText = (content) => JSON.stringify(content, null, 2);
    let content = devices.map(
      (device) => ({
        id: device.id,
        name: device.name,
        temperatures: device.temperatures.map((item) => [new Date(item[0]), item[1]]),
        states: device.states.map((item) => [new Date(item[0]), item[1]]),
      }),
    ).find((device) => device.id === deviceId);
    let fileName = isInter
      ? `${name}_between_${(moment(firstDate.time)).format('YYYY-MM-DD')}_${(moment(lastDate.time)).format('YYYY-MM-DD')}`
      : `${name}_${(moment()).format('YYYY-MM-DD_HH-mm')}_last_${Math.floor(lastTime / 3600000)}_hours`;
    switch (type) {
      case 'json':
        content = objToText(content);
        fileName = `${fileName}.json`;
        break;
      case 'txt':
        content = objToText(content);
        fileName = `${fileName}.txt`;
        break;
      default:
        content = objToText(content);
        fileName = `${fileName}.json`;
        break;
    }

    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <React.Fragment>
      <nav className="navbar navbar-light fixed-top mt-2 p-0 mr-2" style={{ background: 'transparent' }}>
        <span />
        <span onClick={() => history.replace('/')} className="material-icons text-light text-light statIcon clickable float-right p-0 mr-2">dashboard</span>
      </nav>
    <h1 className="display-4 text-light mt-4 mb-4 text-center">Statistics</h1>
    <div className="d-flex justify-content-center">
      <div style={{ width: 900, maxWidth: 900 }}>
        <form className="mx-2">
          <div className="d-flex justify-content-center flex-wrap">
              <div className="card darkBg rounded-lg shadow-sm mx-2 my-2 col-md-4">
                <div className="card-body px-0">
                  <h4 className="card-title text-light text-center mb-3">The last</h4>
                  <div className="form-row mr-2">
                    <div className="form-group col-md-6">
                      <Input type="number"
                             id="inputQuantity"
                             label="Quantity"
                             constraint={{ value: constraints.lastConstraint.quantity }}
                             disabled={lastFormDisabled}
                             state={quantity}
                             setState={setQuantity}/>
                    </div>
                    <div className="form-group col-md-6">
                      <SelectInput id="inputUnit"
                                   label="Unit"
                                   constraint={{ value: constraints.lastConstraint.unit }}
                                   disabled={lastFormDisabled}
                                   state={unit}
                                   setState={setUnit} />
                    </div>
                    <button onClick={() => applyClicked(false)} type="button" className="btn btn-outline-light mx-auto" disabled={lastFormDisabled}>
                      {lastFormDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                      Apply
                    </button>
                  </div>
                  {lastFormError && <div className="alert alert-danger mt-3" role="alert">{lastFormError}</div>}
                </div>
              </div>
            <div className="card darkBg rounded-lg shadow-sm mx-2 my-2 col-md-7">
              <div className="card-body px-0">
                <h4 className="card-title text-light text-center mb-3">Interval</h4>
              <div className="form-row">
                <div className="form-group col-md-6">
                  <Input type="date"
                         id="inputFirstDate"
                         label="First date"
                         constraint={{ value: constraints.intervalConstraint.firstDate }}
                         disabled={intervalFormDisabled}
                         state={firstDate}
                         setState={setFirstDate} />
                </div>
                <div className="form-group col-md-6">
                  <Input type="date"
                         id="inputLastDate"
                         label="Last date"
                         constraint={{ value: constraints.intervalConstraint.lastDate }}
                         disabled={intervalFormDisabled}
                         state={lastDate}
                         setState={setLastDate} />
                </div>
                <button onClick={() => applyClicked(true)} type="button" className="btn btn-outline-light mx-auto" disabled={intervalFormDisabled}>
                  {intervalFormDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                  Apply
                </button>
              </div>
                {intervalFormError && <div className="alert alert-danger mt-3" role="alert">{intervalFormError}</div>}
              </div>
            </div>
          </div>
        </form>
      <div className="d-flex justify-content-center flex-wrap mt-2 text-center">
        {devices.length > 0 && devices.map((device) => (
            <div key={device.id} className="card rounded-lg darkBg p-0 clickable shadow-sm mt-4 mx-2" style={{ width: 400, maxWidth: 400, height: 300 }}>
              <div className="darkBg mx-3 mb-4 mt-4">
                <h4 className="text-light m-0 p-0 mb-2 font-weight-bold" style={{ fontSize: 20 }}>
                  {device.name}
                  <div className="btn-group ml-2" role="group">
                    <button id="downloadGroup" type="button" className="btn btn-sm btn-outline-light dropdown-toggle"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      Download
                    </button>
                    <div className="dropdown-menu" aria-labelledby="downloadGroup">
                      <button type="button" className="btn btn-sm btn-link dropdown-item" onClick={() => downloadFile(device.id, device.name, 'json')}>json</button>
                      <button type="button" className="btn btn-sm btn-link dropdown-item" onClick={() => downloadFile(device.id, device.name, 'txt')}>txt</button>
                    </div>
                  </div>
                </h4>
                {device.temperatures.length > 0 ? (
                  <Chart
                    width={'100%'}
                    height={'200px'}
                    chartType="LineChart"
                    loader={<div>Kecske</div>}
                    data={[
                      ['x', 'temperature'],
                      ...(device.temperatures.map((temp) => [new Date(temp[0]), temp[1]])),
                    ]}
                    options={{
                      backgroundColor: {
                        fill: 'transparent',
                      },
                      hAxis: {
                        gridlines: {
                          color: 'transparent',
                        },
                        textStyle: {
                          color: 'white',
                        },
                        units: {
                          days: { format: ['MMM dd'] },
                          hours: { format: ['HH:mm', 'ha'] },
                        },
                      },
                      vAxis: {
                        gridlines: {
                          color: '#404142',
                        },
                        baselineColor: '#242526',
                        textStyle: {
                          color: 'white',
                        },
                      },
                      legend: { position: 'none' },
                      chartArea: {
                        width: '80%',
                        height: '80%',
                      },
                      colors: ['#80DEEA'],
                    }}
                    rootProps={{ 'data-testid': '1' }}
                  />
                ) : (
                  <p className="text-light text-muted">No data</p>
                )}
              </div>
            </div>
        ))}
      </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default Statistics;
