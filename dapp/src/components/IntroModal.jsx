import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { CSSTransition } from 'react-transition-group'
import ReactCSSTransitionReplace from 'react-css-transition-replace'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
import { Modal } from '~/components/Modal'
import { retrieveKeyValFromLocalStorage } from '~/services/retrieveKeyValFromLocalStorage'
import { storeKeyValInLocalStorage } from '~/services/storeKeyValInLocalStorage'
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'
import { weiToEther } from '~/utils/weiToEther'
import AInBox from '~/assets/img/a-in-box.svg'
import GuyFrame1 from '~/assets/img/guy-frame-1.svg'
import GuyFrame4 from '~/assets/img/guy-frame-4.svg'
import QSpeechBubble from '~/assets/img/q-speech-bubble.svg'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const showIntroModal = (
    retrieveKeyValFromLocalStorage('dontShowIntroModal') !== 'true'
  ) && get(state, 'introModal.showIntroModal')

  // START beta faucet specific (to avoid opening Intro Modal when Beta Faucet is open)
  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')

  const betaFaucetAddress = contractByName(state, 'BetaFaucet')
  const hasBeenSentEther = cacheCallValue(state, betaFaucetAddress, 'sentEtherAddresses', address)
  const needsEth = (weiToEther(ethBalance) < 0.1 && !hasBeenSentEther)
  const needsTEX = (weiToEther(texBalance) < 100)

  const betaFaucetVisible =
    !betaFaucetModalDismissed &&
    (
      defined(workTokenAddress) && defined(betaFaucetAddress) &&
      defined(ethBalance) && defined(texBalance)
    ) &&
    (needsEth || needsTEX)
  // END beta faucet specific

  return {
    address,
    betaFaucetAddress,
    betaFaucetVisible,
    showIntroModal,
    workTokenAddress
  }
}

function* introModalSaga({ workTokenAddress, betaFaucetAddress, address }) {
  if (!workTokenAddress || !betaFaucetAddress || !address) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(betaFaucetAddress, 'sentEtherAddresses', address)
  ])
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchHideIntroModal: () => {
      dispatch({ type: 'HIDE_INTRO_MODAL' })
    }
  }
}

export const IntroModal =
  connect(mapStateToProps, mapDispatchToProps)(
    withSaga(introModalSaga)(
      class _IntroModal extends Component {

      constructor(props) {
        super(props)

        const modalState = retrieveKeyValFromLocalStorage('dontShowIntroModal') !== 'true'

        this.state = {
          modalState,
          step: 1
        }
      }

      componentDidMount() {
        this.determineModalState(this.props)
      }

      componentWillReceiveProps(nextProps) {
        this.determineModalState(nextProps)
      }

      determineModalState(props) {
        if (!isBlank(props.address) && !props.betaFaucetVisible && props.showIntroModal) {
          this.setState({
            modalState: true
          })
        }
      }

      handleCloseModal = () => {
        this.setState({
          modalState: false
        })

        storeKeyValInLocalStorage('dontShowIntroModal', 'true')
        this.props.dispatchHideIntroModal()
      }

      handlePrimaryButtonClick = (e) => {
        e.preventDefault()

        if (this.state.step === 3) {
          this.handleDontShow()
        } else {
          this.handleNextStep()
        }
      }

      handleNextStep = (e) => {
        if (e) {
          e.preventDefault()
        }

        this.setState({
          step: Math.min(this.state.step + 1, 3)
        })
      }

      handlePreviousStep = (e) => {
        e.preventDefault()

        this.setState({
          step: Math.max(this.state.step - 1, 1)
        })
      }

      handleDontShow = (e) => {
        if (e) {
          e.preventDefault()
        }

        this.handleCloseModal()
        storeKeyValInLocalStorage('dontShowIntroModal', 'true')
      }

      buttonText = () => {
        let text

        switch(this.state.step) {
          case 1:
            text = `Ok - then what happens?`
            break
          case 2:
            text = `Cool, what next?`
            break
          case 3:
            text = `Great, thanks! I'd like to try it out`
            break
          // no default
        }

        return text
      }

      render () {
        const guy1 = <GuyFrame1 key="guy1" width="221" height="221" className="guy-frame-1 guy" style={{ height: 220 }} />
        const guy2 = <GuyFrame4 key="guy2" width="221" height="221" className="guy-frame-1 guy" style={{ height: 220 }} />
        const guy3 = <GuyFrame1 key="guy3" width="221" height="221" className="guy-frame-1 guy" style={{ height: 220 }} />

        const qSpeechBubble = <QSpeechBubble width="316" height="116" className="q-speech-bubble delay-two" />

        const aInBox = <AInBox width="221" height="124" className="a-in-box delay-three" />

        return (
          <Modal
            closeModal={this.handleCloseModal}
            modalState={this.state.modalState}
            title="Intro Modal"
          >
            <div className='intro-modal has-text-centered'>

              <div className='columns is-mobile'>
                <div className='column is-6 has-text-right is-gapless is-paddingless'>
                  <ReactCSSTransitionReplace
                    transitionName="cross-fade"
                    transitionEnterTimeout={1000}
                    transitionLeaveTimeout={400}
                  >
                    {this.state.step === 1 ? (guy1) : this.state.step === 2 ? (guy2) : (guy3) }
                  </ReactCSSTransitionReplace>
                </div>

                <div className='column is-6 has-text-left is-gapless is-paddingless'>
                  <ReactCSSTransitionReplace
                    transitionName="cross-fade"
                    transitionEnterTimeout={1000}
                    transitionLeaveTimeout={400}
                  >
                    {this.state.step === 1 ? (qSpeechBubble) : this.state.step === 2 ? (aInBox) : (aInBox) }
                  </ReactCSSTransitionReplace>
                </div>
              </div>


              <p>
                Welcome to <strong>The Token Registry</strong>! This is a demo of a trustless incentivized list (TIL for short).
                <br />
                <br />
              </p>

              <p>
                The game starts off with one party creating both a <strong>Hint</strong> (or Q for Question) and a <strong>Secret</strong> (or A for Answer).
              </p>

              <p>
                <br />
                <button
                  onClick={this.handlePrimaryButtonClick}
                  className="button is-primary is-outlined"
                >
                  {this.buttonText()}
                </button>
              </p>


              <button
                onClick={this.handlePreviousStep}
                className="button is-light is-text is-small"
              >
                previous
              </button>

              <button
                onClick={this.handleNextStep}
                className="button is-light is-text is-small"
              >
                next
              </button>


              <br />
              <p>
                <button
                  onClick={this.handleDontShow}
                  className="button is-light is-text is-small"
                >
                  don't show this again
                </button>
              </p>
            </div>
          </Modal>
        )
      }
    }
  )
)

// <p>
//   <br />
//   <button
//     onClick={this.handleCloseModal}
//     className="button is-primary is-outlined"
//   >
//     Ok, thanks! I'd like to try it out
//   </button>
// </p>
