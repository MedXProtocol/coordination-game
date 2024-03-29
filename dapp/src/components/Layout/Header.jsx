import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import classnames from 'classnames'
import Toggle from 'react-toggle'
import Autocomplete from '~/autocomplete'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { Link, NavLink } from 'react-router-dom'
import { get } from 'lodash'
import { formatRoute } from 'react-router-named-routes'
import { CurrentTransactionsList } from '~/components/Layout/CurrentTransactionsList'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueInt,
  contractByName,
  withSaga
} from 'saga-genesis'
import {
  BookOutline,
  FileAddOutline,
  FormOutline,
  DatabaseOutline,
  CheckCircleOutline,
  ThunderboltOutline,
  IssuesCloseOutline,
  SearchOutline,
  SettingOutline,
  WalletOutline
} from '@ant-design/icons'
import AntdIcon from '@ant-design/icons-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon } from '@fortawesome/free-solid-svg-icons'
import { faSun } from '@fortawesome/free-regular-svg-icons'
import { NetworkInfo } from '~/components/Layout/NetworkInfo'
import { verifierApplicationsService } from '~/services/verifierApplicationsService'
import { applicationService } from '~/services/applicationService'
import { verifierApplicationsSaga } from '~/sagas/verifierApplicationsSaga'
import { applicationSaga } from '~/sagas/applicationSaga'
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'
import { getWeb3 } from '~/utils/getWeb3'
import TokenRegistryLogo from '~/assets/img/the-token-registry.svg'
import * as routes from '~/../config/routes'

function mapStateToProps(state) {
  let applicationsToVerify = 0
  let applicationObjects = []
  let applicationExists,
    listingExists

  const address = get(state, 'sagaGenesis.accounts[0]')
  const query = get(state, 'search.query')
  const hexQuery = getWeb3().utils.asciiToHex(get(state, 'search.query'))

  const coordinationGameAddress = contractByName(state, 'CoordinationGame')
  const tilRegistryAddress = contractByName(state, 'TILRegistry')

  const applicationCount = cacheCallValueInt(state, coordinationGameAddress, 'getVerifiersApplicationCount', address)
  const latestBlockTimestamp = get(state, 'sagaGenesis.block.latestBlock.timestamp')

  if (hexQuery !== '0x00') { // blank / undefined is translating to 0x00 in hex
    listingExists     = cacheCallValue(state, tilRegistryAddress, 'listingExists', hexQuery)
    applicationExists = cacheCallValue(state, coordinationGameAddress, 'applicationExists', hexQuery)
  }

  if (applicationCount && applicationCount !== 0) {
    applicationObjects = verifierApplicationsService(state, applicationCount)
  }

  for (let i = 0; i < applicationObjects.length; i++) {
    const applicationId = applicationObjects[i].applicationId

    const application = applicationService(state, applicationId, coordinationGameAddress, tilRegistryAddress)
    const verifierSubmittedSecret = !isBlank(application.verifiersSecret)

    if (!verifierSubmittedSecret && (latestBlockTimestamp < application.verifierSubmitSecretExpiresAt)) {
      applicationsToVerify += 1
    }
  }

  return {
    address,
    applicationExists,
    listingExists,
    applicationsToVerify,
    applicationCount,
    applicationObjects,
    coordinationGameAddress,
    hexQuery,
    query,
    tilRegistryAddress
  }
}

function* headerSaga({ address, applicationCount, applicationObjects, coordinationGameAddress, tilRegistryAddress, hexQuery }) {
  if (!coordinationGameAddress || !tilRegistryAddress || !address) { return }

  yield verifierApplicationsSaga({ coordinationGameAddress, address, applicationCount })

  if (hexQuery !== '0x00') { // blank / undefined is translating to 0x00 in hex
    yield all([
      cacheCall(tilRegistryAddress, 'listingExists', hexQuery),
      cacheCall(coordinationGameAddress, 'applicationExists', hexQuery)
    ])
  }

  if (applicationObjects && applicationObjects.length !== 0) {
    yield all(
      applicationObjects.map(function* (applicationObject) {
        yield applicationSaga({ coordinationGameAddress, tilRegistryAddress, applicationId: applicationObject.applicationId })
      })
    )
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchUpdateSearchQuery: ({ query }) => {
      dispatch({ type: 'UPDATE_SEARCH_QUERY', query })
    },
    dispatchClearSearchQuery: () => {
      dispatch({ type: 'CLEAR_SEARCH_QUERY' })
    }
  }
}

