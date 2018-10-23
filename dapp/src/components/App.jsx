import { hot } from 'react-hot-loader'
import React, { Component } from 'react'
import { withRouter, Route, Switch } from 'react-router-dom'
import ReactTimeout from 'react-timeout'
import { connect } from 'react-redux'
import ReduxToastr from 'react-redux-toastr'
import { get } from 'lodash'
import { ApplicantApplyContainer } from '~/components/ApplicantApplyContainer'
import { BetaFaucetModal } from '~/components/betaFaucet/BetaFaucetModal'
import { DebugLog } from '~/components/DebugLog'
import { FourOhFour } from '~/components/FourOhFour'
import { LoginToMetaMask } from '~/components/LoginToMetaMask'
import { GetTILW } from '~/components/GetTILW'
import { GetWallet } from '~/components/GetWallet'
import { Header } from '~/components/Header'
import { Home } from '~/components/Home'
import { Web3Route } from '~/components/Web3Route'
import { VerifierStake } from '~/components/VerifierStake'
import * as routes from '~/../config/routes'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const networkId = get(state, 'sagaGenesis.network.networkId')

  return {
    address,
    networkId
  }
}

const App = connect(mapStateToProps)(
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
      }, 1000)


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

      if (this.state.sagasReady) {
        betaFaucetModal = <BetaFaucetModal  />
        getTilw = <GetTILW  />
        header = <Header />
      }

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
                <div className='column is-one-half-desktop'>

                  <Switch>
                    <Route path={routes.HOME} component={Home} />

                    <Web3Route path={routes.APPLY} component={ApplicantApplyContainer} />
                    <Web3Route path={routes.STAKE} component={VerifierStake} />

                    <Route path={routes.HOME} component={FourOhFour} />
                  </Switch>
                  <br />
                  <br />
                  <hr />
                </div>
              </div>
            </div>

            <div className='columns'>
              <div className='column is-half-desktop is-offset-one-quarter'>
                <footer className="has-text-centered">
                  <h3>
                    What is this?
                  </h3>
                  <p className="has-text-grey-light">
                    Explain the Coordination Game, demo, what a Trustless Incentivized List is and link to a blog post with more info.
                  </p>
                </footer>
              </div>
            </div>

            <br />
          </section>

          <footer className="footer has-text-centered">
            <section className='section'>
              <div className='container is-fluid'>
                <div className='columns'>
                  <div className='column is-one-half-desktop'>
                    <p className="text-footer">
                      &copy; 2018 MedX Protocol - All Rights Reserved
                    </p>
                    <br />
                    <br />
                    {debugLink}
                  </div>
                </div>
              </div>
            </section>
          </footer>
        </React.Fragment>
      )
    }
  }
)

export const AppContainer = withRouter(ReactTimeout(hot(module)(App)))
