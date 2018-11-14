import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import ReduxToastr from 'react-redux-toastr'
import { hot } from 'react-hot-loader'
import { Link, Route, Switch, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { get } from 'lodash'
import {
  cacheCall,
  cacheCallValue,
  contractByName,
  withSaga
} from 'saga-genesis'
import { Admin } from '~/components/Admin/Admin'
import { ApplicantRegisterTokenContainer } from '~/components/ApplicantRegisterTokenContainer'
import { BetaFaucetModal } from '~/components/betaFaucet/BetaFaucetModal'
import { BodyClass } from '~/components/BodyClass'
import { DebugLog } from '~/components/DebugLog'
import { FAQModal } from '~/components/FAQModal'
import { FourOhFour } from '~/components/FourOhFour'
import { GetTILW } from '~/components/GetTILW'
import { GetWallet } from '~/components/GetWallet'
import { Header } from '~/components/Header'
import { Home } from '~/components/Home'
import { Loading } from '~/components/Loading'
import { LoginToMetaMask } from '~/components/LoginToMetaMask'
import { NetworkCheckModal } from '~/components/NetworkCheckModal'
import { VerifyApplication } from '~/components/Verifiers/VerifyApplication'
import { Verify } from '~/components/Verifiers/Verify'
import { Wallet } from '~/components/Wallet'
import { retrieveKeyValFromLocalStorage } from '~/services/retrieveKeyValFromLocalStorage'
import { storeKeyValInLocalStorage } from '~/services/storeKeyValInLocalStorage'
import * as routes from '~/../config/routes'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const networkId = get(state, 'sagaGenesis.network.networkId')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const isOwner = address && (cacheCallValue(state, workTokenAddress, 'owner') === address)

  return {
    address,
    isOwner,
    networkId
  }
}

function* appSaga({ workTokenAddress }) {
  if (!workTokenAddress) { return }

  yield cacheCall(workTokenAddress, 'owner')
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchShowFaqModal: () => {
      dispatch({ type: 'SHOW_FAQ_MODAL' })
    }
  }
}

const App = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(appSaga)(
    class extends Component {
      constructor(props) {
        super(props)

        const theme = retrieveKeyValFromLocalStorage('theme')

        this.state = {
          sagasReady: false,
          isLight: theme === 'light'
        }
      }

      componentDidMount() {
        this.mountedAt = Date.now()
        this.props.setTimeout(() => {
          this.setState({
            sagasReady: true
          })
        }, 600)

        this.onAccountChangeSignOut(this.props)
      }

      componentWillReceiveProps (nextProps) {
        this.onAccountChangeSignOut(nextProps)
      }

      onAccountChangeSignOut (nextProps) {
        // Sign out the localStorage/browser session when the users Eth address changes
        const addressDoesNotMatch = this.props.address && this.props.address !== nextProps.address
        const networkDoesNotMatch = this.props.networkId && this.props.networkId !== nextProps.networkId

        if (addressDoesNotMatch || networkDoesNotMatch) {
          this.reloadPage()
        }
      }

      reloadPage () {
        if (window) {
          window.location.reload(true)
        }
      }

      handleShowFaq = (e) => {
        e.preventDefault()

        storeKeyValInLocalStorage('dontShowFaqModal', null)

        this.props.dispatchShowFaqModal()
      }

      toggleTheme = (e) => {
        this.setState({
          isLight: !this.state.isLight
        }, () => {
          storeKeyValInLocalStorage('theme', this.state.isLight ? 'light' : 'dark')
        })
      }

      render() {
        let betaFaucetModal,
          faqModal,
          getTilw,
          header

        betaFaucetModal = <BetaFaucetModal />
        faqModal = <FAQModal />
        getTilw = <GetTILW />
        header = <Header
          isOwner={this.props.isOwner}
          toggleTheme={this.toggleTheme}
          isLight={this.state.isLight}
        />

        if (process.env.REACT_APP_ENABLE_FIREBUG_DEBUGGER) {
          if (this.state.debugging) {
            var debugLog =
              <div>
                <hr />
                <DebugLog />
              </div>
          }

          var debugLink =
            <div>
              {/*<a onClick={this.handleBugsnagTrigger} className='btn btn-danger'>Trigger Bugsnag Notification</a>*/}
              <button
                onClick={() => this.setState({ debugging: !this.state.debugging })}
                className='button button-primary'
              >Toggle Log</button>
              {debugLog}
            </div>
        }

        return (
          <BodyClass isLight={this.state.isLight}>
            <React.Fragment>
              {getTilw}
              {betaFaucetModal}
              {faqModal}
              <GetWallet />
              <NetworkCheckModal />
              <LoginToMetaMask />
              <Loading />
              <ReduxToastr
                timeOut={7000}
                newestOnTop={true}
                tapToDismiss={false}
                position="bottom-left"
                transitionIn="bounceIn"
                transitionOut="bounceOut"
              />

              {header}

              <section className='section'>
                <div className='container is-fluid'>
                  <div className='columns'>
                    <div className='column is-10-widescreen is-offset-1-widescreen'>
                      <Switch>
                        <Route path={routes.VERIFY_APPLICATION} component={VerifyApplication} />
                        <Route path={routes.VERIFY} component={Verify} />
                        <Route path={routes.REGISTER_TOKEN} component={ApplicantRegisterTokenContainer} />
                        <Route path={routes.WALLET} component={Wallet} />
                        <Route path={routes.ADMIN} component={Admin} />

                        <Route path={routes.REGISTRY} component={Home} />
                        <Route path={routes.HOME} component={Home} />

                        <Route component={FourOhFour} />
                      </Switch>
                      <br />
                    </div>
                  </div>

                  <br />
                  <br />
                  <br />

                  <div className="level--container">
                    <nav className="level level--body">
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="heading is-size-5 has-text-grey-lighter">
                            What is this?
                          </p>
                          <p className="title">
                            <button onClick={this.handleShowFaq}>Read the FAQ</button>
                          </p>
                        </div>
                      </div>
                    </nav>

                    <nav className="level level--footer">
                      <div className="level-item has-text-centered">
                        <div>
                          <p className="title">
                            <Link to={routes.REGISTER_TOKEN} className="is-size-7">
                              Apply to be on the Registry
                            </Link>
                          </p>
                        </div>
                      </div>

                      <div className="level-item has-text-centered">
                        <div>
                          <p className="title">
                            <Link to={routes.VERIFY} className="is-size-7">
                              Stake to become a Verifier
                            </Link>
                          </p>
                        </div>
                      </div>
                    </nav>
                  </div>
                </div>
              </section>

              <section className='section section--footer'>
                <footer className="footer has-text-centered">
                  <div className='columns'>
                    <div className='column is-half-tablet is-offset-one-quarter'>
                      <p className="text-footer">
                        &copy; Copyright 2018 Medical Exchange Protocols. All Rights Reserved.
                      </p>
                      <br />
                      <br />
                      {debugLink}
                    </div>
                  </div>
                </footer>
              </section>
            </React.Fragment>
          </BodyClass>
        )
      }
    }
  )
)

export const AppContainer = withRouter(ReactTimeout(hot(module)(App)))
