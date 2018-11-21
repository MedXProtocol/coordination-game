import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import classnames from 'classnames'
import Toggle from 'react-toggle'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Link, NavLink } from 'react-router-dom'
import { get } from 'lodash'
import { CurrentTransactionsList } from '~/components/CurrentTransactionsList'
import {
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import {
  AuditOutline,
  BarsOutline,
  CheckCircleOutline,
  IssuesCloseOutline,
  SettingOutline,
  WalletOutline
} from '@ant-design/icons'
import AntdIcon from '@ant-design/icons-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon } from '@fortawesome/free-solid-svg-icons'
import { faSun } from '@fortawesome/free-regular-svg-icons'
import { NetworkInfo } from '~/components/NetworkInfo'
import { verifierApplicationsService } from '~/services/verifierApplicationsService'
import { applicationService } from '~/services/applicationService'
import { verifierApplicationsSaga } from '~/sagas/verifierApplicationsSaga'
import { applicationSaga } from '~/sagas/applicationSaga'
import { isBlank } from '~/utils/isBlank'
import TokenRegistryLogo from '~/assets/img/the-token-registry.svg'
import * as routes from '~/../config/routes'

function mapStateToProps(state) {
  let applicationsToVerify = 0
  let applicationIds = []

  const address = get(state, 'sagaGenesis.accounts[0]')
  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getVerifiersApplicationCount', address)
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  if (applicationCount && applicationCount !== 0) {
    applicationIds = verifierApplicationsService(state, applicationCount, coordinationGameAddress)
  }

  for (let i = 0; i < applicationIds.length; i++) {
    const applicationId = applicationIds[i]

    const application = applicationService(state, applicationId, coordinationGameAddress)
    const verifierSubmittedSecret = !isBlank(application.verifiersSecret)

    if (!verifierSubmittedSecret && (latestBlockTimestamp < application.verifierSubmitSecretExpiresAt)) {
      applicationsToVerify += 1
    }
  }

  return {
    address,
    applicationsToVerify,
    applicationCount,
    applicationIds,
    coordinationGameAddress
  }
}

function* headerSaga({ address, applicationCount, applicationIds, coordinationGameAddress }) {
  if (!coordinationGameAddress || !address) { return }

  yield verifierApplicationsSaga({ coordinationGameAddress, address, applicationCount })

  if (applicationIds && applicationIds.length !== 0) {
    yield all(
      applicationIds.map(function* (applicationId) {
        yield applicationSaga({ coordinationGameAddress, applicationId })
      })
    )
  }
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

          closeMobileMenu = (e) => {
            this.setState({
              mobileMenuActive: false
            })
          }

          render () {
            const { applicationsToVerify } = this.props

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
                          <TokenRegistryLogo width="220" height="39" style={{ 'marginTop': -1 }} />
                          <span className='is-hidden-touch'>
                            &nbsp; <span className="has-text-transparent-white">The decentralized ERC-20 tokens registry</span>
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
                            <label>

                              <Toggle
                                defaultChecked={!this.props.isLight}
                                icons={{
                                  checked: <FontAwesomeIcon icon={faMoon} className="icon--react-toggle" />,
                                  unchecked: <FontAwesomeIcon icon={faSun} className="icon--react-toggle" />
                                }}
                                onChange={this.props.toggleTheme}
                              />
                            </label>
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
                                onClick={this.closeMobileMenu}
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
                            onClick={this.closeMobileMenu}
                          >
                            <AntdIcon type={BarsOutline} className="antd-icon" />&nbsp;
                            Registry
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.REGISTER_TOKEN}
                            className='navbar-item'
                            onClick={this.closeMobileMenu}
                          >
                            <AntdIcon type={AuditOutline} className="antd-icon " />&nbsp;
                            Register Token
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            exact
                            activeClassName="is-active"
                            to={routes.CHALLENGES}
                            className="navbar-item"
                            onClick={this.closeMobileMenu}
                          >
                            <AntdIcon type={BarsOutline} className="antd-icon" />&nbsp;
                            Challenges
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.VERIFY}
                            className={classnames(
                              'navbar-item',
                              {
                                'is-attention-grabby': applicationsToVerify > 0
                              }
                            )}
                            onClick={this.closeMobileMenu}
                          >
                            <AntdIcon
                              type={applicationsToVerify > 0 ? IssuesCloseOutline : CheckCircleOutline}
                              className="antd-icon"
                            />
                            &nbsp;{applicationsToVerify > 0 ? applicationsToVerify : ''} Verify
                          </NavLink>
                        </div>
                        <div className="navbar-item">
                          <NavLink
                            activeClassName="is-active"
                            to={routes.WALLET}
                            className="navbar-item"
                            onClick={this.closeMobileMenu}
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
