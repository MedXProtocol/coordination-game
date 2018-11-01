import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import classnames from 'classnames'
import { CurrentTransactionsList } from '~/components/CurrentTransactionsList'
import { NetworkInfo } from '~/components/NetworkInfo'
import { Link, NavLink } from 'react-router-dom'
import * as routes from '~/../config/routes'

export const Header = ReactTimeout(
  class _Header extends Component {

    constructor(props) {
      super(props)
      this.state = {
        oneVisible: false,
        twoVisible: false
      }
    }

    componentDidMount() {
      this.props.setTimeout(() => {
        this.setState({
          oneVisible: true
        })
      }, 200)

      this.props.setTimeout(() => {
        this.setState({
          twoVisible: true
        })
      }, 600)
    }

    render () {
      return (
        <React.Fragment>
          <nav
            className={classnames(
              'navbar',
              'is-fixed-top',
              'navbar--row-one',
              'fade-in',
              { 'fade-in-start': this.state.oneVisible }
            )
          }>
            <div className="container is-fluid">
              <div className="navbar-brand">
                <div className="navbar-item">
                  <Link to={routes.HOME} className="navbar-item">
                    The Coordination Game
                    &nbsp; <span className="has-text-transparent-white">Trustless Incentivized List Demo</span>
                  </Link>
                </div>
              </div>

              <CurrentTransactionsList />

              <NetworkInfo />
            </div>
          </nav>

          <nav
            className={classnames(
              'navbar',
              'is-fixed-top',
              'navbar--row-two',
              'fade-in',
              { 'fade-in-start': this.state.twoVisible }
            )
          }>
            <div className="container is-fluid">
              <div className="navbar-menu">
                {
                  this.props.isOwner ? (
                    <div className="navbar-start">
                      <div className="navbar-item">
                        <NavLink
                          exact={true}
                          activeClassName="is-active"
                          to={routes.ADMIN}
                          className="navbar-item"
                        >
                          Admin
                        </NavLink>
                      </div>
                    </div>
                  )
                  : null
                }

                <div className="navbar-end">
                  <div className="navbar-item">
                    <NavLink
                      exact={true}
                      activeClassName="is-active"
                      to={routes.HOME}
                      className="navbar-item"
                    >
                      View Registry
                    </NavLink>
                  </div>
                  <div className="navbar-item">
                    <NavLink
                      activeClassName="is-active"
                      to={routes.APPLY}
                      className="navbar-item"
                    >
                      Apply
                    </NavLink>
                  </div>
                  <div className="navbar-item">
                    <NavLink
                      activeClassName="is-active"
                      to={routes.STAKE}
                      className="navbar-item"
                    >
                      Stake
                    </NavLink>
                  </div>
                  <div className="navbar-item">
                    <NavLink
                      activeClassName="is-active"
                      to={routes.VERIFY}
                      className="navbar-item"
                    >
                      <span className={classnames(`nav--circle`, 'color-kovan')}>1</span> &nbsp; Verify
                    </NavLink>
                  </div>
                  <div className="navbar-item">
                    <NavLink
                      activeClassName="is-active"
                      to={routes.WALLET}
                      className="navbar-item"
                    >
                      Wallet
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </React.Fragment>
      )
    }
  }
)
