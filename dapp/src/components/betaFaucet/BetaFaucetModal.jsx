import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
import { transactionFinders } from '~/finders/transactionFinders'
import {
  cacheCall,
  cacheCallValue,
  cacheCallValueBigNumber,
  contractByName,
  nextId,
  withSaga
} from 'saga-genesis'
import { get } from 'lodash'
import { Modal } from '~/components/Modal'
import { TEXFaucetAPI } from '~/components/betaFaucet/TEXFaucetAPI'
import { EthFaucetAPI } from '~/components/betaFaucet/EthFaucetAPI'
import { defined } from '~/utils/defined'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const texBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')
  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')
  const step = get(state, 'betaFaucet.step')
  const manuallyOpened = get(state, 'betaFaucet.manuallyOpened')
  const betaFaucetAddress = contractByName(state, 'BetaFaucet')
  const hasBeenSentEther = cacheCallValue(state, betaFaucetAddress, 'sentEtherAddresses', address)

  const sendEtherTx = transactionFinders.findByMethodName(state, 'sendEther')
  const sendTEXTx = transactionFinders.findByMethodName(state, 'sendTEX')

  const etherWasDripped = sendEtherTx && (sendEtherTx.inFlight || sendEtherTx.confirmed)
  const texWasMinted = sendTEXTx && (sendTEXTx.inFlight || sendTEXTx.confirmed)

  const needsEth = (weiToEther(ethBalance) < 0.1 && !hasBeenSentEther)
  const needsTEX = (weiToEther(texBalance) < 100)

  const showBetaFaucetModal =
    !betaFaucetModalDismissed &&
    (
      defined(workTokenAddress) && defined(betaFaucetAddress) &&
      defined(ethBalance) && defined(texBalance)
    ) &&
    (needsEth || needsTEX || manuallyOpened)

  return {
    address,
    betaFaucetAddress,
    step,
    showBetaFaucetModal,
    needsEth,
    needsTEX,
    ethBalance,
    workTokenAddress,
    texBalance,
    hasBeenSentEther,
    etherWasDripped,
    texWasMinted,
    manuallyOpened
  }
}

function* betaFaucetModalSaga({ workTokenAddress, betaFaucetAddress, address }) {
  if (!workTokenAddress || !betaFaucetAddress || !address) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(betaFaucetAddress, 'sentEtherAddresses', address),
    cacheCall(betaFaucetAddress, 'sentTEXAddresses', address)
  ])
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchHideModal: () => {
      dispatch({ type: 'HIDE_BETA_FAUCET_MODAL' })
    },
    dispatchSetBetaFaucetModalStep: (step) => {
      dispatch({ type: 'SET_BETA_FAUCET_MODAL_STEP', step })
    },
    dispatchSagaGenesisStartTx: (transactionId, txType, call) => {
      dispatch({ type: 'SG_START_TRANSACTION', transactionId, txType, call })
    },
    dispatchSagaGenesisTxHash: (transactionId, txHash) => {
      dispatch({ type: 'SG_TRANSACTION_HASH', transactionId, txHash })
    }
  }
}

export const BetaFaucetModal = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(betaFaucetModalSaga)(
    class _BetaFaucetModal extends Component {

      componentWillReceiveProps(nextProps) {
        if (!nextProps.needsEth && nextProps.step === 1) {
          const nextStepNum = this.nextStep(nextProps.step + 1, nextProps)
          this.props.dispatchSetBetaFaucetModalStep(nextStepNum)
        }
      }

      nextStep = (step, props) => {
        if (!step) {
          step = 1
        }

        if (step === 1 && (!props.needsEth || props.etherWasDripped)) {
          step = 2
        }

        if (step === 2 && (!props.needsTEX)) {
          step = -1
        }

        if (step === 3) {
          step = -1
        }

        return step
      }

      sendExternalTransaction = (txType) => {
        const txId = nextId()

        const call = {
          method: txType,
          address: '0x0444d61FE60A855d6f40C21f167B643fD5F17aF3' // junk address for cache invalidator to be happy
        }

        this.props.dispatchSagaGenesisStartTx(txId, txType, call)

        return txId
      }

      closeModal = (e) => {
        if (e) {
          e.preventDefault()
        }
        this.props.dispatchHideModal()
      }

      handleMoveToNextStep = (e) => {
        if (e) {
          e.preventDefault()
          e.persist()
        }

        const nextStepNum = this.nextStep(this.props.step + 1, this.props)
        this.props.dispatchSetBetaFaucetModalStep(nextStepNum)

        if (nextStepNum === -1 || nextStepNum === 3) {
          this.closeModal(e)
        }
      }

      render() {
        let content

        const {
          ethBalance,
          texBalance,
          address,
          step
        } = this.props

        if (step === 1) {
          content = <EthFaucetAPI
            key="ethFaucet"
            address={address}
            ethBalance={ethBalance}
            handleMoveToNextStep={this.handleMoveToNextStep}
            sendExternalTransaction={this.sendExternalTransaction}
            dispatchSagaGenesisTxHash={this.props.dispatchSagaGenesisTxHash}
          />
        } else if (step === 2) {
          content = <TEXFaucetAPI
            key='texFaucet'
            address={address}
            texBalance={texBalance}
            handleMoveToNextStep={this.handleMoveToNextStep}
            sendExternalTransaction={this.sendExternalTransaction}
            dispatchSagaGenesisTxHash={this.props.dispatchSagaGenesisTxHash}
          />
        }

        return (
          <Modal
            closeModal={this.closeModal}
            modalState={this.props.showBetaFaucetModal}
            title="Example modal title"
          >
            <div className='has-text-centered'>
              {content}
            </div>
          </Modal>
        );
      }
    }
  )
)
