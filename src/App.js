import React from 'react';
import {
  BrowserRouter as Router, Route, Switch,
} from 'react-router-dom';
import Dashboard from './components/dashboard.jsx';
import DeviceForm from './components/device_form.jsx';
import RuleForm from './components/rule_form.jsx';
import ErrorPage from './components/error_page.jsx';
import { APP_URL_PATH } from './constants';

const App = () => (
  <Router>
    <Switch>
      <Route path={`${APP_URL_PATH}addDevice`}>
        <DeviceForm isEdit={false}/>
      </Route>
      <Route path={`${APP_URL_PATH}addRule`}>
        <RuleForm isEdit={false}/>
      </Route>
      <Route path={`${APP_URL_PATH}devices/:id`}>
        <DeviceForm isEdit={true}/>
      </Route>
      <Route path={`${APP_URL_PATH}rules/:id`}>
        <RuleForm isEdit={true}/>
      </Route>
      <Route exact path={`${APP_URL_PATH}`}>
        <Dashboard />
      </Route>
      <Route path="*">
        <ErrorPage status={404} message="Not found." />
      </Route>
    </Switch>
  </Router>
);

export default App;
