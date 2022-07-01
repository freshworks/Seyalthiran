import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSwarm } from '../../api/jenkins';
import { FwButton, FwModal, FwIcon, FwInput, FwCheckbox, FwTooltip } from "@freshworks/crayons/react";
import Styles from './styles/Views.module.css'
import { Link, Redirect } from 'react-router-dom';

const parser = new DOMParser();
const oSerializer = new XMLSerializer();

class CreateSwarmPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: null,
      testname: null,
      jmxfile: null,
      csvfile: null,
      inputcsvfile: null,
      testStatusCode: null,
      testTriggered: false,
      jmxvars: null,
      sp_totalUsers: null,
      addKpi: false,
      kpi_value: { response_time: { value: null, autoStop: false }, err_rate: { value: null, autoStop: false } },
      testStarted: false
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleAutoStopChange = this.handleAutoStopChange.bind(this);
  }

  componentDidMount() {
    const productName = this.props.match.params.selectedProd;
    this.setState({ selectedProd: productName })
  }

  handleEmailChange = event => {
    this.setState({ email: event.target.value });
  };
  handleTestNameChange = event => {
    this.setState({ testname: event.target.value });
  };

  jmxSelectedHandler = event => {
    this.setState(
      {
        csvfile: null,
        inputcsvfile: null,
        jmxfile: event.target.files[0]
      },
      () => {
        this.parseJMX(this.state.jmxfile);
      }
    );
  };

  csvSelectedHandler(csv, event) {
    var inputfile = event.target.files[0];
    if (inputfile.name !== csv) {
      window.alert('Please upload valid csv file');
      document.getElementById(csv).value = '';
      return;
    }
    if (this.state.csvfile) {
      this.setState(prevState => ({
        csvfile: [...prevState.csvfile, inputfile]
      }));
    } else {
      this.setState({
        csvfile: [inputfile]
      });
    }
  }

  parseJMX = jmxfile => {
    this.setState({
      inputcsvfile: null
    });
    const read = new FileReader();
    read.readAsBinaryString(jmxfile);
    read.onload = () => {
      const result = parser.parseFromString(read.result, 'text/xml');
      const udv = [];
      const userdefinedElements = result.getElementsByName(
        'TestPlan.user_defined_variables'
      );
      for (let i = 0; i < userdefinedElements.length; i++) {
        const elementProp = userdefinedElements
          .item(i)
          .getElementsByTagName('elementProp');
        for (let j = 0; j < elementProp.length; j++) {
          const item = elementProp.item(j);
          const argName = item.attributes[0].nodeValue;
          const argVal = item.getElementsByTagName('stringProp');
          for (let k = 0; k < argVal.length; k++) {
            if (argVal[k].attributes[0].nodeValue === 'Argument.value') {
              if (argName === 'sp_totalUsers') {
                this.setState({
                  sp_totalUsers: argVal[k].attributes[0].ownerElement.innerHTML
                });
              }
              udv.push({
                argName: argName,
                argVal: argVal[k].attributes[0].ownerElement.innerHTML
              });
            }
          }
        }
      }
      this.setState({
        jmxvars: udv
      });
      const threadGroupDataSet = result.getElementsByTagName('ThreadGroup');
      const csvdataset = result.getElementsByTagName('CSVDataSet');
      if (csvdataset.length > 1) {
        window.alert("Please upload a JMX with fewer CSV's (max 1)");
        return;
      }
      for (var i = 0; i < csvdataset.length; i++) {
        const csvdata = csvdataset.item(i);
        const stringprop = csvdata.getElementsByTagName('stringProp');
        for (var j = 0; j < stringprop.length; j++) {
          let item = stringprop.item(j);
          if (item.attributes[0].nodeValue === 'filename') {
            if (this.state.inputcsvfile) {
              //eslint-disable-next-line
              this.setState(prevState => ({
                inputcsvfile: [
                  ...prevState.inputcsvfile,
                  item.childNodes[0].nodeValue
                ]
              }));
            } else {
              this.setState({
                inputcsvfile: [item.childNodes[0].nodeValue]
              });
            }
          }
        }
      }
      //For checking if loop count is forver and schedule is not given.
      for (let i = 0; i < threadGroupDataSet.length; i++) {
        const threadGroupData = threadGroupDataSet.item(i);
        const elementPropData = threadGroupData.getElementsByTagName(
          'elementProp'
        );
        for (let j = 0; j < elementPropData.length; j++) {
          const stringPropData = elementPropData.item(j);
          // If Loop count is Forever, then intProp will be set to -1
          const intProp = stringPropData.getElementsByTagName('intProp');
          if (intProp.length) {
            const schedulerPropData = threadGroupData.getElementsByTagName(
              'boolProp'
            );
            for (let k = 0; k < schedulerPropData.length; k++) {
              const boolPropData = schedulerPropData.item(k);
              if (
                boolPropData.attributes[0].nodeValue ===
                'ThreadGroup.scheduler' &&
                boolPropData.childNodes[0].nodeValue !== 'true'
              ) {
                if (
                  !window.alert(
                    'Loop count is forever but test duration is not provided, Please reupload.'
                  )
                ) {
                  document.getElementById('jmxFile').value = null;
                  this.setState({
                    jmxfile: null,
                    inputcsvfile: null,
                    jmxvars: null
                  });
                  return;
                }
              }
            }
          }
        }
      }
    };
  };

  editVariables = e => {
    e.preventDefault();
    this.setState({ udvModalOpen: true });
  };

  modalShow = () => {
    if (!this.state.jmxfile) {
      window.alert('Please upload JMX file');
    } else if (!this.state.sp_totalUsers) {
      window.alert(
        'Mandatory variable (sp_totalUsers) missing! Refer template JMX'
      );
    } else if (
      !this.state.email ||
      !/^([\w+-.%]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4})((\s*,\s*){1}[\w+-.%]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4})*(\s*?)$/i.test(this.state.email)
    ) {
      window.alert('Please enter valid mail id');
    } else if (this.state.inputcsvfile) {
      if (!this.state.csvfile) {
        window.alert('Please upload CSV file');
      } else if (
        this.state.csvfile &&
        this.state.inputcsvfile &&
        this.state.csvfile.length !== this.state.inputcsvfile.length
      ) {
        window.alert('Please upload CSV file');
      } else {
        document.querySelector('fw-modal#test-summary').open();
        this.setState({ modalOpen: true });
      }
    } else {
      if (this.state.jmxfile.name.match(/\.jmx/)) {
        document.querySelector('fw-modal#test-summary').open();
        this.setState({ modalOpen: true });
      } else {
        window.alert('Please upload valid jmx file');
      }
    }
  };

  udvChangeHandler = (idx, e) => {
    const jmxvars = [...this.state.jmxvars];
    jmxvars[idx] = { argName: e.target.name, argVal: e.target.value };
    this.setState({ jmxvars });
  };

  close = () => this.setState({ modalOpen: false });

  saveJmx = () => {
    const jmxfile = this.state.jmxfile;
    const read = new FileReader();
    var updatedJMXFile = null;
    read.readAsBinaryString(jmxfile);
    read.onload = () => {
      const result = parser.parseFromString(read.result, 'text/xml');
      const userdefinedElements = result.getElementsByName(
        'TestPlan.user_defined_variables'
      );
      for (let i = 0; i < userdefinedElements.length; i++) {
        const elementProp = userdefinedElements
          .item(i)
          .getElementsByTagName('elementProp');
        for (let j = 0; j < elementProp.length; j++) {
          const item = elementProp.item(j);
          //  let argName = item.attributes[0].nodeValue;
          const argVal = item.getElementsByTagName('stringProp');
          for (let k = 0; k < argVal.length; k++) {
            if (argVal[k].attributes[0].nodeValue === 'Argument.value') {
              argVal[
                k
              ].attributes[0].ownerElement.innerHTML = this.state.jmxvars[
                j
              ].argVal;
            }
            if (this.state.jmxvars[j].argName === 'sp_totalUsers') {
              this.setState({ sp_totalUsers: this.state.jmxvars[j].argVal });
            }
          }
        }
      }
      const sXML = oSerializer.serializeToString(result);
      updatedJMXFile = new File([sXML], jmxfile.name);
      this.setState({ udvModalOpen: false, updatedJMXFile });
      document.querySelector('fw-modal#edit-params').close();
    };
  };

  createSwarm = e => {
    this.setState({
      testStarted: true
    });
    var formData = new FormData();
    formData.append('selectedProd', this.state.selectedProd);
    formData.append(
      'jmxfile',
      this.state.updatedJMXFile ? this.state.updatedJMXFile : this.state.jmxfile
    );
    if (this.state.csvfile) {
      for (var i = 0; i < this.state.csvfile.length; i++) {
        var csv = 'csvfile';
        if (i > 0) csv = csv + i;
        // csvfile, csvfile1, csvfile2....
        formData.append(csv, this.state.csvfile[i]);
      }
    }
    formData.append('email', this.state.email);
    formData.append('testname', this.state.testname);
    formData.append(
      'kpi',
      this.state.addKpi
        ? JSON.stringify(this.state.kpi_value)
        : JSON.stringify({ response_time: { value: null, autoStop: false }, err_rate: { value: null, autoStop: false } })
    );
    this.createSwarmHere(formData);
  };

  createSwarmHere = formData => {
    this.setState({ testTriggered: true });
    createSwarm(formData)
      .then(response => {
        this.setState({ testStatusCode: response.status });
      })
      .catch(err => {
        if (err) {
          if (err) {
            this.setState({ testStatusCode: err.response.status });
          }
        }
      });
  };

  handleInputChange = event => {
    const target = event.target;
    const value = target.localName === 'fw-checkbox' ? target.checked : target.value;
    const name = target.name;

    if (target.localName === 'fw-checkbox') {
      this.setState({ addKpi: value });
    }

    this.setState({
      [name]: value,
      kpi_value: { response_time: { value: 1, autoStop: false }, err_rate: { value: 1, autoStop: false } }
    });
  };

  handleKpiValChange = event => {
    if (event.target.name === 'response_time') {
      var kpi_value = this.state.kpi_value;
      kpi_value.response_time.value = event.target.value;
      this.setState({ kpi_value });
    } else if (event.target.name === 'err_rate') {
      kpi_value = this.state.kpi_value;
      kpi_value.err_rate.value = event.target.value;
      this.setState({ kpi_value });
    }
  };

  handleAutoStopChange = event => {
    var kpi_value = this.state.kpi_value;

    if (event.target.name === 'addResponseAutoStop') {
      kpi_value.response_time.autoStop = event.target.checked;
      this.setState({ kpi_value })
    }
    else if (event.target.name === 'addErrorAutoStop') {
      kpi_value.err_rate.autoStop = event.target.checked;
      this.setState({ kpi_value });
    }
  }

  renderKpi = () => {
    if (this.state.addKpi === true) {
      return (
        <>
          <div className='fw-flex fw-content-center'>
            <FwInput name="response_time"
              label="Response Time (sec)"
              labelPosition="right"
              onFwInput={e => this.handleKpiValChange(e)} />
            <FwCheckbox
              className='fw-mt-28 fw-ml-16'
              name="addResponseAutoStop"
              onFwChange={this.handleAutoStopChange}
            >Auto Stop</FwCheckbox>
          </div>
          <div className='fw-flex fw-content-center'>
            <FwInput name="response_time"
              label="Error Rate (%)"
              labelPosition="right"
              onFwInput={e => this.handleKpiValChange(e)} />
            <FwCheckbox
              className='fw-mt-28 fw-ml-16'
              name="addResponseAutoStop"
              onFwChange={this.handleAutoStopChange}
            >Auto Stop</FwCheckbox>
          </div>
        </>
      );
    }
  };

  render() {
    return (
      <section className='fw-flex fw-justify-center fw-m-16'>
        <div className={Styles.wd60}>
          <h3 className='fw-m-20'>Create a new swarm report</h3>
          <div className="fw-card-1 fw-p-32 fw-m-20">
            <FwInput
              className='fw-m-8'
              label="Product"
              hintText="This field is read-only"
              readonly
              required
              value={this.state.selectedProd}
              state="normal">
            </FwInput>
            <label className={Styles.label}>JMX Test Script<sup style={{ color: 'red', fontSize: '1rem' }}>*</sup></label>
            <div className={Styles.fileArea}>
              <input
                type="file"
                id="jmxFile"
                className="inputfile"
                onClick={event => {
                  event.target.value = null;
                  this.setState({
                    csvfile: null,
                    inputcsvfile: null,
                    jmxvars: null,
                    sp_totalUsers: null
                  });
                }}
                onChange={this.jmxSelectedHandler}
              />
              {!this.state.jmxvars ? null : this.state.jmxvars.length ===
                0 || !this.state.sp_totalUsers ? (
                <button type="button">
                  <a
                    href={
                      process.env.PUBLIC_URL +
                      '/seyalthiran-jmx-template.jmx'
                    }
                    download
                  >
                    <FwIcon className='fw-ml-8' name="warning" color="black"></FwIcon>
                    parameters missing! Refer template jmx
                  </a>
                </button>
              ) : (
                <FwButton size="small" modalTriggerId='edit-params'>Edit parameters <FwIcon className='fw-ml-8' name="edit" color="white"></FwIcon></FwButton>
              )}
              <FwModal id='edit-params' titleText="Edit test parameters" submit-text="Save" size="large" onFwSubmit={e => this.saveJmx()}>
                {this.state.jmxvars
                  ? this.state.jmxvars.map((value, idx) => (
                    <FwInput
                      key={idx}
                      name={this.state.jmxvars[idx].argName}
                      label={this.state.jmxvars[idx].argName}
                      value={this.state.jmxvars[idx].argVal}
                      onFwInput={e =>
                        this.udvChangeHandler(idx, e)
                      }
                      required
                      clearInput>
                    </FwInput>
                  ))
                  : null}
              </FwModal>
            </div>
            {this.state.inputcsvfile
              ? this.state.inputcsvfile.map((item, index) => (
                <div key={index}>
                  <label>MAPITestData_staging.csv<sup style={{ color: 'red', fontSize: '1rem' }}>*</sup></label>
                  <div className={Styles.fileArea}>
                    <input
                      type="file"
                      className="inputfile"
                      id={item}
                      onChange={e => this.csvSelectedHandler(item, e)}
                    />
                  </div>
                </div>
              )) : null}
            <FwInput
              className='fw-m-8'
              label="Email"
              hintText="Comma-separated list of email address that should receive notifications for this swarm report"
              errorText="Invalid email"
              placeholder="Enter your email"
              onFwInput={e => this.handleEmailChange(e)}
              required
              clearInput>
            </FwInput>
            <FwInput
              className='fw-m-8'
              label="Test Name"
              onFwInput={e => this.handleTestNameChange(e)}
              state="normal">
            </FwInput>
            <FwCheckbox description='Key Performance Indicators'
              name="add_kpi"
              className='fw-m-8'
              onFwChange={this.handleInputChange}
            >
              Add KPI
              <FwTooltip content="Used by html reporters for highlighting based on SLO(Service level Objective) set under this section" placement="right-start">
                <FwIcon className='fw-ml-8' name="warning" color="black" />
              </FwTooltip>
            </FwCheckbox><br /><br />
            {this.renderKpi()}
            <div className='fw-flex fw-justify-center fw-mt-28'>
              <FwButton color="primary"
                onFwClick={this.modalShow}
              >Run Test</FwButton>
            </div>
            {this.state.testStatusCode ? (
              <Redirect
                as={Link}
                to={{
                  pathname: '/swarmStatus',
                  state: {
                    selectedProd: this.state.selectedProd,
                    testStatusCode: this.state.testStatusCode
                  }
                }}
              />
            ) : null}
            <FwModal id='test-summary' titleText="Swarm summary" submit-text="Start Test" size="large" onFwSubmit={e => this.createSwarm()}>
              <p>
                JMX file:{' '}
                {this.state.jmxfile
                  ? this.state.jmxfile.name
                  : null}
              </p>
              <p>sp_totalUsers: {this.state.sp_totalUsers}</p>
              <p>Email: {this.state.email}</p>
              <p>Test name: {this.state.testname}</p>
            </FwModal>
          </div>
        </div>
      </section>
    );
  }
}

const mapStateToProps = state => {
  return {
    prods: state.prods
  };
};

export default connect(mapStateToProps)(CreateSwarmPage);
