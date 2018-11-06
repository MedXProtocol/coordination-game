import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
// import ReactCSSTransitionReplace from 'react-css-transition-replace'
import { externalTransactionFinders } from '~/finders/externalTransactionFinders'
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
import { TILWFaucetApi } from '~/components/betaFaucet/TILWFaucetApi'
import { EthFaucetAPI } from '~/components/betaFaucet/EthFaucetAPI'
import { defined } from '~/utils/defined'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValueBigNumber(state, workTokenAddress, 'balanceOf', address)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')
  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')
  const step = get(state, 'betaFaucet.step')
  const manuallyOpened = get(state, 'betaFaucet.manuallyOpened')
  const betaFaucetAddress = contractByName(state, 'BetaFaucet')
  const hasBeenSentEther = cacheCallValue(state, betaFaucetAddress, 'sentEtherAddresses', address)

  const sendEtherTx = externalTransactionFinders.sendEther(state)
  const sendTILWTx = externalTransactionFinders.sendTILW(state)

  const etherWasDripped = sendEtherTx && (sendEtherTx.inFlight || sendEtherTx.success)
  const tilwWasMinted = sendTILWTx && (sendTILWTx.inFlight || sendTILWTx.success)

  const needsEth = (weiToEther(ethBalance) < 0.1 && !hasBeenSentEther)
  const needsTILW = (weiToEther(tilwBalance) < 100)

  const showBetaFaucetModal =
    !betaFaucetModalDismissed &&
    (
      defined(workTokenAddress) && defined(betaFaucetAddress) &&
      defined(ethBalance) && defined(tilwBalance)
    ) &&
    (needsEth || needsTILW || manuallyOpened)

  return {
    address,
    betaFaucetAddress,
    step,
    showBetaFaucetModal,
    needsEth,
    needsTILW,
    ethBalance,
    workTokenAddress,
    tilwBalance,
    hasBeenSentEther,
    etherWasDripped,
    tilwWasMinted,
    manuallyOpened
  }
}

function* saga({ workTokenAddress, betaFaucetAddress, address }) {
  if (!workTokenAddress || !betaFaucetAddress || !address) { return }

  yield all([
    cacheCall(workTokenAddress, 'balanceOf', address),
    cacheCall(workTokenAddress, 'owner'),
    cacheCall(betaFaucetAddress, 'sentEtherAddresses', address),
    cacheCall(betaFaucetAddress, 'sentTILWAddresses', address)
  ])
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchHideModal: () => {
      dispatch({ type: 'HIDE_BETA_FAUCET_MODAL' })
    },
    dispatchAddExternalTransaction: (transactionId, txType, txHash, call) => {
      dispatch({ type: 'ADD_EXTERNAL_TRANSACTION', transactionId, txType, txHash, call })
    },
    dispatchSagaGenesisTransaction: (transactionId, txType, txHash, call) => {
      dispatch({ type: 'TRANSACTION_HASH', transactionId, txHash, call })
    },
    dispatchSetBetaFaucetModalStep: (step) => {
      dispatch({ type: 'SET_BETA_FAUCET_MODAL_STEP', step })
    }
  }
}

export const BetaFaucetModal = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(saga)(
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

        if (step === 2 && (!props.needsTILW)) {
          step = -1
        }

        if (step === 3) {
          step = -1
        }

        return step
      }

      addExternalTransaction = (txType, txHash) => {
        const id = nextId()
        const call = { method: txType, address: '0x0444d61FE60A855d6f40C21f167B643fD5F17aF3' } // junk address for cache invalidator to be happy
        this.props.dispatchAddExternalTransaction(id, txType, txHash, call)
        this.props.dispatchSagaGenesisTransaction(id, txType, txHash, call)
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
          tilwBalance,
          address,
          step
        } = this.props

        if (step === 1) {
          content = <EthFaucetAPI
            key="ethFaucet"
            address={address}
            ethBalance={ethBalance}
            addExternalTransaction={this.addExternalTransaction}
            handleMoveToNextStep={this.handleMoveToNextStep}
          />
        } else if (step === 2) {
          content = <TILWFaucetApi
            key='tilwFaucet'
            address={address}
            tilwBalance={tilwBalance}
            addExternalTransaction={this.addExternalTransaction}
            handleMoveToNextStep={this.handleMoveToNextStep}
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