export const Header = ReactTimeout(
  withRouter(
    connect(mapStateToProps, mapDispatchToProps)(
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

          componentWillReceiveProps(nextProps) {
            if (defined(nextProps.applicationExists) || defined(nextProps.listingExists)) {
              let items = []

              if (nextProps.listingExists) {
                items.push({
                  path: nextProps.listingExists ? formatRoute(routes.LISTING, { listingHash: nextProps.query }) : -1,
                  name: nextProps.listingExists ? `View Listing: ${nextProps.query}` : '',
                  icon: nextProps.listingExists ? <AntdIcon type={BookOutline} className="antd-icon" /> : ''
                })
              } else if (nextProps.applicationExists) {
                items.push({
                  path: nextProps.applicationExists ? formatRoute(routes.APPLICATION, { applicationId: nextProps.query }) : -1,
                  name: nextProps.applicationExists ? `View Submission: ${nextProps.query}` : '',
                  icon: nextProps.applicationExists ? <AntdIcon type={FormOutline} className="antd-icon" /> : ''
                })
              }

              this.refs.autocomplete.setItems(items);
            } else if (nextProps.query) {
              this.refs.autocomplete.setItems([])
            } else {
              this.refs.autocomplete.hideItems()
            }
          }

          // invoked when the user types something. A delay of 200ms is
          // already provided to avoid DDoS'ing your own servers
          handleTextInputChange = (query) => {
            this.props.dispatchUpdateSearchQuery({ query })
          }

          // called when the user clicks an option or hits enter
          // // the returned value will be inserted into the input field.
          // // Use an empty String to reset the field
          onSelect = (item) => {
            if (item && item.path) {
              this.handleCloseSearchClick()
              this.props.history.push(item.path)
            }

            return ''
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

          handleOpenSearchClick = (e) => {
            e.preventDefault()

            if (this.state.searchActive) { return }

            this.setState({
              searchActive: true
            })
          }

          handleCloseSearchClick = (e) => {
            if (e) {
              e.preventDefault()
            }

            this.props.dispatchClearSearchQuery()
            this.refs.autocomplete.refs.input.blur()

            const fakeEvent = {
              target: { value: '' }
            }
            this.refs.autocomplete.onChangeInput(fakeEvent)

            this.setState({
              searchActive: false
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
                    { 'fade-in-start': this.state.oneVisible, 'fade-out': this.state.searchActive }
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
                      <div className="navbar-start">
                        {
                          this.props.isOwner ? (
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
                          )
                          : null
                        }

                        <div className="navbar-item">
                          <div
                            onClick={this.handleCloseSearchClick}
                            className={classnames('search--background', {
                              'search--background__active': this.state.searchActive
                            })}>
                          </div>

                          <form
                            autoComplete="off"
                            onSubmit={this.handleSubmitSearch}
                            className={classnames('search--form', {
                              'search--form__active': this.state.searchActive
                            })}
                          >
                            <button
                              className="is-outlined delete"
                              onClick={this.handleCloseSearchClick}
                            >
                            </button>

                            <div className="field search--field has-addons">
                              <div className="control search--control__input has-icons-right">
                                <Autocomplete
                                  name="searchQuery"
                                  ref="autocomplete"
                                  renderItem={({ item }) => {
                                    return <div className="user-data">
                                      <button>{item.icon} {item.name}</button>
                                    </div>
                                  }}
                                  onSelect={this.onSelect}
                                  onClick={this.handleOpenSearchClick}
                                  onChange={this.handleTextInputChange}
                                  className='text-input search--text-input is-marginless is-small'
                                  placeholder="search for a token ticker symbol"
                                />
                              </div>
                              <div className="control search--control__button has-icons-right">
                                <button
                                  onClick={this.handleOpenSearchClick}
                                  className="button is-outlined is-small is-right"
                                >
                                  <AntdIcon type={SearchOutline} className="antd-icon" />
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>




                      <div className="navbar-end">
                        <div className="navbar-item">
                          <NavLink
                            exact
                            activeClassName="is-active"
                            to={routes.HOME}
                            className="navbar-item"
                            onClick={this.closeMobileMenu}
                          >
                            <AntdIcon type={DatabaseOutline} className="antd-icon" />&nbsp;
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
                            <AntdIcon type={FileAddOutline} className="antd-icon " />&nbsp;
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
                            <AntdIcon type={ThunderboltOutline} className="antd-icon" />&nbsp;
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
