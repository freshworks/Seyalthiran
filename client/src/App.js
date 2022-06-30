import React from 'react';
import { Router, Switch, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import NavBar from './components/layout/NavBar';
import { createBrowserHistory } from 'history';
import CreateSwarmPage from './components/pages/CreateSwarmPage';
import SwarmReportPage from './components/pages/SwarmReportPage';
import CompareReportsPage from './components/pages/CompareReportsPage';
import SwarmInitiationPage from './components/pages/SwarmInitiationPage';
import SwarmStatus from './components/pages/SwarmStatusPage';
import LiveSwarmPage from './components/pages/LiveSwarmPage';
export const history = createBrowserHistory();

function App() {
  return (
    <Router history={history}>
      <div className="App">
        <NavBar />
        <Switch>
          <Route exact path="/" component={LandingPage} />
          <Route path="/swarmInit" component={SwarmInitiationPage} />
          <Route path="/:selectedProd/createSwarm" component={CreateSwarmPage} />
          <Route path="/liveSwarms" component={LiveSwarmPage} />
          <Route path="/swarmStatus" component={SwarmStatus} />
          <Route
            path="/swarmReports/:selectedProd/:swarmNumber"
            component={SwarmReportPage}
          />
          <Route
            path="/compareReports/:selectedProd/:swarmNumberOne/:swarmNumberTwo"
            component={CompareReportsPage}
          />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
