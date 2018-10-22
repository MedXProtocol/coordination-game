import React, { Component } from 'react'
import { all } from 'redux-saga/effects'
import { connect } from 'react-redux'
// import ReactCSSTransitionReplace from 'react-css-transition-replace'
import { externalTransactionFinders } from '~/finders/externalTransactionFinders'
import { cacheCall, withSaga, cacheCallValue, contractByName, nextId } from 'saga-genesis'
import { Modal } from 'react-bootstrap'
import get from 'lodash.get'
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
  const betaFaucetAddress = contractByName(state, 'betaFaucetAddress')
  const hasBeenSentEther = cacheCallValue(state, betaFaucetAddress, 'sentAddresses', address)

  const sendEtherTx = externalTransactionFinders.sendEther(state)
  const sendTILWTx = externalTransactionFinders.sendTILW(state)

  const etherWasDripped = sendEtherTx && (sendEtherTx.inFlight || sendEtherTx.success)
  const tilwWasMinted = sendTILWTx && (sendTILWTx.inFlight || sendTILWTx.success)

  const fieldsAreUndefined = hasBeenSentEther === undefined || ethBalance === undefined
  const needsEth = weiToEther(ethBalance) < 0.1 && !hasBeenSentEther
  const needsTILW = weiToEther(tilwBalance) < 0.1

  const showBetaFaucetModal =
    !fieldsAreUndefined &&
    !betaFaucetModalDismissed &&
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
    cacheCall(betaFaucetAddress, 'sentAddresses', address)
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

        if (step === 2 && (!props.needsTILW || props.tilwWasMinted)) {
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

      closeModal = () => {
        this.setState({
          step: null
        }, this.props.hideModal)
      }

      handleMoveToNextStep = (e) => {
        e.preventDefault()
        this.setState({ step: this.nextStep(this.state.step + 1, this.props) })
      }

      render() {
        let content

        let totalSteps = 2

        const { step } = this.state
        const {
          ethBalance,
          tilwBalance,
          address
        } = this.props

        if (!this.props.showBetaFaucetModal) { return null }

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
            <div className="col-xs-12 text-center">
              <br />
              <br />
              <h2 className="header--no-top-margin">
                You're all set!
              </h2>
              <p>
                There is nothing more to do.
              </p>
              <hr />
              <p>
                <a onClick={this.closeModal} className="btn btn-primary">Close this</a>
              </p>
            </div>
          )
        }

        let stepText

        if (step > 0) {
          stepText = (
            <React.Fragment>
              &nbsp;<small>(Step {step} of {totalSteps})</small>
            </React.Fragment>
          )
        }

        return (
          <Modal
            closeModal={this.closeModal}
            showBetaFaucetModal={this.props.showBetaFaucetModal}
            title="Example modal title"
          >
            <div className='has-text-centered'>
              <h5 className="is-size-5">
                To use this demo you will need to use an Ethereum wallet
              </h5>

              <div className="row">
                {content}
              </div>
            </div>
          </Modal>
        );
      }
    }
  )
)
