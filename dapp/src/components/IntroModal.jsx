import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { get } from 'lodash'
import classnames from 'classnames'
import ReactCSSTransitionReplace from 'react-css-transition-replace'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueBigNumber,
  contractByName,
  withSaga
} from 'saga-genesis'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '~/components/Modal'
import { retrieveKeyValFromLocalStorage } from '~/services/retrieveKeyValFromLocalStorage'
import { storeKeyValInLocalStorage } from '~/services/storeKeyValInLocalStorage'
import { defined } from '~/utils/defined'
import { isBlank } from '~/utils/isBlank'
import { weiToEther } from '~/utils/weiToEther'
import GuyFrame1 from '~/assets/img/guy-frame-1.svg'
import GuyFrame3 from '~/assets/img/guy-frame-3.svg'
import GalFrame2 from '~/assets/img/gal-frame-2.svg'
import QSpeechBubble from '~/assets/img/q-speech-bubble.svg'
import QAList from '~/assets/img/qa-list.svg'
import IsQA from '~/assets/img/is-qa.svg'
import QA from '~/assets/img/qa.svg'

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
            modalState: true,
            step: 1
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
            text = `Cool, what's next?`
            break
          case 3:
            text = `Great, thanks! I'd like to try it out`
            break
          // no default
        }

        return text
      }

      render () {
        const guy1 = <GuyFrame1 key="guy1" width="240" height="240" className="guy-frame-1" />
        const guy3 = <GuyFrame3 key="guy3" width="240" height="240" className="guy-frame-1" />

        const isQA = <IsQA key="is-qa" width="240" height="240" className="guy-frame-1" />

        const gal2 = <GalFrame2 key="gal2" width="240" height="240" className="guy-frame-1" />

        const qSpeechBubble = <QSpeechBubble key="q-speech-bubble" width="270" height="230" className="q-speech-bubble" />
        const qaList = <QAList key="qa-list" width="270" height="230" className="qa-list" />

        const qa = <QA key="qa" width="101" height="65" className={classnames(
          'qa-word',
          {
            'qa-word-appear': this.state.step === 3
          }
        )} />

        const step1Text = (
          <div className="intro-modal--text">
            <p>
              Welcome to <strong>The Token Registry</strong>! This is a demo of a trustless incentivized list (TIL for short).
              <br />
              <br />
            </p>

            <p>
              The game starts off with an Applicant submitting both a <strong>Hint</strong> (or Q for Question) and a <strong>Secret</strong> (or A for Answer).
            </p>
          </div>
        )

        const step2Text = (
          <div className="intro-modal--text">
            <p>
              A Verifier is then assigned to check the validity of the submission. In other words, to make sure the Hint matches the <strong>Secret</strong>.
              <br />
              <br />
            </p>

            <p>
              The Applicant then needs to come back and reveal their <strong>Secret</strong>.
            </p>
          </div>
        )

        const step3Text = (
          <div className="intro-modal--text">
            <p>
              If the Verifier came up with the same <strong>Secret</strong> as the Applicant's then the submission is added to the registry. Now anyone can start a Power Challenge to contest the validity of the entry in the registry.
              <br />
              <br />
            </p>

            <p>
              That's about it!
            </p>
          </div>
        )

        return (
          <Modal
            closeModal={this.handleCloseModal}
            modalState={this.state.modalState}
            title="Intro Modal"
            modalCssClass='intro-modal'
          >
            <div className='intro-modal has-text-centered'>

              <div className='columns is-mobile'>
                <div className={classnames('intro-modal--image-column', 'column', 'is-6', 'is-gapless', 'is-paddingless', {
                  'has-text-right': this.state.step === 1 || this.state.step === 2 || this.state.step === 3
                })}>
                  <ReactCSSTransitionReplace
                    transitionName="cross-fade"
                    transitionEnterTimeout={1000}
                    transitionLeaveTimeout={400}
                    overflowHidden={false}
                  >
                    {this.state.step === 1 ? (guy1) : this.state.step === 2 ? (isQA) : this.state.step === 3 ? (guy3) : null }
                  </ReactCSSTransitionReplace>
                </div>

                <div className={classnames('intro-modal--image-column', 'column', 'is-6', 'is-gapless', 'is-paddingless', {
                  'has-text-left': this.state.step === 1 || this.state.step === 2 || this.state.step === 3
                })}>
                  <ReactCSSTransitionReplace
                    transitionName="cross-fade"
                    transitionEnterTimeout={1000}
                    transitionLeaveTimeout={400}
                    overflowHidden={false}
                  >
                    {this.state.step === 1 ? (qSpeechBubble) : this.state.step === 2 ? (gal2) : this.state.step === 3 ? (qaList) : null }
                  </ReactCSSTransitionReplace>

                  {qa}
                </div>
              </div>

              <div className='columns'>
                <div className='column is-12'>
                  {this.state.step === 1 ? (step1Text) : this.state.step === 2 ? (step2Text) : (step3Text) }
                </div>
              </div>

              <p>
                <button
                  onClick={this.handlePrimaryButtonClick}
                  className="button is-primary is-outlined is-intro-modal-button"
                >
                  {this.buttonText()}
                </button>
              </p>

              <button
                onClick={this.handlePreviousStep}
                className="button previous-link"
                disabled={this.state.step === 1}
              >
                <FontAwesomeIcon icon={faChevronUp} className="previous-link--icon" />
              </button>

              <button
                onClick={this.handleNextStep}
                className="button next-link"
                disabled={this.state.step === 3}
              >
                <FontAwesomeIcon icon={faChevronUp} className="next-link--icon" />
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
