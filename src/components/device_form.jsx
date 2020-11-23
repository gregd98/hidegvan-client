import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useCookies } from 'react-cookie';
import { deviceConstraints as rules } from '../constraints/deviceConstraints';
import { restGet, restPut, restPost } from '../utils/communication';
import { Input, trimDecorator } from './form_utils.jsx';
import ErrorPage from './error_page.jsx';
import LoadingPage from './loading_page.jsx';
import { SERVER_PATH } from '../constants';

const validate = require('validate.js');

const DeviceForm = (prop) => {
  const { isEdit } = prop;

  const editId = (useParams()).id;

  const [deviceName, setDeviceName] = useState({ value: '', error: '' });
  const [deviceId, setDeviceId] = useState({ value: '', error: '' });
  const [isMeasuring, setMeasuring] = useState(true);
  const [formDisabled, setFormDisabled] = useState(false);
  const [formError, setFormError] = useState('');

  const [pageError, setPageError] = useState({});
  const [isLoading, setLoading] = useState(false);

  const history = useHistory();
  const dispatch = useDispatch();
  const cookies = useCookies();
  const removeCookie = cookies[2];

  const setterDict = { name: setDeviceName, id: setDeviceId };

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      restGet(`${SERVER_PATH}api/devices/${editId}`, dispatch, removeCookie).then((result) => {
        const setData = (setter, value) => setter((rest) => ({ ...rest, value }));
        setData(setDeviceName, result.name);
        setData(setDeviceId, result.deviceId);
        setMeasuring(result.measuring);
        setLoading(false);
      }).catch((error) => {
        setPageError(error);
        setLoading(false);
      });
    }
  }, [isEdit, editId, dispatch, removeCookie]);

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

    const validation = validate({
      name: deviceName.value,
      id: deviceId.value,
    }, rules, { fullMessages: false });

    if (validation) {
      evaluateInputErrors(validation);
    } else {
      setFormDisabled(true);
      const body = { name: deviceName.value, deviceId: deviceId.value, isMeasuring };
      let methodFunc;
      if (isEdit) {
        body.id = editId;
        methodFunc = restPost;
      } else {
        methodFunc = restPut;
      }

      methodFunc(`${SERVER_PATH}api/devices`, body, dispatch, removeCookie).then(backToDashboard)
        .catch((error) => {
          setFormDisabled(false);
          if (error.inputErrors) {
            evaluateInputErrors(error.inputErrors);
          } else {
            console.log(`Error: ${error.message}`);
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
        <h1 className="display-4 text-light mt-4 text-center">{isEdit ? 'Edit' : 'Add'} device</h1>
        <form onSubmit={submitForm} className="mt-5">
          <div className="form-row">
            <div className="form-group col-md-6">
              <Input type="text"
                     id="inputDeviceName"
                     label="Device name"
                     state={deviceName}
                     setState={setDeviceName}
                     constraint={{ value: rules.name }}
                     decorators={[trimDecorator]}
                     disabled={formDisabled} />
            </div>
            <div className="form-group col-md-6">
              <Input type="text"
                     id="inputDeviceId"
                     label="Device ID"
                     state={deviceId}
                     setState={setDeviceId}
                     constraint={{ value: rules.id }}
                     decorators={[trimDecorator]}
                     disabled={formDisabled} />
            </div>
          </div>
          <div className="form-group">
            <p className="text-light text-center mb-2">Measuring device</p>
            <div onClick={(e) => e.stopPropagation()} className="fancySwitch m-auto">
              <input onChange={() => setMeasuring(!isMeasuring)} type="checkbox" className="fancySwitch-checkbox" id="mes" checked={isMeasuring} disabled={formDisabled}/>
              <label className="fancySwitch-label" htmlFor="mes" />
            </div>
          </div>
          <div className="d-flex justify-content-center mt-5">
            <div>
              <button type="submit" className="btn btn-light" disabled={formDisabled}>
                {formDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                {isEdit ? 'Edit' : 'Add'} device
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

export default DeviceForm;
