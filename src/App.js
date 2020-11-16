import React from 'react';
import {
  BrowserRouter as Router, Route, Switch,
} from 'react-router-dom';
import Dashboard from './components/dashboard.jsx';
import DeviceForm from './components/device_form.jsx';
import ErrorPage from './components/error_page.jsx';

const App = () => (
  <Router>
    <Switch>
      <Route path="/addDevice">
        <DeviceForm isEdit={false}/>
      </Route>
      <Route exact path="/devices/:id">
        <h1>Device page</h1>
      </Route>
      <Route path="/devices/:id/edit">
        <DeviceForm isEdit={true}/>
      </Route>
      <Route exact path="/">
        <Dashboard />
      </Route>
      <Route path="*">
        <ErrorPage status={404} message="Not found." />
      </Route>
    </Switch>
  </Router>
);

export default App;
