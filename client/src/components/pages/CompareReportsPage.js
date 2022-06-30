import React, { Component } from 'react';
import { get } from 'axios';
import { REPORT_INDEX0, REPORT_INDEX1 } from '../../constants/index'
import Styles from './styles/Views.module.css'
class CompareReportsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedProd: props.match.params.selectedProd,
      swarmNumbers: [props.match.params.swarmNumberOne, props.match.params.swarmNumberTwo],
      validReport1: null,
      validReport2: null
    };
  }

  componentDidMount() {
    if (this.state.swarmNumbers !== null) {
      let reportDataKeys = ['validReport1', 'validReport2'];
      this.getSwarmReport(this.state.swarmNumbers[REPORT_INDEX0], reportDataKeys[REPORT_INDEX0])
      this.getSwarmReport(this.state.swarmNumbers[REPORT_INDEX1], reportDataKeys[REPORT_INDEX1])
    }
  }

  getSwarmReport(report, reportKey) {
    let html_url = `/api/jenkins/report/${this.state.selectedProd}/${report}`;
    html_url = encodeURI(html_url);
    get(html_url)
      .then(response => {
        if (response.status === 200) {
          this.setState({ [reportKey]: response.data });
        }
      })
      .catch(err => {
        this.setState({ [reportKey]: false });
        console.log(err);
      });
  }

  renderReportUI(report, index) {
    return (
      <div className={`${Styles.flexItem} flex-item-border fw-m-8`}>
        <div className='fw-card-1'>
          <b>
            Swarm Report -{' '}
            <b>
              {this.state.selectedProd} #{this.state.swarmNumbers[index]}
            </b>
          </b>
        </div>
        {report ? (
          <div className='fw-card-1 fw-mt-16'>
            <iframe
              src={report}
              title="HTMLReport"
              width="100%"
              height="800"
            />
          </div>
        ) : (
          <div className='fw-card-1 fw-mt-16'>
            <b>
              Incomplete test or aborted test, kindly contact
              seyalthiran-team if further assistance is required
            </b>
          </div>
        )}
      </div>
    )
  }

  viewReport() {
    const { validReport1, validReport2 } = this.state;
    if (validReport1 === null && validReport2 === null) {
      return null;
    } else {
      return (
        <div className="viewReport">
          <div className="fw-card-1 fw-p-24 fw-flex">
            {[validReport1, validReport2].map((report, index) => this.renderReportUI(report, index))}
          </div>
        </div>
      );
    }
  }

  render() {
    return <section>{this.viewReport()}</section>;
  }
}
export default CompareReportsPage;