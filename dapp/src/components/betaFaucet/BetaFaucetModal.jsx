import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
// import ReactCSSTransitionReplace from 'react-css-transition-replace'
import { externalTransactionFinders } from '~/finders/externalTransactionFinders'
import { cacheCall, withSaga, cacheCallValue, contractByName, nextId } from 'saga-genesis'
import { get } from 'lodash'
import { Modal } from '~/components/Modal'
import { TILWFaucetAPI } from '~/components/betaFaucet/TILWFaucetAPI'
import { EthFaucetAPI } from '~/components/betaFaucet/EthFaucetAPI'
import { weiToEther } from '~/utils/weiToEther'

function mapStateToProps (state) {
  const address = get(state, 'sagaGenesis.accounts[0]')

  const workTokenAddress = contractByName(state, 'WorkToken')
  const tilwBalance = cacheCallValue(state, workTokenAddress, 'balanceOf', address)
  const ethBalance = get(state, 'sagaGenesis.ethBalance.balance')
  const betaFaucetModalDismissed = get(state, 'betaFaucet.betaFaucetModalDismissed')
  const manuallyOpened = get(state, 'betaFaucet.manuallyOpened')
  const isOwner = address && (cacheCallValue(state, workTokenAddress, 'owner') === address)
  const betaFaucetAddress = contractByName(state, 'BetaFaucet')
  const hasBeenSentEther = cacheCallValue(state, betaFaucetAddress, 'sentEtherAddresses', address)

  const sendEtherTx = externalTransactionFinders.sendEther(state)
  const sendTILWTx = externalTransactionFinders.sendTILW(state)

  const etherWasDripped = sendEtherTx && (sendEtherTx.inFlight || sendEtherTx.success)
  const tilwWasMinted = sendTILWTx && (sendTILWTx.inFlight || sendTILWTx.success)

  const needsEth = (weiToEther(ethBalance) < 0.1 && !hasBeenSentEther)
  const needsTILW = (weiToEther(tilwBalance) < 0.1)

  const showBetaFaucetModal =
    !betaFaucetModalDismissed &&
    (workTokenAddress !== undefined && betaFaucetAddress !== undefined) &&
    // (hasBeenSentEther === undefined || ethBalance === undefined) &&
    (needsEth || needsTILW || manuallyOpened)

  return {
    address,
    betaFaucetAddress,
    showBetaFaucetModal,
    needsEth,
    needsTILW,
    ethBalance,
    workTokenAddress,
    tilwBalance,
    hasBeenSentEther,
    isOwner,
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
    hideModal: () => {
      dispatch({ type: 'HIDE_BETA_FAUCET_MODAL' })
    },
    dispatchAddExternalTransaction: (transactionId, txType, txHash, call) => {
      dispatch({ type: 'ADD_EXTERNAL_TRANSACTION', transactionId, txType, txHash, call })
    },
    dispatchSagaGenesisTransaction: (transactionId, txType, txHash, call) => {
      dispatch({ type: 'TRANSACTION_HASH', transactionId, txHash, call })
    }
  }
}

export const BetaFaucetModal = connect(mapStateToProps, mapDispatchToProps)(
  withSaga(saga)(
    class _BetaFaucetModal extends Component {
      constructor(props) {
        super(props)
        this.state = {}
      }

      componentDidMount() {
        this.init(this.props)
      }

      componentWillReceiveProps(nextProps) {
        this.init(nextProps)
      }

      init(props) {
        this.setState({ step: this.nextStep(this.state.step, props) })
      }

      nextStep = (step, props) => {
        if (!step) {
          step = 1
        }

        if (step === 1 && (!props.needsEth || props.etherWasDripped)) {
          step = 2
        }

        if (step === 2 && (!props.needsTILW)) {
          step = 3
        }

        if (step > 2) {
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
        e.preventDefault()

        if (this.state.step === -1) {
          this.setState({
            step: null
          }, this.props.hideModal)
        }
      }

      handleMoveToNextStep = (e) => {
        e.preventDefault()
        this.setState({ step: this.nextStep(this.state.step + 1, this.props) })
      }

      render() {
        let content

        const { step } = this.state
        const {
          ethBalance,
          tilwBalance,
          address
        } = this.props

        if (step === 1) {
          content = <EthFaucetAPI
            key="ethFaucet"
            address={address}
            ethBalance={ethBalance}
            addExternalTransaction={this.addExternalTransaction}
            handleMoveToNextStep={this.handleMoveToNextStep} />
        } else if (step === 2) {
          content = <TILWFaucetAPI
            key='tilwFaucet'
            address={address}
            tilwBalance={tilwBalance}
            addExternalTransaction={this.addExternalTransaction}
            handleMoveToNextStep={this.handleMoveToNextStep} />
        } else {
          content = (
            <div>
              <h2>
                You're all set!
              </h2>
              <p>
                There is nothing more to do.
              </p>
              <hr />
              <p>
                <button
                  onClick={this.closeModal}
                  className="button is-light is-text">
                  Close this
                </button>
              </p>
            </div>
          )
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
