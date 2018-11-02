import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import ReduxToastr from 'react-redux-toastr'
import { hot } from 'react-hot-loader'
import { withRouter, Route, Switch } from 'react-router-dom'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { Admin } from '~/components/Admin/Admin'
import { ApplicantApplyContainer } from '~/components/ApplicantApplyContainer'
import { BetaFaucetModal } from '~/components/betaFaucet/BetaFaucetModal'
import { DebugLog } from '~/components/DebugLog'
import { FourOhFour } from '~/components/FourOhFour'
import { LoginToMetaMask } from '~/components/LoginToMetaMask'
import { GetTILW } from '~/components/GetTILW'
import { GetWallet } from '~/components/GetWallet'
import { Header } from '~/components/Header'
import { Home } from '~/components/Home'
import {
  cacheCall,
  cacheCallValue,
  contractByName,
  withSaga
} from 'saga-genesis'
// import { Web3Route } from '~/components/Web3Route'
import { VerifierStake } from '~/components/VerifierStake/VerifierStake'
import { Verify } from '~/components/Verifiers/Verify'
import { Wallet } from '~/components/Wallet'
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

const App = connect(mapStateToProps)(
  withSaga(appSaga)(
    class extends Component {
      constructor(props) {
        super(props)
        this.state = {
          sagasReady: false
        }
      }

      componentDidMount() {
        this.mountedAt = Date.now()
        this.props.setTimeout(() => {
          this.setState({
            sagasReady: true
          })
        }, 600)

        window.addEventListener("beforeunload", this.unload)
        window.addEventListener("focus", this.refocus)
        this.onAccountChangeSignOut(this.props)
      }

      componentWillUnmount () {
        window.removeEventListener("beforeunload", this.unload)
        window.removeEventListener("focus", this.refocus)
      }

      componentWillReceiveProps (nextProps) {
        this.onAccountChangeSignOut(nextProps)
      }

      onAccountChangeSignOut (nextProps) {
        // Sign out the localStorage/browser session when the users Eth address changes
        const addressDoesNotMatch = this.props.address && this.props.address !== nextProps.address
        const networkDoesNotMatch = this.props.networkId && this.props.networkId !== nextProps.networkId

        if (addressDoesNotMatch || networkDoesNotMatch) {
          this.signOut()
        }
      }

      unload = () => {
        this.signOut()
      }

      signOut () {
        if (window) {
          window.location.reload(true)
        }
      }

      render() {
        let betaFaucetModal = null,
          getTilw = null,
          header = null

        // if (this.state.sagasReady) {
          betaFaucetModal = <BetaFaucetModal  />
          getTilw = <GetTILW  />
          header = <Header isOwner={this.props.isOwner} />
        // }

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
          <React.Fragment>
            {getTilw}
            {betaFaucetModal}
            <GetWallet />
            <LoginToMetaMask />
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
                  <div className='column is-8 is-offset-2'>
                    <Switch>
                      <Route path={routes.ADMIN} component={Admin} />
                      <Route path={routes.APPLY} component={ApplicantApplyContainer} />
                      <Route path={routes.STAKE} component={VerifierStake} />
                      <Route path={routes.WALLET} component={Wallet} />
                      <Route path={routes.VERIFY} component={Verify} />

                      <Route path={routes.HOME} component={Home} />

                      <Route component={FourOhFour} />
                    </Switch>
                    <br />
                  </div>
                </div>
              </div>

              <br />
              <br />
              <br />

              <div className='columns'>
                <div className='column is-half-tablet is-offset-one-quarter'>
                  <div className="has-text-centered">
                    <h3>
                      What is this?
                    </h3>
                    <p className="has-text-grey-light">
                      Explain the Coordination Game, demo, what a Trustless Incentivized List is and link to a blog post with more info.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className='section'>
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
        )
      }
    }
  )
)

export const AppContainer = withRouter(ReactTimeout(hot(module)(App)))
