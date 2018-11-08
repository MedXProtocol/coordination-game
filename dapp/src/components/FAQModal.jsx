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
import UndrawOldDaySvg from '~/assets/img/undraw_old_day_6x25.svg'

function mapStateToProps(state) {
  const address = get(state, 'sagaGenesis.accounts[0]')
  const showFaqModal = (
    retrieveKeyValFromLocalStorage('dontShowFaqModal') !== 'true'
  ) && get(state, 'faqModal.showFaqModal')

  // START beta faucet specific (to avoid opening FAQ when Beta Faucet is open)
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
    showFaqModal,
    workTokenAddress
  }
}

function* faqModalSaga({ workTokenAddress, betaFaucetAddress, address }) {
  if (!workTokenAddress || !betaFaucetAddress || !address) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'owner'),
    cacheCall(betaFaucetAddress, 'sentEtherAddresses', address)
  ])
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchHideFaqModal: () => {
      dispatch({ type: 'HIDE_FAQ_MODAL' })
    }
  }
}

export const FAQModal =
  connect(mapStateToProps, mapDispatchToProps)(
    withSaga(faqModalSaga)(
      class _FAQModal extends Component {

      constructor(props) {
        super(props)

        const modalState = retrieveKeyValFromLocalStorage('dontShowFaqModal') !== 'true'

        this.state = {
          modalState
        }
      }

      handleCloseModal = () => {
        this.setState({
          modalState: false
        })

        this.props.dispatchHideFaqModal()
      }

      componentDidMount() {
        this.determineModalState(this.props)
      }

      componentWillReceiveProps(nextProps) {
        this.determineModalState(nextProps)
      }

      determineModalState(props) {
        if (!isBlank(props.address) && !props.betaFaucetVisible && props.showFaqModal) {
          this.setState({
            modalState: true
          })
        }
      }

      handleDontShow = (e) => {
        e.preventDefault()

        this.handleCloseModal()
        storeKeyValInLocalStorage('dontShowFaqModal', 'true')
      }

      render () {
        return (
          <Modal
            closeModal={this.handleCloseModal}
            modalState={this.state.modalState}
            title="FAQ Modal"
          >
            <div className='has-text-centered'>
              <UndrawOldDaySvg width="260" height="260" />

              <h3 className="is-size-3">
                What is this?
              </h3>

              <p>
                This is a game for incentivizing objective TCRs.
              </p>
              <br />

              <h5 className="is-size-5">
                What is a work contract?
              </h5>
              <p>
                A Work contract is a mechanism that determines who is able to participate as a “Worker” in a cryptoeconomic system. To become an eligible Worker, a user must stake tokens. When a new Job is available, a Worker is selected to complete it.
              </p>

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
