import React, { Component } from 'react'
import { NetworkCheck } from '~/components/NetworkCheck'

export const Header = class _Header extends Component {

  render () {
    return (
      <nav id="navbar" className="navbar is-fixed-top">
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
    )
  }
}
