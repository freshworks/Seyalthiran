import React, { Component } from 'react';
import { connect } from 'react-redux';
import { preLoadprods } from '../../store/actions/productActions';
import { getRecentSwarms } from '../../api/jenkins';
import { withRouter } from "react-router";
import Styles from './styles/Views.module.css'
import { FwTabs, FwTab, FwTabPanel, FwButton, FwDataTable, FwTooltip } from "@freshworks/crayons/react";
class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      productList: null,
      products: [],
      swarmsList: null,
      swarms: [],
      productName: null,
      selectedRow: null,
      isComparable: false,
      selectedReports: [],
      swarmTableRows: [],
      noRecentSwarms: false,
      swarmTableColumns: [
        { key: 'test_name', text: 'Test Name', variant: 'anchor' },
        { key: 'time_stamp', text: 'Time Stamp' },
        { key: 'test_index', text: 'Test Index' }
      ],
      selectedSwarmTableRows: [],
    };
  }
  componentDidMount() {
    this.props.preLoadprods();
  }

  handleRowCheckBoxSelections(tableEl, selectedIds) {
    if (selectedIds.length >= 2) {
      // Disable other checkboxes
      Array.from(
        tableEl.shadowRoot.querySelectorAll('fw-checkbox')
      ).filter((cb, index) => !selectedIds.includes((index + 1).toString()))
        .forEach(cb => cb.disabled = true);
    } else {
      const disabledCbs = Array.from(
        tableEl.shadowRoot.querySelectorAll('fw-checkbox')
      ).filter(cb => cb.disabled);

      if (disabledCbs.length > 0) {
        // Enable other checkboxes
        disabledCbs.forEach(cb => cb.disabled = false);
      }
    }
  }

  handleRowSelection(ev) {
    const selectedIds = ev.target.selected;

    const selectedSwarmTableRows = this.state.swarmTableRows
      .filter(row => selectedIds.includes(row.id));

    this.setState({ selectedSwarmTableRows });

    this.handleRowCheckBoxSelections(ev.target, selectedIds);
  }

  formSwarmTableData() {
    let { number, timestamp, value } = this.state.swarmsList;
    const formattedRows = number.map((num, index) => {
      return {
        id: (index + 1).toString(),
        test_name: { text: value[index], href: `/swarmReports/${this.state.productName}/${number[index].index}` },
        test_index: number[index].index,
        time_stamp: this.getTestTime(timestamp[index]),
      }
    })
    this.setState({ swarmTableRows: formattedRows })
  }

  getRecentSwarms = (index, productname) => {
    getRecentSwarms(productname)
      .then(response => {
        if (response?.data?.recentswarms !== '') {
          this.setState({
            selectedRow: index,
            swarmsList: response.data.recentswarms,
            productName: productname
          });
          this.restructureSwarmData()
          this.formSwarmTableData()
          this.setState({ noRecentSwarms: false })
        } else {
          this.setState({ noRecentSwarms: true })
        }
      })
      .catch(err => {
        console.log('error', err);
      });
  };

  restructureSwarmData = () => {
    let numbers = this.state.swarmsList.number
    numbers = numbers.map((num) => {
      return {
        index: num,
        checked: false
      }
    })
    let updatedSwarmList = {
      ...this.state.swarmsList,
      number: numbers
    }
    this.setState({ swarmsList: updatedSwarmList })
  }

  getTestTime = timestamp => {
    let datetime = new Date(parseInt(timestamp));
    return new Date(
      datetime.getTime() - datetime.getTimezoneOffset() * 60000
    ).toISOString();
  };

  routeToCompareReports = () => {
    const filtered = this.state.selectedSwarmTableRows.map(row => row.test_index);
    this.props.history.push(`/compareReports/${this.state.productName}/${filtered[0]}/${filtered[1]}`)
  }

  render() {
    const panes = [
      {
        id: 1,
        name: 'Summary'
      }
    ]

    return (
      <section className='fw-m-16'>
        <h4>Workspace</h4>
        <div className={`${Styles.mnHeight500} fw-card-1 fw-p-24 fw-flex`}>
          <div className={`${Styles.flexItem} flex-item-border fw-m-8`}>
            <h4>Projects/Products</h4>
            {this.props.prods.productList &&
              this.props.prods.productList.map((prod, index) => (
                <div
                  className='fw-card-1'
                  key={index}
                  onClick={() =>
                    this.getRecentSwarms(index, prod.text)
                  }
                >
                  <span style={{ fontWeight: '550' }}>{prod.text}</span>
                </div>
              ))
            }
          </div>
          <div className={`${Styles.flexItem} flex-item-border fw-m-8`}>
            <h4 className='fw-m-16'>Recent Swarms (Max 10)</h4>
            <FwTooltip content="You can select max 2 reports to compare" placement="left">
              <FwButton disabled={this.state.selectedSwarmTableRows.length === 2 ? false : true} className={Styles.compareBtn} size="small"
                onClick={this.state.selectedSwarmTableRows.length === 2 ? this.routeToCompareReports : null}>
                Compare
              </FwButton>
            </FwTooltip>
            {this.state.noRecentSwarms ? (
              <h4 className='fw-m-16'>No recent swarms available</h4>
            ) : (
              this.state.swarmsList == null ? <h4 className='fw-m-16'>Select a product to view recently run swarms</h4> :
                <FwTabs className='fw-mt-12'>
                  {panes.map((pane, index) => <FwTab key={index} slot="tab" panel={pane.name}>{pane.name}</FwTab>)}

                  <FwTabPanel name="Summary">
                    <FwDataTable columns={this.state.swarmTableColumns} rows={this.state.swarmTableRows}
                      label="Data Table 1" onFwSelectionChange={e => this.handleRowSelection(e)} isSelectable>
                    </FwDataTable>
                  </FwTabPanel>
                </FwTabs>
            )}
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

const mapDispatchToProps = dispatch => {
  return {
    preLoadprods: () => dispatch(preLoadprods())
  };
};


export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(LandingPage));
