import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import logo from './Seyalthiran.svg';
import { FwButtonGroup, FwButton, FwIcon } from "@freshworks/crayons/react";
import Styles from '../pages/styles/Views.module.css'
class NavBar extends Component {
  render() {
    return (
      <header>
        <div className={`fw-flex flex-container-border fw-justify-between fw-p-16 ${Styles.navBg}`}>
            <Link to="/">
              <img src={logo} alt="Logo" height="36px"/>;
            </Link>
            <FwButtonGroup className={Styles.btnGroup}>
              <Link to='/'>
                <FwButton color="secondary" className={Styles.btnGroupBtn}><FwIcon className='fw-mr-12' name="similar-articles" color="black"></FwIcon>Swarm Reports</FwButton>
              </Link>
              <Link to='/swarmInit'>
                <FwButton color="secondary" className={Styles.btnGroupBtn}><FwIcon className='fw-mr-12' name="new-note" color="black"></FwIcon>Create Swarms</FwButton>
              </Link>
              <Link to='/liveSwarms'>
                <FwButton color="secondary" className={Styles.btnGroupBtn}><FwIcon className='fw-mr-12' name="canned-forms" color="black"></FwIcon>Live Swarms</FwButton>
              </Link>
            </FwButtonGroup>
        </div>
      </header>
    );
  }
}

export default NavBar;
