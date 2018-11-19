import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { get } from 'lodash'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
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
import AInBox from '~/assets/img/a-in-box-6.svg'
import GuyFrame1 from '~/assets/img/guy-frame-1--2.svg'
import QSpeechBubble from '~/assets/img/q-speech-bubble--2.svg'

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
          modalState
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

      handleDontShow = (e) => {
        e.preventDefault()

        this.handleCloseModal()
        storeKeyValInLocalStorage('dontShowIntroModal', 'true')
      }

      render () {
        return (
          <Modal
            closeModal={this.handleCloseModal}
            modalState={this.state.modalState}
            title="Intro Modal"
          >
            <div className='intro-modal has-text-centered'>


              <div className='columns is-mobile'>
                <div className='column is-6 has-text-right is-gapless is-paddingless'>
                  <TransitionGroup>
                    <CSSTransition key='1' classNames="slide-up" timeout={3000}>
                      <QSpeechBubble key='1' width="416" height="155" className="q-speech-bubble"  style={{"transitionDelay": `.4s` }} />
                    </CSSTransition>

                    <CSSTransition key='2' classNames="slide-up" timeout={3000}>
                      <br  key='2' />
                    </CSSTransition>

                    <CSSTransition key='3' classNames="slide-up" timeout={3000}>
                      <br key='3' />
                    </CSSTransition>

                    <CSSTransition key='4' classNames="slide-up" timeout={3000}>
                      <AInBox key='4' width="300" height="163" className="a-in-box" style={{"transitionDelay": `.2s` }} />
                    </CSSTransition>
                  </TransitionGroup>
                </div>

                <div className='column is-6 has-text-left is-gapless is-paddingless'>
                  <TransitionGroup>
                    <CSSTransition key='78' classNames="slide-up" timeout={3000}>
                      <GuyFrame1 width="400" height="400" className="guy-frame-1" />
                    </CSSTransition>
                  </TransitionGroup>
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
                  onClick={this.handleCloseModal}
                  className="button is-primary is-outlined"
                >
                  Ok, thanks! I'd like to try it out
                </button>
              </p>
              <br />
              <p>
                <button
                  onClick={this.handleDontShow}
                  className="button is-light is-text is-small"
                >
                  don't show this message again
                </button>
              </p>
            </div>
          </Modal>
        )
      }
    }
  )
)
