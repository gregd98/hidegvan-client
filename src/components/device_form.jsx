import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { deviceConstraints as rules } from '../constraints/deviceContraints';
import { restGet, restPut, restPost } from '../communication';
import ErrorPage from './error_page.jsx';
import LoadingPage from './loading_page.jsx';

const  classNames = require('classnames');
const validate = require('validate.js');

const trimDecorator = (value) => value.trim();

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

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      restGet(`http://localhost/api/devices/${editId}`).then((result) => {
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
  }, [isEdit, editId]);

  const backToDashboard = () => {
    history.replace('/');
  };

  const submitForm = (event) => {
    event.preventDefault();
    setFormError('');
    const evaluateInputErrors = (errors) => {
      const setterDict = { name: setDeviceName, id: setDeviceId };
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

      methodFunc('http://localhost/api/devices', body).then(() => {
        backToDashboard();
      }).catch((error) => {
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
    <div className="d-flex justify-content-center text-center mx-2">
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
            <p className="text-light mb-2">Measuring device</p>
            <div onClick={(e) => e.stopPropagation()} className="fancySwitch m-auto">
              <input onChange={() => setMeasuring(!isMeasuring)} type="checkbox" className="fancySwitch-checkbox" id="mes" checked={isMeasuring} disabled={formDisabled}/>
              <label className="fancySwitch-label" htmlFor="mes" />
            </div>
          </div>
        </form>
        <div className="d-flex justify-content-center mt-5">
          <div>
            <button onClick={submitForm} type="submit" className="btn btn-light" disabled={formDisabled}>
              {formDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
              {isEdit ? 'Edit' : 'Add'} device
            </button>
            <button onClick={backToDashboard} type="button" className="btn btn-outline-light ml-2" disabled={formDisabled}>Cancel</button>
          </div>
        </div>
        {formError && <div className="alert alert-danger mt-5" role="alert">{formError}</div>}
      </div>
    </div>
  );
};

const Input = (prop) => {
  const {
    type, id, label, state, setState, decorators, constraint, disabled,
  } = prop;

  const handleInputChange = (event) => {
    const { value } = event.target;
    setState((rest) => ({ ...rest, value, error: '' }));
  };

  const handleBlur = () => {
    let { value } = state;
    if (decorators) {
      for (let i = 0; i < decorators.length; i += 1) {
        value = decorators[i](value);
      }
      setState((rest) => ({ ...rest, value }));
    }
    const validation = validate({ value }, constraint, { fullMessages: false });
    if (validation) {
      setState((rest) => ({ ...rest, error: validation.value[0] }));
    }
  };

  const classes = classNames({
    'form-control': true,
    'is-invalid': state.error,
  });

  return (
    <React.Fragment>
      <label className="text-light" htmlFor={id}>{label}</label>
      <input onChange={handleInputChange} onBlur={handleBlur} type={type}
             className={classes} id={id} placeholder={label}
             value={state.value} disabled={disabled}/>
      {!disabled && state.error && <div className="invalid-feedback">{state.error}</div>}
    </React.Fragment>
  );
};

export default DeviceForm;
