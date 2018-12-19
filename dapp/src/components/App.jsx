import React, { Component } from 'react'
import ReactTimeout from 'react-timeout'
import ReduxToastr from 'react-redux-toastr'
import { hot } from 'react-hot-loader'
import { Route, Switch, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import {
  cacheCall,
  cacheCallValue,
  contractByName,
  withSaga
} from 'saga-genesis'

import { Application } from '~/components/Applications/Application'
import { ApplicantRegisterTokenContainer } from '~/components/Applications/ApplicantRegisterTokenContainer'
import { ChallengesTable } from '~/components/Challenges/ChallengesTable'
import { Listing } from '~/components/Listings/Listing'
import { Verify } from '~/components/Verifiers/Verify'

import { GetTEX } from '~/components/Helpers/GetTEX'
import { GetWallet } from '~/components/Helpers/GetWallet'
import { Loading } from '~/components/Helpers/Loading'

import { BodyClass } from '~/components/Layout/BodyClass'
import { Header } from '~/components/Layout/Header'

import { Admin } from '~/components/Pages/Admin'
import { Home } from '~/components/Pages/Home'
import { FAQ } from '~/components/Pages/FAQ'
import { FourOhFour } from '~/components/Pages/FourOhFour'
import { Wallet } from '~/components/Pages/Wallet'

import { BetaFaucetModal } from '~/components/Modals/BetaFaucetModal'
import { IntroModal } from '~/components/Modals/IntroModal'
import { LoginToMetaMaskModal } from '~/components/Modals/LoginToMetaMaskModal'
import { NetworkCheckModal } from '~/components/Modals/NetworkCheckModal'

import { retrieveKeyValFromLocalStorage } from '~/services/retrieveKeyValFromLocalStorage'
import { storeKeyValInLocalStorage } from '~/services/storeKeyValInLocalStorage'
import * as routes from '~/../config/routes'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const networkId = get(state, 'sagaGenesis.network.networkId')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const isMinter = cacheCallValue(state, workTokenAddress, 'isMinter', address)
  const isOwner = address && isMinter

  return {
    workTokenAddress,
    address,
    isOwner,
    networkId
  }
}

function* appSaga({ workTokenAddress, address }) {
  if (!workTokenAddress) { return }

  yield cacheCall(workTokenAddress, 'isMinter', address)
}

export const App = connect(mapStateToProps)(
  withSaga(appSaga)(
    class extends Component {
      constructor(props) {
        super(props)

        const theme = retrieveKeyValFromLocalStorage('theme')

        this.state = {
          isLight: theme === 'light'
        }
      }

      componentDidMount() {
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

      toggleTheme = (e) => {
        this.setState({
          isLight: !this.state.isLight
        }, () => {
          storeKeyValInLocalStorage('theme', this.state.isLight ? 'light' : 'dark')
        })
      }

      render() {
        let betaFaucetModal,
          introModal,
          getTEX,
          header

        betaFaucetModal = <BetaFaucetModal />
        introModal = <IntroModal />
        getTEX = <GetTEX />

        header = <Header
          isOwner={this.props.isOwner}
          toggleTheme={this.toggleTheme}
          isLight={this.state.isLight}
        />

        return (
          <BodyClass isLight={this.state.isLight}>
            <React.Fragment>
              {getTEX}
              {betaFaucetModal}
              {introModal}
              <GetWallet />
              <NetworkCheckModal />
              <LoginToMetaMaskModal />
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
                    <div className='column  is-12-tablet  is-10-widescreen is-offset-1-widescreen'>
                      <TransitionGroup>
                        <CSSTransition
                          key={this.props.location.key}
                          timeout={{ enter: 1000, exit: 300 }}
                          classNames='page'
                          appear={true}
                        >
                          <Switch location={this.props.location}>
                            <Route path={routes.ADMIN} component={Admin} />

                            <Route path={routes.APPLICATION} component={Application} />
                            <Route path={routes.VERIFY} component={Verify} />
                            <Route path={routes.REGISTER_TOKEN} component={ApplicantRegisterTokenContainer} />
                            <Route path={routes.WALLET} component={Wallet} />
                            <Route path={routes.CHALLENGES} component={ChallengesTable} />
                            <Route path={routes.LISTING} component={Listing} />

                            <Route path={routes.FAQ} component={FAQ} />
                            <Route path={routes.REGISTRY} component={Home} />
                            <Route path={routes.HOME} component={Home} />

                            <Route component={FourOhFour} />
                          </Switch>
                        </CSSTransition>
                      </TransitionGroup>
                      <br />
                    </div>
                  </div>

                </div>
              </section>

            </React.Fragment>
          </BodyClass>
        )
      }
    }
  )
)

export const AppContainer = withRouter(ReactTimeout(hot(module)(App)))
