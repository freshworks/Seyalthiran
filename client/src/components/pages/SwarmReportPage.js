import React, { Component } from 'react';
import { get } from 'axios';
import Styles from './styles/Views.module.css'
class SwarmReportPage extends Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      selectedProd: props.match.params.selectedProd,
      swarmNumber: props.match.params.swarmNumber,
      validReport: null
    };
  }

  componentDidMount() {
    if (this.state.swarmNumber !== null) {
      let html_url = `/api/jenkins/report/${this.state.selectedProd}/${this.state.swarmNumber}`;
      html_url = encodeURI(html_url);
      get(html_url)
        .then(response => {
          if (response.status === 200) {
            this.setState({ validReport: response.data });
          }
        })
        .catch(err => {
          this.setState({ validReport: false });
          console.log(err);
        });
    }
  }

  viewReport() {
    if (this.state.validReport === null) {
      return null;
    } else {
      return (
        <div className="viewReport">
          <div className="fw-card-1 fw-p-24 fw-flex">
            <div className={`${Styles.flexFullWidth} flex-item-border fw-m-8`}>
              <div className='fw-card-1'>
                <b>
                  Swarm Report -{' '}
                  <b>
                    {this.state.selectedProd} #{this.state.swarmNumber}
                  </b>
                </b>
              </div>
              {this.state.validReport ? (
                <div className='fw-card-1 fw-mt-16'>
                  <iframe
                    src={this.state.validReport}
                    title="HTML Report"
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
          </div>
        </div>
      );
    }
  }

  render() {
    return <section>{this.viewReport()}</section>;
  }
}
export default SwarmReportPage;
