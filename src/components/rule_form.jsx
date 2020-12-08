import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useCookies } from 'react-cookie';
import { useHistory, useParams } from 'react-router-dom';
import {
  Input, roundDecorator, SelectInput, trimDecorator,
} from './form_utils.jsx';
import ErrorPage from './error_page.jsx';
import LoadingPage from './loading_page.jsx';
import { ruleConstraints as rules } from '../constraints/ruleConstraints';
import { restGet, restPost, restPut } from '../utils/communication';
import { SERVER_PATH } from '../constants';
import { needToLoad } from '../actions/deviceActions';

const validate = require('validate.js');

const RuleForm = (prop) => {
  const { isEdit } = prop;

  const editId = (useParams()).id;

  const [ruleName, setRuleName] = useState({ value: '', error: '' });
  const [startTime, setStartTime] = useState({ value: '', error: '' });
  const [endTime, setEndTime] = useState({ value: '', error: '' });
  const [minTemp, setMinTemp] = useState({ value: '', error: '' });
  const [maxTemp, setMaxTemp] = useState({ value: '', error: '' });
  const [measuringDevice, setMeasuringDevice] = useState({ options: [], selectedId: null, error: '' });
  const [controlDevice, setControlDevice] = useState({ options: [], selectedId: null, error: '' });

  const [formDisabled, setFormDisabled] = useState(false);
  const [formError, setFormError] = useState('');

  const [pageError, setPageError] = useState({});
  const [isLoading, setLoading] = useState(false);

  const history = useHistory();
  const dispatch = useDispatch();
  const cookies = useCookies();
  const removeCookie = cookies[2];

  useEffect(() => {
    document.title = `${isEdit ? 'Edit' : 'Add'} rule`;
  }, [isEdit]);

  useEffect(() => {
    const pad = (num) => (num < 10 ? `0${num}` : num);
    const timeToString = (time) => `${pad(Math.trunc(time / 60))}:${pad(time % 60)}`;
    (async () => {
      try {
        const devices = await restGet(`${SERVER_PATH}api/devices`, dispatch, removeCookie);
        const setData = (setter, options) => setter((rest) => ({ ...rest, options }));
        setData(setMeasuringDevice, devices
          .filter((device) => device.measuring === true)
          .map((item) => ({ id: item.id, name: item.name })));
        setData(setControlDevice, devices.map((item) => ({ id: item.id, name: item.name })));
        if (isEdit) {
          const rule = await restGet(`${SERVER_PATH}api/rules/${editId}`, dispatch, removeCookie);
          const setRuleData = (setter, value) => setter((rest) => ({ ...rest, value }));
          const setSelectorId = (setter, selectedId) => setter((rest) => ({ ...rest, selectedId }));
          setRuleData(setRuleName, rule.name);
          setRuleData(setStartTime, timeToString(rule.startTime));
          setRuleData(setEndTime, timeToString(rule.endTime));
          setRuleData(setMinTemp, rule.minTemp);
          setRuleData(setMaxTemp, rule.maxTemp);
          setSelectorId(setMeasuringDevice, rule.measuringDevice);
          setSelectorId(setControlDevice, rule.controlDevice);
        }
        setLoading(false);
      } catch (error) {
        setPageError(error);
        setLoading(false);
      }
    })();
    setLoading(true);
  }, [removeCookie, dispatch, editId, isEdit]);

  const setterDict = {
    name: setRuleName,
    startTime: setStartTime,
    endTime: setEndTime,
    minTemp: setMinTemp,
    maxTemp: setMaxTemp,
    measuringDevice: setMeasuringDevice,
    controlDevice: setControlDevice,
  };

  validate.validators.selector = (value) => {
    if (!value) {
      return 'This field is required.';
    }
    return undefined;
  };

  validate.validators.tempCompare = (value) => {
    const min = parseFloat(minTemp.value);
    const max = parseFloat(value);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      return undefined;
    }
    if (max < min) {
      return 'Maximum temperature must be greater than or equal to minimum temperature.';
    }
    return undefined;
  };

  const backToDashboard = () => {
    history.replace('/');
  };

  const submitForm = (event) => {
    event.preventDefault();
    setFormError('');
    const evaluateInputErrors = (errors) => {
      Object.entries(errors).forEach(([key, value]) => {
        setterDict[key]((rest) => ({ ...rest, error: value[0] }));
      });
    };

    const body = {
      name: ruleName.value,
      startTime: startTime.value,
      endTime: endTime.value,
      minTemp: minTemp.value,
      maxTemp: maxTemp.value,
      measuringDevice: measuringDevice.selectedId,
      controlDevice: controlDevice.selectedId,
    };

    const validation = validate(body, rules, { fullMessages: false });
    if (validation) {
      evaluateInputErrors(validation);
    } else {
      setFormDisabled(true);
      body.minTemp = Math.round(parseFloat(body.minTemp) * 10) / 10;
      body.maxTemp = Math.round(parseFloat(body.maxTemp) * 10) / 10;
      let methodFunc;
      if (isEdit) {
        body.id = editId;
        methodFunc = restPost;
      } else {
        methodFunc = restPut;
      }

      methodFunc(`${SERVER_PATH}api/rules`, body, dispatch, removeCookie).then(() => {
        dispatch(needToLoad());
        backToDashboard();
      })
        .catch((error) => {
          setFormDisabled(false);
          if (error.inputErrors) {
            evaluateInputErrors(error.inputErrors);
          } else {
            setFormError(`Error: ${error.message}`);
          }
        });
    }
  };

  if (pageError.message) {
    return <ErrorPage status={pageError.status} message={pageError.message} />;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="d-flex justify-content-center mb-4 mx-2">
      <div style={{ width: 500 }}>
        <h1 className="display-4 text-light mt-4 text-center">{isEdit ? 'Edit' : 'Add'} rule</h1>
        <form onSubmit={submitForm} className="mt-5">
          <div className="form-group">
            <Input type="text"
                   id="inputRuleName"
                   label="Rule name"
                   state={ruleName}
                   setState={setRuleName}
                   constraint={{ value: rules.name }}
                   decorators={[trimDecorator]}
                   disabled={formDisabled} />
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <Input type="time"
                     id="inputStartTime"
                     label="Start time"
                     state={startTime}
                     setState={setStartTime}
                     constraint={{ value: rules.startTime }}
                     decorators={[]}
                     disabled={formDisabled} />
            </div>
            <div className="form-group col-md-6">
              <Input type="time"
                     id="inputEndTime"
                     label="End time"
                     state={endTime}
                     setState={setEndTime}
                     constraint={{ value: rules.endTime }}
                     decorators={[]}
                     disabled={formDisabled} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <Input type="number"
                     id="inputMinTemp"
                     label="Minimum temperature"
                     state={minTemp}
                     setState={setMinTemp}
                     constraint={{ value: rules.minTemp }}
                     decorators={[roundDecorator]}
                     disabled={formDisabled} />
            </div>
            <div className="form-group col-md-6">
              <Input type="number"
                     id="inputMaxTemp"
                     label="Maximum temperature"
                     state={maxTemp}
                     setState={setMaxTemp}
                     constraint={{ value: rules.maxTemp }}
                     decorators={[roundDecorator]}
                     disabled={formDisabled} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <SelectInput id="inputMeasureDevice"
                           label="Measuring device"
                           state={measuringDevice}
                           setState={setMeasuringDevice}
                           constraint={{ value: rules.measuringDevice }}
                           disabled={formDisabled} />
            </div>
            <div className="form-group col-md-6">
              <SelectInput id="inputControlDevice"
                           label="Controlled device"
                           state={controlDevice}
                           setState={setControlDevice}
                           constraint={{ value: rules.controlDevice }}
                           disabled={formDisabled} />
            </div>
          </div>
          <div className="d-flex justify-content-center mt-5">
            <div>
              <button type="submit" className="btn btn-light" disabled={formDisabled}>
                {formDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                {isEdit ? 'Edit' : 'Add'} rule
              </button>
              <button onClick={backToDashboard} type="button" className="btn btn-outline-light ml-2" disabled={formDisabled}>Cancel</button>
            </div>
          </div>
        </form>
        {formError && <div className="alert alert-danger mt-5" role="alert">{formError}</div>}
      </div>
    </div>
  );
};

export default RuleForm;
