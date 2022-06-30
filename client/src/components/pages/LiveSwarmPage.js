import React, { Component } from "react";
import { getLiveSwarms } from "../../api/jenkins";
import { FwSelect, FwButton } from '@freshworks/crayons/react';
import Styles from './styles/Views.module.css'
class LiveSwarm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      product: [],
      selectedProd: ""
    };
  }

  componentDidMount() {
    getLiveSwarms()
      .then(response => {
        let swarmList = response.data;
        this.setState({
          product: swarmList,
          testStatusCode: 200
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  handleSwarmListChange = (event) => {
    this.setState({ selectedProd: event.target.value });
  };

  validateInput(selectedProd) {
    if (!selectedProd) {
      window.alert("Kindly select a valid running swarm.");
    } else {
      this.setState({ testStatusCode: 200, selectedProd: selectedProd });
      const path = `/swarmStatus`;
      this.props.history.push(path, this.state);
    }
  }

  render() {
    return (
      <section className='fw-flex fw-justify-center fw-mt-28'>
        <div className={`${Styles.wd60} fw-card-1 fw-p-24 fw-m-20`}>
        <div className="fw-flex fw-justify-center">
          <FwSelect
            id='methodOptionSelect'
            label='Running Swarms *'
            placeholder='Products'
            value={this.state.selectedProd}
            onFwChange={this.handleSwarmListChange}
            style={{ width: '80%' }}
            options={this.state.product}
          ></FwSelect>
        </div>
        <div className='fw-flex fw-justify-center fw-mt-28'>
          <FwButton color="primary"
            onFwClick={e =>
              this.validateInput(this.state.selectedProd)
            }
          >Show Status</FwButton>
        </div>
      </div>
      </section>
    );
  }
}
export default LiveSwarm;
