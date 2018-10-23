import React, { Component } from 'react'
import { NetworkCheck } from '~/components/NetworkCheck'
import { Link } from 'react-router-dom'
import * as routes from '~/../config/routes'

export const Header = class _Header extends Component {

  render () {
    return (
      <React.Fragment>
        <nav className="navbar is-fixed-top navbar--row-one">
          <div className="container is-fluid">
            <div className="navbar-brand">
              <div className="navbar-item">
                <h1>
                  The Coordination Game
                  &nbsp; <span className="has-text-grey">(Trustless Incentivized List Demo)</span>
                </h1>
              </div>
            </div>

            <NetworkCheck />
          </div>
        </nav>

        <nav className="navbar is-fixed-top navbar--row-two">
          <div className="container is-fluid">
            <div className="navbar-menu">
              <div className="navbar-end">
                <div className="navbar-item">
                  <Link to={routes.HOME} className="navbar-item">
                    Registry
                  </Link>
                </div>
                <div className="navbar-item">
                  <Link to={routes.APPLY} className="navbar-item">
                    Apply
                  </Link>
                </div>
                <div className="navbar-item">
                  <Link to={routes.STAKE} className="navbar-item">
                    Stake
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </React.Fragment>
    )
  }
}
