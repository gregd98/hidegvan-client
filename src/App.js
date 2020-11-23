import React from 'react';
import { useSelector } from 'react-redux';
import { useCookies } from 'react-cookie';
import {
  BrowserRouter as Router, Route, Switch, Redirect,
} from 'react-router-dom';
import Login from './components/login.jsx';
import Dashboard from './components/dashboard.jsx';
import DeviceForm from './components/device_form.jsx';
import RuleForm from './components/rule_form.jsx';
import ErrorPage from './components/error_page.jsx';
import { APP_URL_PATH } from './constants';

const App = () => {
  const loggedIn = useSelector((state) => state.user.loggedIn);

  const PrivateRoute = (input) => {
    const { children, ...rest } = input;
    const [cookie] = useCookies(['loggedin']);
    return <Route {...rest} render={() => ((cookie.loggedin === '1' || loggedIn) ? (children) : (<Redirect to={{ pathname: `${APP_URL_PATH}login` }} />))} />;
  };

  const PublicRoute = (input) => {
    const { children, ...rest } = input;
    return <Route {...rest} render={() => (loggedIn ? (<Redirect to={{ pathname: `${APP_URL_PATH}` }} />) : (children))} />;
  };

  return (
    <Router>
      <Switch>
        <PublicRoute path={`${APP_URL_PATH}login`}>
          <Login />
        </PublicRoute>
        <PrivateRoute path={`${APP_URL_PATH}add-device`}>
          <DeviceForm isEdit={false}/>
        </PrivateRoute>
        <PrivateRoute path={`${APP_URL_PATH}add-rule`}>
          <RuleForm isEdit={false}/>
        </PrivateRoute>
        <PrivateRoute path={`${APP_URL_PATH}devices/:id`}>
          <DeviceForm isEdit={true}/>
        </PrivateRoute>
        <PrivateRoute path={`${APP_URL_PATH}rules/:id`}>
          <RuleForm isEdit={true}/>
        </PrivateRoute>
        <PrivateRoute exact path={`${APP_URL_PATH}`}>
          <Dashboard />
        </PrivateRoute>
        <PublicRoute path="*">
          <ErrorPage status={404} message="Not found." />
        </PublicRoute>
      </Switch>
    </Router>
  );
};

export default App;
