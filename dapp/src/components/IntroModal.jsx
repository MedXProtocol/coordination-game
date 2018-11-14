import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { get } from 'lodash'
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
import AInBox from '~/assets/img/a-in-box-5.svg'
import GuyFrame1 from '~/assets/img/guy-frame-1.svg'
import QSpeechBubble from '~/assets/img/q-speech-bubble--2.svg'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const showIntroModal = (
    retrieveKeyValFromLocalStorage('dontShowIntroModal') !== 'true'
  ) && get(state, 'introModal.showIntroModal')

  // START beta faucet specific (to avoid opening Intro Modal when Beta Faucet is open)
  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')

  const betaFaucetAddress = contractByName(state, 'BetaFaucet')
  const hasBeenSentEther = cacheCallValue(state, betaFaucetAddress, 'sentEtherAddresses', address)
  const needsEth = (weiToEther(ethBalance) < 0.1 && !hasBeenSentEther)
  const needsTILW = (weiToEther(tilwBalance) < 100)

  const betaFaucetVisible =
    !betaFaucetModalDismissed &&
    (
      defined(workTokenAddress) && defined(betaFaucetAddress) &&
      defined(ethBalance) && defined(tilwBalance)
    ) &&
    (needsEth || needsTILW)
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
    cacheCall(workTokenAddress, 'owner'),
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

      handleCloseModal = () => {
        this.setState({
          modalState: false
        })

        this.props.dispatchHideIntroModal()
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
            <div className='has-text-centered'>
              <QSpeechBubble width="416" height="155" />
              <AInBox width="300" height="163" />
              <GuyFrame1 width="400" height="400" />

              <p>
                <br />
                <button
                  onClick={this.handleCloseModal}
                  className="button is-primary is-outlined"
                >
                  Cool, thanks! I'd like to play
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
