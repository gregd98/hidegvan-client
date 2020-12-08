import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCookies } from 'react-cookie';
import { Input, trimDecorator } from './form_utils.jsx';
import { loginConstraints as loginRules } from '../constraints/loginConstraints';
import { signupConstraints as signupRules } from '../constraints/signupConstraints';
import { restGet, restPut } from '../utils/communication';
import { SERVER_PATH } from '../constants';
import { logIn } from '../actions/userActions';
import calculatePasswordStrength from '../utils/password';

const validate = require('validate.js');

const Login = () => {
  const [username, setUsername] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });
  const [formDisabled, setFormDisabled] = useState(false);
  const [formError, setFormError] = useState('');
  const [signup, setSignup] = useState(false);

  const dispatch = useDispatch();
  const cookies = useCookies();
  const setCookie = cookies[1];
  const removeCookie = cookies[2];

  const setterDict = {
    username: setUsername,
    password: setPassword,
    confirmPassword: setConfirmPassword,
  };

  validate.validators.password = (value) => (calculatePasswordStrength(value) < 2 ? 'The password must contain at least two character categories among the following: uppercase characters, lowercase characters, digits, special characters.' : undefined);
  validate.validators.confirmPassword = (value) => (value !== password.value ? 'Password doesn\'t match.' : undefined);

  useEffect(() => {
    document.title = 'Log in';
  }, []);

  useEffect(() => {
    restGet(`${SERVER_PATH}api/logged-in`, dispatch, removeCookie).then((response) => {
      if (response.loggedIn) {
        dispatch(logIn());
      } else if (!response.haveUsers) {
        setSignup(true);
      }
    });
  }, [dispatch, removeCookie]);

  const evaluateInputErrors = (errors) => {
    Object.entries(errors).forEach(([key, value]) => {
      setterDict[key]((rest) => ({ ...rest, error: value[0] }));
    });
  };

  const submitLoginForm = (e) => {
    e.preventDefault();
    setFormError('');
    const body = { username: username.value, password: password.value };
    const validation = validate(body, loginRules, { fullMessages: false });
    if (validation) {
      evaluateInputErrors(validation);
    } else {
      setFormDisabled(true);
      restPut(`${SERVER_PATH}api/login`, body, dispatch, removeCookie).then(() => {
        setCookie('loggedin', '1', { path: '/' });
        dispatch(logIn());
      }).catch((error) => {
        setFormDisabled(false);
        if (error.inputErrors) {
          evaluateInputErrors(error.inputErrors);
        } else {
          setFormError(error.message);
        }
      });
    }
  };

  const submitSignupForm = (e) => {
    e.preventDefault();
    setFormError('');
    const body = {
      username: username.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    };
    const validation = validate(body, signupRules, { fullMessages: false });
    if (validation) {
      evaluateInputErrors(validation);
    } else {
      setFormDisabled(true);
      restPut(`${SERVER_PATH}api/signup`, body, dispatch, removeCookie).then(() => {
        window.location.reload();
      }).catch((error) => {
        setFormDisabled(false);
        if (error.inputErrors) {
          evaluateInputErrors(error.inputErrors);
        } else {
          setFormError(error.message);
        }
      });
    }
  };

  if (signup) {
    return (
      <div className="d-flex justify-content-center mb-4 mx-2">
        <div style={{ width: 500 }}>
          <h1 className="display-4 text-light mt-4 text-center">Sign Up</h1>
          <form onSubmit={submitSignupForm} className="mt-5">
            <div className="form-group">
              <Input type="text"
                     id="inputUsername"
                     label="Username"
                     state={username}
                     setState={setUsername}
                     constraint={{ value: signupRules.username }}
                     decorators={[trimDecorator]}
                     disabled={formDisabled} />
            </div>
            <div className="form-row">
              <div className="form-group col-md-6">
                <Input type="password"
                       id="inputPassword"
                       label="Password"
                       state={password}
                       setState={setPassword}
                       constraint={{ value: signupRules.password }}
                       decorators={[]}
                       disabled={formDisabled} />
              </div>
              <div className="form-group col-md-6">
                <Input type="password"
                       id="inputConfirmPassword"
                       label="Confirm password"
                       state={confirmPassword}
                       setState={setConfirmPassword}
                       constraint={{ value: signupRules.confirmPassword }}
                       decorators={[]}
                       disabled={formDisabled} />
              </div>
            </div>
            <div className="d-flex justify-content-center mt-5">
              <button type="submit" className="btn btn-light" disabled={formDisabled}>
                {formDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                Log In
              </button>
            </div>
          </form>
          {formError && <div className="alert alert-danger mt-5" role="alert">{formError}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="d-flex justify-content-center mb-4 mx-2">
      <div style={{ width: 500 }}>
        <h1 className="display-4 text-light mt-4 text-center">Log In</h1>
        <form onSubmit={submitLoginForm} className="mt-5">
          <div className="form-row">
            <div className="form-group col-md-6">
              <Input type="text"
                     id="inputUsername"
                     label="Username"
                     state={username}
                     setState={setUsername}
                     constraint={{ value: loginRules.username }}
                     decorators={[]}
                     disabled={formDisabled} />
            </div>
            <div className="form-group col-md-6">
              <Input type="password"
                     id="inputPassword"
                     label="Password"
                     state={password}
                     setState={setPassword}
                     constraint={{ value: loginRules.password }}
                     decorators={[]}
                     disabled={formDisabled} />
            </div>
          </div>
          <div className="d-flex justify-content-center mt-5">
            <button type="submit" className="btn btn-light" disabled={formDisabled}>
              {formDisabled && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
              Log In
            </button>
          </div>
        </form>
        {formError && <div className="alert alert-danger mt-5" role="alert">{formError}</div>}
      </div>
    </div>
  );
};

export default Login;
