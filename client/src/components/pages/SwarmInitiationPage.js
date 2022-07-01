import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { selectProd, preLoadprods } from '../../store/actions/productActions';
import { FwSelect, FwButton, FwInlineMessage } from '@freshworks/crayons/react';
import Styles from './styles/Views.module.css'
class SwarmInitiationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: false
    };
  }

  componentDidMount() {
    this.props.preLoadprods();
  }

  handleProductListChange = (event) => {
    this.setState({ selectedProd: event.target.value })
    this.props.selectProd(event.target.value);
  };

  validateInput(selectedProd) {
    if (!selectedProd) {
      window.alert('Please select Product');
    } else {
      this.setState({ redirect: 'tocreatepage' });
    }
  }

  render() {
    return (
      <div className='fw-flex fw-justify-center fw-mt-28'>
        <section className={`${Styles.wd60} fw-card-1 fw-p-24 fw-m-20`}>
          <div className="fw-flex fw-justify-center fw-mt-20">
            <FwSelect
              id='methodOptionSelect'
              label='Select Product *'
              placeholder='Products'
              onFwChange={this.handleProductListChange}
              className={Styles.wd60}
              value={this.state.selectedProd}
              options={this.props.prods.productList}
            ></FwSelect>
          </div>
          <div className='fw-flex fw-justify-center fw-mt-28'>
            <FwButton color="primary"
              onFwClick={e =>
                this.validateInput(this.state.selectedProd)
              }
            >Create Swarm</FwButton>
            {this.state.redirect ? (
              <Redirect
                as={Link}
                to={{
                  pathname: this.props.prods.selectedProd + '/createSwarm'
                }}
              />
            ) : null}
          </div>
          <div className='fw-flex fw-justify-center fw-my-28'>
            <FwInlineMessage open type="info" closable="false" className={`${Styles.wd60} ${Styles.textCenter}`}>
              <a
                href={
                  process.env.PUBLIC_URL + '/seyalthiran-jmx-template.jmx'
                }
                download
              >
                Click here to download template JMX
              </a>
            </FwInlineMessage>
          </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    prods: state.prods
  };
};

const mapDispatchToProps = dispatch => {
  return {
    selectProd: selectedProd => dispatch(selectProd(selectedProd)),
    preLoadprods: () => dispatch(preLoadprods())
  };
};

// export default SwarmInitiationPage;
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SwarmInitiationPage);
