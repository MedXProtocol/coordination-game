import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import { hot } from 'react-hot-loader'
import { connect } from 'react-redux'
import ReduxToastr from 'react-redux-toastr'
import { get } from 'lodash'
import { BetaFaucetModal } from '~/components/betaFaucet/BetaFaucetModal'
import { Header } from '~/components/Header'
import { StartGameFormContainer } from '~/components/StartGameForm'
import { GetWallet } from '~/components/GetWallet'
import { LoginToMetaMask } from '~/components/LoginToMetaMask'
import { GetTILW } from '~/components/GetTILW'

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
          <section className='section'>
            <div className='container is-fluid'>
              <div className='columns'>
                <div className='column is-one-half-desktop'>
                  {header}

                  <StartGameFormContainer />
                  <br />
                  <br />
                  <hr />

                </div>
              </div>

              <div className='columns'>
                <div className='column is-half-desktop is-offset-one-quarter'>

                <div className="entries has-text-centered">
                  <table className="table is-fullwidth">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Application #</th>
                        <th>Hint</th>
                        <th>Secret</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>May 31st, 2018</th>
                        <th>1</th>
                        <th>200 + 200</th>
                        <th>400</th>
                        <th>Verified</th>
                      </tr>
                      <tr>
                        <th>June 2nd, 2018</th>
                        <th>2</th>
                        <th>300 + 2</th>
                        <th>5693</th>
                        <th>Rejected</th>
                      </tr>
                      <tr>
                        <th>July 20th, 2018</th>
                        <th>3</th>
                        <th>342 + 182</th>
                        <th>3</th>
                        <th>Challenged</th>
                      </tr>
                    </tbody>
                  </table>
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

            </div>
            <br />

          </section>
        </React.Fragment>
      )
    }
  }
)

export const AppContainer = ReactTimeout(hot(module)(App))
