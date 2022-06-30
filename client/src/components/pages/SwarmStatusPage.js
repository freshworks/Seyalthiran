import $ from 'jquery';
import React, { Component } from 'react';
import { abortBuild, getRecentReport, getConsoleTexts } from '../../api/jenkins';
import * as configs from '../../config/config';
import { FwButton, FwTabs, FwTab, FwTabPanel } from '@freshworks/crayons/react';
import Styles from './styles/Views.module.css'
class ConsoleText extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress_data: 'Loading console text...',
      console_data: '',
      testStarted: false,
      next: false,
      scrolled: false,
      enableStopTest: true,
    };
  }

  componentDidMount() {
    if (this.props.testStatusCode === 200) {
      this.timerID = setInterval(() => this.showConsoleText(), 3000);
    }
    if (this.props.testStatusCode === 201) {
      this.setState({
        progress_data: '',
        enableStopTest: false,
        console_data:
          'Test is queued, You will be notified as soon as the test is started. Please redirect to live swarms tab once the test is started',
      });
      $('#running').remove();
    }
    if (this.props.testStatusCode === 500) {
      this.setState({
        progress_data: '',
        enableStopTest: false,
        console_data:
          'Oops!! Test failed to triggered. Please contact #seyalthiran-team',
      });
      $('#running').remove();
    }
  }
  componentWillUnmount() {
    clearInterval(this.timerID);
  }
  componentDidUpdate(prevProp, prevState) {
    if (prevState.enableStopTest && !this.state.enableStopTest) {
      this.props.handleStopTest(this.state.enableStopTest);
    }
    if (!prevState.testStarted && this.state.testStarted) {
      this.props.hasTestStarted(true);
    }
  }

  showConsoleText() {
    getConsoleTexts(this.props.selectedProd)
      .then(response => {
        return response.data;
      })
      .then((text) => {
        var consoletext = '';
        let startTestIdentifier = 'Waiting for possible Shutdown';
        if (text.match(startTestIdentifier)) {
          consoletext = text.substring(
            text.indexOf(startTestIdentifier) + 0
          );
          this.setState({
            testStarted: true,
          });
          if (text.match(/end of run/)) {
            consoletext = consoletext.substring(
              0,
              consoletext.indexOf('end of run') + 11
            );
            consoletext = consoletext + '\n \nPreparing HTML report...\n';
            this.setState({
              console_data: consoletext,
            });
          } else {
            this.setState({
              console_data: consoletext,
            });
          }
        }
        if (text.match(/Finished: SUCCESS/)) {
          $('#running').remove();
          this.setState({
            next: true,
            enableStopTest: false,
          });
          this.setState({
            scrolled: true,
          });
          clearInterval(this.timerID);
        }
        if (text.match(/Build was aborted/)) {
          // Remove loader icon
          $('#running').remove();
          // Display view report button
          this.setState({
            next: false,
            enableStopTest: false,
          });
          this.setState({
            scrolled: true,
          });
          consoletext = '\n Test has been stopped.\n';
          this.setState({
            console_data: consoletext,
          });
          clearInterval(this.timerID);
        }
        if (text.match(/Finished: FAILURE/)) {
          // Remove loader icon
          $('#running').remove();
          // Display view report button
          this.setState({
            next: false,
            enableStopTest: false,
          });
          this.setState({
            scrolled: true,
          });
          consoletext =
            '\n Oops!! Test preparation/execution failed. Please contact #seyalthiran-team\n';
          this.setState({
            console_data: consoletext,
          });
          clearInterval(this.timerID);
        } else {
          if (!this.state.progress_data.includes('Preparing for the test...')) {
            this.setState({
              progress_data: `${this.state.progress_data} \n \nPreparing for the test...`,
            });
          }
        }
      });
  }

  routeChange(validReport) {
    const path = `/swarmReports/${this.props.selectedProd}/${validReport}`;
    this.props.history.push(path);
  }

  showRecentReport = (selectedProd) => {
    getRecentReport(selectedProd)
      .then((response) => {
        this.routeChange(response.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  render() {
    let { selectedProd } = this.props;
    if (!this.state.scrolled) {
      window.scrollTo(0, document.body.scrollHeight);
    }
    return (
      <div>
        <pre align="left" style={{ overflow: 'auto' }}>
          {this.state.progress_data}
          <br />
          {this.state.console_data}
        </pre>
        <b id="running" className='fw-flex fw-justify-center'>
          <fw-spinner size="medium" color="#244662"></fw-spinner>
        </b>
        {this.state.next ? (
          <FwButton color="primary"
            onFwClick={e =>
              this.showRecentReport(selectedProd)
            }
          >View Report</FwButton>
        ) : null}
      </div>
    );
  }
}

class SwarmStatus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      testStarted: false,
      panes: [{
        id: 1,
        name: 'Console Text'
      }],
      enableStopTest: true,
    };
  }

  hasTestStarted = (value) => {
    let { panes } = this.state;
    const isNotExist = !panes.find((pane) => pane.menuItem === 'Live Status');
    if (isNotExist) {
      panes = [
        ...panes,
        {
          id: 2,
          name: 'Live Status'
        }
      ];
    }
    if (value === true) this.setState({ testStarted: value, panes });
    else this.setState({ testStarted: value, panes });
  };

  handleStopTest = (value) => {
    this.setState({ enableStopTest: value });
  };

  stopRunningTest = (selectedProd) => {
    if (window.confirm('Are you sure you want to stop the test?')) {
      abortBuild(selectedProd)
        .then(() => {
          this.setState({ enableStopTest: false });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  render() {
    const { selectedProd, testStatusCode } = this.props.location.state;

    return (
      <section>
        <div className='fw-card-1 fw-p-24 fw-m-20'>
          <h3 className='fw-pb-16'>Test Execution Status</h3>
          <FwTabs>
            {this.state.panes.map((pane, index) => <FwTab key={index} slot="tab" panel={pane.name}>{pane.name}</FwTab>)}

            <FwTabPanel name="Console Text">
              <ConsoleText
                hasTestStarted={this.hasTestStarted}
                handleStopTest={this.handleStopTest}
                selectedProd={selectedProd}
                history={this.props.history}
                testStatusCode={testStatusCode}
              />
            </FwTabPanel>
            <FwTabPanel name="Live Status">
              <div className="fw-card-1 fw-p-24 fw-flex">
              <div className={`${Styles.overflow} flex-item-border fw-m-8`}>
                  <iframe
                    title="Active Thread"
                    src={configs.setgrafanaurl(
                      selectedProd,
                      Date.now(),
                      31
                    )}
                    width="450"
                    height="200"
                    frameBorder="5"
                  />
                </div>
                <div className={`${Styles.overflow} flex-item-border fw-m-8`}>
                  <iframe
                    title="Error Rate"
                    src={configs.setgrafanaurl(
                      selectedProd,
                      Date.now(),
                      29
                    )}
                    width="450"
                    height="200"
                    frameBorder="5"
                  />
                </div>
              </div>
              <div className={`${Styles.overflow} fw-card-1 fw-p-24 fw-flex`}>
                <iframe
                  title="Response Time"
                  src={configs.setgrafanaurl(
                    selectedProd,
                    Date.now(),
                    23
                  )}
                  width="1000"
                  height="250"
                  frameBorder="5"
                />
              </div>
              <div className={`${Styles.overflow} fw-card-1 fw-p-24 fw-flex`}>
                <iframe
                  title="Total Throughput"
                  src={configs.setgrafanaurl(selectedProd, Date.now(), 4)}
                  width="1000"
                  height="250"
                  frameBorder="5"
                />
              </div>
            </FwTabPanel>
          </FwTabs>
          <div className='fw-flex fw-justify-center fw-mt-28'>
            {this.state.enableStopTest ? (
              <FwButton color="danger"
                onFwClick={e =>
                  this.stopRunningTest(selectedProd)
                }
              >Stop Test</FwButton>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
}

export default SwarmStatus;
