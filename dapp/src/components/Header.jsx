import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import classnames from 'classnames'
import { connect } from 'react-redux'
import { all } from 'redux-saga/effects'
import { withRouter } from 'react-router'
import { Link, NavLink } from 'react-router-dom'
import { get } from 'lodash'
import { CurrentTransactionsList } from '~/components/CurrentTransactionsList'
import {
  cacheCall,
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import {
  AuditOutline,
  BarsOutline,
  CheckCircleOutline,
  GoldOutline,
  IssuesCloseOutline,
  SettingOutline,
  WalletOutline
} from '@ant-design/icons'
import AntdIcon from '@ant-design/icons-react'
import { NetworkInfo } from '~/components/NetworkInfo'
import * as routes from '~/../config/routes'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getVerifiersApplicationCount')

  return {
    address,
    applicationCount,
    coordinationGameAddress
  }
}

function* headerSaga({
  coordinationGameAddress,
  address
}) {
  if (!coordinationGameAddress || !address) { return null }

  yield all([
    cacheCall(coordinationGameAddress, 'getVerifiersApplicationCount')
  ])
}

export const Header = ReactTimeout(
  withRouter(
    connect(mapStateToProps)(
      withSaga(headerSaga)(
        class _Header extends Component {

          constructor(props) {
            super(props)
            this.state = {
              oneVisible: false,
              twoVisible: false,
              mobileMenuActive: false
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

          toggleMobileMenu = (e) => {
            const mobileMenuActive = !this.state.mobileMenuActive

            this.setState({
              mobileMenuActive
            })
          }

          render () {
            const { applicationCount } = this.props

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
                          <span className='is-hidden-touch'>
                            &nbsp; <span className="has-text-transparent-white">Trustless Incentivized List Demo</span>
                          </span>
                        </Link>
                      </div>

                      <button
                        className={classnames(
                          'navbar-burger',
                          'burger',
                          { 'is-active': this.state.mobileMenuActive }
                        )}
                        data-target="navbar-menu"
                        onClick={this.toggleMobileMenu}
                      >
                        <span></span>
                        <span></span>
                        <span></span>
                      </button>
                    </div>

                    <CurrentTransactionsList />

                    <div className="navbar-menu">
                      <div className="navbar-end">
                        <div className="navbar-item">
                          <span className="navbar-item">
                            <button onClick={this.props.toggleTheme} className="has-text-transparent-white">
                              {this.props.isLight === 'true' ? '.' : ' '}
                            </button>
                          </span>
                        </div>

                        <NetworkInfo />
                      </div>
                    </div>
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
                    <div id="navbar-menu" className={classnames(
                      'navbar-menu',
                      { 'is-active': this.state.mobileMenuActive }
                    )}>
                      {
                        this.props.isOwner ? (
                          <div className="navbar-start">
                            <div className="navbar-item">
                              <NavLink
                                activeClassName="is-active"
                                to={routes.ADMIN}
                                className="navbar-item"
                                onClick={this.toggleMobileMenu}
                              >
                                <AntdIcon type={SettingOutline} className="antd-icon" />&nbsp;
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
                            exact
                            activeClassName="is-active"
                            to={routes.HOME}
                            className="navbar-item"
                            onClick={this.toggleMobileMenu}
                          >
                            <AntdIcon type={BarsOutline} className="antd-icon" />&nbsp;
                            View Registry
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.APPLY}
                            className='navbar-item'
                            onClick={this.toggleMobileMenu}
                          >
                            <AntdIcon type={AuditOutline} className="antd-icon " />&nbsp;
                            Apply
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.STAKE}
                            className="navbar-item"
                            onClick={this.toggleMobileMenu}
                          >
                            <AntdIcon type={GoldOutline} className="antd-icon" />&nbsp;
                            Stake
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.VERIFY}
                            className={classnames(
                              'navbar-item',
                              {
                                'is-attention-grabby': applicationCount > 0
                              }
                            )}
                            onClick={this.toggleMobileMenu}
                          >
                            <AntdIcon
                              type={applicationCount > 0 ? IssuesCloseOutline : CheckCircleOutline}
                              className="antd-icon"
                            />
                            &nbsp;{applicationCount > 0 ? applicationCount : ''} Verify
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.WALLET}
                            className="navbar-item"
                            onClick={this.toggleMobileMenu}
                          >
                            <AntdIcon type={WalletOutline} className="antd-icon" />&nbsp;
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
    )
  )
)
