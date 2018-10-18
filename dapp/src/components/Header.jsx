import React, { Component } from 'react'
import { NetworkCheck } from './NetworkCheck'

export const Header = class _Header extends Component {

  render () {
    return (
      <nav id="navbar" className="navbar is-fixed-top">
        <div className="container">
          <div className="navbar-brand">
            <div className="navbar-item">
              <h1>
                TIL (Trustless Incentivized List) Coordination Game Demo
              </h1>
            </div>

            <NetworkCheck />
          </div>


        </div>
      </nav>
    )
  }
}
